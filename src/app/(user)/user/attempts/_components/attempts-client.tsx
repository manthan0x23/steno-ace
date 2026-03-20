"use client";

// ─── app/user/attempts/page.tsx ───────────────────────────────────────────────

import { useState, useMemo, Suspense } from "react";
import { trpc } from "~/trpc/react";
import {
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
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Separator } from "~/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevRight,
  ExternalLink,
  TrendingUp,
  Gavel,
  FileText,
  LayoutList,
  Layers,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";

// ─── colors ───────────────────────────────────────────────────────────────────

const SCORE_COLOR = "#3b82f6";
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

type AttemptRow = {
  attemptId: string;
  type: "assessment" | "practice";
  test: { id: string; title: string; type: "legal" | "general" } | null;
  result: {
    score: number;
    wpm: number;
    accuracy: number;
    mistakes: number;
    submittedAt: Date;
  };
};

// ═════════════════════════════════════════════════════════════════════════════
// CHART
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

function ProgressChart() {
  const [filter, setFilter] = useState<"all" | "assessment" | "practice">(
    "all",
  );
  const [metric, setMetric] = useState<
    "all" | "score" | "accuracy" | "mistakes"
  >("all");

  const [series] = trpc.user.getProgressSeries.useSuspenseQuery({
    limit: 60,
    type: filter === "all" ? undefined : filter,
  });

  const chartData = series.map((r) => ({
    date: format(new Date(r.submittedAt), "d MMM"),
    Score: r.score,
    Accuracy: r.accuracy,
    Mistakes: r.mistakes,
  }));

  const allLines = [
    { key: "Score", color: SCORE_COLOR, dash: undefined },
    { key: "Accuracy", color: ACCURACY_COLOR, dash: "5 3" },
    { key: "Mistakes", color: MISTAKE_COLOR, dash: "3 2" },
  ];
  const visibleLines =
    metric === "all"
      ? allLines
      : allLines.filter((l) => l.key.toLowerCase() === metric);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
              Performance Over Time
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {series.length} attempt{series.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric pills */}
            <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
              {(["all", "score", "accuracy", "mistakes"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={[
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    metric === m
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {m === "score" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  )}
                  {m === "accuracy" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                  {m === "mistakes" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  )}
                  {m}
                </button>
              ))}
            </div>

            {/* Type pills */}
            <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
              {(["all", "assessment", "practice"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={[
                    "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    filter === t
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-5">
        {chartData.length < 2 ? (
          <div className="flex h-36 items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground text-sm">
              Complete more tests to see trends
            </p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
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
                {visibleLines.map((l) => (
                  <Line
                    key={l.key}
                    type="monotone"
                    dataKey={l.key}
                    stroke={l.color}
                    strokeWidth={2}
                    strokeDasharray={l.dash}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: l.color }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-3 flex items-center gap-5">
              {allLines
                .filter(
                  (l) => metric === "all" || l.key.toLowerCase() === metric,
                )
                .map(({ key, color, dash }) => (
                  <span
                    key={key}
                    className="text-muted-foreground flex items-center gap-1.5 text-xs"
                  >
                    <span
                      className="inline-block h-0.5 w-5 rounded-full"
                      style={{ background: color }}
                    />
                    {key}
                  </span>
                ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SHARED TABLE COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

function SortHead({
  label,
  field,
  sortField,
  sortOrder,
  onSort,
  className,
}: {
  label: string;
  field: string;
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (f: string) => void;
  className?: string;
}) {
  const active = sortField === field;
  return (
    <TableHead className={className}>
      <button
        onClick={() => onSort(field)}
        className={[
          "flex items-center gap-1 text-[10px] font-semibold tracking-widest uppercase transition-colors",
          active
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
          className?.includes("text-right") ? "ml-auto" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {label}
        <span className="text-[9px] opacity-60">
          {active ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </TableHead>
  );
}

function SharedHeader({
  sortField,
  sortOrder,
  onSort,
  showTest = true,
}: {
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (f: string) => void;
  showTest?: boolean;
}) {
  return (
    <TableHeader>
      <TableRow className="bg-muted/20 hover:bg-muted/20">
        {showTest && <TableHead>Test</TableHead>}
        <TableHead className="w-28">Type</TableHead>
        <SortHead
          label="Score"
          field="score"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
          className="w-20 text-right"
        />
        <SortHead
          label="WPM"
          field="wpm"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
          className="w-20 text-right"
        />
        <SortHead
          label="Accuracy"
          field="accuracy"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
          className="w-24 text-right"
        />
        <SortHead
          label="Mistakes"
          field="mistakes"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
          className="w-20 text-right"
        />
        <SortHead
          label="Date"
          field="time"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
          className="w-36 text-right"
        />
        <TableHead className="w-10" />
      </TableRow>
    </TableHeader>
  );
}

function SharedRow({
  row,
  showTest = true,
}: {
  row: AttemptRow;
  showTest?: boolean;
}) {
  return (
    <TableRow className="group cursor-pointer">
      {showTest && (
        <TableCell className="py-4">
          <p className="text-sm leading-none font-semibold">
            {row.test?.title ?? "—"}
          </p>
          {row.test && (
            <div className="mt-1.5">
              <TypeBadge type={row.test.type} />
            </div>
          )}
        </TableCell>
      )}
      <TableCell className="py-4">
        <Badge
          variant={row.type === "assessment" ? "default" : "secondary"}
          className="text-[10px] capitalize"
        >
          {row.type}
        </Badge>
      </TableCell>
      <TableCell className="py-4 text-right font-bold tabular-nums">
        {row.result.score}
      </TableCell>
      <TableCell className="text-muted-foreground py-4 text-right text-xs tabular-nums">
        {row.result.wpm}
      </TableCell>
      <TableCell
        className={`py-4 text-right text-sm font-semibold tabular-nums ${accColor(row.result.accuracy)}`}
      >
        {row.result.accuracy}%
      </TableCell>
      <TableCell className="text-muted-foreground py-4 text-right text-xs tabular-nums">
        {row.result.mistakes}
      </TableCell>
      <TableCell className="text-muted-foreground py-4 text-right text-xs tabular-nums">
        {formatDistanceToNow(new Date(row.result.submittedAt), {
          addSuffix: true,
        })}
      </TableCell>
      <TableCell className="py-4 text-right">
        <Link
          href={`/user/attempt/${row.attemptId}`}
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
  );
}

function sortRows(rows: AttemptRow[], field: string, order: "asc" | "desc") {
  return [...rows].sort((a, b) => {
    const get = (r: AttemptRow) => {
      if (field === "score") return r.result.score;
      if (field === "wpm") return r.result.wpm;
      if (field === "accuracy") return r.result.accuracy;
      if (field === "mistakes") return r.result.mistakes;
      return new Date(r.result.submittedAt).getTime();
    };
    return order === "asc" ? get(a) - get(b) : get(b) - get(a);
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// RAW — paginated, sortable
// ═════════════════════════════════════════════════════════════════════════════

function RawAttempts({
  typeFilter,
  sortField,
  sortOrder,
  onSort,
}: {
  typeFilter: "all" | "assessment" | "practice";
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (f: string) => void;
}) {
  const [page, setPage] = useState(0);

  const [{ data, meta }] = trpc.user.getAttemptsPaginated.useSuspenseQuery({
    page,
    limit: 15,
    type: typeFilter === "all" ? undefined : typeFilter,
  });

  const sorted = useMemo(
    () => sortRows(data as AttemptRow[], sortField, sortOrder),
    [data, sortField, sortOrder],
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <TrendingUp className="text-muted-foreground/40 mb-3 h-8 w-8" />
        <p className="text-muted-foreground text-sm">No attempts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <SharedHeader
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={onSort}
          />
          <TableBody>
            {sorted.map((row) => (
              <SharedRow key={row.attemptId} row={row} />
            ))}
          </TableBody>
        </Table>
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs tabular-nums">
            Page {page + 1} of {meta.totalPages} · {meta.total} attempts
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
// GROUPED — collapsible accordion, NOT paginated (full picture per test)
// ═════════════════════════════════════════════════════════════════════════════

function GroupedAttempts({
  typeFilter,
  sortField,
  sortOrder,
  onSort,
}: {
  typeFilter: "all" | "assessment" | "practice";
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (f: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [{ data }] = trpc.user.getAttemptsPaginated.useSuspenseQuery({
    page: 0,
    limit: 100,
    type: typeFilter === "all" ? undefined : typeFilter,
  });

  const groups = useMemo(() => {
    const map = new Map<
      string,
      { test: AttemptRow["test"]; rows: AttemptRow[] }
    >();
    for (const row of data as AttemptRow[]) {
      const key = row.test?.id ?? "unknown";
      if (!map.has(key)) map.set(key, { test: row.test, rows: [] });
      map.get(key)!.rows.push(row);
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.rows[0]!.result.submittedAt).getTime() -
        new Date(a.rows[0]!.result.submittedAt).getTime(),
    );
  }, [data]);

  const toggle = (id: string) =>
    setExpanded((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <TrendingUp className="text-muted-foreground/40 mb-3 h-8 w-8" />
        <p className="text-muted-foreground text-sm">No attempts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map((g) => {
        const id = g.test?.id ?? "unknown";
        const isOpen = expanded.has(id);
        const best = Math.max(...g.rows.map((r) => r.result.score));
        const avgAcc = Math.round(
          g.rows.reduce((s, r) => s + r.result.accuracy, 0) / g.rows.length,
        );
        const avgWpm = Math.round(
          g.rows.reduce((s, r) => s + r.result.wpm, 0) / g.rows.length,
        );
        const sorted = sortRows(g.rows, sortField, sortOrder);

        return (
          <div key={id} className="overflow-hidden rounded-xl border">
            {/* Accordion header */}
            <button
              onClick={() => toggle(id)}
              className="hover:bg-muted/30 flex w-full items-center gap-4 px-5 py-4 text-left transition-colors"
            >
              {/* Chevron + title */}
              <span className="text-muted-foreground shrink-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevRight className="h-4 w-4" />
                )}
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <p className="truncate text-sm font-semibold">
                  {g.test?.title ?? "Unknown"}
                </p>
                {g.test && <TypeBadge type={g.test.type} />}
              </div>

              {/* Stats */}
              <div className="flex shrink-0 items-center gap-6">
                {[
                  { label: "Attempts", val: String(g.rows.length), cls: "" },
                  {
                    label: "Best",
                    val: String(best),
                    cls: "text-foreground font-bold",
                  },
                  {
                    label: "Avg Acc",
                    val: `${avgAcc}%`,
                    cls: accColor(avgAcc) + " font-bold",
                  },
                  {
                    label: "Avg WPM",
                    val: String(avgWpm),
                    cls: "text-muted-foreground",
                  },
                ].map(({ label, val, cls }) => (
                  <div key={label} className="flex flex-col items-end gap-0.5">
                    <span className="text-muted-foreground text-[9px] font-semibold tracking-widest uppercase">
                      {label}
                    </span>
                    <span className={`text-sm tabular-nums ${cls}`}>{val}</span>
                  </div>
                ))}
              </div>
            </button>

            {/* Expanded table — no Test column since it's in the header */}
            {isOpen && (
              <div className="border-t">
                <Table>
                  <SharedHeader
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={onSort}
                    showTest={false}
                  />
                  <TableBody>
                    {sorted.map((row) => (
                      <SharedRow
                        key={row.attemptId}
                        row={row}
                        showTest={false}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SKELETONS
// ═════════════════════════════════════════════════════════════════════════════

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-7 w-40 rounded-lg" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[160px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            {Array.from({ length: 8 }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-2.5 w-12" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="space-y-1.5 py-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-14" />
              </TableCell>
              <TableCell className="py-4">
                <Skeleton className="h-5 w-20 rounded-full" />
              </TableCell>
              {[0, 1, 2, 3, 4].map((j) => (
                <TableCell key={j} className="py-4 text-right">
                  <Skeleton className="ml-auto h-3 w-10" />
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function AttemptsPage() {
  const [mode, setMode] = useState<"raw" | "grouped">("raw");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "assessment" | "practice"
  >("all");
  const [sortField, setSortField] = useState("time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  trpc.user.getProgressSeries.useQuery({ limit: 60 }, { staleTime: 60_000 });
  trpc.user.getAttemptsPaginated.useQuery(
    { page: 0, limit: 15 },
    { staleTime: 30_000 },
  );

  const handleSort = (field: string) => {
    if (sortField === field)
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="w-full px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Attempts</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Your full attempt history and performance trends
        </p>
      </div>

      {/* Chart */}
      <Suspense fallback={<ChartSkeleton />}>
        <ProgressChart />
      </Suspense>

      <Separator className="my-6" />

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Mode */}
          <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
            <button
              onClick={() => setMode("raw")}
              className={[
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "raw"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <LayoutList className="h-3.5 w-3.5" />
              All attempts
            </button>
            <button
              onClick={() => setMode("grouped")}
              className={[
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "grouped"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <Layers className="h-3.5 w-3.5" />
              By test
            </button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Type filter */}
          <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
            {(["all", "assessment", "practice"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={[
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  typeFilter === t
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
        >
          {sortOrder === "desc" ? "↓ Newest first" : "↑ Oldest first"}
        </Button>
      </div>

      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        {mode === "raw" ? (
          <RawAttempts
            typeFilter={typeFilter}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ) : (
          <GroupedAttempts
            typeFilter={typeFilter}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        )}
      </Suspense>
    </div>
  );
}
