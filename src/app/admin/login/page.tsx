import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/admin/login/login-form";
import { getAdminSession } from "@/lib/auth/session";

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 sm:px-10">
      <div className="grid w-full gap-8 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--panel-strong)] shadow-[0_18px_60px_rgba(75,85,99,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between gap-8 bg-[linear-gradient(180deg,rgba(215,236,230,0.82),rgba(255,255,255,0.9))] px-6 py-8 sm:px-8">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent-deep)]">
              Admin access
            </p>
            <h1 className="font-serif text-5xl leading-tight text-[var(--foreground)]">
              Manage exams, sessions, results, and storage from one place.
            </h1>
            <p className="max-w-xl text-base leading-8 text-[var(--muted)]">
              This is the local admin login for version 1. The dashboard behind
              it now includes question CRUD, session creation, results review,
              and storage settings.
            </p>
          </div>
        </section>

        <section className="px-6 py-8 sm:px-8">
          <div className="mx-auto flex h-full max-w-md flex-col justify-center gap-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
                Sign in
              </p>
              <h2 className="text-3xl font-semibold text-[var(--foreground)]">Admin dashboard login</h2>
              <p className="text-sm leading-7 text-[var(--muted)]">
                Use your admin credentials to enter the protected exam management area.
              </p>
            </div>

            <LoginForm />

            <Link href="/" className="text-sm font-semibold text-[var(--accent-deep)]">
              Back to landing page
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
