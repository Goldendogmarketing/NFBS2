const { verifyAuth } = require('../../lib/auth');
const { getPromoPopup, updatePromoPopup } = require('../../lib/kv');

module.exports = async function handler(req, res) {
  const user = verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method === 'GET') {
    const promo = await getPromoPopup();
    return res.json(promo || {
      enabled: false,
      headline: '',
      description: '',
      discount_text: '',
      button_text: 'Claim My Discount',
      bg_color: '#2563EB',
      delay_seconds: 4
    });
  }

  if (req.method === 'PUT') {
    try {
      const body = req.body;
      const updated = await updatePromoPopup({
        enabled: !!body.enabled,
        headline: body.headline || '',
        description: body.description || '',
        discount_text: body.discount_text || '',
        button_text: body.button_text || 'Claim My Discount',
        bg_color: body.bg_color || '#2563EB',
        delay_seconds: parseInt(body.delay_seconds) || 4
      });
      return res.json({ success: true, data: updated });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};
