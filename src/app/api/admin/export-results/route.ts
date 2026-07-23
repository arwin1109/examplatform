import { type NextRequest, NextResponse } from "next/server";
import { stringify } from "csv-stringify/sync";

import { requireAdminSession } from "@/lib/auth/session";
import { formatDurationLabel } from "@/lib/exam";
import { formatStatusLabel } from "@/lib/format";
import { getStorageProvider } from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const sessionId = searchParams.get("session") || undefined;
  const status = searchParams.get("status") || "all";
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const sortBy = searchParams.get("sortBy") || "newest";

  const storageProvider = await getStorageProvider();
  const [sessions, attempts] = await Promise.all([
    storageProvider.getSessions(),
    storageProvider.getAttempts(sessionId),
  ]);

  const sessionMap = new Map(sessions.map((s) => [s.sessionId, s.title]));

  // Filter attempts
  const filtered = attempts.filter((attempt) => {
    if (status !== "all" && attempt.status !== status) {
      return false;
    }

    if (search) {
      const matchName = attempt.name.toLowerCase().includes(search);
      const matchEmail = attempt.email.toLowerCase().includes(search);
      const matchPhone = attempt.phone.toLowerCase().includes(search);
      if (!matchName && !matchEmail && !matchPhone) {
        return false;
      }
    }

    return true;
  });

  // Sort attempts
  filtered.sort((a, b) => {
    if (sortBy === "oldest") {
      return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
    }
    if (sortBy === "highest_score") {
      return (b.score ?? 0) - (a.score ?? 0);
    }
    if (sortBy === "lowest_score") {
      return (a.score ?? 0) - (b.score ?? 0);
    }
    // Default newest
    return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
  });

  // Prepare CSV records
  const csvRows = filtered.map((attempt) => {
    const percentage =
      attempt.score !== null && attempt.totalQuestions > 0
        ? `${Math.round((attempt.score / attempt.totalQuestions) * 100)}%`
        : "N/A";

    return {
      "Attempt ID": attempt.attemptId,
      "Candidate Name": attempt.name,
      "Candidate Email": attempt.email,
      "Candidate Phone": attempt.phone,
      "Session ID": attempt.sessionId,
      "Session Title": sessionMap.get(attempt.sessionId) || attempt.sessionId,
      Score: attempt.score !== null ? attempt.score : "N/A",
      "Total Questions": attempt.totalQuestions,
      Percentage: percentage,
      Status: formatStatusLabel(attempt.status),
      "Answered Questions": attempt.answeredQuestions,
      "Started At": attempt.startedAt,
      "Ended At": attempt.endedAt || "N/A",
      Duration: formatDurationLabel(attempt.startedAt, attempt.endedAt),
    };
  });

  const csvContent = stringify(csvRows, {
    header: true,
  });

  const filename = `exam-results${sessionId ? `-${sessionId}` : ""}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
