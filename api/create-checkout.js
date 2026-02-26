const Stripe = require('stripe');
const { createSubmission } = require('../lib/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Payment processing is not configured yet. Please call (904) 495-2325 to place your order.' });
  }

  try {
    const { amount, total, config, name, email, phone, zip } = req.body;

    if (!amount || !name || !email) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Save submission to Redis so the lead isn't lost
    await createSubmission({
      type: 'deposit',
      name: name,
      email: email,
      phone: phone || '',
      zip: zip || '',
      building_type: config || '',
      notes: 'Deposit: $' + amount + ' | Est Total: $' + total + ' | Config: ' + config
    });

    // Create Stripe Checkout Session
    const origin = req.headers.origin || req.headers.referer || 'https://nfbs-2.vercel.app';
    const baseUrl = origin.replace(/\/$/, '');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Steel Building Deposit',
            description: config + ' | Customer: ' + name + ' | ' + phone,
          },
          unit_amount: amount * 100, // Stripe uses cents
        },
        quantity: 1,
      }],
      metadata: {
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        customer_zip: zip,
        building_config: config,
        estimated_total: String(total),
        deposit_amount: String(amount),
      },
      success_url: baseUrl + '/deposit-success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: baseUrl + '/steel-buildings.html',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err.message);
    res.status(500).json({ error: 'Could not create checkout session.' });
  }
};
