import { Router } from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { authMiddleware, optionalAuth, vendorOnly, adminOnly } from '../middleware/auth.js';

const router = Router();

export async function computeProductStatsMap() {
  const orders = await Order.find({ status: { $nin: ['cancelled'] } }).lean();
  const statsMap = {};

  orders.forEach((order) => {
    if (order.status === 'cancelled' || order.rentalStatus === 'cancelled') return;
    const isOrderRental = Boolean(order.rentalDetails);

    (order.items || []).forEach((item) => {
      const pId = String(item.productId || '').trim();
      const pName = String(item.name || '').trim().toLowerCase();

      const uniqueKeys = [...new Set([pId, pName].filter(Boolean))];
      uniqueKeys.forEach((key) => {
        if (!statsMap[key]) {
          statsMap[key] = {
            orders: 0,
            unitsSold: 0,
            revenue: 0,
            totalRentals: 0,
            activeRentals: 0,
            totalRentalRevenue: 0,
          };
        }
      });

      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const isRental = Boolean(item.isRental || item.rentalDetails || isOrderRental);

      uniqueKeys.forEach((key) => {
        const s = statsMap[key];
        s.orders += 1;
        s.unitsSold += qty;
        s.revenue += price * qty;

        if (isRental) {
          s.totalRentals += 1;
          if (order.status === 'active' || order.rentalStatus === 'active') {
            s.activeRentals += 1;
          }
          const rentalPrice = Number(item.price) || 0;
          s.totalRentalRevenue += rentalPrice * qty;
        }
      });
    });
  });

  return statsMap;
}

export async function attachProductStats(products) {
  if (!products || products.length === 0) return products;
  const statsMap = await computeProductStatsMap();

  return products.map((prod) => {
    const pId = String(prod._id || prod.id || '').trim();
    const pName = String(prod.name || '').trim().toLowerCase();
    const stat = statsMap[pId] || statsMap[pName] || {
      orders: 0,
      unitsSold: 0,
      revenue: 0,
      totalRentals: 0,
      activeRentals: 0,
      totalRentalRevenue: 0,
    };
    return {
      ...prod,
      stats: stat,
    };
  });
}

router.get('/', optionalAuth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.category) filter.category = req.query.category;
    if (req.query.gender) filter.gender = req.query.gender;
    if (req.query.vendorId) filter.vendorId = req.query.vendorId;
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    // Approval status filtering:
    if (req.query.approvalStatus) {
      filter.approvalStatus = req.query.approvalStatus;
    } else if (!req.user || req.user.role === 'customer') {
      // Public / customer can only see approved products
      filter.approvalStatus = 'approved';
    } else if (req.user.role === 'vendor') {
      if (req.query.vendorId && req.query.vendorId !== req.user.id) {
        // Vendor viewing another vendor's products: approved only
        filter.approvalStatus = 'approved';
      } else if (req.query.vendorId === req.user.id) {
        // Vendor viewing strictly their own store: see all statuses (pending, approved, rejected)
      } else {
        // Vendor viewing catalogue: show all approved products PLUS the vendor's own products in any status
        const visibilityFilter = {
          $or: [
            { approvalStatus: 'approved' },
            { vendorId: req.user.id },
          ],
        };
        if (filter.$or) {
          const searchClause = { $or: filter.$or };
          delete filter.$or;
          filter.$and = [searchClause, visibilityFilter];
        } else {
          filter.$or = visibilityFilter.$or;
        }
      }
    }
    // Admins can see all statuses when not explicitly filtered

    const products = await Product.find(filter).lean();
    const enriched = await attachProductStats(products);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/order-stats', async (req, res) => {
  try {
    const statsMap = await computeProductStatsMap();
    res.json(statsMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const [enriched] = await attachProductStats([product]);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/view', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ views: product.views || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, vendorOnly, async (req, res) => {
  try {
    const { name, price, category, gender, colors, sizes, description, img, rentalAvailable, rentalPricePerDay, rentalDeposit, images, colorImages, inventory: requestedInventory, vendorId: bodyVendorId } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    if (!img && !(images?.length)) return res.status(400).json({ error: 'At least one product image is required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let id = slug;
    const existing = await Product.findById(id).lean();
    if (existing) {
      id = `${slug}-${Date.now()}`;
    }
    const inventory = Array.isArray(requestedInventory) && requestedInventory.length
      ? requestedInventory
      : (sizes || []).map((size) => ({ size, stock: 10 }));

    const isVendor = req.user.role === 'vendor';
    const approvalStatus = isVendor ? 'pending' : (req.body.approvalStatus || 'approved');

    const product = await Product.create({
      _id: id, name, price, tag: category || '', category: category || '', gender: gender || 'Unisex',
      colors: colors || [], sizes: sizes || [], description: description || '',
      vendorId: (req.user.role === 'admin' && bodyVendorId) ? bodyVendorId : req.user.id,
      img: img || (images?.length ? images[0] : '/assets/dress-hero.png'),
      images: images?.length ? images : [img || '/assets/dress-hero.png'],
      colorImages: colorImages || {},
      rentalAvailable: !!rentalAvailable,
      rentalPricePerDay: rentalPricePerDay || 0,
      rentalDeposit: rentalDeposit || 100,
      inventory,
      approvalStatus,
    });

    const [enriched] = await attachProductStats([product.toObject()]);
    res.status(201).json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, vendorOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, price, category, gender, colors, sizes, description, img, images, colorImages, rentalAvailable, rentalPricePerDay, rentalDeposit, vendorId, inventory } = req.body;

    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    if (category !== undefined) { product.category = category; product.tag = category; }
    if (gender !== undefined) product.gender = gender;
    if (colors !== undefined) product.colors = colors;
    if (sizes !== undefined) product.sizes = sizes;
    if (description !== undefined) product.description = description;
    if (img !== undefined) product.img = img;
    if (images !== undefined) product.images = images;
    if (colorImages !== undefined) product.colorImages = colorImages;
    if (rentalAvailable !== undefined) product.rentalAvailable = rentalAvailable;
    if (rentalPricePerDay !== undefined) product.rentalPricePerDay = rentalPricePerDay;
    if (rentalDeposit !== undefined) product.rentalDeposit = rentalDeposit;
    if (vendorId !== undefined) product.vendorId = vendorId;
    if (inventory !== undefined) product.inventory = inventory;

    await product.save();
    const [enriched] = await attachProductStats([product.toObject()]);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/approval', authMiddleware, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { status, reason } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid approval status. Must be approved, rejected, or pending.' });
    }

    product.approvalStatus = status;
    if (reason !== undefined) product.approvalReason = reason;
    product.approvedBy = req.user.id;
    product.approvedAt = new Date().toISOString();

    await product.save();
    const [enriched] = await attachProductStats([product.toObject()]);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, vendorOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/stock', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product.inventory || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/stock', authMiddleware, vendorOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { stock } = req.body;
    if (!stock || !Array.isArray(stock)) {
      return res.status(400).json({ error: 'Stock array is required' });
    }

    for (const item of stock) {
      const existing = product.inventory.find((i) => i.size === item.size);
      if (existing) {
        existing.stock = item.stock;
      } else {
        product.inventory.push({ size: item.size, stock: item.stock });
      }
    }

    await product.save();
    res.json(product.inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
