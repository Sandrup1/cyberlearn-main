"use client";

import Link from "next/link";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import {
  useOverallProgress,
  useModuleProgressDetails,
  useModuleQuizLevels,
  useRecentActivity,
} from "../learn/progress-state";
import { getDefaultCourseContent } from "../lib/course-content";
import { useMemo, useState } from "react";
import "./dashboard.css";

const dashboardModuleIds = ["sqli", "xss", "csrf", "xxe"];

function formatModuleTitle(moduleId) {
  const course = getDefaultCourseContent(moduleId);
  return course?.title || moduleId.toUpperCase();
}

export default function Dashboard() {
  const overallProgress = useOverallProgress(dashboardModuleIds);
  const moduleDetails = useModuleProgressDetails(dashboardModuleIds);
  const recentActivity = useRecentActivity(6);

  const defaultSelectedModuleId = useMemo(() => {
    const sorted = [...moduleDetails].sort((a, b) =>
      (b.lastVisitedAt || "").localeCompare(a.lastVisitedAt || "")
    );
    return sorted[0]?.moduleId || moduleDetails[0]?.moduleId || "sqli";
  }, [moduleDetails]);

  const [userSelectedModuleId, setUserSelectedModuleId] = useState(null);
  const selectedModuleId = userSelectedModuleId || defaultSelectedModuleId;

  const selectedDetail =
    moduleDetails.find((detail) => detail.moduleId === selectedModuleId) ||
    moduleDetails[0];

  const selectedCourse = selectedDetail
    ? getDefaultCourseContent(selectedDetail.moduleId)
    : null;

  const selectedQuizLevels = useModuleQuizLevels(selectedModuleId);
  const quizLevelOrder = useMemo(() => ["easy", "intermediate", "hard"], []);

  const selectedModuleTitle = selectedDetail
    ? formatModuleTitle(selectedDetail.moduleId)
    : "Module";

  const activeModule = selectedDetail || moduleDetails[0];
  const activeCourse = activeModule ? getDefaultCourseContent(activeModule.moduleId) : null;

  const insightMessage = useMemo(() => {
    if (!selectedDetail) {
      return "";
    }

    const progress = selectedDetail.progress;
    const attempts = progress.quizAttempts ?? 0;
    const scoreOutOfTen = progress.quizScore ?? null;
    const labStarted = progress.labStarted;
    const labCompleted = progress.labCompleted;
    const quizCompleted = progress.quizCompleted;
    const passScore = progress.quizPassScore ?? 6;
    const moduleStarted = Boolean(selectedDetail.startedAt || selectedDetail.lastVisitedAt);

    const passedLevels = quizLevelOrder.filter(
      (levelId) => Boolean(selectedQuizLevels[levelId]?.passed)
    );
    const nextLevelId = quizLevelOrder.find(
      (levelId) => !selectedQuizLevels[levelId]?.passed
    );

    const lastPassedLevelId = passedLevels[passedLevels.length - 1];
    const lastPassedLabel = lastPassedLevelId
      ? lastPassedLevelId === "easy"
        ? "easy"
        : lastPassedLevelId === "intermediate"
        ? "intermediate"
        : "hard"
      : null;
    const nextLevelLabel = nextLevelId
      ? nextLevelId === "easy"
        ? "easy"
        : nextLevelId === "intermediate"
        ? "intermediate"
        : "hard"
      : null;

    // 1. No Activity
    if (attempts === 0 && !labStarted) {
      if (!moduleStarted) {
        return "You haven't started this module yet. Start the module, then take the quiz to test your theory knowledge.";
      }

      return "You've started this module. Next, take the quiz to check your understanding or start the labs to practice.";
    }

    // 2. Quiz Attempted but Failed
    if (scoreOutOfTen !== null && scoreOutOfTen < passScore) {
      if (attempts < 3) {
        return "Your performance in the quiz shows that your understanding is still developing. Try again to improve your results.";
      }
      return "You're facing difficulty in the quiz. Revisiting the concepts will help you improve.";
    }

    // 3. Quiz Passed
    if (scoreOutOfTen !== null && scoreOutOfTen >= passScore) {
      if (!quizCompleted) {
        if (lastPassedLabel && nextLevelLabel) {
          return `You have completed the ${lastPassedLabel} quiz. Try the next difficulty level (${nextLevelLabel}).`;
        }
        if (nextLevelLabel) {
          return `Good progress so far. Try the next difficulty level (${nextLevelLabel}).`;
        }
        return "Good progress so far. Try the next difficulty level.";
      }

      // Only after hard (all levels) is completed should we recommend labs.
      if (!labStarted) {
        return "Great job! You've completed all quiz levels. Now start the lab to apply what you've learned.";
      }
      if (labStarted && !labCompleted) {
        return "You've started the lab but haven't completed it yet. Finishing it will strengthen your practical understanding.";
      }
      if (labCompleted) {
        return "Great job! You've successfully completed both the quiz and the lab for this module.";
      }
    }

    return "You're making progress — complete the quiz and labs to unlock full completion.";
  }, [quizLevelOrder, selectedDetail, selectedQuizLevels]);

  const improvementItems = useMemo(() => {
    if (!selectedDetail) return [];

    const progress = selectedDetail.progress;
    const items = [];
    const passScore = progress.quizPassScore ?? 6;
    const passPercent = passScore * 10;

    const quizHref = selectedCourse?.quizPath || `/quiz/${selectedDetail.moduleId}-module`;
    const labsHref = selectedCourse?.labPath || `/learn/${selectedDetail.moduleId}/lablist`;

    if (progress.quizScore === null) {
      items.push({
        label: `Take the quiz (${passPercent}% to pass)`,
        href: quizHref,
      });
    } else if ((progress.quizScore ?? 0) < passScore) {
      items.push({
        label: `Retry the quiz (best: ${progress.quizScore}/10)`,
        href: quizHref,
      });
    }

    // Only recommend labs after all quiz levels are complete.
    if (progress.quizCompleted) {
      if (!progress.labStarted) {
        items.push({
          label: "Start the labs",
          href: labsHref,
        });
      } else if (!progress.labCompleted) {
        items.push({
          label: `Finish labs (${progress.solvedLabs}/${progress.totalLabs})`,
          href: labsHref,
        });
      }
    }

    if (items.length === 0) {
      items.push({
        label: "Review the theory content",
        href: `/learn/${selectedDetail.moduleId}`,
      });
    }

    return items.slice(0, 2);
  }, [
    selectedCourse?.labPath,
    selectedCourse?.quizPath,
    selectedDetail,
  ]);

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="main-wrapper">
        <Navbar />

        <main className="dashboard-main">
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Overall Progress</h3>
                <p className="card-subtitle">
                  You have completed {overallProgress.percent}% of the curriculum
                </p>
              </div>
              <span className="progress-tasks">
                {overallProgress.completedItems} / {overallProgress.totalItems} Tasks
              </span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${overallProgress.percent}%` }}
              />
            </div>
            <p className="modules-completed-status">
              {overallProgress.completedModules} / {overallProgress.totalModules} modules fully completed
            </p>
          </div>

          <div className="card">
            <div className="recommendation-header">
              <div>
                <h3 className="recommendation-title">
                 Recommendation
                </h3>
                <p className="recommendation-module">
                  Module:{" "}
                  <span className="text-bold-dark">
                    {selectedModuleTitle}
                  </span>
                </p>
              </div>

              <div className="select-wrapper">
                <span className="select-label">
                  View module
                </span>
                <select
                  value={selectedModuleId}
                  onChange={(event) => {
                    setUserSelectedModuleId(event.target.value);
                  }}
                  className="module-select"
                >
                  {moduleDetails.map((detail) => (
                    <option key={detail.moduleId} value={detail.moduleId}>
                      {formatModuleTitle(detail.moduleId)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="recommendation-content">
              <div className="info-box">
                <h4 className="info-box-header">
                  Recommendation
                </h4>
                <p className="info-box-text">
                  {insightMessage}
                </p>
              </div>

              <div className="info-box">
                <h4 className="info-box-header">
                  Next actions
                </h4>
                <div className="actions-list">
                  {improvementItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="action-link"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card continue-learning-card">
            <div>
              <h3 className="card-title">Continue Learning</h3>
              <p className="card-subtitle" style={{ fontSize: "1rem" }}>
                Current Module:{" "}
                <span className="text-bold-dark">
                  {activeCourse?.shortTitle || activeCourse?.title || "Start Learning"}
                </span>
              </p>
            </div>
            <Link
              href={activeModule ? `/learn/${activeModule.moduleId}` : "/learn"}
              className="primary-button"
            >
              {activeModule?.startedAt ? "Resume Module" : "Start Module"}
            </Link>
          </div>

          <div className="card">
            <h3 className="card-title">Recent Activity</h3>
            <p className="card-subtitle">
              Your latest actions across quizzes, labs, and videos.
            </p>

            <div className="activity-list">
              {recentActivity.length === 0 ? (
                <p className="card-subtitle">No recent activity yet.</p>
              ) : (
                recentActivity.map((item) => {
                  const moduleTitle = formatModuleTitle(item.moduleId);
                  const when = new Date(item.createdAt).toLocaleString();

                  const message =
                    item.type === "quiz"
                      ? `${moduleTitle}: Quiz ${item.status === "passed" ? "passed" : "failed"}`
                      : item.type === "lab"
                      ? `${moduleTitle}: Lab ${item.status === "completed" ? "completed" : "attempted"}${
                          item.labId ? ` (${item.labId})` : ""
                        }`
                      : `${moduleTitle}: Watched video "${item.videoTitle}"`;

                  return (
                    <div
                      key={item.id}
                      className="activity-item"
                    >
                      <div className="activity-text-wrapper">
                        <p className="activity-message">{message}</p>
                        <p className="activity-time">{when}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}