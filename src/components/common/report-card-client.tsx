"use client";

// ─── components/common/report-card-client.tsx ────────────────────────────────
//
// Generic report card — used by:
//   /user/report-card              → <ReportCardClient />
//   /admin/report-card/[userId]    → <ReportCardClient userId={params.userId} isAdmin />
//
// When userId is undefined, fetches data for the current logged-in user.

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { trpc } from "~/trpc/react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Star,
  Activity,
  Target,
  Zap,
  AlertCircle,
  Trophy,
  TrendingUp,
  BarChart2,
  Gavel,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  format,
  startOfYear,
  subDays,
  endOfToday,
  eachDayOfInterval,
  getDay,
  formatDistanceToNow,
  endOfYear,
} from "date-fns";
import Link from "next/link";
import { Button } from "~/components/ui/button";

// ─── constants ────────────────────────────────────────────────────────────────

const ACCURACY_COLOR = "#10b981";
const MISTAKE_COLOR = "#f59e0b";

// ─── helpers ──────────────────────────────────────────────────────────────────

function accColor(a: number) {
  return a >= 90
    ? "text-emerald-500"
    : a >= 70
      ? "text-amber-500"
      : "text-destructive";
}

function accLabel(a: number) {
  return a >= 95
    ? "Excellent"
    : a >= 85
      ? "Good"
      : a >= 70
        ? "Fair"
        : "Needs work";
}

function TypeBadge({ type }: { type: "legal" | "general" }) {
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ring-1 ring-inset",
        type === "legal"
          ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
          : "bg-violet-500/10 text-violet-400 ring-violet-500/20",
      ].join(" ")}
    >
      {type === "legal" ? (
        <Gavel className="h-2 w-2" />
      ) : (
        <FileText className="h-2 w-2" />
      )}
      {type}
    </span>
  );
}

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "flex flex-col justify-between rounded-xl border p-5",
        accent ? "bg-primary/5 border-primary/20" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
          {label}
        </p>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="mt-3">
        <p className="text-3xl font-bold tracking-tight tabular-nums">
          {value}
        </p>
        {sub && <p className="text-muted-foreground mt-1 text-xs">{sub}</p>}
      </div>
    </div>
  );
}

// ─── best stat card ───────────────────────────────────────────────────────────

