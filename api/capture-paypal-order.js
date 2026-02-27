async function getPayPalAccessToken() {
  var clientId = process.env.PAYPAL_CLIENT_ID;
  var secret = process.env.PAYPAL_CLIENT_SECRET;
  var base = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

  var res = await fetch(base + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  var data = await res.json();
  return data.access_token;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Payment processing is not configured yet.' });
  }

  try {
    var orderId = req.body.orderId;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing order ID.' });
    }

    var base = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
    var token = await getPayPalAccessToken();

    var captureRes = await fetch(base + '/v2/checkout/orders/' + orderId + '/capture', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
    });

    var capture = await captureRes.json();

    if (capture.status === 'COMPLETED') {
      res.json({ success: true, id: capture.id });
    } else {
      console.error('PayPal capture issue:', JSON.stringify(capture));
      res.status(400).json({ error: 'Payment was not completed.' });
    }
  } catch (err) {
    console.error('PayPal capture error:', err.message);
    res.status(500).json({ error: 'Could not capture payment.' });
  }
};
