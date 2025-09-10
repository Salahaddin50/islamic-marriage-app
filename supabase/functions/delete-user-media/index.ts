// Supabase Edge Function: delete-user-media
// Deletes a list of object keys from DigitalOcean Spaces (S3-compatible)
// Request body: { keys: string[] }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.17';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function withConcurrency<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await task(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
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
    const keys = Array.isArray(body?.keys) ? body.keys.filter((k: unknown) => typeof k === 'string' && k.trim().length > 0) : [];

    if (!keys.length) {
      return new Response(JSON.stringify({ success: false, error: 'No keys provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const endpoint = Deno.env.get('DO_SPACES_ENDPOINT'); // e.g. https://lon1.digitaloceanspaces.com
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

    // Build AwsClient for SigV4 signing against S3-compatible endpoint
    const aws = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: 's3',
      region,
    });

    // Compose base URL as virtual-hosted-style: https://{bucket}.{host}
    const host = endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const base = `https://${bucket}.${host}`;

    let deletedTotal = 0;
    const errors: Array<{ Key?: string; Code?: string; Message?: string }> = [];

    await withConcurrency(keys, 8, async (Key) => {
      const url = `${base}/${encodeURI(Key)}`;
      try {
        const res = await aws.fetch(url, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
          deletedTotal += 1;
        } else {
          const text = await res.text().catch(() => '');
          errors.push({ Key, Code: String(res.status), Message: text || res.statusText });
        }
      } catch (e) {
        errors.push({ Key, Code: 'FetchError', Message: String(e?.message || e) });
      }
    });

    const result = { success: true, requested: keys.length, deleted: deletedTotal, errors };
    return new Response(JSON.stringify(result), {
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


