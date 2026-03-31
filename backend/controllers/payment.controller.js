const https = require('https');

const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CURRENCY = process.env.PAYPAL_CURRENCY || 'USD';
const TAX_RATE = 0.15;

function roundCurrency(value) {
  return Number(value.toFixed(2));
}

function formatCurrency(value) {
  return roundCurrency(value).toFixed(2);
}

function sanitizeCartItems(items = []) {
  return items
    .filter(item => item && item.name && Number(item.quantity) > 0 && Number(item.price) >= 0)
    .map(item => ({
      name: String(item.name).trim(),
      quantity: Number(item.quantity),
      price: roundCurrency(Number(item.price))
    }));
}

function buildAmountBreakdown(items, deliveryFee) {
  const grossItemsTotal = roundCurrency(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  const taxIncluded = roundCurrency(grossItemsTotal - grossItemsTotal / (1 + TAX_RATE));
  const netItemsTotal = roundCurrency(grossItemsTotal - taxIncluded);
  const shipping = roundCurrency(deliveryFee);
  const total = roundCurrency(grossItemsTotal + shipping);

  return {
    grossItemsTotal,
    netItemsTotal,
    taxIncluded,
    shipping,
    total
  };
}

function paypalRequest(path, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, PAYPAL_BASE_URL);
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;

    const request = https.request(url, {
      method,
      headers: {
        ...headers,
        ...(payload
          ? {
              'Content-Length': Buffer.byteLength(payload)
            }
          : {})
      }
    }, response => {
      let raw = '';

      response.on('data', chunk => {
        raw += chunk;
      });

      response.on('end', () => {
        let data = {};

        if (raw) {
          try {
            data = JSON.parse(raw);
          } catch {
            data = { message: raw };
          }
        }

        resolve({
          ok: response.statusCode >= 200 && response.statusCode < 300,
          status: response.statusCode || 500,
          data
        });
      });
    });

    request.on('error', reject);

    if (payload) {
      request.write(payload);
    }

    request.end();
  });
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are missing.');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await paypalRequest('/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Unable to get PayPal access token: ${response.data.message || 'Unknown PayPal error.'}`);
  }

  return response.data.access_token;
}

async function getPayPalConfig(req, res) {
  res.json({
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    currency: PAYPAL_CURRENCY,
    taxRate: TAX_RATE
  });
}

async function createPayPalOrder(req, res) {
  try {
    const items = sanitizeCartItems(req.body.items);
    const deliveryFee = Number(req.body.deliveryFee || 0);

    if (!items.length) {
      return res.status(400).json({ message: 'Cart items are required.' });
    }

    const amount = buildAmountBreakdown(items, deliveryFee);
    const accessToken = await getPayPalAccessToken();

    const response = await paypalRequest('/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: {
        intent: 'CAPTURE',
        purchase_units: [
          {
            description: 'Dias Fragrance checkout',
            amount: {
              currency_code: PAYPAL_CURRENCY,
              value: formatCurrency(amount.total),
              breakdown: {
                item_total: {
                  currency_code: PAYPAL_CURRENCY,
                  value: formatCurrency(amount.netItemsTotal)
                },
                tax_total: {
                  currency_code: PAYPAL_CURRENCY,
                  value: formatCurrency(amount.taxIncluded)
                },
                shipping: {
                  currency_code: PAYPAL_CURRENCY,
                  value: formatCurrency(amount.shipping)
                }
              }
            }
          }
        ]
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        message: response.data.message || 'Unable to create PayPal order.',
        details: response.data.details || []
      });
    }

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to create PayPal order.' });
  }
}

async function capturePayPalOrder(req, res) {
  try {
    const accessToken = await getPayPalAccessToken();
    const response = await paypalRequest(`/v2/checkout/orders/${req.params.orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        message: response.data.message || 'Unable to capture PayPal order.',
        details: response.data.details || []
      });
    }

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to capture PayPal order.' });
  }
}

module.exports = {
  TAX_RATE,
  getPayPalConfig,
  createPayPalOrder,
  capturePayPalOrder
};
