"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminJSON } from "@/lib/admin-api";

export interface PropertyFormValues {
  title: string;
  category: "LAND" | "HOUSE" | "COMMERCIAL";
  listing_type: "SALE" | "RENT";
  short_description: string;
  description: string;
  price_lkr: string;
  price_on_request: boolean;
  price_unit: string;
  is_negotiable: boolean;
  rent_period: string;
  advance_months: string;
  deposit_lkr: string;
  province_id: string;
  district_id: string;
  city_id: string;
  latitude: string;
  longitude: string;
  show_exact_location: boolean;
  land_extent_perches: string;
  built_area_sqft: string;
  bedrooms: string;
  bathrooms: string;
  is_featured: boolean;
}

const empty: PropertyFormValues = {
  title: "", category: "HOUSE", listing_type: "SALE", short_description: "", description: "",
  price_lkr: "", price_on_request: false, price_unit: "TOTAL", is_negotiable: false,
  rent_period: "MONTHLY", advance_months: "", deposit_lkr: "",
  province_id: "1", district_id: "1", city_id: "1", latitude: "7.0", longitude: "80.0",
  show_exact_location: false, land_extent_perches: "", built_area_sqft: "", bedrooms: "", bathrooms: "",
  is_featured: false,
};

export default function PropertyForm({
  propertyId,
  initial,
}: {
  propertyId?: string;
  initial?: Partial<PropertyFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<PropertyFormValues>({ ...empty, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof PropertyFormValues>(key: K, val: PropertyFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function toPayload() {
    return {
      title: values.title,
      category: values.category,
      listing_type: values.listing_type,
      short_description: values.short_description,
      description: values.description,
      price_lkr: values.price_lkr ? Number(values.price_lkr) : null,
      price_on_request: values.price_on_request,
      price_unit: values.price_unit,
      is_negotiable: values.is_negotiable,
      rent_period: values.listing_type === "RENT" ? values.rent_period : null,
      advance_months: values.advance_months ? Number(values.advance_months) : null,
      deposit_lkr: values.deposit_lkr ? Number(values.deposit_lkr) : null,
      province_id: Number(values.province_id),
      district_id: Number(values.district_id),
      city_id: Number(values.city_id),
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      show_exact_location: values.show_exact_location,
      land_extent_perches: values.category === "LAND" && values.land_extent_perches ? Number(values.land_extent_perches) : null,
      built_area_sqft: values.category !== "LAND" && values.built_area_sqft ? Number(values.built_area_sqft) : null,
      bedrooms: values.bedrooms ? Number(values.bedrooms) : null,
      bathrooms: values.bathrooms ? Number(values.bathrooms) : null,
      is_featured: values.is_featured,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      if (propertyId) {
        await adminJSON(`/properties/${propertyId}`, { method: "PATCH", body: JSON.stringify(toPayload()) });
        router.push("/admin/properties");
      } else {
        const res = await adminJSON<{ id: string }>("/properties", { method: "POST", body: JSON.stringify(toPayload()) });
        router.push(`/admin/properties/${res.id}/edit`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save property");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-8 text-sm">
      {error && <div className="border border-red-300 bg-red-50 p-3 text-red-700">{error}</div>}

      <section className="border border-stone-line bg-stone-paper p-5">
        <h2 className="font-display text-base text-ink">Basic</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ink-soft">Title (10–160 chars)</span>
            <input required minLength={10} maxLength={160} value={values.title} onChange={(e) => set("title", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Category</span>
            <select value={values.category} onChange={(e) => set("category", e.target.value as any)} className="w-full border border-stone-line px-3 py-2">
              <option value="LAND">Land</option>
              <option value="HOUSE">House</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Listing Type</span>
            <select value={values.listing_type} onChange={(e) => set("listing_type", e.target.value as any)} className="w-full border border-stone-line px-3 py-2">
              <option value="SALE">Sale</option>
              <option value="RENT">Rent</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ink-soft">Short Description (max 300 chars)</span>
            <textarea required maxLength={300} rows={2} value={values.short_description} onChange={(e) => set("short_description", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ink-soft">Description</span>
            <textarea rows={5} value={values.description} onChange={(e) => set("description", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={values.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />
            <span className="text-xs text-ink-soft">Featured on homepage</span>
          </label>
        </div>
      </section>

      <section className="border border-stone-line bg-stone-paper p-5">
        <h2 className="font-display text-base text-ink">Pricing</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" checked={values.price_on_request} onChange={(e) => set("price_on_request", e.target.checked)} />
            <span className="text-xs text-ink-soft">Price on request</span>
          </label>
          {!values.price_on_request && (
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">Price (LKR)</span>
              <input type="number" min={1} value={values.price_lkr} onChange={(e) => set("price_lkr", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Price Unit</span>
            <select value={values.price_unit} onChange={(e) => set("price_unit", e.target.value)} className="w-full border border-stone-line px-3 py-2">
              <option value="TOTAL">Total</option>
              <option value="PER_PERCH">Per Perch</option>
              <option value="PER_MONTH">Per Month</option>
              <option value="PER_YEAR">Per Year</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={values.is_negotiable} onChange={(e) => set("is_negotiable", e.target.checked)} />
            <span className="text-xs text-ink-soft">Negotiable</span>
          </label>

          {values.listing_type === "RENT" && (
            <>
              <label className="block">
                <span className="mb-1 block text-xs text-ink-soft">Rent Period</span>
                <select value={values.rent_period} onChange={(e) => set("rent_period", e.target.value)} className="w-full border border-stone-line px-3 py-2">
                  <option value="MONTHLY">Monthly</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-ink-soft">Advance (months)</span>
                <input type="number" value={values.advance_months} onChange={(e) => set("advance_months", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-ink-soft">Deposit (LKR)</span>
                <input type="number" value={values.deposit_lkr} onChange={(e) => set("deposit_lkr", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
              </label>
            </>
          )}
        </div>
      </section>

      <section className="border border-stone-line bg-stone-paper p-5">
        <h2 className="font-display text-base text-ink">Location</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Province ID</span>
            <input type="number" value={values.province_id} onChange={(e) => set("province_id", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">District ID</span>
            <input type="number" value={values.district_id} onChange={(e) => set("district_id", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">City ID</span>
            <input type="number" value={values.city_id} onChange={(e) => set("city_id", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Latitude</span>
            <input value={values.latitude} onChange={(e) => set("latitude", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Longitude</span>
            <input value={values.longitude} onChange={(e) => set("longitude", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={values.show_exact_location} onChange={(e) => set("show_exact_location", e.target.checked)} />
            <span className="text-xs text-ink-soft">Show exact pin</span>
          </label>
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          Location is entered by ID for this reference build — swap for the cascading Province → District → City
          pickers (populated from <code>GET /locations</code>) in the full admin build-out.
        </p>
      </section>

      <section className="border border-stone-line bg-stone-paper p-5">
        <h2 className="font-display text-base text-ink">Specifications</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {values.category === "LAND" ? (
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">Land Extent (Perches)</span>
              <input type="number" step="0.01" value={values.land_extent_perches} onChange={(e) => set("land_extent_perches", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
            </label>
          ) : (
            <>
              <label className="block">
                <span className="mb-1 block text-xs text-ink-soft">Built Area (sq ft)</span>
                <input type="number" value={values.built_area_sqft} onChange={(e) => set("built_area_sqft", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
              </label>
              {values.category === "HOUSE" && (
                <>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Bedrooms</span>
                    <input type="number" value={values.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Bathrooms</span>
                    <input type="number" value={values.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                  </label>
                </>
              )}
            </>
          )}
        </div>
      </section>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : propertyId ? "Save Changes" : "Create Draft"}
        </button>
      </div>
    </form>
  );
}
