const { getPromoPopup } = require('../lib/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const promo = await getPromoPopup();
  if (!promo || !promo.enabled) {
    return res.json({ enabled: false });
  }

  return res.json({
    enabled: true,
    headline: promo.headline,
    description: promo.description,
    discount_text: promo.discount_text,
    button_text: promo.button_text,
    bg_color: promo.bg_color,
    delay_seconds: promo.delay_seconds || 4
  });
};
