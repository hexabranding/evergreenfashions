import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDb, queryAll, queryOne, run, saveDb } from '../db.js';
import { authMiddleware, vendorOnly, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    await getDb();
    const vendors = queryAll("SELECT id, firstName, lastName, email, phone, vendorStore, createdAt FROM users WHERE role = 'vendor'", []);
    const result = vendors.map((v) => ({
      ...v,
      vendorStore: v.vendorStore ? JSON.parse(v.vendorStore) : null
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await getDb();
    const vendor = queryOne("SELECT id, firstName, lastName, email, phone, vendorStore, createdAt FROM users WHERE id = ? AND role = 'vendor'", [req.params.id]);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    vendor.vendorStore = vendor.vendorStore ? JSON.parse(vendor.vendorStore) : null;

    const products = queryAll('SELECT id, name, price, category, img FROM products WHERE vendorId = ?', [req.params.id]);
    vendor.products = products;

    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/stats', vendorOnly, async (req, res) => {
  try {
    await getDb();

    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const products = queryAll('SELECT id, price FROM products WHERE vendorId = ?', [req.params.id]);
    const productIds = products.map((p) => p.id);
    const totalProducts = products.length;

    let totalSales = 0;
    let totalRevenue = 0;
    const vendor = queryOne('SELECT vendorStore FROM users WHERE id = ?', [req.params.id]);
    const commission = vendor && vendor.vendorStore ? JSON.parse(vendor.vendorStore).commission || 15 : 15;

    if (productIds.length > 0) {
      const allOrders = queryAll('SELECT * FROM orders', []);
      for (const order of allOrders) {
        const items = JSON.parse(order.items || '[]');
        for (const item of items) {
          if (productIds.includes(item.productId)) {
            totalSales += item.quantity;
            totalRevenue += item.price * item.quantity;
          }
        }
      }
    }

    const totalEarnings = Math.round(totalRevenue * (1 - commission / 100));

    res.json({
      vendorId: req.params.id,
      totalProducts,
      totalSales,
      totalRevenue,
      commission,
      totalEarnings,
      pendingPayout: totalEarnings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/commission', authMiddleware, adminOnly, async (req, res) => {
  try {
    await getDb();
    const vendor = queryOne("SELECT * FROM users WHERE id = ? AND role = 'vendor'", [req.params.id]);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const { commission } = req.body;
    if (commission === undefined || commission < 0 || commission > 100) {
      return res.status(400).json({ error: 'Valid commission rate (0-100) is required' });
    }

    const store = vendor.vendorStore ? JSON.parse(vendor.vendorStore) : {};
    store.commission = commission;

    run('UPDATE users SET vendorStore = ? WHERE id = ?', [JSON.stringify(store), req.params.id]);
    saveDb();

    res.json({ message: 'Commission updated', commission });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/payout', vendorOnly, async (req, res) => {
  try {
    await getDb();

    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const products = queryAll('SELECT id, price FROM products WHERE vendorId = ?', [req.params.id]);
    const productIds = products.map((p) => p.id);

    let totalRevenue = 0;
    if (productIds.length > 0) {
      const allOrders = queryAll('SELECT * FROM orders', []);
      for (const order of allOrders) {
        const items = JSON.parse(order.items || '[]');
        for (const item of items) {
          if (productIds.includes(item.productId)) {
            totalRevenue += item.price * item.quantity;
          }
        }
      }
    }

    const vendor = queryOne('SELECT vendorStore FROM users WHERE id = ?', [req.params.id]);
    const commission = vendor && vendor.vendorStore ? JSON.parse(vendor.vendorStore).commission || 15 : 15;
    const payoutAmount = Math.round(totalRevenue * (1 - commission / 100));

    const payout = {
      id: randomUUID(),
      vendorId: req.params.id,
      amount: payoutAmount,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    res.status(201).json(payout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
