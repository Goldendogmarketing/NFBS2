const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// --- Sheds ---

async function getAllSheds() {
  const sheds = await redis.get('sheds');
  return sheds || [];
}

async function getShedById(id) {
  const sheds = await getAllSheds();
  return sheds.find(s => s.id === parseInt(id)) || null;
}

async function createShed(data) {
  const sheds = await getAllSheds();
  const nextId = await redis.incr('next_shed_id');
  const shed = {
    id: nextId,
    slug: data.slug,
    name: data.name,
    size: data.size,
    style: data.style,
    image: data.image || '',
    description: data.description || '',
    features: data.features || [],
    available: data.available ? 1 : 0,
    list_rto: data.list_rto ? 1 : 0,
    list_buy: data.list_buy ? 1 : 0,
    cash_price: data.cash_price ? parseInt(data.cash_price) : null,
    rto_term: data.rto_term || '36 months',
    sale_price: data.sale_price ? parseInt(data.sale_price) : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  sheds.push(shed);
  await redis.set('sheds', JSON.stringify(sheds));
  return shed;
}

async function updateShed(id, data) {
  const sheds = await getAllSheds();
  const index = sheds.findIndex(s => s.id === parseInt(id));
  if (index === -1) return null;

  const existing = sheds[index];
  sheds[index] = {
    ...existing,
    slug: data.slug !== undefined ? data.slug : existing.slug,
    name: data.name !== undefined ? data.name : existing.name,
    size: data.size !== undefined ? data.size : existing.size,
    style: data.style !== undefined ? data.style : existing.style,
    image: data.image !== undefined ? data.image : existing.image,
    description: data.description !== undefined ? data.description : existing.description,
    features: data.features !== undefined ? data.features : existing.features,
    available: data.available !== undefined ? (data.available ? 1 : 0) : existing.available,
    list_rto: data.list_rto !== undefined ? (data.list_rto ? 1 : 0) : existing.list_rto,
    list_buy: data.list_buy !== undefined ? (data.list_buy ? 1 : 0) : existing.list_buy,
    cash_price: data.cash_price !== undefined ? (data.cash_price ? parseInt(data.cash_price) : null) : existing.cash_price,
    rto_term: data.rto_term !== undefined ? data.rto_term : existing.rto_term,
    sale_price: data.sale_price !== undefined ? (data.sale_price ? parseInt(data.sale_price) : null) : existing.sale_price,
    updated_at: new Date().toISOString()
  };

  await redis.set('sheds', JSON.stringify(sheds));
  return sheds[index];
}

async function deleteShed(id) {
  const sheds = await getAllSheds();
  const filtered = sheds.filter(s => s.id !== parseInt(id));
  if (filtered.length === sheds.length) return false;
  await redis.set('sheds', JSON.stringify(filtered));
  return true;
}

async function toggleShed(id) {
  const sheds = await getAllSheds();
  const index = sheds.findIndex(s => s.id === parseInt(id));
  if (index === -1) return null;

  sheds[index].available = sheds[index].available ? 0 : 1;
  sheds[index].updated_at = new Date().toISOString();
  await redis.set('sheds', JSON.stringify(sheds));
  return sheds[index].available;
}

// --- Admin User ---

async function getAdminUser() {
  return await redis.get('admin_user');
}

async function updateAdminUser(data) {
  const current = await getAdminUser();
  const updated = { ...current, ...data };
  await redis.set('admin_user', JSON.stringify(updated));
  return updated;
}

module.exports = {
  getAllSheds,
  getShedById,
  createShed,
  updateShed,
  deleteShed,
  toggleShed,
  getAdminUser,
  updateAdminUser
};
