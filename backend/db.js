import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'evergreen.db');

let db;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firstName TEXT,
      lastName TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'customer',
      phone TEXT,
      addresses TEXT,
      vendorStore TEXT,
      createdAt TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT,
      price INTEGER,
      tag TEXT,
      category TEXT,
      gender TEXT,
      colors TEXT,
      sizes TEXT,
      description TEXT,
      vendorId TEXT,
      stock TEXT,
      rentalAvailable INTEGER DEFAULT 0,
      rentalPricePerDay INTEGER DEFAULT 0,
      img TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId TEXT,
      items TEXT,
      subtotal INTEGER,
      discount INTEGER DEFAULT 0,
      total INTEGER,
      coupon TEXT,
      shipping TEXT,
      payment TEXT,
      status TEXT DEFAULT 'confirmed',
      date TEXT,
      estimatedDelivery TEXT,
      rentalDetails TEXT,
      timeline TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      productId TEXT,
      userId TEXT,
      userName TEXT,
      rating INTEGER,
      comment TEXT,
      date TEXT,
      vendorReply TEXT,
      FOREIGN KEY (productId) REFERENCES products(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId TEXT,
      size TEXT,
      stock INTEGER,
      FOREIGN KEY (productId) REFERENCES products(id)
    )
  `);

  const existingAdmin = queryOne('SELECT id FROM users WHERE id = ?', ['admin-1']);
  if (!existingAdmin) {
    await seedData();
  }

  saveDb();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

function run(sql, params = []) {
  db.run(sql, params);
}

async function seedData() {
  const now = new Date().toISOString();
  const hashPassword = (pw) => bcrypt.hashSync(pw, 10);

  run(
    'INSERT INTO users (id, firstName, lastName, email, password, role, phone, addresses, vendorStore, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['admin-1', 'Admin', 'Evergreen', 'admin@evergreen.com', hashPassword('admin123'), 'admin', null, '[]', null, now]
  );

  run(
    'INSERT INTO users (id, firstName, lastName, email, password, role, phone, addresses, vendorStore, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['vendor-1', 'Atelier', 'Paris', 'vendor@evergreen.com', hashPassword('vendor123'), 'vendor', null, '[]',
      JSON.stringify({ name: 'Atelier Paris', description: 'Premium Parisian fashion house', commission: 15 }), now]
  );

  run(
    'INSERT INTO users (id, firstName, lastName, email, password, role, phone, addresses, vendorStore, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['cust-1', 'Isabelle', 'Moreau', 'customer@evergreen.com', hashPassword('customer123'), 'customer', '+33 6 12 34 56 78', '[]', null, now]
  );

  const products = [
    {
      id: 'ecarlate-gown', name: 'Écarlate Gown', price: 1290, category: 'Dresses', gender: 'Womenswear',
      colors: ['Red', 'Burgundy'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main',
      description: 'A breathtaking floor-length gown in the deepest scarlet, crafted from flowing silk charmeuse.',
      rentalAvailable: 1, rentalPricePerDay: 160
    },
    {
      id: 'emeraude-gown', name: 'Émeraude Gown', price: 1420, category: 'Dresses', gender: 'Womenswear',
      colors: ['Emerald', 'Sage'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main',
      description: 'An emerald masterpiece inspired by the lush gardens of Versailles.',
      rentalAvailable: 1, rentalPricePerDay: 180
    },
    {
      id: 'ivoire-draped', name: 'Ivoire Draped', price: 980, category: 'Dresses', gender: 'Womenswear',
      colors: ['Ivory', 'Cream', 'Nude'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main',
      description: 'Ethereal draped gown in pure ivory, a study in understated luxury.',
      rentalAvailable: 1, rentalPricePerDay: 120
    },
    {
      id: 'perle-chiffon', name: 'Perle Chiffon', price: 1100, category: 'Dresses', gender: 'Womenswear',
      colors: ['Pearl', 'Champagne'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main',
      description: 'A pearl-toned chiffon gown that captures light like morning dew.',
      rentalAvailable: 1, rentalPricePerDay: 140
    },
    {
      id: 'satin-ecarlate', name: 'Satin Écarlate', price: 1290, category: 'Dresses', gender: 'Womenswear',
      colors: ['Red', 'Ruby'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main',
      description: 'Luxurious satin gown in vivid scarlet with architectural draping.',
      rentalAvailable: 1, rentalPricePerDay: 160
    },
    {
      id: 'chiffon-gress', name: 'Chiffon Gress', price: 1100, category: 'Dresses', gender: 'Womenswear',
      colors: ['Blush', 'Dove'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main',
      description: 'Soft chiffon layers in delicate blush tones, perfect for garden parties.',
      rentalAvailable: 1, rentalPricePerDay: 140
    },
    {
      id: 'noir-silhouette', name: 'Noir Silhouette', price: 890, category: 'Apparel', gender: 'Menswear',
      colors: ['Black', 'Charcoal'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], vendorId: 'ef-main',
      description: 'The quintessential black piece, tailored to perfection.'
    },
    {
      id: 'camel-trench', name: 'Camel Trench', price: 1150, category: 'Apparel', gender: 'Menswear',
      colors: ['Camel', 'Sand'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], vendorId: 'ef-main',
      description: 'A timeless camel trench coat in Italian wool-cashmere blend.'
    },
    {
      id: 'noir-blazer', name: 'Noir Blazer', price: 780, category: 'Apparel', gender: 'Menswear',
      colors: ['Black', 'Navy'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], vendorId: 'ef-main',
      description: 'Impeccably structured blazer in midnight black.'
    },
    {
      id: 'sable-wrap-coat', name: 'Sable Wrap Coat', price: 1340, category: 'Apparel', gender: 'Menswear',
      colors: ['Brown', 'Espresso'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], vendorId: 'ef-main',
      description: 'A sumptuous wrap coat in rich sable tones, double-faced cashmere.'
    },
    {
      id: 'trench-italienne', name: 'Trench Italienne', price: 1150, category: 'Apparel', gender: 'Menswear',
      colors: ['Navy', 'Charcoal'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], vendorId: 'ef-main',
      description: 'Italian-crafted trench in deep navy with refined detailing.'
    },
    {
      id: 'silk-blouse-noir', name: 'Silk Blouse Noir', price: 520, category: 'Apparel', gender: 'Womenswear',
      colors: ['Black', 'Ivory'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main',
      description: 'Flowing silk blouse in noir, a wardrobe essential.'
    },
    {
      id: 'cashmere-wrap', name: 'Cashmere Wrap', price: 890, category: 'Apparel', gender: 'Womenswear',
      colors: ['Camel', 'Dove'], sizes: ['One Size'], vendorId: 'ef-main',
      description: 'Pure cashmere wrap in warm camel tones.'
    },
    {
      id: 'wool-trousers', name: 'Wool Trousers', price: 460, category: 'Apparel', gender: 'Womenswear',
      colors: ['Charcoal', 'Black'], sizes: ['XS', 'S', 'M', 'L', 'XL'], vendorId: 'ef-main',
      description: 'Impeccably tailored wool trousers with a modern silhouette.'
    },
    {
      id: 'derby-leather', name: 'Derby Leather', price: 420, category: 'Shoes', gender: 'Menswear',
      colors: ['Black', 'Brown'], sizes: ['40', '41', '42', '43', '44', '45'], vendorId: 'ef-main',
      description: 'Hand-stitched leather derby shoes, Goodyear welted.'
    },
    {
      id: 'chelsea-suede', name: 'Chelsea Suede', price: 380, category: 'Shoes', gender: 'Menswear',
      colors: ['Sand', 'Espresso'], sizes: ['40', '41', '42', '43', '44', '45'], vendorId: 'ef-main',
      description: 'Refined Chelsea boots in premium suede.'
    },
    {
      id: 'loafer-patent', name: 'Loafer Patent', price: 350, category: 'Shoes', gender: 'Menswear',
      colors: ['Black'], sizes: ['40', '41', '42', '43', '44', '45'], vendorId: 'ef-main',
      description: 'Polished patent leather loafers for the distinguished gentleman.'
    },
    {
      id: 'stiletto-suede', name: 'Stiletto Suede', price: 480, category: 'Shoes', gender: 'Womenswear',
      colors: ['Black', 'Nude'], sizes: ['35', '36', '37', '38', '39', '40'], vendorId: 'ef-main',
      description: 'Elegant stiletto heels in sumptuous suede.'
    },
    {
      id: 'ankle-boot-leather', name: 'Ankle Boot Leather', price: 390, category: 'Shoes', gender: 'Womenswear',
      colors: ['Black', 'Oxblood'], sizes: ['35', '36', '37', '38', '39', '40'], vendorId: 'ef-main',
      description: 'Structured ankle boots in premium leather.'
    },
    {
      id: 'strappy-heel', name: 'Strappy Heel', price: 340, category: 'Shoes', gender: 'Womenswear',
      colors: ['Gold', 'Champagne'], sizes: ['35', '36', '37', '38', '39', '40'], vendorId: 'ef-main',
      description: 'Delicate strappy heels in metallic gold.'
    }
  ];

  for (const p of products) {
    run(
      'INSERT INTO products (id, name, price, tag, category, gender, colors, sizes, description, vendorId, stock, rentalAvailable, rentalPricePerDay, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        p.id, p.name, p.price, p.category, p.category, p.gender,
        JSON.stringify(p.colors), JSON.stringify(p.sizes), p.description,
        p.vendorId, JSON.stringify({}),
        p.rentalAvailable || 0, p.rentalPricePerDay || 0,
        '/assets/dress-hero.png'
      ]
    );

    for (const size of p.sizes) {
      const stock = 5 + Math.floor(Math.random() * 11);
      run('INSERT INTO inventory (productId, size, stock) VALUES (?, ?, ?)', [p.id, size, stock]);
    }
  }

  run(
    'INSERT INTO reviews (id, productId, userId, userName, rating, comment, date, vendorReply) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [randomUUID(), 'ecarlate-gown', 'cust-1', 'Isabelle Moreau', 5,
      'Absolutely stunning! The fabric quality is extraordinary and the fit is perfect. Received countless compliments.',
      now, 'Thank you, Isabelle! We are delighted this gown exceeded your expectations.']
  );
  run(
    'INSERT INTO reviews (id, productId, userId, userName, rating, comment, date, vendorReply) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [randomUUID(), 'ecarlate-gown', 'cust-1', 'Isabelle Moreau', 5,
      'The scarlet hue is even more vivid in person. A true showstopper for any evening event.',
      now, null]
  );
  run(
    'INSERT INTO reviews (id, productId, userId, userName, rating, comment, date, vendorReply) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [randomUUID(), 'emeraude-gown', 'cust-1', 'Isabelle Moreau', 5,
      'The emerald color is breathtaking. Felt like royalty wearing this to the gala.',
      now, null]
  );
  run(
    'INSERT INTO reviews (id, productId, userId, userName, rating, comment, date, vendorReply) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [randomUUID(), 'ivoire-draped', 'cust-1', 'Isabelle Moreau', 4,
      'Beautiful draping and luxurious feel. Slightly longer than expected but easily altered.',
      now, 'Thank you for your feedback! We are glad you loved the piece.']
  );

  console.log('Database seeded successfully');
}

export { getDb, queryAll, queryOne, run, saveDb };
