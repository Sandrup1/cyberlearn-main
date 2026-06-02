"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getDefaultCourseContent,
} from "../../lib/course-content";
import {
  markModuleLabSolved,
  markModuleLabStarted,
  markLabAttempted,
  useModuleLabSolved,
} from "../progress-state";
import "./generic-lab-page.css";

export default function GenericLabPage({
  moduleId,
  labId,
}) {
  const fallbackContent = getDefaultCourseContent(moduleId);
  const fallbackLab =
    fallbackContent.labs.find((lab) => lab.id === labId) || fallbackContent.labs[0];
  const [content, setContent] = useState(fallbackContent);
  const [lab, setLab] = useState(fallbackLab);
  const solved = useModuleLabSolved(moduleId, labId);

  useEffect(() => {
    markModuleLabStarted(moduleId);
  }, [moduleId]);

  useEffect(() => {
    markLabAttempted(moduleId, labId);
  }, [labId, moduleId]);

  useEffect(() => {
    let active = true;

    async function loadContent() {
      try {
        const res = await fetch(`/api/content/${moduleId}`, {
          cache: "no-store",
        });
        const data = await res.json();
        const loadedLab = data.labs.find((item) => item.id === labId);

        if (active && res.ok && loadedLab) {
          setContent(data);
          setLab(loadedLab);
        }
      } catch {
        if (active) {
          setContent(fallbackContent);
          setLab(fallbackLab);
        }
      }
    }

    loadContent();

    return () => {
      active = false;
    };
  }, [fallbackContent, fallbackLab, labId, moduleId]);

  return (
    <div className="generic-lab-container">
      <main className="lab-main-card">
        <Link
          href={content.labPath}
          className="lab-back-link"
        >
          &larr; Back to {content.shortTitle} labs
        </Link>

        <p className="lab-type-label">
          Editable Lab
        </p>

        <div
          className={`lab-status-badge ${
            solved ? "lab-status-solved" : "lab-status-unsolved"
          }`}
        >
          Lab: {solved ? "solved" : "not solved"}
        </div>

        <h1 className="lab-title">{lab.title}</h1>
        <p className="lab-summary">{lab.summary}</p>

        <section className="lab-section-objective">
          <h2 className="lab-section-title">Objective</h2>
          <p className="lab-objective-text">{lab.objective}</p>
        </section>

        {lab.starterCode && (
          <pre className="lab-code-block">
            <code>{lab.starterCode}</code>
          </pre>
        )}

        <section className="lab-section-solution">
          <h2 className="lab-section-title">Solution Guide</h2>
          <ol className="lab-steps-list">
            {lab.solutionSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        {lab.defenseNote && (
          <section className="lab-section-defense">
            <h2 className="lab-defense-title">Defense Note</h2>
            <p className="lab-defense-text">{lab.defenseNote}</p>
          </section>
        )}

        <button
          onClick={() => markModuleLabSolved(moduleId, labId)}
          className="lab-submit-btn"
        >
          {solved ? "Submitted" : "Submit Lab"}
        </button>
      </main>
    </div>
  );
}
