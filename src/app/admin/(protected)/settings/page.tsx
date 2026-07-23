import {
  addEmailConfigAction,
  changeAdminPasswordAction,
  deleteEmailConfigAction,
  testEmailConfigAction,
  updateEmailConfigAction,
  updateSettingsAction,
} from "@/app/admin/actions";
import { csvStorageProvider, getStorageProvider, postgresStorageProvider } from "@/lib/storage";
import { formatDateTime } from "@/lib/format";

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSettingsPage(
  props: PageProps<"/admin/settings">,
) {
  const activeProvider = await getStorageProvider();
  const [csvSettings, isPostgresConnected, emailConfigs, searchParams] = await Promise.all([
    csvStorageProvider.getSettings(),
    postgresStorageProvider.isConnected(),
    activeProvider.getEmailConfigs(),
    props.searchParams,
  ]);

  const successMessage = getParamValue(searchParams.success);
  const errorMessage = getParamValue(searchParams.error);
  const noticeMessage = getParamValue(searchParams.notice);
  const editId = getParamValue(searchParams.editConfig);
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

      {/* Outlook Email Configurations (Tabular & Editable) */}
      <section className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-deep)]">
              Email Delivery Engine
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
              Outlook Email Configurations
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Configure multiple Microsoft Graph API Outlook sender credentials for candidate test link invitations.
            </p>
          </div>
        </div>

        {/* Tabular Table of Configured Outlook Accounts */}
        <div className="mt-6 overflow-x-auto rounded-[1.25rem] border border-[var(--line)] bg-white">
          <table className="w-full text-left text-sm text-[var(--foreground)]">
            <thead className="border-b border-[var(--line)] bg-slate-50 text-xs uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Email Address</th>
                <th className="px-5 py-3.5 font-semibold">Application ID (Client ID)</th>
                <th className="px-5 py-3.5 font-semibold">Tenant ID</th>
                <th className="px-5 py-3.5 font-semibold">Client Secret</th>
                <th className="px-5 py-3.5 font-semibold">Updated</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {emailConfigs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-[var(--muted)]">
                    No Outlook email accounts configured yet. Add your first configuration below.
                  </td>
                </tr>
              ) : (
                emailConfigs.map((config) => {
                  const isEditing = editId === config.id;

                  if (isEditing) {
                    return (
                      <tr key={config.id} className="bg-amber-50/50">
                        <td colSpan={6} className="p-4">
                          <form action={updateEmailConfigAction} className="grid gap-3 rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
                            <input type="hidden" name="id" value={config.id} />
                            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                              Editing Configuration for {config.emailAddress}
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <div>
                                <label className="text-xs font-semibold text-[var(--foreground)]">Email Address</label>
                                <input
                                  name="emailAddress"
                                  type="email"
                                  defaultValue={config.emailAddress}
                                  required
                                  className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2 text-xs outline-none focus:border-[var(--accent-deep)]"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-[var(--foreground)]">Application ID</label>
                                <input
                                  name="applicationId"
                                  defaultValue={config.applicationId}
                                  required
                                  className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2 text-xs outline-none focus:border-[var(--accent-deep)]"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-[var(--foreground)]">Tenant ID</label>
                                <input
                                  name="tenantId"
                                  defaultValue={config.tenantId}
                                  required
                                  className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2 text-xs outline-none focus:border-[var(--accent-deep)]"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-[var(--foreground)]">Client Secret</label>
                                <input
                                  name="clientSecret"
                                  type="password"
                                  defaultValue={config.clientSecret}
                                  required
                                  className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2 text-xs outline-none focus:border-[var(--accent-deep)]"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                              <a
                                href="/admin/settings"
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                              >
                                Cancel
                              </a>
                              <button
                                type="submit"
                                className="rounded-lg bg-[var(--accent-deep)] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--accent)]"
                              >
                                Save Changes
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={config.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-semibold text-[var(--foreground)]">
                        {config.emailAddress}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-[var(--muted)]">
                        {config.applicationId.slice(0, 8)}...{config.applicationId.slice(-4)}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-[var(--muted)]">
                        {config.tenantId.slice(0, 8)}...{config.tenantId.slice(-4)}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-[var(--muted)]">
                        ••••••••••••
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--muted)]">
                        {formatDateTime(config.updatedAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <form action={testEmailConfigAction}>
                            <input type="hidden" name="id" value={config.id} />
                            <button
                              type="submit"
                              title="Test Microsoft Graph API Connection"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
                            >
                              <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Test Config
                            </button>
                          </form>

                          <a
                            href={`/admin/settings?editConfig=${config.id}`}
                            className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--foreground)] transition hover:bg-slate-100"
                          >
                            Edit
                          </a>

                          <form action={deleteEmailConfigAction}>
                            <input type="hidden" name="id" value={config.id} />
                            <button
                              type="submit"
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Add New Outlook Configuration Form */}
        <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white/90 p-5">
          <h3 className="text-base font-semibold text-[var(--foreground)]">
            Add New Outlook Account Configuration
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Register your Azure App credentials (Client ID, Tenant ID, Client Secret) with <code className="rounded bg-slate-100 px-1 py-0.5 text-slate-800">Mail.Send</code> application permission.
          </p>

          <form action={addEmailConfigAction} className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-1.5">
              <label htmlFor="emailAddress" className="text-xs font-semibold text-[var(--foreground)]">
                Email Address
              </label>
              <input
                id="emailAddress"
                name="emailAddress"
                type="email"
                required
                placeholder="hr@company.com"
                className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-xs outline-none transition focus:border-[var(--accent-deep)]"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="applicationId" className="text-xs font-semibold text-[var(--foreground)]">
                Application ID (Client ID)
              </label>
              <input
                id="applicationId"
                name="applicationId"
                required
                placeholder="00000000-0000-0000-0000-000000000000"
                className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-xs outline-none transition focus:border-[var(--accent-deep)]"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="tenantId" className="text-xs font-semibold text-[var(--foreground)]">
                Directory (Tenant) ID
              </label>
              <input
                id="tenantId"
                name="tenantId"
                required
                placeholder="00000000-0000-0000-0000-000000000000"
                className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-xs outline-none transition focus:border-[var(--accent-deep)]"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="clientSecret" className="text-xs font-semibold text-[var(--foreground)]">
                Client Secret
              </label>
              <input
                id="clientSecret"
                name="clientSecret"
                type="password"
                required
                placeholder="Client secret value"
                className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-xs outline-none transition focus:border-[var(--accent-deep)]"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-deep)] px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-[var(--accent)] shadow-md"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Outlook Configuration
              </button>
            </div>
          </form>
        </div>
      </section>

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
