"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getProfileInitials,
  saveUserProfile,
  useUserProfile,
} from "../lib/user-profile";
import "./profile.css";

export default function ProfilePage() {
  const router = useRouter();
  const profile = useUserProfile();
  const fileInputRef = useRef(null);
  const [photoMessage, setPhotoMessage] = useState("");

  const initials = getProfileInitials(profile);

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoMessage("Please choose an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoMessage("Choose an image under 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      saveUserProfile({ photoDataUrl: String(reader.result || "") });
      setPhotoMessage("Profile photo updated.");
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    saveUserProfile({ photoDataUrl: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setPhotoMessage("Profile photo removed.");
  }

  return (
    <main className="profile-main">
      <div className="profile-container">
        <button
          onClick={() => router.back()}
          className="back-button"
        >
          <span aria-hidden="true">‹</span>
          Back
        </button>

        <div className="profile-header">
          <div>
            <p className="profile-header-tag">
              Account
            </p>
            <h1 className="profile-header-title">Profile</h1>
            <p className="profile-header-desc">
              Manage your identity and learning account information.
            </p>
          </div>

          <Link
            href="/settings"
            className="btn-dark"
          >
            Edit Settings
          </Link>
        </div>

        <section className="profile-card">
          <div className="profile-card-body">
            <div
              className="avatar-upload-trigger"
              style={
                profile.photoDataUrl
                  ? { backgroundImage: `url(${profile.photoDataUrl})` }
                  : undefined
              }
              aria-label={`${profile.name} profile photo`}
            >
              {!profile.photoDataUrl && initials}
            </div>

            <div className="profile-info">
              <h2 className="profile-name">
                {profile.name}
              </h2>
              <p className="profile-email">{profile.email}</p>
              <div className="profile-badges">
                <span className="badge badge-blue">
                  {profile.title}
                </span>
                <span className="badge badge-emerald">
                  Active learner
                </span>
              </div>
            </div>

            <div className="photo-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-upload"
              >
                Upload Photo
              </button>
              {profile.photoDataUrl && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="btn-remove"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>

          {photoMessage && (
            <p className="photo-message">{photoMessage}</p>
          )}
        </section>

        <section className="stats-grid">
          {[
            ["Full Name", profile.name],
            ["Email", profile.email],
            ["Role", profile.role],
            ["Organization", profile.organization],
            ["Timezone", profile.timezone],
            ["Member Since", profile.memberSince],
          ].map(([label, value]) => (
            <div
              key={label}
              className="stat-card"
            >
              <p className="stat-label">
                {label}
              </p>
              <p className="stat-value">
                {value}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

