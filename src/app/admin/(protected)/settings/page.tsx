import { changeAdminPasswordAction, updateSettingsAction } from "@/app/admin/actions";
import { csvStorageProvider, getStorageProvider, postgresStorageProvider } from "@/lib/storage";

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSettingsPage(
  props: PageProps<"/admin/settings">,
) {
  const [csvSettings, activeProvider, isPostgresConnected, searchParams] = await Promise.all([
    csvStorageProvider.getSettings(),
    getStorageProvider(),
    postgresStorageProvider.isConnected(),
    props.searchParams,
  ]);

  const successMessage = getParamValue(searchParams.success);
  const errorMessage = getParamValue(searchParams.error);
  const noticeMessage = getParamValue(searchParams.notice);
  const resolvedProvider = activeProvider === postgresStorageProvider ? "postgres" : "csv";
  const envStorageProvider = (process.env.STORAGE_PROVIDER || process.env.DB_PROVIDER || "").trim().toLowerCase();

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

      {noticeMessage ? (
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm font-medium text-amber-900 shadow-sm">
          <svg className="h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {noticeMessage}
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

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Storage Backend Control */}
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
            Storage Settings
          </p>
          <h2 className="mt-1.5 text-2xl font-semibold text-[var(--foreground)]">
            Storage Backend Engine
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Toggle between local CSV file storage and PostgreSQL database. Environment parameters are configured in <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">.env</code>.
          </p>

          <form action={updateSettingsAction} className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="storageProvider" className="text-sm font-semibold text-[var(--foreground)]">
                Active Storage Provider
              </label>
              <select
                id="storageProvider"
                name="storageProvider"
                defaultValue={csvSettings.storageProvider}
                className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              >
                <option value="csv">CSV Storage Files (data/*.csv)</option>
                <option value="postgres">PostgreSQL Database (pg pool)</option>
              </select>
            </div>

            <label className="inline-flex items-center gap-3 text-sm font-medium text-[var(--foreground)]">
              <input
                type="checkbox"
                name="postgresConfigured"
                defaultChecked={csvSettings.postgresConfigured || isPostgresConnected}
                className="h-4 w-4 rounded border-gray-300 text-[var(--accent)]"
              />
              PostgreSQL connection details are configured in .env
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[var(--accent-deep)] px-6 py-3 text-sm font-semibold !text-white text-white transition hover:bg-[var(--accent)] shadow-md"
            >
              Save Credentials & Switch Engine
            </button>
          </form>

          <hr className="my-6 border-[var(--line)]" />

          {/* Connection Status Overview */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Live System Status
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4">
                <p className="text-xs text-[var(--muted)]">Active Engine</p>
                <p className="mt-1 text-xl font-bold uppercase text-[var(--foreground)]">
                  {resolvedProvider}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4">
                <p className="text-xs text-[var(--muted)]">.env Configured DB</p>
                <p className="mt-1 text-xl font-bold uppercase text-[var(--accent-deep)]">
                  {envStorageProvider || "Not Set"}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4">
                <p className="text-xs text-[var(--muted)]">PostgreSQL DB</p>
                <p className={`mt-1 text-xl font-bold ${isPostgresConnected ? "text-emerald-700" : "text-amber-700"}`}>
                  {isPostgresConnected ? "Connected ✓" : "Offline"}
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Change Admin Password */}
        <article className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
            Security & Credentials
          </p>
          <h2 className="mt-1.5 text-2xl font-semibold text-[var(--foreground)]">
            Change Admin Password
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Update your admin password. The new password will be hashed with bcrypt and stored securely in app settings.
          </p>

          <form action={changeAdminPasswordAction} className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="currentPassword" className="text-sm font-semibold text-[var(--foreground)]">
                Current Password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="Enter current password"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="newPassword" className="text-sm font-semibold text-[var(--foreground)]">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={6}
                className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="Enter new password (min. 6 characters)"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-[var(--foreground)]">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                className="rounded-[1.25rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="Re-enter new password"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-slate-50 shadow-xs"
            >
              <svg className="h-4 w-4 text-[var(--accent-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Update Admin Password
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
