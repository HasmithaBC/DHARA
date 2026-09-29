"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/admin-api";

type Status = "idle" | "loading" | "error";

const MIN_LENGTH = 8; // matches the backend rule in auth.go

export default function ResetPasswordPage() {
    const [token, setToken] = useState<string | null | undefined>(undefined); // undefined = still reading the URL
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        setToken(new URLSearchParams(window.location.search).get("token"));
    }, []);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        const form = new FormData(e.currentTarget);
        const password = String(form.get("password") || "");
        const confirm = String(form.get("confirm") || "");

        if (password.length < MIN_LENGTH) {
            setStatus("error");
            setError(`Your password needs at least ${MIN_LENGTH} characters.`);
            return;
        }
        if (password !== confirm) {
            setStatus("error");
            setError("The two passwords don't match.");
            return;
        }

        setStatus("loading");
        try {
            const res = await fetch(`${API_BASE}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, new_password: password }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error?.message || "Couldn't reset your password. Please try again.");
            }
            window.location.href = "/admin?reset=1";
        } catch (err: unknown) {
            setStatus("error");
            setError(
                err instanceof TypeError
                    ? "Couldn't reach the server. Check your connection and try again."
                    : err instanceof Error
                        ? err.message
                        : "Couldn't reset your password. Please try again."
            );
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-sm border border-stone-line bg-stone-paper p-8">
                <div className="font-display text-xl text-ink">DHARA</div>
                <p className="mt-1 text-xs text-ink-soft">Choose a new password</p>

                {token === undefined ? null : !token ? (
                    <div className="mt-6 space-y-4 text-sm">
                        <p role="alert" className="border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                            This reset link is missing its token. Please request a new one.
                        </p>
                        <Link href="/admin/forgot-password" className="btn-primary w-full justify-center">
                            Request a new link
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="mt-6 space-y-4 text-sm">
                        <div>
                            <label htmlFor="password" className="mb-1 block text-xs font-semibold text-ink-soft">
                                New password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={MIN_LENGTH}
                                    autoComplete="new-password"
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
                            <p className="mt-1 text-xs text-ink-soft">At least {MIN_LENGTH} characters.</p>
                        </div>

                        <div>
                            <label htmlFor="confirm" className="mb-1 block text-xs font-semibold text-ink-soft">
                                Confirm new password
                            </label>
                            <input
                                id="confirm"
                                name="confirm"
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={MIN_LENGTH}
                                autoComplete="new-password"
                                className="w-full border border-stone-line px-3 py-2"
                            />
                        </div>

                        {status === "error" && (
                            <div role="alert" className="space-y-2 border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                                <p>{error}</p>
                                {/(invalid|expired)/i.test(error) && (
                                    <Link href="/admin/forgot-password" className="underline">
                                        Request a new link
                                    </Link>
                                )}
                            </div>
                        )}

                        <button type="submit" disabled={status === "loading"} className="btn-primary w-full justify-center disabled:opacity-60">
                            {status === "loading" ? "Saving…" : "Update Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}