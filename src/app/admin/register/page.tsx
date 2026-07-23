import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/app/admin/register/register-form";
import { getAdminSession } from "@/lib/auth/session";

export default async function AdminRegisterPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 sm:px-10">
      <div className="grid w-full gap-8 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--panel-strong)] shadow-[0_18px_60px_rgba(75,85,99,0.12)] lg:grid-cols-[1fr_1fr]">
        <section className="flex flex-col justify-between gap-8 bg-[linear-gradient(180deg,rgba(215,236,230,0.82),rgba(255,255,255,0.9))] px-6 py-8 sm:px-8">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent-deep)]">
              Admin Registration
            </p>
            <h1 className="font-serif text-4xl leading-tight text-[var(--foreground)] sm:text-5xl">
              Create a new administrator account.
            </h1>
            <p className="max-w-xl text-base leading-8 text-[var(--muted)]">
              Registered admin accounts are saved directly into your configured storage backend (CSV or PostgreSQL database).
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-5 text-sm text-[var(--muted)]">
            <p className="font-semibold text-[var(--foreground)]">Role-based Access Control</p>
            <p className="mt-1 leading-6">
              New administrators receive immediate control room access to question banks, test sessions, candidate evaluation metrics, and system configuration.
            </p>
          </div>
        </section>

        <section className="px-6 py-8 sm:px-8">
          <div className="mx-auto flex h-full max-w-md flex-col justify-center gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
                Register
              </p>
              <h2 className="text-3xl font-semibold text-[var(--foreground)]">Admin Sign Up</h2>
              <p className="text-sm leading-6 text-[var(--muted)]">
                Fill in your details below to register a new administrator account.
              </p>
            </div>

            <RegisterForm />

            <div className="pt-2">
              <Link href="/" className="text-sm font-semibold text-[var(--accent-deep)] hover:underline">
                ← Back to landing page
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
