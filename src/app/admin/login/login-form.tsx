"use client";

import { useActionState } from "react";
import Link from "next/link";

import type { LoginActionState } from "@/app/admin/actions";
import { loginAction } from "@/app/admin/actions";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-semibold text-[var(--foreground)]">
          Admin username / email
        </label>
        <input
          id="email"
          name="email"
          type="text"
          required
          className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent-deep)]"
          placeholder="admin"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-semibold text-[var(--foreground)]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent-deep)]"
          placeholder="Enter admin password"
        />
      </div>

      {state?.message ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold !text-white text-white transition-transform duration-200 hover:bg-[var(--accent)] hover:-translate-y-0.5 shadow-md disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Logging in..." : "Log In to Admin"}
      </button>

      <div className="text-center text-sm text-[var(--muted)]">
        Don&apos;t have an admin account?{" "}
        <Link href="/admin/register" className="font-semibold text-[var(--accent-deep)] hover:underline">
          Register Here
        </Link>
      </div>
    </form>
  );
}
