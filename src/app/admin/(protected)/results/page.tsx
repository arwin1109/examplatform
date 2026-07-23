import { formatDurationLabel } from "@/lib/exam";
import { formatDateTime, formatStatusLabel } from "@/lib/format";
import { getStorageProvider } from "@/lib/storage";

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminResultsPage(
  props: PageProps<"/admin/results">,
) {
  const storageProvider = await getStorageProvider();
  const [sessions, attempts, searchParams] = await Promise.all([
    storageProvider.getSessions(),
    storageProvider.getAttempts(),
    props.searchParams,
  ]);

  const selectedSessionId = getParamValue(searchParams.session) || "";
  const selectedStatus = getParamValue(searchParams.status) || "all";
  const searchQuery = (getParamValue(searchParams.search) || "").trim().toLowerCase();
  const selectedSort = getParamValue(searchParams.sortBy) || "newest";

  // Filter attempts
  const visibleAttempts = attempts.filter((attempt) => {
    if (selectedSessionId && attempt.sessionId !== selectedSessionId) {
      return false;
    }

    if (selectedStatus !== "all" && attempt.status !== selectedStatus) {
      return false;
    }

    if (searchQuery) {
      const nameMatch = attempt.name.toLowerCase().includes(searchQuery);
      const emailMatch = attempt.email.toLowerCase().includes(searchQuery);
      const phoneMatch = attempt.phone.toLowerCase().includes(searchQuery);
      if (!nameMatch && !emailMatch && !phoneMatch) {
        return false;
      }
    }

    return true;
  });

  // Sort attempts
  const sortedAttempts = [...visibleAttempts].sort((left, right) => {
    if (selectedSort === "oldest") {
      return new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime();
    }
    if (selectedSort === "highest_score") {
      return (right.score ?? 0) - (left.score ?? 0);
    }
    if (selectedSort === "lowest_score") {
      return (left.score ?? 0) - (right.score ?? 0);
    }
    // Default newest
    return new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime();
  });

  // Analytics Metrics
  const totalCount = sortedAttempts.length;
  const completedAttempts = sortedAttempts.filter((a) => a.status === "completed");
  const completedCount = completedAttempts.length;
  
  const avgScore =
    completedCount > 0
      ? Math.round(
          completedAttempts.reduce((acc, curr) => acc + (curr.score ?? 0), 0) /
            completedCount,
        )
      : 0;

  const totalPossibleScore =
    completedCount > 0
      ? Math.round(
          completedAttempts.reduce((acc, curr) => acc + curr.totalQuestions, 0) /
            completedCount,
        )
      : 0;

  const passRate =
    completedCount > 0 && totalPossibleScore > 0
      ? Math.round((avgScore / totalPossibleScore) * 100)
      : 0;

  // Build CSV Export URL with active filters
  const exportParams = new URLSearchParams();
  if (selectedSessionId) exportParams.set("session", selectedSessionId);
  if (selectedStatus !== "all") exportParams.set("status", selectedStatus);
  if (searchQuery) exportParams.set("search", searchQuery);
  if (selectedSort !== "newest") exportParams.set("sortBy", selectedSort);
  const exportUrl = `/api/admin/export-results${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  return (
    <main className="grid gap-6">
      {/* Metrics Header */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Total Filtered Attempts</p>
          <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{totalCount}</p>
        </div>
        <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Completed Exams</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{completedCount}</p>
        </div>
        <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Average Score</p>
          <p className="mt-2 text-3xl font-bold text-[var(--accent-deep)]">
            {avgScore} <span className="text-base font-normal text-[var(--muted)]">/ {totalPossibleScore || "-"}</span>
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Pass Accuracy Rate</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{passRate}%</p>
        </div>
      </section>

      {/* Results Header & Export Button */}
      <section className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
              Exam Platform Analytics
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
              Candidate Exam Results
            </h2>
          </div>

          <a
            href={exportUrl}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold !text-white text-white transition hover:bg-[var(--accent)] shadow-md shrink-0"
          >
            <svg className="h-4.5 w-4.5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="!text-white text-white">Export Results (CSV)</span>
          </a>
        </div>

        {/* Filter Controls Bar */}
        <form method="GET" action="/admin/results" className="mt-6 grid gap-4 rounded-[1.25rem] border border-[var(--line)] bg-white/70 p-4 lg:grid-cols-4">
          {/* Candidate Search */}
          <div className="grid gap-1.5">
            <label htmlFor="search" className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
              Search Candidate
            </label>
            <input
              id="search"
              name="search"
              defaultValue={searchQuery}
              placeholder="Name, email or phone..."
              className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-sm outline-none focus:border-[var(--accent-deep)]"
            />
          </div>

          {/* Session Filter */}
          <div className="grid gap-1.5">
            <label htmlFor="session" className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
              Test Session
            </label>
            <select
              id="session"
              name="session"
              defaultValue={selectedSessionId}
              className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-sm outline-none focus:border-[var(--accent-deep)]"
            >
              <option value="">All Sessions</option>
              {sessions.map((s) => (
                <option key={s.sessionId} value={s.sessionId}>
                  {s.title} ({s.sessionId})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="grid gap-1.5">
            <label htmlFor="status" className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
              Attempt Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={selectedStatus}
              className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-sm outline-none focus:border-[var(--accent-deep)]"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="timed_out">Timed Out</option>
              <option value="ended_early">Ended Early</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="grid gap-1.5">
            <label htmlFor="sortBy" className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
              Sort Order
            </label>
            <div className="flex gap-2">
              <select
                id="sortBy"
                name="sortBy"
                defaultValue={selectedSort}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-sm outline-none focus:border-[var(--accent-deep)]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest_score">Highest Score</option>
                <option value="lowest_score">Lowest Score</option>
              </select>
              <button
                type="submit"
                className="rounded-xl bg-[var(--accent-deep)] px-4 py-2 text-xs font-bold !text-white text-white transition hover:bg-[var(--accent)] shadow-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </form>

        {/* Results Data Table */}
        <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-[var(--line)]">
          <table className="min-w-full divide-y divide-[var(--line)] bg-white/90 text-left text-sm">
            <thead className="bg-[var(--mint)]/60 text-[var(--foreground)]">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Candidate</th>
                <th className="px-4 py-3.5 font-semibold">Session</th>
                <th className="px-4 py-3.5 font-semibold">Score</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold">Answered</th>
                <th className="px-4 py-3.5 font-semibold">Started At</th>
                <th className="px-4 py-3.5 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] text-[var(--muted)]">
              {sortedAttempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--muted)]">
                    No attempt results match your active filters.
                  </td>
                </tr>
              ) : (
                sortedAttempts.map((attempt) => {
                  let statusBadgeStyle = "bg-slate-100 text-slate-800 border-slate-200";
                  if (attempt.status === "completed") {
                    statusBadgeStyle = "bg-emerald-50 text-emerald-900 border-emerald-200 font-bold";
                  } else if (attempt.status === "in_progress") {
                    statusBadgeStyle = "bg-amber-50 text-amber-900 border-amber-200 font-bold";
                  } else if (attempt.status === "timed_out" || attempt.status === "ended_early") {
                    statusBadgeStyle = "bg-rose-50 text-rose-900 border-rose-200 font-bold";
                  }

                  return (
                    <tr key={attempt.attemptId} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[var(--foreground)]">{attempt.name}</p>
                        <p className="text-xs text-[var(--muted)]">{attempt.email}</p>
                        <p className="text-xs text-[var(--muted)]">{attempt.phone}</p>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-[var(--foreground)]">{attempt.sessionId}</td>
                      <td className="px-4 py-4 font-bold text-[var(--foreground)]">
                        {attempt.score !== null ? `${attempt.score} / ${attempt.totalQuestions}` : "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-block rounded-full border px-3 py-1 text-xs capitalize ${statusBadgeStyle}`}>
                          {formatStatusLabel(attempt.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {attempt.answeredQuestions} / {attempt.totalQuestions}
                      </td>
                      <td className="px-4 py-4 text-xs">{formatDateTime(attempt.startedAt)}</td>
                      <td className="px-4 py-4 text-xs font-medium">
                        {formatDurationLabel(attempt.startedAt, attempt.endedAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
