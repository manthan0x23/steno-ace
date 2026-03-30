"use client";

import { Suspense, useState } from "react";
import { trpc } from "~/trpc/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { Activity, Zap, AlertCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div
      className="relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border px-6 py-5"
      style={{
        background: `radial-gradient(ellipse at top right, color-mix(in oklch, var(--chart-1) 8%, var(--card)), var(--card))`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-xs leading-none font-medium">
          {label}
        </p>
        <Icon className="text-muted-foreground h-4 w-4" />
      </div>
      <p className="text-4xl leading-none font-bold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}

// ─── chart tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover rounded-lg border px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
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
          <span className="font-bold tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function SpeedMistakesChart({
  userId,
  includePractice,
}: {
  userId?: string;
  includePractice: boolean;
}) {
  const [series] = userId
    ? trpc.user.getProgressSeriesAdmin.useSuspenseQuery({
        userId,
        limit: 200,
        type: includePractice ? undefined : "assessment",
      })
    : trpc.user.getProgressSeries.useSuspenseQuery({
        limit: 200,
        type: includePractice ? undefined : "assessment",
      });

  const grouped = series.reduce<Record<number, number[]>>((acc, r) => {
    const spd = r.testSpeedWpm;
    if (!acc[spd]) acc[spd] = [];
    acc[spd]!.push(Number(r.mistakes ?? 0));
    return acc;
  }, {});

  const chartData = Object.entries(grouped)
    .map(([spd, mistakes]) => ({
      speedVal: Number(spd),
      Speed: Number(spd),
      "Avg mistakes":
        Math.round(
          (mistakes.reduce((a, b) => a + b, 0) / mistakes.length) * 10,
        ) / 10,
    }))
    .sort((a, b) => a.speedVal - b.speedVal);

  if (chartData.length < 2) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground text-sm">Not enough data yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(220, chartData.length * 56 + 40)}
    >
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        barCategoryGap="28%"
        barGap={4}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--border)"
        />

        {/* X = category now */}
        <XAxis
          dataKey="speedVal"
          tickFormatter={(v) => `${v} wpm`}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />

        {/* Y = numeric */}
        <YAxis
          type="number"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-popover rounded-lg border px-3 py-2 text-xs shadow-lg">
                <p className="text-muted-foreground mb-2 font-medium">
                  {label} wpm
                </p>
                {payload.map((p: any) => (
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
                    <span className="font-bold tabular-nums">{p.value}</span>
                  </div>
                ))}
              </div>
            );
          }}
          cursor={{ fill: "var(--muted)", opacity: 0.15 }}
        />

        <Bar dataKey="Speed" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
        <Bar
          dataKey="Avg mistakes"
          fill="var(--chart-2)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MistakesChart({
  userId,
  includePractice,
}: {
  userId?: string;
  includePractice: boolean;
}) {
  const [series] = userId
    ? trpc.user.getProgressSeriesAdmin.useSuspenseQuery({
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
    Mistakes: r.mistakes,
  }));

  if (chartData.length < 2) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground text-sm">Not enough data yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={chartData}
        margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="mistGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--border)"
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="Mistakes"
          stroke="var(--chart-2)"
          strokeWidth={2}
          fill="url(#mistGrad)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ReportCardInner({
  userId,
  isAdmin,
}: {
  userId?: string;
  isAdmin?: boolean;
}) {
  const [includePractice, setIncludePractice] = useState(true);

  const [report] = userId
    ? trpc.user.getReportAdmin.useSuspenseQuery({
        userId,
        type: includePractice ? undefined : "assessment",
      })
    : trpc.user.getReport.useSuspenseQuery({
        type: includePractice ? undefined : "assessment",
      });

  const attempts = Number(report?.totalAttempts ?? 0);
  const avgWpm = Math.round(Number(report?.avgWpm ?? 0));
  const totalErrors = Number(report?.totalMistakes ?? 0);
  const avgMistakes = attempts > 0 ? (totalErrors / attempts).toFixed(1) : "0";

  return (
    <div className="space-y-8">
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

      {/* 3 KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total attempts" value={attempts} icon={Activity} />
        <StatCard
          label="Avg transcription speed"
          value={`${avgWpm} wpm`}
          icon={Zap}
        />
        <StatCard label="Avg mistakes" value={avgMistakes} icon={AlertCircle} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Zap className="text-muted-foreground h-4 w-4" />
            Speed vs mistakes
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            Average mistakes at each test speed
          </p>

          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--chart-1)" }}
              />
              Speed (wpm)
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--chart-2)" }}
              />
              Avg mistakes
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-56 w-full rounded-lg" />}>
            <SpeedMistakesChart
              userId={userId}
              includePractice={includePractice}
            />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="text-muted-foreground h-4 w-4" />
              Mistakes over time
            </CardTitle>
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <span
                className="inline-block h-0.5 w-4"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    to right,
                    var(--chart-2),
                    var(--chart-2) 4px,
                    transparent 3px,
                    transparent 8px
                  )`,
                }}
              />
              Mistakes
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-52 w-full rounded-lg" />}>
            <MistakesChart userId={userId} includePractice={includePractice} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportCardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Skeleton className="h-6 w-36" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border p-5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-60 w-full rounded-xl" />
      <Skeleton className="h-52 w-full rounded-xl" />
    </div>
  );
}

export type ReportCardClientProps = {
  userId?: string;
  isAdmin?: boolean;
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {isAdmin
            ? "Full performance breakdown"
            : "Your full performance breakdown"}
        </p>
      </div>
      <Suspense fallback={<ReportCardSkeleton />}>
        <ReportCardInner userId={userId} isAdmin={isAdmin} />
      </Suspense>
    </div>
  );
}
