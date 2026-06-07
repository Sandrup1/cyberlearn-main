"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useUserProfile } from "../lib/user-profile";
import "./sidebar.css";

export default function Sidebar() {
  const profile = useUserProfile();
  const [modulesOpen, setModulesOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      setLoading(true);
      try {
        const res = await fetch("/api/courses", { cache: "no-store" });
        const data = await res.json();
        if (!active || !res.ok) return;
        setCourses(Array.isArray(data) ? data : []);
      } catch {
        if (!active) return;
        setCourses([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCourses();

    return () => {
      active = false;
    };
  }, []);

  const courseLinks = useMemo(() => {
    return [...courses]
      .sort((a, b) => (a.shortTitle || a.title).localeCompare(b.shortTitle || b.title))
      .map((course) => ({
        moduleId: course.moduleId,
        label: course.shortTitle || course.title || course.moduleId.toUpperCase(),
        href: `/learn/${course.moduleId}`,
      }));
  }, [courses]);

  return (
    <div className="sidebar">
      <h1 className="sidebar-brand">CyberLearn</h1>

      <div className="sidebar-menu">
        <Link href="/dashboard" className="sidebar-link">
          <div className="sidebar-link-btn primary">
            📊 Dashboard
          </div>
        </Link>

        {profile.role === "Admin" && (
          <Link href="/admin" className="sidebar-link">
            <div className="sidebar-link-btn" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)", color: "white" }}>
              ⚙️ Admin Panel
            </div>
          </Link>
        )}

        <Link href="/performance-insights" className="sidebar-link">
          <div className="sidebar-link-btn secondary">
            🧠 Performance Insights
          </div>
        </Link>

        <div>
          <button
            type="button"
            onClick={() => setModulesOpen((open) => !open)}
            className="sidebar-collapse-btn"
          >
            View all modules {modulesOpen ? "▴" : "▾"}
          </button>

          {modulesOpen && (
            <div className="modules-list">
              {loading && (
                <div className="loading-text">
                  Loading…
                </div>
              )}

              {!loading && courseLinks.length === 0 && (
                <div className="empty-text">
                  No modules available.
                </div>
              )}

              {courseLinks.map((course) => (
                <Link key={course.moduleId} href={course.href} className="sidebar-link">
                  <div className="module-link-item">
                    {course.label}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
