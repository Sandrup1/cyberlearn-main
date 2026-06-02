"use client";

import { useMemo, useState } from "react";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import { defaultCourseContents } from "../lib/course-content";
import { usePerformanceData } from "../learn/progress-state";
import "./performance.css";

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

  const latest = scores[scores.length - 1];
  const sum = scores.reduce((a, b) => a + b, 0);
  const average = sum / scores.length;
  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);

  return {
    latest,
    average,
    highest,
    lowest,
    attempts: scores.length,
  };
}

export default function PerformanceInsightsPage() {
  const performance = usePerformanceData();

  const moduleIds = useMemo(() => {
    const fromData = Object.keys(performance || {});
    const fromDefaults = Object.keys(defaultCourseContents || {});
    return Array.from(new Set([...fromDefaults, ...fromData])).sort();
  }, [performance]);

  const [selectedModuleId, setSelectedModuleId] = useState("");

  const selected = useMemo(() => {
    if (selectedModuleId && moduleIds.includes(selectedModuleId)) {
      return selectedModuleId;
    }
    return moduleIds[0] || null;
  }, [selectedModuleId, moduleIds]);

  return (
    <div className="insights-container">
      <Sidebar />

      <div className="main-wrapper">
        <Navbar />

        <main className="insights-main">
          <div className="card">
            <div className="card-header">
              <div>
                <h1 className="card-title">
                  Performance Insights
                </h1>
                <p className="card-subtitle">
                  Quiz and lab performance per module.
                </p>
              </div>

              <div className="select-wrapper">
                <span className="select-label">
                  View module
                </span>
                <select
                  value={selected || ""}
                  onChange={(event) => setSelectedModuleId(event.target.value)}
                  className="module-select"
                >
                  {moduleIds.map((moduleId) => (
                    <option key={moduleId} value={moduleId}>
                      {formatModuleTitle(moduleId)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {!selected ? (
            <div className="card">
              <p className="empty-text">No modules available.</p>
            </div>
          ) : (() => {
              const moduleId = selected;
              const modulePerf = performance[moduleId] || {};
              const course = defaultCourseContents[moduleId];
              const quizLevels = modulePerf.quizzes?.levels || {};
              const overallQuizAttempts = modulePerf.quizzes?.overallAttempts || 0;
              const labsPerf = modulePerf.labs || {};
              const labs = course?.labs || [];

              const levelIds = Object.keys(quizLevels).sort();

              return (
                <div className="card">
                  <div className="module-header">
                    <div>
                      <h2 className="module-title">
                        {formatModuleTitle(moduleId)}
                      </h2>
                      <p className="module-subtitle">
                        Module id: {moduleId}
                      </p>
                    </div>
                    <div className="attempts-badge">
                      Quiz attempts: {overallQuizAttempts}
                    </div>
                  </div>

                  <div className="sections-container">
                    <section className="section-box">
                      <h3 className="section-title">
                        Quizzes
                      </h3>

                      {levelIds.length === 0 ? (
                        <p className="empty-text">
                          No quiz attempts recorded for this module yet.
                        </p>
                      ) : (
                        <div className="items-list">
                          {levelIds.map((levelId) => {
                            const attempts =
                              quizLevels[levelId]?.attempts?.map((a) => a.scoreOutOfTen) || [];
                            const stats = calcStats(attempts);

                            return (
                              <div
                                key={levelId}
                                className="item-card"
                              >
                                <div className="item-header">
                                  <p className="item-title">
                                    Level: {levelId}
                                  </p>
                                  <span className="item-subtitle">
                                    Attempts: {stats.attempts}
                                  </span>
                                </div>

                                <div className="stats-grid">
                                  <div>
                                    <span className="stats-label">Latest:</span>{" "}
                                    {formatScore(stats.latest)}
                                  </div>
                                  <div>
                                    <span className="stats-label">Average:</span>{" "}
                                    {formatScore(stats.average)}
                                  </div>
                                  <div>
                                    <span className="stats-label">Highest:</span>{" "}
                                    {formatScore(stats.highest)}
                                  </div>
                                  <div>
                                    <span className="stats-label">Lowest:</span>{" "}
                                    {formatScore(stats.lowest)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    <section className="section-box">
                      <h3 className="section-title">
                        Labs
                      </h3>

                      {labs.length === 0 ? (
                        <p className="empty-text">
                          No labs configured for this module.
                        </p>
                      ) : (
                        <div className="items-list">
                          {labs.map((lab) => {
                            const perf = labsPerf[lab.id];
                            const attempts = perf?.attempts?.length || 0;
                            const completed = Boolean(perf?.completedAt);
                            const attempted = attempts > 0;
                            const status = completed
                              ? "Completed"
                              : attempted
                                ? "Attempted (not completed)"
                                : "Not attempted";

                            const statusClass = completed
                              ? "status-completed"
                              : attempted
                                ? "status-attempted"
                                : "status-not-attempted";

                            return (
                              <div
                                key={lab.id}
                                className="item-card"
                              >
                                <div className="lab-item-header">
                                  <div className="lab-info">
                                    <p className="lab-title">
                                      {lab.title}
                                    </p>
                                    <p className="lab-id-text">
                                      Lab id:{" "}
                                      <span className="font-mono">{lab.id}</span>
                                    </p>
                                  </div>
                                  <span className={`status-badge ${statusClass}`}>
                                    {status}
                                  </span>
                                </div>

                                <div className="lab-stats">
                                  <span className="stats-label">Attempts:</span>{" "}
                                  {attempts}
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
            })()}
        </main>
      </div>
    </div>
  );
}