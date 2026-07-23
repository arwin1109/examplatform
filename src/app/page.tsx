import Link from "next/link";

import { getStorageProvider } from "@/lib/storage";

const platformFeatures = [
  {
    icon: (
      <svg className="h-6 w-6 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
    ),
    eyebrow: "Targeted Assessment Pools",
    title: "Category & Topic Filter Modal",
    description:
      "Select specific question categories (Frontend, Backend, Database, Algorithms, Aptitude) and topics during session creation with real-time question availability counters.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    eyebrow: "Bulk Question Management",
    title: "Multi-Select Question Actions",
    description:
      "Select multiple questions using search & category filters, and apply bulk Enable, Disable, or Permanent Delete operations at once.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    eyebrow: "Link Security & Expiration",
    title: "Automatic Link Expiration",
    description:
      "Test session links automatically expire once a candidate completes, ends early, or times out their test, or if deactivated by admin.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    eyebrow: "Bulk Candidate Import",
    title: "CSV Bulk Link Generation",
    description:
      "Create test links for multiple candidates at once by importing candidate CSVs, complete with a downloadable CSV template button with icon.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    eyebrow: "Outlook Integration",
    title: "Microsoft Graph Email Delivery",
    description:
      "Configure multiple Outlook email credentials (Client Credentials & Delegated ROPC) in Settings with live API connection testing.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    eyebrow: "Email Customization",
    title: "Single & Bulk Candidate Emails",
    description:
      "Send invitations directly to single candidates or bulk CSV imports with customizable subject and body placeholders ({candidate_name}, {test_link}).",
  },
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
      "Configure your database provider in .env (STORAGE_PROVIDER=postgres or csv) with automatic fallback and seamless live switching in settings.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    eyebrow: "Anti-Cheating Protection",
    title: "Anti-Copy & Proctored Shield",
    description:
      "Questions cannot be copied or right-clicked. Auto-blur protection triggers if focus is lost, stamped with dynamic candidate watermarks.",
  },
];

export default async function Home() {
  const storageProvider = await getStorageProvider();
  const [questions, sessions, attempts, emailConfigs, settings] = await Promise.all([
    storageProvider.getQuestions(),
    storageProvider.getSessions(),
    storageProvider.getAttempts(),
    storageProvider.getEmailConfigs(),
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
                  Enterprise MCQ Exam Platform with Outlook Automation & Link Expiration
                </p>
              </div>
              <div className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-900 shadow-xs">
                Production Ready
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="max-w-3xl font-serif text-5xl leading-tight tracking-tight text-[var(--foreground)] sm:text-6xl">
                Secure, fast, and automated candidate aptitude testing.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted)]">
                Create candidate test links in bulk via CSV, send automated invitation emails using Outlook Graph API, enforce automatic link expiration, and evaluate results—all backed by CSV or PostgreSQL.
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
                href="/admin/sessions"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-7 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-colors duration-200 hover:bg-white shadow-xs"
              >
                <span>Create Candidate Links</span>
                <svg className="h-4 w-4 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
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
                  <p className="text-xs font-medium text-[var(--muted)]">Outlook Mail Accounts</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--foreground)]">{emailConfigs.length}</p>
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
                  <p className="font-semibold text-[var(--accent-deep)]">Available Active Test Link:</p>
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

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                <h3 className="mt-2 text-lg font-bold leading-7 text-[var(--foreground)]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
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
                Take an Active Candidate Test
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
