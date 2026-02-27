const { getAllSheds } = require('../lib/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const allSheds = await getAllSheds();
    const buySheds = allSheds
      .filter(s => s.list_buy && s.available)
      .sort((a, b) => (a.sale_price || 0) - (b.sale_price || 0))
      .map(s => ({
        slug: s.slug,
        name: s.name,
        size: s.size,
        style: s.style,
        image: (s.images && s.images[0]) || s.image || '',
        images: s.images || (s.image ? [s.image] : []),
        salePrice: s.sale_price,
        description: s.description,
        features: s.features,
        available: true
      }));

    res.json({ sheds: buySheds });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load sheds.' });
  }
};
