"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getDefaultCourseContent,
} from "../../lib/course-content";
import { markModuleLabStarted, useModuleLabSolved } from "../progress-state";
import "./lab-list-page.css";

export default function LabListPage({ moduleId }) {
  const fallbackContent = getDefaultCourseContent(moduleId);
  const [content, setContent] = useState(fallbackContent);

  useEffect(() => {
    markModuleLabStarted(moduleId);
  }, [moduleId]);

  useEffect(() => {
    let active = true;

    async function loadContent() {
      try {
        const res = await fetch(`/api/content/${moduleId}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (active && res.ok) {
          setContent(data);
        }
      } catch {
        if (active) {
          setContent(fallbackContent);
        }
      }
    }

    loadContent();

    return () => {
      active = false;
    };
  }, [fallbackContent, moduleId]);

  if (!content) {
    return <div className="lab-list-container">Loading...</div>;
  }

  return (
    <div className="lab-list-container">
      <div className="lab-list-wrapper">
        <Link
          href={`/learn/${moduleId}`}
          className="back-link"
        >
          &larr; Back to {content.shortTitle}
        </Link>

        <div className="lab-header-section">
          <h1 className="lab-list-title">
            {content.shortTitle} Labs
          </h1>
          <p className="lab-list-subtitle">{content.description}</p>
        </div>

        <div className="labs-grid">
          {(content.labs || []).map((lab) => (
            <LabListItem key={lab.id} moduleId={moduleId} lab={lab} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LabListItem({
  moduleId,
  lab,
}) {
  const solved = useModuleLabSolved(moduleId, lab.id);

  return (
    <Link href={`/learn/${moduleId}/${lab.id}`} className="lab-item-link">
      <div className="lab-item-card">
        <div className="lab-item-info">
          <span className="lab-badge">
            {lab.level}
          </span>
          <h2 className="lab-title-text">
            {lab.title}
          </h2>
          <p className="lab-desc-text">{lab.summary}</p>
        </div>

        <div className="lab-status-area">
          <span
            className={`lab-status-badge ${
              solved ? "lab-status-solved" : "lab-status-unsolved"
            }`}
          >
            {solved ? "Solved" : "Not solved"}
          </span>
        </div>
      </div>
    </Link>
  );
}
