"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearUserProfile, getProfileInitials, useUserProfile } from "../../lib/user-profile";
import "./admin-topbar.css";

function getTitleFromPath(pathname) {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/users")) return "Manage Users";
  if (pathname.startsWith("/admin/quizzes")) return "Manage Quizzes";
  if (pathname.startsWith("/admin/courses")) return "Manage Courses";
  if (pathname.startsWith("/admin/labs")) return "Manage Labs";
  return "Admin";
}

export default function AdminTopbar() {
  const pathname = usePathname();
  const title = getTitleFromPath(pathname);
  const profile = useUserProfile();
  const initials = getProfileInitials(profile);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  function handleLogout() {
    clearUserProfile();
    setOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-wrapper">
        <div>
          <h1 className="admin-topbar-title">{title}</h1>
          <p className="admin-topbar-subtitle">
            Admin workspace
          </p>
        </div>

        <div className="admin-topbar-actions">
          <Link
            href="/"
            className="btn-secondary"
          >
            View Site
          </Link>

          <div className="dropdown-container" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={open}
              className="profile-btn"
            >
              <span className="profile-name">
                {profile.name}
              </span>
              <span
                className="profile-avatar"
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
              <div
                role="menu"
                className="admin-dropdown"
              >
                <div className="dropdown-header">
                  <div className="dropdown-name">
                    {profile.name}
                  </div>
                  <div className="dropdown-email">
                    {profile.email}
                  </div>
                </div>

                <div className="dropdown-body">
                  <Link
                    href="/profile"
                    className="dropdown-link"
                    onClick={() => setOpen(false)}
                  >
                    View Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="dropdown-link"
                    onClick={() => setOpen(false)}
                  >
                    Edit Profile
                  </Link>
                  <Link
                    href="/login"
                    className="dropdown-link logout"
                    onClick={handleLogout}
                  >
                    Logout
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
