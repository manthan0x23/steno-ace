import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentAdmin } from "~/server/admin/auth";

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-50">
      <div className="container flex flex-col gap-6 px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight">Admin Space</h1>
        <p className="max-w-xl text-sm text-slate-300">
          Create and manage stenography tests, dashboards, leaderboard and
          users.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/tests"
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700"
          >
            <h2 className="mb-1 text-lg font-semibold">
              Test management (major)
            </h2>
            <p className="text-xs text-slate-300">
              Create stenography-based tests and manage their lifecycle.
            </p>
          </Link>

          <Link
            href="/admin/dashboard"
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700"
          >
            <h2 className="mb-1 text-lg font-semibold">Dashboards</h2>
            <p className="text-xs text-slate-300">
              View high-level metrics on users, revenue and tests.
            </p>
          </Link>

          <Link
            href="/admin/leaderboard"
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700"
          >
            <h2 className="mb-1 text-lg font-semibold">
              Leaderboard management
            </h2>
            <p className="text-xs text-slate-300">
              Configure leaderboard rules and visibility.
            </p>
          </Link>

          <Link
            href="/admin/users"
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700"
          >
            <h2 className="mb-1 text-lg font-semibold">User management</h2>
            <p className="text-xs text-slate-300">
              Inspect and manage user accounts and invitations.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}

