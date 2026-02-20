const { clearAuthCookie } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  clearAuthCookie(res);

  // GET requests (from nav link) redirect to login page
  if (req.method === 'GET') {
    res.writeHead(302, { Location: '/admin/login' });
    return res.end();
  }

  res.json({ success: true });
};
