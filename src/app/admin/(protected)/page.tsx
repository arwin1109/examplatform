import Link from "next/link";

import { formatDateTime, formatStatusLabel } from "@/lib/format";
import { getStorageProvider } from "@/lib/storage";

export default async function AdminDashboardPage() {
  const storageProvider = await getStorageProvider();
  const [questions, sessions, attempts, emailConfigs, settings] = await Promise.all([
    storageProvider.getQuestions(),
    storageProvider.getSessions(),
    storageProvider.getAttempts(),
    storageProvider.getEmailConfigs(),
    storageProvider.getSettings(),
  ]);

  const enabledQuestions = questions.filter((q) => q.isEnabled).length;
  const disabledQuestions = questions.length - enabledQuestions;
  const activeSessions = sessions.filter((s) => s.isActive);
  const inactiveSessions = sessions.filter((s) => !s.isActive);
  const completedAttempts = attempts.filter(
    (a) => a.status === "completed" || a.status === "timed_out",
  );
  const inProgressAttempts = attempts.filter((a) => a.status === "in_progress");
  const endedEarlyAttempts = attempts.filter((a) => a.status === "ended_early");
  const timedOutAttempts = attempts.filter((a) => a.status === "timed_out");

  // Calculate average score
  const scoredAttempts = completedAttempts.filter((a) => a.score !== null);
  const averageScore =
    scoredAttempts.length > 0
      ? (
          scoredAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0) /
          scoredAttempts.length
        ).toFixed(1)
      : "—";
  const averagePercentage =
    scoredAttempts.length > 0
      ? (
          (scoredAttempts.reduce(
            (sum, a) => sum + ((a.score ?? 0) / a.totalQuestions) * 100,
            0,
          ) /
            scoredAttempts.length)
        ).toFixed(0)
      : null;

  // Category distribution
  const categoryMap = new Map<string, number>();
  for (const q of questions) {
    categoryMap.set(q.category, (categoryMap.get(q.category) ?? 0) + 1);
  }
  const topCategories = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Latest attempts
  const latestAttempts = [...attempts]
    .sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )
    .slice(0, 8);

  // Difficulty distribution
  const difficultyMap = { easy: 0, medium: 0, hard: 0 };
  for (const q of questions) {
    difficultyMap[q.difficulty] = (difficultyMap[q.difficulty] ?? 0) + 1;
  }

  const envStorageProvider = (
    process.env.STORAGE_PROVIDER ||
    process.env.DB_PROVIDER ||
    ""
  )
    .trim()
    .toLowerCase();

  return (
    <main className="grid gap-6">
      {/* ── Primary Metrics Row ─────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Question Bank",
            value: String(questions.length),
            sub: `${enabledQuestions} enabled · ${disabledQuestions} disabled`,
            color: "text-[var(--foreground)]",
            icon: (
              <svg className="h-5 w-5 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            label: "Active Sessions",
            value: String(activeSessions.length),
            sub: `${inactiveSessions.length} inactive · ${sessions.length} total`,
            color: "text-emerald-700",
            icon: (
              <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ),
          },
          {
            label: "Total Attempts",
            value: String(attempts.length),
            sub: `${completedAttempts.length} completed · ${inProgressAttempts.length} in progress`,
            color: "text-[var(--accent-deep)]",
            icon: (
              <svg className="h-5 w-5 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
          },
          {
            label: "Average Score",
            value: averagePercentage ? `${averagePercentage}%` : "—",
            sub: scoredAttempts.length > 0 ? `Avg ${averageScore} pts · ${scoredAttempts.length} scored` : "No scored attempts yet",
            color: "text-[var(--foreground)]",
            icon: (
              <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            ),
          },
        ].map((card) => (
          <article
            key={card.label}
            className="group rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-[0_12px_40px_rgba(99,102,110,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(99,102,110,0.14)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--muted)]">{card.label}</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50/80 border border-[var(--accent-soft)]">
                {card.icon}
              </div>
            </div>
            <p className={`mt-3 text-4xl font-semibold ${card.color}`}>{card.value}</p>
            <p className="mt-2 text-xs text-[var(--muted)]">{card.sub}</p>
          </article>
        ))}
      </section>

      {/* ── Secondary Metrics Row ───────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Email Accounts", value: String(emailConfigs.length), badge: "Outlook" },
          { label: "Ended Early", value: String(endedEarlyAttempts.length), badge: "Candidates" },
          { label: "Timed Out", value: String(timedOutAttempts.length), badge: "Auto-expired" },
          {
            label: "Storage Engine",
            value: settings.storageProvider.toUpperCase(),
            badge: envStorageProvider ? `.env: ${envStorageProvider}` : "UI Configured",
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-[1.25rem] border border-[var(--line)] bg-white/85 p-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[var(--muted)]">{item.label}</p>
              <span className="rounded-full bg-amber-50 border border-[var(--accent-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent-deep)] uppercase">
                {item.badge}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{item.value}</p>
          </article>
        ))}
      </section>

      {/* ── Main Content Grid ───────────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Question Bank Breakdown */}
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
                Question Bank Breakdown
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Distribution by category & difficulty
              </p>
            </div>
            <Link
              href="/admin/questions"
              className="text-sm font-semibold text-[var(--accent-deep)] hover:underline"
            >
              Manage
            </Link>
          </div>

          {/* Difficulty Bar */}
          <div className="mt-5 rounded-2xl border border-[var(--line)] bg-white/80 p-4">
            <p className="text-xs font-semibold text-[var(--foreground)] mb-3">Difficulty Distribution</p>
            <div className="flex gap-3">
              {[
                { label: "Easy", count: difficultyMap.easy, color: "bg-emerald-500" },
                { label: "Medium", count: difficultyMap.medium, color: "bg-amber-500" },
                { label: "Hard", count: difficultyMap.hard, color: "bg-red-500" },
              ].map((d) => (
                <div key={d.label} className="flex-1">
                  <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-1.5">
                    <span>{d.label}</span>
                    <span className="font-semibold text-[var(--foreground)]">{d.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${d.color} transition-all duration-500`}
                      style={{
                        width: questions.length > 0 ? `${(d.count / questions.length) * 100}%` : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Categories */}
          <div className="mt-4 grid gap-2">
            {topCategories.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-[var(--line)] bg-white/70 px-4 py-5 text-sm text-[var(--muted)]">
                No questions in the bank yet. Add questions to see distribution.
              </div>
            ) : (
              topCategories.map(([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white/80 px-4 py-3"
                >
                  <span className="text-sm font-medium text-[var(--foreground)]">{category}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent-deep)] transition-all duration-500"
                        style={{
                          width: `${(count / questions.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[var(--muted)] w-8 text-right">{count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        {/* Recent Attempts */}
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
                Recent Attempts
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Latest candidate assessment activity
              </p>
            </div>
            <Link
              href="/admin/results"
              className="text-sm font-semibold text-[var(--accent-deep)] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {latestAttempts.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-[var(--line)] bg-white/70 px-4 py-5 text-sm text-[var(--muted)]">
                No candidate attempts yet. Share a session link to start collecting results.
              </div>
            ) : (
              latestAttempts.map((attempt) => (
                <div
                  key={attempt.attemptId}
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4 transition-colors hover:bg-white"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{attempt.name}</p>
                      <p className="text-xs text-[var(--muted)]">{attempt.email}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        attempt.status === "completed"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : attempt.status === "in_progress"
                          ? "bg-blue-50 text-blue-800 border border-blue-200"
                          : attempt.status === "timed_out"
                          ? "bg-red-50 text-red-800 border border-red-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          attempt.status === "completed"
                            ? "bg-emerald-500"
                            : attempt.status === "in_progress"
                            ? "bg-blue-500 animate-pulse"
                            : attempt.status === "timed_out"
                            ? "bg-red-500"
                            : "bg-amber-500"
                        }`}
                      />
                      {formatStatusLabel(attempt.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Started {formatDateTime(attempt.startedAt)} · Score{" "}
                    <span className="font-semibold text-[var(--foreground)]">
                      {attempt.score ?? "—"}
                    </span>{" "}
                    / {attempt.totalQuestions}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      {/* ── Active Sessions & Quick Actions ─────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Active Test Sessions */}
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
                Active Test Sessions
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Currently available candidate test links
              </p>
            </div>
            <Link
              href="/admin/sessions"
              className="text-sm font-semibold text-[var(--accent-deep)] hover:underline"
            >
              Manage
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {activeSessions.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-[var(--line)] bg-white/70 px-4 py-5 text-sm text-[var(--muted)]">
                No active test sessions. Create a session to generate candidate links.
              </div>
            ) : (
              activeSessions.slice(0, 5).map((session) => (
                <div
                  key={session.sessionId}
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4 transition-colors hover:bg-white"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="font-semibold text-[var(--foreground)]">{session.title}</p>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {session.questionCount} Questions · {session.timeLimitMinutes} Minutes
                      </p>
                    </div>
                    <Link
                      href={`/test/${session.sessionId}`}
                      className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--accent-deep)] transition-colors hover:bg-amber-50"
                    >
                      Preview Link
                    </Link>
                  </div>
                  <p className="mt-2 font-mono text-xs text-[var(--muted)] truncate">
                    /test/{session.sessionId}
                  </p>
                </div>
              ))
            )}
            {activeSessions.length > 5 && (
              <p className="text-center text-xs text-[var(--muted)] pt-1">
                +{activeSessions.length - 5} more active sessions
              </p>
            )}
          </div>
        </article>

        {/* Quick Actions */}
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
            Quick Actions
          </p>
          <div className="mt-5 grid gap-3">
            {[
              {
                href: "/admin/questions",
                title: "Manage Question Bank",
                description: "Create, update, bulk import, enable, disable, and delete MCQs.",
                icon: (
                  <svg className="h-5 w-5 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                href: "/admin/sessions",
                title: "Create Candidate Sessions",
                description: "Generate timed test links and control active session states.",
                icon: (
                  <svg className="h-5 w-5 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
              },
              {
                href: "/admin/results",
                title: "Review Outcomes",
                description: "See attempt scores, statuses, and session-level performance.",
                icon: (
                  <svg className="h-5 w-5 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
              },
              {
                href: "/admin/settings",
                title: "Platform Settings",
                description: "Configure storage engine, email accounts, and admin credentials.",
                icon: (
                  <svg className="h-5 w-5 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-start gap-4 rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4 transition-all hover:bg-white hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--accent-soft)] bg-amber-50/80 transition-transform group-hover:scale-105">
                  {action.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-deep)]">
                    {action.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
