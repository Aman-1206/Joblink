# JobLink - LinkedIn-Inspired Job Platform

A job platform where **Students** browse and apply for jobs, and **HR/Recruiters** post jobs and manage applications. HR registration is validated against official company email domains.

## Features

- **Students**: Create account, browse jobs, apply with resume, track applications
- **HR**: Register with official company email (e.g. `hr@google.com`). If domain is in our database → instant approval. Otherwise → pending admin approval
- **Admin**: Approve/reject HR requests, add company domains to the whitelist
- **HR Dashboard**: Create jobs, view all jobs, see applications with resume links (view resume without opening full application)
- **Admin Dashboard**: Manage pending HR approvals, add new company domains

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Initialize database

```bash
cd server && node init-db.js
```

### 3. Start development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Default Admin Login

- Email: `admin@joblink.com`
- Password: `admin123`

### Testing HR Registration

**Instant approval** (domain in database): Use `hr@google.com`, `hr@microsoft.com`, etc.  
**Pending approval**: Use `hr@yourstartup.com` or any domain not in the seeded list.

## Tech Stack

- **Frontend**: React, Vite, React Router
- **Backend**: Node.js, Express
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT

## Project Structure

```
l1/
├── client/          # React frontend
│   └── src/
│       ├── pages/   # Login, Register, Jobs, HR Dashboard, Admin
│       └── components/
├── server/          # Express API
│   ├── routes/      # auth, jobs, applications, admin, hr
│   └── init-db.js   # Database setup + seed company domains
└── package.json
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| POST /api/auth/register/student | Student registration |
| POST /api/auth/register/hr | HR registration (domain-checked) |
| POST /api/auth/login | Login |
| GET /api/jobs | List all jobs |
| GET /api/jobs/:id | Job detail |
| POST /api/applications | Apply (student, with resume) |
| GET /api/hr/my-jobs | HR's jobs |
| POST /api/hr/jobs | Create job |
| GET /api/hr/jobs/:id/applications | Applications for a job |
| GET /api/admin/pending-hr | Pending HR requests |
| POST /api/admin/approve-hr/:id | Approve HR |
| POST /api/admin/reject-hr/:id | Reject HR |
| GET/POST /api/admin/company-domains | List/add domains |
