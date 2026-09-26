"use client";

// Client-side mirror of the RBAC matrix in SRS §5.9 / backend router.go. This is a UX
// layer only — the authoritative enforcement is the backend's RequireRole middleware
// (FR-ADM-002 explicitly requires API-level enforcement, not just a hidden UI). This
// guard exists so a role that lacks access to a page is redirected with a clear message
// instead of landing on a page that silently 403s on every request.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRole, getToken } from "@/lib/admin-api";

export type AdminRole = "SALES_MANAGER" | "CONTENT_EDITOR" | "ADMINISTRATOR";

export const ADMIN_NAV: { href: string; label: string; roles: AdminRole[] }[] = [
  { href: "/admin/dashboard", label: "Dashboard", roles: ["SALES_MANAGER", "ADMINISTRATOR"] },
  { href: "/admin/properties", label: "Properties", roles: ["SALES_MANAGER", "ADMINISTRATOR"] },
  { href: "/admin/leads", label: "Leads", roles: ["SALES_MANAGER", "ADMINISTRATOR"] },
  { href: "/admin/services", label: "Services", roles: ["CONTENT_EDITOR", "ADMINISTRATOR"] },
  { href: "/admin/projects", label: "Projects", roles: ["CONTENT_EDITOR", "ADMINISTRATOR"] },
  { href: "/admin/testimonials", label: "Testimonials", roles: ["CONTENT_EDITOR", "ADMINISTRATOR"] },
  { href: "/admin/settings", label: "Settings", roles: ["ADMINISTRATOR"] },
  { href: "/admin/users", label: "Users", roles: ["ADMINISTRATOR"] },
  { href: "/admin/audit-log", label: "Audit Log", roles: ["ADMINISTRATOR"] },
  { href: "/admin/profile", label: "My Profile", roles: ["SALES_MANAGER", "CONTENT_EDITOR", "ADMINISTRATOR"] },
];

/** First page a given role lands on after login / when redirected away from a denied page. */
export function homeForRole(role: string | null): string {
  const first = ADMIN_NAV.find((n) => !role || n.roles.includes(role as AdminRole));
  return first?.href ?? "/admin/dashboard";
}

type GuardState = { status: "checking" | "allowed" | "denied"; role: string | null };

/**
 * Call at the top of any admin page that should be restricted to specific roles.
 * Redirects to /admin (no token) or to a page the current role CAN see (wrong role),
 * after a brief "Access denied" flash so the redirect doesn't feel silent.
 */
export function useRoleGuard(allowedRoles: AdminRole[]): GuardState {
  const router = useRouter();
  const [state, setState] = useState<GuardState>({ status: "checking", role: null });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/admin");
      return;
    }
    const role = getRole();
    if (role && allowedRoles.includes(role as AdminRole)) {
      setState({ status: "allowed", role });
      return;
    }
    setState({ status: "denied", role });
    const t = setTimeout(() => router.replace(homeForRole(role)), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}

/** Drop-in "Access denied" block shown while the redirect above is pending. */
export function AccessDenied({ role }: { role: string | null }) {
  return (
    <div className="p-8 text-sm">
      <div className="border border-red-200 bg-red-50 p-4 text-red-800">
        Your role{role ? ` (${role.replace("_", " ")})` : ""} doesn't have access to this page.
        Taking you back to a page you can view…
      </div>
    </div>
  );
}
