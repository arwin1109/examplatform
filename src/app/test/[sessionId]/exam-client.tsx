"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { PublicQuestion } from "@/lib/exam";

interface ExamClientProps {
  attemptId: string;
  sessionId: string;
  sessionTitle: string;
  candidateName: string;
  initialRemainingSeconds: number;
  questions: PublicQuestion[];
  initialAnswers: Record<string, string>;
}

type CompletionStatus = "completed" | "timed_out" | "ended_early";

function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function ExamClient({
  attemptId,
  sessionId,
  sessionTitle,
  candidateName,
  initialRemainingSeconds,
  questions,
  initialAnswers,
}: ExamClientProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstUnansweredIndex = questions.findIndex(
      (question) => !initialAnswers[question.id],
    );
    return firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFocusLost, setIsFocusLost] = useState(false);
  const [focusLossCount, setFocusLossCount] = useState(0);
  const completionLockedRef = useRef(false);

  // Anti-cheating & Screenshot / Copy Protection Event Listeners
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // PrintScreen key detection
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        e.preventDefault();
        setIsFocusLost(true);
        setFocusLossCount((prev) => prev + 1);
        return;
      }

      // Block Copy, Cut, Select All, Print, View Source, DevTools, & Mac Screenshot Shortcuts
      if (
        (isCmdOrCtrl && (key === "c" || key === "x" || key === "a" || key === "p" || key === "u" || key === "s")) ||
        (isCmdOrCtrl && e.shiftKey && (key === "i" || key === "c" || key === "j" || key === "s" || key === "3" || key === "4" || key === "5")) ||
        (e.metaKey && e.shiftKey && (key === "3" || key === "4" || key === "5")) ||
        e.key === "F12"
      ) {
        e.preventDefault();
      }
    };

    const handleBlur = () => {
      setIsFocusLost(true);
      setFocusLossCount((prev) => prev + 1);
    };

    const handleFocus = () => {
      window.setTimeout(() => {
        setIsFocusLost(false);
      }, 300);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsFocusLost(true);
        setFocusLossCount((prev) => prev + 1);
      }
    };

    document.addEventListener("contextmenu", preventDefault);
    document.addEventListener("copy", preventDefault);
    document.addEventListener("cut", preventDefault);
    document.addEventListener("selectstart", preventDefault);
    document.addEventListener("dragstart", preventDefault);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("contextmenu", preventDefault);
      document.removeEventListener("copy", preventDefault);
      document.removeEventListener("cut", preventDefault);
      document.removeEventListener("selectstart", preventDefault);
      document.removeEventListener("dragstart", preventDefault);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((questionId) => answers[questionId]).length,
    [answers],
  );

  const currentQuestion = questions[currentIndex];

  async function submitCompletion(status: CompletionStatus) {
    if (completionLockedRef.current) {
      return;
    }

    completionLockedRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/attempts/${attemptId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to submit exam.");
      }

      startTransition(() => {
        router.replace(`/test/${sessionId}?attemptId=${attemptId}`);
        router.refresh();
      });
    } catch (error) {
      completionLockedRef.current = false;
      setIsSubmitting(false);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to submit exam.",
      );
    }
  }
  const submitTimedOut = useEffectEvent(() => {
    void submitCompletion("timed_out");
  });

  useEffect(() => {
    if (initialRemainingSeconds <= 0) {
      const timeoutId = window.setTimeout(() => {
        submitTimedOut();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((currentValue) => {
        if (completionLockedRef.current) {
          return currentValue;
        }

        if (currentValue <= 1) {
          window.clearInterval(intervalId);
          submitTimedOut();
          return 0;
        }

        return currentValue - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [initialRemainingSeconds]);

  async function persistAnswer(questionId: string, selectedAnswer: string, questionOrder: number) {
    if (completionLockedRef.current) {
      return;
    }
    setErrorMessage(null);
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: selectedAnswer,
    }));

    try {
      const response = await fetch(`/api/attempts/${attemptId}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId,
          selectedAnswer,
          questionOrder,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to save answer.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save answer.",
      );
    }
  }

  function handleEarlyEnd() {
    if (window.confirm("End the exam early and submit your current answers?")) {
      void submitCompletion("ended_early");
    }
  }

  function handleSubmitExam() {
    void submitCompletion("completed");
  }

  return (
    <div className="relative grid gap-6 select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* Security Watermark Background Overlay */}
      <div className="pointer-events-none fixed inset-0 z-10 flex flex-wrap items-center justify-around opacity-[0.035] select-none overflow-hidden">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="m-8 rotate-[-25deg] text-base font-black tracking-widest text-slate-900">
            PROCTORED EXAM • {candidateName} • {attemptId.slice(0, 8)}
          </div>
        ))}
      </div>

      {/* Focus Loss / Screenshot Protection Overlay */}
      {isFocusLost ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/85 p-6 backdrop-blur-md text-white text-center">
          <div className="max-w-md rounded-[2rem] border border-rose-500/30 bg-slate-900 p-8 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-bold text-white">Security & Proctoring Warning</h3>
            <p className="mt-2 text-sm text-slate-300">
              Window focus lost or screenshot shortcut detected. Exam questions are hidden for anti-cheating protection.
            </p>
            <p className="mt-4 rounded-xl bg-slate-800/90 p-3 text-xs font-semibold text-amber-300">
              Click inside this window to return to your assessment. (Switch count: {focusLossCount})
            </p>
          </div>
        </div>
      ) : null}

      <section className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
                Candidate exam
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Protected & Proctored
              </span>
              {focusLossCount > 0 ? (
                <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                  Focus Warning ({focusLossCount})
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
              {sessionTitle}
            </h1>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Candidate: <span className="font-semibold text-[var(--foreground)]">{candidateName}</span>
            </p>
          </div>

          <div className="grid gap-3 rounded-[1.5rem] border border-[var(--line)] bg-white/85 px-5 py-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
              Time left
            </p>
            <p className="text-4xl font-semibold text-[var(--foreground)]">
              {formatCountdown(remainingSeconds)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4">
            <p className="text-sm text-[var(--muted)]">Question</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              {currentIndex + 1} / {questions.length}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4">
            <p className="text-sm text-[var(--muted)]">Answered</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              {answeredCount} / {questions.length}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4">
            <p className="text-sm text-[var(--muted)]">Progress</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--accent-soft)]/55">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
                style={{
                  width: `${(answeredCount / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={`rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6 transition-all duration-200 ${isFocusLost ? "blur-md select-none pointer-events-none" : ""}`}>
        <p className="text-sm font-semibold text-[var(--accent-deep)]">
          Question {currentIndex + 1}
        </p>
        <h2 className="mt-3 text-2xl font-semibold leading-10 text-[var(--foreground)] select-none">
          {currentQuestion.questionText}
        </h2>

        <div className="mt-6 grid gap-3 select-none">
          {currentQuestion.options.map((option) => {
            const isSelected = answers[currentQuestion.id] === option;

            return (
              <button
                key={option}
                type="button"
                disabled={isSubmitting || isRefreshing}
                onClick={() =>
                  void persistAnswer(currentQuestion.id, option, currentIndex + 1)
                }
                className={`rounded-[1.25rem] border px-4 py-4 text-left text-sm transition-colors select-none ${
                  isSelected
                    ? "border-[var(--accent-deep)] bg-[var(--accent-soft)]/55 text-[var(--foreground)]"
                    : "border-[var(--line)] bg-white/85 text-[var(--foreground)] hover:bg-white"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {errorMessage ? (
          <p className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="flex gap-3">
            <button
              type="button"
              disabled={currentIndex === 0 || isSubmitting}
              onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
              className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentIndex === questions.length - 1 || isSubmitting}
              onClick={() =>
                setCurrentIndex((index) => Math.min(index + 1, questions.length - 1))
              }
              className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleEarlyEnd}
              className="rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              End exam early
            </button>
            <button
              type="button"
              disabled={isSubmitting || isRefreshing}
              onClick={handleSubmitExam}
              className="rounded-full bg-[var(--accent-deep)] px-5 py-3 text-sm font-semibold !text-white text-white transition hover:bg-[var(--accent)] shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting || isRefreshing ? "Submitting..." : "Submit exam"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
