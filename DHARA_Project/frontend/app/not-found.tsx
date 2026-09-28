import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-content flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="font-display text-6xl text-ink">404</div>
      <p className="mt-4 max-w-md text-sm text-ink-soft">
        We couldn't find that page. It may have been moved, sold, or the listing has been archived.
      </p>
      <form action="/properties" className="mt-8 flex w-full max-w-md">
        <input name="q" placeholder="Search properties…" className="w-full border border-stone-line px-3 py-2 text-sm" />
        <button type="submit" className="btn-primary shrink-0">Search</button>
      </form>
      <div className="mt-6 flex gap-4 text-sm">
        <Link href="/properties/lands" className="underline">Land for Sale</Link>
        <Link href="/properties/houses" className="underline">Houses for Sale</Link>
        <Link href="/" className="underline">Home</Link>
      </div>
    </div>
  );
}
