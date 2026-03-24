"use client";

// ─── app/(user)/test/[testId]/page.tsx ───────────────────────────────────────

import { useParams, useRouter } from "next/navigation";
import { trpc } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Separator } from "~/components/ui/separator";
import {
  ArrowLeft,
  Gavel,
  FileText,
  Star,
  Zap,
  Trophy,
  BarChart2,
  PlayCircle,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Suspense, useState } from "react";
import { TestStartDialog } from "~/components/common/user/test-start-dialog";
import Link from "next/link";

// ─── types ────────────────────────────────────────────────────────────────────

type Speed = {
  id: string;
  wpm: number;
  dictationSeconds: number;
  breakSeconds: number;
  writtenDurationSeconds: number;
  hasAssessed: boolean;
};

type TestDetails = {
  id: string;
  title: string;
  type: "legal" | "general" | "special";
  createdAt: Date;
  speeds: Speed[];
  hasAttempted: boolean;
};

type Selected = { test: TestDetails };

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtSec(s: number) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? (sec > 0 ? `${m}m ${sec}s` : `${m}m`) : `${sec}s`;
}

// ─── badges ───────────────────────────────────────────────────────────────────

const TYPE_ICON = { legal: Gavel, general: FileText, special: Star };
const TYPE_LABEL = { legal: "Legal", general: "General", special: "Special" };

function TypeBadge({ type }: { type: TestDetails["type"] }) {
  const Icon = TYPE_ICON[type];
  return (
    <Badge variant="outline" className="gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {TYPE_LABEL[type]}
    </Badge>
  );
}

// ─── speed card ───────────────────────────────────────────────────────────────

function SpeedCard({ speed }: { speed: Speed }) {
  const total =
    speed.dictationSeconds + speed.breakSeconds + speed.writtenDurationSeconds;

  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <h3 className="text-lg font-semibold tabular-nums">
            {speed.wpm} WPM
          </h3>
        </div>
        {speed.hasAssessed && (
          <Badge variant="secondary" className="text-xs">
            Assessed ✓
          </Badge>
        )}
      </div>
      <p className="text-muted-foreground mt-2 text-sm tabular-nums">
        <Clock className="mr-1 mb-0.5 inline h-3.5 w-3.5" />
        {fmtSec(total)} total
      </p>
    </div>
  );
}

// ─── loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="w-full space-y-8 px-6 py-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-96" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <Separator />
      <div>
        <Skeleton className="mb-3 h-6 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card space-y-4 rounded-xl border p-5">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-px w-full" />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function TestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [selected, setSelected] = useState<Selected | null>(null);

  const { data, isLoading, error } = trpc.test.get.useQuery(
    { id: testId },
    { retry: false },
  );

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
        <FileText className="text-muted-foreground/30 mb-4 h-12 w-12" />
        <h2 className="mb-2 text-xl font-semibold">Test not found</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          This test doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push("/user/tests")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tests
        </Button>
      </div>
    );
  }

  const test = data as unknown as TestDetails;

  return (
    <Suspense>
      <div className="w-full space-y-8 px-6 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/user/tests")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tests
        </Button>

        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {test.title}
              </h1>
              <TypeBadge type={test.type} />
            </div>
            <p className="text-muted-foreground text-sm">
              Created {formatDistanceToNow(new Date(test.createdAt))} ago
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="default">
              <Link href={`/user/tests/${test.id}/results`}>
                <BarChart2 className="mr-2 h-4 w-4" />
                My Results
              </Link>
            </Button>

            <Button asChild variant="outline" size="default">
              <Link href={`/user/tests/${test.id}/leaderboard`}>
                <Trophy className="mr-2 h-4 w-4" />
                Leaderboard
              </Link>
            </Button>

            <Button
              size="default"
              onClick={() => setSelected({ test })}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Attempt Test
            </Button>
          </div>
        </div>

        <Separator />

        {/* Speed levels */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Available Speed Levels</h2>
            <Badge variant="secondary" className="text-xs">
              {test.speeds.length}
            </Badge>
          </div>
          <p className="text-muted-foreground mb-6 text-sm">
            Choose a speed level when you start the test. You can assess each
            speed once.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {test.speeds.map((speed) => (
              <SpeedCard key={speed.id} speed={speed} />
            ))}
          </div>
        </section>

        {/* Test Start Dialog */}

        <TestStartDialog
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
          testId={selected?.test.id ?? ""}
          testTitle={selected?.test.title ?? ""}
          speeds={selected?.test.speeds ?? []}
        />
      </div>
    </Suspense>
  );
}
