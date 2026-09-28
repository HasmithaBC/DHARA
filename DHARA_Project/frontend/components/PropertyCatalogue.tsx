import Link from "next/link";
import { fetchProperties } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import MobileFilterSheet from "@/components/MobileFilterSheet";

export interface CatalogueProps {
  title: string;
  searchParams: Record<string, string | string[] | undefined>;
  forced?: Record<string, string>;
}

const districts = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara",
  "Hambantota", "Jaffna", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle", "Batticaloa", "Ampara", "Trincomalee",
];

function toQuery(sp: Record<string, string | string[] | undefined>, forced?: Record<string, string>) {
  const q: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string" && v) q[k] = v;
  }
  return { ...q, ...(forced ?? {}) };
}

export default async function PropertyCatalogue({ title, searchParams, forced }: CatalogueProps) {
  const params = toQuery(searchParams, forced);
  const page = Number(params.page || "1");
  const result = await fetchProperties({ ...params, page: String(page), per_page: "12" });
  const total = result.meta?.total ?? result.data.length;
  const totalPages = result.meta?.total_pages ?? 1;

  const activeFilters = Object.entries(params).filter(([k]) => !["page", "per_page", "sort"].includes(k) && !forced?.[k]);

  // FR-LST-008: zero-result state suggests up to three nearby/similar listings instead of a dead end.
  const suggestions =
    result.data.length === 0
      ? (await fetchProperties({ ...(forced ?? {}), featured: "true", per_page: "3" })).data
      : [];

  const buildHref = (overrides: Record<string, string>) => {
    const merged = { ...params, ...overrides };
    const qs = new URLSearchParams(merged as Record<string, string>).toString();
    return `?${qs}`;
  };

  const filterForm = (
    <aside className="h-fit border border-stone-line bg-stone-paper p-5 lg:sticky lg:top-24">
      <form method="get" className="space-y-4 text-sm">
        {!forced?.listing_type && (
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Listing Type</label>
            <select name="type" defaultValue={params.type || ""} className="w-full border border-stone-line px-2 py-2">
              <option value="">Any</option>
              <option value="SALE">For Sale</option>
              <option value="RENT">For Rent</option>
            </select>
          </div>
        )}
        {!forced?.category && (
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Category</label>
            <select name="category" defaultValue={params.category || ""} className="w-full border border-stone-line px-2 py-2">
              <option value="">Any</option>
              <option value="LAND">Land</option>
              <option value="HOUSE">House</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">District</label>
          <select name="district" defaultValue={params.district || ""} className="w-full border border-stone-line px-2 py-2">
            <option value="">Any</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Min Price (LKR)</label>
            <input name="price_min" defaultValue={params.price_min || ""} className="w-full border border-stone-line px-2 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Max Price (LKR)</label>
            <input name="price_max" defaultValue={params.price_max || ""} className="w-full border border-stone-line px-2 py-2" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Bedrooms</label>
          <select name="beds" defaultValue={params.beds || ""} className="w-full border border-stone-line px-2 py-2">
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}{n === 5 ? "+" : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Bathrooms</label>
          <select name="baths" defaultValue={params.baths || ""} className="w-full border border-stone-line px-2 py-2">
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}{n === 5 ? "+" : ""}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Min Perches</label>
            <input type="number" step="any" name="perches_min" defaultValue={params.perches_min || ""} className="w-full border border-stone-line px-2 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Max Perches</label>
            <input type="number" step="any" name="perches_max" defaultValue={params.perches_max || ""} className="w-full border border-stone-line px-2 py-2" />
          </div>
        </div>
        {Object.entries(forced ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <button type="submit" className="btn-primary w-full justify-center transition-transform hover:-translate-y-0.5">
          Apply Filters
        </button>
        <Link href="?" className="block text-center text-xs underline">Clear all</Link>
      </form>
    </aside>
  );

  return (
    <div className="container-content py-10">
      <nav className="text-xs text-ink-soft">
        <Link href="/">Home</Link> <span className="mx-1">/</span> <span>Properties</span>
      </nav>
      <h1 className="mt-3 font-display text-3xl text-ink">{title}</h1>
      <p className="mt-1 text-sm text-ink-soft">{total} properties found</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[280px_1fr]">
        {/* Filter rail (desktop sticky) / bottom-sheet (mobile) — FR-LST-002, NFR-UI-006 */}
        <MobileFilterSheet activeCount={activeFilters.length} resultCount={total}>
          {filterForm}
        </MobileFilterSheet>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {activeFilters.map(([k, v]) => (
                <Link key={k} href={buildHref({ [k]: "" })} className="border border-stone-line px-3 py-1 text-xs transition-colors hover:border-brass hover:text-brass-dark">
                  {k}: {v} ✕
                </Link>
              ))}
            </div>
            <form method="get" className="flex items-center gap-2 text-xs">
              {Object.entries(params).filter(([k]) => k !== "sort").map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <label className="text-ink-soft">Sort</label>
              <select name="sort" defaultValue={params.sort || ""} className="border border-stone-line px-2 py-1">
                <option value="">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="extent">Land Extent</option>
                <option value="built_area">Built Area</option>
              </select>
              <button type="submit" className="border border-stone-line px-2 py-1 transition-colors hover:border-brass">Go</button>
            </form>
          </div>

          {result.data.length === 0 ? (
            <div className="border border-stone-line bg-stone-paper p-10 text-center">
              <p className="text-ink">No properties matched your filters.</p>
              {activeFilters.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {activeFilters.map(([k, v]) => (
                    <span key={k} className="border border-stone-line px-3 py-1 text-xs text-ink-soft">{k}: {v}</span>
                  ))}
                </div>
              )}
              <Link href="?" className="btn-outline mt-4 inline-flex">Clear all filters</Link>

              {suggestions.length > 0 && (
                <div className="mt-10 text-left">
                  <p className="eyebrow text-center">You might also like</p>
                  <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {suggestions.map((p) => <PropertyCard key={p.id} property={p} />)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <StaggerGroup className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" amount={0.05}>
              {result.data.map((p) => (
                <StaggerItem key={p.id}>
                  <PropertyCard property={p} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildHref({ page: String(p) })}
                  className={`h-9 w-9 flex items-center justify-center border text-sm transition-colors ${p === page ? "border-ink bg-ink text-stone-paper" : "border-stone-line hover:border-brass"}`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
