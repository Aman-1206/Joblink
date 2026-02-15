import { Router } from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../utils/db.js';
import { generateToken, verifyToken, authMiddleware } from '../utils/auth.js';
import { profilePhotoUpload } from '../utils/upload.js';
import { sendOTPEmail } from '../utils/email.js';

const router = Router();

function getEmailDomain(email) {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Send OTP for registration
router.post('/send-otp', async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ error: 'Email and role required' });
    if (!['student', 'hr'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    const pending = db.prepare('SELECT id FROM hr_pending_approvals WHERE email = ?').get(email);
    if (existing || pending) return res.status(400).json({ error: 'Email already registered or pending' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.prepare('DELETE FROM email_otps WHERE email = ?').run(email);
    db.prepare(`
      INSERT INTO email_otps (email, otp, role, expires_at) VALUES (?, ?, ?, ?)
    `).run(email, otp, role, expiresAt);

    await sendOTPEmail(email, otp);

    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Send OTP error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to send OTP. Check your SMTP settings.' });
  }
});

// Verify OTP and complete registration
router.post('/verify-otp-register', (req, res) => {
  try {
    const { email, otp, password, fullName, phone, companyName } = req.body;
    const role = req.body.role || 'student';

    if (!email || !otp || !password) return res.status(400).json({ error: 'Email, OTP and password required' });

    const row = db.prepare('SELECT * FROM email_otps WHERE email = ? ORDER BY id DESC LIMIT 1').get(email);
    if (!row) return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    if (row.otp !== String(otp)) return res.status(400).json({ error: 'Invalid OTP' });
    if (new Date(row.expires_at) < new Date()) {
      db.prepare('DELETE FROM email_otps WHERE email = ?').run(email);
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }
    if (row.role !== role) return res.status(400).json({ error: 'Role mismatch' });

    db.prepare('DELETE FROM email_otps WHERE email = ?').run(email);

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);

    if (role === 'student') {
      const result = db.prepare(`
        INSERT INTO users (email, password_hash, role, full_name, status)
        VALUES (?, ?, 'student', ?, 'active')
      `).run(email, hash, fullName || '');
      const user = db.prepare('SELECT id, email, role, full_name, status FROM users WHERE id = ?').get(result.lastInsertRowid);
      const token = generateToken(user);
      return res.json({ user, token });
    }

    // HR
    const domain = getEmailDomain(email);
    const companyDomain = db.prepare('SELECT domain, company_name FROM company_domains WHERE domain = ?').get(domain);

    if (companyDomain) {
      const result = db.prepare(`
        INSERT INTO users (email, password_hash, role, full_name, phone, company_name, status)
        VALUES (?, ?, 'hr', ?, ?, ?, 'active')
      `).run(email, hash, fullName || '', phone || '', companyDomain.company_name);
      const user = db.prepare('SELECT id, email, role, full_name, company_name, status FROM users WHERE id = ?').get(result.lastInsertRowid);
      const token = generateToken(user);
      return res.json({ user, token });
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

router.post('/register/student', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, role, full_name, status)
      VALUES (?, ?, 'student', ?, 'active')
    `).run(email, hash, fullName || '');
    const user = db.prepare('SELECT id, email, role, full_name, status FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.json({ user, token: generateToken(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register/hr', async (req, res) => {
  try {
    const { email, password, fullName, phone, companyName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    const pending = db.prepare('SELECT id FROM hr_pending_approvals WHERE email = ?').get(email);
    if (existing || pending) return res.status(400).json({ error: 'Email already registered or pending approval' });
    const domain = getEmailDomain(email);
    const companyDomain = db.prepare('SELECT domain, company_name FROM company_domains WHERE domain = ?').get(domain);
    const hash = bcrypt.hashSync(password, 10);
    if (companyDomain) {
      const result = db.prepare(`
        INSERT INTO users (email, password_hash, role, full_name, phone, company_name, status)
        VALUES (?, ?, 'hr', ?, ?, ?, 'active')
      `).run(email, hash, fullName || '', phone || '', companyDomain.company_name);
      const user = db.prepare('SELECT id, email, role, full_name, company_name, status FROM users WHERE id = ?').get(result.lastInsertRowid);
      return res.json({ user, token: generateToken(user) });
    } else {
      db.prepare(`
        INSERT INTO hr_pending_approvals (email, password_hash, full_name, phone, company_name)
        VALUES (?, ?, ?, ?, ?)
      `).run(email, hash, fullName || '', phone || '', companyName || '');
      return res.status(202).json({ message: 'Your request is pending approval by admins.', pending: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
  }, (accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('No email from Google'));
    let user = db.prepare('SELECT id, email, role, full_name, company_name, status FROM users WHERE email = ?').get(email);
    if (user) {
      db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(profile.id, user.id);
      return done(null, user);
    }
    user = db.prepare('SELECT id, email, role, full_name, company_name, status FROM users WHERE google_id = ?').get(profile.id);
    if (user) return done(null, user);
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, role, full_name, google_id, status)
      VALUES (?, ?, 'student', ?, ?, 'active')
    `).run(email, bcrypt.hashSync(String(Math.random()), 10), profile.displayName || '', profile.id);
    user = db.prepare('SELECT id, email, role, full_name, company_name, status FROM users WHERE id = ?').get(result.lastInsertRowid);
    done(null, user);
  }));

  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=google_failed` }),
    (req, res) => {
      const token = generateToken(req.user);
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    }
  );
}

router.post('/login', (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = db.prepare('SELECT id, email, password_hash, role, full_name, company_name, status FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.password_hash && !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
    if (role && user.role !== role) return res.status(401).json({ error: `Please login as ${user.role}` });
    if (user.status === 'rejected') return res.status(403).json({ error: 'Your account has been rejected' });
    if (user.status === 'pending' && user.role === 'hr') return res.status(403).json({ error: 'Your request is still pending approval' });
    delete user.password_hash;
    res.json({ user, token: generateToken(user) });
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
  const user = db.prepare('SELECT id, email, role, full_name, company_name, profile_photo, status FROM users WHERE id = ?').get(decoded.id);
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json(user);
});

router.put('/profile', authMiddleware, (req, res) => {
  const { fullName } = req.body;
  db.prepare('UPDATE users SET full_name = ? WHERE id = ?').run(fullName ?? '', req.user.id);
  const user = db.prepare('SELECT id, email, role, full_name, company_name, profile_photo, status FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

router.post('/profile/photo', authMiddleware, profilePhotoUpload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const path = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE users SET profile_photo = ? WHERE id = ?').run(path, req.user.id);
  const user = db.prepare('SELECT id, email, role, full_name, company_name, profile_photo, status FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

export default router;
