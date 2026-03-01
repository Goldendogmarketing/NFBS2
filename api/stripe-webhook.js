const { Redis } = require('@upstash/redis');
const Stripe = require('stripe');

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Disable Vercel's automatic body parsing for webhook signature verification
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

function getRawBody(req) {
  return new Promise(function(resolve, reject) {
    var chunks = [];
    req.on('data', function(chunk) { chunks.push(chunk); });
    req.on('end', function() { resolve(Buffer.concat(chunks)); });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error('Failed to read raw body:', err);
    return res.status(400).json({ error: 'Failed to read request body' });
  }

  var sig = req.headers['stripe-signature'];
  var event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  if (event.type === 'checkout.session.completed') {
    var session = event.data.object;
    var leadId = session.metadata && session.metadata.lead_id;
    var sessionId = session.id;

    if (!leadId) {
      console.error('Webhook: No lead_id in session metadata');
      return res.json({ received: true });
    }

    try {
      // 1. Update payment record (idempotent check)
      var paymentKey = 'payment:' + sessionId;
      var paymentRaw = await redis.get(paymentKey);
      var payment = paymentRaw
        ? (typeof paymentRaw === 'string' ? JSON.parse(paymentRaw) : paymentRaw)
        : null;

      if (payment && payment.status === 'paid') {
        // Already processed — idempotent
        return res.json({ received: true });
      }

      var paidAt = new Date().toISOString();

      if (payment) {
        payment.status = 'paid';
        payment.paid_at = paidAt;
        payment.stripe_payment_intent = session.payment_intent || null;
        await redis.set(paymentKey, JSON.stringify(payment));
      }

      // 2. Update lead record with deposit info
      var leadKey = 'lead:' + leadId;
      var leadRaw = await redis.get(leadKey);
      if (leadRaw) {
        var lead = typeof leadRaw === 'string' ? JSON.parse(leadRaw) : leadRaw;
        lead.deposit = {
          amount_cents: payment ? payment.deposit_cents : parseInt(session.metadata.deposit_cents || '0'),
          percent: payment ? payment.deposit_percent : parseInt(session.metadata.deposit_percent || '0'),
          status: 'paid',
          stripe_session_id: sessionId,
          stripe_payment_intent: session.payment_intent || null,
          paid_at: paidAt,
        };
        await redis.set(leadKey, JSON.stringify(lead));

        // 3. Update submissions list entry
        var submissions = await redis.get('submissions');
        if (submissions) {
          var parsed = Array.isArray(submissions) ? submissions
            : (typeof submissions === 'string' ? JSON.parse(submissions) : []);

          // Find matching submission by lead notes content or timestamp proximity
          for (var i = 0; i < parsed.length; i++) {
            if (parsed[i].notes && parsed[i].notes.indexOf(leadId) !== -1) {
              parsed[i].notes = 'DEPOSIT PAID: $' + Math.round((lead.deposit.amount_cents || 0) / 100) + ' | ' + parsed[i].notes;
              break;
            }
            // Fallback: match by name + phone + close timestamp
            if (parsed[i].name === lead.name && parsed[i].phone === lead.phone) {
              parsed[i].notes = 'DEPOSIT PAID: $' + Math.round((lead.deposit.amount_cents || 0) / 100) + ' | ' + (parsed[i].notes || '');
              break;
            }
          }
          await redis.set('submissions', JSON.stringify(parsed));
        }

        // 4. Send confirmation email
        var depositDollars = Math.round((lead.deposit.amount_cents || 0) / 100);
        try {
          await fetch('https://formsubmit.co/ajax/info@nflbuildingsolutions.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              _subject: 'DEPOSIT PAID — New Metal Building Order Started',
              _template: 'table',
              Name: lead.name || 'N/A',
              Phone: lead.phone || 'N/A',
              Email: lead.email || 'Not provided',
              'ZIP Code': lead.zip || 'N/A',
              'Deposit Paid': '$' + depositDollars,
              'Deposit Percent': lead.deposit.percent + '%',
              'Estimated Total': '$' + (lead.estimate && lead.estimate.low ? lead.estimate.low.toLocaleString() : 'N/A'),
              'Building Type': (lead.inputs && lead.inputs.buildingType) || 'N/A',
              Size: lead.inputs && lead.inputs.width
                ? lead.inputs.width + "' x " + lead.inputs.length + "' x " + (lead.inputs.height || 8) + "'"
                : 'N/A',
              'Roof Style': (lead.inputs && lead.inputs.roofStyle) || 'N/A',
              'Stripe Session': sessionId,
              Source: 'Steel Buildings Deposit Payment',
            }),
          });
        } catch (emailErr) {
          console.error('Deposit email notification error:', emailErr.message);
        }
      }
    } catch (err) {
      console.error('Webhook processing error:', err);
      // Still return 200 to prevent Stripe from retrying endlessly
    }
  }

  return res.json({ received: true });
};
