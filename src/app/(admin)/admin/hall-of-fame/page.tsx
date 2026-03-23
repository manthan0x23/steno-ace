"use client";

import { useState, useRef } from "react";
import { trpc } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Trophy,
  Search,
  X,
  Upload,
  Loader2,
} from "lucide-react";

type Entry = {
  id: string;
  name: string;
  photoUrl: string | null;
  photoKey: string | null;
  department: string;
  batch: string | null;
  note: string | null;
  createdAt: Date;
};

type FormState = {
  name: string;
  department: string;
  batch: string;
  note: string;
  photoKey: string | null;
  photoFileName: string;
};

const EMPTY: FormState = {
  name: "",
  department: "",
  batch: "",
  note: "",
  photoKey: null,
  photoFileName: "",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function EntryForm({
  initial = EMPTY,
  onSave,
  onCancel,
  loading,
  title,
}: {
  initial?: FormState;
  onSave: (f: FormState) => void;
  onCancel: () => void;
  loading: boolean;
  title: string;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const presign = trpc.store.generatePresignedUrl.useMutation();

  const set = (k: keyof FormState, v: string | null) =>
    setForm((p) => ({ ...p, [k]: v ?? "" }));

  const handlePhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const { uploadUrl, key } = await presign.mutateAsync({
        folder: "hof-photos",
        contentType: file.type,
        ext,
      });
      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) throw new Error();
      setForm((p) => ({ ...p, photoKey: key, photoFileName: file.name }));
      toast.success("Photo uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Photo */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={form.photoKey ? undefined : undefined} />
          <AvatarFallback className="text-base font-bold">
            {form.name ? initials(form.name) : "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handlePhoto(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-3.5 w-3.5" />
                {form.photoFileName || "Upload photo"}
              </>
            )}
          </Button>
          {form.photoKey && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground ml-2"
              onClick={() =>
                setForm((p) => ({ ...p, photoKey: null, photoFileName: "" }))
              }
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          <p className="text-muted-foreground mt-1 text-xs">
            Optional · JPG, PNG, WebP
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input
            placeholder="e.g. Priya Sharma"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Department *</Label>
          <Input
            placeholder="e.g. Punjab Police"
            value={form.department}
            onChange={(e) => set("department", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>
            Batch <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            placeholder="e.g. 2024"
            value={form.batch}
            onChange={(e) => set("batch", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>
          Note{" "}
          <span className="text-muted-foreground">
            (optional, max 200 chars)
          </span>
        </Label>
        <Textarea
          placeholder="e.g. Secured 1st rank in district selection"
          rows={2}
          maxLength={200}
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          className="resize-none"
        />
        <p className="text-muted-foreground text-right text-xs tabular-nums">
          {form.note.length}/200
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={() => onSave(form)}
          disabled={loading || !form.name.trim() || !form.department.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function AdminHallOfFamePage() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<Entry | null>(null);

  const { data, isLoading } = trpc.hof.list.useQuery(
    { search: search || undefined, limit: 100 },
    { staleTime: 30_000 },
  );

  const entries = (data?.data ?? []) as Entry[];

  const createMut = trpc.hof.create.useMutation({
    onSuccess: () => {
      void utils.hof.list.invalidate();
      setAddOpen(false);
      toast.success("Entry added");
    },
    onError: () => toast.error("Failed to add"),
  });
  const updateMut = trpc.hof.update.useMutation({
    onSuccess: () => {
      void utils.hof.list.invalidate();
      setEditEntry(null);
      toast.success("Entry updated");
    },
    onError: () => toast.error("Failed to update"),
  });
  const deleteMut = trpc.hof.delete.useMutation({
    onSuccess: () => {
      void utils.hof.list.invalidate();
      setDeleteEntry(null);
      toast.success("Entry deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  return (
    <div className="w-full space-y-6 px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Hall of Fame</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Manage student achievements
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
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

      {/* Count */}
      {!isLoading && (
        <p className="text-muted-foreground text-xs tabular-nums">
          {entries.length} entries
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
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
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center">
          <Trophy className="text-muted-foreground/30 mb-3 h-8 w-8" />
          <p className="text-muted-foreground text-sm font-medium">
            No entries yet
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add first entry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {entries.map((e) => (
            <div
              key={e.id}
              className="bg-card group relative flex flex-col items-center gap-3 rounded-2xl border px-5 py-6 text-center transition-all hover:shadow-md"
            >
              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditEntry(e)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 h-7 w-7"
                  onClick={() => setDeleteEntry(e)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <Avatar className="ring-primary/20 ring-offset-card h-16 w-16 ring-2 ring-offset-2">
                <AvatarImage src={e.photoUrl ?? undefined} alt={e.name} />
                <AvatarFallback className="text-base font-bold">
                  {initials(e.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-sm leading-tight font-bold">{e.name}</p>
                {e.batch && (
                  <p className="text-muted-foreground text-xs">
                    Batch {e.batch}
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="text-xs">
                {e.department}
              </Badge>
              {e.note && (
                <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                  {e.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add to Hall of Fame</DialogTitle>
          </DialogHeader>
          <EntryForm
            onSave={(f) =>
              createMut.mutate({
                name: f.name,
                department: f.department,
                photoKey: f.photoKey ?? undefined,
                batch: f.batch || undefined,
                note: f.note || undefined,
              })
            }
            onCancel={() => setAddOpen(false)}
            loading={createMut.isPending}
            title="Add Entry"
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editEntry}
        onOpenChange={(o) => {
          if (!o) setEditEntry(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
          </DialogHeader>
          {editEntry && (
            <EntryForm
              initial={{
                name: editEntry.name,
                department: editEntry.department,
                batch: editEntry.batch ?? "",
                note: editEntry.note ?? "",
                photoKey: editEntry.photoKey,
                photoFileName: "",
              }}
              onSave={(f) =>
                updateMut.mutate({
                  id: editEntry.id,
                  name: f.name,
                  department: f.department,
                  photoKey: f.photoKey,
                  batch: f.batch || null,
                  note: f.note || null,
                })
              }
              onCancel={() => setEditEntry(null)}
              loading={updateMut.isPending}
              title="Edit Entry"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteEntry}
        onOpenChange={(o) => {
          if (!o) setDeleteEntry(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Hall of Fame?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteEntry?.name}</strong>{" "}
              from the Hall of Fame.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteEntry && deleteMut.mutate({ id: deleteEntry.id })
              }
            >
              {deleteMut.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
