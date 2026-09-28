"use client";

import { useEffect, useState } from "react";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

interface DashboardData {
  new_leads_7d: number;
  new_leads_30d: number;
  closed_won: number;
  closed_lost: number;
  listings_by_status: Record<string, number>;
  top_viewed: { title: string; view_count: number }[];
}

export default function DashboardPage() {
  const guard = useRoleGuard(["SALES_MANAGER", "ADMINISTRATOR"]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminJSON<DashboardData>("/dashboard").then(setData).catch((e) => setError(e.message));
  }, []);

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl text-ink">Dashboard</h1>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {data && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="New Leads (7d)" value={data.new_leads_7d} />
            <Stat label="New Leads (30d)" value={data.new_leads_30d} />
            <Stat label="Closed Won" value={data.closed_won} />
            <Stat label="Closed Lost" value={data.closed_lost} />
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="border border-stone-line bg-stone-paper p-5">
              <h2 className="font-display text-base text-ink">Listings by Status</h2>
              <ul className="mt-3 space-y-1 text-sm">
                {Object.entries(data.listings_by_status || {}).map(([status, count]) => (
                  <li key={status} className="flex justify-between border-b border-stone-line py-1">
                    <span className="text-ink-soft">{status}</span>
                    <span className="text-ink">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-stone-line bg-stone-paper p-5">
              <h2 className="font-display text-base text-ink">Top Viewed Listings</h2>
              <ul className="mt-3 space-y-1 text-sm">
                {(data.top_viewed || []).map((t, i) => (
                  <li key={i} className="flex justify-between border-b border-stone-line py-1">
                    <span className="text-ink-soft">{t.title}</span>
                    <span className="text-ink">{t.view_count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-stone-line bg-stone-paper p-5">
      <div className="font-display text-3xl text-ink">{value}</div>
      <div className="mt-1 text-xs text-ink-soft">{label}</div>
    </div>
  );
}
