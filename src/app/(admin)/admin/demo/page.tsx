"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "~/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShieldOff,
  RefreshCw,
  Clock,
  UserX,
  UserCheck,
  Users,
  KeyRound,
  Copy,
  Check,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { toast } from "sonner";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { DemoUserActionsDialog } from "./_components/demo-actions-dialog";

// ─── types ────────────────────────────────────────────────────────────────────

type DemoStatus = "active" | "expired" | "revoked";

export type DemoUserRow = {
  id: string;
  name: string | null;
  email: string;
  userCode: string | null;
  isDemo: boolean;
  demoExpiresAt: Date | null;
  demoRevoked: boolean;
  createdAt: Date;
  status: DemoStatus;
};

type StatusFilter = "all" | "active" | "expired" | "revoked";

// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(u: Pick<DemoUserRow, "name" | "email">) {
  return (u.name ?? u.email ?? "?")[0]?.toUpperCase() ?? "?";
}

function StatusBadge({ status }: { status: DemoStatus }) {
  if (status === "active")
    return (
      <Badge className="rounded-md border-0 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
        Active
      </Badge>
    );
  if (status === "expired")
    return (
      <Badge className="rounded-md border-0 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 hover:bg-amber-500/10 dark:text-amber-400">
        Expired
      </Badge>
    );
  return (
    <Badge className="rounded-md border-0 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-400">
      Revoked
    </Badge>
  );
}

// ─── table skeleton ───────────────────────────────────────────────────────────

function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            <TableHead className="w-10" />
            <TableHead>User</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="w-44 text-right">Expires</TableHead>
            <TableHead className="w-44 text-right">Created</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="py-3">
                <Skeleton className="h-8 w-8 rounded-full" />
              </TableCell>
              <TableCell className="py-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </TableCell>
              <TableCell className="py-3">
                <Skeleton className="h-5 w-14 rounded-md" />
              </TableCell>
              <TableCell className="py-3 text-right">
                <Skeleton className="ml-auto h-3 w-28" />
              </TableCell>
              <TableCell className="py-3 text-right">
                <Skeleton className="ml-auto h-3 w-28" />
              </TableCell>
              <TableCell className="py-3">
                <div className="flex justify-end gap-1.5">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <Skeleton className="h-7 w-7 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── create dialog ────────────────────────────────────────────────────────────

function CreateDemoUserDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(() => {
    const d = addDays(new Date(), 2);
    const now = new Date();
    d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
    return d;
  });
  const [calOpen, setCalOpen] = useState(false);
  const [created, setCreated] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const { mutate, isPending } = trpc.dus.create.useMutation({
    onSuccess: (data) => {
      setCreated({ email: data.user.email, tempPassword: data.tempPassword });
      void utils.dus.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleCreate() {
    mutate({ expiresAt });
  }

  function handleCopy() {
    if (!created) return;
    void navigator.clipboard.writeText(
      `Email: ${created.email}\nPassword: ${created.tempPassword}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setCreated(null);
    setExpiresAt(addDays(new Date(), 2)); // reset back to default
    setCopied(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {!created ? (
          <>
            <DialogHeader>
              <DialogTitle>Create demo user</DialogTitle>
              <DialogDescription>
                A unique SD-code email and temporary password will be generated
                automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Expiry date</label>
                <Popover open={calOpen} onOpenChange={setCalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start gap-2 text-left font-normal",
                        !expiresAt && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
                      {expiresAt
                        ? format(expiresAt, "do MMM, yyyy")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expiresAt}
                      onSelect={(d) => {
                        if (d) {
                          const now = new Date();
                          d.setHours(
                            now.getHours(),
                            now.getMinutes(),
                            now.getSeconds(),
                            0,
                          );
                        }
                        setExpiresAt(d);
                        setCalOpen(false);
                      }}
                      disabled={(d) => d < new Date()}
                      initialFocus
                    />
                    <div className="border-t px-3 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground h-7 w-full text-xs"
                        onClick={() => {
                          setExpiresAt(undefined);
                          setCalOpen(false);
                        }}
                      >
                        Clear (no expiry)
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <p className="text-muted-foreground text-xs">
                  {expiresAt
                    ? `Expires ${format(expiresAt, "do MMM yyyy")}`
                    : "No expiry set — account will not expire."}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                <h4>Demo user created</h4>
              </DialogTitle>
              <DialogDescription>
                Share these credentials with the demo user.
                <p className="text-primary font-bold">
                  The password won't be shown again.
                </p>
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/30 my-2 space-y-3 rounded-xl border p-4">
              <div>
                <p className="text-muted-foreground mb-0.5 text-[10px] font-semibold tracking-widest uppercase">
                  Email
                </p>
                <p className="font-mono text-sm">{created.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 text-[10px] font-semibold tracking-widest uppercase">
                  Temp password
                </p>
                <p className="font-mono text-sm">{created.tempPassword}</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCopy} className="gap-2">
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied!" : "Copy credentials"}
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── reset password dialog ────────────────────────────────────────────────────

function ResetPasswordDialog({
  open,
  onClose,
  userId,
  userEmail,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
}) {
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { mutate, isPending } = trpc.dus.resetPassword.useMutation({
    onSuccess: (data) => setResult(data.tempPassword),
    onError: (err) => toast.error(err.message),
  });

  function handleCopy() {
    if (!result) return;
    void navigator.clipboard.writeText(
      `Email: ${userEmail}\nPassword: ${result}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setResult(null);
    setCopied(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        {!result ? (
          <>
            <DialogHeader>
              <DialogTitle>Reset password</DialogTitle>
              <DialogDescription>
                Generate a new temporary password for{" "}
                <span className="text-foreground font-mono">{userEmail}</span>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => mutate({ id: userId })}
                disabled={isPending}
              >
                {isPending ? "Resetting…" : "Reset"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Password reset ✓</DialogTitle>
              <DialogDescription>
                New temporary password generated.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted/30 my-2 rounded-xl border p-4">
              <p className="text-muted-foreground mb-0.5 text-[10px] font-semibold tracking-widest uppercase">
                New password
              </p>
              <p className="font-mono text-sm">{result}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCopy} className="gap-2">
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── revoke dialog ────────────────────────────────────────────────────────────

function RevokeDemoUserDialog({
  open,
  onClose,
  userId,
  userEmail,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
}) {
  const utils = trpc.useUtils();

  const { mutate, isPending } = trpc.dus.revoke.useMutation({
    onSuccess: () => {
      toast.success("Demo user revoked");
      void utils.dus.list.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke demo access?</AlertDialogTitle>
          <AlertDialogDescription>
            This will immediately revoke all sessions for{" "}
            <span className="text-foreground font-mono">{userEmail}</span> and
            prevent further logins. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={() => mutate({ id: userId })}
          >
            {isPending ? "Revoking…" : "Revoke access"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── demo users table ─────────────────────────────────────────────────────────

function DemoUsersTable({
  query,
  page,
  pageSize,
  statusFilter,
  onPageChange,
  onTotalChange,
}: {
  query: string;
  page: number;
  pageSize: number;
  statusFilter: StatusFilter;
  onPageChange: (p: number) => void;
  onTotalChange: (n: number) => void;
}) {
  const [revokeTarget, setRevokeTarget] = useState<DemoUserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<DemoUserRow | null>(null);
  const [actionsTarget, setActionsTarget] = useState<DemoUserRow | null>(null);

  const { data, isLoading, isFetching } = trpc.dus.list.useQuery(
    { page, limit: pageSize, search: query || undefined, status: statusFilter },
    { staleTime: 30_000 },
  );

  const users: DemoUserRow[] = (data?.items ?? []) as DemoUserRow[];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  useEffect(() => {
    onTotalChange(total);
  }, [total, onTotalChange]);

  const visiblePages = () => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: 5 }, (_, i) => start + i);
  };

  const dim = isFetching && !isLoading;

  return (
    <>
      <div
        className={`transition-opacity duration-150 ${dim ? "opacity-60" : ""}`}
      >
        {isLoading ? (
          <TableSkeleton rows={pageSize} />
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border py-20 text-center">
            <Users className="text-muted-foreground/30 mb-3 h-10 w-10" />
            <p className="text-muted-foreground text-sm">No demo users found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead className="w-10" />
                  <TableHead className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                    User
                  </TableHead>
                  <TableHead className="text-muted-foreground w-28 text-[10px] font-semibold tracking-widest uppercase">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground w-44 text-right text-[10px] font-semibold tracking-widest uppercase">
                    Expires
                  </TableHead>
                  <TableHead className="text-muted-foreground w-44 text-right text-[10px] font-semibold tracking-widest uppercase">
                    Created
                  </TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="group">
                    {/* Avatar */}
                    <TableCell className="py-3 pl-4">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs font-semibold">
                          {initials(u)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>

                    {/* Name + email */}
                    <TableCell className="py-3">
                      <p className="font-mono text-sm leading-none font-medium">
                        {u.userCode ?? u.email}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {u.email}
                      </p>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3">
                      <StatusBadge status={u.status} />
                    </TableCell>

                    {/* Expires */}
                    <TableCell className="py-3 text-right">
                      {u.demoExpiresAt ? (
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {format(new Date(u.demoExpiresAt), "do MMM, yyyy")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">
                          Never
                        </span>
                      )}
                    </TableCell>

                    {/* Created */}
                    <TableCell className="py-3 text-right">
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {format(new Date(u.createdAt), "do MMM, yyyy")}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3 pr-4">
                      <Button
                        variant="outline"
                        size="xs"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionsTarget(u);
                        }}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                        Actions
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-muted-foreground text-xs tabular-nums">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{" "}
            {total} users
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
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {revokeTarget && (
        <RevokeDemoUserDialog
          open={!!revokeTarget}
          onClose={() => setRevokeTarget(null)}
          userId={revokeTarget.id}
          userEmail={revokeTarget.email}
        />
      )}

      {resetTarget && (
        <ResetPasswordDialog
          open={!!resetTarget}
          onClose={() => setResetTarget(null)}
          userId={resetTarget.id}
          userEmail={resetTarget.email}
        />
      )}

      <DemoUserActionsDialog
        user={actionsTarget}
        onClose={() => setActionsTarget(null)}
      />
    </>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function AdminDemoUsersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get("status") as StatusFilter) ?? "all",
  );
  const [createOpen, setCreateOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFilterChange = (f: StatusFilter) => {
    setStatusFilter(f);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", f);
    router.replace(`?${params.toString()}`);
  };

  const handleSearch = (val: string) => {
    setRawQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(val.trim());
      setPage(1);
    }, 350);
  };

  const clearSearch = () => {
    setRawQuery("");
    setQuery("");
    setPage(1);
  };

  return (
    <div className="w-full px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Demo Users</h1>
          <p className="text-muted-foreground my-1 text-xs">
            Manage temporary demo accounts
          </p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {total !== null ? (
              <>
                <span className="text-foreground font-semibold tabular-nums">
                  {total}
                </span>{" "}
                {statusFilter === "all" ? "total" : statusFilter} demo user
                {total !== 1 ? "s" : ""}
              </>
            ) : (
              "Manage your demo users"
            )}
          </p>
        </div>

        <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          New demo user
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative my-5">
        <Search className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search by SD-code or email…"
          value={rawQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-11 rounded-xl pr-11 pl-11 text-sm"
        />
        {rawQuery && (
          <button
            onClick={clearSearch}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex flex-col gap-4">
        <DemoUsersTable
          query={query}
          page={page}
          pageSize={PAGE_SIZE}
          statusFilter={statusFilter}
          onPageChange={setPage}
          onTotalChange={setTotal}
        />
      </div>

      <CreateDemoUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
