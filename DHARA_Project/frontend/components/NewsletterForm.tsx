"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/lib/api";
import { HONEYPOT_FIELD_NAME, getHoneypot } from "@/lib/lead-utils";

export default function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (getHoneypot(form)) {
      setStatus("sent");
      return;
    }
    const email = (form.get("email") as string) || "";
    if (!email.includes("@")) return;
    setStatus("sending");
    setError(null);
    const res = await subscribeNewsletter(email, "");
    if (res.ok) {
      setStatus("sent");
      e.currentTarget.reset();
    } else {
      setStatus("error");
      setError(res.error ?? "Something went wrong.");
    }
  }

  if (status === "sent") {
    return <p className="mt-4 text-xs text-brass">Almost there — check your inbox to confirm your subscription.</p>;
  }

  return (
    <form className="mt-4" onSubmit={onSubmit}>
      <div className="flex">
        <input
          type="email"
          name="email"
          required
          placeholder="Your email"
          className="w-full border border-stone-line bg-transparent px-3 py-2 text-sm placeholder:text-stone-line"
        />
        <button className="btn-brass shrink-0 px-4" type="submit" disabled={status === "sending"}>
          {status === "sending" ? "…" : "Join"}
        </button>
      </div>
      <input
        type="text"
        name={HONEYPOT_FIELD_NAME}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      {status === "error" && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </form>
  );
}
