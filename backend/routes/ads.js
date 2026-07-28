import { Router } from 'express';
import Ad from '../models/Ad.js';
import { authMiddleware, vendorOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.active === 'true') filter.active = true;
    if (req.query.vendorId) filter.vendorId = req.query.vendorId;
    const ads = await Ad.find(filter).sort({ createdAt: -1 }).lean();
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vendor/:vendorId', authMiddleware, vendorOnly, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.vendorId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const ads = await Ad.find({ vendorId: req.params.vendorId }).sort({ createdAt: -1 }).lean();
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, vendorOnly, async (req, res) => {
  try {
    const { title, subtitle, type, position, image, link, buttonText, startDate, endDate } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!image) return res.status(400).json({ error: 'An advertisement image is required' });

    const ad = await Ad.create({
      title, subtitle, type: type || 'banner', position: position || 'homepage',
      image: image || '', link: link || '', buttonText: buttonText || 'Shop Now',
      vendorId: req.user.role === 'vendor' ? req.user.id : null,
      startDate, endDate,
    });
    res.status(201).json(ad.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });

    if (req.user.role !== 'admin' && ad.vendorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { title, subtitle, type, position, image, link, buttonText, active, startDate, endDate } = req.body;
    if (title !== undefined) ad.title = title;
    if (subtitle !== undefined) ad.subtitle = subtitle;
    if (type !== undefined) ad.type = type;
    if (position !== undefined) ad.position = position;
    if (image !== undefined) ad.image = image;
    if (link !== undefined) ad.link = link;
    if (buttonText !== undefined) ad.buttonText = buttonText;
    if (active !== undefined) ad.active = active;
    if (startDate !== undefined) ad.startDate = startDate;
    if (endDate !== undefined) ad.endDate = endDate;
    await ad.save();

    res.json(ad.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });

    if (req.user.role !== 'admin' && ad.vendorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Ad.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ad deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