function BestCard({
  label,
  value,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border px-5 py-4">
      <div>
        <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      </div>
      <Icon className={`h-5 w-5 ${iconColor}`} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CHART — Accuracy + Mistakes area
// ═════════════════════════════════════════════════════════════════════════════

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border-border rounded-lg border px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div
          key={p.dataKey}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-muted-foreground">{p.dataKey}</span>
          </div>
          <span className="font-bold tabular-nums">
            {p.value}
            {p.dataKey === "Accuracy" ? "%" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProgressChart({
  userId,
  includePractice,
}: {
  userId?: string;
  includePractice: boolean;
}) {
  const seriesQuery = userId
    ? trpc.user.getProgressSeriesAdmin
    : trpc.user.getProgressSeries;

  const [series] = userId
    ? (
        trpc.user
          .getProgressSeriesAdmin as typeof trpc.user.getProgressSeriesAdmin
      ).useSuspenseQuery({
        userId,
        limit: 60,
        type: includePractice ? undefined : "assessment",
      })
    : trpc.user.getProgressSeries.useSuspenseQuery({
        limit: 60,
        type: includePractice ? undefined : "assessment",
      });

  const chartData = series.map((r) => ({
    date: format(new Date(r.submittedAt), "d MMM"),
    Accuracy: r.accuracy,
    Mistakes: r.mistakes,
  }));

  if (chartData.length < 2) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground text-sm">Not enough data to plot</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart
        data={chartData}
        margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={ACCURACY_COLOR} stopOpacity={0.15} />
            <stop offset="95%" stopColor={ACCURACY_COLOR} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="mistGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={MISTAKE_COLOR} stopOpacity={0.15} />
            <stop offset="95%" stopColor={MISTAKE_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="hsl(var(--border))"
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="Accuracy"
          stroke={ACCURACY_COLOR}
          strokeWidth={2}
          fill="url(#accGrad)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="Mistakes"
          stroke={MISTAKE_COLOR}
          strokeWidth={2}
          strokeDasharray="4 3"
          fill="url(#mistGrad)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HEATMAP — 90 days, fills card
// ═════════════════════════════════════════════════════════════════════════════
function HeatmapCell({
  count,
  avgScore,
  date,
  isToday,
}: {
  count: number;
  avgScore: number | null;
  date: Date;
  isToday?: boolean;
}) {
  const label = format(date, "EEE, MMM d");

  const intensity =
    count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;

  const colors = [
    "bg-muted/50",
    "bg-emerald-900/60",
    "bg-emerald-700/70",
    "bg-emerald-500/80",
    "bg-emerald-400",
  ];

  return (
    <div
      title={
        count > 0
          ? `${label}: ${count} attempt${count !== 1 ? "s" : ""}${
              avgScore != null ? ` · avg ${Math.round(avgScore)}` : ""
            }`
          : label
      }
      className={`h-4 w-4 rounded-sm transition-all ${colors[intensity]} ${
        isToday
          ? "shadow-[0_0_6px_rgba(250,204,21,0.8)] ring ring-gold-600"
          : ""
      }`}
    />
  );
}

// ─────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────

export function ActivityHeatmap({
  userId,
  includePractice,
}: {
  userId?: string;
  includePractice: boolean;
}) {
  const from = startOfYear(new Date());
  const to = endOfYear(new Date());
  const today = new Date();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const todayRef = useRef<HTMLDivElement | null>(null);

  const [heatmapData] = userId
    ? trpc.user.getHeatmapAdmin.useSuspenseQuery({
        userId,
        from,
        to,
        includePractice,
      })
    : trpc.user.getHeatmap.useSuspenseQuery({
        from,
        to,
        includePractice,
      });

  const dataMap = useMemo(
    () =>
      new Map(
        heatmapData.map((d) => [
          d.date,
          {
            count: Number(d.count),
            avgScore: d.avgScore == null ? null : Number(d.avgScore),
          },
        ]),
      ),
    [heatmapData],
  );

  const allDays = useMemo(
    () => eachDayOfInterval({ start: from, end: to }),
    [from, to],
  );

  const firstDow = getDay(allDays[0]!);

  const weeks = useMemo(() => {
    const result: (Date | null)[][] = [];
    let week: (Date | null)[] = Array(firstDow).fill(null);

    for (const day of allDays) {
      week.push(day);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      result.push(week);
    }

    return result;
  }, [allDays, firstDow]);

  const totalAttempts = heatmapData.reduce((s, d) => s + Number(d.count), 0);
  const activeDays = heatmapData.filter((d) => Number(d.count) > 0).length;

  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIdx: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((w, wi) => {
      const first = w.find((d) => d !== null);
      if (!first) return;

      const month = first.getMonth();
      if (month !== lastMonth) {
        labels.push({ label: format(first, "MMM"), weekIdx: wi });
        lastMonth = month;
      }
    });

    return labels;
  }, [weeks]);

  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, []);

  return (
    <div className="space-y-2 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          <span className="text-foreground font-semibold">{totalAttempts}</span>{" "}
          attempt{totalAttempts !== 1 ? "s" : ""} across{" "}
          <span className="text-foreground font-semibold">{activeDays}</span>{" "}
          day{activeDays !== 1 ? "s" : ""} this year
        </p>
      </div>

      <div className="flex gap-1.5">
        {/* Day labels */}
        <div className="flex shrink-0 flex-col gap-[3px] pt-4">
          {DAY_LABELS.map((d, i) => (
            <span
              key={i}
              className="text-muted-foreground flex h-4 w-3 items-center justify-center text-[8px]"
            >
              {i % 2 === 1 ? d : ""}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="min-w-0">
          {/* Month labels */}
          <div className="mb-1 flex gap-[3px]">
            {weeks.map((_, wi) => {
              const ml = monthLabels.find((m) => m.weekIdx === wi);
              return (
                <div key={wi} className="w-4 shrink-0">
                  {ml && (
                    <span className="text-muted-foreground text-[8px] whitespace-nowrap">
                      {ml.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cells */}
          <div className="flex gap-[3px]" ref={containerRef}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => {
                  if (!day) {
                    return <div key={di} className="h-4 w-4" />;
                  }

                  const key = format(day, "yyyy-MM-dd");
                  const entry = dataMap.get(key);

                  const isToday =
                    format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

                  const isFuture = day > today;

                  return (
                    <div
                      key={di}
                      ref={isToday ? todayRef : null}
                      className={isFuture ? "opacity-40" : ""}
                    >
                      <HeatmapCell
                        date={day}
                        count={entry?.count ?? 0}
                        avgScore={entry?.avgScore ?? null}
                        isToday={isToday}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-[9px]">Less</span>
        {[
          "bg-muted/50",
          "bg-emerald-900/60",
          "bg-emerald-700/70",
          "bg-emerald-500/80",
          "bg-emerald-400",
        ].map((c, i) => (
          <div key={i} className={`h-2.5 w-2.5 rounded-sm ${c}`} />
        ))}
        <span className="text-muted-foreground text-[9px]">More</span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PER-TEST BREAKDOWN TABLE
// ═════════════════════════════════════════════════════════════════════════════

function TestBreakdown({
  userId,
  includePractice,
}: {
  userId?: string;
  includePractice: boolean;
}) {
  const [rows] = userId
    ? trpc.user.getTestWisePerformanceAdmin.useSuspenseQuery({
        userId,
        limit: 20,
        type: includePractice ? undefined : "assessment",
      })
    : trpc.user.getTestWisePerformance.useSuspenseQuery({
        limit: 20,
        type: includePractice ? undefined : "assessment",
      });

  if (!rows?.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            <TableHead>Test</TableHead>
            <TableHead className="w-12 text-right">#</TableHead>
            <TableHead className="w-24 text-right text-amber-400">
              B.Score
            </TableHead>
            <TableHead className="w-20 text-right">Avg</TableHead>
            <TableHead className="w-24 text-right text-blue-400">
              B.WPM
            </TableHead>
            <TableHead className="w-20 text-right">WPM</TableHead>
            <TableHead className="w-24 text-right text-emerald-400">
              B.Acc
            </TableHead>
            <TableHead className="w-20 text-right">Acc</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.testId} className="hover:bg-muted/30">
              <TableCell className="py-3.5">
                <p className="max-w-[280px] truncate text-sm font-medium">
                  {r.testId}
                </p>
              </TableCell>
              <TableCell className="text-muted-foreground py-3.5 text-right text-xs tabular-nums">
                {r.attempts}
              </TableCell>
              <TableCell className="py-3.5 text-right font-bold text-amber-400 tabular-nums">
                {r.bestScore}
              </TableCell>
              <TableCell className="text-muted-foreground py-3.5 text-right text-xs tabular-nums">
                {Number(r.avgScore).toFixed(1)}
              </TableCell>
              <TableCell className="py-3.5 text-right font-bold text-blue-400 tabular-nums">
                {r.bestWpm}
              </TableCell>
              <TableCell className="text-muted-foreground py-3.5 text-right text-xs tabular-nums">
                {Number(r.avgWpm).toFixed(1)}
              </TableCell>
              <TableCell
                className={`py-3.5 text-right font-bold tabular-nums ${accColor(r.bestAccuracy)}`}
              >
                {r.bestAccuracy}%
              </TableCell>
              <TableCell
                className={`py-3.5 text-right text-xs tabular-nums ${accColor(Math.round(Number(r.avgAccuracy)))}`}
              >
                {Number(r.avgAccuracy).toFixed(0)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ATTEMPTS TABLE
// ═════════════════════════════════════════════════════════════════════════════

function AttemptsTable({
  userId,
  includePractice,
  isAdmin,
}: {
  userId?: string;
  includePractice: boolean;
  isAdmin?: boolean;
}) {
  const [page, setPage] = useState(0);

  const [{ data, meta }] = userId
    ? trpc.user.getAttemptsPaginatedAdmin.useSuspenseQuery({
        userId,
        page,
        limit: 10,
        type: includePractice ? undefined : "assessment",
      })
    : trpc.user.getAttemptsPaginated.useSuspenseQuery({
        page,
        limit: 10,
        type: includePractice ? undefined : "assessment",
      });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Activity className="text-muted-foreground h-3.5 w-3.5" />
          <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
            Attempts
          </p>
        </div>
        <p className="text-muted-foreground text-xs tabular-nums">
          {meta.total} total
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead>Test</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead className="w-20 text-right">Score</TableHead>
              <TableHead className="w-20 text-right">WPM</TableHead>
              <TableHead className="w-24 text-right">Acc</TableHead>
              <TableHead className="w-20 text-right">Err</TableHead>
              <TableHead className="w-32 text-right">When</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.attemptId}
                className="group hover:bg-muted/30 cursor-pointer"
              >
                <TableCell className="py-3.5">
                  <p className="text-sm leading-none font-medium">
                    {row.test?.title ?? "—"}
                  </p>
                  {row.test && (
                    <div className="mt-1.5">
                      <TypeBadge type={row.test.type} />
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-3.5">
                  <Badge
                    variant={
                      row.type === "assessment" ? "default" : "secondary"
                    }
                    className="text-[10px] capitalize"
                  >
                    {row.type}
                  </Badge>
                </TableCell>
                <TableCell className="py-3.5 text-right font-bold tabular-nums">
                  {row.result.score}
                </TableCell>
                <TableCell className="text-muted-foreground py-3.5 text-right text-xs tabular-nums">
                  {row.result.wpm}
                </TableCell>
                <TableCell
                  className={`py-3.5 text-right text-sm font-semibold tabular-nums ${accColor(row.result.accuracy)}`}
                >
                  {row.result.accuracy}%
                </TableCell>
                <TableCell className="text-muted-foreground py-3.5 text-right text-xs tabular-nums">
                  {row.result.mistakes}
                </TableCell>
                <TableCell className="text-muted-foreground py-3.5 text-right text-xs tabular-nums">
                  {formatDistanceToNow(new Date(row.result.submittedAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="py-3.5 text-right">
                  <Link
                    href={
                      isAdmin
                        ? `/admin/attempt/${row.attemptId}`
                        : `/user/attempt/${row.attemptId}`
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs tabular-nums">
            Page {page + 1} of {meta.totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page + 1 >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// INNER — all suspense queries
// ═════════════════════════════════════════════════════════════════════════════

function ReportCardInner({
  userId,
  isAdmin,
}: {
  userId?: string;
  isAdmin?: boolean;
}) {
  const [includePractice, setIncludePractice] = useState(true);

  // Fetch report (summary stats)
  const [report] = userId
    ? trpc.user.getReportAdmin.useSuspenseQuery({
        userId,
        type: includePractice ? undefined : "assessment",
      })
    : trpc.user.getReport.useSuspenseQuery({
        type: includePractice ? undefined : "assessment",
      });

  // Fetch personal bests
  const [bests] = userId
    ? trpc.user.getPersonalBestsAdmin.useSuspenseQuery({
        userId,
        type: includePractice ? undefined : "assessment",
      })
    : trpc.user.getPersonalBests.useSuspenseQuery({
        type: includePractice ? undefined : "assessment",
      });

  const attempts = Number(report?.totalAttempts ?? 0);
  const avgAcc = Math.round(Number(report?.avgAccuracy ?? 0));
  const avgWpm = Math.round(Number(report?.avgWpm ?? 0));
  const avgScore = Number(report?.avgScore ?? 0).toFixed(1);
  const totalErrors = Number(report?.totalMistakes ?? 0);
  const errPerAttempt =
    attempts > 0 ? (totalErrors / attempts).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex items-center justify-end gap-2.5">
        <Label
          htmlFor="incl-practice"
          className="text-muted-foreground cursor-pointer text-sm"
        >
          Include practice
        </Label>
        <Switch
          id="incl-practice"
          checked={includePractice}
          onCheckedChange={setIncludePractice}
        />
      </div>

      {/* Stats row 1 — 5 cols */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Attempts"
          value={attempts}
          sub="all time"
          icon={Activity}
          iconColor="text-violet-400"
        />
        <StatCard
          label="Avg Acc"
          value={`${avgAcc}%`}
          sub={accLabel(avgAcc)}
          icon={Target}
          iconColor="text-amber-400"
        />
        <StatCard
          label="Avg WPM"
          value={avgWpm}
          sub="words/min"
          icon={Zap}
          iconColor="text-blue-400"
        />
        <StatCard
          label="Avg Score"
          value={avgScore}
          sub="out of 100"
          icon={TrendingUp}
          iconColor="text-emerald-400"
          accent
        />
        <StatCard
          label="Total Errors"
          value={totalErrors}
          sub={`~${errPerAttempt}/attempt`}
          icon={AlertCircle}
          iconColor="text-rose-400"
        />
      </div>

      {/* Best stats row — 3 cols */}
      <div className="grid grid-cols-3 gap-4">
        <BestCard
          label="Best Score"
          value={bests?.bestScore ?? "—"}
          icon={Trophy}
          iconColor="text-amber-400"
        />
        <BestCard
          label="Best WPM"
          value={bests?.bestWpm ?? "—"}
          icon={Zap}
          iconColor="text-blue-400"
        />
        <BestCard
          label="Best Acc"
          value={bests?.bestAccuracy != null ? `${bests.bestAccuracy}%` : "—"}
          icon={Target}
          iconColor="text-emerald-400"
        />
      </div>

      {/* Chart + Heatmap — side by side */}
      <div className="grid grid-cols-5 gap-4">
        {/* Chart — 3/5 */}
        <Card className="col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="text-muted-foreground h-3.5 w-3.5" />
                <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                  Progress Over Time
                </p>
              </div>
              <div className="text-muted-foreground flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-4 rounded-full bg-emerald-500" />
                  Accuracy
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-4 rounded-full bg-amber-500" />
                  Mistakes
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-5">
            <Suspense
              fallback={<Skeleton className="h-[160px] w-full rounded-lg" />}
            >
              <ProgressChart
                userId={userId}
                includePractice={includePractice}
              />
            </Suspense>
          </CardContent>
        </Card>

        {/* Heatmap — 2/5 */}
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1.5">
              <BarChart2 className="text-muted-foreground h-3.5 w-3.5" />
              <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                Activity This Year
              </p>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-0 pb-5">
            <Suspense
              fallback={<Skeleton className="h-[120px] w-full rounded-lg" />}
            >
              <ActivityHeatmap
                userId={userId}
                includePractice={includePractice}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Per-test breakdown */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <BarChart2 className="text-muted-foreground h-3.5 w-3.5" />
          <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
            Per-Test Breakdown
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-xl" />}>
          <TestBreakdown userId={userId} includePractice={includePractice} />
        </Suspense>
      </div>

      {/* Attempts */}
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <AttemptsTable
          userId={userId}
          includePractice={includePractice}
          isAdmin={isAdmin}
        />
      </Suspense>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SKELETON
// ═════════════════════════════════════════════════════════════════════════════

function ReportCardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Skeleton className="h-6 w-36" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border p-5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border px-5 py-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-7 w-14" />
            </div>
            <Skeleton className="h-5 w-5 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 rounded-xl border p-5">
          <Skeleton className="h-[160px] w-full rounded-lg" />
        </div>
        <div className="col-span-2 rounded-xl border p-5">
          <Skeleton className="h-[120px] w-full rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═════════════════════════════════════════════════════════════════════════════

export type ReportCardClientProps = {
  /** When provided, shows data for this user (admin mode) */
  userId?: string;
  /** Shows admin-specific UI tweaks (attempt links go to /admin/attempt/...) */
  isAdmin?: boolean;
  /** Display name override — shown in the page header */
  userName?: string;
};

export default function ReportCardClient({
  userId,
  isAdmin,
  userName,
}: ReportCardClientProps) {
  const title = isAdmin
    ? `${userName ? `${userName}'s` : "User"} Report Card`
    : "My Report Card";

  return (
    <div className="w-full px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {isAdmin
              ? "Full performance breakdown"
              : "Your full performance breakdown"}
          </p>
        </div>
      </div>

      <Suspense fallback={<ReportCardSkeleton />}>
        <ReportCardInner userId={userId} isAdmin={isAdmin} />
      </Suspense>
    </div>
  );
}
