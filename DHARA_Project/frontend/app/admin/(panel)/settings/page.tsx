"use client";

import { useEffect, useState } from "react";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

export default function SettingsPage() {
  const guard = useRoleGuard(["ADMINISTRATOR"]);
  const [contact, setContact] = useState({ phone: "", email: "", address: "" });
  const [usdRate, setUsdRate] = useState("300");
  const [salesInbox, setSalesInbox] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminJSON<Record<string, string>>("/settings")
      .then((s) => {
        if (s.contact) setContact(JSON.parse(s.contact));
        if (s.usd_rate) setUsdRate(JSON.parse(s.usd_rate).rate?.toString() ?? "300");
        if (s.notifications) setSalesInbox(JSON.parse(s.notifications).sales_inbox ?? "");
      })
      .catch((e) => setError(e.message));
  }, []);

  async function save() {
    try {
      await adminJSON("/settings", {
        method: "PATCH",
        body: JSON.stringify({
          contact,
          usd_rate: { rate: Number(usdRate), updated_manually: true },
          notifications: { sales_inbox: salesInbox },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-2xl text-ink">Site Settings</h1>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-6 space-y-6 text-sm">
        <div className="border border-stone-line bg-stone-paper p-5">
          <h2 className="font-display text-base text-ink">Contact Details</h2>
          <div className="mt-3 space-y-3">
            <input placeholder="Phone" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
            <input placeholder="Email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
            <input placeholder="Address" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          </div>
        </div>
        <div className="border border-stone-line bg-stone-paper p-5">
          <h2 className="font-display text-base text-ink">USD Exchange Rate</h2>
          <p className="mt-1 text-xs text-ink-soft">Fixed, admin-set rate (A06) — no live FX feed.</p>
          <input type="number" value={usdRate} onChange={(e) => setUsdRate(e.target.value)} className="mt-3 w-full border border-stone-line px-3 py-2" />
        </div>
        <div className="border border-stone-line bg-stone-paper p-5">
          <h2 className="font-display text-base text-ink">Notifications</h2>
          <label className="mt-2 block text-xs text-ink-soft">Sales inbox (receives every new lead)</label>
          <input value={salesInbox} onChange={(e) => setSalesInbox(e.target.value)} className="mt-1 w-full border border-stone-line px-3 py-2" />
        </div>
        <button onClick={save} className="btn-primary">Save Settings</button>
        {saved && <span className="ml-3 text-xs text-brass-dark">Saved.</span>}
      </div>
    </div>
  );
}
