const { verifyAuth } = require('../../../../lib/auth');
const { toggleShed } = require('../../../../lib/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { id } = req.query;

  try {
    const available = await toggleShed(id);
    if (available === null) return res.status(404).json({ error: 'Shed not found' });
    return res.json({ success: true, available });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
