// Unit conversion + formatting helpers mirroring backend/internal/util (Appendix C, FR-LST-006).

const PERCH_TO_SQFT = 272.25;
const PERCH_TO_SQM = 25.293;
const ACRE_IN_PERCH = 160;
const ROOD_IN_PERCH = 40;

export function formatPriceLKR(amount: number): string {
  return `LKR ${Math.round(amount).toLocaleString("en-LK")}`;
}

export function formatPriceUSD(amountLkr: number, rate: number): string {
  return `USD ${Math.round(amountLkr / rate).toLocaleString("en-US")}`;
}

export function formatListingPrice(p: {
  price_on_request: boolean;
  price_lkr: number | null;
  price_unit?: string | null;
  listing_type: string;
}): string {
  if (p.price_on_request || p.price_lkr == null) return "Price on Request";
  const base = formatPriceLKR(p.price_lkr);
  if (p.price_unit === "PER_MONTH") return `${base} / month`;
  if (p.price_unit === "PER_YEAR") return `${base} / year`;
  if (p.price_unit === "PER_PERCH") return `${base} / perch`;
  return base;
}

export function landExtentDisplay(perches: number): string {
  const acres = perches / ACRE_IN_PERCH;
  const sqm = perches * PERCH_TO_SQM;
  const sqft = perches * PERCH_TO_SQFT;
  let out = `${trimNum(perches)} Perches (${trimNum(acres, 3)} Acres · ${sqm.toFixed(1)} m² · ${Math.round(sqft).toLocaleString()} sq ft)`;
  if (perches >= ROOD_IN_PERCH) {
    const wholeAcres = Math.floor(perches / ACRE_IN_PERCH);
    const remainder = perches - wholeAcres * ACRE_IN_PERCH;
    const roods = Math.floor(remainder / ROOD_IN_PERCH);
    const remPerches = remainder - roods * ROOD_IN_PERCH;
    out += ` — ${wholeAcres}A-${roods}R-${trimNum(remPerches)}P`;
  }
  return out;
}

function trimNum(n: number, digits = 2): string {
  return parseFloat(n.toFixed(digits)).toString();
}

export function categoryLabel(category: string): string {
  return { LAND: "Land", HOUSE: "House", COMMERCIAL: "Commercial" }[category] ?? category;
}

export function listingTypeLabel(listingType: string): string {
  return listingType === "RENT" ? "For Rent" : "For Sale";
}

export function whatsappInquiryLink(number: string, referenceCode: string, title: string, price: string, url: string): string {
  const message = `Hi Dhara, I'm interested in ${referenceCode} — ${title} (${price}). Link: ${url}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// FR-PRP-008: exact coordinates must never reach the page source when show_exact_location
// is false — an approximate, text-based (city/district) query is embedded instead. Uses
// Google's keyless "output=embed" iframe by default (zero config); set
// NEXT_PUBLIC_GOOGLE_MAPS_KEY to switch to the full Maps Embed API for nicer styling.
export function mapEmbedSrc(property: {
  show_exact_location: boolean;
  latitude: number;
  longitude: number;
  city_name?: string;
  district_name?: string;
  province_name?: string;
}): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (property.show_exact_location) {
    const q = `${property.latitude},${property.longitude}`;
    return key
      ? `https://www.google.com/maps/embed/v1/place?key=${key}&q=${q}&zoom=16`
      : `https://www.google.com/maps?q=${q}&z=16&output=embed`;
  }
  const areaQuery = encodeURIComponent(
    [property.city_name, property.district_name, property.province_name, "Sri Lanka"].filter(Boolean).join(", ")
  );
  return key
    ? `https://www.google.com/maps/embed/v1/place?key=${key}&q=${areaQuery}&zoom=12`
    : `https://www.google.com/maps?q=${areaQuery}&z=12&output=embed`;
}
