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

export default router;
