"use client";

import { useEffect, useMemo, useState } from "react";
import {
  defaultCourseContents,
  moduleIds,
} from "../../lib/course-content";
import "../admin.css";

function createDraft(content) {
  return {
    title: content.title,
    shortTitle: content.shortTitle,
    description: content.description,
    labPath: content.labPath,
    quizPath: content.quizPath,
    published: content.published,
    sectionsJson: JSON.stringify(content.sections, null, 2),
    labsJson: JSON.stringify(content.labs, null, 2),
  };
}

const initialDrafts = moduleIds.reduce((drafts, moduleId) => {
  drafts[moduleId] = createDraft(defaultCourseContents[moduleId]);
  return drafts;
}, {});

export default function AdminLabsPage() {
  const [selectedModuleId, setSelectedModuleId] = useState("sqli");
  const [drafts, setDrafts] = useState(initialDrafts);
  const [status, setStatus] = useState("Loading saved content...");
  const [saving, setSaving] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState("");

  const draft = drafts[selectedModuleId];

  useEffect(() => {
    let active = true;

    async function loadContents() {
      try {
        const res = await fetch("/api/admin/content", { cache: "no-store" });
        const data = await res.json();

        if (!active || !res.ok) {
          return;
        }

        const nextDrafts = { ...initialDrafts };
        data.forEach((content) => {
          nextDrafts[content.moduleId] = createDraft(content);
        });

        setDrafts(nextDrafts);
        setStatus("Saved content loaded.");
      } catch {
        if (active) {
          setStatus("Using default content. Save a module to write it to MongoDB.");
        }
      }
    }

    loadContents();

    return () => {
      active = false;
    };
  }, []);

  const labsArray = useMemo(() => {
    try {
      return JSON.parse(draft.labsJson);
    } catch {
      return [];
    }
  }, [draft.labsJson]);

  const activeLabId = selectedLabId || (labsArray[0]?.id || "");

  const selectedLab = useMemo(() => {
    return labsArray.find((l) => l.id === activeLabId) || labsArray[0] || null;
  }, [labsArray, activeLabId]);

  const counts = useMemo(() => {
    try {
      return {
        sections: JSON.parse(draft.sectionsJson).length,
        labs: labsArray.length,
      };
    } catch {
      return { sections: 0, labs: 0 };
    }
  }, [draft.sectionsJson, labsArray.length]);

  function updateDraft(field, value) {
    setDrafts((current) => ({
      ...current,
      [selectedModuleId]: {
        ...current[selectedModuleId],
        [field]: value,
      },
    }));
  }

  function updateSelectedLabField(field, value) {
    if (!selectedLab) return;
    const updatedLabs = labsArray.map((l) => {
      if (l.id === selectedLab.id) {
        return {
          ...l,
          [field]: value,
        };
      }
      return l;
    });
    updateDraft("labsJson", JSON.stringify(updatedLabs, null, 2));
  }

  async function saveContent() {
    setSaving(true);
    setStatus("");

    try {
      const sections = JSON.parse(draft.sectionsJson);
      const labs = JSON.parse(draft.labsJson);

      if (!Array.isArray(sections) || !Array.isArray(labs)) {
        setStatus("Sections and labs must both be JSON arrays.");
        return;
      }

      const res = await fetch(`/api/admin/content/${selectedModuleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          shortTitle: draft.shortTitle,
          description: draft.description,
          labPath: draft.labPath,
          quizPath: draft.quizPath,
          published: draft.published,
          sections,
          labs,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || "Unable to save content.");
        return;
      }

      setDrafts((current) => ({
        ...current,
        [selectedModuleId]: createDraft(data.content),
      }));
      setStatus(`${draft.shortTitle} content saved to MongoDB.`);
    } catch {
      setStatus("Invalid JSON. Check sections and labs before saving.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-main">
      <div className="admin-container">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p className="admin-card-pre">
                Admin
              </p>
              <h1 className="admin-card-title" style={{ marginTop: "0.5rem" }}>
                Theory & Lab Content
              </h1>
              <p className="admin-card-desc">
                Edit learner-facing module theory and lab metadata. Saving writes
                the selected module to the MongoDB courseContents collection.
              </p>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={saveContent}
              className="admin-btn primary"
            >
              {saving ? "Saving..." : "Save to MongoDB"}
            </button>
          </div>
        </div>

        <section className="admin-aside-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <select
                value={selectedModuleId}
                onChange={(e) => {
                  setSelectedModuleId(e.target.value);
                  setSelectedLabId("");
                }}
                className="admin-select"
                style={{
                  padding: "0.5rem 1.5rem 0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  backgroundColor: "#ffffff",
                  color: "#1e293b",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  minWidth: "220px",
                }}
              >
                {Object.keys(drafts).map((moduleId) => (
                  <option key={moduleId} value={moduleId}>
                    {drafts[moduleId]?.shortTitle || drafts[moduleId]?.title || moduleId.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#6b7280" }}>
              {counts.sections} sections / {counts.labs} labs
            </div>
          </div>

          {status && <p style={{ marginTop: "1rem", marginBottom: 0, fontSize: "0.875rem", fontWeight: 500, color: "#4b5563" }}>{status}</p>}
        </section>

        <div className="admin-grid-12">
          <div style={{ gridColumn: "span 12 / span 12", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Lab Settings Editor */}
            {selectedLab && (
              <section className="admin-aside-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Lab Settings Editor</h2>
                
                <label className="admin-input-group">
                  <span className="admin-label">Select Lab to Edit</span>
                  <select
                    value={selectedLab.id}
                    onChange={(e) => setSelectedLabId(e.target.value)}
                    className="admin-select"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem" }}
                  >
                    {labsArray.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.id} - {l.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-input-group">
                  <span className="admin-label">Lab Title</span>
                  <input
                    value={selectedLab.title || ""}
                    onChange={(e) => updateSelectedLabField("title", e.target.value)}
                    className="admin-input"
                  />
                </label>

                <label className="admin-input-group">
                  <span className="admin-label">Difficulty Level</span>
                  <input
                    value={selectedLab.level || ""}
                    onChange={(e) => updateSelectedLabField("level", e.target.value)}
                    className="admin-input"
                  />
                </label>

                <label className="admin-input-group">
                  <span className="admin-label">Description (Summary)</span>
                  <textarea
                    value={selectedLab.summary || ""}
                    onChange={(e) => updateSelectedLabField("summary", e.target.value)}
                    rows={3}
                    className="admin-textarea"
                  />
                </label>

                <label className="admin-input-group">
                  <span className="admin-label">Objective</span>
                  <textarea
                    value={selectedLab.objective || ""}
                    onChange={(e) => updateSelectedLabField("objective", e.target.value)}
                    rows={3}
                    className="admin-textarea"
                  />
                </label>

                <label className="admin-input-group">
                  <span className="admin-label">Starter Code / Payload</span>
                  <textarea
                    value={selectedLab.starterCode || ""}
                    onChange={(e) => updateSelectedLabField("starterCode", e.target.value)}
                    rows={2}
                    className="admin-textarea mono"
                  />
                </label>

                <label className="admin-input-group">
                  <span className="admin-label">YouTube Video URL</span>
                  <input
                    value={selectedLab.videoUrl || ""}
                    onChange={(e) => updateSelectedLabField("videoUrl", e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="admin-input"
                  />
                </label>

                <label className="admin-checkbox-label" style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", justifyContent: "space-between", backgroundColor: "#f9fafb" }}>
                  <span>
                    <span style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>
                      Lab Access Allowed
                    </span>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem", fontWeight: 400 }}>
                      If unchecked, students cannot access this lab.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={selectedLab.accessAllowed !== false}
                    onChange={(e) => updateSelectedLabField("accessAllowed", e.target.checked)}
                    style={{ height: "1.25rem", width: "1.25rem" }}
                  />
                </label>

                <label className="admin-input-group">
                  <span className="admin-label">Solution Guide (One step per line)</span>
                  <textarea
                    value={selectedLab.solutionSteps ? selectedLab.solutionSteps.join("\n") : ""}
                    onChange={(e) => {
                      const lines = e.target.value.split("\n");
                      updateSelectedLabField("solutionSteps", lines);
                    }}
                    rows={5}
                    className="admin-textarea"
                  />
                </label>

                <label className="admin-input-group">
                  <span className="admin-label">Defense Note</span>
                  <textarea
                    value={selectedLab.defenseNote || ""}
                    onChange={(e) => updateSelectedLabField("defenseNote", e.target.value)}
                    rows={3}
                    className="admin-textarea"
                  />
                </label>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
