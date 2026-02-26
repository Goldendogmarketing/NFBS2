const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async function handler(req, res) {
  // Protect with a secret
  const secret = req.query.secret || (req.body && req.body.secret);
  if (!secret || secret !== process.env.SEED_SECRET) {
    return res.status(403).json({ error: 'Invalid seed secret.' });
  }

  // POST - reset admin password
  if (req.method === 'POST') {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    try {
      const hash = bcrypt.hashSync(password, 10);
      await redis.set('admin_user', { username: username, password_hash: hash });
      return res.json({ success: true, message: 'Admin credentials updated.' });
    } catch (err) {
      return res.status(500).json({ error: 'Reset failed: ' + err.message });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if already seeded
    const existing = await redis.get('sheds');
    if (existing && existing.length > 0) {
      return res.json({ message: 'Already seeded.', sheds: existing.length });
    }

    // Read existing JSON data files
    const rtoPath = path.join(process.cwd(), 'data', 'sheds.json');
    const buyPath = path.join(process.cwd(), 'data', 'sheds-for-sale.json');

    let rtoSheds = [];
    let buySheds = [];

    if (fs.existsSync(rtoPath)) {
      rtoSheds = JSON.parse(fs.readFileSync(rtoPath, 'utf8')).sheds || [];
    }
    if (fs.existsSync(buyPath)) {
      buySheds = JSON.parse(fs.readFileSync(buyPath, 'utf8')).sheds || [];
    }

    // Merge sheds (same logic as cms/db.js seedFromExistingData)
    const shedMap = new Map();

    for (const shed of rtoSheds) {
      shedMap.set(shed.slug, {
        slug: shed.slug,
        name: shed.name,
        size: shed.size,
        style: shed.style,
        image: shed.image || '',
        description: shed.description || '',
        features: shed.features || [],
        available: shed.available ? 1 : 0,
        list_rto: 1,
        list_buy: 0,
        cash_price: shed.cashPrice || null,
        rto_term: shed.rtoTerm || '36 months',
        sale_price: null
      });
    }

    for (const shed of buySheds) {
      if (shedMap.has(shed.slug)) {
        const existing = shedMap.get(shed.slug);
        existing.list_buy = 1;
        existing.sale_price = shed.salePrice || null;
      } else {
        shedMap.set(shed.slug, {
          slug: shed.slug,
          name: shed.name,
          size: shed.size,
          style: shed.style,
          image: shed.image || '',
          description: shed.description || '',
          features: shed.features || [],
          available: shed.available ? 1 : 0,
          list_rto: 0,
          list_buy: 1,
          cash_price: null,
          rto_term: null,
          sale_price: shed.salePrice || null
        });
      }
    }

    // Assign IDs and build array
    const sheds = [];
    let id = 1;
    for (const shed of shedMap.values()) {
      sheds.push({
        id: id++,
        ...shed,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Save to KV
    await redis.set('sheds', sheds);
    await redis.set('next_shed_id', id);

    // Create default admin user
    const hash = bcrypt.hashSync('changeme', 10);
    await redis.set('admin_user', { username: 'admin', password_hash: hash });

    res.json({
      success: true,
      message: `Seeded ${sheds.length} sheds and created admin user.`,
      sheds: sheds.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Seed failed: ' + err.message });
  }
};
