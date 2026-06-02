"use client";

import { useEffect, useState } from "react";
import "./admin.css";

export default function AdminDashboard() {
  const [usersCount, setUsersCount] = useState(0);
  const [modulesCount, setModulesCount] = useState(0);
  const [labsCount, setLabsCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setError("");
      try {
        const [usersRes, contentRes] = await Promise.all([
          fetch("/api/users", { cache: "no-store" }),
          fetch("/api/admin/content", { cache: "no-store" }),
        ]);

        const usersJson = await usersRes.json();
        const contentJson = await contentRes.json();

        if (!active) return;

        const users = Array.isArray(usersJson) ? usersJson : [];
        const modules = Array.isArray(contentJson) ? contentJson : [];

        setUsersCount(users.length);
        setModulesCount(modules.length);
        setLabsCount(
          modules.reduce((total, module) => {
            const labs = Array.isArray(module.labs) ? module.labs : [];
            return total + labs.length;
          }, 0)
        );

        if (!usersRes.ok || !contentRes.ok) {
          setError("Some admin stats failed to load.");
        }
      } catch {
        if (!active) return;
        setError("Unable to load admin stats.");
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="admin-main">
      <div className="admin-container">
        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <p className="admin-card-pre">
                Summary
              </p>
              <h2 className="admin-card-title">
                Platform Overview
              </h2>
              <p className="admin-card-desc">
                Total users, modules, and labs available in CyberLearn.
              </p>
            </div>
            {error && (
              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#b45309" }}>{error}</p>
            )}
          </div>

          <div className="admin-stats-grid">
            <div className="admin-stat-card indigo">
              <div className="admin-stat-card-glow">
                <div className="admin-stat-card-glow-1" />
                <div className="admin-stat-card-glow-2" />
              </div>
              <div className="admin-stat-card-content">
                <div>
                  <p className="admin-stat-label">
                    Total Users
                  </p>
                  <p className="admin-stat-value">
                    {usersCount}
                  </p>
                </div>
                <p className="admin-stat-desc">
                  Registered accounts
                </p>
              </div>
            </div>

            <div className="admin-stat-card emerald">
              <div className="admin-stat-card-glow">
                <div className="admin-stat-card-glow-1" />
                <div className="admin-stat-card-glow-2" />
              </div>
              <div className="admin-stat-card-content">
                <div>
                  <p className="admin-stat-label">
                    Modules
                  </p>
                  <p className="admin-stat-value">
                    {modulesCount}
                  </p>
                </div>
                <p className="admin-stat-desc">
                  Published + draft content modules
                </p>
              </div>
            </div>

            <div className="admin-stat-card amber">
              <div className="admin-stat-card-glow">
                <div className="admin-stat-card-glow-1" />
                <div className="admin-stat-card-glow-2" />
              </div>
              <div className="admin-stat-card-content">
                <div>
                  <p className="admin-stat-label">
                    Labs
                  </p>
                  <p className="admin-stat-value">
                    {labsCount}
                  </p>
                </div>
                <p className="admin-stat-desc">
                  Editable lab entries
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
