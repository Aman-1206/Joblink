import { Router } from 'express';
import { db } from '../utils/db.js';
import { authMiddleware } from '../utils/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT job_id FROM saved_jobs WHERE user_id = ?').all(req.user.id);
  res.json(rows.map(r => r.job_id));
});

router.get('/list', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  let jobs = db.prepare(`
    SELECT j.*, u.company_name as hr_company
    FROM saved_jobs s
    JOIN jobs j ON s.job_id = j.id
    LEFT JOIN users u ON j.hr_id = u.id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
  `).all(req.user.id);
  if (q) {
    jobs = jobs.filter(j =>
      (j.title || '').toLowerCase().includes(q) ||
      (j.hr_company || j.company_name || '').toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q) ||
      (j.type || '').toLowerCase().includes(q)
    );
  }
  res.json(jobs);
});

router.post('/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = db.prepare('SELECT id FROM jobs WHERE id = ?').get(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  try {
    db.prepare('INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)').run(req.user.id, jobId);
    res.json({ saved: true });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.json({ saved: true });
    throw e;
  }
});

router.delete('/:jobId', (req, res) => {
  const result = db.prepare('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?')
    .run(req.user.id, req.params.jobId);
  res.json({ saved: false });
});

export default router;
