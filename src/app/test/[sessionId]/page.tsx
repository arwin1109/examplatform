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

  if (!session.isActive) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-6 py-10">
        <section className="w-full rounded-[2rem] border border-[var(--line)] bg-[var(--panel-strong)] p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
            Session inactive
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            This test session is currently inactive.
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Please contact the admin if you expected this assessment to be available.
          </p>
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
      : buildAttemptQuestionSet(enabledQuestions, session.questionCount, attempt.attemptId);

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
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/85 p-4">
                <p className="text-sm text-[var(--muted)]">Candidate</p>
                <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">{attempt.name}</p>
              </div>
              <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/85 p-4">
                <p className="text-sm text-[var(--muted)]">Status</p>
                <p className="mt-2 text-xl font-semibold capitalize text-[var(--foreground)]">
                  {formatStatusLabel(attempt.status)}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/85 p-4">
                <p className="text-sm text-[var(--muted)]">Score</p>
                <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  {score} / {attempt.totalQuestions}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel-strong)] p-8">
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">Answer review</h2>
            <div className="mt-6 grid gap-4">
              {orderedQuestions.map((question, index) => {
                const savedAnswer = savedAnswers.find(
                  (answer) => answer.questionId === question.id,
                );
                const resolvedQuestion = questionLookup.get(question.id) ?? question;

                return (
                  <article
                    key={question.id}
                    className="rounded-[1.5rem] border border-[var(--line)] bg-white/85 p-5"
                  >
                    <p className="text-sm font-semibold text-[var(--accent-deep)]">
                      Question {index + 1}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                      {resolvedQuestion.questionText}
                    </h3>
                    <p className="mt-3 text-sm text-[var(--muted)]">
                      Your answer:{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {savedAnswer?.selectedAnswer ?? "Not answered"}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Correct answer:{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {resolvedQuestion.correctAnswer}
                      </span>
                    </p>
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
