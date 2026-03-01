const { Redis } = require('@upstash/redis');
const Stripe = require('stripe');

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function calculateDeposit(estimateLow) {
  var percent = estimateLow < 4000 ? 0.11 : 0.16;
  return {
    cents: Math.round(estimateLow * percent * 100),
    percent: estimateLow < 4000 ? 11 : 16,
    dollars: Math.round(estimateLow * percent),
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    var body = req.body;

    if (!body.lead_id || typeof body.lead_id !== 'string') {
      return res.status(400).json({ error: 'lead_id is required.' });
    }

    // Fetch lead from Redis
    var leadRaw = await redis.get('lead:' + body.lead_id);
    if (!leadRaw) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    var lead = typeof leadRaw === 'string' ? JSON.parse(leadRaw) : leadRaw;

    // Check if deposit already paid
    if (lead.deposit && lead.deposit.status === 'paid') {
      return res.status(400).json({ error: 'Deposit has already been paid for this order.' });
    }

    // Validate estimate exists
    if (!lead.estimate || !lead.estimate.low || lead.estimate.low <= 0) {
      return res.status(400).json({ error: 'This lead has no valid price estimate.' });
    }

    // Calculate deposit server-side (source of truth)
    var deposit = calculateDeposit(lead.estimate.low);

    // Build description from lead inputs
    var inputs = lead.inputs || {};
    var description = [
      inputs.buildingType ? inputs.buildingType.charAt(0).toUpperCase() + inputs.buildingType.slice(1) : 'Building',
      inputs.width && inputs.length ? inputs.width + "' x " + inputs.length + "'" : '',
      inputs.roofStyle ? inputs.roofStyle.charAt(0).toUpperCase() + inputs.roofStyle.slice(1) + ' roof' : '',
    ].filter(Boolean).join(' — ');

    // Determine base URL for redirects
    var baseUrl = process.env.SITE_URL || 'https://nflbuildingsolutions.com';

    // Create Stripe Checkout Session
    var session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Metal Building Deposit (' + deposit.percent + '%)',
            description: description + ' — Estimated total: $' + lead.estimate.low.toLocaleString(),
          },
          unit_amount: deposit.cents,
        },
        quantity: 1,
      }],
      metadata: {
        lead_id: body.lead_id,
        deposit_cents: String(deposit.cents),
        deposit_percent: String(deposit.percent),
        estimate_low: String(lead.estimate.low),
        estimate_high: String(lead.estimate.high),
        customer_name: lead.name || '',
        customer_phone: lead.phone || '',
      },
      customer_email: lead.email || undefined,
      success_url: baseUrl + '/steel-buildings.html?payment=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: baseUrl + '/steel-buildings.html?payment=cancelled',
    });

    // Store pending payment record in Redis
    await redis.set('payment:' + session.id, JSON.stringify({
      session_id: session.id,
      lead_id: body.lead_id,
      deposit_cents: deposit.cents,
      deposit_percent: deposit.percent,
      status: 'pending',
      created_at: new Date().toISOString(),
      paid_at: null,
      stripe_payment_intent: null,
    }));

    return res.json({ url: session.url });
  } catch (err) {
    console.error('Create checkout error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session. Please try again or call us.' });
  }
};
