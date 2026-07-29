import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'evergreen-fashion-secret-key-2026';
const phoneOtps = new Map();

function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, role, vendorStore } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userRole = (role === 'vendor') ? 'vendor' : 'customer';
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      firstName, lastName, email, password: hashedPassword,
      role: userRole, phone: phone || null, addresses: [],
    };
    if (userRole === 'vendor') {
      userData.vendorStore = {
        name: vendorStore?.name || `${firstName} ${lastName}`,
        description: vendorStore?.description || '',
        commission: vendorStore?.commission || 15,
      };
    }
    const user = await User.create(userData);

    const token = generateToken(user);
    const { password: _, ...userObj } = user.toObject();
    res.status(201).json({ token, user: userObj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    const { password: _, ...userObj } = user.toObject();
    res.json({ token, user: userObj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/phone-otp/request', async (req, res) => {
  const phone = String(req.body.phone || '').trim();
  if (phone.replace(/\D/g, '').length < 7) return res.status(400).json({ error: 'A valid phone number is required' });
  const otp = process.env.NODE_ENV === 'production' ? String(Math.floor(100000 + Math.random() * 900000)) : '123456';
  phoneOtps.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  // Connect an SMS provider here in production. OTP values are only returned in development.
  res.json({ message: 'OTP sent', ...(process.env.NODE_ENV !== 'production' ? { developmentOtp: otp } : {}) });
});

router.post('/phone-otp/verify', async (req, res) => {
  const phone = String(req.body.phone || '').trim();
  const otp = String(req.body.otp || '').trim();
  const record = phoneOtps.get(phone);
  if (!record || record.expiresAt < Date.now() || record.otp !== otp) return res.status(401).json({ error: 'Invalid or expired OTP' });
  phoneOtps.delete(phone);
  let user = await User.findOne({ phone });
  if (!user) user = await User.create({ _id: `phone-${Date.now().toString(36)}`, firstName: 'Customer', lastName: '', email: `${phone.replace(/\D/g, '')}@phone.evergreen.local`, password: await bcrypt.hash(`${Date.now()}-${phone}`, 10), role: 'customer', phone, addresses: [] });
  const { password: _, ...userObj } = user.toObject();
  res.json({ token: generateToken(user), user: userObj });
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password, ...userObj } = user.toObject();
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone, vendorStore } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (vendorStore && user.role === 'vendor') {
      user.vendorStore = {
        ...user.vendorStore?.toObject?.(),
        name: vendorStore.name ?? user.vendorStore?.name,
        description: vendorStore.description ?? user.vendorStore?.description,
        commission: vendorStore.commission ?? user.vendorStore?.commission,
      };
    }
    await user.save();

    const { password, ...userObj } = user.toObject();
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/me/addresses', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newAddress = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), ...req.body };
    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json(newAddress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/me/addresses/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const idx = user.addresses.findIndex((a) => a.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Address not found' });
    }

    user.addresses.splice(idx, 1);
    await user.save();
    res.json({ message: 'Address removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register-vendor', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName, lastName, email, password: hashedPassword,
      role: 'vendor', phone: null, addresses: [],
      vendorStore: { name: `${firstName} ${lastName}`, description: '', commission: 15 },
    });

    const { password: _, ...userObj } = user.toObject();
    res.status(201).json(userObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register-customer', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName, lastName, email, password: hashedPassword,
      role: 'customer', phone: phone || null, addresses: [],
    });

    const { password: _, ...userObj } = user.toObject();
    res.status(201).json(userObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { firstName, lastName, email, role, phone, vendorStore } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (vendorStore && user.role === 'vendor') {
      user.vendorStore = {
        ...user.vendorStore?.toObject?.(),
        name: vendorStore.name ?? user.vendorStore?.name,
        description: vendorStore.description ?? user.vendorStore?.description,
        commission: vendorStore.commission ?? user.vendorStore?.commission,
      };
    }
    await user.save();

    const { password, ...userObj } = user.toObject();
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/reset-password', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin users' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Admin accounts cannot be self-deleted' });
    }

    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
