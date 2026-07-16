import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDb, queryAll, queryOne, run, saveDb } from '../db.js';
import { authMiddleware, vendorOnly } from '../middleware/auth.js';

const router = Router();

router.get('/product/:productId', async (req, res) => {
  try {
    await getDb();
    const reviews = queryAll('SELECT * FROM reviews WHERE productId = ? ORDER BY date DESC', [req.params.productId]);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    await getDb();
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ error: 'Product ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const product = queryOne('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const user = queryOne('SELECT firstName, lastName FROM users WHERE id = ?', [req.user.id]);
    const id = randomUUID();
    const now = new Date().toISOString();

    run(
      'INSERT INTO reviews (id, productId, userId, userName, rating, comment, date, vendorReply) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, productId, req.user.id, `${user.firstName} ${user.lastName}`, rating, comment || '', now, null]
    );
    saveDb();

    const review = queryOne('SELECT * FROM reviews WHERE id = ?', [id]);
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/reply', vendorOnly, async (req, res) => {
  try {
    await getDb();
    const review = queryOne('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const { reply } = req.body;
    if (!reply) {
      return res.status(400).json({ error: 'Reply is required' });
    }

    run('UPDATE reviews SET vendorReply = ? WHERE id = ?', [reply, req.params.id]);
    saveDb();

    const updated = queryOne('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
