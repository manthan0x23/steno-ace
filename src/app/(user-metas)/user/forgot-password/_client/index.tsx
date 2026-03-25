"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { MailCheck, Loader2 } from "lucide-react";
import { authClient } from "~/server/better-auth/client";

export default function ForgotPasswordPage({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/user/reset-password",
      });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
          <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
            <MailCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Check your inbox</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              If <span className="font-medium">{email}</span> is registered,
              you'll receive a reset link shortly.
            </p>
          </div>
          <p className="text-muted-foreground/60 text-xs">
            Didn't get it? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Forgot password</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              required
              readOnly
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Send reset link
          </Button>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          Remember it?{" "}
          <a
            href="/user/login"
            className="text-foreground underline underline-offset-4"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
