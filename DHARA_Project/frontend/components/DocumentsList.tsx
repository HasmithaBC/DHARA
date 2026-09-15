"use client";

import { useState } from "react";
import { documentDownloadUrl, requestDocument } from "@/lib/api";
import { PropertyDocument } from "@/lib/types";

function GatedRow({ doc }: { doc: PropertyDocument }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "ready" | "error">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await requestDocument(doc.id, {
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
    });
    if (res.ok && res.downloadUrl) {
      setUrl(res.downloadUrl);
      setStatus("ready");
    } else {
      setStatus("error");
      setError(res.error ?? "Request failed. Please try again.");
    }
  }

  return (
    <li className="border border-stone-line px-4 py-3">
      <div className="flex items-center justify-between">
        <span>
          {doc.title} <span className="text-xs text-ink-soft">(request access)</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase text-ink-soft">{doc.type.replace("_", " ")}</span>
          {!open && status !== "ready" && (
            <button type="button" onClick={() => setOpen(true)} className="btn-outline px-3 py-1 text-xs">
              Request Access
            </button>
          )}
        </div>
      </div>

      {open && status !== "ready" && (
        <form onSubmit={onSubmit} className="mt-3 grid gap-2 sm:grid-cols-3">
          <input name="name" required placeholder="Full name" className="border border-stone-line px-2 py-1.5 text-xs" />
          <input name="phone" required placeholder="Phone" className="border border-stone-line px-2 py-1.5 text-xs" />
          <input name="email" required type="email" placeholder="Email" className="border border-stone-line px-2 py-1.5 text-xs" />
          <div className="sm:col-span-3 flex items-center gap-3">
            <button type="submit" disabled={status === "sending"} className="btn-primary px-3 py-1.5 text-xs">
              {status === "sending" ? "Requesting…" : "Get Download Link"}
            </button>
            {status === "error" && <span className="text-xs text-red-700">{error}</span>}
          </div>
        </form>
      )}

      {status === "ready" && url && (
        <p className="mt-3 text-xs text-ink">
          Access granted —{" "}
          <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
            download {doc.title} now
          </a>{" "}
          (link expires in 15 minutes).
        </p>
      )}
    </li>
  );
}

export default function DocumentsList({ documents }: { documents: PropertyDocument[] }) {
  if (!documents || documents.length === 0) return null;
  return (
    <div className="mt-8">
      <h2 className="font-display text-lg text-ink">Downloads</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {documents.map((d) =>
          d.access === "GATED" ? (
            <GatedRow key={d.id} doc={d} />
          ) : (
            <li key={d.id} className="flex items-center justify-between border border-stone-line px-4 py-2">
              <a href={documentDownloadUrl(d.id)} className="underline">
                {d.title}
              </a>
              <span className="text-xs uppercase text-ink-soft">{d.type.replace("_", " ")}</span>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
