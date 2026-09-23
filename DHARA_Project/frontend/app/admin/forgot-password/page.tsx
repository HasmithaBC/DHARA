"use client";

import Link from "next/link";
import { useState } from "react";
import { API_BASE } from "@/lib/admin-api";

type Status = "idle" | "loading" | "sent" | "error";

export default function ForgotPasswordPage() {
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState("");

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setStatus("loading");
        setError("");
        const form = new FormData(e.currentTarget);
        try {
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.get("email") }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error?.message || "Something went wrong. Please try again.");
            }
            // The backend answers 200 whether or not the email exists, so we show the same
            // message either way — that way nobody can use this page to find valid accounts.
            setStatus("sent");
        } catch (err: unknown) {
            setStatus("error");
            setError(
                err instanceof TypeError
                    ? "Couldn't reach the server. Check your connection and try again."
                    : err instanceof Error
                        ? err.message
                        : "Something went wrong. Please try again."
            );
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-sm border border-stone-line bg-stone-paper p-8">
                <div className="font-display text-xl text-ink">DHARA</div>
                <p className="mt-1 text-xs text-ink-soft">Reset your password</p>

                {status === "sent" ? (
                    <div role="status" className="mt-6 space-y-4 text-sm">
                        <p className="border border-brass bg-brass/10 p-3 text-xs text-ink">
                            If an account exists for that email, we've sent a reset link. It expires in 30 minutes.
                        </p>
                        <Link href="/admin" className="btn-primary w-full justify-center">
                            Back to sign in
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="mt-6 space-y-4 text-sm">
                        <p className="text-xs text-ink-soft">
                            Enter your staff email and we'll send you a link to choose a new password.
                        </p>
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

                        {status === "error" && (
                            <p role="alert" className="border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                                {error}
                            </p>
                        )}

                        <button type="submit" disabled={status === "loading"} className="btn-primary w-full justify-center disabled:opacity-60">
                            {status === "loading" ? "Sending…" : "Send Reset Link"}
                        </button>
                        <p className="text-center text-xs">
                            <Link href="/admin" className="text-ink-soft underline decoration-brass underline-offset-4 hover:text-brass-dark">
                                Back to sign in
                            </Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}