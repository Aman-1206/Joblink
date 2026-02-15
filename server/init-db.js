import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'joblink.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS company_domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'hr', 'admin')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'pending', 'rejected')),
    full_name TEXT,
    phone TEXT,
    company_name TEXT,
    profile_photo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS hr_pending_approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    company_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hr_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    company_name TEXT NOT NULL,
    location TEXT,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hr_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    resume_path TEXT,
    cover_letter TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(job_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_company_domains_domain ON company_domains(domain);
  CREATE INDEX IF NOT EXISTS idx_jobs_hr ON jobs(hr_id);
  CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);

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

// Seed famous company domains
const domains = [
  ['google.com', 'Google'],
  ['apple.com', 'Apple'],
  ['microsoft.com', 'Microsoft'],
  ['amazon.com', 'Amazon'],
  ['meta.com', 'Meta'],
  ['netflix.com', 'Netflix'],
  ['tesla.com', 'Tesla'],
  ['nvidia.com', 'NVIDIA'],
  ['adobe.com', 'Adobe'],
  ['salesforce.com', 'Salesforce'],
  ['oracle.com', 'Oracle'],
  ['ibm.com', 'IBM'],
  ['intel.com', 'Intel'],
  ['spotify.com', 'Spotify'],
  ['uber.com', 'Uber'],
  ['airbnb.com', 'Airbnb'],
  ['stripe.com', 'Stripe'],
  ['slack.com', 'Slack'],
  ['zoom.us', 'Zoom'],
  ['linkedin.com', 'LinkedIn'],
  ['twitter.com', 'Twitter/X'],
  ['github.com', 'GitHub'],
  ['dropbox.com', 'Dropbox'],
  ['paypal.com', 'PayPal'],
  ['vmware.com', 'VMware'],
  ['cisco.com', 'Cisco'],
  ['qualcomm.com', 'Qualcomm'],
  ['broadcom.com', 'Broadcom'],
  ['atlassian.com', 'Atlassian'],
  ['shopify.com', 'Shopify'],
];

const insertDomain = db.prepare('INSERT OR IGNORE INTO company_domains (domain, company_name) VALUES (?, ?)');
domains.forEach(([domain, company]) => insertDomain.run(domain, company));

// Create default admin (password: admin123)
import bcrypt from 'bcryptjs';
const adminHash = bcrypt.hashSync('admin123', 10);
db.prepare(`
  INSERT OR IGNORE INTO users (email, password_hash, role, full_name) 
  VALUES (?, ?, 'admin', 'Admin')
`).run('admin@joblink.com', adminHash);

console.log('Database initialized successfully!');
db.close();
