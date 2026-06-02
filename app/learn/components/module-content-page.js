"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getDefaultCourseContent,
} from "../../lib/course-content";
import { initializeModuleProgress, markModuleVideoWatched } from "../progress-state";
import Navbar from "../../components/navbar";
import "./module-content-page.css";

function cardClasses(tone) {
  const styles = {
    green: "card-green",
    blue: "card-blue",
    amber: "card-amber",
    red: "card-red",
  };

  return styles[tone] || styles.blue;
}

function normalizeVideoEmbedUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

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

export default function ModuleContentPage({
  moduleId,
}) {
  const fallbackContent = getDefaultCourseContent(moduleId);
  const [content, setContent] = useState(fallbackContent);
  const [loading, setLoading] = useState(!fallbackContent);

  useEffect(() => {
    initializeModuleProgress(moduleId);
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
        if (active && fallbackContent) {
          setContent(fallbackContent);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadContent();

    return () => {
      active = false;
    };
  }, [fallbackContent, moduleId]);

  if (loading) {
    return <div className="loading-screen">Loading course content...</div>;
  }

  if (!content) {
    return (
      <div className="error-screen">
        <h1 className="error-title">Course Not Found</h1>
        <Link href="/dashboard" className="error-link">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="module-container">
      <div className="module-layout-wrapper">
        <div style={{ display: "flex", width: "100%" }}>
          <aside className="module-sidebar">
            <div className="sidebar-sticky-card">
              <Link
                href="/learn"
                className="sidebar-back-link"
              >
                &larr; Back
              </Link>

              <h2 className="sidebar-title">
                {content.shortTitle} Sections
              </h2>

              <div className="sidebar-nav-list">
                {content.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="sidebar-nav-link"
                  >
                    {section.label}
                  </a>
                ))}

                <div className="sidebar-divider"></div>

                <Link
                  href={content.labPath}
                  className="sidebar-btn-black"
                >
                  View {content.shortTitle} Labs
                </Link>

                <Link
                  href={content.quizPath}
                  className="sidebar-btn-outline"
                >
                  Attempt Quiz
                </Link>
              </div>
            </div>
          </aside>

          <div style={{ display: "flex", flexDirection: "column", flex: "1 1 0%", minWidth: 0 }}>
            <Navbar />
            <main className="module-main-content">
            {(() => {
              const customVideoUrl = content.sections.find(
                (s) => s.id !== "video" && s.videoUrl && s.videoUrl.trim() !== ""
              )?.videoUrl || null;

              return content.sections.map((section, index) => {
                const sectionVideoUrl = section.id === "video"
                  ? (customVideoUrl || section.videoUrl)
                  : null;

                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className="content-section"
                  >
                    {index === 0 ? (
                      <h1 className="section-title-h1">
                        {section.heading}
                      </h1>
                    ) : (
                      <h2 className="section-title-h2">
                        {section.heading}
                      </h2>
                    )}

                    {section.body && (
                      <p className="section-body-text">{section.body}</p>
                    )}

                    {section.items && (
                      <ul className="section-list">
                        {section.items.map((item) => (
                          <li key={item.title} className="section-list-item">
                            <span className="bold-dark-text">
                              {item.title}:
                            </span>{" "}
                            {item.body}
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.code && (
                      <div className="code-container">
                        {section.codeLabel && (
                          <>
                            <span className="code-label">
                              {section.codeLabel}
                            </span>
                            <br />
                          </>
                        )}
                        {section.code}
                      </div>
                    )}

                    {section.cards && (
                      <div className="cards-grid">
                        {section.cards.map((card) => (
                          <div
                            key={card.title}
                            className={`info-card ${cardClasses(card.tone)}`}
                          >
                            <h4 className="info-card-title">{card.title}</h4>
                            <p className="info-card-body">{card.body}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {sectionVideoUrl && (
                      <div className="video-container">
                        <div className="video-player-wrapper">
                          <div className="video-aspect">
                            <iframe
                              className="iframe-video"
                              src={normalizeVideoEmbedUrl(sectionVideoUrl)}
                              title={`${content.title} video`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            ></iframe>
                          </div>
                        </div>
                        <a
                          className="video-tab-link"
                          href={sectionVideoUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open video in new tab
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            markModuleVideoWatched(moduleId, section.heading || "Video")
                          }
                          className="btn-watched"
                        >
                          Mark video as watched
                        </button>
                      </div>
                    )}

                    {!sectionVideoUrl && section.id === "video" && section.body && (
                      <div className="fallback-video-box">
                        <p className="section-body-text">{section.body}</p>
                      </div>
                    )}

                    {section.quizQuestion && (
                      <div className="quiz-container">
                        <p className="quiz-question-text">
                          {section.quizQuestion}
                        </p>
                        <div className="quiz-options-list">
                          {(section.quizOptions || []).map((option) => (
                            <button
                              key={option}
                              className="quiz-option-btn"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                );
              });
            })()}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
