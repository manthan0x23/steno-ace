"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "~/server/better-auth/client";

type AuthMode = "signin" | "signup";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.refresh();
      }}
      className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
    >
      Sign out
    </button>
  );
}

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setMessage(null);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name: name || "",
        });
        if (error) {
          setMessage({ type: "error", text: error.message ?? "Sign up failed" });
          return;
        }
        setMessage({ type: "success", text: "Account created. You can sign in now." });
        setMode("signin");
      } else {
        const { error } = await authClient.signIn.email({
          email,
          password,
        });
        if (error) {
          setMessage({ type: "error", text: error.message ?? "Invalid email or password" });
          return;
        }
        setMessage({ type: "success", text: "Signed in successfully." });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
      >
        Sign in with Google
      </button>

      <div className="w-full max-w-xs border-t border-white/20 pt-4">
        <p className="mb-2 text-center text-sm text-white/80">Or with email</p>
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/50"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/50"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/50"
          />
          {message && (
            <p
              className={`text-sm ${message.type === "error" ? "text-red-300" : "text-green-300"}`}
            >
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-white/10 px-6 py-2 font-semibold transition hover:bg-white/20 disabled:opacity-50"
          >
            {loading ? "..." : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage(null);
          }}
          className="mt-2 w-full text-center text-sm text-white/70 hover:text-white"
        >
          {mode === "signin" ? "Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
