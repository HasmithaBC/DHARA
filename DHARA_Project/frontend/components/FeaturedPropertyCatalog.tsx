import PropertyCard from "@/components/PropertyCard";
import { PropertySummary } from "@/lib/types";

interface FeaturedPropertyCatalogProps {
  properties: PropertySummary[];
  title?: string;
  description?: string;
}

export default function FeaturedPropertyCatalog({
  properties,
  title = "Featured Listings",
  description = "A considered selection of Dhara properties available now.",
}: FeaturedPropertyCatalogProps) {
  if (properties.length === 0) return null;

  return (
    <section className="border-y border-stone-line bg-stone-paper py-14">
      <div className="container-content">
        <p className="eyebrow">Featured Properties</p>
        <div className="mt-2 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="font-display text-2xl text-ink">{title}</h2>
            <p className="mt-2 max-w-xl text-sm text-ink-soft">{description}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {properties.slice(0, 4).map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}