import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function sanitizeChannel(input: string): string {
  // Daily room names: letters, numbers, hyphens. 3-64 chars recommended
  const safe = (input || "").toLowerCase().replace(/[^a-z0-9-]/g, "-")
  return safe.length > 0 ? safe.slice(0, 64) : `room-${Date.now()}`
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    let channel = url.searchParams.get("channel") || ""
    let ttlParam = url.searchParams.get("ttl") || ""

    if (!channel && (req.method === "POST" || req.method === "PUT")) {
      try {
        const body = await req.json()
        channel = body?.channel || channel
        ttlParam = body?.ttl ? String(body.ttl) : ttlParam
      } catch (_) {
        // ignore
      }
    }

    const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY") || ""
    if (!DAILY_API_KEY) {
      return new Response(JSON.stringify({ error: "Server not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (!channel) {
      return new Response(JSON.stringify({ error: "channel is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const roomName = sanitizeChannel(channel)
    const base = "https://api.daily.co/v1"

    // Helper to perform Daily API calls
    async function daily(path: string, init?: RequestInit) {
      const res = await fetch(base + path, {
        ...init,
        headers: {
          "Authorization": `Bearer ${DAILY_API_KEY}`,
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
      })
      return res
    }

    // Try to fetch existing room first
    let getRes = await daily(`/rooms/${roomName}`)
    if (getRes.ok) {
      const data = await getRes.json()
      const props = (data && data.properties) || {}
      const prejoinDisabled = props.enable_prejoin_ui === false
      if (prejoinDisabled) {
        return new Response(JSON.stringify({ url: data?.url, name: data?.name }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }
      // If existing room doesn't match desired config, recreate it
      await daily(`/rooms/${roomName}`, { method: "DELETE" })
    }

    // Create room if not exist
    const exp = Number(ttlParam || "3600") // seconds from creation until room expires
    const createBody = {
      name: roomName,
      privacy: "public", // use "private" + meeting tokens for tighter control if needed
      properties: {
        exp: Math.floor(Date.now() / 1000) + (isFinite(exp) ? exp : 3600),
        enable_screenshare: true,
        enable_prejoin_ui: false, // skip name/pre-call UI
        start_video_off: false,
        start_audio_off: false,
      },
    }

    const createRes = await daily(`/rooms`, { method: "POST", body: JSON.stringify(createBody) })
    if (!createRes.ok) {
      const text = await createRes.text()
      return new Response(JSON.stringify({ error: `Daily API error ${createRes.status}`, details: text }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }
    const created = await createRes.json()
    return new Response(JSON.stringify({ url: created?.url, name: created?.name }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }
})


