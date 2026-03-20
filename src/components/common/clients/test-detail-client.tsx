"use client";

// ─── components/test/test-detail-client.tsx ───────────────────────────────────
//
// Generic test detail page. Used by:
//
//   Admin:  app/admin/test/[testId]/page.tsx
//     <TestDetailClient testId={id} isAdmin />
//
//   User:   app/user/tests/[testId]/page.tsx
//     <TestDetailClient testId={id} />
//
// Admin gets: edit/delete/launch, matter tab, outline tab, full attempts table
//             (with link to /admin/user-attempt/[id])
// User gets:  KPI cards, audio player, their own attempts, Practice/Assess CTA

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Pencil,
  Trash2,
  Rocket,
  ArrowLeft,
  Mic,
  Pause,
  Clock,
  Users,
  Play,
  Gavel,
  FileText,
  ListChecks,
  Target,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  BarChart3,
  Zap,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { TestStartDialog } from "~/components/common/user/test-start-dialog";
import { cn } from "~/lib/utils";

// ─── types ────────────────────────────────────────────────────────────────────

type Props = {
  testId: string;
  isAdmin?: boolean;
};

type SortBy = "score" | "mistakes" | "time";
type SortOrder = "asc" | "desc";
type AttemptFilter = "all" | "assessment" | "practice";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function accColor(a: number) {
  return a >= 90
    ? "text-emerald-500"
    : a >= 70
      ? "text-amber-500"
      : "text-destructive";
}

// ─── audio player ─────────────────────────────────────────────────────────────

const SPEEDS = [1, 1.5, 2] as const;
type Speed = (typeof SPEEDS)[number];

