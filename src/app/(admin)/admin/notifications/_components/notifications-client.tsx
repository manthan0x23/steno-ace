"use client";

// ─── app/admin/notifications/page.tsx ────────────────────────────────────────

import { useState, useMemo } from "react";
import { trpc } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Send,
  Globe,
  User,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { _nullable } from "better-auth";

// ─── types ────────────────────────────────────────────────────────────────────

type Notification = {
  id: string;
  title: string;
  message: string;
  to: string;
  seenBy: string[] | null;
  link: string | null;
  isLinkExternal: boolean | null;
  createdAt: Date;
  userEmail: string | null;
};

type DialogMode = "create" | "edit" | "view" | "delete" | "deleteMany" | null;

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

// ─── helpers ──────────────────────────────────────────────────────────────────

function RecipientBadge({
  to,
  userEmail,
}: {
  to: string;
  userEmail: string | null;
}) {
  const isEveryone = to === "everyone";
  return (
    <Badge
      variant="outline"
      className={`gap-1 font-mono text-[10px] ${
        isEveryone
          ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
          : "border-blue-500/30 bg-blue-500/10 text-blue-400"
      }`}
    >
      {isEveryone ? (
        <Globe className="h-2.5 w-2.5" />
      ) : (
        <User className="h-2.5 w-2.5" />
      )}
      {isEveryone ? "Everyone" : userEmail}
    </Badge>
  );
}

// ─── send / edit form ─────────────────────────────────────────────────────────

type FormState = {
  title: string;
  message: string;
  to: string;
  toType: "everyone" | "user";
  link: string;
  isLinkExternal: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  message: "",
  to: "",
  toType: "everyone",
  link: "",
  isLinkExternal: false,
};

function notifToForm(n: Notification): FormState {
  return {
    title: n.title,
    message: n.message,
    to: n.to === "everyone" ? "" : n.to,
    toType: n.to === "everyone" ? "everyone" : "user",
    link: n.link ?? "",
    isLinkExternal: n.isLinkExternal ?? false,
  };
}

function NotificationForm({
  form,
  onChange,
  disabled,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
  disabled?: boolean;
}) {
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    onChange({ ...form, [k]: v });

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input
          placeholder="Notification title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          disabled={disabled}
          maxLength={120}
        />
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <Label>Message</Label>
        <Textarea
          placeholder="Notification message"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          disabled={disabled}
          maxLength={1000}
          rows={3}
          className="resize-none"
        />
        <p className="text-muted-foreground text-right text-xs">
          {form.message.length}/1000
        </p>
      </div>

      {/* Recipient */}
      <div className="space-y-1.5">
        <Label>Recipient</Label>
        <div className="flex gap-2">
          <Select
            value={form.toType}
            onValueChange={(v: "everyone" | "user") => set("toType", v)}
            disabled={disabled}
          >
            <SelectTrigger className="w-36 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-violet-400" /> Everyone
                </span>
              </SelectItem>
              <SelectItem value="user">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-400" /> Specific user
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          {form.toType === "user" && (
            <Input
              placeholder="User ID"
              value={form.to}
              onChange={(e) => set("to", e.target.value)}
              disabled={disabled}
              className="font-mono text-sm"
            />
          )}
        </div>
      </div>

      {/* Link */}
      <div className="space-y-1.5">
        <Label>
          Link{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          placeholder="https://..."
          value={form.link}
          onChange={(e) => set("link", e.target.value)}
          disabled={disabled}
          type="url"
        />
      </div>

      {/* External toggle */}
      {form.link && (
        <div className="flex items-center gap-2">
          <Switch
            id="ext"
            checked={form.isLinkExternal}
            onCheckedChange={(v) => set("isLinkExternal", v)}
            disabled={disabled}
          />
          <Label htmlFor="ext" className="cursor-pointer font-normal">
            Open in new tab
          </Label>
        </div>
      )}
    </div>
  );
}

// ─── view dialog ──────────────────────────────────────────────────────────────

