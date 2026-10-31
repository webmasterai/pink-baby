"use client";

import { useEffect, useState } from "react";
import { Field, inputClass } from "@/components/admin/StructuredDocForm";
import {
  btnPrimary,
  Card,
  Loading,
  Notice,
  PageHead,
  readJson,
} from "@/components/admin/AdminUi";
import { apiFetch } from "@/lib/client-fetch";

type Profile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
};

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await apiFetch("/api/admin/cms/profile");
    const data = await readJson<{ profile?: Profile }>(res);
    if (!res.ok || !data.profile) {
      setError(data.error || "Could not load profile");
      return;
    }
    setProfile(data.profile);
    setName(data.profile.name);
    setPhone(data.profile.phone || "");
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveProfile() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await apiFetch("/api/admin/cms/profile", {
        method: "PUT",
        json: { name, phone },
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not save profile");
      setOk("Profile updated.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await apiFetch("/api/admin/cms/profile/password", {
        method: "PUT",
        json: { currentPassword, newPassword, confirmPassword },
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not change password");
      setOk("Password changed. Other sessions were signed out.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not change password");
    } finally {
      setBusy(false);
    }
  }

  if (!profile && !error) return <Loading />;

  return (
    <div className="space-y-5">
      <PageHead
        title="My Profile & Security"
        description="Update your staff profile and password. Existing passwords are never shown."
      />
      <Notice error={error} ok={ok} />

      <Card title="Profile">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Email">
            <input className={inputClass} value={profile?.email || ""} disabled />
          </Field>
          <Field label="Role">
            <input className={inputClass} value={profile?.role || ""} disabled />
          </Field>
          <Field label="Display name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <button type="button" className={btnPrimary} disabled={busy} onClick={() => void saveProfile()}>
            Save profile
          </button>
        </div>
      </Card>

      <Card
        title="Change password"
        description="Enter your current password, then a new password (min 10 characters, letters and numbers). Other devices will be signed out."
      >
        <div className="grid max-w-lg gap-4">
          <Field label="Current password">
            <input
              className={inputClass}
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
          <Field label="New password">
            <input
              className={inputClass}
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirm new password">
            <input
              className={inputClass}
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showPw}
              onChange={(e) => setShowPw(e.target.checked)}
            />
            Show passwords
          </label>
          <button
            type="button"
            className={btnPrimary}
            disabled={busy}
            onClick={() => void changePassword()}
          >
            Update password
          </button>
        </div>
      </Card>
    </div>
  );
}
