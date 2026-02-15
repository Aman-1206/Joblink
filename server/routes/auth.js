import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../utils/db.js';
import { generateToken, verifyToken, authMiddleware } from '../utils/auth.js';
import { profilePhotoUpload } from '../utils/upload.js';

const router = Router();

function getEmailDomain(email) {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

router.post('/register/student', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, role, full_name, status)
      VALUES (?, ?, 'student', ?, 'active')
    `).run(email, hash, fullName || '');

    const user = db.prepare('SELECT id, email, role, full_name, status FROM users WHERE id = ?')
      .get(result.lastInsertRowid);
    const token = generateToken(user);

    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register/hr', async (req, res) => {
  try {
    const { email, password, fullName, phone, companyName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    const pending = db.prepare('SELECT id FROM hr_pending_approvals WHERE email = ?').get(email);
    if (existing || pending) {
      return res.status(400).json({ error: 'Email already registered or pending approval' });
    }

    const domain = getEmailDomain(email);
    const companyDomain = db.prepare(
      'SELECT domain, company_name FROM company_domains WHERE domain = ?'
    ).get(domain);

    const hash = bcrypt.hashSync(password, 10);

    if (companyDomain) {
      const result = db.prepare(`
        INSERT INTO users (email, password_hash, role, full_name, phone, company_name, status)
        VALUES (?, ?, 'hr', ?, ?, ?, 'active')
      `).run(email, hash, fullName || '', phone || '', companyDomain.company_name);

      const user = db.prepare('SELECT id, email, role, full_name, company_name, status FROM users WHERE id = ?')
        .get(result.lastInsertRowid);
      const token = generateToken(user);

      return res.json({ user, token, message: 'Registration successful' });
    } else {
      db.prepare(`
        INSERT INTO hr_pending_approvals (email, password_hash, full_name, phone, company_name)
        VALUES (?, ?, ?, ?, ?)
      `).run(email, hash, fullName || '', phone || '', companyName || '');

      return res.status(202).json({
        message: 'Your request is pending approval by admins. We will contact you via email or phone to verify your identity.',
        pending: true,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.prepare(
      'SELECT id, email, password_hash, role, full_name, company_name, status FROM users WHERE email = ?'
    ).get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (role && user.role !== role) {
      return res.status(401).json({ error: `Please login as ${user.role}` });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ error: 'Your account has been rejected' });
    }

    if (user.status === 'pending' && user.role === 'hr') {
      return res.status(403).json({ error: 'Your request is still pending approval' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    delete user.password_hash;
    const token = generateToken(user);

    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });

  const user = db.prepare(
    'SELECT id, email, role, full_name, company_name, profile_photo, status FROM users WHERE id = ?'
  ).get(decoded.id);
  if (!user) return res.status(401).json({ error: 'User not found' });

  res.json(user);
});

router.put('/profile', authMiddleware, (req, res) => {
  const { fullName } = req.body;
  db.prepare('UPDATE users SET full_name = ? WHERE id = ?').run(fullName ?? '', req.user.id);
  const user = db.prepare(
    'SELECT id, email, role, full_name, company_name, profile_photo, status FROM users WHERE id = ?'
  ).get(req.user.id);
  res.json(user);
});

router.post('/profile/photo', authMiddleware, profilePhotoUpload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const path = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE users SET profile_photo = ? WHERE id = ?').run(path, req.user.id);
  const user = db.prepare(
    'SELECT id, email, role, full_name, company_name, profile_photo, status FROM users WHERE id = ?'
  ).get(req.user.id);
  res.json(user);
});

export default router;
