"use client";

import { useState } from "react";

const announcements = [
  {
    badge: "NEW",
    title: "Category & Topic Selection Modal",
    text: "Filter test session question pools by Category (Frontend, Backend, DB, Algorithms, Aptitude) & Topics with live counters!",
  },
  {
    badge: "NEW",
    title: "Multi-Select Question Bank Actions",
    text: "Select multiple questions with search filters & apply bulk Enable, Disable, or Permanent Delete in 1 click!",
  },
  {
    badge: "ENHANCED",
    title: "Outlook Mail & Candidate Invitations",
    text: "Send automated invitation emails directly for single links & bulk CSV imports with custom subject & body placeholders!",
  },
  {
    badge: "SECURITY",
    title: "Proctored Shield & Automatic Expiration",
    text: "Candidate links expire automatically upon completion. Features anti-copy protection & focus-loss watermarks!",
  },
  {
    badge: "ANALYTICS",
    title: "Real-Time Results & CSV Exports",
    text: "Filter candidate results by score, duration, and status, with instant CSV result export capability!",
  },
];

export function AdminTicker() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-slate-950 p-2.5 text-white shadow-xl">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="flex items-center gap-3">
        {/* Fixed Badge on Left */}
        <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-md shrink-0 z-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Latest Updates</span>
        </div>

        {/* Scrolling Ticker Marquee Container */}
        <div className="relative flex-1 overflow-hidden mask-linear-gradient">
          <div className="animate-marquee items-center gap-8 text-xs font-medium">
            {/* First Copy */}
            <div className="flex items-center gap-8">
              {announcements.map((item, idx) => (
                <div key={`a-${idx}`} className="flex items-center gap-2 shrink-0">
                  <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30 uppercase">
                    {item.badge}
                  </span>
                  <span className="font-bold text-slate-100">{item.title}:</span>
                  <span className="text-slate-300">{item.text}</span>
                  <span className="ml-4 text-purple-400/50">✦</span>
                </div>
              ))}
            </div>

            {/* Second Copy (for seamless infinite loop) */}
            <div className="flex items-center gap-8">
              {announcements.map((item, idx) => (
                <div key={`b-${idx}`} className="flex items-center gap-2 shrink-0">
                  <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30 uppercase">
                    {item.badge}
                  </span>
                  <span className="font-bold text-slate-100">{item.title}:</span>
                  <span className="text-slate-300">{item.text}</span>
                  <span className="ml-4 text-purple-400/50">✦</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white shrink-0 z-10"
          title="Dismiss notification ticker"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
