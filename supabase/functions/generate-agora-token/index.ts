import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Tiny token generator for Agora RTC tokens (Deno/Supabase Edge Function)
// Uses simple AccessToken2 implementation embedded to avoid dependencies

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// AccessToken2 minimal implementation for rtc
// Reference: https://docs.agora.io/en/video-calling/reference/rtm_rtc_token?platform=web

// Utility functions
function packUint32(value: number): Uint8Array {
  const buf = new Uint8Array(4)
  const view = new DataView(buf.buffer)
  view.setUint32(0, value, true)
  return buf
}

function encodeString(str: string): Uint8Array {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str)
  const len = packUint32(bytes.length)
  const out = new Uint8Array(len.length + bytes.length)
  out.set(len, 0)
  out.set(bytes, len.length)
  return out
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const a of arrays) { out.set(a, off); off += a.length }
  return out
}

// HMAC-SHA256 (Deno built-in subtle)
async function hmacSHA256(key: string, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, message)
  return new Uint8Array(sig)
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

// Build token for RTC (uid can be number or string; we will use 0 for dynamic)
async function buildRtcToken(appId: string, appCert: string, channel: string, uid: number, expireSeconds: number): Promise<string> {
  const version = '007'
  const ts = Math.floor(Date.now() / 1000)
  const salt = Math.floor(Math.random() * 0xFFFFFFFF)
  const expire = expireSeconds

  // Service: RTC (type 1)
  const serviceType = new Uint8Array([1])
  const service = concat(
    serviceType,
    encodeString(channel),
    packUint32(uid),
    packUint32(expire),
  )

  // Message to sign: appId + ts + salt + service
  const appIdBytes = new TextEncoder().encode(appId)
  const tsBytes = packUint32(ts)
  const saltBytes = packUint32(salt)
  const message = concat(appIdBytes, tsBytes, saltBytes, service)
  const signature = await hmacSHA256(appCert, message)

  // Combine: signature + appId + ts + salt + service
  const content = concat(
    encodeString(String.fromCharCode(...signature)),
    appIdBytes,
    tsBytes,
    saltBytes,
    service,
  )

  return `${version}${appId}${bytesToBase64(content)}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Note: This is a public endpoint for token generation
    // No auth required since tokens are short-lived and channel-specific
    const url = new URL(req.url)

    // Allow both GET (query params) and POST (JSON body)
    let channel = url.searchParams.get('channel') || ''
    let uidParam = url.searchParams.get('uid') || ''
    let ttlParam = url.searchParams.get('ttl') || ''

    if ((!channel || !uidParam || !ttlParam) && (req.method === 'POST' || req.method === 'PUT')) {
      try {
        const body = await req.json()
        channel = channel || body?.channel || ''
        uidParam = uidParam || String(body?.uid ?? '')
        ttlParam = ttlParam || String(body?.ttl ?? '')
      } catch (_) {
        // ignore JSON parse, fallback to query only
      }
    }

    const appId = Deno.env.get('AGORA_APP_ID') ?? ''
    const appCert = Deno.env.get('AGORA_APP_CERTIFICATE') ?? ''
    const ttl = Number(ttlParam || '3600')

    if (!channel) {
      return new Response(JSON.stringify({ error: 'channel is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!appId || !appCert) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const numericUid = uidParam ? Number(uidParam) : 0
    const token = await buildRtcToken(appId, appCert, channel, isFinite(numericUid) ? numericUid : 0, ttl)

    return new Response(JSON.stringify({ token }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})


