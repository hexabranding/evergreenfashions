import { Router } from 'express';
import Product from '../models/Product.js';
import { authMiddleware, optionalAuth, vendorOnly } from '../middleware/auth.js';

const router = Router();

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

    const products = await Product.find(filter).lean();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, vendorOnly, async (req, res) => {
  try {
    const { name, price, category, gender, colors, sizes, description, img, rentalAvailable, rentalPricePerDay, rentalDeposit, images, inventory: requestedInventory, vendorId: bodyVendorId } = req.body;

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

    const product = await Product.create({
      _id: id, name, price, tag: category || '', category: category || '', gender: gender || 'Unisex',
      colors: colors || [], sizes: sizes || [], description: description || '',
      vendorId: (req.user.role === 'admin' && bodyVendorId) ? bodyVendorId : req.user.id,
      img: img || (images?.length ? images[0] : '/assets/dress-hero.png'),
      images: images?.length ? images : [img || '/assets/dress-hero.png'],
      rentalAvailable: !!rentalAvailable,
      rentalPricePerDay: rentalPricePerDay || 0,
      rentalDeposit: rentalDeposit || 100,
      inventory,
    });

    res.status(201).json(product.toObject());
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

    const { name, price, category, gender, colors, sizes, description, img, images, rentalAvailable, rentalPricePerDay, rentalDeposit, vendorId, inventory } = req.body;

    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    if (category !== undefined) { product.category = category; product.tag = category; }
    if (gender !== undefined) product.gender = gender;
    if (colors !== undefined) product.colors = colors;
    if (sizes !== undefined) product.sizes = sizes;
    if (description !== undefined) product.description = description;
    if (img !== undefined) product.img = img;
    if (images !== undefined) product.images = images;
    if (rentalAvailable !== undefined) product.rentalAvailable = rentalAvailable;
    if (rentalPricePerDay !== undefined) product.rentalPricePerDay = rentalPricePerDay;
    if (rentalDeposit !== undefined) product.rentalDeposit = rentalDeposit;
    if (vendorId !== undefined) product.vendorId = vendorId;
    if (inventory !== undefined) product.inventory = inventory;

    await product.save();
    res.json(product.toObject());
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
