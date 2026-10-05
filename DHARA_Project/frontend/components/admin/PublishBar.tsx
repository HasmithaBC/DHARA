"use client";

import { useState } from "react";
import { adminJSON } from "@/lib/admin-api";
import { useToast } from "@/components/Toast";

export const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-stone-line text-ink",
  PUBLISHED: "bg-green-100 text-green-800",
  RESERVED: "bg-amber-100 text-amber-800",
  SOLD: "bg-blue-100 text-blue-800",
  RENTED: "bg-blue-100 text-blue-800",
  ARCHIVED: "bg-red-100 text-red-800",
};

const CATEGORY_PATH: Record<string, string> = { LAND: "lands", HOUSE: "houses", COMMERCIAL: "commercial" };

export function publicPropertyPath(category: string, slug: string) {
  return `/properties/${CATEGORY_PATH[category] ?? "other"}/${slug}`;
}

export default function PublishBar({
  propertyId,
  status,
  category,
  slug,
  imageCount,
  missingAlt,
  hasCover,
  onChange,
}: {
  propertyId: string;
  status: string;
  category: string;
  slug: string;
  imageCount: number;
  missingAlt: number;
  hasCover: boolean;
  onChange: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const checks = [
    { ok: imageCount >= 3, label: `At least 3 photos (${imageCount} added)` },
    { ok: missingAlt === 0, label: "Every photo has a description" },
    { ok: hasCover, label: "A cover photo is chosen" },
  ];
  const ready = checks.every((c) => c.ok);

  async function setStatus(next: string) {
    setBusy(true);
    try {
      await adminJSON(`/properties/${propertyId}/status`, { method: "POST", body: JSON.stringify({ status: next }) });
      toast.success(next === "PUBLISHED" ? "Published — it is live on the website now." : `Status changed to ${next.toLowerCase()}`);
      onChange();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  const live = status === "PUBLISHED" || status === "RESERVED" || status === "SOLD" || status === "RENTED";

  return (
    <div className="border border-stone-line bg-stone-paper p-5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-soft">Status</span>
          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? ""}`}>{status}</span>
        </div>
        <div className="flex items-center gap-3">
          {live && (
            <a href={publicPropertyPath(category, slug)} target="_blank" rel="noopener noreferrer" className="text-xs underline">
              View on website ↗
            </a>
          )}
          {status === "DRAFT" && (
            <button type="button" disabled={busy || !ready} onClick={() => setStatus("PUBLISHED")} className="btn-primary disabled:opacity-50">
              {busy ? "Publishing…" : "Publish"}
            </button>
          )}
          {status === "PUBLISHED" && (
            <button type="button" disabled={busy} onClick={() => setStatus("DRAFT")} className="btn-outline disabled:opacity-50">
              Unpublish
            </button>
          )}
        </div>
      </div>
      {status === "DRAFT" && (
        <div className="mt-4">
          <p className="text-xs text-ink-soft">
            Drafts are hidden from the website. {ready ? "Everything is ready — you can publish." : "Complete these to publish:"}
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {checks.map((c) => (
              <li key={c.label} className={c.ok ? "text-green-700" : "text-ink-soft"}>
                {c.ok ? "✓" : "○"} {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
