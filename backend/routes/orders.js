import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDb, queryAll, queryOne, run, saveDb } from '../db.js';
import { authMiddleware, vendorOnly } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    await getDb();
    const { items, coupon, shipping, payment, rentalDetails } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = queryOne('SELECT * FROM products WHERE id = ?', [item.productId]);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }

      const inv = queryOne('SELECT * FROM inventory WHERE productId = ? AND size = ?', [item.productId, item.size]);
      if (inv && inv.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name} size ${item.size}` });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      orderItems.push({
        ...item,
        name: product.name,
        price: product.price,
        img: product.img,
        vendorId: product.vendorId
      });
    }

    let discount = 0;
    if (coupon) {
      if (coupon.type === 'percent') {
        discount = Math.round(subtotal * (coupon.value / 100));
      } else {
        discount = coupon.value;
      }
    }

    const total = Math.max(0, subtotal - discount);
    const now = new Date().toISOString();
    const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const orderId = randomUUID();
    const timeline = [
      { status: 'confirmed', date: now, description: 'Order placed successfully' }
    ];

    run(
      'INSERT INTO orders (id, userId, items, subtotal, discount, total, coupon, shipping, payment, status, date, estimatedDelivery, rentalDetails, timeline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        orderId, req.user.id, JSON.stringify(orderItems), subtotal, discount, total,
        coupon ? JSON.stringify(coupon) : null,
        JSON.stringify(shipping || {}),
        JSON.stringify(payment || {}),
        'confirmed', now, estimatedDelivery,
        rentalDetails ? JSON.stringify(rentalDetails) : null,
        JSON.stringify(timeline)
      ]
    );

    for (const item of items) {
      const inv = queryOne('SELECT id, stock FROM inventory WHERE productId = ? AND size = ?', [item.productId, item.size]);
      if (inv) {
        run('UPDATE inventory SET stock = stock - ? WHERE id = ?', [item.quantity, inv.id]);
      }
    }
    saveDb();

    const order = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
    order.items = JSON.parse(order.items);
    order.shipping = JSON.parse(order.shipping);
    order.payment = JSON.parse(order.payment);
    order.coupon = order.coupon ? JSON.parse(order.coupon) : null;
    order.rentalDetails = order.rentalDetails ? JSON.parse(order.rentalDetails) : null;
    order.timeline = JSON.parse(order.timeline);

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    await getDb();
    const orders = queryAll('SELECT * FROM orders WHERE userId = ? ORDER BY date DESC', [req.user.id]);
    const result = orders.map((o) => ({
      ...o,
      items: JSON.parse(o.items),
      shipping: JSON.parse(o.shipping),
      payment: JSON.parse(o.payment),
      coupon: o.coupon ? JSON.parse(o.coupon) : null,
      rentalDetails: o.rentalDetails ? JSON.parse(o.rentalDetails) : null,
      timeline: JSON.parse(o.timeline)
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vendor', vendorOnly, async (req, res) => {
  try {
    await getDb();
    const allOrders = queryAll('SELECT * FROM orders ORDER BY date DESC', []);
    const result = allOrders.filter((o) => {
      const items = JSON.parse(o.items);
      return items.some((item) => item.vendorId === req.user.id);
    }).map((o) => ({
      ...o,
      items: JSON.parse(o.items),
      shipping: JSON.parse(o.shipping),
      payment: JSON.parse(o.payment),
      coupon: o.coupon ? JSON.parse(o.coupon) : null,
      rentalDetails: o.rentalDetails ? JSON.parse(o.rentalDetails) : null,
      timeline: JSON.parse(o.timeline)
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    await getDb();
    const order = queryOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (req.user.role === 'customer' && order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { status } = req.body;
    const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const timeline = JSON.parse(order.timeline || '[]');
    timeline.push({ status, date: new Date().toISOString(), description: `Order ${status}` });

    run('UPDATE orders SET status = ?, timeline = ? WHERE id = ?',
      [status, JSON.stringify(timeline), req.params.id]);
    saveDb();

    const updated = queryOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    updated.items = JSON.parse(updated.items);
    updated.shipping = JSON.parse(updated.shipping);
    updated.payment = JSON.parse(updated.payment);
    updated.coupon = updated.coupon ? JSON.parse(updated.coupon) : null;
    updated.rentalDetails = updated.rentalDetails ? JSON.parse(updated.rentalDetails) : null;
    updated.timeline = JSON.parse(updated.timeline);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/return', authMiddleware, async (req, res) => {
  try {
    await getDb();
    const order = queryOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (order.status === 'returned') {
      return res.status(400).json({ error: 'Order already returned' });
    }

    const items = JSON.parse(order.items);
    for (const item of items) {
      const inv = queryOne('SELECT id FROM inventory WHERE productId = ? AND size = ?', [item.productId, item.size]);
      if (inv) {
        run('UPDATE inventory SET stock = stock + ? WHERE id = ?', [item.quantity, inv.id]);
      }
    }

    const timeline = JSON.parse(order.timeline || '[]');
    const now = new Date().toISOString();
    timeline.push({ status: 'returned', date: now, description: 'Return processed, inventory restored' });

    run('UPDATE orders SET status = ?, timeline = ? WHERE id = ?',
      ['returned', JSON.stringify(timeline), req.params.id]);
    saveDb();

    const updated = queryOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    updated.items = JSON.parse(updated.items);
    updated.shipping = JSON.parse(updated.shipping);
    updated.payment = JSON.parse(updated.payment);
    updated.coupon = updated.coupon ? JSON.parse(updated.coupon) : null;
    updated.rentalDetails = updated.rentalDetails ? JSON.parse(updated.rentalDetails) : null;
    updated.timeline = JSON.parse(updated.timeline);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
