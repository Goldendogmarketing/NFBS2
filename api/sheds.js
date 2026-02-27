const { getAllSheds } = require('../lib/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const allSheds = await getAllSheds();
    const rtoSheds = allSheds
      .filter(s => s.list_rto && s.available)
      .sort((a, b) => (a.cash_price || 0) - (b.cash_price || 0))
      .map(s => ({
        slug: s.slug,
        name: s.name,
        size: s.size,
        style: s.style,
        image: (s.images && s.images[0]) || s.image || '',
        images: s.images || (s.image ? [s.image] : []),
        cashPrice: s.cash_price,
        rtoTerm: s.rto_term,
        description: s.description,
        features: s.features,
        available: true
      }));

    res.json({ sheds: rtoSheds });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load sheds.' });
  }
};
