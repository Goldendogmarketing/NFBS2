const { verifyAuth } = require('../../../lib/auth');
const { getShedById, updateShed, deleteShed } = require('../../../lib/kv');

module.exports = async function handler(req, res) {
  const user = verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { id } = req.query;

  if (req.method === 'GET') {
    const shed = await getShedById(id);
    if (!shed) return res.status(404).json({ error: 'Shed not found' });
    return res.json(shed);
  }

  if (req.method === 'PUT') {
    try {
      const body = req.body;
      const shed = await updateShed(id, {
        slug: body.slug,
        name: body.name,
        size: body.size,
        style: body.style,
        images: body.images || [],
        image: (body.images && body.images[0]) || body.image || '',
        description: body.description,
        features: body.features,
        available: body.available,
        list_rto: body.list_rto,
        list_buy: body.list_buy,
        cash_price: body.cash_price,
        rto_term: body.rto_term,
        sale_price: body.sale_price
      });
      if (!shed) return res.status(404).json({ error: 'Shed not found' });
      return res.json({ success: true });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const deleted = await deleteShed(id);
      if (!deleted) return res.status(404).json({ error: 'Shed not found' });
      return res.json({ success: true });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};
