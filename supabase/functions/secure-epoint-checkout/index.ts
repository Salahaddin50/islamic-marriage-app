import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function utf8ToBytes(input: string): Uint8Array {
  return new TextEncoder().encode(input)
}

async function sha1Base64(input: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', input)
  const bytes = new Uint8Array(digest)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  // btoa expects binary string
  // deno-lint-ignore no-deprecated-deno-api
  return btoa(binary)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { package_id } = await req.json()
    if (!package_id) {
      return new Response(
        JSON.stringify({ error: 'Package ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Proactively fail any stale pending records for this user to prevent duplicates
    try {
      await supabaseClient
        .from('payment_records')
        .update({ status: 'failed', notes: 'Superseded by new Epoint checkout', updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('status', 'pending');
    } catch {}

    // Create a secure pending payment record and compute upgrade amount
    const { data: paymentData, error: paymentError } = await supabaseClient
      .rpc('create_secure_payment', {
        p_package_id: package_id,
        p_user_id: user.id
      })

    if (paymentError || !paymentData || paymentData.length === 0) {
      return new Response(
        JSON.stringify({ error: paymentError?.message || 'Failed to create secure payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payment = paymentData[0]
    const amount = Number(payment.upgrade_price)
    if (!(amount > 0)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark method as epoint (enum value added via migration)
    await supabaseClient
      .from('payment_records')
      .update({ payment_method: 'epoint' })
      .eq('id', payment.payment_id)
      .eq('user_id', user.id)
      .eq('status', 'pending')

    const publicKey = Deno.env.get('EPOINT_PUBLIC_KEY') || ''
    const privateKey = Deno.env.get('EPOINT_PRIVATE_KEY') || ''
    const apiBase = Deno.env.get('EPOINT_API_BASE') || 'https://epoint.az/api/1'

    if (!publicKey || !privateKey) {
      return new Response(
        JSON.stringify({ error: 'Epoint configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const origin = req.headers.get('origin') || 'https://zawajplus.app'

    // Read package-specific Epoint currency ratio (AZN per 1 USD)
    let ratio = 1.7
    try {
      const { data: pkgRow } = await supabaseClient
        .from('packages')
        .select('epoint_currency')
        .eq('package_id', package_id)
        .maybeSingle()
      const r = Number(pkgRow?.epoint_currency)
      if (r && isFinite(r) && r > 0) ratio = r
    } catch {}
    const aznAmount = Number((amount * ratio).toFixed(2))

    // Build callback URL to Edge Function domain
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '' // e.g. https://xyz.supabase.co
    const fnBase = supabaseUrl.replace('.supabase.co', '.functions.supabase.co')
    const resultUrl = `${fnBase}/epoint-callback`

    const jsonPayload = {
      public_key: publicKey,
      amount: aznAmount,
      currency: 'AZN',
      language: 'en',
      order_id: String(payment.payment_id),
      description: `Payment for ${payment.package_name}`,
      success_redirect_url: `${origin}/payment/success?pid=${encodeURIComponent(payment.payment_id)}`,
      error_redirect_url: `${origin}/payment/error?pid=${encodeURIComponent(payment.payment_id)}`,
      result_url: resultUrl
    }

    const data = btoa(JSON.stringify(jsonPayload))
    const signatureBase = `${privateKey}${data}${privateKey}`
    const signature = await sha1Base64(utf8ToBytes(signatureBase))

    const postBody = new URLSearchParams()
    postBody.set('data', data)
    postBody.set('signature', signature)

    const resp = await fetch(`${apiBase}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: postBody
    })

    if (!resp.ok) {
      const errText = await resp.text()
      await supabaseClient
        .from('payment_records')
        .update({ status: 'failed', notes: `Epoint request failed: ${errText}` })
        .eq('id', payment.payment_id)
      return new Response(
        JSON.stringify({ error: 'Failed to create Epoint request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await resp.json()
    if (result?.status !== 'success' || !result?.redirect_url) {
      await supabaseClient
        .from('payment_records')
        .update({ status: 'failed', notes: 'Epoint API returned non-success' })
        .eq('id', payment.payment_id)
      return new Response(
        JSON.stringify({ error: 'Epoint did not return a redirect URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        payment_id: payment.payment_id,
        package_name: payment.package_name,
        amount_usd: amount,
        amount_azn: aznAmount,
        redirect_url: result.redirect_url,
        transaction: result.transaction
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('secure-epoint-checkout error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


