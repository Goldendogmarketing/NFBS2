const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { getDb, regenerateJsonFiles } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

const IMAGES_DIR = path.join(__dirname, '..', '..', 'images', 'sheds');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }
    cb(null, IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const sanitized = file.originalname
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-\.]/g, '');
    const ext = path.extname(sanitized);
    const base = path.basename(sanitized, ext);
    let finalName = sanitized;
    let counter = 1;
    while (fs.existsSync(path.join(IMAGES_DIR, finalName))) {
      finalName = `${base}-${counter}${ext}`;
      counter++;
    }
    cb(null, finalName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.avif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, avif, webp) are allowed'));
    }
  }
});

// Serve admin pages
router.get('/admin', requireAuth, (req, res) => {
  res.redirect('/admin/dashboard');
});

router.get('/admin/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'dashboard.html'));
});

router.get('/admin/sheds/new', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'shed-form.html'));
});

router.get('/admin/sheds/:id/edit', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'shed-form.html'));
});

// API: List all sheds
router.get('/api/admin/sheds', requireAuth, (req, res) => {
  const db = getDb();
  const sheds = db.prepare('SELECT * FROM sheds ORDER BY id ASC').all();
  const parsed = sheds.map(s => ({ ...s, features: JSON.parse(s.features) }));
  res.json(parsed);
});

// API: Get single shed
router.get('/api/admin/sheds/:id', requireAuth, (req, res) => {
  const db = getDb();
  const shed = db.prepare('SELECT * FROM sheds WHERE id = ?').get(req.params.id);
  if (!shed) return res.status(404).json({ error: 'Shed not found' });
  shed.features = JSON.parse(shed.features);
  res.json(shed);
});

// API: Create shed
router.post('/api/admin/sheds', requireAuth, upload.single('image'), (req, res) => {
  try {
    const db = getDb();
    const { slug, name, size, style, description, features, available, list_rto, list_buy, cash_price, rto_term, sale_price } = req.body;
    const imagePath = req.file ? `images/sheds/${req.file.filename}` : '';
    const featuresArr = typeof features === 'string' ? features : JSON.stringify(features || []);

    const result = db.prepare(`
      INSERT INTO sheds (slug, name, size, style, image, description, features, available, list_rto, list_buy, cash_price, rto_term, sale_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      slug, name, size, style, imagePath, description || '',
      featuresArr,
      available === 'on' || available === '1' || available === 'true' ? 1 : 0,
      list_rto === 'on' || list_rto === '1' || list_rto === 'true' ? 1 : 0,
      list_buy === 'on' || list_buy === '1' || list_buy === 'true' ? 1 : 0,
      cash_price ? parseInt(cash_price) : null,
      rto_term || '36 months',
      sale_price ? parseInt(sale_price) : null
    );

    regenerateJsonFiles();
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// API: Update shed
router.put('/api/admin/sheds/:id', requireAuth, upload.single('image'), (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM sheds WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Shed not found' });

    const { slug, name, size, style, description, features, available, list_rto, list_buy, cash_price, rto_term, sale_price } = req.body;
    const imagePath = req.file ? `images/sheds/${req.file.filename}` : existing.image;
    const featuresArr = typeof features === 'string' ? features : JSON.stringify(features || []);

    db.prepare(`
      UPDATE sheds SET slug=?, name=?, size=?, style=?, image=?, description=?, features=?, available=?, list_rto=?, list_buy=?, cash_price=?, rto_term=?, sale_price=?, updated_at=datetime('now')
      WHERE id=?
    `).run(
      slug, name, size, style, imagePath, description || '',
      featuresArr,
      available === 'on' || available === '1' || available === 'true' ? 1 : 0,
      list_rto === 'on' || list_rto === '1' || list_rto === 'true' ? 1 : 0,
      list_buy === 'on' || list_buy === '1' || list_buy === 'true' ? 1 : 0,
      cash_price ? parseInt(cash_price) : null,
      rto_term || '36 months',
      sale_price ? parseInt(sale_price) : null,
      req.params.id
    );

    regenerateJsonFiles();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// API: Delete shed
router.delete('/api/admin/sheds/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM sheds WHERE id = ?').run(req.params.id);
    regenerateJsonFiles();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// API: Toggle availability
router.patch('/api/admin/sheds/:id/toggle', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const shed = db.prepare('SELECT available FROM sheds WHERE id = ?').get(req.params.id);
    if (!shed) return res.status(404).json({ error: 'Shed not found' });

    const newVal = shed.available ? 0 : 1;
    db.prepare('UPDATE sheds SET available = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newVal, req.params.id);
    regenerateJsonFiles();
    res.json({ success: true, available: newVal });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Settings page
router.get('/admin/settings', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'settings.html'));
});

// API: Get current account info
router.get('/api/admin/account', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT username FROM admin_users WHERE id = ?').get(req.session.userId);
  res.json({ username: user ? user.username : '' });
});

// API: Change username
router.put('/api/admin/account/username', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username cannot be empty.' });
    }
    db.prepare('UPDATE admin_users SET username = ? WHERE id = ?').run(username.trim(), req.session.userId);
    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'That username is already taken.' });
    }
    res.status(400).json({ error: err.message });
  }
});

// API: Change password
router.put('/api/admin/account/password', requireAuth, (req, res) => {
  const db = getDb();
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters.' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.session.userId);
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(hash, req.session.userId);
  res.json({ success: true });
});

module.exports = router;
