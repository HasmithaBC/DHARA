"use client";

import PropertyForm from "@/components/admin/PropertyForm";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

export default function NewPropertyPage() {
  const guard = useRoleGuard(["SALES_MANAGER", "ADMINISTRATOR"]);
  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl text-ink">New Property</h1>
      <p className="mt-1 text-sm text-ink-soft">Saved as a draft — publish once at least 3 images with alt text are added.</p>
      <div className="mt-6">
        <PropertyForm />
      </div>
    </div>
  );
}
