"use client";

import { useActionState } from "react";
import Link from "next/link";

import type { RegisterActionState } from "@/app/admin/actions";
import { registerAdminAction } from "@/app/admin/actions";

const initialState: RegisterActionState = {};

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAdminAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-1.5">
        <label htmlFor="name" className="text-sm font-semibold text-[var(--foreground)]">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent-deep)]"
          placeholder="John Doe"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-[var(--foreground)]">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent-deep)]"
          placeholder="admin@company.com"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-[var(--foreground)]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent-deep)]"
          placeholder="Create password (min. 6 chars)"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-semibold text-[var(--foreground)]">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent-deep)]"
          placeholder="Confirm password"
        />
      </div>

      {state?.message ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 inline-flex items-center justify-center rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold !text-white text-white transition-transform duration-200 hover:bg-[var(--accent)] hover:-translate-y-0.5 shadow-md disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Registering..." : "Create Admin Account"}
      </button>

      <div className="mt-2 text-center text-sm text-[var(--muted)]">
        Already have an admin account?{" "}
        <Link href="/admin/login" className="font-semibold text-[var(--accent-deep)] hover:underline">
          Sign In
        </Link>
      </div>
    </form>
  );
}
