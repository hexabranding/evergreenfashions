import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { authMiddleware, adminOnly, vendorOnly } from '../middleware/auth.js';

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

    let deposit = 0;
    for (const item of items) {
      if (item.isRental) {
        const product = await Product.findById(item.productId).lean();
        deposit += (product?.rentalDeposit || 100) * item.quantity;
      }
    }

    const orderTotal = total + deposit;

    const order = await Order.create({
      userId: req.user.id,
      items: orderItems,
      subtotal,
      deposit,
      depositRefunded: false,
      refundAmount: 0,
      discount,
      total: orderTotal,
      coupon: coupon || null,
      shipping: shipping || {},
      payment: payment || {},
      status: 'confirmed',
      rentalStatus: rentalDetails ? 'active' : 'active',
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

router.get('/admin', authMiddleware, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vendor', authMiddleware, vendorOnly, async (req, res) => {
  try {
    const allOrders = await Order.find().sort({ createdAt: -1 }).lean();
    const vendorProducts = await Product.find({
      $or: [{ vendorId: req.user.id }, { vendorId: 'ef-main' }]
    }).select('_id').lean();
    const vendorProductIds = new Set(vendorProducts.map((p) => p._id));
    const result = allOrders.filter((o) =>
      o.items.some((item) =>
        item.vendorId === req.user.id ||
        item.vendorId === 'ef-main' ||
        vendorProductIds.has(item.productId) ||
        (!item.vendorId && vendorProductIds.size > 0)
      )
    );
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

    if (req.user.role === 'vendor') {
      const ownsItems = order.items.some((item) => item.vendorId === req.user.id || item.vendorId === 'ef-main');
      if (!ownsItems) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }

    const { status } = req.body;
    const validStatuses = ['confirmed', 'processing', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned'];
    const validRentalStatuses = ['active', 'pending_return', 'awaiting_inspection', 'inspected', 'deposit_refunded', 'completed', 'cancelled'];
    const allValid = [...validStatuses, ...validRentalStatuses];
    if (!allValid.includes(status)) {
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

router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (order.status === 'cancelled' || order.status === 'delivered' || order.status === 'returned') {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    const { reason } = req.body;
    order.status = 'cancelled';
    order.timeline.push({ status: 'cancelled', date: new Date().toISOString(), description: reason || 'Order cancelled by customer' });
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

      if (order.rentalDetails && order.status === 'delivered') {
        order.returnRequested = true;
        order.returnRequestedDate = new Date().toISOString();
        order.rentalStatus = 'pending_return';
        order.status = 'delivered';
        order.timeline.push({ status: 'pending_return', date: new Date().toISOString(), description: 'Return requested by customer' });
        await order.save();
        return res.json(order.toObject());
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

  router.post('/:id/inspect', authMiddleware, adminOnly, async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (!order.rentalDetails || order.rentalStatus !== 'pending_return') {
        return res.status(400).json({ error: 'Order is not awaiting inspection' });
      }

      const { inspectionStatus, notes } = req.body;
      const validInspections = ['passed', 'damaged', 'partial_refund'];
      if (!validInspections.includes(inspectionStatus)) {
        return res.status(400).json({ error: 'Invalid inspection status' });
      }

      order.inspectionStatus = inspectionStatus;
      order.inspectedBy = req.user.id;
      order.inspectedAt = new Date().toISOString();
      order.rentalStatus = inspectionStatus === 'passed' ? 'inspected' : 'awaiting_inspection';

      if (inspectionStatus === 'passed') {
        order.depositRefunded = true;
        order.refundAmount = order.deposit;
        order.rentalStatus = 'deposit_refunded';
        order.timeline.push({ status: 'deposit_refunded', date: new Date().toISOString(), description: `Deposit of €${order.deposit} refunded` });
      } else if (inspectionStatus === 'partial_refund') {
        const refundAmount = Math.round(order.deposit * 0.5);
        order.refundAmount = refundAmount;
        order.depositRefunded = true;
        order.rentalStatus = 'deposit_refunded';
        order.timeline.push({ status: 'deposit_refunded', date: new Date().toISOString(), description: `Partial deposit refund of €${refundAmount} (damaged item)` });
      } else {
        order.timeline.push({ status: 'damaged', date: new Date().toISOString(), description: `Item damaged during return. ${notes || 'Deposit forfeited.'}` });
      }

      order.timeline.push({ status: 'inspected', date: new Date().toISOString(), description: `Inspection: ${inspectionStatus}` });
      await order.save();

      res.json(order.toObject());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  export default router;
