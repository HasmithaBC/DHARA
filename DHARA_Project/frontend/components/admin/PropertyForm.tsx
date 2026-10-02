"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminApiError, adminJSON, publicJSON } from "@/lib/admin-api";
import { useToast } from "@/components/Toast";

type Tri = "" | "yes" | "no";

export interface PropertyFormValues {
  // core
  title: string;
  slug: string;
  category: "LAND" | "HOUSE" | "COMMERCIAL";
  listing_type: "SALE" | "RENT";
  short_description: string;
  description: string;
  is_featured: boolean;
  // price
  price_lkr: string;
  price_on_request: boolean;
  price_basis: "TOTAL" | "PER_PERCH";
  is_negotiable: boolean;
  rent_period: "MONTHLY" | "ANNUAL";
  minimum_lease_months: string;
  advance_months: string;
  deposit_lkr: string;
  // location
  province_id: string;
  district_id: string;
  city_id: string;
  address_line: string;
  show_exact_location: boolean;
  latitude: string;
  longitude: string;
  // size / building
  land_extent_perches: string;
  built_area_sqft: string;
  bedrooms: string;
  bathrooms: string;
  floors: string;
  parking_spaces: string;
  year_built: string;
  furnishing: string;
  condition: string;
  // land details
  land_shape: string;
  land_type: string;
  road_access_ft: string;
  road_surface: string;
  frontage_ft: string;
  // utilities & legal
  has_electricity: Tri;
  water_source: string;
  has_solar: Tri;
  has_boundary_wall: Tri;
  ac_ready: Tri;
  deed_type: string;
  deed_note: string;
  // extras
  video_url: string;
  meta_title: string;
  meta_description: string;
  amenity_ids: number[];
}

export const EMPTY_VALUES: PropertyFormValues = {
  title: "", slug: "", category: "HOUSE", listing_type: "SALE", short_description: "", description: "", is_featured: false,
  price_lkr: "", price_on_request: false, price_basis: "TOTAL", is_negotiable: false,
  rent_period: "MONTHLY", minimum_lease_months: "", advance_months: "", deposit_lkr: "",
  province_id: "", district_id: "", city_id: "", address_line: "", show_exact_location: false,
  latitude: "7.8731", longitude: "80.7718",
  land_extent_perches: "", built_area_sqft: "", bedrooms: "", bathrooms: "", floors: "", parking_spaces: "", year_built: "",
  furnishing: "", condition: "",
  land_shape: "", land_type: "", road_access_ft: "", road_surface: "", frontage_ft: "",
  has_electricity: "", water_source: "", has_solar: "", has_boundary_wall: "", ac_ready: "",
  deed_type: "", deed_note: "",
  video_url: "", meta_title: "", meta_description: "", amenity_ids: [],
};

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const tri = (v: unknown): Tri => (v === true ? "yes" : v === false ? "no" : "");

/** Maps the API's property object onto form values (nothing is dropped, so a save never erases data). */
export function propertyToFormValues(p: any): PropertyFormValues {
  return {
    title: s(p.title), slug: s(p.slug), category: p.category, listing_type: p.listing_type,
    short_description: s(p.short_description), description: s(p.description), is_featured: !!p.is_featured,
    price_lkr: s(p.price_lkr), price_on_request: !!p.price_on_request,
    price_basis: p.price_unit === "PER_PERCH" ? "PER_PERCH" : "TOTAL", is_negotiable: !!p.is_negotiable,
    rent_period: p.rent_period === "ANNUAL" ? "ANNUAL" : "MONTHLY",
    minimum_lease_months: s(p.minimum_lease_months), advance_months: s(p.advance_months), deposit_lkr: s(p.deposit_lkr),
    province_id: s(p.province_id), district_id: s(p.district_id), city_id: s(p.city_id),
    address_line: s(p.address_line), show_exact_location: !!p.show_exact_location,
    latitude: s(p.latitude) || EMPTY_VALUES.latitude, longitude: s(p.longitude) || EMPTY_VALUES.longitude,
    land_extent_perches: s(p.land_extent_perches), built_area_sqft: s(p.built_area_sqft),
    bedrooms: s(p.bedrooms), bathrooms: s(p.bathrooms), floors: s(p.floors), parking_spaces: s(p.parking_spaces),
    year_built: s(p.year_built), furnishing: s(p.furnishing), condition: s(p.condition),
    land_shape: s(p.land_shape), land_type: s(p.land_type), road_access_ft: s(p.road_access_ft),
    road_surface: s(p.road_surface), frontage_ft: s(p.frontage_ft),
    has_electricity: tri(p.has_electricity), water_source: s(p.water_source), has_solar: tri(p.has_solar),
    has_boundary_wall: tri(p.has_boundary_wall), ac_ready: tri(p.ac_ready),
    deed_type: s(p.deed_type), deed_note: s(p.deed_note),
    video_url: s(p.video_url), meta_title: s(p.meta_title), meta_description: s(p.meta_description),
    amenity_ids: Array.isArray(p.amenities) ? p.amenities.map((a: any) => Number(a.id)) : [],
  };
}

