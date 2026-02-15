import { Router } from 'express';
import { db } from '../utils/db.js';
import { authMiddleware } from '../utils/auth.js';

const router = Router();

router.get('/', (req, res) => {
  const jobs = db.prepare(`
    SELECT j.*, u.company_name as hr_company
    FROM jobs j
    LEFT JOIN users u ON j.hr_id = u.id
    ORDER BY j.created_at DESC
  `).all();
  res.json(jobs);
});

router.get('/:id', (req, res) => {
  const job = db.prepare(`
    SELECT j.*, u.company_name as hr_company, u.email as hr_email
    FROM jobs j
    LEFT JOIN users u ON j.hr_id = u.id
    WHERE j.id = ?
  `).get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

export default router;
