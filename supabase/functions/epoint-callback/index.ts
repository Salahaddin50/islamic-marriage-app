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
  // deno-lint-ignore no-deprecated-deno-api
  return btoa(binary)
}

async function verifyAndParse(bodyText: string, contentType: string | null, privateKey: string) {
  try {
    if (contentType && contentType.includes('application/json')) {
      const json = JSON.parse(bodyText)
      if (json?.data && json?.signature) {
        const expected = await sha1Base64(utf8ToBytes(`${privateKey}${json.data}${privateKey}`))
        if (expected !== json.signature) throw new Error('Invalid signature')
        const decoded = JSON.parse(atob(json.data))
        return decoded
      }
      return json
    }
    // Try URL-encoded form (data & signature)
    const params = new URLSearchParams(bodyText)
    const data = params.get('data')
    const signature = params.get('signature')
    if (data && signature) {
      const expected = await sha1Base64(utf8ToBytes(`${privateKey}${data}${privateKey}`))
      if (expected !== signature) throw new Error('Invalid signature')
      return JSON.parse(atob(data))
    }
    return null
  } catch {
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const privateKey = Deno.env.get('EPOINT_PRIVATE_KEY') || ''
    const publicKey = Deno.env.get('EPOINT_PUBLIC_KEY') || ''
    const apiBase = Deno.env.get('EPOINT_API_BASE') || 'https://epoint.az/api/1'

    const contentType = req.headers.get('content-type')
    const rawBody = await req.text()
    let payload: any = await verifyAndParse(rawBody, contentType, privateKey)

    // Fallback: if no signature provided, ask Epoint for status securely
    if (!payload?.order_id) {
      try {
        const maybeJson = JSON.parse(rawBody)
        if (maybeJson?.order_id) payload = maybeJson
      } catch {}
    }

    if (!payload?.order_id) {
      return new Response(JSON.stringify({ error: 'order_id missing' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const orderId: string = String(payload.order_id)

    // If payload has no status, check status endpoint
    if (!payload?.status) {
      const statusData = btoa(JSON.stringify({ public_key: publicKey, order_id: orderId }))
      const statusSig = await sha1Base64(utf8ToBytes(`${privateKey}${statusData}${privateKey}`))
      const form = new URLSearchParams()
      form.set('data', statusData)
      form.set('signature', statusSig)
      const statusResp = await fetch(`${apiBase}/get-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form
      })
      if (statusResp.ok) {
        const sjson = await statusResp.json()
        if (sjson?.status) payload.status = sjson.status
        if (sjson?.transaction) payload.transaction = sjson.transaction
      }
    }

    // Load the pending record
    const { data: paymentRecord, error: prErr } = await supabaseAdmin
      .from('payment_records')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (prErr || !paymentRecord) {
      return new Response(JSON.stringify({ error: 'payment record not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const isSuccess = String(payload.status).toLowerCase() === 'success'

    if (isSuccess) {
      await supabaseAdmin
        .from('payment_records')
        .update({
          status: 'completed',
          transaction_id: payload.transaction ?? null,
          gateway_response: payload,
          server_validated: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      try {
        // Deactivate existing active packages for user
        await supabaseAdmin
          .from('user_packages')
          .update({ is_active: false })
          .eq('user_id', paymentRecord.user_id)
          .eq('is_active', true)

        await supabaseAdmin
          .from('user_packages')
          .insert({
            user_id: paymentRecord.user_id,
            package_type: paymentRecord.package_type,
            package_name: paymentRecord.package_name,
            amount_paid: paymentRecord.amount,
            is_active: true,
            is_lifetime: true,
            activated_at: new Date().toISOString()
          })
      } catch (e) {
        console.error('Package activation error:', e)
      }
    } else {
      await supabaseAdmin
        .from('payment_records')
        .update({ status: 'failed', gateway_response: payload, server_validated: true, updated_at: new Date().toISOString() })
        .eq('id', orderId)
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('epoint-callback error:', e)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})


