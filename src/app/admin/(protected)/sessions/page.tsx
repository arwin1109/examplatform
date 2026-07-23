import Link from "next/link";

import { createSessionAction, toggleSessionAction } from "@/app/admin/actions";
import { formatDateTime } from "@/lib/format";
import { getStorageProvider } from "@/lib/storage";

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSessionsPage(
  props: PageProps<"/admin/sessions">,
) {
  const storageProvider = await getStorageProvider();
  const [sessions, questions, searchParams] = await Promise.all([
    storageProvider.getSessions(),
    storageProvider.getQuestions(),
    props.searchParams,
  ]);

  const enabledQuestionCount = questions.filter((question) => question.isEnabled).length;
  const successMessage = getParamValue(searchParams.success);
  const errorMessage = getParamValue(searchParams.error);

  const sortedSessions = [...sessions].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  return (
    <main className="grid gap-6">
      {successMessage ? (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
            Create session
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            Generate a shareable candidate test link
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            There are currently <span className="font-semibold text-[var(--foreground)]">{enabledQuestionCount}</span> enabled questions available for session generation.
          </p>

          <form action={createSessionAction} className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-semibold text-[var(--foreground)]">
                Session title
              </label>
              <input
                id="title"
                name="title"
                required
                className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-deep)]"
                placeholder="Frontend Aptitude Screening"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="sessionId" className="text-sm font-semibold text-[var(--foreground)]">
                Custom session ID
              </label>
              <input
                id="sessionId"
                name="sessionId"
                className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-deep)]"
                placeholder="Optional, auto-generated if empty"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="questionCount" className="text-sm font-semibold text-[var(--foreground)]">
                  Question count
                </label>
                <input
                  id="questionCount"
                  name="questionCount"
                  type="number"
                  min="1"
                  max={Math.max(enabledQuestionCount, 1)}
                  defaultValue={Math.min(Math.max(enabledQuestionCount, 1), 10)}
                  required
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-deep)]"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="timeLimitMinutes" className="text-sm font-semibold text-[var(--foreground)]">
                  Time limit (minutes)
                </label>
                <input
                  id="timeLimitMinutes"
                  name="timeLimitMinutes"
                  type="number"
                  min="1"
                  defaultValue="20"
                  required
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-deep)]"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-3 text-sm text-[var(--foreground)]">
              <input type="checkbox" name="isActive" defaultChecked />
              Activate session immediately after creation
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold !text-white text-white transition hover:bg-[var(--accent)] shadow-md"
            >
              Create session
            </button>
          </form>
        </article>

        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
                Existing sessions
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                {sessions.length} configured sessions
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {sortedSessions.map((session) => (
              <article
                key={session.sessionId}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold text-[var(--foreground)]">{session.title}</p>
                      <span className="rounded-full bg-[var(--mint)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">
                        {session.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                      {session.questionCount} questions · {session.timeLimitMinutes} minutes · created by {session.createdBy}
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Link: <Link href={`/test/${session.sessionId}`} className="font-semibold text-[var(--accent-deep)]">{`/test/${session.sessionId}`}</Link>
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Created {formatDateTime(session.createdAt)}
                    </p>
                  </div>

                  <form action={toggleSessionAction}>
                    <input type="hidden" name="sessionId" value={session.sessionId} />
                    <button
                      type="submit"
                      className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                    >
                      {session.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
