import type { Attempt, AttemptAnswer, Question } from "@/lib/storage/types";

export interface PublicQuestion {
  id: string;
  questionText: string;
  options: string[];
}

export function toPublicQuestion(question: Question): PublicQuestion {
  return {
    id: question.id,
    questionText: question.questionText,
    options: question.options,
  };
}

function hashSeed(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function seededRandom(seed: number) {
  let value = seed || 1;

  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export function buildAttemptQuestionSet(
  questions: Question[],
  questionCount: number,
  attemptId: string,
  selectedCategories?: string[],
  selectedTopics?: string[],
) {
  let eligibleQuestions = questions;

  if (selectedCategories && selectedCategories.length > 0) {
    const categorySet = new Set(selectedCategories.map((c) => c.toLowerCase()));
    eligibleQuestions = eligibleQuestions.filter((q) =>
      categorySet.has(q.category.toLowerCase()),
    );
  }

  if (selectedTopics && selectedTopics.length > 0) {
    const topicSet = new Set(selectedTopics.map((t) => t.toLowerCase()));
    eligibleQuestions = eligibleQuestions.filter((q) =>
      topicSet.has(q.topic.toLowerCase()),
    );
  }

  if (eligibleQuestions.length === 0) {
    eligibleQuestions = questions;
  }

  const random = seededRandom(hashSeed(attemptId));
  const shuffledQuestions = [...eligibleQuestions];

  for (let index = shuffledQuestions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = shuffledQuestions[index];
    shuffledQuestions[index] = shuffledQuestions[swapIndex];
    shuffledQuestions[swapIndex] = current;
  }

  return shuffledQuestions.slice(0, Math.min(questionCount, shuffledQuestions.length));
}

export function buildAnswerMap(answers: AttemptAnswer[]) {
  return Object.fromEntries(
    answers.map((answer) => [answer.questionId, answer.selectedAnswer]),
  );
}

export function calculateScore(answers: AttemptAnswer[]) {
  return answers.filter((answer) => answer.isCorrect).length;
}

export function getAttemptRemainingSeconds(
  attempt: Attempt,
  timeLimitMinutes: number,
) {
  const startedAtTime = new Date(attempt.startedAt).getTime();
  const deadline = startedAtTime + timeLimitMinutes * 60 * 1000;
  const remainingSeconds = Math.floor((deadline - Date.now()) / 1000);

  return Math.max(remainingSeconds, 0);
}

export function formatDurationLabel(startedAt: string, endedAt: string | null) {
  if (!endedAt) {
    return "In progress";
  }

  const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const totalMinutes = Math.max(Math.round(durationMs / 60000), 0);

  if (totalMinutes < 1) {
    return "< 1 min";
  }

  if (totalMinutes === 1) {
    return "1 min";
  }

  return `${totalMinutes} mins`;
}

export function slugifySessionId(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}
