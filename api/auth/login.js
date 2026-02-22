const bcrypt = require('bcryptjs');
const { getAdminUser } = require('../../lib/kv');
const { createToken, setAuthCookie } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await getAdminUser();
    if (!user || user.username !== username || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = createToken({ userId: 1, username: user.username });
    setAuthCookie(res, token);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
};
