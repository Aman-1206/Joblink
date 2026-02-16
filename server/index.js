import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import jobsRoutes from './routes/jobs.js';
import applicationsRoutes from './routes/applications.js';
import adminRoutes from './routes/admin.js';
import hrRoutes from './routes/hr.js';
import savedJobsRoutes from './routes/savedJobs.js';
import reportsRoutes from './routes/reports.js';
import { createUploadDir } from './utils/upload.js';
import passport from 'passport';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '5002', 10);

createUploadDir();

// Run migrations
import('./migrate.js').catch(() => {});

const allowedOrigins = [
  process.env.FRONTEND_URL, // Your Vercel URL (e.g., https://joblink.vercel.app)
  'http://localhost:5173'    // Local development
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy violation'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/saved-jobs', savedJobsRoutes);
app.use('/api/reports', reportsRoutes);

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use. Either:`);
    console.error(`  1. Stop the other process using port ${PORT}`);
    console.error(`  2. Or set PORT=5002 (or another port) in .env and update client/vite.config.js proxy target\n`);
    process.exit(1);
  }
  throw err;
});
