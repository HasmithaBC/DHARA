"use client";

import { useEffect, useState } from "react";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_locked?: boolean;
  last_login_at?: string;
}

export default function UsersAdminPage() {
  const guard = useRoleGuard(["ADMINISTRATOR"]);
  const [rows, setRows] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "SALES_MANAGER" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "SALES_MANAGER", is_active: true });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Deactivate User State
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  async function load() {
    try {
      setRows(await adminJSON<User[]>("/users"));
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    adminJSON<{ id: string; email: string }>("/me").then(setCurrentUser).catch(() => {});
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await adminJSON("/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", password: "", role: "SALES_MANAGER" });
      setSuccess("User created successfully");
      setTimeout(() => setSuccess(""), 3000);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  function startEdit(u: User) {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      is_active: u.is_active,
    });
    setEditError("");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditError("");
    setEditLoading(true);
    try {
      await adminJSON(`/users/${editingUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      setEditingUser(null);
      setSuccess("User updated successfully");
      setTimeout(() => setSuccess(""), 3000);
      load();
    } catch (e: any) {
      setEditError(e.message || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  }

  async function confirmDeactivate() {
    if (!deactivatingUser) return;
    setDeactivateLoading(true);
    try {
      await adminJSON(`/users/${deactivatingUser.id}`, { method: "DELETE" });
      setSuccess(`User "${deactivatingUser.name}" was deactivated successfully`);
      setTimeout(() => setSuccess(""), 3000);
      setDeactivatingUser(null);
      load();
    } catch (e: any) {
      setError(e.message || "Failed to deactivate user");
      setDeactivatingUser(null);
    } finally {
      setDeactivateLoading(false);
    }
  }

  async function sendReset(id: string) {
    try {
      await adminJSON(`/users/${id}/send-reset`, { method: "POST" });
      setSuccess("Password reset email sent to user");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">User Management</h1>
          <p className="text-xs text-ink-soft mt-1">Manage staff accounts, assign roles, and edit credentials</p>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs text-red-800 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-xs text-green-800 rounded">{success}</div>}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* User List Table */}
        <div className="divide-y divide-stone-line border border-stone-line bg-stone-paper">
          {rows.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-4 text-sm hover:bg-stone-fog/40 transition-colors">
              <div>
                <div className="font-medium text-ink flex items-center gap-2">
                  <span>{u.name}</span>
                  {!u.is_active && (
                    <span className="text-[10px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded">Deactivated</span>
                  )}
                  {u.is_locked && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">Locked</span>
                  )}
                </div>
                <div className="text-xs text-ink-soft mt-0.5">
                  <span className="font-mono text-ink-soft/90">{u.email}</span> · <span className="font-medium">{u.role.replace("_", " ")}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => startEdit(u)}
                  className="px-2.5 py-1 text-xs font-medium border border-stone-line bg-stone-paper text-ink hover:bg-stone-fog transition-colors rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => sendReset(u.id)}
                  title="Send password reset link"
                  className="text-xs text-ink-soft hover:text-ink transition-colors"
                >
                  Reset PW
                </button>
                {currentUser?.id === u.id ? (
                  <span className="text-[11px] text-ink-soft/70 italic px-1">(You)</span>
                ) : (
                  u.is_active && (
                    <button
                      onClick={() => setDeactivatingUser(u)}
                      className="text-xs text-red-700 hover:text-red-900 transition-colors"
                    >
                      Deactivate
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create New User Form */}
        <form onSubmit={create} className="h-fit space-y-4 border border-stone-line bg-stone-paper p-6 text-sm shadow-sm">
          <h2 className="font-display text-base text-ink">New User</h2>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Full Name</label>
            <input
              required
              placeholder="e.g. Kosala Withanage"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-stone-line px-3 py-2 text-ink focus:outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Work Email</label>
            <input
              required
              type="email"
              placeholder="name@dharact.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-stone-line px-3 py-2 text-ink focus:outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Temporary Password</label>
            <input
              required
              type="password"
              minLength={8}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-stone-line px-3 py-2 text-ink focus:outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-stone-line px-3 py-2 text-ink focus:outline-none focus:border-ink"
            >
              <option value="SALES_MANAGER">Sales Manager</option>
              <option value="CONTENT_EDITOR">Content Editor</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 bg-ink text-stone-paper text-xs font-medium hover:bg-ink/90 transition-colors">
            Create User
          </button>
        </form>
      </div>

      {/* Edit User Modal Dialog */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border border-stone-line bg-stone-paper p-6 shadow-xl rounded-md">
            <h3 className="font-display text-lg text-ink mb-1">Edit Staff User</h3>
            <p className="text-xs text-ink-soft mb-4">Update name, email address, role, or account status</p>

            {editError && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-xs text-red-800 rounded">
                {editError}
              </div>
            )}

            <form onSubmit={saveEdit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Full Name</label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-stone-line px-3 py-2 text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Email Address</label>
                <input
                  required
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border border-stone-line px-3 py-2 text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full border border-stone-line px-3 py-2 text-ink focus:outline-none focus:border-ink"
                >
                  <option value="SALES_MANAGER">Sales Manager</option>
                  <option value="CONTENT_EDITOR">Content Editor</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Account Status</label>
                <select
                  disabled={editingUser.id === currentUser?.id}
                  value={editForm.is_active ? "active" : "inactive"}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === "active" })}
                  className="w-full border border-stone-line px-3 py-2 text-ink focus:outline-none focus:border-ink disabled:bg-stone-fog disabled:cursor-not-allowed"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Deactivated</option>
                </select>
                {editingUser.id === currentUser?.id && (
                  <span className="text-[11px] text-ink-soft mt-1 block">
                    You cannot deactivate your own account.
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-stone-line text-xs font-medium text-ink hover:bg-stone-fog transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 bg-ink text-stone-paper text-xs font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate User Confirmation Modal */}
      {deactivatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm border border-stone-line bg-stone-paper p-6 shadow-2xl rounded-sm">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 border border-red-200 text-red-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="17" y1="8" x2="23" y2="14" />
                  <line x1="23" y1="8" x2="17" y2="14" />
                </svg>
              </div>

              <div className="flex-1">
                <h3 className="font-display text-base text-ink font-semibold">
                  Deactivate User Account?
                </h3>
                <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">
                  Are you sure you want to deactivate <strong className="text-ink font-medium">{deactivatingUser.name}</strong> ({deactivatingUser.email})? They will immediately lose access to the portal.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeactivatingUser(null)}
                disabled={deactivateLoading}
                className="px-3.5 py-1.5 border border-stone-line text-xs font-medium text-ink hover:bg-stone-fog transition-colors rounded-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeactivate}
                disabled={deactivateLoading}
                className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-stone-paper text-xs font-medium transition-colors rounded-sm disabled:opacity-50"
              >
                {deactivateLoading ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
