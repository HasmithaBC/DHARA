"use client";

import { useEffect, useState } from "react";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export default function ProfilePage() {
  const guard = useRoleGuard(["SALES_MANAGER", "CONTENT_EDITOR", "ADMINISTRATOR"]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    adminJSON<UserProfile>("/me")
      .then((data) => {
        setProfile(data);
        setName(data.name || "");
      })
      .catch((e) => {
        setNameMsg({ type: "error", text: e.message || "Failed to load profile" });
      });
  }, []);

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg(null);
    if (!name.trim()) {
      setNameMsg({ type: "error", text: "Name cannot be empty" });
      return;
    }
    setNameLoading(true);
    try {
      await adminJSON("/me", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      setNameMsg({ type: "success", text: "Profile name updated successfully" });
      if (profile) setProfile({ ...profile, name: name.trim() });
    } catch (err: any) {
      setNameMsg({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setNameLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    if (!currentPassword) {
      setPwdMsg({ type: "error", text: "Please enter your current password" });
      return;
    }
    if (newPassword.length < 8) {
      setPwdMsg({ type: "error", text: "New password must be at least 8 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "error", text: "New passwords do not match" });
      return;
    }

    setPwdLoading(true);
    try {
      await adminJSON("/me/password", {
        method: "PATCH",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setPwdMsg({ type: "success", text: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwdMsg({ type: "error", text: err.message || "Failed to change password" });
    } finally {
      setPwdLoading(false);
    }
  }

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink">My Profile</h1>
        <p className="text-xs text-ink-soft mt-1">Manage your account information and password</p>
      </div>

      <div className="space-y-6 text-sm">
        {/* Profile Info Form */}
        <div className="border border-stone-line bg-stone-paper p-6 shadow-sm">
          <h2 className="font-display text-base text-ink mb-4">Account Details</h2>

          {nameMsg && (
            <div
              className={`mb-4 p-3 text-xs rounded border ${
                nameMsg.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {nameMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">Email Address</label>
              <input
                type="text"
                disabled
                value={profile?.email || ""}
                className="w-full border border-stone-line bg-stone-fog px-3 py-2 text-ink-soft cursor-not-allowed"
              />
              <span className="text-[11px] text-ink-soft mt-1 block">
                Role: <span className="font-medium text-ink">{profile?.role?.replace("_", " ")}</span>
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-stone-line px-3 py-2 text-ink focus:outline-none focus:border-ink"
              />
            </div>

            <button
              type="submit"
              disabled={nameLoading}
              className="px-5 py-2 bg-ink text-stone-paper text-xs font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
            >
              {nameLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="border border-stone-line bg-stone-paper p-6 shadow-sm">
          <h2 className="font-display text-base text-ink mb-1">Change Password</h2>
          <p className="text-xs text-ink-soft mb-4">Choose a strong password with at least 8 characters</p>

          {pwdMsg && (
            <div
              className={`mb-4 p-3 text-xs rounded border ${
                pwdMsg.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {pwdMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-stone-line px-3 py-2 text-ink focus:outline-none focus:border-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-stone-line px-3 py-2 text-ink focus:outline-none focus:border-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-stone-line px-3 py-2 text-ink focus:outline-none focus:border-ink"
              />
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="px-5 py-2 bg-ink text-stone-paper text-xs font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
            >
              {pwdLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
