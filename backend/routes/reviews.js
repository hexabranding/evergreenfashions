import { Router } from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { authMiddleware, vendorOnly } from '../middleware/auth.js';

const router = Router();

router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 }).lean();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ error: 'Product ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const user = await User.findById(req.user.id);
    const review = await Review.create({
      productId,
      userId: req.user.id,
      userName: `${user.firstName} ${user.lastName}`,
      rating,
      comment: comment || '',
    });

    res.status(201).json(review.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/reply', vendorOnly, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const { reply } = req.body;
    if (!reply) {
      return res.status(400).json({ error: 'Reply is required' });
    }

    review.vendorReply = reply;
    await review.save();

    res.json(review.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
