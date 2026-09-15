"use client";

import { useEffect, useState } from "react";
import { adminJSON } from "@/lib/admin-api";

interface Img { id: string; url: string; alt_text: string; is_cover: boolean; }
interface Doc { id: string; type: string; title: string; access: string; }

export default function MediaManager({ propertyId }: { propertyId: string }) {
  const [images, setImages] = useState<Img[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docType, setDocType] = useState("BROCHURE");
  const [docAccess, setDocAccess] = useState("PUBLIC");
  const [error, setError] = useState("");

  async function reload() {
    try {
      const p = await adminJSON<any>(`/properties/${propertyId}`);
      setImages(p.images || []);
      setDocs(p.documents || []);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { reload(); }, [propertyId]);

  async function addImage(e: React.FormEvent) {
    e.preventDefault();
    if (!url || !alt) return;
    await adminJSON(`/properties/${propertyId}/images`, { method: "POST", body: JSON.stringify({ url, alt_text: alt }) });
    setUrl(""); setAlt("");
    reload();
  }

  async function removeImage(id: string) {
    await adminJSON(`/properties/${propertyId}/images/${id}`, { method: "DELETE" });
    reload();
  }

  async function addDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!docTitle || !docUrl) return;
    await adminJSON(`/properties/${propertyId}/documents`, {
      method: "POST",
      body: JSON.stringify({ type: docType, title: docTitle, file_url: docUrl, access: docAccess }),
    });
    setDocTitle(""); setDocUrl("");
    reload();
  }

  async function removeDoc(id: string) {
    await adminJSON(`/properties/${propertyId}/documents/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <aside className="h-fit space-y-6 border border-stone-line bg-stone-paper p-5 text-sm">
      {error && <p className="text-xs text-red-700">{error}</p>}

      <div>
        <h3 className="font-display text-base text-ink">Images ({images.length}/3 min)</h3>
        <ul className="mt-2 space-y-2">
          {images.map((img) => (
            <li key={img.id} className="flex items-center justify-between border border-stone-line px-2 py-1 text-xs">
              <span className="truncate">{img.alt_text}{img.is_cover && " (cover)"}</span>
              <button onClick={() => removeImage(img.id)} className="text-red-700">Remove</button>
            </li>
          ))}
        </ul>
        <form onSubmit={addImage} className="mt-3 space-y-2">
          <input placeholder="Image URL" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full border border-stone-line px-2 py-1 text-xs" />
          <input placeholder="Alt text (required, WCAG)" value={alt} onChange={(e) => setAlt(e.target.value)} className="w-full border border-stone-line px-2 py-1 text-xs" />
          <button type="submit" className="btn-outline w-full justify-center text-xs">Add Image</button>
        </form>
      </div>

      <div className="border-t border-stone-line pt-4">
        <h3 className="font-display text-base text-ink">Documents</h3>
        <ul className="mt-2 space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between border border-stone-line px-2 py-1 text-xs">
              <span className="truncate">{d.title} · {d.access}</span>
              <button onClick={() => removeDoc(d.id)} className="text-red-700">Remove</button>
            </li>
          ))}
        </ul>
        <form onSubmit={addDoc} className="mt-3 space-y-2">
          <input placeholder="Document title" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className="w-full border border-stone-line px-2 py-1 text-xs" />
          <input placeholder="File URL" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} className="w-full border border-stone-line px-2 py-1 text-xs" />
          <div className="grid grid-cols-2 gap-2">
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="border border-stone-line px-2 py-1 text-xs">
              {["SURVEY_PLAN", "FLOOR_PLAN", "BROCHURE", "APPROVAL", "OTHER"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={docAccess} onChange={(e) => setDocAccess(e.target.value)} className="border border-stone-line px-2 py-1 text-xs">
              {["PUBLIC", "GATED", "INTERNAL"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-outline w-full justify-center text-xs">Add Document</button>
        </form>
      </div>
    </aside>
  );
}
