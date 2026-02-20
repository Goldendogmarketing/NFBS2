const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function parseCookies(cookieStr) {
  const cookies = {};
  if (!cookieStr) return cookies;
  cookieStr.split(';').forEach(c => {
    const [key, ...rest] = c.trim().split('=');
    if (key) cookies[key] = rest.join('=');
  });
  return cookies;
}

function verifyAuth(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.auth_token;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  const secure = isProduction ? '; Secure' : '';
  res.setHeader('Set-Cookie',
    `auth_token=${token}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${8 * 60 * 60}`
  );
}

function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  const secure = isProduction ? '; Secure' : '';
  res.setHeader('Set-Cookie',
    `auth_token=; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=0`
  );
}

module.exports = { verifyAuth, createToken, setAuthCookie, clearAuthCookie };
