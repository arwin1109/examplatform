import Link from "next/link";

import {
  bulkCreateQuestionsAction,
  createQuestionAction,
  deleteQuestionAction,
  importQuestionsCsvAction,
  toggleQuestionAction,
  updateQuestionAction,
} from "@/app/admin/actions";
import { formatDateTime } from "@/lib/format";
import { getStorageProvider } from "@/lib/storage";

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminQuestionsPage(
  props: PageProps<"/admin/questions">,
) {
  const storageProvider = await getStorageProvider();
  const [questions, searchParams] = await Promise.all([
    storageProvider.getQuestions(),
    props.searchParams,
  ]);

  const editId = getParamValue(searchParams.edit);
  const selectedQuestion = editId
    ? questions.find((question) => question.id === editId) ?? null
    : null;
  const successMessage = getParamValue(searchParams.success);
  const errorMessage = getParamValue(searchParams.error);

  const sortedQuestions = [...questions].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );

  return (
    <main className="grid gap-6">
      {successMessage ? (
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-medium text-emerald-900 shadow-sm">
          <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
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

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        {/* Create / Edit Question Form */}
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
                {selectedQuestion ? "Edit Question" : "Create Question"}
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold text-[var(--foreground)]">
                {selectedQuestion ? "Update Existing Question" : "Add Single MCQ"}
              </h2>
            </div>
            {selectedQuestion ? (
              <Link href="/admin/questions" className="text-xs font-bold uppercase tracking-wider text-[var(--accent-deep)] hover:underline">
                Cancel Edit
              </Link>
            ) : null}
          </div>

          <form
            action={selectedQuestion ? updateQuestionAction : createQuestionAction}
            className="mt-6 grid gap-4"
          >
            {selectedQuestion ? <input type="hidden" name="id" value={selectedQuestion.id} /> : null}

            <div className="grid gap-2">
              <label htmlFor="questionText" className="text-sm font-semibold text-[var(--foreground)]">
                Question Text
              </label>
              <textarea
                id="questionText"
                name="questionText"
                required
                rows={3}
                defaultValue={selectedQuestion?.questionText ?? ""}
                className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="Enter the question prompt..."
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="options" className="text-sm font-semibold text-[var(--foreground)]">
                Options <span className="text-xs font-normal text-[var(--muted)]">(One option per line)</span>
              </label>
              <textarea
                id="options"
                name="options"
                required
                rows={4}
                defaultValue={selectedQuestion?.options.join("\n") ?? ""}
                className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder={"Option 1\nOption 2\nOption 3\nOption 4"}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="category" className="text-sm font-semibold text-[var(--foreground)]">
                  Category
                </label>
                <input
                  id="category"
                  name="category"
                  required
                  defaultValue={selectedQuestion?.category ?? "Frontend"}
                  placeholder="e.g. Frontend, Backend, Database, Algorithms"
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)]"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="topic" className="text-sm font-semibold text-[var(--foreground)]">
                  Topic / Sub-subject
                </label>
                <input
                  id="topic"
                  name="topic"
                  required
                  defaultValue={selectedQuestion?.topic ?? "JavaScript"}
                  placeholder="e.g. React, SQL Joins, Promises"
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)]"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="difficulty" className="text-sm font-semibold text-[var(--foreground)]">
                  Difficulty Level
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  defaultValue={selectedQuestion?.difficulty ?? "medium"}
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)]"
                >
                  <option value="easy">Easy (1 Mark)</option>
                  <option value="medium">Medium (2 Marks)</option>
                  <option value="hard">Hard (3 Marks)</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="marks" className="text-sm font-semibold text-[var(--foreground)]">
                  Marks / Point Value
                </label>
                <input
                  id="marks"
                  name="marks"
                  type="number"
                  min="1"
                  max="10"
                  required
                  defaultValue={selectedQuestion?.marks ?? 1}
                  className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)]"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="correctAnswer" className="text-sm font-semibold text-[var(--foreground)]">
                Correct Answer <span className="text-xs font-normal text-[var(--muted)]">(Must match an option exactly)</span>
              </label>
              <input
                id="correctAnswer"
                name="correctAnswer"
                required
                defaultValue={selectedQuestion?.correctAnswer ?? ""}
                className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="Option 1"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="explanation" className="text-sm font-semibold text-[var(--foreground)]">
                Answer Explanation <span className="text-xs font-normal text-[var(--muted)]">(Optional rationale for candidates)</span>
              </label>
              <textarea
                id="explanation"
                name="explanation"
                rows={2}
                defaultValue={selectedQuestion?.explanation ?? ""}
                className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="Explain why this answer is correct..."
              />
            </div>

            <label className="inline-flex items-center gap-3 text-sm font-medium text-[var(--foreground)]">
              <input
                type="checkbox"
                name="isEnabled"
                defaultChecked={selectedQuestion?.isEnabled ?? true}
                className="h-4 w-4 rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              Enable this question for test sessions
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold !text-white text-white transition hover:bg-[var(--accent)] shadow-md"
            >
              {selectedQuestion ? "Update Question" : "Save Question"}
            </button>
          </form>
        </article>

        {/* CSV Import & Text Paste Card */}
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
                Bulk Tools
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold text-[var(--foreground)]">
                Import CSV File
              </h2>
            </div>
            <a
              href="/api/admin/csv-template"
              download="questions-template.csv"
              title="Click to download CSV template format"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-soft)] bg-amber-50/80 px-4 py-2 text-xs font-bold text-[var(--accent-deep)] transition hover:bg-amber-100 shadow-xs group"
            >
              <svg className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download CSV Template</span>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          </div>

          {/* CSV File Upload Form */}
          <form action={importQuestionsCsvAction} className="mt-5 grid gap-3">
            <div className="relative flex flex-col items-center justify-center rounded-[1.25rem] border-2 border-dashed border-[var(--accent-soft)] bg-white/60 p-6 text-center transition hover:border-[var(--accent)] hover:bg-white">
              <div className="flex items-center gap-2">
                <svg className="h-10 w-10 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <a
                  href="/api/admin/csv-template"
                  download="questions-template.csv"
                  className="group flex items-center gap-1 rounded-lg bg-[var(--mint)]/60 px-2.5 py-1 text-xs font-semibold text-emerald-900 transition hover:bg-[var(--mint)] hover:shadow-xs"
                  title="Download sample template"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Template.csv
                </a>
              </div>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                Upload Question CSV File
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Headers: <code className="rounded bg-black/5 px-1 py-0.5">questionText</code>, <code className="rounded bg-black/5 px-1 py-0.5">options</code>, <code className="rounded bg-black/5 px-1 py-0.5">correctAnswer</code>
              </p>
              <input
                type="file"
                name="csvFile"
                accept=".csv"
                required
                className="mt-4 w-full text-xs text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-[var(--accent-soft)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[var(--accent-deep)] hover:file:bg-[var(--accent)] hover:file:text-white"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-slate-50 shadow-xs"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload & Import CSV
            </button>
          </form>

          <hr className="my-6 border-[var(--line)]" />

          {/* Text Paste Form */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Or Paste Pipe-Separated Format
            </h3>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              <code className="font-semibold text-[var(--foreground)]">
                Question text || option 1 | option 2 || correct answer
              </code>
            </p>
            <form action={bulkCreateQuestionsAction} className="mt-3 grid gap-3">
              <textarea
                name="bulkQuestions"
                rows={4}
                className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-xs outline-none focus:border-[var(--accent-deep)]"
                placeholder="What does CSS stand for? || Cascading Style Sheets | Computer Style Sheets || Cascading Style Sheets"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-slate-50"
              >
                Import Pasted Questions
              </button>
            </form>
          </div>
        </article>
      </section>

      {/* Question Bank List */}
      <section className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
              Question Bank
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
              {questions.length} Total Questions
            </h2>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
              {questions.filter((q) => q.isEnabled).length} Enabled
            </span>
            <span className="rounded-full bg-slate-200 px-3.5 py-1 text-xs font-bold text-slate-700">
              {questions.filter((q) => !q.isEnabled).length} Disabled
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {sortedQuestions.length === 0 ? (
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-8 text-center text-sm text-[var(--muted)]">
              No questions found. Use the forms above to add MCQs.
            </div>
          ) : (
            sortedQuestions.map((question) => (
              <article
                key={question.id}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white/90 p-5 shadow-xs transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="rounded-full bg-slate-900 px-3 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                        {question.category}
                      </span>
                      <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-0.5 text-[11px] font-bold text-slate-800">
                        {question.topic}
                      </span>
                      <span
                        className={`rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          question.difficulty === "easy"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : question.difficulty === "hard"
                            ? "bg-rose-100 text-rose-900 border border-rose-300"
                            : "bg-amber-100 text-amber-900 border border-amber-300"
                        }`}
                      >
                        {question.difficulty} ({question.marks} {question.marks === 1 ? "Mark" : "Marks"})
                      </span>
                      <span
                        className={`rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          question.isEnabled
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {question.isEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    <p className="text-base font-semibold text-[var(--foreground)]">
                      {question.questionText}
                    </p>

                    <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 text-sm text-[var(--muted)]">
                      {question.options.map((option) => {
                        const isCorrect = option === question.correctAnswer;
                        return (
                          <li
                            key={option}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${
                              isCorrect
                                ? "border border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold"
                                : "bg-slate-50"
                            }`}
                          >
                            <span>{isCorrect ? "✓" : "•"}</span>
                            <span>{option}</span>
                          </li>
                        );
                      })}
                    </ul>

                    {question.explanation ? (
                      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                        <span className="font-bold">Explanation:</span> {question.explanation}
                      </p>
                    ) : null}

                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Updated {formatDateTime(question.updatedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link
                      href={`/admin/questions?edit=${question.id}`}
                      className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-slate-50 shadow-2xs"
                    >
                      Edit
                    </Link>
                    <form action={toggleQuestionAction}>
                      <input type="hidden" name="id" value={question.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-slate-50 shadow-2xs"
                      >
                        {question.isEnabled ? "Disable" : "Enable"}
                      </button>
                    </form>
                    <form action={deleteQuestionAction}>
                      <input type="hidden" name="id" value={question.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-900 transition hover:bg-rose-100 shadow-2xs"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
