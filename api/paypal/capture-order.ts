
function getPayPalBaseUrl(): string {
  const env = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase();
  return env === 'live' || env === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const secret = process.env.PAYPAL_SECRET || '';
  if (!clientId || !secret) throw new Error('Missing PayPal credentials');
  const base = getPayPalBaseUrl();
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to get token: ${res.status} ${t}`);
  }
  const json = await res.json();
  return json.access_token as string;
}

export default async function handler(req: any, res: any) {
  try {
    // Basic CORS support for dev (Expo web on a different port)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { orderID } = (req.body || {}) as { orderID?: string };
    if (!orderID) return res.status(400).json({ error: 'Missing orderID' });

    const accessToken = await getAccessToken();
    const base = getPayPalBaseUrl();

    const capRes = await fetch(`${base}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const json = await capRes.json();
    if (!capRes.ok) {
      return res.status(502).json({ error: 'Failed to capture order', details: json });
    }

    // Extract amount and status for validation
    const unit = json?.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];
    const amount = capture?.amount?.value;
    const currency = capture?.amount?.currency_code;
    const status = capture?.status;

    return res.status(200).json({
      id: json?.id,
      status,
      amount,
      currency,
      raw: json,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}


