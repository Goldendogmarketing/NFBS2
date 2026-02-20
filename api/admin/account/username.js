const { verifyAuth, createToken, setAuthCookie } = require('../../lib/auth');
const { getAdminUser, updateAdminUser } = require('../../lib/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username cannot be empty.' });
    }

    await updateAdminUser({ username: username.trim() });

    // Issue new JWT with updated username
    const token = createToken({ userId: 1, username: username.trim() });
    setAuthCookie(res, token);

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
