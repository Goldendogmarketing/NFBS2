const bcrypt = require('bcryptjs');
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.query.secret || req.body.secret;
  if (!secret || secret !== process.env.SEED_SECRET) {
    return res.status(403).json({ error: 'Invalid secret.' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    await redis.set('admin_user', JSON.stringify({
      username: username,
      password_hash: hash
    }));

    res.json({ success: true, message: 'Admin credentials updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed: ' + err.message });
  }
};
