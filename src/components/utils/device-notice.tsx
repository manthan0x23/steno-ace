"use client";

import { Monitor, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "~/lib/utils";

export function DeviceNotice({
  variant,
  className,
}: {
  variant: "register" | "login";
  className?: string;
}) {
  const isRegister = variant === "register";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border px-4 py-3.5",
        isRegister
          ? "border-amber-500/25 bg-amber-500/5"
          : "border-sky-500/25 bg-sky-500/5",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-4 -right-4 h-16 w-16 rounded-full opacity-40 blur-2xl",
          isRegister ? "bg-amber-400" : "bg-sky-400",
        )}
      />

      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            isRegister
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              : "bg-sky-500/15 text-sky-600 dark:text-sky-400",
          )}
        >
          {isRegister ? (
            <Monitor className="h-3.5 w-3.5" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" />
          )}
        </div>

        {/* Text */}
        <div className="min-w-0 space-y-0.5">
          <p
            className={cn(
              "text-xs leading-snug font-semibold",
              isRegister
                ? "text-amber-700 dark:text-amber-300"
                : "text-sky-700 dark:text-sky-300",
            )}
          >
            {isRegister
              ? "This device will be your primary device"
              : "Device-locked account"}
          </p>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            {isRegister ? (
              <>
                Your account is{" "}
                <span className="text-foreground font-medium">
                  bound to this browser
                </span>
                . Signing in from a different device will be blocked. Contact
                support if you ever need to switch.
              </>
            ) : (
              <>
                Only the{" "}
                <span className="text-foreground font-medium">
                  device you registered with
                </span>{" "}
                can access this account. If you're on a new device, contact
                support to reset it.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
