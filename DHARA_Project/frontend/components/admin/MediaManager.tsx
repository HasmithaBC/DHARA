"use client";

import { useRef, useState } from "react";
import { adminJSON, uploadMedia } from "@/lib/admin-api";
import { mediaUrl } from "@/lib/media";
import { useToast } from "@/components/Toast";

export interface PropertyImage {
  id: string;
  url: string;
  alt_text: string;
  sort_order: number;
  is_cover: boolean;
}

export interface PropertyDoc {
  id: string;
  type: string;
  title: string;
  file_url?: string;
  access: string;
}

const DOC_TYPES: [string, string][] = [
  ["BROCHURE", "Brochure"],
  ["SURVEY_PLAN", "Survey plan"],
  ["FLOOR_PLAN", "Floor plan"],
  ["APPROVAL", "Approval"],
  ["OTHER", "Other"],
];

const DOC_ACCESS: [string, string][] = [
  ["PUBLIC", "Public — anyone can download"],
  ["GATED", "Gated — visitor must leave details"],
  ["INTERNAL", "Internal — staff only"],
];

export default function MediaManager({
  propertyId,
  propertyTitle,
  images,
  documents,
  onChange,
}: {
  propertyId: string;
  propertyTitle: string;
  images: PropertyImage[];
  documents: PropertyDoc[];
  onChange: () => void;
}) {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [alts, setAlts] = useState<Record<string, string>>({});
  const [doc, setDoc] = useState({ type: "BROCHURE", title: "", access: "PUBLIC", docUrl: "" });
  const [docFile, setDocFile] = useState<File | null>(null);
  const docFileInput = useRef<HTMLInputElement>(null);
  const [docBusy, setDocBusy] = useState(false);

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    let ok = 0;
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setProgress(`Uploading ${i + 1} of ${list.length}: ${file.name}`);
      try {
        const up = await uploadMedia(file, propertyId);
        const n = images.length + ok + 1;
        await adminJSON(`/properties/${propertyId}/images`, {
          method: "POST",
          body: JSON.stringify({ url: up.url, alt_text: `${propertyTitle} – photo ${n}`.slice(0, 200) }),
        });
        ok++;
      } catch (e: any) {
        toast.error(`${file.name}: ${e.message}`);
      }
    }
    setProgress("");
    if (ok > 0) {
      toast.success(ok === 1 ? "Photo added" : `${ok} photos added`);
      onChange();
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  async function addByUrl() {
    const url = urlInput.trim();
    if (!url) return;
    try {
      await adminJSON(`/properties/${propertyId}/images`, {
        method: "POST",
        body: JSON.stringify({ url, alt_text: `${propertyTitle} – photo ${images.length + 1}`.slice(0, 200) }),
      });
      setUrlInput("");
      toast.success("Photo added");
      onChange();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function saveAlt(img: PropertyImage) {
    const alt = (alts[img.id] ?? img.alt_text).trim();
    if (alt === img.alt_text) return;
    try {
      await adminJSON(`/properties/${propertyId}/images/${img.id}`, { method: "PATCH", body: JSON.stringify({ alt_text: alt }) });
      toast.success("Description saved");
      onChange();
    } catch (e: any) {
      toast.error(e.message);
      setAlts((a) => ({ ...a, [img.id]: img.alt_text }));
    }
  }

  async function makeCover(img: PropertyImage) {
    try {
      await adminJSON(`/properties/${propertyId}/images/${img.id}`, { method: "PATCH", body: JSON.stringify({ is_cover: true }) });
      toast.success("Cover photo updated");
      onChange();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function move(img: PropertyImage, dir: -1 | 1) {
    const idx = sorted.findIndex((i) => i.id === img.id);
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const order = sorted.map((i) => i.id);
    [order[idx], order[target]] = [order[target], order[idx]];
    try {
      await adminJSON(`/properties/${propertyId}/images/order`, { method: "PATCH", body: JSON.stringify({ order }) });
      onChange();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function removeImage(img: PropertyImage) {
    if (!confirm("Remove this photo?")) return;
    try {
      await adminJSON(`/properties/${propertyId}/images/${img.id}`, { method: "DELETE" });
      // Keep a cover photo: promote the next image if the cover was removed.
      const rest = sorted.filter((i) => i.id !== img.id);
      if (img.is_cover && rest.length > 0) {
        await adminJSON(`/properties/${propertyId}/images/${rest[0].id}`, { method: "PATCH", body: JSON.stringify({ is_cover: true }) });
      }
      toast.success("Photo removed");
      onChange();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function addDocument() {
    if (!docFile && !doc.docUrl.trim()) {
      toast.error("Choose a file or enter a link first");
      return;
    }
    if (!doc.title.trim()) {
      toast.error("Give the document a title");
      return;
    }
    setDocBusy(true);
    try {
      let finalUrl = doc.docUrl.trim();
      if (docFile) {
        const up = await uploadMedia(docFile, propertyId);
        finalUrl = up.url;
      }
      await adminJSON(`/properties/${propertyId}/documents`, {
        method: "POST",
        body: JSON.stringify({ type: doc.type, title: doc.title.trim(), file_url: finalUrl, access: doc.access, is_watermarked: false }),
      });
      setDoc({ type: "BROCHURE", title: "", access: "PUBLIC", docUrl: "" });
      setDocFile(null);
      if (docFileInput.current) docFileInput.current.value = "";
      toast.success("Document added");
      onChange();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDocBusy(false);
    }
  }

  async function removeDoc(d: PropertyDoc) {
    if (!confirm(`Remove “${d.title}”?`)) return;
    try {
      await adminJSON(`/properties/${propertyId}/documents/${d.id}`, { method: "DELETE" });
      toast.success("Document removed");
      onChange();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6 text-sm">
      <section className="border border-stone-line bg-stone-paper p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-base text-ink">Photos</h2>
          <span className="text-xs text-ink-soft">{images.length} added · 3 needed to publish</span>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
          onClick={() => fileInput.current?.click()}
          className={`mt-3 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-4 py-8 text-center ${dragOver ? "border-brass bg-brass/10" : "border-stone-line bg-white"}`}
        >
          <p className="text-ink">{progress || "Drop photos here or click to choose"}</p>
          <p className="mt-1 text-xs text-ink-soft">JPEG, PNG or WebP · you can select several at once</p>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
        </div>

        <ul className="mt-4 space-y-3">
          {sorted.map((img, i) => (
            <li key={img.id} className="flex gap-3 border border-stone-line bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(img.url)} alt={img.alt_text} className="h-20 w-28 shrink-0 object-cover" />
              <div className="min-w-0 flex-1">
                <input
                  value={alts[img.id] ?? img.alt_text}
                  maxLength={200}
                  onChange={(e) => setAlts((a) => ({ ...a, [img.id]: e.target.value }))}
                  onBlur={() => saveAlt(img)}
                  aria-label="Photo description (alt text)"
                  className="w-full border border-stone-line px-2 py-1 text-xs"
                />
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  {img.is_cover ? (
                    <span className="rounded bg-brass px-1.5 py-0.5 font-semibold text-ink">Cover</span>
                  ) : (
                    <button type="button" onClick={() => makeCover(img)} className="underline">Make cover</button>
                  )}
                  <button type="button" disabled={i === 0} onClick={() => move(img, -1)} className="underline disabled:opacity-30">↑</button>
                  <button type="button" disabled={i === sorted.length - 1} onClick={() => move(img, 1)} className="underline disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => removeImage(img)} className="text-red-700 underline">Remove</button>
                </div>
              </div>
            </li>
          ))}
          {sorted.length === 0 && <li className="py-2 text-center text-xs text-ink-soft">No photos yet.</li>}
        </ul>

        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-ink-soft">Add a photo from a web link instead</summary>
          <div className="mt-2 flex gap-2">
            <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://…" className="w-full border border-stone-line px-2 py-1.5" />
            <button type="button" onClick={addByUrl} className="btn-outline shrink-0">Add</button>
          </div>
        </details>
      </section>

      <section className="border border-stone-line bg-stone-paper p-5">
        <h2 className="font-display text-base text-ink">Documents</h2>
        <p className="mt-1 text-xs text-ink-soft">Brochures, survey plans, floor plans (PDF).</p>
        <ul className="mt-3 divide-y divide-stone-line border border-stone-line bg-white">
          {documents.map((d) => (
            <li key={d.id} className="flex items-start justify-between gap-3 p-2 text-xs">
              <div className="min-w-0 flex-1">
                <details className="group">
                  <summary className="cursor-pointer truncate font-medium text-ink hover:underline">{d.title}</summary>
                  <div className="mt-2 mb-1">
                    {d.file_url ? (
                      <a href={d.file_url.startsWith('http') ? d.file_url : mediaUrl(d.file_url)} target="_blank" rel="noreferrer" className="text-brass underline">
                        View / Download
                      </a>
                    ) : (
                      <span className="text-ink-soft">No link saved</span>
                    )}
                  </div>
                </details>
                <div className="mt-1 text-ink-soft">{DOC_TYPES.find(([v]) => v === d.type)?.[1] ?? d.type} · {d.access.toLowerCase()}</div>
              </div>
              <button type="button" onClick={() => removeDoc(d)} className="shrink-0 text-red-700 underline">Remove</button>
            </li>
          ))}
          {documents.length === 0 && <li className="p-3 text-center text-xs text-ink-soft">No documents.</li>}
        </ul>

        <div className="mt-4 space-y-2">
          <input value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} placeholder="Document title" className="w-full border border-stone-line px-2 py-1.5" />
          <div className="grid grid-cols-2 gap-2">
            <select value={doc.type} onChange={(e) => setDoc({ ...doc, type: e.target.value })} className="border border-stone-line px-2 py-1.5">
              {DOC_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={doc.access} onChange={(e) => setDoc({ ...doc, access: e.target.value })} className="border border-stone-line px-2 py-1.5">
              {DOC_ACCESS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2 border border-stone-line bg-white p-3 text-xs">
            <span className="font-medium text-ink">File or Link</span>
            <div className="flex items-center gap-2">
              <input ref={docFileInput} type="file" accept="application/pdf" onChange={(e) => {
                setDocFile(e.target.files?.[0] ?? null);
              }} disabled={!!doc.docUrl} className="w-full text-xs disabled:opacity-50 disabled:cursor-not-allowed" />
              {docFile && (
                <button type="button" onClick={() => {
                  setDocFile(null);
                  if (docFileInput.current) docFileInput.current.value = "";
                }} className="text-red-700 underline shrink-0">
                  Remove
                </button>
              )}
            </div>
            <div className="text-center text-ink-soft my-1">OR</div>
            <input value={doc.docUrl} onChange={(e) => {
              setDoc({ ...doc, docUrl: e.target.value });
            }} disabled={!!docFile} placeholder="External link (e.g., Google Drive)" className="w-full border border-stone-line px-2 py-1.5 disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed" />
          </div>
          <button type="button" onClick={addDocument} disabled={docBusy} className="btn-outline w-full justify-center disabled:opacity-60">
            {docBusy ? "Uploading…" : "Upload document"}
          </button>
        </div>
      </section>
    </div>
  );
}
