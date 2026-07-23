import Link from "next/link";

import { AdminTicker } from "./admin-ticker";
import { logoutAction } from "@/app/admin/actions";
import { requireAdminSession } from "@/lib/auth/session";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/results", label: "Results" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAdminSession();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-6 sm:px-10 lg:px-12">
      {/* Scrolling Enhancement Announcement Ticker */}
      <AdminTicker />

      <header className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] px-6 py-5 shadow-[0_12px_40px_rgba(99,102,110,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
              Accelirate admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
              Exam platform control room
            </h1>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Signed in as <span className="font-semibold text-[var(--foreground)]">{session.email}</span>
            </p>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white/80 px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-white"
            >
              Sign out
            </button>
          </form>
        </div>

        <nav className="mt-5 flex flex-wrap gap-3">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-[var(--line)] bg-white/65 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      {children}
    </div>
  );
}
