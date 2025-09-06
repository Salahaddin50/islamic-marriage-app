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

    const { orderID, pkg } = (req.body || {}) as { orderID?: string; pkg?: string };
    if (!orderID) return res.status(400).json({ error: 'Missing orderID' });
    if (!pkg || !PRICE_BY_ID[pkg]) return res.status(400).json({ error: 'Invalid package' });

    // Compute expected amount again
    const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: active } = await supabaseService
      .from('user_packages')
      .select('package_type')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    const baselinePrice = active?.package_type ? (PRICE_BY_ID[active.package_type] || 0) : 0;
    const targetPrice = PRICE_BY_ID[pkg];
    const expectedAmount = Math.max(targetPrice - baselinePrice, 0);
    const expectedValue = expectedAmount.toFixed(2);

    const accessToken = await getPaypalAccessToken();
    const capRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!capRes.ok) {
      const t = await capRes.text();
      return res.status(500).json({ error: `PayPal capture failed: ${t}` });
    }
    const capture = await capRes.json();

    const status = capture?.status || capture?.purchase_units?.[0]?.payments?.captures?.[0]?.status;
    const amountObj = capture?.purchase_units?.[0]?.amount || capture?.purchase_units?.[0]?.payments?.captures?.[0]?.amount;
    const paidValue = amountObj?.value;
    const paidCurrency = amountObj?.currency_code;

    if (!(status === 'COMPLETED' || status === 'CAPTURED')) {
      return res.status(400).json({ error: 'Payment not completed' });
    }
    if (paidCurrency !== 'USD' || String(paidValue) !== expectedValue) {
      return res.status(400).json({ error: 'Amount or currency mismatch' });
    }

    const transactionId = capture?.id || capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id || '';

    // Record completed payment via service role
    const packageName = pkg === 'premium' ? 'Premium' : pkg === 'vip_premium' ? 'VIP Premium' : 'Golden Premium';
    const paymentDetails = {
      type: baselinePrice > 0 && targetPrice > baselinePrice ? 'upgrade' : 'purchase',
      previous_package: active?.package_type || null,
      target_package: pkg,
      baseline_price: baselinePrice,
      target_price: targetPrice,
      difference_paid: expectedAmount,
      timestamp: new Date().toISOString(),
    };
    await supabaseService.from('payment_records').insert({
      user_id: userId,
      package_name: packageName,
      package_type: pkg,
      amount: expectedAmount,
      status: 'completed',
      payment_method: 'paypal',
      transaction_id: transactionId,
      gateway_response: capture,
      payment_details: paymentDetails,
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}


