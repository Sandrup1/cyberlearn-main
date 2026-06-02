"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearUserProfile,
  saveUserProfile,
  useUserProfile,
} from "../lib/user-profile";
import "./settings.css";

export default function SettingsPage() {
  const router = useRouter();
  const profile = useUserProfile();
  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  function handleProfileSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    saveUserProfile({
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      title: String(formData.get("title") || ""),
      organization: String(formData.get("organization") || ""),
      timezone: String(formData.get("timezone") || ""),
    });
    setMessage("Account settings saved.");
  }

  function handleToggle(field, value) {
    saveUserProfile({ [field]: value });
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage("Use at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordMessage("Password preferences saved.");
  }

  function handleResetProfile() {
    clearUserProfile();
    setMessage("Local profile data reset.");
  }

  const accountFormKey = [
    profile.name,
    profile.email,
    profile.title,
    profile.organization,
    profile.timezone,
  ].join("|");

  return (
    <main className="settings-main">
      <div className="settings-container">
        <button
          onClick={() => router.back()}
          className="back-button"
        >
          <span aria-hidden="true">‹</span>
          Back
        </button>

        <div className="settings-header">
          <div>
            <p className="settings-header-tag">
              Preferences
            </p>
            <h1 className="settings-header-title">Settings</h1>
            <p className="settings-header-desc">
              Keep your CyberLearn profile, notifications, and account security
              current.
            </p>
          </div>

          <Link
            href="/profile"
            className="btn-secondary"
          >
            View Profile
          </Link>
        </div>

        <div className="settings-layout">
          <div className="settings-pane">
            <section className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title">Account</h2>
                <p className="settings-card-subtitle">
                  Update the information shown across your learning workspace.
                </p>
              </div>

              <form
                key={accountFormKey}
                onSubmit={handleProfileSubmit}
                className="settings-form"
              >
                <div className="form-grid two-cols">
                  <label className="form-label">
                    <span className="form-label-text">
                      Full Name
                    </span>
                    <input
                      name="name"
                      type="text"
                      defaultValue={profile.name}
                      className="form-input"
                    />
                  </label>

                  <label className="form-label">
                    <span className="form-label-text">Email</span>
                    <input
                      name="email"
                      type="email"
                      defaultValue={profile.email}
                      className="form-input"
                    />
                  </label>

                  <label className="form-label">
                    <span className="form-label-text">Title</span>
                    <input
                      name="title"
                      type="text"
                      defaultValue={profile.title}
                      className="form-input"
                    />
                  </label>

                  <label className="form-label">
                    <span className="form-label-text">
                      Organization
                    </span>
                    <input
                      name="organization"
                      type="text"
                      defaultValue={profile.organization}
                      className="form-input"
                    />
                  </label>
                </div>

                <label className="form-label">
                  <span className="form-label-text">Timezone</span>
                  <select
                    name="timezone"
                    defaultValue={profile.timezone}
                    className="form-select"
                  >
                    <option value="Asia/Calcutta">Asia/Calcutta</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Asia/Singapore">Asia/Singapore</option>
                  </select>
                </label>

                <div className="settings-card-footer">
                  <p className="footer-message">{message}</p>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </section>

            <section className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title">Security</h2>
                <p className="settings-card-subtitle">
                  Maintain strong access controls for your account.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="settings-form">
                <div className="form-grid three-cols">
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    placeholder="Current password"
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        currentPassword: event.target.value,
                      }))
                    }
                    className="form-input"
                  />
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    placeholder="New password"
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        newPassword: event.target.value,
                      }))
                    }
                    className="form-input"
                  />
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    placeholder="Confirm password"
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    className="form-input"
                  />
                </div>

                <ToggleRow
                  title="Two-factor authentication"
                  description="Require an additional verification step at sign in."
                  checked={profile.twoFactorEnabled}
                  onChange={(checked) => handleToggle("twoFactorEnabled", checked)}
                />

                <div className="settings-card-footer">
                  <p className="footer-message">
                    {passwordMessage}
                  </p>
                  <button
                    type="submit"
                    className="btn-dark"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </section>
          </div>

          <aside className="settings-sidebar">
            <section className="settings-card">
              <h2 className="settings-card-title">Notifications</h2>
              <div className="toggle-list">
                <ToggleRow
                  title="Email updates"
                  description="Receive important account and course messages."
                  checked={profile.emailNotifications}
                  onChange={(checked) =>
                    handleToggle("emailNotifications", checked)
                  }
                />
                <ToggleRow
                  title="Lab reminders"
                  description="Get nudges for unfinished hands-on labs."
                  checked={profile.labReminders}
                  onChange={(checked) => handleToggle("labReminders", checked)}
                />
                <ToggleRow
                  title="Weekly digest"
                  description="Summarize progress and next recommended modules."
                  checked={profile.weeklyDigest}
                  onChange={(checked) => handleToggle("weeklyDigest", checked)}
                />
              </div>
            </section>

            <section className="settings-card">
              <h2 className="settings-card-title">Profile Photo</h2>
              <p className="settings-card-subtitle" style={{ marginTop: "0.5rem" }}>
                Your photo is managed from your profile page.
              </p>
              <Link
                href="/profile"
                className="sidebar-btn-secondary"
              >
                Manage Photo
              </Link>
            </section>

            <section className="settings-card" style={{ borderColor: "#fca5a5" }}>
              <h2 className="settings-card-title danger">Account Controls</h2>
              <p className="settings-card-subtitle" style={{ marginTop: "0.5rem" }}>
                Reset locally saved profile, photo, and preferences on this device.
              </p>
              <button
                type="button"
                onClick={handleResetProfile}
                className="btn-danger-outline"
              >
                Reset Local Profile
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <label className="toggle-row">
      <span className="toggle-text">
        <span className="toggle-title">{title}</span>
        <span className="toggle-desc">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="toggle-checkbox"
      />
    </label>
  );
}
