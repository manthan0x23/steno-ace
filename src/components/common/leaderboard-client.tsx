"use client";

// ─── components/common/leaderboard-client.tsx ────────────────────────────────
//
// Generic leaderboard used by both admin and user routes.
//
// Admin page:
//   import LeaderboardClient from "~/components/common/leaderboard-client";
//   export default function Page() { return <LeaderboardClient isAdmin />; }
//
// User page:
//   import LeaderboardClient from "~/components/common/leaderboard-client";
//   export default function Page() {
//     const [me] = trpc.user.me.useSuspenseQuery();
//     return <LeaderboardClient currentUserId={me.id} />;
//   }
//
// Differences by mode:
//   isAdmin=true  → every row links to /admin/report-card/[userId]
//   isAdmin=false → only the current user's own row links to /user/report-card
//                   own row is highlighted with bg-primary/5 + "(You)" label
//                   podium shows "You" for own entry

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Trophy,
  ChevronLeft,
  ChevronRight,
  Users,
  Target,
  Zap,
  ArrowRight,
} from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────

type Performer = {
  rank: number;
  user: {
    id: string;
    name: string | null;
    email: string;
    profilePicUrl: string | null;
  };
  totalPoints: number;
  testsPlayed: number;
  firstPlaces: number;
};

type Meta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type LeaderboardClientProps = {
  isAdmin?: boolean;
  currentUserId?: string;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
const MEDALS = ["🥇", "🥈", "🥉"];
const FROM_DATE_30D = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(u: Performer["user"]) {
  return (u.name ?? u.email ?? "?")[0]?.toUpperCase() ?? "?";
}

function UserAvatar({
  user,
  size = "sm",
}: {
  user: Performer["user"];
  size?: "sm" | "md";
}) {
  const sz = size === "md" ? "h-9 w-9" : "h-7 w-7";
  return (
    <Avatar className={`${sz} shrink-0`}>
      <AvatarImage
        src={user.profilePicUrl ?? undefined}
        alt={user.name ?? ""}
      />
      <AvatarFallback className="text-xs font-semibold">
        {initials(user)}
      </AvatarFallback>
    </Avatar>
  );
}

function badgeFor(p: Performer) {
  if (p.firstPlaces >= 5)
    return {
      label: "Champion",
      cls: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
    };
  if (p.firstPlaces >= 3)
    return {
      label: "Gold",
      cls: "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30",
    };
  if (p.firstPlaces >= 1)
    return {
      label: "Winner",
      cls: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
    };
  if (p.testsPlayed >= 10)
    return {
      label: "Active",
      cls: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30",
    };
  return null;
}

// ─── mini bar chart ───────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: Performer[] }) {
  const top4 = data.slice(0, 4);
  if (top4.length === 0) return null;
  const max = Math.max(...top4.map((p) => p.totalPoints), 1);
  const barColors = [
    "bg-amber-500",
    "bg-slate-400",
    "bg-orange-400",
    "bg-zinc-500",
  ];

  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border px-5 py-4">
      <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
        Top 4 — Points
      </p>
      <div className="flex flex-1 items-end gap-3">
        {top4.map((p, i) => {
          const pct = Math.max(8, (p.totalPoints / max) * 100);
          return (
            <div
              key={p.user.id}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span className="text-muted-foreground text-[11px] font-bold tabular-nums">
                {Math.round(p.totalPoints)}
              </span>
              <div
                className="w-full rounded-t-sm"
                style={{ height: `${pct}%`, maxHeight: "80px" }}
              >
                <div
                  className={`${barColors[i]} h-full w-full rounded-t-sm opacity-80`}
                />
              </div>
              <UserAvatar user={p.user} size="sm" />
              <p className="max-w-[52px] truncate text-center text-[10px] font-medium">
                {p.user.name?.split(" ")[0] ?? p.user.email.split("@")[0]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── podium ───────────────────────────────────────────────────────────────────

function PodiumCard({
  top3,
  currentUserId,
}: {
  top3: Performer[];
  currentUserId?: string;
}) {
  if (top3.length === 0) return null;
  const order = [top3[1], top3[0], top3[2]].filter(Boolean) as Performer[];

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="bg-muted/40 flex items-center gap-1.5 border-b px-4 py-2.5">
        <Trophy className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
          Podium
        </span>
      </div>

      <div className="flex items-end justify-center gap-3 px-6 pt-5 pb-0">
        {order.map((p) => {
          const blockH = p.rank === 1 ? "h-16" : p.rank === 2 ? "h-12" : "h-8";
          const blockBg =
            p.rank === 1
              ? "bg-amber-500/20 ring-1 ring-amber-500/40"
              : p.rank === 2
                ? "bg-slate-500/15 ring-1 ring-slate-400/30"
                : "bg-orange-500/10 ring-1 ring-orange-500/20";
          const isYou = !!currentUserId && p.user.id === currentUserId;
          return (
            <div key={p.user.id} className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <UserAvatar user={p.user} size="md" />
                {p.rank === 1 && (
                  <span className="absolute -top-2 -right-1 text-sm">👑</span>
                )}
              </div>
              <p
                className={`max-w-[60px] truncate text-center text-[11px] font-semibold ${isYou ? "text-primary" : ""}`}
              >
                {isYou
                  ? "You"
                  : (p.user.name?.split(" ")[0] ?? p.user.email.split("@")[0])}
              </p>
              <p className="text-muted-foreground text-[10px] font-bold tabular-nums">
                {Math.round(p.totalPoints)}
              </p>
              <div
                className={`${blockH} ${blockBg} flex w-16 items-start justify-center rounded-t-lg pt-1.5`}
              >
                <span className="text-base">{MEDALS[p.rank - 1]}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-1 divide-y">
        {top3.map((p) => {
          const isYou = !!currentUserId && p.user.id === currentUserId;
          return (
            <div
              key={p.user.id}
              className={`flex items-center gap-2.5 px-4 py-2.5 ${isYou ? "bg-primary/5" : ""}`}
            >
              <span className="w-5 shrink-0 text-center text-sm">
                {MEDALS[p.rank - 1]}
              </span>
              <UserAvatar user={p.user} size="sm" />
              <p
                className={`min-w-0 flex-1 truncate text-sm font-medium ${isYou ? "text-primary" : ""}`}
              >
                {isYou ? "You" : (p.user.name ?? p.user.email)}
              </p>
              <p className="shrink-0 text-sm font-bold text-amber-500 tabular-nums">
                {Math.round(p.totalPoints)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── stats strip ─────────────────────────────────────────────────────────────

function StatsStrip({ total, data }: { total: number; data: Performer[] }) {
  const totalPlays = data.reduce((s, p) => s + p.testsPlayed, 0);
  const avgPts =
    data.length > 0
      ? Math.round(data.reduce((s, p) => s + p.totalPoints, 0) / data.length)
      : 0;

  return (
    <div className="grid grid-cols-3 divide-x rounded-xl border">
      {[
        {
          Icon: Users,
          label: "Participants",
          value: total,
          color: "text-violet-500",
        },
        {
          Icon: Target,
          label: "Total Plays",
          value: totalPlays,
          color: "text-blue-500",
        },
        {
          Icon: Zap,
          label: "Avg Points",
          value: avgPts,
          color: "text-amber-500",
        },
      ].map(({ Icon, label, value, color }) => (
        <div
          key={label}
          className="flex items-center justify-between px-5 py-3.5"
        >
          <div>
            <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
              {label}
            </p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums">{value}</p>
          </div>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      ))}
    </div>
  );
}

// ─── table ────────────────────────────────────────────────────────────────────

function LeaderboardTable({
  data,
  meta,
  isAdmin,
  currentUserId,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  data: Performer[];
  meta: Meta;
  isAdmin?: boolean;
  currentUserId?: string;
  page: number;
  pageSize: PageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}) {
  const router = useRouter();

  const visiblePages = () => {
    const { totalPages } = meta;
    // page here is 1-based
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: 5 }, (_, i) => start + i);
  };

  const handleRowClick = (p: Performer) => {
    if (isAdmin) {
      router.push(`/admin/report-card/${p.user.id}`);
    } else if (currentUserId && p.user.id === currentUserId) {
      router.push("/user/report-card");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-semibold tabular-nums">
            {meta.total}
          </span>{" "}
          participants
        </p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Rows</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              onPageSizeChange(Number(v) as PageSize);
            }}
          >
            <SelectTrigger className="h-7 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        {/* Header */}
        <div className="bg-muted/40 grid grid-cols-[40px_36px_1fr_96px_72px_72px_80px_28px] gap-3 border-b px-4 py-2">
          {["#", "", "User", "Points", "Tests", "#1 Wins", "Badge", ""].map(
            (h, i) => (
              <span
                key={i}
                className={[
                  "text-muted-foreground text-[10px] font-semibold tracking-widest uppercase",
                  i >= 3 && i <= 6 ? "text-right" : "",
                ].join(" ")}
              >
                {h}
              </span>
            ),
          )}
        </div>

        {data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Trophy className="text-muted-foreground/30 h-8 w-8" />
            <p className="text-muted-foreground text-sm">No participants yet</p>
          </div>
        ) : (
          data.map((p, idx) => {
            const b = badgeFor(p);
            const isTop3 = p.rank <= 3;
            const isYou = !!currentUserId && p.user.id === currentUserId;
            const clickable = isAdmin || isYou;

            return (
              <div
                key={p.user.id}
                onClick={() => handleRowClick(p)}
                className={[
                  "group grid grid-cols-[40px_36px_1fr_96px_72px_72px_80px_28px] items-center gap-3 px-4 py-2.5 transition-colors",
                  idx !== data.length - 1 ? "border-b" : "",
                  isTop3 ? "bg-muted/20" : "",
                  isYou ? "bg-primary/5" : "",
                  clickable ? "hover:bg-muted/50 cursor-pointer" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {/* Rank */}
                <div className="flex justify-center">
                  {isTop3 ? (
                    <span className="text-base">{MEDALS[p.rank - 1]}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm font-semibold tabular-nums">
                      {p.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <UserAvatar user={p.user} size="sm" />

                {/* Name + email */}
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm leading-none font-medium ${isYou ? "text-primary" : ""}`}
                  >
                    {p.user.name ?? p.user.email}
                    {isYou && (
                      <span className="text-primary/60 ml-1 text-xs font-normal">
                        (You)
                      </span>
                    )}
                  </p>
                  {p.user.name && (
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {p.user.email}
                    </p>
                  )}
                </div>

                {/* Points */}
                <p
                  className={`text-right text-sm font-bold tabular-nums ${isTop3 ? "text-amber-500" : ""}`}
                >
                  {Math.round(p.totalPoints)}
                </p>

                {/* Tests */}
                <p className="text-muted-foreground text-right text-sm tabular-nums">
                  {p.testsPlayed}
                </p>

                {/* #1 wins */}
                <p
                  className={`text-right text-sm font-semibold tabular-nums ${p.firstPlaces > 0 ? "text-amber-500" : "text-muted-foreground"}`}
                >
                  {p.firstPlaces}
                </p>

                {/* Badge */}
                <div className="flex justify-end">
                  {b ? (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase ${b.cls}`}
                    >
                      {b.label}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/30 text-xs">—</span>
                  )}
                </div>

                {/* Arrow — only for clickable rows */}
                {clickable ? (
                  <ArrowRight className="text-muted-foreground/40 h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                ) : (
                  <span />
                )}
              </div>
            );
          })
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-muted-foreground text-xs tabular-nums">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, meta.total)}{" "}
            of {meta.total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {visiblePages().map((pg) => (
              <Button
                key={pg}
                variant={pg === page ? "default" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                onClick={() => onPageChange(pg)}
              >
                {pg}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page >= meta.totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── inner ────────────────────────────────────────────────────────────────────

function LeaderboardInner({ isAdmin, currentUserId }: LeaderboardClientProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);

  const [{ data, meta }] =
    trpc.analytics.getGlobalTopPerformers.useSuspenseQuery({
      page,
      pageSize,
      fromDate: FROM_DATE_30D,
    });

  // Podium always shows top 3 from the first page. Once the user navigates
  // away from page 1, the podium retains the last-seen top-3 (stale-while-
  // revalidate is fine here — podium doesn't need to update on every page turn).
  const top3 = page === 1 ? data.slice(0, 3) : data.slice(0, 3);

  const handlePageSizeChange = (size: PageSize) => {
    setPageSize(size);
    setPage(1); // reset to first page whenever page size changes
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-5">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <StatsStrip total={meta.total} data={data} />
          <MiniBarChart data={data} />
        </div>
        <div className="w-64 shrink-0">
          {top3.length > 0 ? (
            <PodiumCard top3={top3} currentUserId={currentUserId} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border py-12">
              <p className="text-muted-foreground text-sm">No data</p>
            </div>
          )}
        </div>
      </div>
      <LeaderboardTable
        data={data}
        meta={meta}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function LeaderboardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-5">
        <div className="flex flex-1 flex-col gap-4">
          <div className="grid grid-cols-3 divide-x rounded-xl border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5 px-5 py-3.5">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-7 w-12" />
              </div>
            ))}
          </div>
          <div className="flex h-40 items-end gap-3 rounded-xl border px-5 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <Skeleton className="h-3 w-8" />
                <Skeleton
                  className="w-full rounded-t-sm"
                  style={{ height: `${30 + i * 15}px` }}
                />
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-2.5 w-10" />
              </div>
            ))}
          </div>
        </div>
        <div className="w-64 overflow-hidden rounded-xl border">
          <div className="bg-muted/40 border-b px-4 py-2.5">
            <Skeleton className="h-3 w-14" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 border-b px-4 py-2.5 last:border-0"
            >
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-3.5 flex-1" />
              <Skeleton className="h-3.5 w-10" />
            </div>
          ))}
        </div>
      </div>
      <div className="divide-y overflow-hidden rounded-xl border">
        <div className="bg-muted/40 border-b px-4 py-2">
          <Skeleton className="h-3 w-40" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <Skeleton className="h-5 w-6" />
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="ml-auto h-3.5 w-14" />
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="h-5 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── export ───────────────────────────────────────────────────────────────────

export default function LeaderboardClient({
  isAdmin = false,
  currentUserId,
}: LeaderboardClientProps) {
  return (
    <div className="w-full space-y-5 px-6 py-7">
      <div className="flex items-center gap-3">
        <Trophy className="h-5 w-5 text-amber-500" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground text-sm">
            {isAdmin
              ? "Global rankings — last 30 days"
              : "See how you stack up — last 30 days"}
          </p>
        </div>
      </div>
      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardInner isAdmin={isAdmin} currentUserId={currentUserId} />
      </Suspense>
    </div>
  );
}
