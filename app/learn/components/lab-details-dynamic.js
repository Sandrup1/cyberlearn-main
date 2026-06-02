"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDefaultCourseContent } from "../../lib/course-content";
import { markLabAttempted, markModuleLabStarted, useModuleLabSolved } from "../progress-state";
import "./lab-details.css";
import "./module-content-page.css";

function normalizeVideoEmbedUrl(url) {
  const trimmed = url?.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);

    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.replace("/", "").trim();
      return id ? `https://www.youtube.com/embed/${id}` : trimmed;
    }

    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "m.youtube.com"
    ) {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : trimmed;
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return trimmed;
      }
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

export default function LabDetailsDynamic({ moduleId, labId, defaultSandboxUrl }) {
  const router = useRouter();
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [lab, setLab] = useState(null);

  const solved = useModuleLabSolved(moduleId, labId);

  useEffect(() => {
    markModuleLabStarted(moduleId);
  }, [moduleId]);

  useEffect(() => {
    markLabAttempted(moduleId, labId);
  }, [labId, moduleId]);

  const fallbackContent = useMemo(() => getDefaultCourseContent(moduleId), [moduleId]);
  const fallbackLab = useMemo(() => {
    if (!fallbackContent || !fallbackContent.labs) return null;
    return fallbackContent.labs.find((l) => l.id === labId) || fallbackContent.labs[0];
  }, [fallbackContent, labId]);

  useEffect(() => {
    let active = true;

    async function loadContent() {
      try {
        const res = await fetch(`/api/content/${moduleId}`, { cache: "no-store" });
        const data = await res.json();
        
        if (!active) return;

        if (res.ok && data && data.labs) {
          const loadedLab = data.labs.find((l) => l.id === labId);
          if (loadedLab) {
            setContent(data);
            setLab(loadedLab);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load lab data dynamically:", err);
      }

      if (active) {
        setContent(fallbackContent);
        setLab(fallbackLab);
        setLoading(false);
      }
    }

    loadContent();

    return () => {
      active = false;
    };
  }, [moduleId, labId, fallbackContent, fallbackLab]);

  if (loading) {
    return (
      <div className="lab-details-container">
        <div className="lab-details-card" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <p style={{ fontWeight: 600, color: "#4b5563" }}>Loading lab details...</p>
        </div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="lab-details-container">
        <div className="lab-details-card">
          <button onClick={() => router.back()} className="back-btn">← Back</button>
          <h1 className="lab-title">Lab Not Found</h1>
          <p className="lab-summary">The requested lab could not be loaded.</p>
        </div>
      </div>
    );
  }  const sandboxPath = defaultSandboxUrl || `/learn/${moduleId}/${labId}/shop`;
 
  return (
    <div className="lab-details-container">
      <div className="lab-details-card">
        
        {/* Header & Back Navigation */}
        <div className="lab-details-header">
          <button 
            onClick={() => router.back()}
            className="back-btn"
          >
            ← Back to Labs
          </button>
          
          <nav className="breadcrumb-nav">
            <span>CyberLearn Academy</span> 
            <span>/</span>
            <span>{content?.shortTitle || moduleId.toUpperCase()}</span> 
            <span>/</span>
            <span className="active">{lab.id.toUpperCase()}</span>
          </nav>

          <h1 className="lab-title">
            {lab.title}
          </h1>
        </div>

        {/* Status Section */}
        <div className="status-row">
          <div 
            className="status-badge"
            style={{
              borderColor: solved ? "#16a34a" : "#000000",
              backgroundColor: solved ? "#f0fdf4" : "transparent",
              color: solved ? "#15803d" : "#000000",
              borderWidth: "2px",
              padding: "0.25rem 1rem",
              fontSize: "0.75rem",
              fontWeight: 900,
              borderRadius: "9999px",
              display: "inline-flex",
              letterSpacing: "0.05em",
              textTransform: "uppercase"
            }}
          >
             LAB: {solved ? "SOLVED" : "NOT SOLVED"}
          </div>
          {lab.level && (
            <span 
              className="difficulty-badge"
              style={{
                marginLeft: "1rem",
                fontSize: "0.625rem",
                fontWeight: 700,
                border: "1px solid #000000",
                padding: "0.25rem 0.5rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                borderRadius: "0.25rem"
              }}
            >
              {lab.level}
            </span>
          )}
          <div className="status-divider"></div>
        </div>

        {/* Problem Description */}
        <div className="lab-desc-container">
          <p>{lab.summary}</p>

          {lab.objective && (
            <div style={{ marginTop: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem", color: "#111827" }}>Objective</h2>
              <p style={{ color: "#374151", margin: 0 }}>{lab.objective}</p>
            </div>
          )}

          {lab.starterCode && (
            <pre className="code-box" style={{ marginTop: "1.5rem" }}>
              <code>{lab.starterCode}</code>
            </pre>
          )}

          {/* ACCESS LAB BUTTON */}
          <div style={{ marginTop: "2rem" }}>
            {lab.accessAllowed === false ? (
              <button 
                className="action-btn"
                disabled
                style={{ 
                  backgroundColor: "#9ca3af", 
                  color: "#ffffff", 
                  cursor: "not-allowed",
                  borderColor: "#9ca3af"
                }}
              >
                ACCESS BLOCKED BY ADMIN
              </button>
            ) : (
              <Link href={sandboxPath}>
                <button className="action-btn">
                  ACCESS THE LAB →
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Accordions */}
        <div className="accordion-container" style={{ marginTop: "2.5rem" }}>
          
          {/* Solution Accordion */}
          {lab.solutionSteps && lab.solutionSteps.length > 0 && (
            <div className="accordion-item" style={{ border: "1px solid #000000", borderRadius: "0.375rem" }}>
              <button 
                onClick={() => setSolutionOpen(!solutionOpen)}
                className="accordion-trigger"
              >
                <span>Solution Guide</span>
                <span className={`accordion-arrow ${solutionOpen ? 'open' : ''}`}>▼</span>
              </button>
              
              {solutionOpen && (
                <div className="accordion-content">
                  <ol className="solution-steps">
                    {lab.solutionSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Defense Note Section */}
          {lab.defenseNote && (
            <div className="accordion-item gray-border" style={{ marginTop: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.375rem", padding: "1.25rem", backgroundColor: "#030712" }}>
              <h2 className="lab-defense-title" style={{ color: "#ffffff", fontSize: "1.125rem", fontWeight: 700, marginTop: 0, marginBottom: "0.5rem" }}>Defense Note</h2>
              <p className="lab-defense-text" style={{ color: "#e5e7eb", fontSize: "0.875rem", lineHeight: "1.5rem", margin: 0 }}>
                {lab.defenseNote}
              </p>
            </div>
          )}
        </div>

        {/* YouTube Video Player (At the bottom) */}
        {lab.videoUrl && (
          <div className="video-container" style={{ marginTop: "2.5rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.75rem", color: "#111827" }}>Video Walkthrough</h2>
            <div className="video-player-wrapper" style={{ margin: "0 auto", width: "100%", maxWidth: "48rem" }}>
              <div className="video-aspect">
                <iframe
                  className="iframe-video"
                  src={normalizeVideoEmbedUrl(lab.videoUrl)}
                  title={`${lab.title} walkthrough video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
            <a
              className="video-tab-link"
              href={lab.videoUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: "0.875rem", fontWeight: 600, color: "#4b5563", marginTop: "0.5rem" }}
            >
              Open video in new tab
            </a>
          </div>
        )}

        {/* Footer Decor */}
        <div className="footer-decor">
            <span>CyberLearn</span>
            <span>Security Lab // {lab.id.toUpperCase()}</span>
        </div>

      </div>
    </div>
  );
}
