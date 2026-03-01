const { z } = require('zod');
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// --- Zod schema ---
const leadSchema = z.object({
  form_type: z.enum(['configurator', 'quote']),
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(7, 'Valid phone number required').max(20),
  email: z.string().email().or(z.literal('')).optional().default(''),
  zip: z.string().min(5, 'ZIP code required').max(10),
  page_path: z.string().optional(),
  inputs: z.record(z.any()).optional().default({}),
  estimate: z.object({
    low: z.number().optional(),
    high: z.number().optional(),
    monthly: z.number().optional(),
  }).optional().default({}),
  _honey: z.string().optional(),
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    // --- Rate limit by IP (10 requests/hour) ---
    const ip = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown')
      .split(',')[0].trim();
    const rateKey = `ratelimit:leads:${ip}`;
    const requests = await redis.incr(rateKey);
    if (requests === 1) await redis.expire(rateKey, 3600);
    if (requests > 10) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // --- Honeypot ---
    if (body._honey) {
      return res.json({ success: true });
    }

    // --- Validate with Zod ---
    const result = leadSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return res.status(400).json({
        error: firstError ? firstError.message : 'Invalid input.',
      });
    }

    const data = result.data;

    // --- Build lead record ---
    const leadId = 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const lead = {
      lead_id: leadId,
      timestamp: new Date().toISOString(),
      page_path: data.page_path || '/steel-buildings',
      form_type: data.form_type,
      name: data.name,
      phone: data.phone,
      email: data.email,
      zip: data.zip,
      inputs: data.inputs,
      estimate: data.estimate,
    };

    // Store individual lead
    await redis.set('lead:' + leadId, JSON.stringify(lead));
    // Push ID to ordered list
    await redis.lpush('leads:all', leadId);

    // --- Also store in existing submissions list (admin panel compat) ---
    const submissions = (await redis.get('submissions')) || [];
    const parsed = Array.isArray(submissions) ? submissions : [];
    const nextId = await redis.incr('next_submission_id');

    const buildingDetails = data.inputs || {};
    const estimate = data.estimate || {};

    parsed.unshift({
      id: nextId,
      type: data.form_type === 'configurator' ? 'configurator' : 'quote',
      status: 'new',
      name: data.name,
      phone: data.phone,
      email: data.email,
      zip: data.zip,
      building_type: buildingDetails.buildingType || '',
      building_size: buildingDetails.width && buildingDetails.length
        ? buildingDetails.width + 'x' + buildingDetails.length + 'x' + (buildingDetails.height || '')
        : '',
      notes: 'Estimate: $' + (estimate.low || '?') + '-$' + (estimate.high || '?')
        + ' | ' + JSON.stringify(buildingDetails),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await redis.set('submissions', JSON.stringify(parsed));

    // --- Email notification (fire-and-forget) ---
    try {
      await fetch('https://formsubmit.co/ajax/info@nflbuildingsolutions.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: data.form_type === 'configurator'
            ? 'New Metal Building Price Request'
            : 'New Steel Building Quote Request',
          _template: 'table',
          Name: data.name,
          Phone: data.phone,
          Email: data.email || 'Not provided',
          'ZIP Code': data.zip,
          'Building Type': buildingDetails.buildingType || 'N/A',
          Size: buildingDetails.width
            ? buildingDetails.width + "' x " + buildingDetails.length + "' x " + (buildingDetails.height || 8) + "'"
            : 'N/A',
          'Roof Style': buildingDetails.roofStyle || 'N/A',
          Enclosure: buildingDetails.enclosure || 'N/A',
          'Estimated Price': estimate.low
            ? '$' + Number(estimate.low).toLocaleString() + ' - $' + Number(estimate.high).toLocaleString()
            : 'N/A',
          'Monthly Payment': estimate.monthly ? '$' + estimate.monthly + '/mo' : 'N/A',
          Source: 'Steel Buildings Configurator Page',
        }),
      });
    } catch (emailErr) {
      console.error('Email notification error:', emailErr.message);
    }

    return res.json({ success: true, lead_id: leadId });
  } catch (err) {
    console.error('Leads API error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
