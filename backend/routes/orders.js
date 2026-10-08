                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { authMiddleware, adminOnly, vendorOnly } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../public/uploads');

const MAX_RETURN_PHOTOS = 6;
const MAX_PHOTO_CHARS = 9 * 1024 * 1024;

async function persistPhoto(photo) {
  if (typeof photo !== 'string' || photo.length === 0) return null;
  if (!photo.startsWith('data:')) {
    return /^(\/uploads\/[\w.-]+|https?:\/\/)/i.test(photo) ? photo : null;
  }

  const match = photo.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,/i);
  if (!match) return null;
  if (photo.length > MAX_PHOTO_CHARS) return null;

  const ext = match[1].toLowerCase().includes('png') ? 'png' : match[1].toLowerCase().includes('webp') ? 'webp' : 'jpg';
  const buffer = Buffer.from(photo.split(',')[1], 'base64');
  const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 16);
  const filename = `return-${hash}.${ext}`;
  const target = path.join(uploadsDir, filename);

  try {
    await fs.access(target);
    return `/uploads/${filename}`;
  } catch {
    /* not saved yet */
  }

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(target, buffer);
  return `/uploads/${filename}`;
}

async function storeReturnPhotos(order, photos) {
  const cleaned = (Array.isArray(photos) ? photos : []).filter((p) => typeof p === 'string' && p.trim()).slice(0, MAX_RETURN_PHOTOS);
  const stored = [];
  for (const photo of cleaned) {
    const saved = await persistPhoto(photo);
    if (saved) stored.push(saved);
  }
  return [...new Set([...(order.returnPhotos || []), ...stored])].slice(0, MAX_RETURN_PHOTOS);
}

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
        isRental: !!item.isRental,
        rentalDetails: item.rentalDetails || null,
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

    let customerName = '';
    let customerEmail = '';
    try {
      const customer = await User.findById(req.user.id).lean();
      if (customer) {
        customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ');
        customerEmail = customer.email || '';
      }
    } catch { /* user lookup failed, continue without */ }
    if (!customerName && shipping) {
      customerName = [shipping.firstName, shipping.lastName].filter(Boolean).join(' ');
      customerEmail = shipping.email || '';
    }

    const orderId = `order-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const order = await Order.create({
      _id: orderId,
      userId: req.user.id,
      customerName,
      customerEmail,
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
      estimatedDelivery,
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
    const userIds = [...new Set(orders.map((o) => o.userId).filter(Boolean))];
    const users = userIds.length > 0
      ? await User.find({ _id: { $in: userIds } }).lean()
      : [];
    const userMap = {};
    users.forEach((u) => { userMap[u._id] = u; });
    const enriched = orders.map((o) => {
      const name = o.customerName || (() => {
        const u = userMap[o.userId];
        return u ? [u.firstName, u.lastName].filter(Boolean).join(' ') : '';
      })();
      const email = o.customerEmail || (userMap[o.userId]?.email || '');
      return { ...o, customerName: name, customerEmail: email };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vendor', authMiddleware, vendorOnly, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { 'items.vendorId': req.user.id };
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    const userIds = [...new Set(orders.map((o) => o.userId).filter(Boolean))];
    const users = userIds.length > 0
      ? await User.find({ _id: { $in: userIds } }).lean()
      : [];
    const userMap = {};
    users.forEach((u) => { userMap[u._id] = u; });
    const enriched = orders.map((o) => {
      const name = o.customerName || (() => {
        const u = userMap[o.userId];
        return u ? [u.firstName, u.lastName].filter(Boolean).join(' ') : '';
      })();
      const email = o.customerEmail || (userMap[o.userId]?.email || '');
      return { ...o, customerName: name, customerEmail: email };
    });
    res.json(enriched);
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

    const { status, rentalStatus } = req.body;
    const validStatuses = ['confirmed', 'processing', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned', 'return_requested'];
    const validRentalStatuses = ['active', 'pending_return', 'awaiting_inspection', 'inspected', 'deposit_refunded', 'completed', 'cancelled'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (rentalStatus && !validRentalStatuses.includes(rentalStatus)) {
      return res.status(400).json({ error: 'Invalid rental status' });
    }

    if (status) {
      order.status = status;
      order.timeline.push({ status, date: new Date().toISOString(), description: `Order ${status}` });
    }

    if (rentalStatus) {
      order.rentalStatus = rentalStatus;
      order.timeline.push({ status: rentalStatus, date: new Date().toISOString(), description: `Rental status: ${rentalStatus}` });
    }

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

      if (order.status === 'returned' || order.status === 'return_requested') {
        return res.status(400).json({ error: 'Order already returned or return requested' });
      }

      if (order.status !== 'delivered') {
        return res.status(400).json({ error: 'Only delivered orders can be returned' });
      }

      const { reason, photos } = req.body;
      const returnPhotos = await storeReturnPhotos(order, photos);
      const now = new Date().toISOString();

      if (order.rentalDetails) {
        order.returnRequested = true;
        order.returnRequestedDate = now;
        order.returnReason = reason || '';
        order.returnPhotos = returnPhotos;
        order.returnPhotosDate = returnPhotos.length > 0 ? now : undefined;
        order.rentalStatus = 'pending_return';
        order.status = 'delivered';
        order.timeline.push({ status: 'pending_return', date: now, description: reason || 'Return requested by customer' });
        await order.save();
        return res.json(order.toObject());
      }

      order.returnRequested = true;
      order.returnRequestedDate = now;
      order.returnReason = reason || '';
      order.returnPhotos = returnPhotos;
      order.returnPhotosDate = returnPhotos.length > 0 ? now : undefined;
      order.status = 'return_requested';
      order.timeline.push({ status: 'return_requested', date: now, description: reason || 'Return requested by customer' });
      await order.save();

      res.json(order.toObject());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:id/return-photos', authMiddleware, async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }

      if (!order.returnRequested && order.status !== 'return_requested') {
        return res.status(400).json({ error: 'Return has not been requested for this order yet' });
      }

      if (order.status === 'returned') {
        return res.status(400).json({ error: 'Return already confirmed' });
      }

      const { photos } = req.body;
      if (!photos || !Array.isArray(photos) || photos.length === 0) {
        return res.status(400).json({ error: 'At least one photo is required' });
      }

      const before = order.returnPhotos?.length || 0;
      order.returnPhotos = await storeReturnPhotos(order, photos);
      order.returnPhotosDate = new Date().toISOString();

      if (order.returnPhotos.length > before) {
        order.returnPhotosReviewed = false;
        order.timeline.push({
          status: 'return_photos',
          date: order.returnPhotosDate,
          description: `${order.returnPhotos.length - before} return item photo(s) uploaded by customer`,
        });
      }

      await order.save();
      res.json(order.toObject());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:id/confirm-return', authMiddleware, async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'vendor') {
        return res.status(403).json({ error: 'Not authorized' });
      }

      if (order.status !== 'return_requested') {
        return res.status(400).json({ error: 'Order is not pending return confirmation' });
      }

      if (!order.returnPhotos || order.returnPhotos.length === 0) {
        return res.status(400).json({ error: 'Customer has not uploaded return item photos yet' });
      }

      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.productId, 'inventory.size': item.size },
          { $inc: { 'inventory.$.stock': item.quantity } }
        );
      }

      order.status = 'returned';
      order.returnPhotosReviewed = true;
      order.timeline.push({ status: 'returned', date: new Date().toISOString(), description: 'Return photos reviewed and confirmed, inventory restored' });
      await order.save();

      res.json(order.toObject());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:id/inspect', authMiddleware, async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'vendor') {
        return res.status(403).json({ error: 'Not authorized' });
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
      if (order.returnPhotos?.length) order.returnPhotosReviewed = true;
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
