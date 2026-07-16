import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getDb, queryOne, run, saveDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'evergreen-fashion-secret-key-2026';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    await getDb();
    const { firstName, lastName, email, password, phone } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    run(
      'INSERT INTO users (id, firstName, lastName, email, password, role, phone, addresses, vendorStore, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, firstName, lastName, email, hashedPassword, 'customer', phone || null, '[]', null, now]
    );
    saveDb();

    const user = { id, firstName, lastName, email, role: 'customer', phone: phone || null };
    const token = generateToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    await getDb();
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    await getDb();
    const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    userWithoutPassword.addresses = JSON.parse(userWithoutPassword.addresses || '[]');
    if (userWithoutPassword.vendorStore) {
      userWithoutPassword.vendorStore = JSON.parse(userWithoutPassword.vendorStore);
    }
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/me', authMiddleware, async (req, res) => {
  try {
    await getDb();
    const { firstName, lastName, phone } = req.body;

    const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    run('UPDATE users SET firstName = ?, lastName = ?, phone = ? WHERE id = ?',
      [firstName || user.firstName, lastName || user.lastName, phone ?? user.phone, req.user.id]);
    saveDb();

    const updated = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const { password, ...userWithoutPassword } = updated;
    userWithoutPassword.addresses = JSON.parse(userWithoutPassword.addresses || '[]');
    if (userWithoutPassword.vendorStore) {
      userWithoutPassword.vendorStore = JSON.parse(userWithoutPassword.vendorStore);
    }
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/me/addresses', authMiddleware, async (req, res) => {
  try {
    await getDb();
    const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const addresses = JSON.parse(user.addresses || '[]');
    const newAddress = { id: randomUUID(), ...req.body };
    addresses.push(newAddress);

    run('UPDATE users SET addresses = ? WHERE id = ?', [JSON.stringify(addresses), req.user.id]);
    saveDb();

    res.status(201).json(newAddress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/me/addresses/:id', authMiddleware, async (req, res) => {
  try {
    await getDb();
    const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const addresses = JSON.parse(user.addresses || '[]');
    const filtered = addresses.filter((a) => a.id !== req.params.id);
    if (filtered.length === addresses.length) {
      return res.status(404).json({ error: 'Address not found' });
    }

    run('UPDATE users SET addresses = ? WHERE id = ?', [JSON.stringify(filtered), req.user.id]);
    saveDb();

    res.json({ message: 'Address removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
