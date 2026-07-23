"use client";

import { useMemo, useState } from "react";
import type { Question } from "@/lib/storage/types";

export interface CategoryTopicModalProps {
  questions: Question[];
  initialSelectedCategories?: string[];
  initialSelectedTopics?: string[];
  onApply?: (categories: string[], topics: string[]) => void;
}

export function CategoryTopicModal({
  questions,
  initialSelectedCategories = [],
  initialSelectedTopics = [],
  onApply,
}: CategoryTopicModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialSelectedCategories,
  );
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    initialSelectedTopics,
  );

  // Group enabled questions by Category and Topic
  const categoryTopicTree = useMemo(() => {
    const enabled = questions.filter((q) => q.isEnabled);
    const tree: Record<
      string,
      { totalCount: number; topics: Record<string, number> }
    > = {};

    for (const q of enabled) {
      const cat = q.category || "General";
      const top = q.topic || "General";

      if (!tree[cat]) {
        tree[cat] = { totalCount: 0, topics: {} };
      }

      tree[cat].totalCount += 1;
      tree[cat].topics[top] = (tree[cat].topics[top] || 0) + 1;
    }

    return tree;
  }, [questions]);

  const allCategoryNames = useMemo(() => Object.keys(categoryTopicTree), [categoryTopicTree]);
  const allTopicNames = useMemo(() => {
    const topicsSet = new Set<string>();
    Object.values(categoryTopicTree).forEach((cat) => {
      Object.keys(cat.topics).forEach((t) => topicsSet.add(t));
    });
    return Array.from(topicsSet);
  }, [categoryTopicTree]);

  // Filtered categories/topics based on search query
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return categoryTopicTree;
    const query = searchQuery.toLowerCase();
    const result: typeof categoryTopicTree = {};

    Object.entries(categoryTopicTree).forEach(([catName, catData]) => {
      const catMatch = catName.toLowerCase().includes(query);
      const matchingTopics: Record<string, number> = {};

      Object.entries(catData.topics).forEach(([topName, count]) => {
        if (catMatch || topName.toLowerCase().includes(query)) {
          matchingTopics[topName] = count;
        }
      });

      if (Object.keys(matchingTopics).length > 0) {
        result[catName] = {
          totalCount: Object.values(matchingTopics).reduce((a, b) => a + b, 0),
          topics: matchingTopics,
        };
      }
    });

    return result;
  }, [categoryTopicTree, searchQuery]);

  // Calculate live available question count for current selections
  const availableQuestionCount = useMemo(() => {
    const enabled = questions.filter((q) => q.isEnabled);
    if (selectedCategories.length === 0 && selectedTopics.length === 0) {
      return enabled.length;
    }

    const catSet = new Set(selectedCategories.map((c) => c.toLowerCase()));
    const topSet = new Set(selectedTopics.map((t) => t.toLowerCase()));

    return enabled.filter((q) => {
      const matchCat = catSet.size === 0 || catSet.has(q.category.toLowerCase());
      const matchTop = topSet.size === 0 || topSet.has(q.topic.toLowerCase());
      return matchCat && matchTop;
    }).length;
  }, [questions, selectedCategories, selectedTopics]);

  const toggleCategory = (catName: string) => {
    if (selectedCategories.includes(catName)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== catName));
    } else {
      setSelectedCategories([...selectedCategories, catName]);
    }
  };

  const toggleTopic = (topicName: string) => {
    if (selectedTopics.includes(topicName)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topicName));
    } else {
      setSelectedTopics([...selectedTopics, topicName]);
    }
  };

  const selectAll = () => {
    setSelectedCategories(allCategoryNames);
    setSelectedTopics(allTopicNames);
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedTopics([]);
  };

  const handleApply = () => {
    setIsOpen(false);
    if (onApply) {
      onApply(selectedCategories, selectedTopics);
    }
  };

  const totalSelectedFilterCount = selectedCategories.length + selectedTopics.length;

  return (
    <>
      {/* Hidden inputs to pass array values in standard form submissions */}
      <input
        type="hidden"
        name="selectedCategories"
        value={JSON.stringify(selectedCategories)}
      />
      <input
        type="hidden"
        name="selectedTopics"
        value={JSON.stringify(selectedTopics)}
      />

      {/* Trigger Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--line)] bg-slate-50/80 p-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--foreground)]">
              Question Pool Filter
            </p>
            <p className="text-[11px] text-[var(--muted)]">
              {totalSelectedFilterCount === 0
                ? "All categories & topics selected"
                : `Filtered: ${selectedCategories.length} Categories, ${selectedTopics.length} Topics`}
              <span className="ml-2 font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                ({availableQuestionCount} Qs available)
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          Filter Categories & Topics
          {totalSelectedFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
              {totalSelectedFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Dialog Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[2rem] border border-[var(--line)] bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] bg-slate-50/90 px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <span>Filter Question Categories & Topics</span>
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                    {availableQuestionCount} Available
                  </span>
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Select which categories or specific topics to include in this test session.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-[var(--muted)] transition hover:bg-slate-200 hover:text-[var(--foreground)]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search & Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-white px-6 py-3">
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
                  placeholder="Search category or topic..."
                  className="w-full rounded-xl border border-[var(--line)] bg-slate-50 pl-9 pr-3 py-1.5 text-xs outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Modal Body / Checklist */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {Object.keys(filteredTree).length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--muted)]">
                  No categories or topics match &quot;{searchQuery}&quot;.
                </div>
              ) : (
                Object.entries(filteredTree).map(([catName, catData]) => {
                  const isCatSelected = selectedCategories.includes(catName);

                  return (
                    <div
                      key={catName}
                      className="rounded-2xl border border-[var(--line)] bg-slate-50/50 p-4 transition hover:border-purple-200"
                    >
                      {/* Category Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                        <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-sm text-[var(--foreground)]">
                          <input
                            type="checkbox"
                            checked={isCatSelected}
                            onChange={() => toggleCategory(catName)}
                            className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span>{catName}</span>
                        </label>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {catData.totalCount} Qs
                        </span>
                      </div>

                      {/* Topics Grid */}
                      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                        {Object.entries(catData.topics).map(([topicName, topicCount]) => {
                          const isTopicSelected = selectedTopics.includes(topicName);

                          return (
                            <label
                              key={topicName}
                              className={`flex items-center justify-between rounded-xl border p-2.5 transition cursor-pointer text-xs ${
                                isTopicSelected
                                  ? "border-purple-400 bg-purple-50/70 text-purple-950 font-medium"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100/70"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isTopicSelected}
                                  onChange={() => toggleTopic(topicName)}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span>{topicName}</span>
                              </div>
                              <span className="text-[10px] font-mono text-[var(--muted)] bg-slate-100 px-1.5 py-0.5 rounded">
                                {topicCount} Qs
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[var(--line)] bg-slate-50/90 px-6 py-4">
              <div className="text-xs text-[var(--muted)]">
                {totalSelectedFilterCount === 0 ? (
                  <span>Using entire question bank</span>
                ) : (
                  <span>
                    Selected: <strong>{selectedCategories.length}</strong> categories,{" "}
                    <strong>{selectedTopics.length}</strong> topics
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="rounded-full bg-purple-700 px-5 py-2 text-xs font-semibold text-white hover:bg-purple-800 shadow-md transition"
                >
                  Apply Filter ({availableQuestionCount} Qs)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
