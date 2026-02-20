const { verifyAuth } = require('../../lib/auth');
const { getAdminUser } = require('../../lib/kv');

module.exports = async function handler(req, res) {
  const user = verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method === 'GET') {
    const adminUser = await getAdminUser();
    return res.json({ username: adminUser ? adminUser.username : '' });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
