import { Router } from 'express';
import { db } from '../utils/db.js';
import { authMiddleware, roleMiddleware } from '../utils/auth.js';

const router = Router();
router.use(authMiddleware);
router.use(roleMiddleware('hr'));

router.get('/my-jobs', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  let jobs = db.prepare(`
    SELECT j.*, 
      (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as application_count
    FROM jobs j
    WHERE j.hr_id = ?
    ORDER BY j.created_at DESC
  `).all(req.user.id);
  if (q) {
    jobs = jobs.filter(j =>
      (j.title || '').toLowerCase().includes(q) ||
      (j.company_name || '').toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q) ||
      (j.type || '').toLowerCase().includes(q)
    );
  }
  res.json(jobs);
});

router.post('/jobs', (req, res) => {
  const { title, description, companyName, location, type } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const hr = db.prepare('SELECT company_name FROM users WHERE id = ?').get(req.user.id);
  const company = companyName || hr?.company_name || 'Company';

  const result = db.prepare(`
    INSERT INTO jobs (hr_id, title, description, company_name, location, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.id, title, description || '', company, location || '', type || 'Full-time');

  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(job);
});

router.put('/jobs/:id', (req, res) => {
  const job = db.prepare('SELECT id FROM jobs WHERE hr_id = ? AND id = ?')
    .get(req.user.id, req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const { title, description, companyName, location, type } = req.body;
  db.prepare(`
    UPDATE jobs SET title = ?, description = ?, company_name = ?, location = ?, type = ?
    WHERE id = ?
  `).run(title ?? '', description ?? '', companyName ?? '', location ?? '', type ?? '', req.params.id);

  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/jobs/:id', (req, res) => {
  const result = db.prepare('DELETE FROM jobs WHERE hr_id = ? AND id = ?')
    .run(req.user.id, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Job not found' });
  res.json({ message: 'Job deleted' });
});

router.get('/all-applicants', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  let applicants = db.prepare(`
    SELECT a.id, a.status, a.created_at, a.job_id,
           u.full_name, u.email,
           j.title as job_title, j.company_name
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN users u ON a.user_id = u.id
    WHERE j.hr_id = ?
    ORDER BY a.created_at DESC
  `).all(req.user.id);
  if (q) {
    applicants = applicants.filter(a =>
      (a.full_name || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.job_title || '').toLowerCase().includes(q) ||
      (a.company_name || '').toLowerCase().includes(q)
    );
  }
  res.json(applicants);
});

router.get('/jobs/:jobId/applications', (req, res) => {
  const job = db.prepare('SELECT id FROM jobs WHERE hr_id = ? AND id = ?')
    .get(req.user.id, req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const q = (req.query.q || '').trim().toLowerCase();
  let applications = db.prepare(`
    SELECT a.id, a.cover_letter, a.resume_path, a.status, a.created_at,
           u.full_name, u.email
    FROM applications a
    JOIN users u ON a.user_id = u.id
    WHERE a.job_id = ?
    ORDER BY a.created_at DESC
  `).all(req.params.jobId);
  if (q) {
    applications = applications.filter(a =>
      (a.full_name || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.cover_letter || '').toLowerCase().includes(q)
    );
  }
  res.json(applications);
});

router.patch('/applications/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['pending', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be pending, accepted or rejected' });
  }
  const app = db.prepare('SELECT a.id FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.id = ? AND j.hr_id = ?')
    .get(req.params.id, req.user.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  res.json(updated);
});

export default router;
