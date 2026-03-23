"use client";

// ─── app/admin/_components/dashboard-client.tsx ───────────────────────────────

import { Suspense } from "react";
import { trpc } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Users,
  FileText,
  Activity,
  BarChart3,
  Plus,
  Gavel,
  Layers,
  BookOpen,
  ArrowRight,
  ExternalLink,
  TrendingUp,
  Zap,
  Clock,
  Target,
  ClipboardList,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "~/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function AccuracyBadge({ v }: { v: number }) {
  const cls =
    v >= 90
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : v >= 70
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-red-500/10 text-red-600 dark:text-red-400";
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        cls,
      )}
    >
      {v}%
    </span>
  );
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  legal: <Gavel className="h-3 w-3" />,
  general: <FileText className="h-3 w-3" />,
  special: <Target className="h-3 w-3" />,
};

const TYPE_COLOR: Record<string, string> = {
  legal: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  general: "bg-sky-500/10 text-sky-500 dark:text-sky-400",
  special: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
// Dark card with a soft radial glow in the corner, matching the screenshot style.

type StatCardConfig = {
  label: string;
  value: string | number;
  descriptor: string;
  sub: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ElementType;
  glowColor: string; // inline CSS color for the glow blob
};

type TrendDir = "up" | "down" | "neutral";

export function StatCard({
  label,
  value,
  story,
  sub,
  icon: Icon,
  trend,
  trendDir = "neutral",
}: {
  label: string;
  value: string | number;
  story?: string;
  sub?: string;
  icon: React.ElementType;
  trend?: string;
  trendDir?: TrendDir;
}) {
  const trendStyles =
    trendDir === "up"
      ? "bg-emerald-500/15 text-emerald-500"
      : trendDir === "down"
        ? "bg-red-500/15 text-red-400"
        : "bg-muted text-muted-foreground";

  const trendArrow = trendDir === "up" ? "▲" : trendDir === "down" ? "▼" : "•";

  return (
    <div
      className="group relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border px-6 py-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        background:
          "radial-gradient(ellipse at top right, color-mix(in oklch, var(--chart-1) 8%, var(--card)), var(--card))",
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-xs leading-none font-medium">
          {label}
        </p>

        {trend && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${trendStyles}`}
          >
            {trendArrow} {trend}
          </span>
        )}
      </div>

      {/* Value */}
      <p className="text-4xl leading-none font-bold tracking-tight tabular-nums">
        {value}
      </p>

      {/* Divider */}
      {(story || sub) && (
        <div className="space-y-1">
          {story && (
            <p className="text-foreground/80 flex items-center gap-1.5 text-sm font-semibold">
              {story}
              <Icon className="text-muted-foreground h-3.5 w-3.5" />
            </p>
          )}

          {sub && <p className="text-muted-foreground text-xs">{sub}</p>}
        </div>
      )}
    </div>
  );
}

function KpiRow() {
  const [overview] = trpc.analytics.getPlatformOverview.useSuspenseQuery();

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Total Users"
        value={fmtNum(overview.totalUsers)}
        story="Registered users"
        sub="On the platform"
        icon={Users}
        trend={`+${overview.activeUsers.last7d}`}
        trendDir="up"
      />

      <StatCard
        label="Total Tests"
        value={fmtNum(overview.totalTests)}
        story="Available tests"
        sub="Across all categories"
        icon={ClipboardList}
      />

      <StatCard
        label="Total Attempts"
        value={fmtNum(overview.totalAttempts)}
        story="All attempts"
        sub="Submitted by users"
        icon={Activity}
        trend={`+${overview.activeUsers.last1d}`}
        trendDir="up"
      />

      <StatCard
        label="Active Users"
        value={fmtNum(overview.activeUsers.last30d)}
        story="Last 30 days"
        sub={`1d: ${overview.activeUsers.last1d} • 7d: ${overview.activeUsers.last7d}`}
        icon={TrendingUp}
        trend="Engagement"
        trendDir="neutral"
      />
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  count,
  href,
  hrefLabel = "View all",
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="bg-muted flex h-6 w-6 items-center justify-center rounded-md">
          <Icon className="text-muted-foreground h-3.5 w-3.5" />
        </span>
        <h2 className="text-sm font-semibold">
          {title}
          {count !== undefined && (
            <span className="text-muted-foreground ml-1.5 font-normal">
              ({count})
            </span>
          )}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
        >
          {hrefLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// ─── Recent Attempts ──────────────────────────────────────────────────────────

function RecentAttempts() {
  const [{ data }] = trpc.result.getResults.useSuspenseQuery({
    page: 0,
    limit: 8,
    sortBy: "time",
    sortOrder: "desc",
  });

  if (data.length === 0) {
    return (
      <div>
        <SectionHeader
          icon={TrendingUp}
          title="Recent Attempts"
          href="/admin/attempts"
        />
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border py-14 text-center">
          <Activity className="text-muted-foreground/20 h-8 w-8" />
          <p className="text-muted-foreground text-sm">No submissions yet</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        icon={TrendingUp}
        title="Recent Attempts"
        href="/admin/attempts"
        hrefLabel="Explore all"
      />
      <div className="overflow-hidden rounded-2xl border">
        {/* Table header */}
        <div className="bg-muted/30 grid grid-cols-[1fr_1.4fr_80px_52px_52px_64px_80px_28px] items-center gap-3 border-b px-5 py-2.5">
          {["User", "Test", "Type", "Score", "WPM", "Acc", "When", ""].map(
            (h, i) => (
              <span
                key={i}
                className={cn(
                  "text-muted-foreground text-[10px] font-semibold tracking-[0.1em] uppercase",
                  i >= 3 && i <= 6 && "text-right",
                )}
              >
                {h}
              </span>
            ),
          )}
        </div>

        {data.map((row, idx) => (
          <div
            key={row.attemptId}
            className={cn(
              "group hover:bg-muted/30 grid grid-cols-[1fr_1.4fr_80px_52px_52px_64px_80px_28px] items-center gap-3 px-5 py-3 transition-colors",
              idx !== data.length - 1 && "border-b",
            )}
          >
            {/* User */}
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src="" />
                <AvatarFallback className="text-[9px] font-semibold">
                  {(row.user.name ?? row.user.email ?? "?")[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm leading-none font-medium">
                  {row.user.name ?? row.user.email}
                </p>
                {row.user.name && (
                  <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                    {row.user.email}
                  </p>
                )}
              </div>
            </div>

            {/* Test */}
            <Link
              href={`/admin/test/${row.test?.id}`}
              className="hover:text-primary min-w-0 truncate text-sm transition-colors"
            >
              {row.test?.title ?? "—"}
            </Link>

            {/* Type */}
            <div>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                  row.type === "assessment"
                    ? "bg-foreground/8 text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {row.type}
              </span>
            </div>

            {/* Score */}
            <p className="text-right text-sm font-bold tabular-nums">
              {row.result.score}
            </p>

            {/* WPM */}
            <p className="text-muted-foreground text-right text-sm tabular-nums">
              {row.result.wpm}
            </p>

            {/* Accuracy */}
            <div className="flex justify-end">
              <AccuracyBadge v={row.result.accuracy} />
            </div>

            {/* When */}
            <p className="text-muted-foreground text-right text-[11px] tabular-nums">
              {formatDistanceToNow(new Date(row.result.submittedAt), {
                addSuffix: true,
              })}
            </p>

            {/* Link */}
            <div className="flex justify-end">
              <Link href={`/user/attempt/${row.attemptId}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Active Tests ─────────────────────────────────────────────────────────────

function ActiveTests() {
  const [tests] = trpc.test.getTests.useSuspenseQuery({
    page: 1,
    pageSize: 8,
    status: "active",
    sort: "newest",
  });
  const [perf] = trpc.analytics.getTestPerformance.useSuspenseQuery();
  const perfMap = new Map(perf.map((p) => [p.testId, p]));

  return (
    <div className="flex flex-col">
      <SectionHeader
        icon={Layers}
        title="Active Tests"
        count={tests.total}
        href="/admin/tests?status=active"
        hrefLabel="All"
      />
      <div className="overflow-hidden rounded-2xl border">
        {tests.data.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-muted-foreground text-sm">No active tests</p>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/tests">Launch a draft</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-muted/30 grid grid-cols-[1fr_60px_68px_60px_56px] items-center gap-2 border-b px-4 py-2.5">
              {["Test", "Attempts", "Avg Score", "Acc", "WPM"].map((h, i) => (
                <span
                  key={h}
                  className={cn(
                    "text-muted-foreground text-[10px] font-semibold tracking-[0.1em] uppercase",
                    i > 0 && "text-right",
                  )}
                >
                  {h}
                </span>
              ))}
            </div>

            {tests.data.map((t, idx) => {
              const p = perfMap.get(t.id);
              return (
                <Link
                  key={t.id}
                  href={`/admin/test/${t.id}`}
                  className={cn(
                    "group hover:bg-muted/30 grid grid-cols-[1fr_60px_68px_60px_56px] items-center gap-2 px-4 py-3 transition-colors",
                    idx !== tests.data.length - 1 && "border-b",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "flex shrink-0 items-center justify-center rounded p-1",
                        TYPE_COLOR[t.type] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {TYPE_ICON[t.type] ?? <FileText className="h-3 w-3" />}
                    </span>
                    <span className="truncate text-sm">{t.title}</span>
                  </div>

                  {p ? (
                    <>
                      <span className="text-right text-sm tabular-nums">
                        {p.attempts}
                      </span>
                      <span className="text-right text-sm font-semibold tabular-nums">
                        {Math.round(Number(p.avgScore))}
                      </span>
                      <div className="flex justify-end">
                        <AccuracyBadge v={Math.round(Number(p.avgAccuracy))} />
                      </div>
                      <span className="text-muted-foreground text-right text-sm tabular-nums">
                        {Math.round(Number(p.avgWpm))}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground/40 col-span-4 text-right text-xs">
                      No attempts yet
                    </span>
                  )}
                </Link>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Draft Tests ──────────────────────────────────────────────────────────────

function DraftTests() {
  const [drafts] = trpc.test.getTests.useSuspenseQuery({
    page: 1,
    pageSize: 6,
    status: "draft",
    sort: "newest",
  });

  return (
    <div className="flex flex-col">
      <SectionHeader
        icon={BookOpen}
        title="Drafts"
        href="/admin/tests/new"
        hrefLabel="New"
      />
      <div className="overflow-hidden rounded-2xl border">
        {drafts.data.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-muted-foreground text-sm">No drafts</p>
            <Button size="sm" asChild>
              <Link href="/admin/tests/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create Test
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {drafts.data.map((t, idx) => (
              <Link
                key={t.id}
                href={`/admin/test/${t.id}`}
                className={cn(
                  "hover:bg-muted/30 flex items-center justify-between gap-3 px-4 py-3 transition-colors",
                  idx !== drafts.data.length - 1 && "border-b",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(t.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                    TYPE_COLOR[t.type] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  {TYPE_ICON[t.type]}
                  {t.type}
                </span>
              </Link>
            ))}

            {drafts.totalPages > 1 && (
              <Link
                href="/admin/tests?status=draft"
                className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 border-t px-4 py-2.5 text-xs transition-colors"
              >
                View all {drafts.total} drafts
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl p-5"
          style={{
            background: "#1c1c1f",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Skeleton className="mb-4 h-2.5 w-20 bg-white/10" />
          <Skeleton className="h-10 w-16 bg-white/10" />
          <div className="mt-3 space-y-1.5">
            <Skeleton className="h-3.5 w-28 bg-white/10" />
            <Skeleton className="h-2.5 w-20 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border">
      <div className="bg-muted/30 border-b px-5 py-2.5">
        <Skeleton className="h-2.5 w-40" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-3 px-5 py-3",
            i !== rows - 1 && "border-b",
          )}
        >
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-10" />
          <Skeleton className="h-3.5 w-10" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function ColSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-3 px-4 py-3",
            i !== rows - 1 && "border-b",
          )}
        >
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <Skeleton className="h-3.5 w-14" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardClient() {
  const today = format(new Date(), "EEEE, MMM d");

  // Preload before Suspense boundaries
  trpc.analytics.getPlatformOverview.useQuery(undefined, { staleTime: 60_000 });
  trpc.analytics.getTestPerformance.useQuery(undefined, { staleTime: 60_000 });
  trpc.result.getResults.useQuery(
    { page: 0, limit: 8, sortBy: "time", sortOrder: "desc" },
    { staleTime: 30_000 },
  );
  trpc.test.getTests.useQuery(
    { page: 1, pageSize: 6, status: "draft", sort: "newest" },
    { staleTime: 60_000 },
  );
  trpc.test.getTests.useQuery(
    { page: 1, pageSize: 8, status: "active", sort: "newest" },
    { staleTime: 60_000 },
  );

  return (
    <div className="w-full space-y-6 px-6 py-7">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">{today}</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/admin/tests/new">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create Test
          </Link>
        </Button>
      </div>

      {/* ── KPI cards ── */}
      <Suspense fallback={<KpiSkeleton />}>
        <KpiRow />
      </Suspense>

      {/* ── Recent attempts ── */}
      <Suspense
        fallback={
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-4 w-32" />
            </div>
            <TableSkeleton rows={6} />
          </div>
        }
      >
        <RecentAttempts />
      </Suspense>

      {/* ── Bottom 2-col grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense
          fallback={
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-md" />
                <Skeleton className="h-4 w-28" />
              </div>
              <ColSkeleton rows={6} />
            </div>
          }
        >
          <DraftTests />
        </Suspense>

        <Suspense
          fallback={
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-md" />
                <Skeleton className="h-4 w-28" />
              </div>
              <ColSkeleton rows={6} />
            </div>
          }
        >
          <ActiveTests />
        </Suspense>
      </div>
    </div>
  );
}
