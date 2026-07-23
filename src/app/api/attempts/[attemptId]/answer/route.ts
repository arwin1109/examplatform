import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getStorageProvider } from "@/lib/storage";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      attemptId: string;
    }>;
  },
) {
  const { attemptId } = await context.params;
  const storageProvider = await getStorageProvider();
  const attempt = await storageProvider.getAttempt(attemptId);

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }

  if (attempt.status !== "in_progress") {
    return NextResponse.json(
      { error: "This attempt can no longer be updated." },
      { status: 409 },
    );
  }

  const payload = (await request.json()) as {
    questionId?: string;
    selectedAnswer?: string;
    questionOrder?: number;
  };

  if (!payload.questionId || !payload.selectedAnswer || !payload.questionOrder) {
    return NextResponse.json(
      { error: "questionId, selectedAnswer, and questionOrder are required." },
      { status: 400 },
    );
  }

  const question = await storageProvider.getQuestion(payload.questionId);

  if (!question || !question.isEnabled) {
    return NextResponse.json({ error: "Question not available." }, { status: 404 });
  }

  await storageProvider.saveAttemptAnswer({
    attemptId,
    questionId: payload.questionId,
    selectedAnswer: payload.selectedAnswer,
    isCorrect: question.correctAnswer === payload.selectedAnswer,
    answeredAt: new Date().toISOString(),
    questionOrder: payload.questionOrder,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/results");
  revalidatePath(`/test/${attempt.sessionId}`);

  return NextResponse.json({ ok: true });
}
