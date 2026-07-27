import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { authMiddleware, vendorOnly } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, coupon, shipping, payment, rentalDetails } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).lean();
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }

      const inv = product.inventory?.find((i) => i.size === item.size);
      if (inv && inv.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name} size ${item.size}` });
      }

      subtotal += product.price * item.quantity;
      orderItems.push({
        productId: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        img: product.img,
        vendorId: product.vendorId,
      });
    }

    let discount = 0;
    if (coupon) {
      discount = coupon.type === 'percent' ? Math.round(subtotal * (coupon.value / 100)) : coupon.value;
    }

    const total = Math.max(0, subtotal - discount);
    const now = new Date().toISOString();
    const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const order = await Order.create({
      userId: req.user.id,
      items: orderItems,
      subtotal, discount, total,
      coupon: coupon || null,
      shipping: shipping || {},
      payment: payment || {},
      status: 'confirmed',
      estimatedDelivery,
      rentalDetails: rentalDetails || null,
      timeline: [{ status: 'confirmed', date: now, description: 'Order placed successfully' }],
    });

    for (const item of items) {
      await Product.updateOne(
        { _id: item.productId, 'inventory.size': item.size },
        { $inc: { 'inventory.$.stock': -item.quantity } }
      );
    }

    res.status(201).json(order.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vendor', vendorOnly, async (req, res) => {
  try {
    const allOrders = await Order.find().sort({ createdAt: -1 }).lean();
    const result = allOrders.filter((o) => o.items.some((item) => item.vendorId === req.user.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
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

    order.status = status;
    order.timeline.push({ status, date: new Date().toISOString(), description: `Order ${status}` });
    await order.save();

    res.json(order.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/return', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (order.status === 'returned') {
      return res.status(400).json({ error: 'Order already returned' });
    }

    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId, 'inventory.size': item.size },
        { $inc: { 'inventory.$.stock': item.quantity } }
      );
    }

    order.status = 'returned';
    order.timeline.push({ status: 'returned', date: new Date().toISOString(), description: 'Return processed, inventory restored' });
    await order.save();

    res.json(order.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
