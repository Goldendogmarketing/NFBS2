const bcrypt = require('bcryptjs');
const { verifyAuth, createToken, setAuthCookie } = require('../../../lib/auth');
const { getAdminUser, updateAdminUser } = require('../../../lib/kv');

module.exports = async function handler(req, res) {
  const user = verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  // GET - return current account info
  if (req.method === 'GET') {
    const adminUser = await getAdminUser();
    return res.json({ username: adminUser ? adminUser.username : '' });
  }

  // PUT - update username or password based on body
  if (req.method === 'PUT') {
    try {
      const { action } = req.body;

      if (action === 'username') {
        const { username } = req.body;
        if (!username || !username.trim()) {
          return res.status(400).json({ error: 'Username cannot be empty.' });
        }
        await updateAdminUser({ username: username.trim() });
        const token = createToken({ userId: 1, username: username.trim() });
        setAuthCookie(res, token);
        return res.json({ success: true });
      }

      if (action === 'password') {
        const { currentPassword, newPassword } = req.body;
        if (!newPassword || newPassword.length < 4) {
          return res.status(400).json({ error: 'New password must be at least 4 characters.' });
        }
        const adminUser = await getAdminUser();
        if (!adminUser || !bcrypt.compareSync(currentPassword, adminUser.password_hash)) {
          return res.status(400).json({ error: 'Current password is incorrect.' });
        }
        const hash = bcrypt.hashSync(newPassword, 10);
        await updateAdminUser({ password_hash: hash });
        return res.json({ success: true });
      }

      return res.status(400).json({ error: 'Invalid action.' });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};