interface City { id: number; name: string }
interface District { id: number; name: string; cities: City[] }
interface Province { id: number; name: string; districts: District[] }
interface Amenity { id: number; name: string }

const inputCls = "w-full border border-stone-line bg-white px-3 py-2";

function Field({
  label, error, hint, required, children, className = "",
}: {
  label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs text-ink-soft">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
      {hint && !error && <span className="mt-1 block text-[11px] text-ink-soft">{hint}</span>}
      {error && <span className="mt-1 block text-[11px] text-red-700">{error}</span>}
    </label>
  );
}

function Section({ title, children, note }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="border border-stone-line bg-stone-paper p-5">
      <h2 className="font-display text-base text-ink">{title}</h2>
      {note && <p className="mt-1 text-xs text-ink-soft">{note}</p>}
      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function TriSelect({ value, onChange }: { value: Tri; onChange: (v: Tri) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as Tri)} className={inputCls}>
      <option value="">Not specified</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  );
}

function EnumSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      <option value="">Not specified</option>
      {options.map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}

export default function PropertyForm({
  propertyId,
  initial,
  onSaved,
}: {
  propertyId?: string;
  initial?: Partial<PropertyFormValues>;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<PropertyFormValues>({ ...EMPTY_VALUES, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [tree, setTree] = useState<Province[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loadError, setLoadError] = useState("");
  const [newTown, setNewTown] = useState("");
  const [addingTown, setAddingTown] = useState(false);

  function set<K extends keyof PropertyFormValues>(key: K, val: PropertyFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key as string]: "" }));
  }

  async function loadTree() {
    try {
      setTree(await publicJSON<Province[]>("/locations"));
    } catch (e: any) {
      setLoadError(e.message);
    }
  }

  useEffect(() => {
    loadTree();
    publicJSON<Amenity[]>("/amenities").then(setAmenities).catch(() => {});
  }, []);

  const districts = useMemo(() => tree.find((p) => String(p.id) === values.province_id)?.districts ?? [], [tree, values.province_id]);
  const cities = useMemo(() => districts.find((d) => String(d.id) === values.district_id)?.cities ?? [], [districts, values.district_id]);

  async function addTown() {
    if (!values.district_id || newTown.trim().length < 2) return;
    setAddingTown(true);
    try {
      const city = await adminJSON<{ id: number }>("/cities", {
        method: "POST",
        body: JSON.stringify({ district_id: Number(values.district_id), name: newTown.trim() }),
      });
      await loadTree();
      set("city_id", String(city.id));
      setNewTown("");
      toast.success("Town added");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAddingTown(false);
    }
  }

  const isLand = values.category === "LAND";
  const isHouse = values.category === "HOUSE";
  const isRent = values.listing_type === "RENT";

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    const t = values.title.trim();
    if (t.length < 10 || t.length > 160) e.title = "Title must be 10–160 characters";
    if (!values.price_on_request && !(Number(values.price_lkr) > 0)) e.price_lkr = "Enter a price, or tick “price on request”";
    if (isLand && !(Number(values.land_extent_perches) > 0)) e.land_extent_perches = "Land extent (perches) is required for land";
    if (!isLand && !(Number(values.built_area_sqft) > 0)) e.built_area_sqft = "Built area is required for houses and commercial";
    if (isHouse && values.bedrooms.trim() === "") e.bedrooms = "Bedrooms is required for houses";
    if (!values.province_id) e.province_id = "Choose a province";
    if (!values.district_id) e.district_id = "Choose a district";
    if (!values.city_id) e.city_id = "Choose a city or town (you can add one)";
    const lat = Number(values.latitude), lng = Number(values.longitude);
    if (!(lat >= 5.9 && lat <= 9.9 && lng >= 79.5 && lng <= 81.9)) e.latitude = "Coordinates must fall within Sri Lanka";
    if (values.video_url.trim() && !values.video_url.trim().toLowerCase().startsWith("https://")) e.video_url = "Use a full https:// link";
    if (values.meta_title.length > 60) e.meta_title = "Max 60 characters";
    if (values.meta_description.length > 160) e.meta_description = "Max 160 characters";
    return e;
  }

  function toPayload() {
    const num = (v: string) => (v.trim() === "" ? null : Number(v));
    const int = (v: string) => (v.trim() === "" ? null : Math.round(Number(v)));
    const str = (v: string) => (v.trim() === "" ? null : v.trim());
    const bool = (v: Tri) => (v === "yes" ? true : v === "no" ? false : null);
    const priceUnit = isRent ? (values.rent_period === "ANNUAL" ? "PER_YEAR" : "PER_MONTH") : isLand && values.price_basis === "PER_PERCH" ? "PER_PERCH" : "TOTAL";
    return {
      title: values.title.trim(),
      slug: propertyId ? values.slug.trim() : "",
      category: values.category,
      listing_type: values.listing_type,
      short_description: values.short_description.trim(),
      description: values.description.trim(),
      is_featured: values.is_featured,
      price_lkr: values.price_on_request ? null : num(values.price_lkr),
      price_on_request: values.price_on_request,
      price_unit: priceUnit,
      is_negotiable: values.is_negotiable,
      rent_period: isRent ? values.rent_period : null,
      minimum_lease_months: isRent ? int(values.minimum_lease_months) : null,
      advance_months: isRent ? int(values.advance_months) : null,
      deposit_lkr: isRent ? num(values.deposit_lkr) : null,
      province_id: Number(values.province_id),
      district_id: Number(values.district_id),
      city_id: Number(values.city_id),
      address_line: str(values.address_line),
      show_exact_location: values.show_exact_location,
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      land_extent_perches: num(values.land_extent_perches),
      built_area_sqft: isLand ? null : int(values.built_area_sqft),
      bedrooms: isLand ? null : int(values.bedrooms),
      bathrooms: isLand ? null : int(values.bathrooms),
      // extended columns — always sent in full: the API replaces these on every save
      land_shape: str(values.land_shape),
      road_access_ft: int(values.road_access_ft),
      road_surface: str(values.road_surface),
      frontage_ft: int(values.frontage_ft),
      land_type: str(values.land_type),
      floors: isLand ? null : int(values.floors),
      parking_spaces: isLand ? null : int(values.parking_spaces),
      year_built: isLand ? null : int(values.year_built),
      furnishing: isLand ? null : str(values.furnishing),
      condition: isLand ? null : str(values.condition),
      has_electricity: bool(values.has_electricity),
      water_source: str(values.water_source),
      deed_type: str(values.deed_type),
      deed_note: str(values.deed_note),
      has_boundary_wall: bool(values.has_boundary_wall),
      has_solar: bool(values.has_solar),
      ac_ready: bool(values.ac_ready),
      video_url: str(values.video_url),
      meta_title: str(values.meta_title),
      meta_description: str(values.meta_description),
      amenity_ids: values.amenity_ids,
    };
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError("");
    const local = validate();
    if (Object.keys(local).length > 0) {
      setErrors(local);
      setFormError("Please fix the highlighted fields.");
      toast.error("Please fix the highlighted fields.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (propertyId) {
        await adminJSON(`/properties/${propertyId}`, { method: "PATCH", body: JSON.stringify(toPayload()) });
        toast.success("Property saved");
        onSaved?.();
      } else {
        const res = await adminJSON<{ id: string }>("/properties", { method: "POST", body: JSON.stringify(toPayload()) });
        toast.success("Draft created — now add photos, then publish.");
        router.push(`/admin/properties/${res.id}/edit`);
      }
    } catch (err: any) {
      if (err instanceof AdminApiError && Object.keys(err.fields).length > 0) setErrors(err.fields);
      setFormError(err.message || "Failed to save property");
      toast.error(err.message || "Failed to save property");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  const E = errors;

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6 text-sm" noValidate>
      {formError && <div className="border border-red-300 bg-red-50 p-3 text-red-700">{formError}</div>}
      {loadError && <div className="border border-amber-300 bg-amber-50 p-3 text-amber-800">Couldn&apos;t load locations: {loadError}</div>}

      <Section title="Basics">
        <Field label="Title" required error={E.title} className="md:col-span-2" hint="10–160 characters. Shown as the listing headline.">
          <input value={values.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Category" required error={E.category}>
          <select value={values.category} onChange={(e) => set("category", e.target.value as any)} className={inputCls}>
            <option value="HOUSE">House</option>
            <option value="LAND">Land</option>
            <option value="COMMERCIAL">Commercial</option>
          </select>
        </Field>
        <Field label="Listing type" required error={E.listing_type}>
          <select value={values.listing_type} onChange={(e) => set("listing_type", e.target.value as any)} className={inputCls}>
            <option value="SALE">For sale</option>
            <option value="RENT">For rent</option>
          </select>
        </Field>
        <Field label="Short description" error={E.short_description} className="md:col-span-2" hint="One or two lines shown on listing cards.">
          <input maxLength={300} value={values.short_description} onChange={(e) => set("short_description", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Full description" error={E.description} className="md:col-span-2">
          <textarea rows={6} value={values.description} onChange={(e) => set("description", e.target.value)} className={inputCls} />
        </Field>
        {propertyId && (
          <Field label="Web address (slug)" error={E.slug} className="md:col-span-2" hint="Changing this changes the listing's URL. Leave as is unless you must.">
            <input value={values.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} />
          </Field>
        )}
        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={values.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />
          Featured — show on the homepage and at the top of listings
        </label>
      </Section>

      <Section title="Price">
        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={values.price_on_request} onChange={(e) => set("price_on_request", e.target.checked)} />
          Price on request (hide the amount)
        </label>
        {!values.price_on_request && (
          <Field label={isRent ? (values.rent_period === "ANNUAL" ? "Rent per year (LKR)" : "Rent per month (LKR)") : values.price_basis === "PER_PERCH" && isLand ? "Price per perch (LKR)" : "Price (LKR)"} required error={E.price_lkr}>
            <input type="number" min={0} value={values.price_lkr} onChange={(e) => set("price_lkr", e.target.value)} className={inputCls} />
          </Field>
        )}
        {!isRent && isLand && !values.price_on_request && (
          <Field label="Price is quoted">
            <select value={values.price_basis} onChange={(e) => set("price_basis", e.target.value as any)} className={inputCls}>
              <option value="TOTAL">For the whole property</option>
              <option value="PER_PERCH">Per perch</option>
            </select>
          </Field>
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={values.is_negotiable} onChange={(e) => set("is_negotiable", e.target.checked)} />
          Negotiable
        </label>
        {isRent && (
          <>
            <Field label="Rent period" required error={E.rent_period}>
              <select value={values.rent_period} onChange={(e) => set("rent_period", e.target.value as any)} className={inputCls}>
                <option value="MONTHLY">Monthly</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </Field>
            <Field label="Minimum lease (months)" error={E.minimum_lease_months}>
              <input type="number" min={0} value={values.minimum_lease_months} onChange={(e) => set("minimum_lease_months", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Advance (months)" error={E.advance_months}>
              <input type="number" min={0} value={values.advance_months} onChange={(e) => set("advance_months", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Security deposit (LKR)" error={E.deposit_lkr}>
              <input type="number" min={0} value={values.deposit_lkr} onChange={(e) => set("deposit_lkr", e.target.value)} className={inputCls} />
            </Field>
          </>
        )}
      </Section>

      <Section title="Location" note="Pick the province, then district, then city. If the town isn't listed, add it below.">
        <Field label="Province" required error={E.province_id}>
          <select
            value={values.province_id}
            onChange={(e) => setValues((v) => ({ ...v, province_id: e.target.value, district_id: "", city_id: "" }))}
            className={inputCls}
          >
            <option value="">Select province…</option>
            {tree.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label="District" required error={E.district_id}>
          <select
            value={values.district_id}
            disabled={!values.province_id}
            onChange={(e) => setValues((v) => ({ ...v, district_id: e.target.value, city_id: "" }))}
            className={inputCls}
          >
            <option value="">Select district…</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </Field>
        <Field label="City / town" required error={E.city_id}>
          <select value={values.city_id} disabled={!values.district_id} onChange={(e) => set("city_id", e.target.value)} className={inputCls}>
            <option value="">{values.district_id && cities.length === 0 ? "No towns yet — add one →" : "Select city…"}</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Add a town to this district">
          <div className="flex gap-2">
            <input
              value={newTown}
              disabled={!values.district_id}
              onChange={(e) => setNewTown(e.target.value)}
              placeholder="Town name"
              className={inputCls}
            />
            <button type="button" onClick={addTown} disabled={!values.district_id || newTown.trim().length < 2 || addingTown} className="btn-outline shrink-0 disabled:opacity-50">
              {addingTown ? "Adding…" : "Add"}
            </button>
          </div>
        </Field>
        <Field label="Street address" className="md:col-span-2" error={E.address_line}>
          <input value={values.address_line} onChange={(e) => set("address_line", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Latitude" required error={E.latitude} hint="In Google Maps, right-click the spot and click the coordinates to copy them.">
          <input type="number" step="any" value={values.latitude} onChange={(e) => set("latitude", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Longitude" required>
          <input type="number" step="any" value={values.longitude} onChange={(e) => set("longitude", e.target.value)} className={inputCls} />
        </Field>
        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={values.show_exact_location} onChange={(e) => set("show_exact_location", e.target.checked)} />
          Show the exact map pin publicly (otherwise the location is approximated)
        </label>
      </Section>

      <Section title={isLand ? "Land details" : "Size & building"}>
        {isLand ? (
          <>
            <Field label="Land extent (perches)" required error={E.land_extent_perches}>
              <input type="number" min={0} step="any" value={values.land_extent_perches} onChange={(e) => set("land_extent_perches", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Land type" error={E.land_type}>
              <EnumSelect value={values.land_type} onChange={(v) => set("land_type", v)} options={[["RESIDENTIAL", "Residential"], ["AGRICULTURAL", "Agricultural"], ["COMMERCIAL", "Commercial"], ["BEACHFRONT", "Beachfront"], ["HILLSIDE", "Hillside"], ["SUBDIVISION_PLOT", "Subdivision plot"]]} />
            </Field>
            <Field label="Land shape" error={E.land_shape} hint="e.g. Rectangular, Corner lot">
              <input maxLength={40} value={values.land_shape} onChange={(e) => set("land_shape", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Road frontage (ft)" error={E.frontage_ft}>
              <input type="number" min={0} value={values.frontage_ft} onChange={(e) => set("frontage_ft", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Road access width (ft)" error={E.road_access_ft}>
              <input type="number" min={0} value={values.road_access_ft} onChange={(e) => set("road_access_ft", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Road surface" error={E.road_surface}>
              <EnumSelect value={values.road_surface} onChange={(v) => set("road_surface", v)} options={[["CARPETED", "Carpeted"], ["CONCRETE", "Concrete"], ["GRAVEL", "Gravel"], ["NONE", "None"]]} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Built area (sq ft)" required error={E.built_area_sqft}>
              <input type="number" min={0} value={values.built_area_sqft} onChange={(e) => set("built_area_sqft", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Land extent (perches)" error={E.land_extent_perches}>
              <input type="number" min={0} step="any" value={values.land_extent_perches} onChange={(e) => set("land_extent_perches", e.target.value)} className={inputCls} />
            </Field>
            {isHouse && (
              <>
                <Field label="Bedrooms" required error={E.bedrooms}>
                  <input type="number" min={0} value={values.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Bathrooms" error={E.bathrooms}>
                  <input type="number" min={0} value={values.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className={inputCls} />
                </Field>
              </>
            )}
            <Field label="Floors" error={E.floors}>
              <input type="number" min={0} value={values.floors} onChange={(e) => set("floors", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Parking spaces" error={E.parking_spaces}>
              <input type="number" min={0} value={values.parking_spaces} onChange={(e) => set("parking_spaces", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Year built" error={E.year_built}>
              <input type="number" value={values.year_built} onChange={(e) => set("year_built", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Condition" error={E.condition}>
              <EnumSelect value={values.condition} onChange={(v) => set("condition", v)} options={[["NEW", "New"], ["USED", "Used"], ["SEMI_FINISHED", "Semi-finished"], ["UNDER_CONSTRUCTION", "Under construction"]]} />
            </Field>
            <Field label="Furnishing" error={E.furnishing}>
              <EnumSelect value={values.furnishing} onChange={(v) => set("furnishing", v)} options={[["UNFURNISHED", "Unfurnished"], ["SEMI_FURNISHED", "Semi-furnished"], ["FULLY_FURNISHED", "Fully furnished"]]} />
            </Field>
            {values.category === "COMMERCIAL" && (
              <Field label="A/C ready">
                <TriSelect value={values.ac_ready} onChange={(v) => set("ac_ready", v)} />
              </Field>
            )}
          </>
        )}
      </Section>

      <Section title="Utilities & legal">
        <Field label="Electricity available">
          <TriSelect value={values.has_electricity} onChange={(v) => set("has_electricity", v)} />
        </Field>
        <Field label="Water source" error={E.water_source}>
          <EnumSelect value={values.water_source} onChange={(v) => set("water_source", v)} options={[["MAINS", "Mains"], ["WELL", "Well"], ["BOTH", "Mains & well"], ["NONE", "None"]]} />
        </Field>
        <Field label="Solar power">
          <TriSelect value={values.has_solar} onChange={(v) => set("has_solar", v)} />
        </Field>
        <Field label="Boundary wall">
          <TriSelect value={values.has_boundary_wall} onChange={(v) => set("has_boundary_wall", v)} />
        </Field>
        <Field label="Deed type" error={E.deed_type}>
          <EnumSelect value={values.deed_type} onChange={(v) => set("deed_type", v)} options={[["CLEAR_DEED", "Clear deed"], ["BIM_SAVIYA", "Bim Saviya"], ["LEASEHOLD", "Leasehold"], ["OTHER", "Other"]]} />
        </Field>
        <Field label="Deed note" error={E.deed_note} hint="Optional, max 255 characters">
          <input maxLength={255} value={values.deed_note} onChange={(e) => set("deed_note", e.target.value)} className={inputCls} />
        </Field>
      </Section>

      {amenities.length > 0 && (
        <section className="border border-stone-line bg-stone-paper p-5">
          <h2 className="font-display text-base text-ink">Amenities</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
            {amenities.map((a) => (
              <label key={a.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={values.amenity_ids.includes(a.id)}
                  onChange={(e) => set("amenity_ids", e.target.checked ? [...values.amenity_ids, a.id] : values.amenity_ids.filter((x) => x !== a.id))}
                />
                {a.name}
              </label>
            ))}
          </div>
        </section>
      )}

      <Section title="Video & SEO" note="All optional.">
        <Field label="Video link (YouTube / Vimeo)" error={E.video_url} className="md:col-span-2">
          <input value={values.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://" className={inputCls} />
        </Field>
        <Field label="SEO title (max 60)" error={E.meta_title}>
          <input maxLength={60} value={values.meta_title} onChange={(e) => set("meta_title", e.target.value)} className={inputCls} />
        </Field>
        <Field label="SEO description (max 160)" error={E.meta_description}>
          <input maxLength={160} value={values.meta_description} onChange={(e) => set("meta_description", e.target.value)} className={inputCls} />
        </Field>
      </Section>

      <div className="sticky bottom-0 -mx-1 flex items-center gap-3 border-t border-stone-line bg-white/95 px-1 py-4 backdrop-blur">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? "Saving…" : propertyId ? "Save changes" : "Create draft"}
        </button>
        <button type="button" onClick={() => router.push("/admin/properties")} className="text-sm underline">
          Back to list
        </button>
      </div>
    </form>
  );
}
