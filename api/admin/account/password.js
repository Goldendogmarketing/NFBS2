const bcrypt = require('bcryptjs');
const { verifyAuth } = require('../../lib/auth');
const { getAdminUser, updateAdminUser } = require('../../lib/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  try {
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

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
