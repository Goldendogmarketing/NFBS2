const { put } = require('@vercel/blob');
const { verifyAuth } = require('../../lib/auth');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

module.exports = async function handler(req, res) {
  const user = verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const contentType = req.headers['content-type'] || '';

    if (!ALLOWED_TYPES.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid file type. Use JPEG, PNG, or WebP.' });
    }

    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > MAX_SIZE) {
      return res.status(400).json({ error: 'File too large. Max 5MB.' });
    }

    const ext = contentType === 'image/jpeg' ? '.jpg'
      : contentType === 'image/png' ? '.png'
      : '.webp';

    const filename = 'sheds/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;

    const blob = await put(filename, req, {
      access: 'public',
      contentType: contentType
    });

    return res.json({ url: blob.url });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Upload failed. Please try again.' });
  }
};
