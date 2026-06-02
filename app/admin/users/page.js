"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { defaultCourseContents } from "../../lib/course-content";
import "../admin.css";

function formatModuleTitle(moduleId) {
  const course = defaultCourseContents[moduleId];
  return course?.title || moduleId.toUpperCase();
}

function formatScore(value) {
  if (value === null) return "—";
  return `${value.toFixed(1)}/10`;
}

function calcStats(scores) {
  if (scores.length === 0) {
    return {
      latest: null,
      average: null,
      highest: null,
      lowest: null,
      attempts: 0,
    };
  }

  const latest = scores[scores.length - 1] ?? null;
  const sum = scores.reduce((a, b) => a + b, 0);
  const average = sum / scores.length;
  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);

  return { latest, average, highest, lowest, attempts: scores.length };
}

const avatarColors = [
  "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
];

function getAvatarStyle(name) {
  const code = (name || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return { background: avatarColors[code % avatarColors.length] };
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [performance, setPerformance] = useState(null);
  const [performanceError, setPerformanceError] = useState("");

  async function fetchUsers() {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async (id) => {
    const confirmDelete = confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    await fetch(`/api/users/${id}`, {
      method: "DELETE",
    });

    fetchUsers(); // refresh list after delete
  };

  async function openPerformance(user) {
    setSelectedUser(user);
    setLoadingPerformance(true);
    setPerformance(null);
    setPerformanceError("");

    try {
      const res = await fetch(`/api/progress?email=${encodeURIComponent(user.email)}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        setPerformanceError("Failed to load performance.");
        return;
      }

      setPerformance(data.performance || {});
    } catch {
      setPerformanceError("Failed to load performance.");
    } finally {
      setLoadingPerformance(false);
    }
  }

  const selectedModuleIds = useMemo(() => {
    if (!performance) return [];
    const modules = Object.keys(performance);
    const defaults = Object.keys(defaultCourseContents);
    return Array.from(new Set([...defaults, ...modules])).sort();
  }, [performance]);

  return (
    <div className="admin-main">
      <div className="admin-container">
        
        {/* Premium Header Card */}
        <div className="admin-header-card">
          <div className="admin-header-left">
            <span className="admin-header-pre">Admin Panel</span>
            <h1 className="admin-header-title">
              User Management
              <span className="badge-counter">{users.length}</span>
            </h1>
            <p className="admin-header-desc">
              Monitor registered user accounts, view their course and quiz progress performance, or delete profiles from the training system.
            </p>
          </div>
          <div>
            <Link href="/admin" className="admin-btn secondary" style={{ gap: "0.5rem" }}>
              ← Back to Admin
            </Link>
          </div>
        </div>

        {/* User Table Grid */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-th">User Profile</th>
                <th className="admin-th">Email Address</th>
                <th className="admin-th" style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id?.toString() || user.email} className="admin-tr">
                  <td className="admin-td">
                    <div className="user-profile-flex">
                      <div 
                        className="user-avatar-circle" 
                        style={getAvatarStyle(user.name)}
                      >
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="user-name-title">{user.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="admin-td">
                    <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#475569" }}>
                      {user.email}
                    </span>
                  </td>
                  <td className="admin-td" style={{ textAlign: "right" }}>
                    <div className="admin-list-actions" style={{ justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => openPerformance(user)}
                        className="admin-btn primary"
                        style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                      >
                        Performance
                      </button>

                      <button
                        onClick={() => deleteUser(user._id)}
                        className="admin-btn danger"
                        style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="admin-td" style={{ textAlign: "center", color: "#64748b", padding: "3rem 1.5rem" }}>
                    No registered users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Performance & Progress Modal */}
        {selectedUser && (
          <div className="admin-modal-backdrop">
            <div className="admin-modal-content">
              <div className="admin-modal-header">
                <div>
                  <h2 className="admin-modal-title">
                    Performance Details
                  </h2>
                  <p className="admin-modal-subtitle">
                    Learner: <strong>{selectedUser.name}</strong> ({selectedUser.email})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setPerformance(null);
                    setPerformanceError("");
                  }}
                  className="admin-btn secondary"
                  style={{ padding: "0.5rem 1rem" }}
                >
                  ✕ Close
                </button>
              </div>

              <div className="admin-modal-body">
                {loadingPerformance && (
                  <div style={{ padding: "3rem 0", textAlign: "center", color: "#64748b" }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>Loading progress metrics...</span>
                  </div>
                )}
                {performanceError && (
                  <p className="xss-error-text" style={{ padding: "1rem", backgroundColor: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "0.5rem" }}>
                    {performanceError}
                  </p>
                )}

                {!loadingPerformance && !performanceError && performance && (
                  <div className="perf-details-container">
                    {selectedModuleIds.map((moduleId) => {
                      const modulePerf = performance[moduleId] || {};
                      const quizLevels = modulePerf.quizzes?.levels || {};
                      const overallQuizAttempts = modulePerf.quizzes?.overallAttempts || 0;
                      const labsPerf = modulePerf.labs || {};
                      const labs = defaultCourseContents[moduleId]?.labs || [];
                      const levelIds = Object.keys(quizLevels).sort();

                      return (
                        <div key={moduleId} className="perf-module-card">
                          <div className="perf-module-header">
                            <div>
                              <h3 className="perf-module-title">
                                {formatModuleTitle(moduleId)}
                              </h3>
                              <p className="perf-module-id">Module: {moduleId}</p>
                            </div>
                            <div className="perf-module-attempts">
                              Total Quiz Attempts: {overallQuizAttempts}
                            </div>
                          </div>

                          <div className="perf-sections-grid">
                            {/* Quiz Stats */}
                            <section className="perf-sub-card">
                              <h4 className="perf-section-title">Quizzes</h4>

                              {levelIds.length === 0 ? (
                                <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b", fontStyle: "italic" }}>
                                  No quiz attempts recorded.
                                </p>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                  {levelIds.map((levelId) => {
                                    const scores =
                                      quizLevels[levelId]?.attempts?.map((a) => a.scoreOutOfTen) || [];
                                    const stats = calcStats(scores);

                                    return (
                                      <div
                                        key={levelId}
                                        style={{
                                          backgroundColor: "#ffffff",
                                          border: "1px solid #e2e8f0",
                                          borderRadius: "0.5rem",
                                          padding: "1rem"
                                        }}
                                      >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                          <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 800, color: "#1e293b" }}>
                                            Level: {levelId}
                                          </p>
                                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", backgroundColor: "#f1f5f9", padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>
                                            Attempts: {stats.attempts}
                                          </span>
                                        </div>

                                        <div className="perf-stat-grid-2x2">
                                          <div className="perf-stat-box">
                                            <div className="perf-stat-val">{formatScore(stats.latest)}</div>
                                            <div className="perf-stat-lbl">Latest</div>
                                          </div>
                                          <div className="perf-stat-box">
                                            <div className="perf-stat-val">{formatScore(stats.average)}</div>
                                            <div className="perf-stat-lbl">Average</div>
                                          </div>
                                          <div className="perf-stat-box">
                                            <div className="perf-stat-val">{formatScore(stats.highest)}</div>
                                            <div className="perf-stat-lbl">Highest</div>
                                          </div>
                                          <div className="perf-stat-box">
                                            <div className="perf-stat-val">{formatScore(stats.lowest)}</div>
                                            <div className="perf-stat-lbl">Lowest</div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </section>

                            {/* Lab Statuses */}
                            <section className="perf-sub-card">
                              <h4 className="perf-section-title">Lab Simulator Labs</h4>

                              {labs.length === 0 ? (
                                <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b", fontStyle: "italic" }}>
                                  No labs configured for this module.
                                </p>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                  {labs.map((lab) => {
                                    const perf = labsPerf[lab.id];
                                    const attempts = perf?.attempts?.length || 0;
                                    const completed = Boolean(perf?.completedAt);
                                    const attempted = attempts > 0;
                                    const status = completed
                                      ? "Completed"
                                      : attempted
                                        ? "Attempted"
                                        : "Unattempted";

                                    return (
                                      <div key={lab.id} className="perf-item-row">
                                        <div style={{ minWidth: 0 }}>
                                          <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {lab.title}
                                          </p>
                                          <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.7rem", color: "#64748b", fontFamily: "monospace" }}>
                                            ID: {lab.id}
                                          </p>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                                          <span className={`status-badge-inline ${status.toLowerCase()}`}>
                                            {status}
                                          </span>
                                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                            ({attempts} tries)
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </section>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
