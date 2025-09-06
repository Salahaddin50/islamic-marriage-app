import { createClient } from '@supabase/supabase-js';

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const PRICE_BY_ID: Record<string, number> = {
  premium: 0.5, // set to 0.5 for testing; adjust for production
  vip_premium: 200,
  golden_premium: 500,
};

async function getPaypalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal token error: ${res.status}`);
  const json = await res.json();
  return json.access_token as string;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) return res.status(500).json({ error: 'Missing PayPal credentials' });
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) return res.status(500).json({ error: 'Missing Supabase env' });

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Missing auth token' });

    // Verify user from token
    const supabaseUserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes, error: userErr } = await supabaseUserClient.auth.getUser();
    if (userErr || !userRes?.user) return res.status(401).json({ error: 'Invalid token' });
    const userId = userRes.user.id;

    const { pkg } = (req.body || {}) as { pkg?: string };
    if (!pkg || !PRICE_BY_ID[pkg]) return res.status(400).json({ error: 'Invalid package' });

    // Compute baseline from current active package
    const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: active } = await supabaseService
      .from('user_packages')
      .select('package_type')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    const baselinePrice = active?.package_type ? (PRICE_BY_ID[active.package_type] || 0) : 0;
    const targetPrice = PRICE_BY_ID[pkg];
    const amount = Math.max(targetPrice - baselinePrice, 0);
    const value = amount.toFixed(2);

    const accessToken = await getPaypalAccessToken();
    const createRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          { amount: { currency_code: 'USD', value } }
        ],
        application_context: { shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW', brand_name: 'Hume' },
      }),
    });
    if (!createRes.ok) {
      const t = await createRes.text();
      return res.status(500).json({ error: `PayPal create failed: ${t}` });
    }
    const order = await createRes.json();
    return res.status(200).json({ orderID: order.id, amount: value });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}


