import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDb, queryAll, queryOne, run, saveDb } from '../db.js';
import { authMiddleware, optionalAuth, vendorOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    await getDb();
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (req.query.search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const s = `%${req.query.search}%`;
      params.push(s, s);
    }
    if (req.query.category) {
      query += ' AND category = ?';
      params.push(req.query.category);
    }
    if (req.query.gender) {
      query += ' AND gender = ?';
      params.push(req.query.gender);
    }
    if (req.query.minPrice) {
      query += ' AND price >= ?';
      params.push(Number(req.query.minPrice));
    }
    if (req.query.maxPrice) {
      query += ' AND price <= ?';
      params.push(Number(req.query.maxPrice));
    }

    const products = queryAll(query, params);
    const result = products.map((p) => ({
      ...p,
      colors: JSON.parse(p.colors || '[]'),
      sizes: JSON.parse(p.sizes || '[]'),
      stock: JSON.parse(p.stock || '{}')
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    await getDb();
    const product = queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.colors = JSON.parse(product.colors || '[]');
    product.sizes = JSON.parse(product.sizes || '[]');
    product.stock = JSON.parse(product.stock || '{}');

    const inventory = queryAll('SELECT * FROM inventory WHERE productId = ?', [req.params.id]);
    product.inventory = inventory;

    if (product.vendorId) {
      const vendor = queryOne('SELECT id, firstName, lastName, vendorStore FROM users WHERE id = ?', [product.vendorId]);
      if (vendor && vendor.vendorStore) {
        const store = JSON.parse(vendor.vendorStore);
        product.vendor = { id: vendor.id, name: store.name, description: store.description };
      }
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', vendorOnly, async (req, res) => {
  try {
    await getDb();
    const { name, price, category, gender, colors, sizes, description, img, rentalAvailable, rentalPricePerDay } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    run(
      'INSERT INTO products (id, name, price, tag, category, gender, colors, sizes, description, vendorId, stock, rentalAvailable, rentalPricePerDay, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, name, price, category || '', category || '', gender || 'Unisex',
        JSON.stringify(colors || []), JSON.stringify(sizes || []),
        description || '', req.user.id, JSON.stringify({}),
        rentalAvailable ? 1 : 0, rentalPricePerDay || 0,
        img || '/assets/dress-hero.png'
      ]
    );

    for (const size of (sizes || [])) {
      run('INSERT INTO inventory (productId, size, stock) VALUES (?, ?, ?)', [id, size, 10]);
    }
    saveDb();

    const product = queryOne('SELECT * FROM products WHERE id = ?', [id]);
    product.colors = JSON.parse(product.colors || '[]');
    product.sizes = JSON.parse(product.sizes || '[]');
    product.stock = JSON.parse(product.stock || '{}');

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', vendorOnly, async (req, res) => {
  try {
    await getDb();
    const product = queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.user.role !== 'admin' && product.vendorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }

    const { name, price, category, gender, colors, sizes, description, img, rentalAvailable, rentalPricePerDay } = req.body;

    run(
      'UPDATE products SET name = ?, price = ?, category = ?, gender = ?, colors = ?, sizes = ?, description = ?, img = ?, rentalAvailable = ?, rentalPricePerDay = ? WHERE id = ?',
      [
        name ?? product.name, price ?? product.price,
        category ?? product.category, gender ?? product.gender,
        colors ? JSON.stringify(colors) : product.colors,
        sizes ? JSON.stringify(sizes) : product.sizes,
        description ?? product.description, img ?? product.img,
        rentalAvailable !== undefined ? (rentalAvailable ? 1 : 0) : product.rentalAvailable,
        rentalPricePerDay ?? product.rentalPricePerDay,
        req.params.id
      ]
    );
    saveDb();

    const updated = queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    updated.colors = JSON.parse(updated.colors || '[]');
    updated.sizes = JSON.parse(updated.sizes || '[]');
    updated.stock = JSON.parse(updated.stock || '{}');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', vendorOnly, async (req, res) => {
  try {
    await getDb();
    const product = queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.user.role !== 'admin' && product.vendorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }

    run('DELETE FROM inventory WHERE productId = ?', [req.params.id]);
    run('DELETE FROM products WHERE id = ?', [req.params.id]);
    saveDb();

    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/stock', async (req, res) => {
  try {
    await getDb();
    const product = queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const inventory = queryAll('SELECT * FROM inventory WHERE productId = ?', [req.params.id]);
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/stock', vendorOnly, async (req, res) => {
  try {
    await getDb();
    const product = queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.user.role !== 'admin' && product.vendorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { stock } = req.body;
    if (!stock || !Array.isArray(stock)) {
      return res.status(400).json({ error: 'Stock array is required' });
    }

    for (const item of stock) {
      const existing = queryOne('SELECT id FROM inventory WHERE productId = ? AND size = ?', [req.params.id, item.size]);
      if (existing) {
        run('UPDATE inventory SET stock = ? WHERE id = ?', [item.stock, existing.id]);
      } else {
        run('INSERT INTO inventory (productId, size, stock) VALUES (?, ?, ?)', [req.params.id, item.size, item.stock]);
      }
    }
    saveDb();

    const updated = queryAll('SELECT * FROM inventory WHERE productId = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
