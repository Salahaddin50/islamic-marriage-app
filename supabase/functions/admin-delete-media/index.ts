import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.17';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractKeyFromUrl(url?: string | null): string | null {
  try {
    if (!url) return null;
    const u = new URL(url);
    const path = (u.pathname || '').replace(/^\//, '');
    return path || null;
  } catch {
    return null;
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const mediaId = String(body?.mediaId || '').trim();
    if (!mediaId) {
      return new Response(JSON.stringify({ success: false, error: 'mediaId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Supabase service configuration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Load media row
    const mediaRes = await fetch(`${SUPABASE_URL}/rest/v1/media_references?id=eq.${encodeURIComponent(mediaId)}&select=id,external_url,thumbnail_url`, {
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      }
    });
    if (!mediaRes.ok) {
      const text = await mediaRes.text().catch(() => '');
      return new Response(JSON.stringify({ success: false, error: `Failed to load media: ${mediaRes.status} ${text}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    const rows = await mediaRes.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Media not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    const media = rows[0] as { external_url?: string; thumbnail_url?: string };

    // Prepare Spaces client
    const endpoint = Deno.env.get('DO_SPACES_ENDPOINT');
    const accessKeyId = Deno.env.get('DO_SPACES_KEY');
    const secretAccessKey = Deno.env.get('DO_SPACES_SECRET');
    const region = Deno.env.get('DO_SPACES_REGION') ?? 'nyc3';
    const bucket = Deno.env.get('DO_SPACES_NAME');

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      return new Response(JSON.stringify({ success: false, error: 'Missing DigitalOcean Spaces configuration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const aws = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region });
    const host = endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const base = `https://${bucket}.${host}`;

    const keys: string[] = [];
    const k1 = extractKeyFromUrl(media.external_url);
    const k2 = extractKeyFromUrl(media.thumbnail_url);
    if (k1) keys.push(k1);
    if (k2) keys.push(k2);

    const errors: Array<{ Key: string; Status?: number; Message?: string }> = [];
    for (const Key of keys) {
      try {
        const url = `${base}/${encodeURI(Key)}`;
        const del = await aws.fetch(url, { method: 'DELETE' });
        if (!del.ok && del.status !== 204 && del.status !== 404) {
          const text = await del.text().catch(() => '');
          errors.push({ Key, Status: del.status, Message: text || del.statusText });
        }
      } catch (e) {
        errors.push({ Key, Message: String(e?.message || e) });
      }
    }

    // Delete DB row regardless of storage outcome
    const delDb = await fetch(`${SUPABASE_URL}/rest/v1/media_references?id=eq.${encodeURIComponent(mediaId)}`, {
      method: 'DELETE',
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        'Content-Type': 'application/json'
      }
    });
    if (!delDb.ok) {
      const text = await delDb.text().catch(() => '');
      return new Response(JSON.stringify({ success: false, error: `DB delete failed: ${delDb.status} ${text}`, errors }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, errors }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error?.message || error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});


