# Accelirate Exam Platform

CSV-first MCQ testing platform built with Next.js 16, TypeScript, App Router, and Tailwind CSS.

## What is implemented

- Admin login with local email/password authentication
- Protected admin dashboard routes
- Question bank CRUD with enable/disable and bulk import
- Test session creation with shareable candidate links
- Candidate onboarding form and timed one-question-at-a-time exam flow
- Attempt capture, answer persistence, scoring, and results dashboard
- CSV-backed storage provider with PostgreSQL-ready scaffold
- Settings page with visible backend selection controls

## Routes

### Public

- `/`
- `/test/[sessionId]`

### Admin

- `/admin/login`
- `/admin`
- `/admin/questions`
- `/admin/sessions`
- `/admin/results`
- `/admin/settings`

## Local admin credentials

Default credentials for local development:

- Username / Email: `admin`
- Password: `Admin@260723`

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
