import Link from "next/link";

import {
  bulkCreateCandidateSessionsAction,
  createSessionAction,
  toggleSessionAction,
} from "@/app/admin/actions";
import { formatDateTime } from "@/lib/format";
import { getStorageProvider } from "@/lib/storage";

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
      {successMessage ? (
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-medium text-emerald-900 shadow-sm">
          <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      ) : null}

      {noticeMessage ? (
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm font-medium text-amber-900 shadow-sm">
          <svg className="h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {noticeMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm font-medium text-rose-900 shadow-sm">
          <svg className="h-5 w-5 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Bulk Candidate Link Creation & CSV Import Form */}
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
                Bulk Test Generation
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                Create Links for Multiple Candidates
              </h2>
            </div>

            {/* CSV Template Download Button with Icon */}
            <a
              href="/api/admin/candidate-template"
              download="candidate_template.csv"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-slate-50 shadow-xs"
              title="Download Sample Candidate CSV Template"
            >
              <svg className="h-4 w-4 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download CSV Template
            </a>
          </div>

          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Upload a CSV file containing candidate details (<code className="rounded bg-black/5 px-1.5 py-0.5 text-xs font-mono">name, email, phone</code>) to generate candidate test links in bulk and send automated email invitations.
          </p>

          <form action={bulkCreateCandidateSessionsAction} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="titlePrefix" className="text-sm font-semibold text-[var(--foreground)]">
                  Assessment Title / Prefix
                </label>
                <input
                  id="titlePrefix"
                  name="titlePrefix"
                  required
                  defaultValue="Aptitude Screening"
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-deep)]"
                  placeholder="e.g. Full Stack Aptitude Test"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="candidateCsv" className="text-sm font-semibold text-[var(--foreground)]">
                  Candidate CSV File
                </label>
                <input
                  id="candidateCsv"
                  name="candidateCsv"
                  type="file"
                  accept=".csv"
                  required
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent-deep)]"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="bulkQuestionCount" className="text-sm font-semibold text-[var(--foreground)]">
                  Question Count per Session
                </label>
                <input
                  id="bulkQuestionCount"
                  name="questionCount"
                  type="number"
                  min="1"
                  max={Math.max(enabledQuestionCount, 1)}
                  defaultValue={Math.min(Math.max(enabledQuestionCount, 1), 10)}
                  required
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-deep)]"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="bulkTimeLimitMinutes" className="text-sm font-semibold text-[var(--foreground)]">
                  Time Limit (minutes)
                </label>
                <input
                  id="bulkTimeLimitMinutes"
                  name="timeLimitMinutes"
                  type="number"
                  min="1"
                  defaultValue="20"
                  required
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-deep)]"
                />
              </div>
            </div>

            <hr className="my-2 border-[var(--line)]" />

            {/* Outlook Email Customization Options */}
            <div className="grid gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor="senderEmailId" className="text-sm font-semibold text-[var(--foreground)]">
                  Select Configured Sender Outlook Email
                </label>
                {emailConfigs.length === 0 ? (
                  <Link href="/admin/settings" className="text-xs font-semibold text-rose-600 hover:underline">
                    ⚠️ No configured emails. Click to add in Settings →
                  </Link>
                ) : null}
              </div>

              <select
                id="senderEmailId"
                name="senderEmailId"
                className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)]"
              >
                {emailConfigs.length === 0 ? (
                  <option value="">No configured Outlook emails available</option>
                ) : (
                  emailConfigs.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.emailAddress} (App ID: {config.applicationId.slice(0, 8)}...)
                    </option>
                  ))
                )}
              </select>

              <div className="grid gap-1.5">
                <label htmlFor="emailSubject" className="text-sm font-semibold text-[var(--foreground)]">
                  Email Subject Name
                </label>
                <input
                  id="emailSubject"
                  name="emailSubject"
                  required
                  defaultValue="Your Aptitude Assessment Test Link - {test_title}"
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-deep)]"
                  placeholder="e.g. Assessment Link for {candidate_name}"
                />
              </div>

              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="emailBody" className="text-sm font-semibold text-[var(--foreground)]">
                    Email Body Content
                  </label>
                  <span className="text-xs text-[var(--muted)]">
                    Placeholders: <code className="rounded bg-slate-100 px-1 py-0.5">{`{candidate_name}`}</code>, <code className="rounded bg-slate-100 px-1 py-0.5">{`{test_link}`}</code>, <code className="rounded bg-slate-100 px-1 py-0.5">{`{test_title}`}</code>, <code className="rounded bg-slate-100 px-1 py-0.5">{`{time_limit}`}</code>
                  </span>
                </div>
                <textarea
                  id="emailBody"
                  name="emailBody"
                  rows={4}
                  required
                  defaultValue={`Hello {candidate_name},\n\nYou have been invited to complete the aptitude assessment: {test_title}.\n\nPlease click the link below to start your test:\n{test_link}\n\nAssessment Details:\n- Time Limit: {time_limit} minutes\n- Questions: {question_count}\n\nNote: Once completed or ended, this link will automatically expire.\n\nGood luck!`}
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-deep)] font-mono text-xs leading-5"
                />
              </div>

              <label className="inline-flex items-center gap-3 text-sm font-medium text-[var(--foreground)]">
                <input
                  type="checkbox"
                  name="sendEmail"
                  defaultChecked={emailConfigs.length > 0}
                  className="h-4 w-4 rounded border-gray-300 text-[var(--accent)]"
                />
                Send email invitations automatically to candidates via Outlook Graph API
              </label>
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent)] shadow-md"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Candidate Links & Dispatch Emails
            </button>
          </form>

          <hr className="my-6 border-[var(--line)]" />

          {/* Single Custom Session Creation */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
              Single Test Session
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
              Generate Generic Shareable Test Link
            </h3>

            <form action={createSessionAction} className="mt-4 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor="title" className="text-sm font-semibold text-[var(--foreground)]">
                    Session Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    required
                    className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-deep)]"
                    placeholder="Frontend Aptitude Screening"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="sessionId" className="text-sm font-semibold text-[var(--foreground)]">
                    Custom Session ID
                  </label>
                  <input
                    id="sessionId"
                    name="sessionId"
                    className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-deep)]"
                    placeholder="Optional, auto-generated if empty"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor="questionCount" className="text-sm font-semibold text-[var(--foreground)]">
                    Question Count
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

                <div className="grid gap-1.5">
                  <label htmlFor="timeLimitMinutes" className="text-sm font-semibold text-[var(--foreground)]">
                    Time Limit (minutes)
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
                className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white px-6 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-slate-50"
              >
                Create Single Session
              </button>
            </form>
          </div>
        </article>

        {/* Existing Sessions List */}
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
                Configured Sessions
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                {sessions.length} active / historical sessions
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 max-h-[800px] overflow-y-auto pr-1">
            {sortedSessions.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No test sessions created yet.</p>
            ) : (
              sortedSessions.map((session) => (
                <article
                  key={session.sessionId}
                  className="rounded-[1.5rem] border border-[var(--line)] bg-white/90 p-5 shadow-xs"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-base font-semibold text-[var(--foreground)]">{session.title}</p>
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                            session.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {session.isActive ? "Active" : "Expired / Inactive"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                        {session.questionCount} questions · {session.timeLimitMinutes} mins · Created by {session.createdBy}
                      </p>
                      <p className="mt-1.5 text-xs text-[var(--muted)] font-mono">
                        Link:{" "}
                        <Link href={`/test/${session.sessionId}`} className="font-semibold text-[var(--accent-deep)] hover:underline">
                          {`/test/${session.sessionId}`}
                        </Link>
                      </p>
                      <p className="mt-2 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        Created {formatDateTime(session.createdAt)}
                      </p>
                    </div>

                    <form action={toggleSessionAction}>
                      <input type="hidden" name="sessionId" value={session.sessionId} />
                      <button
                        type="submit"
                        className="rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-slate-100"
                      >
                        {session.isActive ? "Deactivate (Expire)" : "Activate"}
                      </button>
                    </form>
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
