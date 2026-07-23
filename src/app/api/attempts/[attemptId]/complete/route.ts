import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { calculateScore } from "@/lib/exam";
import { getStorageProvider } from "@/lib/storage";

const allowedStatuses = new Set(["completed", "timed_out", "ended_early"]);

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      attemptId: string;
    }>;
  },
) {
  const { attemptId } = await context.params;
  const payload = (await request.json()) as {
    status?: "completed" | "timed_out" | "ended_early";
  };

  if (!payload.status || !allowedStatuses.has(payload.status)) {
    return NextResponse.json({ error: "Invalid completion status." }, { status: 400 });
  }

  const storageProvider = await getStorageProvider();
  const attempt = await storageProvider.getAttempt(attemptId);

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }

  if (attempt.status !== "in_progress") {
    return NextResponse.json({ ok: true, attempt });
  }

  const answers = await storageProvider.getAttemptAnswers(attemptId);
  const score = calculateScore(answers);
  const updatedAttempt = await storageProvider.updateAttempt(attemptId, {
    endedAt: new Date().toISOString(),
    status: payload.status,
    score,
    answeredQuestions: answers.length,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/results");
  revalidatePath(`/test/${attempt.sessionId}`);

  return NextResponse.json({ ok: true, attempt: updatedAttempt });
}
