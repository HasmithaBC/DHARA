"use client";

// FR-ADM-001: end the admin session after 60 minutes of inactivity.
// Activity (mouse, keyboard, scroll, touch) is timestamped in localStorage so the
// timer is shared across tabs — using the panel in one tab keeps the others alive.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearTokens } from "@/lib/admin-api";

export const IDLE_TIMEOUT_MINUTES = 60;

const STORAGE_KEY = "dhara_last_activity";
const CHECK_EVERY_MS = 30_000; // how often we check the clock
const WRITE_THROTTLE_MS = 5_000; // don't hit localStorage on every mouse move
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"] as const;

/** Call right after a successful login so a stale timestamp can't sign the user straight out. */
export function markActivity() {
    try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
        /* storage unavailable — the timeout simply won't persist across reloads */
    }
}

function lastActivity(): number {
    try {
        const v = Number(localStorage.getItem(STORAGE_KEY));
        return Number.isFinite(v) && v > 0 ? v : Date.now();
    } catch {
        return Date.now();
    }
}

export function useIdleLogout(enabled = true) {
    const router = useRouter();

    useEffect(() => {
        if (!enabled) return;
        const limitMs = IDLE_TIMEOUT_MINUTES * 60 * 1000;
        let lastWrite = 0;

        const signOut = () => {
            clearTokens();
            try {
                localStorage.removeItem("dhara_role");
                localStorage.removeItem(STORAGE_KEY);
            } catch {
                /* ignore */
            }
            router.replace("/admin?reason=idle");
        };

        const check = () => {
            if (Date.now() - lastActivity() >= limitMs) signOut();
        };

        const onActivity = () => {
            const now = Date.now();
            if (now - lastWrite < WRITE_THROTTLE_MS) return;
            lastWrite = now;
            markActivity();
        };

        // If the tab was left idle past the limit and then reloaded, sign out right away
        // instead of restarting the clock.
        check();
        onActivity();

        ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
        const timer = window.setInterval(check, CHECK_EVERY_MS);
        // Background tabs throttle timers, so also check the moment the tab comes back.
        const onVisible = () => {
            if (document.visibilityState === "visible") check();
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [enabled, router]);
}