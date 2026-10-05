import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProperty, fetchSimilarProperties } from "@/lib/api";
import SmartMedia from "@/components/SmartMedia";
import {
  formatListingPrice,
  landExtentDisplay,
  listingTypeLabel,
  mapEmbedSrc,
  prettyEnum,
  videoEmbedUrl,
  whatsappInquiryLink,
} from "@/lib/format";
import { SITE_URL, propertyPath } from "@/lib/config";
import { getContact } from "@/lib/contact";
import { mediaUrl } from "@/lib/media";
import PropertyCard from "@/components/PropertyCard";
import InquiryPanel from "@/components/InquiryPanel";
import ShareBar from "@/components/ShareBar";
import PriceTag from "@/components/PriceTag";
import DocumentsList from "@/components/DocumentsList";

type Row = [string, string | undefined | null];

// The API leaves a field out entirely when it was never filled in. Treat "missing" as "unknown" (hidden),
// never as "No" / "Not available".
const yesNo = (v?: boolean | null) => (v === null || v === undefined ? undefined : v ? "Yes" : "No");
const availability = (v?: boolean | null) => (v === null || v === undefined ? undefined : v ? "Available" : "Not available");
const num = (v?: number | null) => (v === null || v === undefined ? undefined : v.toLocaleString());

export default async function PropertyDetailView({ slug }: { slug: string }) {
  const [property, contact] = await Promise.all([fetchProperty(slug), getContact()]);
  if (!property) notFound();

  const similar = await fetchSimilarProperties(property.id);
  const price = formatListingPrice(property);
  const pageUrl = `${SITE_URL}${propertyPath(property.slug)}`;
  const whatsapp = whatsappInquiryLink(contact.whatsapp, property.reference_code, property.title, price, pageUrl);

  // Cover photo first (the admin's "cover" choice), then the rest in the admin's order.
  const images = [...(property.images ?? [])].sort((a, b) => Number(b.is_cover) - Number(a.is_cover));
  const location = [property.city_name, property.district_name, property.province_name].filter(Boolean).join(", ");
  const embed = videoEmbedUrl(property.video_url);
  const isRent = property.listing_type === "RENT";

  const specRows: Row[] =
    property.category === "LAND"
      ? [
          ["Extent", property.land_extent_perches ? landExtentDisplay(property.land_extent_perches) : undefined],
          ["Land Type", prettyEnum(property.land_type)],
          ["Shape", property.land_shape],
          ["Frontage", property.frontage_ft ? `${property.frontage_ft} ft` : undefined],
          ["Road Access", property.road_access_ft ? `${property.road_access_ft} ft` : undefined],
          ["Road Surface", prettyEnum(property.road_surface)],
          ["Deed Type", prettyEnum(property.deed_type)],
          ["Electricity", availability(property.has_electricity)],
          ["Water Source", prettyEnum(property.water_source)],
          ["Boundary Wall", yesNo(property.has_boundary_wall)],
        ]
      : [
          ["Built Area", property.built_area_sqft ? `${property.built_area_sqft.toLocaleString()} sq ft` : undefined],
          ["Land Extent", property.land_extent_perches ? landExtentDisplay(property.land_extent_perches) : undefined],
          ["Bedrooms", num(property.bedrooms)],
          ["Bathrooms", num(property.bathrooms)],
          ["Floors", num(property.floors)],
          ["Parking", num(property.parking_spaces)],
          ["Year Built", property.year_built?.toString()],
          ["Furnishing", prettyEnum(property.furnishing)],
          ["Condition", prettyEnum(property.condition)],
          ["Electricity", availability(property.has_electricity)],
          ["Water Source", prettyEnum(property.water_source)],
          ["Boundary Wall", yesNo(property.has_boundary_wall)],
          ["Solar Power", yesNo(property.has_solar)],
          ["A/C Ready", yesNo(property.ac_ready)],
          ["Deed Type", prettyEnum(property.deed_type)],
        ];

  // FR-PRP-012 / NFR-SEO-004: RealEstateListing + BreadcrumbList structured data.
  const cover = images[0]?.url ? mediaUrl(images[0].url) : "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.short_description,
    url: pageUrl,
    image: cover ? [cover.startsWith("http") ? cover : `${SITE_URL}${cover}`] : undefined,
    address: { "@type": "PostalAddress", addressLocality: property.city_name, addressRegion: property.district_name, addressCountry: "LK" },
    offers: property.price_lkr
      ? {
          "@type": "Offer",
          price: property.price_lkr,
          priceCurrency: "LKR",
          availability:
            property.status === "SOLD" || property.status === "RENTED" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
        }
      : undefined,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Properties", item: `${SITE_URL}/properties` },
      { "@type": "ListItem", position: 3, name: property.title },
    ],
  };

  // PUBLISHED listings show "For Sale"/"For Rent"; Reserved / Sold / Rented are called out as such.
  const badge = property.status === "PUBLISHED" ? listingTypeLabel(property.listing_type) : prettyEnum(property.status);

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
            {images[0] && <SmartMedia src={images[0].url} alt={images[0].alt_text} className="object-cover" priority />}
            <span className="absolute left-3 top-3 bg-ink px-2 py-1 text-xs text-stone-paper">{badge}</span>
          </div>
          {images.length > 1 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {images.slice(1).map((img) => (
                <div key={img.id} className="relative aspect-[4/3] overflow-hidden bg-stone-fog">
                  <SmartMedia src={img.url} alt={img.alt_text} className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Header block — FR-PRP-003 */}
          <div className="mt-8 border-b border-stone-line pb-6">
            <div className="text-xs text-ink-soft">{location}</div>
            {property.address_line && <div className="mt-0.5 text-xs text-ink-soft">{property.address_line}</div>}
            <h1 className="mt-1 font-display text-3xl text-ink">{property.title}</h1>
            {property.short_description && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">{property.short_description}</p>}
            <div className="mt-2 text-xs text-ink-soft">Ref: {property.reference_code}</div>
            <div className="mt-4 font-display text-2xl text-brass-dark">
              <PriceTag priceLkr={property.price_lkr} priceOnRequest={property.price_on_request} priceUnit={property.price_unit} displayCurrency="LKR" />
            </div>
            {property.is_negotiable && <div className="text-xs text-ink-soft">Negotiable</div>}
            {isRent && (
              <div className="mt-2 text-sm text-ink-soft">
                {property.rent_period === "ANNUAL" ? "Annual" : "Monthly"} rent
                {property.minimum_lease_months ? ` · Minimum lease ${property.minimum_lease_months} months` : ""}
                {property.advance_months ? ` · ${property.advance_months} months advance` : ""}
                {property.deposit_lkr ? ` · Deposit LKR ${property.deposit_lkr.toLocaleString()}` : ""}
              </div>
            )}
            <ShareBar url={pageUrl} title={property.title} />
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
            {property.deed_note && <p className="mt-3 text-xs text-ink-soft italic">Deed Note: {property.deed_note}</p>}
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

          {/* Video tour (admin → Property → Video URL) */}
          {property.video_url && (
            <div className="mt-8 print:hidden">
              <h2 className="font-display text-lg text-ink">Video Tour</h2>
              {embed ? (
                <div className="mt-3 aspect-video w-full overflow-hidden border border-stone-line bg-stone-fog">
                  <iframe
                    title="Property video tour"
                    className="h-full w-full"
                    src={embed}
                    loading="lazy"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a href={property.video_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm underline">
                  Watch the video tour
                </a>
              )}
            </div>
          )}

          {/* Downloads — FR-PRP-007 / FR-INQ-005 */}
          <DocumentsList documents={property.documents ?? []} />

          {/* Location map — FR-PRP-008 */}
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
          <InquiryPanel property={property} price={price} whatsappLink={whatsapp} telHref={contact.telHref} />
        </div>
      </div>
    </div>
  );
}
