import { Router } from 'express';
import { db } from '../utils/db.js';
import { authMiddleware } from '../utils/auth.js';
import { reportProofUpload } from '../utils/upload.js';

const router = Router();

router.post('/', authMiddleware, reportProofUpload.single('proof'), (req, res) => {
  try {
    const { jobId, reason } = req.body;
    const userId = req.user.id;
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
    if (user?.role !== 'student') return res.status(403).json({ error: 'Only students can report jobs' });
    if (!jobId) return res.status(400).json({ error: 'Job ID required' });
    const job = db.prepare('SELECT id FROM jobs WHERE id = ?').get(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const proofPath = req.file ? `/uploads/${req.file.filename}` : null;
    const result = db.prepare(`
      INSERT INTO job_reports (job_id, user_id, reason, proof_path)
      VALUES (?, ?, ?, ?)
    `).run(jobId, userId, reason || '', proofPath);
    const report = db.prepare('SELECT * FROM job_reports WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
