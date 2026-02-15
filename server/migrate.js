import { db } from './utils/db.js';

// Add profile_photo to users if not exists
try {
  const info = db.prepare('PRAGMA table_info(users)').all();
  const hasPhoto = info.some((c) => c.name === 'profile_photo');
  if (!hasPhoto) {
    db.exec('ALTER TABLE users ADD COLUMN profile_photo TEXT');
    console.log('Added profile_photo column to users');
  }
} catch (e) {
  console.warn('Migration skipped:', e.message);
}

// Add saved_jobs table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      job_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      UNIQUE(user_id, job_id)
    );
    CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON saved_jobs(user_id);
  `);
} catch (e) {
  console.warn('Migration saved_jobs:', e.message);
}
