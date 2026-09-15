"use client";

import { useState } from "react";
import { API_BASE, setRole, setTokens } from "@/lib/admin-api";
import { homeForRole } from "@/lib/admin-guard";

export default function AdminLoginPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message || "Login failed");
      setTokens(body.data.access_token, body.data.refresh_token);
      setRole(body.data.user.role);
      window.location.href = homeForRole(body.data.user.role);
    } catch (err: any) {
      setStatus("error");
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm border border-stone-line bg-stone-paper p-8">
        <div className="font-display text-xl text-ink">DHARA</div>
        <p className="mt-1 text-xs text-ink-soft">Staff sign-in</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4 text-sm">
          <input name="email" type="email" required placeholder="Email" className="w-full border border-stone-line px-3 py-2" />
          <input name="password" type="password" required placeholder="Password" className="w-full border border-stone-line px-3 py-2" />
          {status === "error" && <p className="text-xs text-red-700">{error}</p>}
          <button type="submit" disabled={status === "loading"} className="btn-primary w-full justify-center">
            {status === "loading" ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="mt-4 text-xs text-ink-soft">Seeded account: admin@dharact.com / ChangeMe123!</p>
      </div>
    </div>
  );
}
