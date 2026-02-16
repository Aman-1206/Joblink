import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../utils/db.js';
import { authMiddleware, roleMiddleware } from '../utils/auth.js';

const router = Router();
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/pending-hr', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  let pending = db.prepare(`
    SELECT id, email, full_name, phone, company_name, gst_number, created_at
    FROM hr_pending_approvals
    ORDER BY created_at DESC
  `).all();
  if (q) {
    pending = pending.filter(p =>
      (p.email || '').toLowerCase().includes(q) ||
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.company_name || '').toLowerCase().includes(q) ||
      (p.gst_number || '').toLowerCase().includes(q)
    );
  }
  res.json(pending);
});

router.post('/verify-gst/:id', (req, res) => {
  const hr = db.prepare('SELECT id FROM users WHERE id = ? AND role = ?').get(req.params.id, 'hr');
  if (!hr) return res.status(404).json({ error: 'HR not found' });
  db.prepare('UPDATE users SET gst_verified = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'GST verified' });
});

router.post('/approve-hr/:id', (req, res) => {
  const pending = db.prepare('SELECT * FROM hr_pending_approvals WHERE id = ?')
    .get(req.params.id);

  if (!pending) return res.status(404).json({ error: 'Request not found' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(pending.email);
  if (existing) {
    db.prepare('DELETE FROM hr_pending_approvals WHERE id = ?').run(req.params.id);
    return res.status(400).json({ error: 'User already registered' });
  }

  db.prepare(`
    INSERT INTO users (email, password_hash, role, full_name, phone, company_name, gst_number, gst_verified, status)
    VALUES (?, ?, 'hr', ?, ?, ?, ?, ?, 'active')
  `).run(pending.email, pending.password_hash, pending.full_name, pending.phone, pending.company_name, pending.gst_number || null, 0);

  db.prepare('DELETE FROM hr_pending_approvals WHERE id = ?').run(req.params.id);

  res.json({ message: 'HR approved successfully' });
});

router.post('/reject-hr/:id', (req, res) => {
  const result = db.prepare('DELETE FROM hr_pending_approvals WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Request not found' });
  res.json({ message: 'HR request rejected' });
});

router.get('/company-domains', (req, res) => {
  const domains = db.prepare('SELECT * FROM company_domains ORDER BY company_name').all();
  res.json(domains);
});

router.post('/company-domains', (req, res) => {
  const { domain, companyName } = req.body;
  if (!domain || !companyName) return res.status(400).json({ error: 'Domain and company name required' });

  try {
    const result = db.prepare('INSERT INTO company_domains (domain, company_name) VALUES (?, ?)')
      .run(domain.toLowerCase().replace(/^www\./, ''), companyName);
    res.status(201).json({ id: result.lastInsertRowid, domain, company_name: companyName });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Domain already exists' });
    throw e;
  }
});

router.get('/analytics', (req, res) => {
  const companies = db.prepare('SELECT COUNT(DISTINCT company_name) as c FROM users WHERE role = ? AND company_name IS NOT NULL AND company_name != ?').get('hr', '');
  const hrCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('hr');
  const studentCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('student');
  const jobCount = db.prepare('SELECT COUNT(*) as c FROM jobs').get();
  const adminCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('admin');
  res.json({
    companies: companies?.c ?? 0,
    hrCount: hrCount?.c ?? 0,
    studentCount: studentCount?.c ?? 0,
    jobCount: jobCount?.c ?? 0,
    adminCount: adminCount?.c ?? 0,
  });
});

router.get('/jobs', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  let jobs = db.prepare(`
    SELECT j.*, u.company_name as hr_company, u.email as hr_email,
      (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as application_count
    FROM jobs j
    LEFT JOIN users u ON j.hr_id = u.id
    ORDER BY j.created_at DESC
  `).all();
  if (q) {
    jobs = jobs.filter(j =>
      (j.title || '').toLowerCase().includes(q) ||
      (j.company_name || j.hr_company || '').toLowerCase().includes(q) ||
      (j.hr_email || '').toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q)
    );
  }
  res.json(jobs);
});

router.delete('/jobs/:id', (req, res) => {
  db.prepare('DELETE FROM applications WHERE job_id = ?').run(req.params.id);
  db.prepare('DELETE FROM job_reports WHERE job_id = ?').run(req.params.id);
  const result = db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Job not found' });
  res.json({ message: 'Job deleted' });
});

router.get('/reports', (req, res) => {
  const reports = db.prepare(`
    SELECT r.*, j.title as job_title, j.company_name, j.hr_id,
           u_reporter.full_name as reporter_name, u_reporter.email as reporter_email,
           u_hr.email as hr_email, u_hr.full_name as hr_name, u_hr.company_name as hr_company
    FROM job_reports r
    JOIN jobs j ON r.job_id = j.id
    LEFT JOIN users u_reporter ON r.user_id = u_reporter.id
    LEFT JOIN users u_hr ON j.hr_id = u_hr.id
    ORDER BY r.created_at DESC
  `).all();
  res.json(reports);
});

router.delete('/reports/:id', (req, res) => {
  const result = db.prepare('DELETE FROM job_reports WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Report not found' });
  res.json({ message: 'Report dismissed' });
});

router.get('/hrs', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  let hrs = db.prepare(`
    SELECT id, email, full_name, company_name, gst_number, gst_verified, created_at
    FROM users WHERE role = 'hr' ORDER BY created_at DESC
  `).all();
  if (q) {
    hrs = hrs.filter(h =>
      (h.email || '').toLowerCase().includes(q) ||
      (h.full_name || '').toLowerCase().includes(q) ||
      (h.company_name || '').toLowerCase().includes(q) ||
      (h.gst_number || '').toLowerCase().includes(q)
    );
  }
  res.json(hrs);
});

router.get('/students', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  let students = db.prepare(`
    SELECT id, email, full_name, created_at
    FROM users WHERE role = 'student' ORDER BY created_at DESC
  `).all();
  if (q) {
    students = students.filter(s =>
      (s.email || '').toLowerCase().includes(q) ||
      (s.full_name || '').toLowerCase().includes(q)
    );
  }
  res.json(students);
});

router.get('/companies', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  let companies = db.prepare(`
    SELECT DISTINCT company_name, COUNT(*) as hr_count
    FROM users WHERE role = 'hr' AND company_name IS NOT NULL AND company_name != ''
    GROUP BY company_name ORDER BY company_name
  `).all();
  if (q) {
    companies = companies.filter(c =>
      (c.company_name || '').toLowerCase().includes(q)
    );
  }
  res.json(companies);
});

router.post('/add-admin', (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Email already registered' });
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (email, password_hash, role, full_name, status)
    VALUES (?, ?, 'admin', ?, 'active')
  `).run(email, hash, fullName || '');
  const user = db.prepare('SELECT id, email, role, full_name FROM users WHERE id = ?').get(result.lastInsertRowid);
  delete user?.password_hash;
  res.status(201).json({ message: 'Admin added', user });
});

export default router;
