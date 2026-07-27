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

router.post('/', vendorOnly, async (req, res) => {
  try {
    const { name, price, category, gender, colors, sizes, description, img, rentalAvailable, rentalPricePerDay, images } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const inventory = (sizes || []).map((size) => ({ size, stock: 10 }));

    const product = await Product.create({
      _id: id, name, price, tag: category || '', category: category || '', gender: gender || 'Unisex',
      colors: colors || [], sizes: sizes || [], description: description || '',
      vendorId: req.user.id, img: img || '/assets/dress-hero.png', images: images || [],
      rentalAvailable: !!rentalAvailable, rentalPricePerDay: rentalPricePerDay || 0, inventory,
    });

    res.status(201).json(product.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', vendorOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.user.role !== 'admin' && product.vendorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }

    const { name, price, category, gender, colors, sizes, description, img, images, rentalAvailable, rentalPricePerDay } = req.body;

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

    await product.save();
    res.json(product.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', vendorOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.user.role !== 'admin' && product.vendorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
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

router.put('/:id/stock', vendorOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
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
