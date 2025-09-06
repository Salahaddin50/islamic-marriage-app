
type PackageId = 'premium' | 'vip_premium' | 'golden_premium';

const PACKAGE_PRICES_USD: Record<PackageId, number> = {
  premium: 0.5, // Keep in sync with app pricing while testing
  vip_premium: 200,
  golden_premium: 500,
};

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

    const { pkg, previous_package } = (req.body || {}) as {
      pkg?: PackageId;
      previous_package?: PackageId | '' | null;
    };

    if (!pkg || !(pkg in PACKAGE_PRICES_USD)) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    const targetPrice = PACKAGE_PRICES_USD[pkg];
    let amount = targetPrice;

    if (previous_package) {
      if (!(previous_package in PACKAGE_PRICES_USD)) {
        return res.status(400).json({ error: 'Invalid previous package' });
      }
      const baseline = PACKAGE_PRICES_USD[previous_package as PackageId];
      const diff = Number((targetPrice - baseline).toFixed(2));
      if (diff <= 0) {
        return res.status(400).json({ error: 'Invalid upgrade path or non-positive difference' });
      }
      amount = diff;
    }

    const accessToken = await getAccessToken();
    const base = getPayPalBaseUrl();

    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: amount.toFixed(2),
            },
          },
        ],
        application_context: {
          shipping_preference: 'NO_SHIPPING',
          locale: 'en_SA',
        },
      }),
    });

    if (!orderRes.ok) {
      const t = await orderRes.text();
      return res.status(502).json({ error: 'Failed to create order', details: t });
    }

    const order = await orderRes.json();
    return res.status(200).json({ orderID: order.id, amount: amount.toFixed(2) });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}


