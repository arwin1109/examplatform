import Link from "next/link";

import { toggleSessionAction } from "@/app/admin/actions";
import { formatDateTime } from "@/lib/format";
import { getStorageProvider } from "@/lib/storage";
import { SessionTabs } from "./session-tabs";

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSessionsPage(
  props: PageProps<"/admin/sessions">,
) {
  const storageProvider = await getStorageProvider();
  const [sessions, questions, emailConfigs, searchParams] = await Promise.all([
    storageProvider.getSessions(),
    storageProvider.getQuestions(),
    storageProvider.getEmailConfigs(),
    props.searchParams,
  ]);

  const enabledQuestionCount = questions.filter((question) => question.isEnabled).length;
  const successMessage = getParamValue(searchParams.success);
  const errorMessage = getParamValue(searchParams.error);
  const noticeMessage = getParamValue(searchParams.notice);

  const sortedSessions = [...sessions].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  return (
    <main className="grid gap-6">
      {/* Alert Banners */}
      {successMessage ? (
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-medium text-emerald-900 shadow-sm">
          <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      ) : null}

      {noticeMessage ? (
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm font-medium text-amber-900 shadow-sm">
          <svg className="h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {noticeMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-5 py-3.5 text-sm font-medium text-rose-900 shadow-sm">
          <svg className="h-5 w-5 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
        {/* Left Panel: Test Session Creation (Bulk & Single Tabs) */}
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
              Session Creation Workspace
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
              Generate Candidate Test Links
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              <span className="font-semibold text-[var(--foreground)]">{enabledQuestionCount}</span> enabled questions available for session generation.
            </p>
          </div>

          <SessionTabs
            enabledQuestionCount={enabledQuestionCount}
            emailConfigs={emailConfigs}
          />
        </article>

        {/* Right Panel: Existing Sessions Management List */}
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-sm flex flex-col max-h-[920px]">
          <div className="border-b border-[var(--line)] pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
              Session Repository
            </p>
            <div className="flex items-center justify-between mt-1">
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                Configured Sessions
              </h2>
              <span className="rounded-full bg-white border border-[var(--line)] px-3 py-1 text-xs font-bold text-[var(--foreground)] shadow-2xs">
                {sessions.length} Total
              </span>
            </div>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto pr-1 grid gap-3">
            {sortedSessions.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--muted)]">
                No test sessions created yet. Use the workspace on the left to generate your first test link.
              </div>
            ) : (
              sortedSessions.map((session) => (
                <article
                  key={session.sessionId}
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white/95 p-4 shadow-2xs transition hover:border-[var(--accent-soft)]"
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-[var(--foreground)] leading-snug">
                          {session.title}
                        </h3>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {session.questionCount} Qs · {session.timeLimitMinutes} mins · Created by {session.createdBy}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          session.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {session.isActive ? "Active" : "Expired"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] text-[var(--muted)] shrink-0 font-medium">Link:</span>
                        <Link
                          href={`/test/${session.sessionId}`}
                          className="text-xs font-mono font-semibold text-[var(--accent-deep)] truncate hover:underline"
                        >
                          /test/{session.sessionId}
                        </Link>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-[10px] text-[var(--muted)]">
                          {formatDateTime(session.createdAt)}
                        </p>

                        <form action={toggleSessionAction}>
                          <input type="hidden" name="sessionId" value={session.sessionId} />
                          <button
                            type="submit"
                            className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:bg-slate-50"
                          >
                            {session.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
