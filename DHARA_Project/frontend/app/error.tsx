"use client";

import { useEffect } from "react";

// Shown when the API can't be reached or returns an error. We deliberately show an honest message
// instead of stale or sample content.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-content flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow text-brass">Temporarily unavailable</p>
      <h1 className="mt-3 font-display text-3xl text-ink">We couldn&apos;t load this page</h1>
      <p className="mt-4 max-w-md text-sm text-ink-soft">
        Our content service isn&apos;t responding right now. Please try again in a moment.
      </p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <a href="/" className="btn-outline">
          Home
        </a>
      </div>
    </div>
  );
}
