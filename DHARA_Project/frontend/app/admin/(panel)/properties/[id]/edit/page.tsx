"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PropertyForm, { PropertyFormValues, propertyToFormValues } from "@/components/admin/PropertyForm";
import MediaManager from "@/components/admin/MediaManager";
import PublishBar from "@/components/admin/PublishBar";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

export default function EditPropertyPage() {
  // In Next 15/16 a client page must read route params with useParams(), not the `params` prop.
  const { id } = useParams<{ id: string }>();
  const guard = useRoleGuard(["SALES_MANAGER", "ADMINISTRATOR"]);
  const [property, setProperty] = useState<any>(null);
  const [initial, setInitial] = useState<Partial<PropertyFormValues> | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const p = await adminJSON<any>(`/properties/${id}`);
      setProperty(p);
      setInitial((prev) => prev ?? propertyToFormValues(p)); // the form keeps its own state after first load
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    if (guard.status === "allowed" && id) load();
  }, [guard.status, id, load]);

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  const images = property?.images ?? [];

  return (
    <div className="p-8">
      <Link href="/admin/properties" className="text-xs underline">← All properties</Link>
      <h1 className="mt-2 font-display text-2xl text-ink">
        Edit Property {property?.reference_code && <span className="ml-2 text-sm text-ink-soft">{property.reference_code}</span>}
      </h1>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {!property && !error && <p className="mt-4 text-sm text-ink-soft">Loading…</p>}

      {property && initial && (
        <div className="mt-6 space-y-6">
          <PublishBar
            propertyId={id}
            status={property.status}
            category={property.category}
            slug={property.slug}
            imageCount={images.length}
            missingAlt={images.filter((i: any) => !i.alt_text).length}
            hasCover={images.some((i: any) => i.is_cover)}
            onChange={load}
          />
          <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
            <PropertyForm propertyId={id} initial={initial} onSaved={load} />
            <MediaManager
              propertyId={id}
              propertyTitle={property.title}
              images={images}
              documents={property.documents ?? []}
              onChange={load}
            />
          </div>
        </div>
      )}
    </div>
  );
}
