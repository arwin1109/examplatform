import Link from "next/link";

import { getStorageProvider } from "@/lib/storage";

const platformFeatures = [
  {
    icon: (
      <svg className="h-6 w-6 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6M9 16h4" />
      </svg>
    ),
    eyebrow: "Dual Storage Engine",
    title: "PostgreSQL & CSV Backend",
    description:
      "Configure your database provider in .env (STORAGE_PROVIDER=postgres or csv) with automatic fallback and seamless live switching.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    eyebrow: "Admin Workspace",
    title: "Multi-Admin Auth & Registration",
    description:
      "Register new admin accounts, manage session tokens, update admin passwords with bcrypt hashing, and control exam parameters.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    eyebrow: "Bulk Question Upload",
    title: "CSV Import & Dynamic Options",
    description:
      "Import question banks with 2, 3, 4, 5+ choices per question. Supports single-column pipe (|) syntax, JSON arrays, and multi-column layouts with template download.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    eyebrow: "Analytics & Export",
    title: "Exam Filtering & CSV Export",
    description:
      "Search candidates by name/email/phone, filter by status or test session, analyze KPI metrics, and export filtered results to CSV.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    eyebrow: "Anti-Cheating Protection",
    title: "Anti-Copy & Screenshot Blur",
    description:
      "Questions cannot be copied or right-clicked. Auto-blur protection triggers if focus is lost or screenshot keys are pressed, stamped with dynamic candidate watermarks.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    eyebrow: "Candidate Experience",
    title: "Timed Assessment Flow",
    description:
      "Candidates get randomized question ordering, auto-saving answer persistence, countdown timer, and immediate completion review.",
  },
];

export default async function Home() {
  const storageProvider = await getStorageProvider();
  const [questions, sessions, attempts, settings] = await Promise.all([
    storageProvider.getQuestions(),
    storageProvider.getSessions(),
    storageProvider.getAttempts(),
    storageProvider.getSettings(),
  ]);

  const enabledQuestionCount = questions.filter((question) => question.isEnabled).length;
  const activeSessions = sessions.filter((session) => session.isActive);
  const envStorageProvider = (process.env.STORAGE_PROVIDER || process.env.DB_PROVIDER || "").trim().toLowerCase();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 sm:px-10 lg:px-12">
      {/* Hero Section */}
      <section className="overflow-hidden rounded-[2.25rem] border border-[var(--line)] bg-[var(--panel-strong)] shadow-[0_18px_60px_rgba(75,85,99,0.12)]">
        <div className="grid gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-14">
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-[var(--accent-deep)]">
                  Accelirate Assessment Platform
                </p>
                <p className="mt-1.5 text-sm font-medium text-[var(--muted)]">
                  Enterprise MCQ Exam Platform with Anti-Cheating & Dual Storage
                </p>
              </div>
              <div className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-900 shadow-xs">
                Production Ready
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="max-w-3xl font-serif text-5xl leading-tight tracking-tight text-[var(--foreground)] sm:text-6xl">
                Secure, fast, and proctored online aptitude testing.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted)]">
                Build question banks with dynamic options, launch candidate test sessions, enforce screenshot & copy protection, and export detailed evaluation analytics—all backed by CSV or PostgreSQL.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-deep)] px-7 py-3.5 text-sm font-semibold !text-white text-white transition-transform duration-200 hover:bg-[var(--accent)] hover:-translate-y-0.5 shadow-md"
              >
                <span>Access Admin Portal</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                href="/admin/register"
                className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white/80 px-7 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-colors duration-200 hover:bg-white shadow-xs"
              >
                Register Admin Account
              </Link>
            </div>
          </div>

          {/* Live System Telemetry Card */}
          <div className="grid gap-4 rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(247,243,234,0.95),rgba(255,255,255,0.85))] p-5 shadow-xs">
            <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/90 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-deep)]">
                  Live System Metrics
                </p>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-[var(--muted)]">Question Bank</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--foreground)]">{questions.length}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--muted)]">Enabled Questions</p>
                  <p className="mt-1 text-3xl font-bold text-emerald-700">{enabledQuestionCount}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--muted)]">Active Sessions</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--accent-deep)]">{activeSessions.length}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--muted)]">Attempts Evaluated</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--foreground)]">{attempts.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--mint)]/65 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--foreground)]">
                Storage Engine Status
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xl font-bold uppercase text-[var(--foreground)]">
                  {settings.storageProvider} Provider
                </p>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-[var(--accent-deep)] uppercase">
                  {envStorageProvider ? `.env: ${envStorageProvider}` : "UI Configured"}
                </span>
              </div>
              {activeSessions.length > 0 ? (
                <div className="mt-4 rounded-2xl bg-white/80 p-3.5 text-xs text-[var(--foreground)]">
                  <p className="font-semibold text-[var(--accent-deep)]">Available Test Link:</p>
                  <Link
                    href={`/test/${activeSessions[0].sessionId}`}
                    className="mt-1 block font-mono font-bold text-slate-800 hover:underline truncate"
                  >
                    /test/{activeSessions[0].sessionId} ({activeSessions[0].title})
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="mt-12">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
            Full Capability Suite
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
            Everything built into the platform
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {platformFeatures.map((feature) => (
            <article
              key={feature.title}
              className="group flex flex-col justify-between rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel)] p-6 transition-all duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_45px_rgba(75,85,99,0.12)]"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--accent-soft)] bg-amber-50/80 transition-transform group-hover:scale-105">
                  {feature.icon}
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent-deep)]">
                  {feature.eyebrow}
                </p>
                <h3 className="mt-2 text-xl font-bold leading-8 text-[var(--foreground)]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Direct Test Sessions Launch Section */}
      {activeSessions.length > 0 ? (
        <section className="mt-12 rounded-[2rem] border border-[var(--line)] bg-[var(--panel-strong)] p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--line)] pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
                Live Assessment Sessions
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--foreground)]">
                Take a Demo Test
              </h2>
            </div>
            <p className="text-xs font-medium text-[var(--muted)]">
              Click any active session below to simulate a proctored candidate attempt
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeSessions.map((session) => (
              <Link
                key={session.sessionId}
                href={`/test/${session.sessionId}`}
                className="group flex flex-col justify-between rounded-[1.5rem] border border-[var(--line)] bg-white/85 p-5 transition hover:border-[var(--accent)] hover:bg-white hover:shadow-md"
              >
                <div>
                  <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
                    Active Session
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--accent-deep)]">
                    {session.title}
                  </h3>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {session.questionCount} Questions • {session.timeLimitMinutes} Minutes Timer
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[var(--accent-deep)]">
                  <span>Start Assessment</span>
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
