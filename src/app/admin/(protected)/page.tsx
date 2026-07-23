import Link from "next/link";

import { formatDateTime, formatStatusLabel } from "@/lib/format";
import { getStorageProvider } from "@/lib/storage";

export default async function AdminOverviewPage() {
  const storageProvider = await getStorageProvider();
  const [questions, sessions, attempts, settings] = await Promise.all([
    storageProvider.getQuestions(),
    storageProvider.getSessions(),
    storageProvider.getAttempts(),
    storageProvider.getSettings(),
  ]);

  const enabledQuestions = questions.filter((question) => question.isEnabled).length;
  const activeSessions = sessions.filter((session) => session.isActive).length;
  const completedAttempts = attempts.filter(
    (attempt) => attempt.status === "completed" || attempt.status === "timed_out",
  ).length;
  const latestAttempts = [...attempts]
    .sort(
      (left, right) =>
        new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime(),
    )
    .slice(0, 5);

  return (
    <main className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total questions", value: String(questions.length) },
          { label: "Enabled questions", value: String(enabledQuestions) },
          { label: "Active sessions", value: String(activeSessions) },
          { label: "Completed attempts", value: String(completedAttempts) },
        ].map((card) => (
          <article
            key={card.label}
            className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-[0_12px_40px_rgba(99,102,110,0.08)]"
          >
            <p className="text-sm text-[var(--muted)]">{card.label}</p>
            <p className="mt-3 text-4xl font-semibold text-[var(--foreground)]">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
            Quick actions
          </p>
          <div className="mt-5 grid gap-3">
            {[
              {
                href: "/admin/questions",
                title: "Manage question bank",
                description: "Create, update, bulk import, enable, disable, and delete MCQs.",
              },
              {
                href: "/admin/sessions",
                title: "Create candidate sessions",
                description: "Generate timed test links and control active session states.",
              },
              {
                href: "/admin/results",
                title: "Review outcomes",
                description: "See attempt scores, statuses, and session-level performance.",
              },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4 transition-colors hover:bg-white"
              >
                <p className="text-base font-semibold text-[var(--foreground)]">{action.title}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{action.description}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
                Recent attempts
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Active storage provider: <span className="font-semibold text-[var(--foreground)]">{settings.storageProvider}</span>
              </p>
            </div>
            <Link href="/admin/results" className="text-sm font-semibold text-[var(--accent-deep)]">
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
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{attempt.name}</p>
                      <p className="text-sm text-[var(--muted)]">{attempt.email}</p>
                    </div>
                    <p className="text-sm font-semibold capitalize text-[var(--accent-deep)]">
                      {formatStatusLabel(attempt.status)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    Started {formatDateTime(attempt.startedAt)} · Score {attempt.score ?? "-"} / {attempt.totalQuestions}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
