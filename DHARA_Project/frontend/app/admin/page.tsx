"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE, setRole, setTokens } from "@/lib/admin-api";
import { homeForRole } from "@/lib/admin-guard";
import { markActivity } from "@/lib/use-idle-logout";

type Status = "idle" | "loading" | "error" | "locked";

export default function AdminLoginPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Friendly banners when we were sent here by the idle timeout or a password reset.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") === "idle") {
      setNotice("You were signed out after 60 minutes of inactivity. Please sign in again.");
    } else if (params.get("reset") === "1") {
      setNotice("Your password has been updated. Please sign in with the new one.");
    }
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    setNotice("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Backend returns 423 ACCOUNT_LOCKED after 5 failed attempts in 15 minutes.
        if (res.status === 423 || body?.error?.code === "ACCOUNT_LOCKED") {
          setStatus("locked");
          setError(
            "Too many failed attempts, so this account is locked for 30 minutes. " +
            "You can wait, ask an administrator, or reset your password to unlock it."
          );
          return;
        }
        throw new Error(body?.error?.message || "Login failed");
      }

      setTokens(body.data.access_token, body.data.refresh_token);
      setRole(body.data.user.role);
      markActivity(); // start the 60-minute idle clock fresh
      window.location.href = homeForRole(body.data.user.role);
    } catch (err: unknown) {
      setStatus("error");
      setError(
        err instanceof TypeError
          ? "Couldn't reach the server. Check your connection and try again."
          : err instanceof Error
            ? err.message
            : "Login failed"
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm border border-stone-line bg-stone-paper p-8">
        <div className="font-display text-xl text-ink">DHARA</div>
        <p className="mt-1 text-xs text-ink-soft">Staff sign-in</p>

        {notice && (
          <p role="status" className="mt-5 border border-brass bg-brass/10 p-3 text-xs text-ink">
            {notice}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4 text-sm">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-semibold text-ink-soft">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full border border-stone-line px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-semibold text-ink-soft">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="w-full border border-stone-line px-3 py-2 pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 px-3 text-xs text-ink-soft hover:text-ink"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {(status === "error" || status === "locked") && (
            <p
              role="alert"
              className={`border p-3 text-xs ${status === "locked" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800"
                }`}
            >
              {error}
            </p>
          )}

          <button type="submit" disabled={status === "loading"} className="btn-primary w-full justify-center disabled:opacity-60">
            {status === "loading" ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs">
          <Link href="/admin/forgot-password" className="text-ink-soft underline decoration-brass underline-offset-4 hover:text-brass-dark">
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
}