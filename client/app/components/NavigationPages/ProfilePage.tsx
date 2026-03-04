"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuthToken } from "../../lib/auth";

type ProfileData = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  createdAt: string;
  _count?: {
    tasks?: number;
    journalEntries?: number;
  };
};

function normalizeBaseUrl(rawUrl: string | undefined, fallbackUrl: string, protocol: "http" | "https" = "https") {
  const value = (rawUrl || "").trim();
  const fallback = (fallbackUrl || "").trim();
  const resolved = value || fallback;

  if (!resolved) return "";

  const withProtocol = /^https?:\/\//i.test(resolved)
    ? resolved
    : `${protocol}://${resolved}`;

  return withProtocol.replace(/\/+$/, "");
}

const API_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL, "http://localhost:4000", "https");

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const joinedDate = useMemo(() => {
    if (!profile?.createdAt) return "-";
    return new Date(profile.createdAt).toLocaleDateString();
  }, [profile?.createdAt]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = getAuthToken();
        if (!token) {
          throw new Error("Please log in to view your profile.");
        }

        const response = await fetch(`${API_URL}/api/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load profile.");
        }

        const data = (await response.json()) as ProfileData;
        setProfile(data);
        setNewEmail(data.email || "");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess(null);
    setError(null);

    if (!newEmail.trim()) {
      setError("New email is required.");
      return;
    }

    if (!emailPassword) {
      setError("Enter your current password to verify email change.");
      return;
    }

    try {
      setEmailSaving(true);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(`${API_URL}/api/users/account`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: emailPassword,
          newEmail: newEmail.trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update email.");
      }

      if (payload?.user?.email) {
        setProfile((prev) => (prev ? { ...prev, email: payload.user.email } : prev));
        setNewEmail(payload.user.email);
      }

      setEmailPassword("");
      setSuccess("Email updated successfully.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to update email.");
    } finally {
      setEmailSaving(false);
    }
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess(null);
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setPasswordSaving(true);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(`${API_URL}/api/users/account`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated successfully.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to update password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Profile settings</h1>
          <p className="mt-1 text-sm text-stone-600">Manage your account details and keep your credentials secure.</p>
        </header>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">Account overview</h2>
            {loading ? (
              <p className="mt-3 text-sm text-stone-500">Loading profile...</p>
            ) : profile ? (
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <InfoItem label="Name" value={`${profile.firstName} ${profile.lastName}`} />
                <InfoItem label="Email" value={profile.email} />
                <InfoItem label="Joined" value={joinedDate} />
                <InfoItem label="Tasks" value={String(profile._count?.tasks || 0)} />
                <InfoItem label="Journal entries" value={String(profile._count?.journalEntries || 0)} />
              </dl>
            ) : (
              <p className="mt-3 text-sm text-stone-500">Profile unavailable.</p>
            )}
          </section>

          <section className="space-y-6">
            <form
              onSubmit={updateEmail}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-stone-900">Change email</h2>
              <p className="mt-1 text-xs text-stone-500">Verification required: enter your current password.</p>

              <div className="mt-4 space-y-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  placeholder="New email"
                  required
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
                />
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(event) => setEmailPassword(event.target.value)}
                  placeholder="Current password"
                  required
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={emailSaving || loading}
                className="mt-4 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {emailSaving ? "Updating..." : "Update email"}
              </button>
            </form>

            <form
              onSubmit={updatePassword}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-stone-900">Change password</h2>
              <p className="mt-1 text-xs text-stone-500">Use a strong password with at least 6 characters.</p>

              <div className="mt-4 space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Current password"
                  required
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={passwordSaving || loading}
                className="mt-4 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {passwordSaving ? "Updating..." : "Update password"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
      <dt className="text-xs uppercase tracking-[0.14em] text-stone-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-stone-900">{value}</dd>
    </div>
  );
}
