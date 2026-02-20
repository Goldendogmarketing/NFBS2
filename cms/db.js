const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, 'data', 'shed-inventory.db');
const DATA_DIR = path.join(__dirname, '..', 'data');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function createTables() {
  const d = getDb();
  d.exec(`
    CREATE TABLE IF NOT EXISTS sheds (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      slug          TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      size          TEXT NOT NULL,
      style         TEXT NOT NULL,
      image         TEXT NOT NULL DEFAULT '',
      description   TEXT NOT NULL DEFAULT '',
      features      TEXT NOT NULL DEFAULT '[]',
      available     INTEGER NOT NULL DEFAULT 1,
      list_rto      INTEGER NOT NULL DEFAULT 0,
      list_buy      INTEGER NOT NULL DEFAULT 0,
      cash_price    INTEGER,
      rto_term      TEXT DEFAULT '36 months',
      sale_price    INTEGER,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
  `);
}

function seedFromExistingData() {
  const d = getDb();
  const count = d.prepare('SELECT COUNT(*) as c FROM sheds').get().c;
  if (count > 0) return;

  console.log('Seeding database from existing JSON files...');

  let rtoSheds = [];
  let buySheds = [];

  const rtoPath = path.join(DATA_DIR, 'sheds.json');
  const buyPath = path.join(DATA_DIR, 'sheds-for-sale.json');

  if (fs.existsSync(rtoPath)) {
    rtoSheds = JSON.parse(fs.readFileSync(rtoPath, 'utf8')).sheds || [];
  }
  if (fs.existsSync(buyPath)) {
    buySheds = JSON.parse(fs.readFileSync(buyPath, 'utf8')).sheds || [];
  }

  const shedMap = new Map();

  for (const shed of rtoSheds) {
    shedMap.set(shed.slug, {
      slug: shed.slug,
      name: shed.name,
      size: shed.size,
      style: shed.style,
      image: shed.image,
      description: shed.description,
      features: JSON.stringify(shed.features),
      available: shed.available ? 1 : 0,
      list_rto: 1,
      list_buy: 0,
      cash_price: shed.cashPrice,
      rto_term: shed.rtoTerm || '36 months',
      sale_price: null
    });
  }

  for (const shed of buySheds) {
    if (shedMap.has(shed.slug)) {
      const existing = shedMap.get(shed.slug);
      existing.list_buy = 1;
      existing.sale_price = shed.salePrice;
    } else {
      shedMap.set(shed.slug, {
        slug: shed.slug,
        name: shed.name,
        size: shed.size,
        style: shed.style,
        image: shed.image,
        description: shed.description,
        features: JSON.stringify(shed.features),
        available: shed.available ? 1 : 0,
        list_rto: 0,
        list_buy: 1,
        cash_price: null,
        rto_term: null,
        sale_price: shed.salePrice
      });
    }
  }

  const insert = d.prepare(`
    INSERT INTO sheds (slug, name, size, style, image, description, features, available, list_rto, list_buy, cash_price, rto_term, sale_price)
    VALUES (@slug, @name, @size, @style, @image, @description, @features, @available, @list_rto, @list_buy, @cash_price, @rto_term, @sale_price)
  `);

  const insertMany = d.transaction((sheds) => {
    for (const shed of sheds) insert.run(shed);
  });

  insertMany(Array.from(shedMap.values()));
  console.log(`Seeded ${shedMap.size} sheds into database.`);
}

function seedAdminUser() {
  const d = getDb();
  const count = d.prepare('SELECT COUNT(*) as c FROM admin_users').get().c;
  if (count > 0) return;

  const hash = bcrypt.hashSync('changeme', 10);
  d.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  console.log('Default admin created: username "admin", password "changeme"');
}

function regenerateJsonFiles() {
  const d = getDb();

  const rtoSheds = d.prepare(
    'SELECT slug, name, size, style, image, cash_price, rto_term, description, features, available FROM sheds WHERE list_rto = 1 AND available = 1 ORDER BY cash_price ASC'
  ).all().map(row => ({
    slug: row.slug,
    name: row.name,
    size: row.size,
    style: row.style,
    image: row.image,
    cashPrice: row.cash_price,
    rtoTerm: row.rto_term,
    description: row.description,
    features: JSON.parse(row.features),
    available: true
  }));

  fs.writeFileSync(path.join(DATA_DIR, 'sheds.json'), JSON.stringify({ sheds: rtoSheds }, null, 2));

  const buySheds = d.prepare(
    'SELECT slug, name, size, style, image, sale_price, description, features, available FROM sheds WHERE list_buy = 1 AND available = 1 ORDER BY sale_price ASC'
  ).all().map(row => ({
    slug: row.slug,
    name: row.name,
    size: row.size,
    style: row.style,
    image: row.image,
    salePrice: row.sale_price,
    description: row.description,
    features: JSON.parse(row.features),
    available: true
  }));

  fs.writeFileSync(path.join(DATA_DIR, 'sheds-for-sale.json'), JSON.stringify({ sheds: buySheds }, null, 2));

  console.log(`Regenerated JSON: ${rtoSheds.length} RTO, ${buySheds.length} Buy Now`);
}

function initialize() {
  createTables();
  seedFromExistingData();
  seedAdminUser();
  regenerateJsonFiles();
}

module.exports = { getDb, initialize, regenerateJsonFiles };
