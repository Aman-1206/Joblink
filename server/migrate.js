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

// Add job_reports table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reason TEXT,
      proof_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_job_reports_job ON job_reports(job_id);
  `);
} catch (e) {
  console.warn('Migration job_reports:', e.message);
}

// Add email_otps table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      otp TEXT NOT NULL,
      role TEXT NOT NULL,
      payload TEXT,
      expires_at DATETIME NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
  `);
} catch (e) {
  console.warn('Migration email_otps:', e.message);
}

// Add google_id to users
try {
  const info = db.prepare('PRAGMA table_info(users)').all();
  if (!info.some((c) => c.name === 'google_id')) {
    db.exec('ALTER TABLE users ADD COLUMN google_id TEXT');
  }
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL');
} catch (e) {
  console.warn('Migration google_id:', e.message);
}

// Add gst_number and gst_verified to users
try {
  const info = db.prepare('PRAGMA table_info(users)').all();
  if (!info.some((c) => c.name === 'gst_number')) {
    db.exec('ALTER TABLE users ADD COLUMN gst_number TEXT');
  }
  if (!info.some((c) => c.name === 'gst_verified')) {
    db.exec('ALTER TABLE users ADD COLUMN gst_verified INTEGER DEFAULT 0');
  }
} catch (e) {
  console.warn('Migration gst users:', e.message);
}

// Add gst_number to hr_pending_approvals
try {
  const info = db.prepare('PRAGMA table_info(hr_pending_approvals)').all();
  if (!info.some((c) => c.name === 'gst_number')) {
    db.exec('ALTER TABLE hr_pending_approvals ADD COLUMN gst_number TEXT');
  }
} catch (e) {
  console.warn('Migration gst hr_pending:', e.message);
}
