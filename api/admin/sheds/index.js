const { verifyAuth } = require('../../../lib/auth');
const { getAllSheds, createShed } = require('../../../lib/kv');

module.exports = async function handler(req, res) {
  const user = verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method === 'GET') {
    const sheds = await getAllSheds();
    return res.json(sheds);
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      const shed = await createShed({
        slug: body.slug,
        name: body.name,
        size: body.size,
        style: body.style,
        images: body.images || [],
        image: (body.images && body.images[0]) || body.image || '',
        description: body.description || '',
        features: body.features || [],
        available: body.available,
        list_rto: body.list_rto,
        list_buy: body.list_buy,
        cash_price: body.cash_price,
        rto_term: body.rto_term,
        sale_price: body.sale_price
      });
      return res.json({ success: true, id: shed.id });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};
