// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function base64UrlEncode(data: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i])
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
}

async function hmacSHA256(secret: string, input: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input))
  return base64UrlEncode(new Uint8Array(sig))
}

function encode(obj: Record<string, unknown>): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(obj)))
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    let room = url.searchParams.get("room") || ""
    let name = url.searchParams.get("name") || "Guest"
    let email = url.searchParams.get("email") || ""
    let ttlParam = url.searchParams.get("ttl") || "3600"

    if ((!room || !name) && (req.method === "POST" || req.method === "PUT")) {
      try {
        const body = await req.json()
        room = room || String(body?.room || "")
        name = name || String(body?.name || "Guest")
        email = email || String(body?.email || "")
        ttlParam = String(body?.ttl || ttlParam)
      } catch (_) {}
    }

    const JAAS_APP_ID = Deno.env.get("JAAS_APP_ID") || ""
    const JAAS_API_KEY_ID = Deno.env.get("JAAS_API_KEY_ID") || ""
    const JAAS_API_KEY_SECRET = Deno.env.get("JAAS_API_KEY_SECRET") || ""

    if (!room) {
      return new Response(JSON.stringify({ error: "room is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }
    if (!JAAS_APP_ID || !JAAS_API_KEY_ID || !JAAS_API_KEY_SECRET) {
      return new Response(JSON.stringify({ error: "Server not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const now = Math.floor(Date.now() / 1000)
    const exp = now + Number(ttlParam || "3600")

    const header = { alg: "HS256", typ: "JWT", kid: JAAS_API_KEY_ID }

    const payload: Record<string, unknown> = {
      aud: "jitsi",
      iss: "chat",
      sub: JAAS_APP_ID,
      room: room,
      nbf: now - 10,
      exp,
      context: {
        user: {
          name,
          email,
          moderator: true,
        },
      },
    }

    const unsigned = `${encode(header)}.${encode(payload)}`
    const signature = await hmacSHA256(JAAS_API_KEY_SECRET, unsigned)
    const token = `${unsigned}.${signature}`

    return new Response(JSON.stringify({ token, tenant: JAAS_APP_ID }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }
})


