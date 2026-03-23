"use client";

import { useState } from "react";
import { trpc } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Search, X, Trophy, Star } from "lucide-react";
import { Button } from "~/components/ui/button";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function HofCard({
  entry,
}: {
  entry: {
    id: string;
    name: string;
    photoUrl: string | null;
    department: string;
    batch: string | null;
    note: string | null;
  };
}) {
  return (
    <div
      className="bg-card flex flex-col items-center gap-3 rounded-2xl border px-5 py-6 text-center transition-all hover:shadow-md"
      style={{
        background: `radial-gradient(ellipse at top, color-mix(in oklch, var(--chart-1) 6%, var(--card)), var(--card))`,
      }}
    >
      <Avatar className="ring-primary/20 ring-offset-card h-16 w-16 ring-2 ring-offset-2">
        <AvatarImage src={entry.photoUrl ?? undefined} alt={entry.name} />
        <AvatarFallback className="text-base font-bold">
          {initials(entry.name)}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <p className="text-sm leading-tight font-bold">{entry.name}</p>
        {entry.batch && (
          <p className="text-muted-foreground text-xs">Batch {entry.batch}</p>
        )}
      </div>
      <Badge variant="secondary" className="text-xs">
        {entry.department}
      </Badge>
      {entry.note && (
        <p className="text-muted-foreground text-xs leading-relaxed">
          {entry.note}
        </p>
      )}
    </div>
  );
}

function HofSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-3 rounded-2xl border px-5 py-6"
        >
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function UserHallOfFamePage() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string | undefined>();

  const { data, isLoading } = trpc.hof.list.useQuery(
    { search: search || undefined, department, limit: 100 },
    { staleTime: 60_000 },
  );

  const entries = data?.data ?? [];
  const departments = data?.departments ?? [];

  return (
    <div className="w-full space-y-6 px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-full p-2.5">
          <Trophy className="text-primary h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hall of Fame
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Students who made it — inspiring the next batch
          </p>
        </div>
      </div>

      {/* Search + dept filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dept pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDepartment(undefined)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              !department
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {departments.map((d) => (
            <button
              key={d}
              onClick={() => setDepartment(d === department ? undefined : d)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                department === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      {/* {!isLoading && (
        <p className="text-muted-foreground text-xs tabular-nums">
          {entries.length} student{entries.length !== 1 ? "s" : ""}
          {department ? ` in ${department}` : ""}
        </p>
      )} */}

      {/* Grid */}
      {isLoading ? (
        <HofSkeleton />
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center">
          <Star className="text-muted-foreground/30 mb-3 h-8 w-8" />
          <p className="text-muted-foreground text-sm font-medium">
            No entries yet
          </p>
          <p className="text-muted-foreground/60 mt-1 text-xs">
            Check back soon
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {entries.map((e) => (
            <HofCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}
