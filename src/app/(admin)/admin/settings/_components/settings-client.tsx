"use client";

// ─── app/admin/settings/page.tsx ─────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Camera,
  Check,
  Loader2,
  Eye,
  EyeOff,
  User,
  Lock,
  AlertCircle,
} from "lucide-react";
import { cn } from "~/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[240px_1fr]">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="text-muted-foreground h-4 w-4" />
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
          {description}
        </p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ─── status feedback ──────────────────────────────────────────────────────────

function SaveStatus({
  state,
}: {
  state: "idle" | "saving" | "saved" | "error";
  error?: string;
}) {
  if (state === "idle") return null;
  if (state === "saving")
    return (
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
      </div>
    );
  if (state === "saved")
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-500">
        <Check className="h-3.5 w-3.5" /> Saved
      </div>
    );
  return (
    <div className="text-destructive flex items-center gap-1.5 text-xs">
      <AlertCircle className="h-3.5 w-3.5" /> {"Something went wrong"}
    </div>
  );
}

// ─── avatar upload ────────────────────────────────────────────────────────────

function AvatarUpload({
  currentUrl,
  name,
  onUploadComplete,
}: {
  currentUrl: string | null; // already-resolved public URL from me.profilePicUrl
  name: string;
  onUploadComplete: (key: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const presign = trpc.store.generatePresignedUrl.useMutation();

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Image must be under 5MB");
        return;
      }

      setUploadError(null);
      setUploading(true);

      // Optimistic preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);

      try {
        const ext = file.name.split(".").pop() ?? "jpg";
        const { uploadUrl, key } = await presign.mutateAsync({
          folder: "admin-avatars",
          contentType: file.type,
          ext,
        });

        const res = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!res.ok) throw new Error("Upload failed");

        onUploadComplete(key);
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed");
        setPreviewUrl(null);
      } finally {
        setUploading(false);
      }
    },
    [presign, onUploadComplete],
  );

  // Prefer local preview, then fall back to the resolved URL from server
  const displayUrl = previewUrl ?? currentUrl ?? undefined;

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <Avatar className="h-16 w-16">
          <AvatarImage src={displayUrl} />
          <AvatarFallback className="text-lg font-bold">
            {initials(name)}
          </AvatarFallback>
        </Avatar>

        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity",
            "hover:opacity-100 focus-visible:opacity-100",
            uploading && "cursor-wait opacity-100",
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
      </div>

      <div className="space-y-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "Change photo"}
        </Button>
        <p className="text-muted-foreground text-xs">
          JPG, PNG or WebP · max 5MB
        </p>
        {uploadError && (
          <p className="text-destructive flex items-center gap-1 text-xs">
            <AlertCircle className="h-3 w-3" />
            {uploadError}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── profile section ──────────────────────────────────────────────────────────

function ProfileSection() {
  const utils = trpc.useUtils();
  const { data: me, isLoading } = trpc.admin.auth.me.useQuery();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | undefined>();

  // Seed form fields once me loads (or re-seed if it changes after save)
  useEffect(() => {
    if (!me) return;
    setName(me.name);
    setUsername(me.username);
    setImageKey(me.image ?? null);
  }, [me?.id]); // only re-seed when the identity changes, not on every refetch

  const { data: availability } = trpc.admin.checkUsernameAvailability.useQuery(
    { username },
    {
      enabled: username.length >= 3 && username !== me?.username,
      staleTime: 5_000,
    },
  );

  const usernameConflict =
    username !== me?.username && availability?.available === false;

  const edit = trpc.admin.edit.useMutation({
    onMutate: () => setSaveState("saving"),
    onSuccess: () => {
      setSaveState("saved");
      void utils.admin.auth.me.invalidate();
      setTimeout(() => setSaveState("idle"), 3000);
    },
    onError: (e) => {
      setSaveState("error");
      setSaveError(e.message);
    },
  });

  const handleSaveProfile = () => {
    if (!me || usernameConflict) return;
    const patch: { name?: string; username?: string; image?: string } = {};
    if (name !== me.name) patch.name = name;
    if (username !== me.username) patch.username = username;
    if (imageKey !== me.image) patch.image = imageKey ?? undefined;
    if (!Object.keys(patch).length) return;
    edit.mutate(patch);
  };

  if (isLoading || !me) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-5">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pass the already-resolved profilePicUrl — no extra query needed */}
      <AvatarUpload
        currentUrl={me.profilePicUrl ?? null}
        name={me.name}
        onUploadComplete={(key) => setImageKey(key)}
      />

      <div className="space-y-1.5">
        <label className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          Display name
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          Username
        </label>
        <div className="relative">
          <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
            @
          </span>
          <Input
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
            }
            placeholder="username"
            className={cn(
              "pl-7 text-sm",
              usernameConflict &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
        </div>
        {usernameConflict && (
          <p className="text-destructive flex items-center gap-1 text-xs">
            <AlertCircle className="h-3 w-3" />
            Username already taken
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <SaveStatus state={saveState} error={saveError} />
        <Button
          size="sm"
          onClick={handleSaveProfile}
          disabled={edit.isPending || usernameConflict}
        >
          Save profile
        </Button>
      </div>
    </div>
  );
}

// ─── password section ─────────────────────────────────────────────────────────

function PasswordSection() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | undefined>();

  const mismatch = confirmPass.length > 0 && newPassword !== confirmPass;
  const tooShort = newPassword.length > 0 && newPassword.length < 6;
  const canSubmit =
    oldPassword && newPassword && confirmPass && !mismatch && !tooShort;

  const edit = trpc.admin.edit.useMutation({
    onMutate: () => setSaveState("saving"),
    onSuccess: () => {
      setSaveState("saved");
      setOldPassword("");
      setNewPassword("");
      setConfirmPass("");
      setTimeout(() => setSaveState("idle"), 3000);
    },
    onError: (e) => {
      setSaveState("error");
      setSaveError(e.message);
    },
  });

  const handleSave = () => {
    if (!canSubmit) return;
    edit.mutate({ oldPassword, newPassword });
  };

  // Password strength
  const strength =
    newPassword.length === 0
      ? 0
      : newPassword.length < 6
        ? 1
        : newPassword.length < 10
          ? 2
          : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)
            ? 4
            : 3;

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = [
    "",
    "bg-red-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-emerald-500",
  ][strength];

  function PasswordInput({
    value,
    onChange,
    show,
    onToggle,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggle: () => void;
    placeholder: string;
  }) {
    return (
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-9 text-sm"
        />
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          Current password
        </label>
        <PasswordInput
          value={oldPassword}
          onChange={setOldPassword}
          show={showOld}
          onToggle={() => setShowOld((v) => !v)}
          placeholder="Enter current password"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          New password
        </label>
        <PasswordInput
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          onToggle={() => setShowNew((v) => !v)}
          placeholder="At least 6 characters"
        />
        {/* Strength bar */}
        {newPassword.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= strength ? strengthColor : "bg-muted",
                  )}
                />
              ))}
            </div>
            <p
              className={cn(
                "text-[10px] font-semibold tracking-widest uppercase",
                {
                  "text-red-500": strength === 1,
                  "text-amber-500": strength === 2,
                  "text-blue-500": strength === 3,
                  "text-emerald-500": strength === 4,
                },
              )}
            >
              {strengthLabel}
            </p>
          </div>
        )}
        {tooShort && (
          <p className="text-destructive text-xs">Minimum 6 characters</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          Confirm new password
        </label>
        <Input
          type={showNew ? "text" : "password"}
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          placeholder="Repeat new password"
          className={cn(
            "text-sm",
            mismatch && "border-destructive focus-visible:ring-destructive",
          )}
        />
        {mismatch && (
          <p className="text-destructive text-xs">Passwords don't match</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <SaveStatus state={saveState} error={saveError} />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!canSubmit || edit.isPending}
        >
          Update password
        </Button>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Manage your account details and security.
        </p>
      </div>

      <div className="space-y-10">
        <Section
          icon={User}
          title="Profile"
          description="Your display name, username, and profile photo visible across the admin panel."
        >
          <ProfileSection />
        </Section>

        <Separator />

        <Section
          icon={Lock}
          title="Password"
          description="Use a strong password you don't use elsewhere."
        >
          <PasswordSection />
        </Section>
      </div>
    </div>
  );
}
