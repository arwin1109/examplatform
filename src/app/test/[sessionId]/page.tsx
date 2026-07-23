import Link from "next/link";

import { startAttemptAction } from "@/app/admin/actions";
import { ExamClient } from "@/app/test/[sessionId]/exam-client";
import {
  buildAnswerMap,
  buildAttemptQuestionSet,
  calculateScore,
  getAttemptRemainingSeconds,
  toPublicQuestion,
} from "@/lib/exam";
import { formatDateTime, formatStatusLabel } from "@/lib/format";
import { getStorageProvider } from "@/lib/storage";

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CandidateTestPage(
  props: PageProps<"/test/[sessionId]">,
) {
  const [{ sessionId }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const storageProvider = await getStorageProvider();
  const session = await storageProvider.getSession(sessionId);
  const errorMessage = getParamValue(searchParams.error);
  const attemptId = getParamValue(searchParams.attemptId);

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-6 py-10">
        <section className="w-full rounded-[2rem] border border-[var(--line)] bg-[var(--panel-strong)] p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
            Session unavailable
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            We couldn&apos;t find that test session.
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Double-check the session link or ask the admin to generate a fresh one.
          </p>
          <Link href="/" className="mt-6 inline-flex text-sm font-semibold text-[var(--accent-deep)]">
            Back to landing page
          </Link>
        </section>
      </main>
    );
  }

  const attempts = await storageProvider.getAttempts(sessionId);
  const completedOrEndedAttempt = attempts.find(
    (attempt) =>
      attempt.status === "completed" ||
      attempt.status === "ended_early" ||
      attempt.status === "timed_out",
  );

  if (!session.isActive || completedOrEndedAttempt) {
    const reasonText = !session.isActive
      ? "This test session link has been deactivated by the administrator."
      : "This assessment link has expired because the test was already completed or ended.";

    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-6 py-10">
        <section className="w-full rounded-[2rem] border border-[var(--line)] bg-[var(--panel-strong)] p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-rose-600">
            Session Link Expired
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
            Test Link Expired
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            {reasonText}
          </p>
          {completedOrEndedAttempt ? (
            <div className="mx-auto mt-6 max-w-md rounded-2xl border border-[var(--line)] bg-white/90 p-4 text-left text-xs leading-6 text-[var(--muted)]">
              <p>
                <span className="font-semibold text-[var(--foreground)]">Candidate:</span>{" "}
                {completedOrEndedAttempt.name} ({completedOrEndedAttempt.email})
              </p>
              <p>
                <span className="font-semibold text-[var(--foreground)]">Status:</span>{" "}
                <span className="capitalize">{formatStatusLabel(completedOrEndedAttempt.status)}</span>
              </p>
              <p>
                <span className="font-semibold text-[var(--foreground)]">Submitted:</span>{" "}
                {completedOrEndedAttempt.endedAt ? formatDateTime(completedOrEndedAttempt.endedAt) : "Completed"}
              </p>
            </div>
          ) : null}
          <Link
            href="/"
            className="mt-6 inline-flex text-sm font-semibold text-[var(--accent-deep)] transition hover:underline"
          >
            Back to home
          </Link>
        </section>
      </main>
    );
  }

  const enabledQuestions = (await storageProvider.getQuestions()).filter(
    (question) => question.isEnabled,
  );

  if (enabledQuestions.length < session.questionCount) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-6 py-10">
        <section className="w-full rounded-[2rem] border border-[var(--line)] bg-[var(--panel-strong)] p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
            Session not ready
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            The test cannot start yet.
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            There are not enough enabled questions available for this session right now.
          </p>
        </section>
      </main>
    );
  }

  if (!attemptId) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-10 sm:px-10">
        <div className="grid w-full gap-8 rounded-[2rem] border border-[var(--line)] bg-[var(--panel-strong)] p-8 lg:grid-cols-[1fr_0.95fr]">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
              Candidate check-in
            </p>
            <h1 className="mt-3 font-serif text-5xl leading-tight text-[var(--foreground)]">
              {session.title}
            </h1>
            <p className="mt-4 text-base leading-8 text-[var(--muted)]">
              This assessment contains {session.questionCount} randomized questions
              and a {session.timeLimitMinutes}-minute timer. Questions will appear one by one after you start.
            </p>

            <div className="mt-6 grid gap-4 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-5 text-sm text-[var(--muted)]">
              <p>
                Session ID: <span className="font-semibold text-[var(--foreground)]">{session.sessionId}</span>
              </p>
              <p>
                Created: <span className="font-semibold text-[var(--foreground)]">{formatDateTime(session.createdAt)}</span>
              </p>
            </div>
          </section>

          <section>
            {errorMessage ? (
              <div className="mb-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {errorMessage}
              </div>
            ) : null}

            <form action={startAttemptAction} className="grid gap-4">
              <input type="hidden" name="sessionId" value={session.sessionId} />

              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-semibold text-[var(--foreground)]">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-deep)]"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-semibold text-[var(--foreground)]">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-deep)]"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="phone" className="text-sm font-semibold text-[var(--foreground)]">
                  Phone number
                </label>
                <input
                  id="phone"
                  name="phone"
                  required
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-deep)]"
                />
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold !text-white text-white transition hover:bg-[var(--accent)] shadow-md"
              >
                Start test
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  const attempt = await storageProvider.getAttempt(attemptId);

  if (!attempt || attempt.sessionId !== session.sessionId) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-6 py-10">
        <section className="w-full rounded-[2rem] border border-[var(--line)] bg-[var(--panel-strong)] p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
            Attempt unavailable
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            We couldn&apos;t load that test attempt.
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Please return to the session start screen and begin again.
          </p>
          <Link href={`/test/${session.sessionId}`} className="mt-6 inline-flex text-sm font-semibold text-[var(--accent-deep)]">
            Restart candidate entry
          </Link>
        </section>
      </main>
    );
  }

  const savedAnswers = await storageProvider.getAttemptAnswers(attempt.attemptId);
  const placeholderQuestionIds = savedAnswers
    .sort((left, right) => left.questionOrder - right.questionOrder)
    .map((answer) => answer.questionId);
  const orderedQuestions =
    placeholderQuestionIds.length === session.questionCount
      ? placeholderQuestionIds
          .map((questionId) =>
            enabledQuestions.find((question) => question.id === questionId) ?? null,
          )
          .filter((question) => question !== null)
      : buildAttemptQuestionSet(
          enabledQuestions,
          session.questionCount,
          attempt.attemptId,
          session.selectedCategories,
          session.selectedTopics,
        );

  if (attempt.status !== "in_progress") {
    const score = attempt.score ?? calculateScore(savedAnswers);
    const questionLookup = new Map(orderedQuestions.map((question) => [question.id, question]));

    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 px-6 py-10 sm:px-10">
        <div className="grid w-full gap-6">
          <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel-strong)] p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
              Test completed
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-[var(--foreground)]">
              {session.title}
            </h1>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/85 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Candidate</p>
                <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{attempt.name}</p>
              </div>
              <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/85 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Status</p>
                <p className="mt-2 text-lg font-semibold capitalize text-[var(--foreground)]">
                  {formatStatusLabel(attempt.status)}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/85 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Answered Questions</p>
                <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                  {savedAnswers.length} / {attempt.totalQuestions}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/85 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Total Score</p>
                <p className="mt-2 text-lg font-semibold text-[var(--accent-deep)]">
                  {score} / {attempt.totalQuestions}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel-strong)] p-8">
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">Answer Review</h2>
            <div className="mt-6 grid gap-4">
              {orderedQuestions.map((question, index) => {
                const savedAnswer = savedAnswers.find(
                  (answer) => answer.questionId === question.id,
                );
                const resolvedQuestion = questionLookup.get(question.id) ?? question;
                const hasAnswered = Boolean(savedAnswer?.selectedAnswer);
                const isCorrect = hasAnswered && savedAnswer?.selectedAnswer === resolvedQuestion.correctAnswer;

                return (
                  <article
                    key={question.id}
                    className="rounded-[1.5rem] border border-[var(--line)] bg-white/85 p-5 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-deep)]">
                        Question {index + 1} ({resolvedQuestion.category} • {resolvedQuestion.topic})
                      </p>
                      <span
                        className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                          !hasAnswered
                            ? "bg-slate-100 text-slate-600 border border-slate-300"
                            : isCorrect
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}
                      >
                        {!hasAnswered ? "Skipped" : isCorrect ? "Correct" : "Incorrect"}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-[var(--foreground)]">
                      {resolvedQuestion.questionText}
                    </h3>

                    <div className="mt-3 grid gap-1.5 text-xs sm:grid-cols-2">
                      <p className="rounded-lg bg-slate-50 px-3 py-2 text-[var(--muted)]">
                        Your Answer:{" "}
                        <span
                          className={`font-semibold ${
                            !hasAnswered
                              ? "text-slate-500 italic"
                              : isCorrect
                              ? "text-emerald-700"
                              : "text-rose-700"
                          }`}
                        >
                          {savedAnswer?.selectedAnswer ?? "Not answered (Skipped)"}
                        </span>
                      </p>
                      <p className="rounded-lg bg-emerald-50/60 px-3 py-2 text-emerald-900 font-medium">
                        Correct Answer:{" "}
                        <span className="font-bold">{resolvedQuestion.correctAnswer}</span>
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 px-6 py-10 sm:px-10">
      <ExamClient
        attemptId={attempt.attemptId}
        sessionId={session.sessionId}
        sessionTitle={session.title}
        candidateName={attempt.name}
        initialRemainingSeconds={getAttemptRemainingSeconds(
          attempt,
          session.timeLimitMinutes,
        )}
        questions={orderedQuestions.map(toPublicQuestion)}
        initialAnswers={buildAnswerMap(savedAnswers)}
      />
    </main>
  );
}