function ViewDialog({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Notification details
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              Title
            </p>
            <p className="text-sm font-medium">{notification.title}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              Message
            </p>
            <p className="text-sm leading-relaxed">{notification.message}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              Recipient
            </p>
            <RecipientBadge
              to={notification.to}
              userEmail={notification.userEmail ?? null}
            />
          </div>
          {notification.link && (
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                Link
              </p>
              <a
                href={notification.link}
                target={notification.isLinkExternal ? "_blank" : "_self"}
                rel="noreferrer"
                className="flex items-center gap-1 text-sm text-blue-400 underline-offset-4 hover:underline"
              >
                <LinkIcon className="h-3 w-3" />
                {notification.link}
              </a>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                Seen by
              </p>
              <p className="text-sm font-semibold">
                {notification.seenBy?.length ?? 0} user
                {(notification.seenBy?.length ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                Created
              </p>
              <p className="text-sm">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── delete confirm ───────────────────────────────────────────────────────────

function DeleteDialog({
  ids,
  onConfirm,
  onClose,
  loading,
}: {
  ids: string[];
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  const isBulk = ids.length > 1;
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            {isBulk
              ? `Delete ${ids.length} notifications?`
              : "Delete notification?"}
          </DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  // ── pagination / filter state ──────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ── selection ──────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── dialog state ───────────────────────────────────────────────────────────
  const [mode, setMode] = useState<DialogMode>(null);
  const [activeNotif, setActiveNotif] = useState<Notification | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // ── data ───────────────────────────────────────────────────────────────────
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.notification.listAll.useQuery({
    page,
    pageSize,
  });

  // Client-side search filter (swap for server-side if dataset grows large)
  const filtered = useMemo(() => {
    if (!data?.data) return [];
    if (!debouncedSearch) return data.data;
    const q = debouncedSearch.toLowerCase();
    return data.data.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.to.toLowerCase().includes(q),
    );
  }, [data, debouncedSearch]);

  // Debounce search
  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 300);
  };

  const invalidate = () => utils.notification.listAll.invalidate();

  // ── mutations ──────────────────────────────────────────────────────────────

  const send = trpc.notification.send.useMutation({
    onSuccess: () => {
      toast.success("Notification sent");
      setMode(null);
      setForm(EMPTY_FORM);
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.notification.update.useMutation({
    onSuccess: () => {
      toast.success("Notification updated");
      setMode(null);
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.notification.delete.useMutation({
    onSuccess: () => {
      toast.success("Deleted");
      setMode(null);
      setSelected(new Set());
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const delMany = trpc.notification.deleteMany.useMutation({
    onSuccess: () => {
      toast.success(`Deleted ${selected.size} notifications`);
      setMode(null);
      setSelected(new Set());
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // ── handlers ───────────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setActiveNotif(null);
    setMode("create");
  };

  const openEdit = (n: Notification) => {
    setActiveNotif(n);
    setForm(notifToForm(n));
    setMode("edit");
  };

  const openView = (n: Notification) => {
    setActiveNotif(n);
    setMode("view");
  };

  const openDelete = (n: Notification) => {
    setActiveNotif(n);
    setMode("delete");
  };

  const openDeleteMany = () => setMode("deleteMany");

  const handleSubmit = () => {
    const to = form.toType === "everyone" ? "everyone" : form.to.trim();
    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      to,
      link: form.link.trim() || undefined,
      isLinkExternal: form.link.trim() ? form.isLinkExternal : undefined,
    };

    if (mode === "create") {
      send.mutate(payload);
    } else if (mode === "edit" && activeNotif) {
      update.mutate({
        id: activeNotif.id,
        title: payload.title,
        message: payload.message,
        link: payload.link ?? null,
        isLinkExternal: payload.isLinkExternal,
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((n) => n.id)));
    }
  };

  const isMutating = send.isPending || update.isPending;
  const isDeleting = del.isPending || delMany.isPending;
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const visiblePages = () => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: 5 }, (_, i) => start + i);
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-5 px-6 py-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Notifications
            </h1>
            <p className="text-muted-foreground text-sm">
              {meta ? `${meta.total} total` : "Manage system notifications"}
            </p>
          </div>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Send notification
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            placeholder="Search title, message, recipient…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>
        {selected.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={openDeleteMany}
            className="shrink-0 gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete {selected.size}
          </Button>
        )}
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-muted-foreground text-xs">Rows</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v) as PageSize);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-16 text-xs">
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border">
        {/* Head */}
        <div className="bg-muted/40 grid grid-cols-[32px_1fr_200px_80px_120px_44px] items-center gap-3 border-b px-4 py-2">
          <Checkbox
            checked={filtered.length > 0 && selected.size === filtered.length}
            onCheckedChange={toggleAll}
            aria-label="Select all"
          />
          {["Title & Message", "Recipient", "Seen by", "Sent", ""].map(
            (h, i) => (
              <span
                key={i}
                className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase"
              >
                {h}
              </span>
            ),
          )}
        </div>

        {/* Body */}
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[32px_1fr_200px_80px_120px_44px] items-center gap-3 border-b px-4 py-3 last:border-0"
            >
              <Skeleton className="h-4 w-4 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-3.5 w-8" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-muted-foreground text-sm">
              {debouncedSearch
                ? "No notifications match your search"
                : "No notifications yet"}
            </p>
          </div>
        ) : (
          filtered.map((n, idx) => (
            <div
              key={n.id}
              className={[
                "group hover:bg-muted/40 grid grid-cols-[32px_1fr_200px_80px_120px_44px] items-center gap-3 px-4 py-3 transition-colors",
                idx !== filtered.length - 1 ? "border-b" : "",
                selected.has(n.id) ? "bg-primary/5" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {/* Checkbox */}
              <Checkbox
                checked={selected.has(n.id)}
                onCheckedChange={() => toggleSelect(n.id)}
                aria-label="Select row"
              />

              {/* Title + message */}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{n.title}</p>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  {n.message}
                </p>
              </div>

              {/* Recipient */}
              <RecipientBadge to={n.to} userEmail={n.userEmail} />

              {/* Seen by count */}
              <p className="text-muted-foreground text-sm tabular-nums">
                {n.seenBy?.length ?? 0}
              </p>

              {/* Created at */}
              <p className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(n.createdAt), {
                  addSuffix: true,
                })}
              </p>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => openView(n ?? undefined)}>
                    <Eye className="mr-2 h-3.5 w-3.5" /> View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEdit(n ?? undefined)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => openDelete(n ?? undefined)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-muted-foreground text-xs tabular-nums">
            {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, meta?.total ?? 0)} of {meta?.total ?? 0}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {visiblePages().map((pg) => (
              <Button
                key={pg}
                variant={pg === page ? "default" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                onClick={() => setPage(pg)}
              >
                {pg}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Create / Edit dialog ─────────────────────────────────────────── */}
      {(mode === "create" || mode === "edit") && (
        <Dialog open onOpenChange={() => setMode(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {mode === "create" ? (
                  <>Send notification</>
                ) : (
                  <>Edit notification</>
                )}
              </DialogTitle>
            </DialogHeader>

            <NotificationForm
              form={form}
              onChange={setForm}
              disabled={isMutating}
            />

            <DialogFooter className="gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setMode(null)}
                disabled={isMutating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  isMutating ||
                  !form.title.trim() ||
                  !form.message.trim() ||
                  (form.toType === "user" && !form.to.trim())
                }
              >
                {isMutating && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                {mode === "create" ? "Send" : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── View dialog ──────────────────────────────────────────────────── */}
      {mode === "view" && activeNotif && (
        <ViewDialog notification={activeNotif} onClose={() => setMode(null)} />
      )}

      {/* ── Delete single ────────────────────────────────────────────────── */}
      {mode === "delete" && activeNotif && (
        <DeleteDialog
          ids={[activeNotif.id]}
          loading={isDeleting}
          onClose={() => setMode(null)}
          onConfirm={() => del.mutate({ id: activeNotif.id })}
        />
      )}

      {/* ── Delete many ──────────────────────────────────────────────────── */}
      {mode === "deleteMany" && (
        <DeleteDialog
          ids={Array.from(selected)}
          loading={isDeleting}
          onClose={() => setMode(null)}
          onConfirm={() => delMany.mutate({ ids: Array.from(selected) })}
        />
      )}
    </div>
  );
}
