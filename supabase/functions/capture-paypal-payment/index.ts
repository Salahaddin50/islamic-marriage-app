import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { order_id, payment_id } = await req.json()

    if (!order_id || !payment_id) {
      return new Response(
        JSON.stringify({ error: 'Order ID and Payment ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the payment record belongs to this user
    const { data: paymentRecord, error: paymentError } = await supabaseClient
      .from('payment_records')
      .select('*')
      .eq('id', payment_id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single()

    if (paymentError || !paymentRecord) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment record' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PayPal configuration
    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID')
    const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')
    const paypalBaseUrl = Deno.env.get('PAYPAL_BASE_URL') || 'https://api-m.sandbox.paypal.com'

    if (!paypalClientId || !paypalClientSecret) {
      return new Response(
        JSON.stringify({ error: 'PayPal configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get PayPal access token
    const authResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    })

    if (!authResponse.ok) {
      console.error('PayPal auth failed:', await authResponse.text())
      return new Response(
        JSON.stringify({ error: 'PayPal authentication failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    // Capture the PayPal order
    const captureResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${order_id}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `capture-${payment_id}-${Date.now()}`, // Idempotency key
      }
    })

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text()
      console.error('PayPal capture failed:', errorText)
      
      // Mark payment as failed
      await supabaseClient
        .from('payment_records')
        .update({
          status: 'failed',
          notes: 'PayPal capture failed',
          server_validated: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment_id)

      return new Response(
        JSON.stringify({ error: 'Payment capture failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const captureData = await captureResponse.json()

    // Update payment record as completed
    const { error: updateError } = await supabaseClient
      .from('payment_records')
      .update({
        status: 'completed',
        transaction_id: captureData.id,
        gateway_response: captureData,
        server_validated: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment_id)

    if (updateError) {
      console.error('Failed to update payment record:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update payment record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Activate user package (if needed)
    try {
      const packageType = paymentRecord.package_type
      if (packageType) {
        // Deactivate any existing active packages
        await supabaseClient
          .from('user_packages')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('is_active', true)

        // Activate new package
        await supabaseClient
          .from('user_packages')
          .insert({
            user_id: user.id,
            package_type: packageType,
            package_name: paymentRecord.package_name,
            amount_paid: paymentRecord.amount,
            is_active: true,
            is_lifetime: true,
            activated_at: new Date().toISOString()
          })
      }
    } catch (packageError) {
      console.error('Package activation error:', packageError)
      // Don't fail the payment, just log the error
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: captureData.id,
        status: 'completed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Capture PayPal payment error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
