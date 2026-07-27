import { Router } from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { authMiddleware, vendorOnly, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' }).select('-password').lean();
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' }).select('-password').lean();
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const products = await Product.find({ vendorId: req.params.id }).select('_id name price category img').lean();
    vendor.products = products;

    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/stats', vendorOnly, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const products = await Product.find({ vendorId: req.params.id }).select('_id price').lean();
    const productIds = products.map((p) => p._id);
    const totalProducts = products.length;

    let totalSales = 0;
    let totalRevenue = 0;

    const vendor = await User.findById(req.params.id).lean();
    const commission = vendor?.vendorStore?.commission || 15;

    if (productIds.length > 0) {
      const allOrders = await Order.find().lean();
      for (const order of allOrders) {
        for (const item of order.items) {
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
      pendingPayout: totalEarnings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/commission', authMiddleware, adminOnly, async (req, res) => {
  try {
    const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const { commission } = req.body;
    if (commission === undefined || commission < 0 || commission > 100) {
      return res.status(400).json({ error: 'Valid commission rate (0-100) is required' });
    }

    vendor.vendorStore = vendor.vendorStore || {};
    vendor.vendorStore.commission = commission;
    await vendor.save();

    res.json({ message: 'Commission updated', commission });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/payout', vendorOnly, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const products = await Product.find({ vendorId: req.params.id }).select('_id price').lean();
    const productIds = products.map((p) => p._id);

    let totalRevenue = 0;
    if (productIds.length > 0) {
      const allOrders = await Order.find().lean();
      for (const order of allOrders) {
        for (const item of order.items) {
          if (productIds.includes(item.productId)) {
            totalRevenue += item.price * item.quantity;
          }
        }
      }
    }

    const vendor = await User.findById(req.params.id).lean();
    const commission = vendor?.vendorStore?.commission || 15;
    const payoutAmount = Math.round(totalRevenue * (1 - commission / 100));

    const payout = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      vendorId: req.params.id,
      amount: payoutAmount,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    res.status(201).json(payout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
