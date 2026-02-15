import { Router } from 'express';
import { db } from '../utils/db.js';
import { authMiddleware } from '../utils/auth.js';
import { upload } from '../utils/upload.js';

const router = Router();

router.post('/', authMiddleware, upload.single('resume'), (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;
    const userId = req.user.id;

    if (!jobId) return res.status(400).json({ error: 'Job ID required' });

    const job = db.prepare('SELECT id FROM jobs WHERE id = ?').get(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const existing = db.prepare('SELECT id FROM applications WHERE job_id = ? AND user_id = ?')
      .get(jobId, userId);
    if (existing) return res.status(400).json({ error: 'Already applied' });

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
    if (user?.role !== 'student') {
      return res.status(403).json({ error: 'Only students can apply for jobs' });
    }

    const resumePath = req.file ? `/uploads/${req.file.filename}` : null;

    const result = db.prepare(`
      INSERT INTO applications (job_id, user_id, resume_path, cover_letter)
      VALUES (?, ?, ?, ?)
    `).run(jobId, userId, resumePath, coverLetter || '');

    const app = db.prepare('SELECT * FROM applications WHERE id = ?')
      .get(result.lastInsertRowid);
    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', authMiddleware, (req, res) => {
  const apps = db.prepare(`
    SELECT a.*, j.title, j.company_name, j.created_at as job_created
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
  `).all(req.user.id);
  res.json(apps);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  if (app.user_id !== req.user.id) return res.status(403).json({ error: 'Can only withdraw your own application' });
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id);
  if (user?.role !== 'student') return res.status(403).json({ error: 'Only students can withdraw applications' });
  db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
  res.json({ message: 'Application withdrawn' });
});

export default router;
