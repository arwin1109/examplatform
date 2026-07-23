# Exam Platform

CSV-first MCQ testing platform built with Next.js 16, TypeScript, App Router, and Tailwind CSS.

## What is implemented

- Admin login with local email/password authentication
- Protected admin routes with comprehensive **Dashboard** after login
- Dashboard metrics: question bank stats, active sessions, total attempts, average scores, difficulty/category distribution, recent attempts, storage engine status, email accounts
- Question bank CRUD with enable/disable, bulk import, and multi-select actions
- Test session creation with shareable candidate links and category/topic filters
- Candidate onboarding form and timed one-question-at-a-time exam flow
- Attempt capture, answer persistence, scoring, and results dashboard
- CSV-backed storage provider with PostgreSQL-ready scaffold
- Settings page with storage backend, Outlook email configs, and admin credentials
- Static public landing page (no live metrics exposed publicly)

## Routes

### Public

- `/` — Static marketing/feature page with admin login link
- `/test/[sessionId]` — Candidate test entry

### Admin (protected)

- `/admin/login` — Admin authentication
- `/admin` — **Dashboard** with all platform metrics
- `/admin/questions` — Question bank management
- `/admin/sessions`
- `/admin/results`
- `/admin/settings`

## Local admin credentials

You can override these with environment variables:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_PASSWORD_HASH`
- `JWT_SECRET`

## Storage

CSV files live in the `data/` directory:

- `questions.csv`
- `sessions.csv`
- `attempts.csv`
- `attempt-answers.csv`
- `settings.csv`

The active implementation is CSV. PostgreSQL remains scaffolded but intentionally falls back to CSV until a real provider is added.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`. If port `3000` is busy, Next.js will move to the next available port and print the exact URL in the terminal.

## Validation

Implemented validation completed on Wednesday, July 22, 2026:

- `npm run lint`
- `npm run build`

Manual browser walkthroughs are still recommended for final UX verification.
