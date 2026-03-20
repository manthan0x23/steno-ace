"use client";

// ─── app/user/settings/page.tsx ───────────────────────────────────────────────
//
// Profile: name, phone, gender, avatar (R2 via store.generatePresignedUrl)
// Password: better-auth authClient.changePassword — no custom endpoint needed

import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
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
  Camera,
  Check,
  Loader2,
  Eye,
  EyeOff,
  User,
  Lock,
  AlertCircle,
  Phone,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { authClient } from "~/server/better-auth/client";

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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[220px_1fr]">
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

// ─── save status ──────────────────────────────────────────────────────────────

function SaveStatus({
  state,
  error,
}: {
  state: "idle" | "saving" | "saved" | "error";
  error?: string;
}) {
  if (state === "idle") return null;
  if (state === "saving")
    return (
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    );
  if (state === "saved")
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-500">
        <Check className="h-3.5 w-3.5" />
        Saved
      </span>
    );
  return (
    <span className="text-destructive flex items-center gap-1.5 text-xs">
      <AlertCircle className="h-3.5 w-3.5" />
      {error ?? "Something went wrong"}
    </span>
  );
}

// ─── avatar upload ────────────────────────────────────────────────────────────

function AvatarUpload({
  currentUrl,
  name,
  onUploadComplete,
}: {
  currentUrl: string | null;
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

      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);

      try {
        const ext = file.name.split(".").pop() ?? "jpg";
        const { uploadUrl, key } = await presign.mutateAsync({
          folder: "user-avatars",
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

  const displayUrl = previewUrl ?? currentUrl ?? undefined;

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <Avatar className="h-16 w-16">
          <AvatarImage src={displayUrl} />
          <AvatarFallback className="text-lg font-bold">
            {initials(name || "?")}
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
  const { data: me, isLoading } = trpc.user.me.useQuery();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<string>("none");
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | undefined>();

  // Seed form from me on first load
  useEffect(() => {
    if (!me) return;
    setName(me.name ?? "");
    setPhone(me.phone ?? "");
    setGender(me.gender ?? "none");
    setImageKey(me.image ?? null);
  }, [me?.id]);

  const edit = trpc.user.edit.useMutation({
    onMutate: () => setSaveState("saving"),
    onSuccess: () => {
      setSaveState("saved");
      void utils.user.me.invalidate();
      setTimeout(() => setSaveState("idle"), 3000);
    },
    onError: (e) => {
      setSaveState("error");
      setSaveError(e.message);
    },
  });

  const handleSave = () => {
    if (!me) return;
    const patch: {
      name?: string;
      phone?: string;
      gender?: string;
      image?: string;
    } = {};
    if (name !== (me.name ?? "")) patch.name = name;
    if (phone !== (me.phone ?? "")) patch.phone = phone;
    if (gender !== (me.gender ?? "none"))
      patch.gender = gender === "none" ? "" : gender;
    if (imageKey !== (me.image ?? null)) patch.image = imageKey ?? undefined;
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
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  // profilePicUrl is resolved by the server — use it directly as the display URL
  const profilePicUrl = me.image ? ((me as any).profilePicUrl ?? null) : null;

  return (
    <div className="space-y-4">
      <AvatarUpload
        currentUrl={profilePicUrl}
        name={me.name ?? ""}
        onUploadComplete={(key) => setImageKey(key)}
      />

      <div className="space-y-1.5">
        <label className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          Full name
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
          Email
        </label>
        <Input
          value={me.email}
          disabled
          className="text-muted-foreground text-sm"
        />
        <p className="text-muted-foreground text-xs">
          Email cannot be changed here.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          <span className="flex items-center gap-1.5 mb-1">
            <Phone className="h-3 w-3" />
            Phone
          </span>
        </label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className="text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          Gender
        </label>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Prefer not to say" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
            <SelectItem value="none">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between pt-1">
        <SaveStatus state={saveState} error={saveError} />
        <Button size="sm" onClick={handleSave} disabled={edit.isPending}>
          Save profile
        </Button>
      </div>
    </div>
  );
}

// ─── password section — uses better-auth authClient.changePassword ────────────

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | undefined>();

  const mismatch = confirmPass.length > 0 && newPassword !== confirmPass;
  const tooShort = newPassword.length > 0 && newPassword.length < 8;
  const canSubmit =
    currentPassword && newPassword && confirmPass && !mismatch && !tooShort;

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaveState("saving");
    try {
      // better-auth client method — no custom tRPC endpoint needed
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true, // optional — logs out other devices
      });
      if (error) throw new Error(error.message ?? "Password change failed");
      setSaveState("saved");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPass("");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (e) {
      setSaveState("error");
      setSaveError(
        e instanceof Error ? e.message : "Failed to change password",
      );
    }
  };

  // Strength meter
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

  const strengthMeta = [
    null,
    { label: "Weak", color: "bg-red-500", text: "text-red-500" },
    { label: "Fair", color: "bg-amber-500", text: "text-amber-500" },
    { label: "Good", color: "bg-blue-500", text: "text-blue-500" },
    { label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" },
  ][strength];

  function PwInput({
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
        <PwInput
          value={currentPassword}
          onChange={setCurrentPassword}
          show={showCurrent}
          onToggle={() => setShowCurrent((v) => !v)}
          placeholder="Enter current password"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          New password
        </label>
        <PwInput
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          onToggle={() => setShowNew((v) => !v)}
          placeholder="At least 8 characters"
        />
        {newPassword.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= strength ? strengthMeta?.color : "bg-muted",
                  )}
                />
              ))}
            </div>
            <p
              className={cn(
                "text-[10px] font-semibold tracking-widest uppercase",
                strengthMeta?.text,
              )}
            >
              {strengthMeta?.label}
            </p>
          </div>
        )}
        {tooShort && (
          <p className="text-destructive text-xs">Minimum 8 characters</p>
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
          disabled={!canSubmit || saveState === "saving"}
        >
          {saveState === "saving" ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function UserSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Update your profile and account security.
        </p>
      </div>

      <div className="space-y-10">
        <Section
          icon={User}
          title="Profile"
          description="Your name, contact info, and profile photo."
        >
          <ProfileSection />
        </Section>

        <Separator />

        <Section
          icon={Lock}
          title="Password"
          description="Change your password. Other active sessions will be signed out."
        >
          <PasswordSection />
        </Section>
      </div>
    </div>
  );
}
