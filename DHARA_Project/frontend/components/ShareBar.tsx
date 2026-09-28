"use client";

export default function ShareBar({ url, title }: { url: string; title: string }) {
  return (
    <div className="mt-3 flex items-center gap-3 text-xs text-ink-soft print:hidden">
      <a href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`} target="_blank" className="underline">Share on WhatsApp</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" className="underline">Share on Facebook</a>
      <button onClick={() => navigator.clipboard.writeText(url)} className="underline">Copy link</button>
      <button onClick={() => window.print()} className="underline">Print</button>
    </div>
  );
}
