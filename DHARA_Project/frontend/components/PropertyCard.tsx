import Link from "next/link";
import Image from "next/image";
import { PropertySummary } from "@/lib/types";
import { categoryLabel, listingTypeLabel } from "@/lib/format";
import PriceTag from "@/components/PriceTag";

const categoryPath: Record<string, string> = {
  LAND: "lands",
  HOUSE: "houses",
  COMMERCIAL: "commercial",
};

export default function PropertyCard({ property }: { property: PropertySummary }) {
  const detailHref = `/properties/${categoryPath[property.category] ?? "other"}/${property.slug}`;
  const keyFacts =
    property.category === "LAND"
      ? property.land_extent_perches
        ? `${property.land_extent_perches} Perches`
        : ""
      : [
          property.bedrooms ? `${property.bedrooms} Bed` : null,
          property.bathrooms ? `${property.bathrooms} Bath` : null,
          property.built_area_sqft ? `${property.built_area_sqft.toLocaleString()} sq ft` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <Link
      href={detailHref}
      className="group block border border-stone-line bg-stone-paper transition-all duration-300 hover:-translate-y-1 hover:border-brass hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-fog">
        {property.cover_url && (
          <Image
            src={property.cover_url}
            alt={property.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-concrete-900/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="bg-ink px-2 py-1 text-xs font-medium text-stone-paper">
            {categoryLabel(property.category)}
          </span>
          <span className="bg-brass px-2 py-1 text-xs font-medium text-ink">
            {listingTypeLabel(property.listing_type)}
          </span>
        </div>
        {property.status !== "PUBLISHED" && (
          <div className="absolute right-3 top-3 bg-concrete-900 px-2 py-1 text-xs text-stone-paper">
            {property.status.replace("_", " ")}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs text-ink-soft">
          {property.city_name}, {property.district_name}
        </div>
        <h3 className="mt-1 font-display text-base leading-snug text-ink transition-colors group-hover:text-brass-dark">
          {property.title}
        </h3>
        {keyFacts && <div className="mt-1 text-sm text-ink-soft">{keyFacts}</div>}
        <div className="mt-3 flex items-center justify-between rule pt-3">
          <span className="font-display text-sm text-ink">
            <PriceTag priceLkr={property.price_lkr} priceOnRequest={property.price_on_request} priceUnit={property.price_unit} />
          </span>
          <span className="text-xs text-ink-soft">{property.reference_code}</span>
        </div>
      </div>
    </Link>
  );
}
