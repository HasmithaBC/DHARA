"use client";

import { useEffect, useState } from "react";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";
import { useToast } from "@/components/Toast";

const DEFAULT_WHY = [
  { title: "15+ Years in Operation", body: "A track record spanning civil works, MEP, tower foundations and property development across Sri Lanka." },
  { title: "End-to-End Capability", body: "From land acquisition and design through to construction, fit-out and handover — one accountable team." },
  { title: "Direct From Developer", body: "Every listing is Dhara-built or Dhara-owned — no intermediaries, no third-party commissions." },
];

const inputCls = "w-full border border-stone-line px-3 py-2";

function parse<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function SettingsPage() {
  const guard = useRoleGuard(["ADMINISTRATOR"]);
  const toast = useToast();
  const [contact, setContact] = useState({ phone: "", whatsapp: "", email: "", address: "", hours: "" });
  const [social, setSocial] = useState({ facebook: "", linkedin: "", instagram: "", pinterest: "" });
  const [stats, setStats] = useState({ years_experience: "15", completed_projects: "120", trusted_clients: "300" });
  const [why, setWhy] = useState(DEFAULT_WHY);
  const [usdRate, setUsdRate] = useState("300");
  const [salesInbox, setSalesInbox] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (guard.status !== "allowed") return;
    adminJSON<Record<string, string>>("/settings")
      .then((s) => {
        setContact((c) => ({ ...c, ...parse(s.contact, {}) }));
        setSocial((c) => ({ ...c, ...parse(s.social, {}) }));
        const hs = parse<any>(s.homepage_stats, null);
        if (hs) {
          setStats({
            years_experience: String(hs.years_experience ?? 15),
            completed_projects: String(hs.completed_projects ?? 120),
            trusted_clients: String(hs.trusted_clients ?? 300),
          });
        }
        const w = parse<any[]>(s.why_dhara, []);
        if (Array.isArray(w) && w.length > 0) setWhy(w.map((x) => ({ title: x.title ?? "", body: x.body ?? "" })));
        setUsdRate(String(parse<any>(s.usd_rate, { rate: 300 }).rate ?? 300));
        setSalesInbox(parse<any>(s.notifications, {}).sales_inbox ?? "");
      })
      .catch((e) => setError(e.message));
  }, [guard.status]);

  async function save() {
    const rate = Number(usdRate);
    if (!rate || rate <= 0) {
      toast.error("Enter a valid USD exchange rate");
      return;
    }
    setSaving(true);
    try {
      await adminJSON("/settings", {
        method: "PATCH",
        body: JSON.stringify({
          contact,
          social,
          homepage_stats: {
            years_experience: Number(stats.years_experience) || 0,
            completed_projects: Number(stats.completed_projects) || 0,
            trusted_clients: Number(stats.trusted_clients) || 0,
          },
          why_dhara: why.filter((w) => w.title.trim() || w.body.trim()),
          usd_rate: { rate, updated_manually: true },
          notifications: { sales_inbox: salesInbox },
        }),
      });
      setError("");
      toast.success("Settings saved — the website shows them on the next page load.");
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="max-w-2xl p-8">
      <h1 className="font-display text-2xl text-ink">Site Settings</h1>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-6 space-y-6 text-sm">
        <section className="border border-stone-line bg-stone-paper p-5">
          <h2 className="font-display text-base text-ink">Contact Details</h2>
          <p className="mt-1 text-xs text-ink-soft">Shown across the whole site: top bar, footer, contact page, property pages, call and WhatsApp buttons.</p>
          <div className="mt-3 space-y-3">
            <input placeholder="Phone" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={inputCls} />
            <input placeholder="WhatsApp number, e.g. 94763774551 (blank = use the phone number)" value={contact.whatsapp} onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })} className={inputCls} />
            <input placeholder="Email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={inputCls} />
            <input placeholder="Address" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} className={inputCls} />
            <input placeholder="Opening hours, e.g. Mon – Sat, 8:30am – 5:30pm" value={contact.hours} onChange={(e) => setContact({ ...contact, hours: e.target.value })} className={inputCls} />
          </div>
        </section>

        <section className="border border-stone-line bg-stone-paper p-5">
          <h2 className="font-display text-base text-ink">Social Links</h2>
          <p className="mt-1 text-xs text-ink-soft">Full https:// addresses. Empty ones are hidden on the website.</p>
          <div className="mt-3 space-y-3">
            {(["facebook", "linkedin", "instagram", "pinterest"] as const).map((k) => (
              <input key={k} placeholder={`${k[0].toUpperCase()}${k.slice(1)} URL`} value={social[k]} onChange={(e) => setSocial({ ...social, [k]: e.target.value })} className={inputCls} />
            ))}
          </div>
        </section>

        <section className="border border-stone-line bg-stone-paper p-5">
          <h2 className="font-display text-base text-ink">Homepage Stats</h2>
          <p className="mt-1 text-xs text-ink-soft">The “Properties Available” figure is counted automatically from published listings.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block text-xs text-ink-soft">Years of experience
              <input type="number" min={0} value={stats.years_experience} onChange={(e) => setStats({ ...stats, years_experience: e.target.value })} className={`${inputCls} mt-1`} />
            </label>
            <label className="block text-xs text-ink-soft">Completed projects
              <input type="number" min={0} value={stats.completed_projects} onChange={(e) => setStats({ ...stats, completed_projects: e.target.value })} className={`${inputCls} mt-1`} />
            </label>
            <label className="block text-xs text-ink-soft">Trusted clients
              <input type="number" min={0} value={stats.trusted_clients} onChange={(e) => setStats({ ...stats, trusted_clients: e.target.value })} className={`${inputCls} mt-1`} />
            </label>
          </div>
        </section>

        <section className="border border-stone-line bg-stone-paper p-5">
          <h2 className="font-display text-base text-ink">“Why Dhara” Highlights</h2>
          <p className="mt-1 text-xs text-ink-soft">Three short points shown on the homepage.</p>
          <div className="mt-3 space-y-4">
            {why.map((w, i) => (
              <div key={i} className="space-y-2">
                <input placeholder="Title" value={w.title} onChange={(e) => setWhy(why.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} className={inputCls} />
                <textarea rows={2} placeholder="Description" value={w.body} onChange={(e) => setWhy(why.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} className={inputCls} />
              </div>
            ))}
          </div>
        </section>

        <section className="border border-stone-line bg-stone-paper p-5">
          <h2 className="font-display text-base text-ink">USD Exchange Rate</h2>
          <p className="mt-1 text-xs text-ink-soft">Fixed, admin-set rate (LKR per 1 USD) — no live FX feed.</p>
          <input type="number" min={1} step="0.01" value={usdRate} onChange={(e) => setUsdRate(e.target.value)} className={`${inputCls} mt-3`} />
        </section>

        <section className="border border-stone-line bg-stone-paper p-5">
          <h2 className="font-display text-base text-ink">Notifications</h2>
          <label className="mt-2 block text-xs text-ink-soft">Sales inbox (receives every new lead)</label>
          <input value={salesInbox} onChange={(e) => setSalesInbox(e.target.value)} className={`${inputCls} mt-1`} />
        </section>

        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
