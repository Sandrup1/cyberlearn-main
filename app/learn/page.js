"use client";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import Link from "next/link";
import { useModuleProgress } from "./progress-state";
import { useEffect, useState } from "react";
import "./learn.css";

export default function Dashboard() {

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        setTopics(
          data.map((course) => ({
            id: course.moduleId,
            title: course.shortTitle || course.title,
            desc: course.description,
            link: `/learn/${course.moduleId}`,
          }))
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="learn-container">

      <Sidebar />

      {/* Main */}
      <div className="main-content">

        {/* Navbar */}
        <Navbar />

        {/* Content */}
        <div className="courses-grid">

          {loading ? (
            <p className="info-text">Loading courses...</p>
          ) : topics.length === 0 ? (
            <p className="info-text">No courses available.</p>
          ) : (
            topics.map((item) => <ModuleCard key={item.id} item={item} />)
          )}

        </div>
      </div>
    </div>
  );
}

function ModuleCard({ item }) {
  const progress = useModuleProgress(item.id);

  return (
    <Link href={item.link} className="card-link">

      <div className="module-card">

        <h2 className="module-card-title">
          {item.title}
        </h2>

        <p className="module-card-desc">
          {item.desc}
        </p>

        <div className="progress-header">
          <span>Progress</span>
          <span>{progress.percent}%</span>
        </div>

        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress.percent}%` }}
          ></div>
        </div>

        <div className="module-card-footer">
          <span>
            Quiz: {progress.quizCompleted ? "Complete" : "Incomplete"}
          </span>
          <span className="text-right">
            Labs: {progress.solvedLabs}/{progress.totalLabs}
          </span>
        </div>
      </div>

    </Link>
  );
}
