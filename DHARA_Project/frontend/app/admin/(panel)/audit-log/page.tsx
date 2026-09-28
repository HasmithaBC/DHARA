"use client";

import { useEffect, useState } from "react";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

interface Entry { id: string; user_id?: string; action: string; entity_type: string; entity_id: string; created_at: string; }

export default function AuditLogPage() {
  const guard = useRoleGuard(["ADMINISTRATOR"]);
  const [rows, setRows] = useState<Entry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    adminJSON<Entry[]>("/audit-log").then(setRows).catch((e) => setError(e.message));
  }, []);

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl text-ink">Audit Log</h1>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-6 overflow-x-auto border border-stone-line bg-stone-paper">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-line bg-stone-fog text-xs uppercase text-ink-soft">
            <tr><th className="p-3">When</th><th className="p-3">Action</th><th className="p-3">Entity</th><th className="p-3">Entity ID</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-stone-line">
                <td className="p-3 text-xs text-ink-soft">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3">{r.action}</td>
                <td className="p-3">{r.entity_type}</td>
                <td className="p-3 text-xs">{r.entity_id}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-ink-soft">No audit events yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
