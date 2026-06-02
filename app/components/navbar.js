"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import "./navbar.css";
import { clearUserProfile, getProfileInitials, useUserProfile } from "../lib/user-profile";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const profile = useUserProfile();

  const initials = getProfileInitials(profile);

  function handleLogout() {
    clearUserProfile();
    setOpen(false);
  }

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="navbar">

      <div className="navbar-right">
        <Link href="/dashboard" className="navbar-link">
          Home
        </Link>
        <Link href="/learn" className="navbar-link">
          Learn
        </Link>

        {/* Profile Dropdown */}
        <div className="profile-container" ref={dropdownRef}>
          <button
            type="button"
            className="profile-trigger"
            onClick={() => setOpen(!open)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <span className="profile-name">{profile.name}</span>
            <span
              className="profile"
              style={
                profile.photoDataUrl
                  ? { backgroundImage: `url(${profile.photoDataUrl})` }
                  : undefined
              }
              aria-hidden="true"
            >
              {!profile.photoDataUrl && initials}
            </span>
          </button>

          {open && (
            <div className="dropdown" role="menu">
              <div className="dropdown-user">
                <strong>{profile.name}</strong>
                <span>{profile.email}</span>
              </div>
              <Link href="/profile" className="dropdown-item">
                My Profile
              </Link>

              <Link href="/settings" className="dropdown-item">
                Settings
              </Link>
              {profile.role === "Admin" && (
                <Link href="/admin" className="dropdown-item" style={{ fontWeight: "600", color: "#4f46e5" }} onClick={() => setOpen(false)}>
                  ⚙️ Admin Panel
                </Link>
              )}
              <Link href="/login" className="dropdown-item logout" onClick={handleLogout}>
                Logout
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
