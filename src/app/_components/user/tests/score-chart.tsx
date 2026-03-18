"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { TrendingUp } from "lucide-react";

const dummyData = [
  { date: "Mar 1", score: 62 },
  { date: "Mar 4", score: 58 },
  { date: "Mar 7", score: 71 },
  { date: "Mar 10", score: 75 },
  { date: "Mar 13", score: 69 },
  { date: "Mar 16", score: 83 },
  { date: "Mar 19", score: 78 },
  { date: "Mar 22", score: 88 },
  { date: "Mar 25", score: 84 },
  { date: "Mar 28", score: 91 },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
        <p className="text-foreground text-sm font-semibold">
          {payload[0]?.value}
          <span className="text-muted-foreground font-normal"> / 100</span>
        </p>
      </div>
    );
  }
  return null;
};

export function ScoreChart() {
  const latest = dummyData[dummyData.length - 1]?.score ?? 0;
  const prev = dummyData[dummyData.length - 2]?.score ?? 0;
  const delta = latest - prev;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-medium mb-1">
              Score Progress
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">
                {latest}
              </span>
              <span className="text-muted-foreground text-sm">/ 100</span>
              <span
                className={`flex items-center gap-0.5 text-xs font-medium ${delta >= 0 ? "text-emerald-500" : "text-red-400"}`}
              >
                <TrendingUp className="h-3 w-3" />
                {delta >= 0 ? "+" : ""}
                {delta} pts
              </span>
            </div>
          </div>
          <span className="text-muted-foreground text-xs bg-muted px-2 py-1 rounded-md">
            Last 30 days
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-2 pb-4">
        <ResponsiveContainer width="100%" height="100%" minHeight={180}>
          <AreaChart
            data={dummyData}
            margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
          >
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[40, 100]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#scoreGrad)"
              dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}