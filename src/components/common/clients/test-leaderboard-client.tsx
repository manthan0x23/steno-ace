"use client";

// ─── Shared leaderboard page ──────────────────────────────────────────────────
// Used at:
//   /user/test/[testId]/leaderboard  (isAdmin = false)
//   /admin/test/[testId]/leaderboard (isAdmin = true)
//
// Drop this component in both routes and pass the correct props.

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Trophy, Medal, Star, Zap, BarChart2, ChevronLeft } from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined, email: string) {
  if (name)
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

function displayName(name: string | null | undefined, email: string) {
  return name ?? email;
}

// Rank decoration: 🥇🥈🥉 for top 3, number after
function RankCell({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex items-center gap-1.5">
        <Trophy className="h-4 w-4 text-yellow-500" />
        <span className="font-bold text-yellow-600 dark:text-yellow-400">
          1
        </span>
      </div>
    );
  if (rank === 2)
    return (
      <div className="flex items-center gap-1.5">
        <Medal className="h-4 w-4 text-slate-400" />
        <span className="font-bold text-slate-500">2</span>
      </div>
    );
  if (rank === 3)
    return (
      <div className="flex items-center gap-1.5">
        <Medal className="h-4 w-4 text-amber-600" />
        <span className="font-bold text-amber-700 dark:text-amber-500">3</span>
      </div>
    );
  return (
    <span className="text-muted-foreground text-sm tabular-nums">{rank}</span>
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border px-5 py-3.5"
        >
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

// ─── leaderboard table ────────────────────────────────────────────────────────

type Entry = {
  rank: number;
  user: { id: string; name: string | null; email: string };
  speed: { id: string; wpm: number };
  accuracy: number;
  wpm: number;
  mistakes: number;
};

function LeaderboardTable({
  entries,
  currentUserId,
  isAdmin,
  testId,
}: {
  entries: Entry[];
  currentUserId: string | null;
  isAdmin: boolean;
  testId: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <Trophy className="text-muted-foreground/30 mb-3 h-8 w-8" />
        <p className="text-muted-foreground text-sm font-medium">
          No entries yet
        </p>
        <p className="text-muted-foreground/60 mt-1 text-xs">
          Be the first to complete this speed!
        </p>
      </div>
    );
  }

  const userEntry = entries.find((e) => e.user.id === currentUserId);

  return (
    <div className="space-y-4">
      {/* User's position callout — user view only, when not in top entries */}
      {!isAdmin &&
        currentUserId &&
        userEntry &&
        userEntry.rank > entries.length && (
          <div className="border-primary/30 bg-primary/5 flex items-center gap-4 rounded-xl border px-5 py-3.5">
            <span className="text-primary text-xs font-semibold">
              Your position
            </span>
            <span className="text-primary text-sm font-bold tabular-nums">
              #{userEntry.rank}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-muted-foreground text-xs">
                {userEntry.accuracy}% accuracy
              </span>
              <span className="text-muted-foreground text-xs">
                {userEntry.wpm} WPM
              </span>
            </div>
          </div>
        )}

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Participant</TableHead>
              <TableHead className="w-28 text-right">Accuracy</TableHead>
              <TableHead className="w-28 text-right">WPM</TableHead>
              <TableHead className="w-24 text-right">Mistakes</TableHead>
              {!isAdmin && <TableHead className="w-16" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const isMe = entry.user.id === currentUserId;
              return (
                <TableRow
                  key={entry.user.id}
                  className={isMe ? "bg-primary/5 font-medium" : ""}
                >
                  <TableCell className="py-3.5">
                    <RankCell rank={entry.rank} />
                  </TableCell>

                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs font-semibold">
                          {initials(entry.user.name, entry.user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm leading-none font-medium">
                          {displayName(entry.user.name, entry.user.email)}
                          {isMe && (
                            <Badge
                              variant="secondary"
                              className="ml-2 text-[10px]"
                            >
                              You
                            </Badge>
                          )}
                        </p>
                        {isAdmin && (
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {entry.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5 text-right text-sm tabular-nums">
                    <span
                      className={
                        entry.accuracy >= 90
                          ? "font-semibold text-emerald-600 dark:text-emerald-400"
                          : ""
                      }
                    >
                      {entry.accuracy}%
                    </span>
                  </TableCell>

                  <TableCell className="py-3.5 text-right text-sm tabular-nums">
                    {entry.wpm}
                  </TableCell>

                  <TableCell className="text-muted-foreground py-3.5 text-right text-sm tabular-nums">
                    {entry.mistakes}
                  </TableCell>

                  {/* My attempts CTA — user view only */}
                  {!isAdmin && (
                    <TableCell className="py-3.5 text-right">
                      {isMe && (
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/user/test/${testId}/attempts`}>
                            <BarChart2 className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

interface LeaderboardPageProps {
  isAdmin?: boolean;
  currentUserId?: string | null;
}

export function TestLeaderboardPage({
  isAdmin = false,
  currentUserId = null,
}: LeaderboardPageProps) {
  const params = useParams<{ testId: string }>();
  const testId = params.testId;
  const router = useRouter();

  // Fetch test speeds first to build the tab list
  const { data: testData } = trpc.test.get.useQuery({ id: testId });

  const speeds = testData?.speeds ?? [];

  // Active speed tab — default to first speed
  const [activeSpeedId, setActiveSpeedId] = useState<string | null>(null);
  const resolvedSpeedId = activeSpeedId ?? speeds[0]?.id ?? null;

  // Fetch leaderboard for the active speed
  const { data: leaderboardData, isLoading } =
    trpc.result.getTopPerformersByTest.useQuery(
      { testId, speedId: resolvedSpeedId ?? "", limit: 50 },
      { enabled: !!resolvedSpeedId, staleTime: 30_000 },
    );

  const entries = (leaderboardData ?? []) as Entry[];

  // Find current user's entry across all entries (even if not in top N)
  const userEntry = currentUserId
    ? entries.find((e) => e.user.id === currentUserId)
    : null;

  return (
    <div className="w-full space-y-6 px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground mb-2 -ml-2"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {isAdmin ? "Back" : "Back"}
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">
            {testData?.title ?? "Leaderboard"}
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Rankings are based on accuracy · Assess once per speed
          </p>
        </div>

        {/* User's rank summary — only on user view */}
        {!isAdmin && userEntry && (
          <div className="bg-card min-w-[120px] shrink-0 rounded-xl border px-5 py-4 text-center">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
              Your rank
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              #{userEntry.rank}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {userEntry.accuracy}% accuracy
            </p>
          </div>
        )}

        {/* My attempts CTA — user view */}
        {!isAdmin && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-8 shrink-0 self-start"
          >
            <Link href={`/user/test/${testId}/attempts`}>
              <BarChart2 className="h-3.5 w-3.5" />
              My Attempts
            </Link>
          </Button>
        )}
      </div>

      {/* Speed tabs */}
      {speeds.length > 1 && (
        <div className="flex items-center gap-2">
          <Zap className="text-muted-foreground/50 h-3.5 w-3.5 shrink-0" />
          <div className="flex flex-wrap gap-2">
            {speeds.map((s) => {
              const active = resolvedSpeedId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSpeedId(s.id)}
                  className={`rounded-lg border px-3.5 py-1.5 text-sm font-semibold tabular-nums transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.wpm} WPM
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Single speed label */}
      {speeds.length === 1 && speeds[0] && (
        <div className="flex items-center gap-2">
          <Zap className="text-muted-foreground/50 h-3.5 w-3.5" />
          <Badge variant="secondary" className="tabular-nums">
            {speeds[0].wpm} WPM
          </Badge>
        </div>
      )}

      {/* Leaderboard table */}
      {isLoading || !resolvedSpeedId ? (
        <LeaderboardSkeleton />
      ) : (
        <LeaderboardTable
          entries={entries}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          testId={testId}
        />
      )}

      {/* Footer note */}
      <p className="text-muted-foreground/50 text-center text-xs">
        Only assessment attempts are counted · Switch speed tabs to see each
        board
      </p>
    </div>
  );
}
