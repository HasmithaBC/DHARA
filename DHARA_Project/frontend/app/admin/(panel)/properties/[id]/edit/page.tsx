"use client";

import { useEffect, useState } from "react";
import PropertyForm, { PropertyFormValues } from "@/components/admin/PropertyForm";
import MediaManager from "@/components/admin/MediaManager";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  const guard = useRoleGuard(["SALES_MANAGER", "ADMINISTRATOR"]);
  const [initial, setInitial] = useState<Partial<PropertyFormValues> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminJSON<any>(`/properties/${params.id}`)
      .then((p) =>
        setInitial({
          title: p.title,
          category: p.category,
          listing_type: p.listing_type,
          short_description: p.short_description,
          description: p.description,
          price_lkr: p.price_lkr?.toString() ?? "",
          price_on_request: p.price_on_request,
          price_unit: p.price_unit ?? "TOTAL",
          is_negotiable: p.is_negotiable,
          rent_period: p.rent_period ?? "MONTHLY",
          advance_months: p.advance_months?.toString() ?? "",
          deposit_lkr: p.deposit_lkr?.toString() ?? "",
          province_id: p.province_id?.toString() ?? "1",
          district_id: p.district_id?.toString() ?? "1",
          city_id: p.city_id?.toString() ?? "1",
          latitude: p.latitude?.toString() ?? "7.0",
          longitude: p.longitude?.toString() ?? "80.0",
          show_exact_location: p.show_exact_location,
          land_extent_perches: p.land_extent_perches?.toString() ?? "",
          built_area_sqft: p.built_area_sqft?.toString() ?? "",
          bedrooms: p.bedrooms?.toString() ?? "",
          bathrooms: p.bathrooms?.toString() ?? "",
          is_featured: p.is_featured,
        })
      )
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl text-ink">Edit Property</h1>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
        {initial && <PropertyForm propertyId={params.id} initial={initial} />}
        <MediaManager propertyId={params.id} />
      </div>
    </div>
  );
}
