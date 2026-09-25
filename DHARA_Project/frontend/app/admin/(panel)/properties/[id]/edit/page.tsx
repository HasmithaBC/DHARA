"use client";

import React, { useEffect, useState } from "react";
import PropertyForm, { PropertyFormValues } from "@/components/admin/PropertyForm";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const guard = useRoleGuard(["SALES_MANAGER", "ADMINISTRATOR"]);
  const unwrappedParams = React.use(params);
  const [initial, setInitial] = useState<Partial<PropertyFormValues> | null>(null);
  const [error, setError] = useState("");

  const PROVINCE_ID_MAP: Record<number, string> = {
    1: "Western", 2: "Central", 3: "Southern", 4: "Northern", 5: "Eastern",
    6: "North Western", 7: "North Central", 8: "Uva", 9: "Sabaragamuwa"
  };
  const DISTRICT_ID_MAP: Record<number, string> = {
    1: "Colombo", 2: "Gampaha", 3: "Kalutara",
    4: "Kandy", 5: "Matale", 6: "Nuwara Eliya",
    7: "Galle", 8: "Matara", 9: "Hambantota",
    10: "Jaffna", 11: "Kilinochchi", 12: "Mannar", 13: "Vavuniya", 14: "Mullaitivu",
    15: "Batticaloa", 16: "Ampara", 17: "Trincomalee",
    18: "Kurunegala", 19: "Puttalam",
    20: "Anuradhapura", 21: "Polonnaruwa",
    22: "Badulla", 23: "Moneragala",
    24: "Ratnapura", 25: "Kegalle"
  };


  useEffect(() => {
    adminJSON<any>(`/properties/${unwrappedParams.id}`)
      .then((p) => {
        setInitial({
          reference_code: p.reference_code || "",
          title: p.title || "",
          slug: p.slug || "",
          category: p.category || "HOUSE",
          listing_type: p.listing_type || "SALE",
          short_description: p.short_description || "",
          description: p.description || "",
          price_lkr: p.price_lkr?.toString() ?? "",
          price_on_request: p.price_on_request || false,
          price_unit: p.price_unit ?? "TOTAL",
          is_negotiable: p.is_negotiable || false,
          rent_period: p.rent_period ?? "MONTHLY",
          minimum_lease_months: p.minimum_lease_months?.toString() ?? "",
          advance_months: p.advance_months?.toString() ?? "",
          deposit_lkr: p.deposit_lkr?.toString() ?? "",

          province: p.province_id ? PROVINCE_ID_MAP[p.province_id] || "" : "",
          district: p.district_id ? DISTRICT_ID_MAP[p.district_id] || "" : "",
          city: p.city ?? "",
          address_line: p.address_line ?? "",
          map_url: p.map_url || "",
          latitude: p.latitude?.toString() ?? "7.0",
          longitude: p.longitude?.toString() ?? "80.0",
          show_exact_location: p.show_exact_location || false,

          land_area_unit: p.land_area_unit ?? "PERCHES",
          land_area_count: p.land_area_count?.toString() ?? "",
          road_access: p.road_access || false,
          road_width_ft: p.road_width_ft?.toString() ?? "",
          road_surface: p.road_surface || "",
          land_shape: p.land_shape || "",
          frontage_ft: p.frontage_ft?.toString() ?? "",
          land_type: p.land_type || "",

          built_area_sqft: p.built_area_sqft?.toString() ?? "",
          bedrooms: p.bedrooms?.toString() ?? "",
          bathrooms: p.bathrooms?.toString() ?? "",
          floor_count: p.floor_count?.toString() ?? "",
          parking_spaces: p.parking_spaces?.toString() ?? "",
          year_built: p.year_built?.toString() ?? "",
          furnishing: p.furnishing || "",
          condition: p.condition || "",

          is_featured: p.is_featured || false,

          has_electricity: p.has_electricity || "",
          water_source: p.water_source || "",
          deed_type: p.deed_type || "",
          deed_note: p.deed_note || "",

          features: {
            has_boundary_wall: p.has_boundary_wall || false,
            has_solar: p.has_solar || false,
            ac_ready: p.ac_ready || false,
            beachfront_sea_view: p.beachfront_sea_view || false,
            waterfront_riverside: p.waterfront_riverside || false,
            hillside: p.hillside || false,
            paddy_front: p.paddy_front || false,
            lake_front: p.lake_front || false,
            indoor_garden: p.indoor_garden || false,
            garage: p.garage || false,
            swimming_pool: p.swimming_pool || false,
            gated_community: p.gated_community || false,
            roof_top_garden: p.roof_top_garden || false,
            lawn_garden: p.lawn_garden || false,
            luxury_specification: p.luxury_specification || false,
            security_24_hours: p.security_24_hours || false,
            colonial_architecture: p.colonial_architecture || false,
            maids_room: p.maids_room || false,
            infinity_pool: p.infinity_pool || false,
            home_security_system: p.home_security_system || false,
            maids_toilet: p.maids_toilet || false,
            hot_water: p.hot_water || false,
            overhead_water_tank: p.overhead_water_tank || false,
            attached_toilets: p.attached_toilets || false,
            permits_for_gem_mining: p.permits_for_gem_mining || false,
            soil_test_passed: p.soil_test_passed || false,
            hilly_landscape: p.hilly_landscape || false,
            ideal_for_commercial_use: p.ideal_for_commercial_use || false,
            lake_pond_inside_land: p.lake_pond_inside_land || false,
            bungalow_cottage_type: p.bungalow_cottage_type || false,
            stream_running_through_land: p.stream_running_through_land || false,
            approved_survey_plan: p.approved_survey_plan || false
          },

          cover_image: p.cover_url || "",
          video_url: p.video_url || "",
          google_drive_url: p.google_drive_url || "",
          gallery: p.images ? p.images.filter((img: any) => !img.is_cover).map((img: any) => ({ url: img.url, caption: img.caption || "" })) : [],
          meta_title: p.meta_title || "",
          meta_description: p.meta_description || "",
          documents: (p.documents || []).map((d: any) => ({
            ...d,
            document_type: d.type
          }))
        });
      })
      .catch((e) => setError(e.message));
  }, [unwrappedParams.id]);

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl text-ink flex items-baseline gap-2">
        Edit Property
        {initial && (
          <span className="text-stone-500 text-base font-medium font-sans">
            - {initial.reference_code} | {initial.title}
          </span>
        )}
      </h1>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-6">
        {initial && <PropertyForm propertyId={unwrappedParams.id} initial={initial} />}
      </div>
    </div>
  );
}
