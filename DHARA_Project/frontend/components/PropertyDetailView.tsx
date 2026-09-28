import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProperty, fetchSimilarProperties } from "@/lib/api";
import SmartMedia from "@/components/SmartMedia";
import { formatListingPrice, landExtentDisplay, whatsappInquiryLink, mapEmbedSrc } from "@/lib/format";
import PropertyCard from "@/components/PropertyCard";
import InquiryPanel from "@/components/InquiryPanel";
import ShareBar from "@/components/ShareBar";
import PriceTag from "@/components/PriceTag";
import DocumentsList from "@/components/DocumentsList";

export default async function PropertyDetailView({ slug }: { slug: string }) {
  const property = await fetchProperty(slug);
  if (!property) notFound();

  const similar = await fetchSimilarProperties(property.id);
  const price = formatListingPrice(property);
  const whatsapp = whatsappInquiryLink(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "94763774551",
    property.reference_code,
    property.title,
    price,
    `https://dharact.com/properties/${property.category.toLowerCase()}/${property.slug}`
  );

  const specRows: [string, string | undefined | null][] =
    property.category === "LAND"
      ? [
          ["Extent", property.land_extent_perches ? landExtentDisplay(property.land_extent_perches) : undefined],
          ["Land Type", property.land_type ?? undefined],
          ["Shape", property.land_shape ?? undefined],
          ["Road Access", property.road_access_ft ? `${property.road_access_ft} ft` : undefined],
          ["Road Surface", property.road_surface ?? undefined],
          ["Deed Type", property.deed_type?.replace("_", " ") ?? undefined],
          ["Electricity", property.has_electricity === null ? undefined : property.has_electricity ? "Available" : "Not available"],
          ["Water Source", property.water_source ?? undefined],
        ]
      : [
          ["Built Area", property.built_area_sqft ? `${property.built_area_sqft.toLocaleString()} sq ft` : undefined],
          ["Bedrooms", property.bedrooms?.toString()],
          ["Bathrooms", property.bathrooms?.toString()],
          ["Floors", property.floors?.toString()],
          ["Parking", property.parking_spaces?.toString()],
          ["Year Built", property.year_built?.toString()],
          ["Furnishing", property.furnishing?.replace("_", " ")],
          ["Condition", property.condition?.replace("_", " ")],
          ["Deed Type", property.deed_type?.replace("_", " ")],
        ];

  // FRPRP-012 / NFRSEO-004: RealEstateListing + BreadcrumbList structured data.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.short_description,
    url: `https://dharact.com/properties/${property.category.toLowerCase()}/${property.slug}`,
    image: property.images?.[0]?.url ? [`https://dharact.com${property.images[0].url}`] : undefined,
    address: { "@type": "PostalAddress", addressLocality: property.city_name, addressRegion: property.district_name, addressCountry: "LK" },
    offers: property.price_lkr
      ? { "@type": "Offer", price: property.price_lkr, priceCurrency: "LKR", availability: "https://schema.org/InStock" }
      : undefined,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://dharact.com" },
      { "@type": "ListItem", position: 2, name: "Properties", item: "https://dharact.com/properties" },
      { "@type": "ListItem", position: 3, name: property.title },
    ],
  };

  return (
    <div className="container-content py-10 print:py-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <nav className="text-xs text-ink-soft print:hidden">
        <Link href="/">Home</Link> <span className="mx-1">/</span>
        <Link href="/properties">Properties</Link> <span className="mx-1">/</span>
        <span>{property.title}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          {/* Gallery — FR-PRP-002 */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-fog">
            {property.images?.[0] && (
              <SmartMedia src={property.images[0].url} alt={property.images[0].alt_text} className="object-cover" priority />
            )}
            <span className="absolute left-3 top-3 bg-ink px-2 py-1 text-xs text-stone-paper">
              {property.status.replace("_", " ")}
            </span>
          </div>
          {property.images && property.images.length > 1 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {property.images.slice(1, 5).map((img) => (
                <div key={img.id} className="relative aspect-[4/3] overflow-hidden bg-stone-fog">
                  <SmartMedia src={img.url} alt={img.alt_text} className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Header block — FR-PRP-003 */}
          <div className="mt-8 border-b border-stone-line pb-6">
            <div className="text-xs text-ink-soft">{property.city_name}, {property.district_name}, {property.province_name}</div>
            <h1 className="mt-1 font-display text-3xl text-ink">{property.title}</h1>
            <div className="mt-2 text-xs text-ink-soft">Ref: {property.reference_code}</div>
            <div className="mt-4 font-display text-2xl text-brass-dark">
              <PriceTag priceLkr={property.price_lkr} priceOnRequest={property.price_on_request} priceUnit={property.price_unit} />
            </div>
            {property.is_negotiable && <div className="text-xs text-ink-soft">Negotiable</div>}
            {property.listing_type === "RENT" && (
              <div className="mt-2 text-sm text-ink-soft">
                {property.rent_period === "ANNUAL" ? "Annual" : "Monthly"} rent
                {property.advance_months ? ` · ${property.advance_months} months advance` : ""}
                {property.deposit_lkr ? ` · Deposit LKR ${property.deposit_lkr.toLocaleString()}` : ""}
              </div>
            )}
            <ShareBar url={`https://dharact.com/properties/${property.category.toLowerCase()}/${property.slug}`} title={property.title} />
          </div>

          {/* Specifications — FR-PRP-004/005 */}
          <div className="mt-6">
            <h2 className="font-display text-lg text-ink">Specifications</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
              {specRows
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-ink-soft">{k}</dt>
                    <dd className="text-ink">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>

          {/* Description */}
          <div className="mt-8">
            <h2 className="font-display text-lg text-ink">Description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{property.description}</p>
          </div>

          {/* Amenities — FR-PRP-006 */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg text-ink">Amenities</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {property.amenities.map((a) => (
                  <span key={a.id} className="border border-stone-line px-3 py-1 text-xs">{a.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Downloads — FR-PRP-007 / FR-INQ-005 */}
          <DocumentsList documents={property.documents ?? []} />

          {/* Location map — FR-PRP-008. Uses Google's keyless "output=embed" iframe by
              default so the site works with zero configuration; if NEXT_PUBLIC_GOOGLE_MAPS_KEY
              is set, upgrade to the full Maps Embed API (nicer styling, still no client JS). */}
          <div className="mt-8">
            <h2 className="font-display text-lg text-ink">Location</h2>
            <div className="mt-3 aspect-[16/7] w-full overflow-hidden border border-stone-line bg-stone-fog">
              <iframe
                title="Property location map"
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={mapEmbedSrc(property)}
              />
            </div>
            {!property.show_exact_location && (
              <p className="mt-2 text-xs text-ink-soft">
                Approximate location shown — the exact address is shared once you get in touch.
              </p>
            )}
          </div>

          {/* Service cross-sell — FR-INQ-006, land only */}
          {property.category === "LAND" && (
            <div className="mt-8 border border-brass bg-brass/10 p-6">
              <h3 className="font-display text-base text-ink">Want Dhara to design and build on this land?</h3>
              <p className="mt-1 text-sm text-ink-soft">Talk to us about a custom home consultation for this plot.</p>
              <Link href={`/contact?service=custom-build&property=${property.reference_code}`} className="btn-brass mt-4 inline-flex">
                Request a Consultation
              </Link>
            </div>
          )}

          {/* Similar properties — FR-PRP-010 */}
          {similar.length > 0 && (
            <div className="mt-10 print:hidden">
              <h2 className="font-display text-lg text-ink">Similar Properties</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {similar.slice(0, 4).map((p) => <PropertyCard key={p.id} property={p} />)}
              </div>
            </div>
          )}
        </div>

        {/* Sticky inquiry panel — FR-PRP-009 */}
        <div className="print:hidden">
          <InquiryPanel property={property} price={price} whatsappLink={whatsapp} />
        </div>
      </div>
    </div>
  );
}