function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  useEffect(() => {
    const bars = 120;
    setWaveformData(
      Array.from({ length: bars }, (_, i) =>
        Math.min(
          1,
          Math.sin((i / bars) * Math.PI) * 0.6 + 0.1 + Math.random() * 0.4,
        ),
      ),
    );
  }, [audioUrl]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || waveformData.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth,
      H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    const barW = W / waveformData.length;
    const gap = barW * 0.25;
    const prog = audio ? audio.currentTime / (audio.duration || 1) : 0;
    const probe = document.createElement("span");
    probe.className = "text-primary";
    probe.style.cssText =
      "position:absolute;visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
    const playedColor = getComputedStyle(probe).color || "#3b82f6";
    document.body.removeChild(probe);
    waveformData.forEach((amp, i) => {
      const x = i * barW + gap / 2;
      const w = Math.max(1.5, barW - gap);
      const barH = Math.max(3, amp * H * 0.9);
      const y = (H - barH) / 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, barH, 1.5);
      ctx.fillStyle = playedColor;
      ctx.globalAlpha = i / waveformData.length < prog ? 0.85 : 0.18;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }, [waveformData]);

  useEffect(() => {
    const loop = () => {
      if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
      drawWaveform();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawWaveform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => drawWaveform());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [drawWaveform]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    isPlaying ? a.pause() : void a.play();
    setIsPlaying(!isPlaying);
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60)
      .toString()
      .padStart(2, "0")}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase">
          <Mic className="h-3.5 w-3.5" />
          Dictation Audio
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
          onEnded={() => setIsPlaying(false)}
        />
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 translate-x-px" />
            )}
          </Button>
          <div className="flex flex-1 flex-col gap-1.5">
            <canvas
              ref={canvasRef}
              className="w-full cursor-pointer"
              style={{ height: "40px", display: "block" }}
              onClick={(e) => {
                const a = audioRef.current,
                  c = canvasRef.current;
                if (!a || !c) return;
                const r = c.getBoundingClientRect();
                a.currentTime = ((e.clientX - r.left) / r.width) * a.duration;
              }}
            />
            <div className="text-muted-foreground flex justify-between text-[11px] tabular-nums">
              <span>{fmt(currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSpeed(s);
                  if (audioRef.current) audioRef.current.playbackRate = s;
                }}
                className={`h-7 w-10 rounded-md text-xs font-medium transition-colors ${
                  speed === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── timing strip stat ────────────────────────────────────────────────────────

function TimingStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground flex items-center gap-1 text-[9px] font-semibold tracking-widest uppercase">
        <Icon className="h-2.5 w-2.5" />
        {label}
      </span>
      <span className="text-[15px] font-bold tabular-nums">{value}</span>
    </div>
  );
}

// ─── KPI cards ────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-transparent px-4 py-3",
        label === "Attempts" && "bg-card",
      )}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color ?? "bg-muted"}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
          {label}
        </p>
        <p className="text-lg leading-tight font-bold tabular-nums">{value}</p>
        {sub && (
          <p className="text-muted-foreground text-[10px] tabular-nums">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function KpiStrip({ testId }: { testId: string }) {
  const { data } = trpc.analytics.getTestStats.useQuery(
    { testId },
    { staleTime: 60_000 },
  );

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border px-4 py-3">
            <Skeleton className="mb-1.5 h-2.5 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (data.totalAttempts === 0) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm">
        <AlertCircle className="h-4 w-4 shrink-0" />
        No attempts yet — stats will appear once users submit this test.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard
        icon={BarChart3}
        label="Avg Score"
        value={Math.round(data.avgScore)}
        sub={`Best: ${data.bestScore}`}
        color="bg-blue-500/10 text-blue-400"
      />
      <KpiCard
        icon={Target}
        label="Avg Accuracy"
        value={`${Math.round(data.avgAccuracy)}%`}
        sub={`Best: ${data.bestAccuracy}%`}
        color="bg-emerald-500/10 text-emerald-400"
      />
      <KpiCard
        icon={Zap}
        label="Avg Mistakes"
        value={Math.round(data.avgMistakes)}
        sub={`Fewest: ${data.fewestMistakes}`}
        color="bg-amber-500/10 text-amber-400"
      />
      <KpiCard
        icon={Users}
        label="Attempts"
        value={data.totalAttempts}
        sub={`${data.uniqueUsers} users`}
        color="bg-violet-500/10 text-violet-400"
      />
    </div>
  );
}

// ─── admin attempts table ─────────────────────────────────────────────────────

function AdminAttemptsTable({ testId }: { testId: string }) {
  const [page, setPage] = useState(0);
  const [type, setType] = useState<AttemptFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const LIMIT = 20;

  const [data] = trpc.result.getTestResults.useSuspenseQuery({
    testId,
    page,
    limit: LIMIT,
    type: type === "all" ? undefined : type,
    sortBy,
    sortOrder,
  });

  const handleSort = (field: SortBy) => {
    if (sortBy === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(0);
  };

  function SortHead({
    field,
    label,
    className,
  }: {
    field: SortBy;
    label: string;
    className?: string;
  }) {
    const active = sortBy === field;
    const Icon = active
      ? sortOrder === "asc"
        ? ArrowUp
        : ArrowDown
      : ArrowUpDown;
    return (
      <TableHead className={className}>
        <button
          onClick={() => handleSort(field)}
          className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-widest uppercase transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {label} <Icon className="h-3 w-3" />
        </button>
      </TableHead>
    );
  }

  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="text-muted-foreground/30 mb-3 h-8 w-8" />
        <p className="text-muted-foreground text-sm">No attempts yet</p>
      </div>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <span className="text-muted-foreground text-xs tabular-nums">
          {data.meta.total} {data.meta.total === 1 ? "attempt" : "attempts"}
        </span>
        <div className="flex items-center gap-2">
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v as AttemptFilter);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-7 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="assessment">Assessment</SelectItem>
              <SelectItem value="practice">Practice</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
          >
            {sortOrder === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUp className="h-3 w-3" />
            )}
            {sortOrder === "desc" ? "Desc" : "Asc"}
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            <TableHead>
              <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                User
              </span>
            </TableHead>
            <TableHead>
              <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                Type
              </span>
            </TableHead>
            <SortHead field="score" label="Score" className="text-right" />
            <TableHead className="text-right">
              <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                WPM
              </span>
            </TableHead>
            <TableHead className="text-right">
              <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                Acc
              </span>
            </TableHead>
            <SortHead field="mistakes" label="Err" className="text-right" />
            <SortHead field="time" label="Submitted" className="text-right" />
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.map((row) => (
            <TableRow key={row.attemptId} className="group">
              <TableCell className="py-3">
                <p className="text-sm leading-none font-medium">
                  {row.user.name}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {row.user.email}
                </p>
              </TableCell>
              <TableCell className="py-3">
                <Badge
                  variant={row.type === "assessment" ? "default" : "secondary"}
                  className="text-[10px] capitalize"
                >
                  {row.type}
                </Badge>
              </TableCell>
              <TableCell className="py-3 text-right font-bold tabular-nums">
                {row.result.score}
              </TableCell>
              <TableCell className="text-muted-foreground py-3 text-right tabular-nums">
                {row.result.wpm}
              </TableCell>
              <TableCell
                className={`py-3 text-right font-semibold tabular-nums ${accColor(row.result.accuracy)}`}
              >
                {row.result.accuracy}%
              </TableCell>
              <TableCell className="text-muted-foreground py-3 text-right tabular-nums">
                {row.result.mistakes}
              </TableCell>
              <TableCell className="text-muted-foreground py-3 text-right text-xs tabular-nums">
                {formatDistanceToNow(new Date(row.result.submittedAt), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell className="py-3 text-right">
                <Link href={`/admin/user-attempt/${row.attemptId}`}>
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
      {data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="text-muted-foreground text-xs tabular-nums">
            Page {page + 1} of {data.meta.totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page + 1 >= data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── user attempts table (own attempts only, no navigation) ───────────────────

function UserAttemptsTable({ testId }: { testId: string }) {
  const [page, setPage] = useState(0);
  const LIMIT = 10;

  const [data] = trpc.user.getAttemptsPaginated.useSuspenseQuery({
    page,
    limit: LIMIT,
    testId,
  });

  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
        <TrendingUp className="text-muted-foreground/30 mb-3 h-7 w-7" />
        <p className="text-muted-foreground text-sm">
          You haven't attempted this test yet
        </p>
      </div>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            {["Type", "Score", "WPM", "Accuracy", "Mistakes", "Date"].map(
              (h, i) => (
                <TableHead key={h} className={i > 0 ? "text-right" : ""}>
                  <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                    {h}
                  </span>
                </TableHead>
              ),
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.map((row) => (
            <TableRow key={row.attemptId}>
              <TableCell className="py-3">
                <Badge
                  variant={row.type === "assessment" ? "default" : "secondary"}
                  className="text-[10px] capitalize"
                >
                  {row.type}
                </Badge>
              </TableCell>
              <TableCell className="py-3 text-right font-bold tabular-nums">
                {row.result.score}
              </TableCell>
              <TableCell className="text-muted-foreground py-3 text-right tabular-nums">
                {row.result.wpm}
              </TableCell>
              <TableCell
                className={`py-3 text-right font-semibold tabular-nums ${accColor(row.result.accuracy)}`}
              >
                {row.result.accuracy}%
              </TableCell>
              <TableCell className="text-muted-foreground py-3 text-right tabular-nums">
                {row.result.mistakes}
              </TableCell>
              <TableCell className="text-muted-foreground py-3 text-right text-xs tabular-nums">
                {formatDistanceToNow(new Date(row.result.submittedAt), {
                  addSuffix: true,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="text-muted-foreground text-xs tabular-nums">
            Page {page + 1} of {data.meta.totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page + 1 >= data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── skeletons ────────────────────────────────────────────────────────────────

function AttemptsTabSkeleton() {
  return (
    <Card>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="ml-auto h-4 w-10" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-10 rounded-lg" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// ─── inner ────────────────────────────────────────────────────────────────────

function TestDetailInner({
  testId,
  isAdmin,
}: {
  testId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();

  // Prefetch attempts so tab switch has no loading state
  if (isAdmin) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    trpc.result.getTestResults.useQuery(
      { testId, page: 0, limit: 20, sortBy: "score", sortOrder: "desc" },
      { staleTime: 30_000 },
    );
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    trpc.user.getAttemptsPaginated.useQuery(
      { page: 0, limit: 10, testId },
      { staleTime: 30_000 },
    );
  }

  const [data] = trpc.test.get.useSuspenseQuery({ id: testId });
  const utils = trpc.useUtils();

  const deleteMutation = trpc.test.delete.useMutation({
    onSuccess: () => {
      void utils.test.list.invalidate();
      router.push("/admin/tests");
    },
  });
  const updateMutation = trpc.test.update.useMutation({
    onSuccess: () => void utils.test.get.invalidate({ id: testId }),
  });

  const isDraft = data.status === "draft";
  const isLegal = data.type === "legal";

  // dialog state for Practice / Assess
  const [startDialog, setStartDialog] = useState<{
    open: boolean;
    isPractice: boolean;
  }>({
    open: false,
    isPractice: true,
  });

  // For user: check if they've ever attempted this test
  const { data: userAttempts } = trpc.user.getAttemptsPaginated.useQuery(
    { page: 0, limit: 1, testId },
    { enabled: !isAdmin, staleTime: 30_000 },
  );
  const hasAttempted = !isAdmin && (userAttempts?.data?.length ?? 0) > 0;
  const isWithin24h =
    !isAdmin && data.createdAt
      ? Date.now() - new Date(data.createdAt).getTime() < 24 * 60 * 60 * 1000
      : false;
  const canAssess = !hasAttempted && isWithin24h;

  const defaultTab = isAdmin
    ? data.status === "active"
      ? "attempts"
      : "matter"
    : "attempts";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      {/* ── back ── */}
      <button
        onClick={() => router.back()}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      {/* ── header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {data.title}
            </h1>
            <span
              className={[
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase ring-1",
                isLegal
                  ? "bg-amber-500/10 text-amber-400 ring-amber-500/25"
                  : "bg-sky-500/10 text-sky-400 ring-sky-500/25",
              ].join(" ")}
            >
              {isLegal ? (
                <Gavel className="h-2.5 w-2.5" />
              ) : (
                <FileText className="h-2.5 w-2.5" />
              )}
              {data.type}
            </span>
            {isAdmin && (
              <span
                className={[
                  "rounded-md px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase",
                  data.status === "active"
                    ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                    : "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30",
                ].join(" ")}
              >
                {data.status}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {isAdmin ? "Created " : "Published "}
            {formatDistanceToNow(new Date(data.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* ── actions ── */}
        <div className="flex shrink-0 items-center gap-2">
          {isAdmin && isDraft && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/test/${testId}/edit`}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-500"
                  >
                    <Rocket className="mr-1.5 h-3.5 w-3.5" />
                    Launch
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-emerald-500" />
                      Launch this test?
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-3 text-sm">
                        <p>
                          You&apos;re about to make{" "}
                          <span className="text-foreground font-medium">
                            &quot;{data.title}&quot;
                          </span>{" "}
                          live.
                        </p>
                        <ul className="text-muted-foreground space-y-1.5 pl-1">
                          {[
                            "The test will be immediately visible to all users.",
                            "You will not be able to edit the title, matter, outline, audio, or timing once active.",
                            "This action cannot be undone.",
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Go back</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({
                          ...data,
                          id: testId,
                          status: "active",
                        })
                      }
                    >
                      <Rocket className="mr-1.5 h-3.5 w-3.5" />
                      {updateMutation.isPending
                        ? "Launching…"
                        : "Yes, launch test"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this test?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{data.title}&quot; and
                    all associated attempts and results. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => deleteMutation.mutate({ id: testId })}
                  >
                    {deleteMutation.isPending ? "Deleting…" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* User CTAs
              Rules:
              - Within 24h + not yet assessed → Assessment only (must assess first)
              - Has assessed OR past 24h window → Practice only */}
          {!isAdmin &&
            data.status === "active" &&
            (canAssess ? (
              // Must assess before practicing
              <Button
                size="sm"
                onClick={() =>
                  setStartDialog({ open: true, isPractice: false })
                }
              >
                <Target className="mr-1.5 h-3.5 w-3.5" />
                Attempt Assessment
              </Button>
            ) : (
              // Assessed (or window passed) → practice freely
              <Button
                size="sm"
                onClick={() => setStartDialog({ open: true, isPractice: true })}
              >
                <Play className="mr-1.5 h-3.5 w-3.5 translate-x-px" />
                Practice
              </Button>
            ))}
        </div>
      </div>

      <Separator />

      {/* ── KPI cards (both admin and user) ── */}
      <KpiStrip testId={testId} />

      {/* ── timing strip ── */}
      <div className="border-border bg-card flex flex-wrap gap-6 rounded-xl border px-5 py-4">
        <TimingStat
          icon={Mic}
          label="Dictation"
          value={fmtSec(data.dictationSeconds)}
        />
        <Separator orientation="vertical" className="h-10 self-center" />
        <TimingStat
          icon={Pause}
          label="Break"
          value={fmtSec(data.breakSeconds)}
        />
        <Separator orientation="vertical" className="h-10 self-center" />
        <TimingStat
          icon={Clock}
          label="Writing"
          value={fmtSec(data.writtenDurationSeconds)}
        />
        <Separator orientation="vertical" className="h-10 self-center" />
        <TimingStat
          icon={Clock}
          label="Total"
          value={fmtSec(
            data.dictationSeconds +
              data.breakSeconds +
              data.writtenDurationSeconds,
          )}
        />
      </div>

      {/* ── audio ── */}
      {isAdmin && <AudioPlayer audioUrl={data.audioUrl} />}
      {/* ── tabs ── */}
      <Tabs defaultValue={defaultTab} className="w-full space-y-4">
        <TabsList className="w-full">
          <TabsTrigger
            value="attempts"
            className="flex flex-1 items-center gap-1.5"
          >
            <Users className="h-3.5 w-3.5" />
            {isAdmin ? "Attempts" : "My Attempts"}
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger
                value="matter"
                className="flex flex-1 items-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                Matter
              </TabsTrigger>
              <TabsTrigger
                value="outline"
                className="flex flex-1 items-center gap-1.5"
              >
                <ListChecks className="h-3.5 w-3.5" />
                Outline
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="attempts">
          <Suspense fallback={<AttemptsTabSkeleton />}>
            {isAdmin ? (
              <AdminAttemptsTable testId={testId} />
            ) : (
              <UserAttemptsTable testId={testId} />
            )}
          </Suspense>
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="matter">
              <div className="rounded-xl bg-gradient-to-r from-emerald-400/40 via-emerald-400/10 to-transparent p-[1px]">
                <Card className="bg-background rounded-xl">
                  <CardContent className="pt-5">
                    <p className="text-foreground/80 font-mono text-sm leading-7 whitespace-pre-wrap">
                      {data.matter}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="outline">
              <Card>
                <CardContent className="pt-5">
                  {data.outline ? (
                    <p className="text-foreground/80 text-sm leading-7 whitespace-pre-wrap">
                      {data.outline}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">
                      No outline provided
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* ── TestStartDialog (user only) ── */}
      {!isAdmin && (
        <TestStartDialog
          open={startDialog.open}
          onOpenChange={(open) => setStartDialog((s) => ({ ...s, open }))}
          testId={testId}
          testTitle={data.title}
          isPractice={startDialog.isPractice}
        />
      )}
    </div>
  );
}

// ─── export ───────────────────────────────────────────────────────────────────

export default function TestDetailClient({ testId, isAdmin = false }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TestDetailInner testId={testId} isAdmin={isAdmin} />
    </Suspense>
  );
}
