"use client";

import { useEffect, useState } from "react";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

interface User { id: string; name: string; email: string; role: string; is_active: boolean; last_login_at?: string; }

export default function UsersAdminPage() {
  const guard = useRoleGuard(["ADMINISTRATOR"]);
  const [rows, setRows] = useState<User[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "SALES_MANAGER" });
  const [error, setError] = useState("");

  async function load() {
    try {
      setRows(await adminJSON<User[]>("/users"));
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminJSON("/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", password: "", role: "SALES_MANAGER" });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function deactivate(id: string) {
    await adminJSON(`/users/${id}`, { method: "DELETE" });
    load();
  }

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl text-ink">Users</h1>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-stone-line border border-stone-line bg-stone-paper">
          {rows.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <div className="font-medium text-ink">{u.name} {!u.is_active && <span className="ml-2 text-xs text-red-700">(deactivated)</span>}</div>
                <div className="text-xs text-ink-soft">{u.email} · {u.role.replace("_", " ")}</div>
              </div>
              {u.is_active && <button onClick={() => deactivate(u.id)} className="text-xs text-red-700">Deactivate</button>}
            </div>
          ))}
        </div>
        <form onSubmit={create} className="h-fit space-y-3 border border-stone-line bg-stone-paper p-5 text-sm">
          <h2 className="font-display text-base text-ink">New User</h2>
          <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <input required type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-stone-line px-3 py-2">
            <option value="SALES_MANAGER">Sales Manager</option>
            <option value="CONTENT_EDITOR">Content Editor</option>
            <option value="ADMINISTRATOR">Administrator</option>
          </select>
          <button type="submit" className="btn-primary w-full justify-center">Create User</button>
        </form>
      </div>
    </div>
  );
}
