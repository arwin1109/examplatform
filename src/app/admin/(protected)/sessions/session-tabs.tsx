"use client";

import { useState } from "react";
import Link from "next/link";
import { bulkCreateCandidateSessionsAction, createSessionAction } from "@/app/admin/actions";
import type { EmailConfig } from "@/lib/storage/types";

interface SessionTabsProps {
  enabledQuestionCount: number;
  emailConfigs: EmailConfig[];
}

export function SessionTabs({ enabledQuestionCount, emailConfigs }: SessionTabsProps) {
  const [activeTab, setActiveTab] = useState<"bulk" | "single">("bulk");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      {/* Tab Switcher & Template Download Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--line)] pb-4">
        <div className="inline-flex rounded-full border border-[var(--line)] bg-white/80 p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("bulk")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeTab === "bulk"
                ? "bg-[var(--accent-deep)] text-white shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Bulk Candidates (CSV)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeTab === "single"
                ? "bg-[var(--accent-deep)] text-white shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Single Test Link
          </button>
        </div>

        {activeTab === "bulk" && (
          <a
            href="/api/admin/candidate-template"
            download="candidate_template.csv"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-slate-50 shadow-xs shrink-0"
            title="Download Sample Candidate CSV Template"
          >
            <svg className="h-4 w-4 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download CSV Template</span>
          </a>
        )}
      </div>

      {/* Tab 1: Bulk Candidate Creation Form */}
      {activeTab === "bulk" && (
        <form action={bulkCreateCandidateSessionsAction} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="titlePrefix" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Assessment Title / Prefix
              </label>
              <input
                id="titlePrefix"
                name="titlePrefix"
                required
                defaultValue="Aptitude Screening"
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="e.g. Full Stack Assessment"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="candidateCsv" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Candidate CSV File
              </label>
              <div className="relative flex h-[46px] w-full items-center overflow-hidden rounded-xl border border-[var(--line)] bg-white transition focus-within:border-[var(--accent-deep)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)]">
                <input
                  id="candidateCsv"
                  name="candidateCsv"
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setSelectedFileName(file ? file.name : null);
                  }}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                />
                <div className="flex h-full w-full items-center justify-between min-w-0">
                  <span className={`truncate px-4 text-xs ${selectedFileName ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
                    {selectedFileName || "Choose CSV file (name, email, phone)..."}
                  </span>
                  <span className="flex h-full shrink-0 items-center justify-center border-l border-[var(--line)] bg-slate-100 px-4 text-xs font-semibold text-slate-700">
                    Browse
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="bulkQuestionCount" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Question Count per Session
              </label>
              <input
                id="bulkQuestionCount"
                name="questionCount"
                type="number"
                min="1"
                max={Math.max(enabledQuestionCount, 1)}
                defaultValue={Math.min(Math.max(enabledQuestionCount, 1), 10)}
                required
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)]"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="bulkTimeLimitMinutes" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Time Limit (minutes)
              </label>
              <input
                id="bulkTimeLimitMinutes"
                name="timeLimitMinutes"
                type="number"
                min="1"
                defaultValue="20"
                required
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)]"
              />
            </div>
          </div>

          {/* Email Settings Box */}
          <div className="rounded-2xl border border-[var(--line)] bg-white/90 p-5 grid gap-4">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <label htmlFor="senderEmailId" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Sender Outlook Email
              </label>
              {emailConfigs.length === 0 ? (
                <Link href="/admin/settings" className="text-xs font-semibold text-rose-600 hover:underline">
                  ⚠️ No emails configured. Add in Settings →
                </Link>
              ) : (
                <span className="text-xs text-[var(--muted)]">{emailConfigs.length} configured email(s) available</span>
              )}
            </div>

            <select
              id="senderEmailId"
              name="senderEmailId"
              className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--accent-deep)]"
            >
              {emailConfigs.length === 0 ? (
                <option value="">No configured Outlook emails available</option>
              ) : (
                emailConfigs.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.emailAddress} (App ID: {config.applicationId.slice(0, 8)}...)
                  </option>
                ))
              )}
            </select>

            <div className="grid gap-1.5">
              <label htmlFor="emailSubject" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Email Subject Line
              </label>
              <input
                id="emailSubject"
                name="emailSubject"
                required
                defaultValue="Your Aptitude Assessment Test Link - {test_title}"
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--accent-deep)]"
              />
            </div>

            <div className="grid gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <label htmlFor="emailBody" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  Email Body Content
                </label>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{`{candidate_name}`}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{`{test_link}`}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{`{time_limit}`}</span>
                </div>
              </div>
              <textarea
                id="emailBody"
                name="emailBody"
                rows={4}
                required
                defaultValue={`Hello {candidate_name},\n\nYou have been invited to complete the aptitude assessment: {test_title}.\n\nPlease click the link below to start your test:\n{test_link}\n\nDetails:\n- Time Limit: {time_limit} minutes\n- Questions: {question_count}\n\nNote: Once completed or ended, this link will automatically expire.\n\nGood luck!`}
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 font-mono text-xs leading-5 outline-none transition focus:border-[var(--accent-deep)]"
              />
            </div>

            <label className="inline-flex items-center gap-3 text-xs font-semibold text-[var(--foreground)]">
              <input
                type="checkbox"
                name="sendEmail"
                defaultChecked={emailConfigs.length > 0}
                className="h-4 w-4 rounded border-gray-300 text-[var(--accent)]"
              />
              Send invitation emails automatically via Outlook Graph API
            </label>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-deep)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--accent)] shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate Links & Dispatch Emails
          </button>
        </form>
      )}

      {/* Tab 2: Single Test Link Form */}
      {activeTab === "single" && (
        <form action={createSessionAction} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Session Title
              </label>
              <input
                id="title"
                name="title"
                required
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)]"
                placeholder="e.g. Frontend Engineering Screening"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="sessionId" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Custom Session ID
              </label>
              <input
                id="sessionId"
                name="sessionId"
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)]"
                placeholder="Optional, auto-generated if empty"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="candidateName" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Candidate Name <span className="text-[var(--muted)] font-normal">(Optional)</span>
              </label>
              <input
                id="candidateName"
                name="candidateName"
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)]"
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="candidateEmail" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Candidate Email Address <span className="text-[var(--muted)] font-normal">(Optional)</span>
              </label>
              <input
                id="candidateEmail"
                name="candidateEmail"
                type="email"
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)]"
                placeholder="e.g. candidate@company.com"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="questionCount" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Question Count
              </label>
              <input
                id="questionCount"
                name="questionCount"
                type="number"
                min="1"
                max={Math.max(enabledQuestionCount, 1)}
                defaultValue={Math.min(Math.max(enabledQuestionCount, 1), 10)}
                required
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)]"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="timeLimitMinutes" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Time Limit (minutes)
              </label>
              <input
                id="timeLimitMinutes"
                name="timeLimitMinutes"
                type="number"
                min="1"
                defaultValue="20"
                required
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)]"
              />
            </div>
          </div>

          {/* Email Settings Box for Single Session */}
          <div className="rounded-2xl border border-[var(--line)] bg-white/90 p-5 grid gap-4">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <label htmlFor="singleSenderEmailId" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Sender Outlook Email
              </label>
              {emailConfigs.length === 0 ? (
                <Link href="/admin/settings" className="text-xs font-semibold text-rose-600 hover:underline">
                  ⚠️ No emails configured. Add in Settings →
                </Link>
              ) : (
                <span className="text-xs text-[var(--muted)]">{emailConfigs.length} configured email(s) available</span>
              )}
            </div>

            <select
              id="singleSenderEmailId"
              name="senderEmailId"
              className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--accent-deep)]"
            >
              {emailConfigs.length === 0 ? (
                <option value="">No configured Outlook emails available</option>
              ) : (
                emailConfigs.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.emailAddress} ({config.authType === "delegated" ? "Delegated" : "Application"})
                  </option>
                ))
              )}
            </select>

            <div className="grid gap-1.5">
              <label htmlFor="singleEmailSubject" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Email Subject Line
              </label>
              <input
                id="singleEmailSubject"
                name="emailSubject"
                defaultValue="Your Aptitude Assessment Test Link - {test_title}"
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--accent-deep)]"
              />
            </div>

            <div className="grid gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <label htmlFor="singleEmailBody" className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  Email Body Content
                </label>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{`{candidate_name}`}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{`{test_link}`}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{`{time_limit}`}</span>
                </div>
              </div>
              <textarea
                id="singleEmailBody"
                name="emailBody"
                rows={4}
                defaultValue={`Hello {candidate_name},\n\nYou have been invited to complete the aptitude assessment: {test_title}.\n\nPlease click the link below to start your test:\n{test_link}\n\nDetails:\n- Time Limit: {time_limit} minutes\n- Questions: {question_count}\n\nNote: Once completed or ended, this link will automatically expire.\n\nGood luck!`}
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 font-mono text-xs leading-5 outline-none transition focus:border-[var(--accent-deep)]"
              />
            </div>

            <label className="inline-flex items-center gap-3 text-xs font-semibold text-[var(--foreground)]">
              <input
                type="checkbox"
                name="sendEmail"
                defaultChecked={emailConfigs.length > 0}
                className="h-4 w-4 rounded border-gray-300 text-[var(--accent)]"
              />
              Send invitation email automatically if candidate email address is entered
            </label>
          </div>

          <label className="inline-flex items-center gap-3 text-xs font-semibold text-[var(--foreground)]">
            <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 rounded border-gray-300" />
            Activate session immediately after creation
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-deep)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--accent)] shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Single Session Link
          </button>
        </form>
      )}
    </div>
  );
}
