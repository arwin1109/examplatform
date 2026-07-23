"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  bulkDeleteQuestionsAction,
  bulkUpdateQuestionsAction,
  deleteQuestionAction,
  toggleQuestionAction,
} from "@/app/admin/actions";
import { formatDateTime } from "@/lib/format";
import type { Question } from "@/lib/storage/types";

interface QuestionsListManagerProps {
  questions: Question[];
}

export function QuestionsListManager({ questions }: QuestionsListManagerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Extract unique categories & topics for filter dropdowns
  const categories = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.category) set.add(q.category);
    });
    return Array.from(set).sort();
  }, [questions]);

  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (categoryFilter === "all" || q.category === categoryFilter) {
        if (q.topic) set.add(q.topic);
      }
    });
    return Array.from(set).sort();
  }, [questions, categoryFilter]);

  // Filtered matching questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchCat = categoryFilter === "all" || q.category === categoryFilter;
      const matchTopic = topicFilter === "all" || q.topic === topicFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        q.questionText.toLowerCase().includes(query) ||
        q.category.toLowerCase().includes(query) ||
        q.topic.toLowerCase().includes(query);

      return matchCat && matchTopic && matchSearch;
    });
  }, [questions, categoryFilter, topicFilter, searchQuery]);

  const isAllFilteredSelected =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((q) => selectedIds.includes(q.id));

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredSet = new Set(filteredQuestions.map((q) => q.id));
      setSelectedIds(selectedIds.filter((id) => !filteredSet.has(id)));
    } else {
      const combined = new Set([...selectedIds, ...filteredQuestions.map((q) => q.id)]);
      setSelectedIds(Array.from(combined));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleDeleteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (
      !confirm(
        `Are you sure you want to PERMANENTLY DELETE ${selectedIds.length} selected question(s)? This action cannot be undone.`,
      )
    ) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-slate-50/80 p-4">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search question text, category, or topic..."
              className="w-full rounded-xl border border-[var(--line)] bg-white pl-9 pr-3 py-2 text-xs outline-none focus:border-[var(--accent-deep)]"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setTopicFilter("all");
            }}
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs outline-none focus:border-[var(--accent-deep)]"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Topic Dropdown */}
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs outline-none focus:border-[var(--accent-deep)]"
          >
            <option value="all">All Topics ({availableTopics.length})</option>
            {availableTopics.map((top) => (
              <option key={top} value={top}>
                {top}
              </option>
            ))}
          </select>
        </div>

        {/* Master Select All Checkbox */}
        <label className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-slate-50 transition shrink-0">
          <input
            type="checkbox"
            checked={isAllFilteredSelected}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span>Select All ({filteredQuestions.length})</span>
        </label>
      </div>

      {/* Floating Sticky Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-40 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-300 bg-slate-900 px-5 py-3.5 text-white shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500 text-xs font-bold">
              {selectedIds.length}
            </span>
            <div>
              <p className="text-xs font-bold text-white">
                {selectedIds.length} Question{selectedIds.length === 1 ? "" : "s"} Selected
              </p>
              <p className="text-[10px] text-purple-200">Choose a bulk action to apply to all selected items</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Enable Bulk Action */}
            <form action={bulkUpdateQuestionsAction}>
              <input type="hidden" name="questionIds" value={JSON.stringify(selectedIds)} />
              <input type="hidden" name="actionType" value="enable" />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 shadow-xs"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Enable Selected
              </button>
            </form>

            {/* Disable Bulk Action */}
            <form action={bulkUpdateQuestionsAction}>
              <input type="hidden" name="questionIds" value={JSON.stringify(selectedIds)} />
              <input type="hidden" name="actionType" value="disable" />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500 shadow-xs"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Disable Selected
              </button>
            </form>

            {/* Delete Bulk Action */}
            <form action={bulkDeleteQuestionsAction} onSubmit={handleDeleteSubmit}>
              <input type="hidden" name="questionIds" value={JSON.stringify(selectedIds)} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500 shadow-xs"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Selected
              </button>
            </form>

            <button
              type="button"
              onClick={clearSelection}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Questions Cards List */}
      <div className="grid gap-4">
        {filteredQuestions.length === 0 ? (
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-8 text-center text-sm text-[var(--muted)]">
            No questions match the active search or category filters.
          </div>
        ) : (
          filteredQuestions.map((question) => {
            const isSelected = selectedIds.includes(question.id);

            return (
              <article
                key={question.id}
                className={`rounded-[1.5rem] border p-5 transition ${
                  isSelected
                    ? "border-purple-400 bg-purple-50/40 shadow-sm"
                    : "border-[var(--line)] bg-white/90 shadow-xs hover:shadow-md"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Select Checkbox & Question Info */}
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(question.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                    />

                    <div className="flex-1 min-w-0">
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
                  </div>

                  {/* Individual Actions */}
                  <div className="flex flex-wrap gap-2 shrink-0 lg:self-start">
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
            );
          })
        )}
      </div>
    </div>
  );
}
