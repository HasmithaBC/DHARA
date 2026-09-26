"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearTokens, getRole, getToken } from "@/lib/admin-api";
import { ADMIN_NAV, AdminRole } from "@/lib/admin-guard";
import { useIdleLogout } from "@/lib/use-idle-logout";
import SignOutModal from "@/components/SignOutModal";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRoleState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // FR-ADM-001: sign out after 60 minutes of inactivity.
  useIdleLogout();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/admin");
      return;
    }
    setRoleState(getRole());
    setReady(true);
  }, [router]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink-soft">Loading…</div>;
  }

  const visibleNav = ADMIN_NAV.filter((n) => !role || n.roles.includes(role as AdminRole));

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-stone-line bg-stone-paper">
        <div className="border-b border-stone-line p-5">
          <div className="font-display text-lg text-ink">DHARA</div>
          <div className="text-xs text-ink-soft">{role?.replace("_", " ")}</div>
        </div>
        <nav className="p-3 text-sm">
          {visibleNav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`block px-3 py-2 ${pathname === n.href ? "bg-ink text-stone-paper" : "text-ink hover:bg-stone-fog"}`}
            >
              {n.label}
            </Link>
          ))}
          <button
            onClick={() => setShowSignOutModal(true)}
            className="mt-4 block w-full px-3 py-2 text-left text-ink-soft hover:bg-stone-fog"
          >
            Sign out
          </button>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 bg-stone-fog">{children}</main>

      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={() => {
          clearTokens();
          setShowSignOutModal(false);
          router.replace("/admin");
        }}
      />
    </div>
  );
}
