const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Helper: safely handle data that may be double-serialized (stored as JSON string)
function safeParse(data) {
  if (!data) return null;
  if (typeof data === 'object') return data;
  try { return JSON.parse(data); } catch { return null; }
}

// --- Sheds ---

async function getAllSheds() {
  const raw = await redis.get('sheds');
  return safeParse(raw) || [];
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
  await redis.set('sheds', sheds);
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

  await redis.set('sheds', sheds);
  return sheds[index];
}

async function deleteShed(id) {
  const sheds = await getAllSheds();
  const filtered = sheds.filter(s => s.id !== parseInt(id));
  if (filtered.length === sheds.length) return false;
  await redis.set('sheds', filtered);
  return true;
}

async function toggleShed(id) {
  const sheds = await getAllSheds();
  const index = sheds.findIndex(s => s.id === parseInt(id));
  if (index === -1) return null;

  sheds[index].available = sheds[index].available ? 0 : 1;
  sheds[index].updated_at = new Date().toISOString();
  await redis.set('sheds', sheds);
  return sheds[index].available;
}

// --- Admin User ---

async function getAdminUser() {
  const raw = await redis.get('admin_user');
  return safeParse(raw);
}

async function updateAdminUser(data) {
  const current = await getAdminUser();
  const updated = { ...current, ...data };
  await redis.set('admin_user', updated);
  return updated;
}

// --- Submissions ---

async function getAllSubmissions() {
  const raw = await redis.get('submissions');
  return safeParse(raw) || [];
}

async function createSubmission(data) {
  const submissions = await getAllSubmissions();
  const nextId = await redis.incr('next_submission_id');
  const submission = Object.assign({}, data, {
    id: nextId,
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  submissions.unshift(submission);
  await redis.set('submissions', submissions);
  return submission;
}

async function updateSubmissionStatus(id, status) {
  const submissions = await getAllSubmissions();
  const index = submissions.findIndex(s => s.id === parseInt(id));
  if (index === -1) return null;
  submissions[index].status = status;
  submissions[index].updated_at = new Date().toISOString();
  await redis.set('submissions', submissions);
  return submissions[index];
}

async function deleteSubmission(id) {
  const submissions = await getAllSubmissions();
  const filtered = submissions.filter(s => s.id !== parseInt(id));
  if (filtered.length === submissions.length) return false;
  await redis.set('submissions', filtered);
  return true;
}

// --- Promo Popup ---

async function getPromoPopup() {
  const raw = await redis.get('promo_popup');
  return safeParse(raw);
}

async function updatePromoPopup(data) {
  const current = await getPromoPopup();
  const updated = {
    ...(current || {}),
    ...data,
    updated_at: new Date().toISOString()
  };
  await redis.set('promo_popup', updated);
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
  updateAdminUser,
  getAllSubmissions,
  createSubmission,
  updateSubmissionStatus,
  deleteSubmission,
  getPromoPopup,
  updatePromoPopup
};
