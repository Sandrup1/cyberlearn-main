"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  defaultCourseContents,
  getDefaultCourseContent,
} from "../../lib/course-content";
import "../admin.css";

function cloneContent(content) {
  return JSON.parse(JSON.stringify(content));
}

function emptySection(id) {
  return {
    id,
    label: "New section",
    heading: "New section",
    body: "",
  };
}

function cardToneLabel(tone) {
  return tone === "green"
    ? "Green"
    : tone === "blue"
    ? "Blue"
    : tone === "amber"
    ? "Amber"
    : "Red";
}

export default function AdminCourses() {
  const [contents, setContents] = useState(() => {
    const initial = {};
    Object.values(defaultCourseContents).forEach((content) => {
      initial[content.moduleId] = cloneContent(content);
    });
    return initial;
  });

  const [selectedModuleId, setSelectedModuleId] = useState("sqli");
  const [activeSectionId, setActiveSectionId] = useState("");

  const [draft, setDraft] = useState(() => {
    const fallback = getDefaultCourseContent(selectedModuleId);
    return fallback ? cloneContent(fallback) : null;
  });

  const [loadState, setLoadState] = useState("loading");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createModuleId, setCreateModuleId] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createShortTitle, setCreateShortTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createPublished, setCreatePublished] = useState(true);

  const moduleList = useMemo(() => {
    return Object.keys(contents).sort();
  }, [contents]);

  useEffect(() => {
    let active = true;

    async function loadContents() {
      setLoadState("loading");
      setStatus("Loading saved content…");

      try {
        const res = await fetch("/api/admin/content", { cache: "no-store" });
        const data = await res.json();

        if (!active || !res.ok) {
          throw new Error("Failed to load course content");
        }

        const next = {};
        data.forEach((content) => {
          next[content.moduleId] = cloneContent(content);
        });

        setContents(next);
        setLoadState("ready");
        setStatus("Saved content loaded.");
        const firstModuleId = data[0]?.moduleId;
        if (firstModuleId) {
          setSelectedModuleId(firstModuleId);
        }
      } catch {
        if (!active) return;
        setLoadState("error");
        setStatus("Using default content (unable to load saved content).");
        const fallbackIds = Object.keys(defaultCourseContents);
        const fallbackFirst = fallbackIds[0];
        if (fallbackFirst) {
          setSelectedModuleId(fallbackFirst);
        }
      }
    }

    loadContents();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const next = contents[selectedModuleId] || getDefaultCourseContent(selectedModuleId);
    setDraft(next ? cloneContent(next) : null);
    setActiveSectionId(next?.sections?.[0]?.id || "");
  }, [contents, selectedModuleId]);

  async function createModule() {
    const moduleId = createModuleId.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(moduleId)) {
      setStatus("Module id must be lowercase and contain only a-z, 0-9, and hyphens.");
      return;
    }

    if (!createTitle.trim()) {
      setStatus("Title is required.");
      return;
    }

    if (contents[moduleId]) {
      setStatus("A module with that id already exists.");
      return;
    }

    const now = new Date().toISOString();
    const payload = {
      moduleId,
      title: createTitle.trim(),
      shortTitle: createShortTitle.trim() || createTitle.trim(),
      description: createDescription.trim(),
      labPath: `/learn/${moduleId}/lablist`,
      quizPath: `/quiz/${moduleId}`,
      published: createPublished,
      sections: [
        {
          id: "intro",
          label: "Introduction",
          heading: "Introduction",
          body: "",
        },
      ],
      labs: [],
      updatedAt: now,
    };

    setSaving(true);
    setStatus("");

    try {
      const res = await fetch(`/api/admin/content/${moduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus(data?.error || "Failed to create module.");
        return;
      }

      setContents((prev) => ({
        ...prev,
        [moduleId]: cloneContent(payload),
      }));
      setSelectedModuleId(moduleId);
      setCreateOpen(false);
      setCreateModuleId("");
      setCreateTitle("");
      setCreateShortTitle("");
      setCreateDescription("");
      setCreatePublished(true);
      setStatus("Module created.");
    } catch {
      setStatus("Failed to create module.");
    } finally {
      setSaving(false);
    }
  }

  const activeSection = useMemo(() => {
    if (!draft) return null;
    return draft.sections.find((section) => section.id === activeSectionId) || null;
  }, [activeSectionId, draft]);

  function updateDraft(patch) {
    if (!draft) return;
    setDraft({ ...draft, ...patch });
  }

  function updateSection(sectionId, patch) {
    if (!draft) return;
    const nextSections = draft.sections.map((section) =>
      section.id === sectionId ? { ...section, ...patch } : section
    );
    setDraft({ ...draft, sections: nextSections });
  }

  function addSection() {
    if (!draft) return;
    const base = `section-${draft.sections.length + 1}`;
    const id =
      draft.sections.some((section) => section.id === base) ? `${base}-${Date.now()}` : base;
    const next = [...draft.sections, emptySection(id)];
    setDraft({ ...draft, sections: next });
    setActiveSectionId(id);
  }

  function removeSection(sectionId) {
    if (!draft) return;
    const next = draft.sections.filter((section) => section.id !== sectionId);
    setDraft({ ...draft, sections: next });
    setActiveSectionId(next[0]?.id || "");
  }

  function moveSection(sectionId, direction) {
    if (!draft) return;
    const index = draft.sections.findIndex((section) => section.id === sectionId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= draft.sections.length) return;

    const nextSections = [...draft.sections];
    const [removed] = nextSections.splice(index, 1);
    nextSections.splice(nextIndex, 0, removed);
    setDraft({ ...draft, sections: nextSections });
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setStatus("");

    try {
      const res = await fetch(`/api/admin/content/${draft.moduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          shortTitle: draft.shortTitle,
          description: draft.description,
          labPath: draft.labPath,
          quizPath: draft.quizPath,
          published: draft.published,
          sections: draft.sections,
          labs: draft.labs ?? [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || "Unable to save.");
        return;
      }

      setContents((current) => ({
        ...current,
        [draft.moduleId]: cloneContent(data.content),
      }));

      setStatus(`${draft.shortTitle} saved.`);
    } catch {
      setStatus("Unable to save (network/server error).");
    } finally {
      setSaving(false);
    }
  }

  async function deleteModule() {
    if (!draft) return;
    const moduleId = draft.moduleId;

    if (!confirm(`Are you sure you want to delete the module '${moduleId}'? This will permanently remove its theory contents and labs.`)) {
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const res = await fetch(`/api/admin/content/${moduleId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus(data?.error || "Failed to delete module.");
        return;
      }

      setContents((prev) => {
        const next = { ...prev };
        delete next[moduleId];
        return next;
      });

      // Select another module if the deleted one was selected
      const remainingIds = Object.keys(contents).filter(id => id !== moduleId);
      if (remainingIds.length > 0) {
        setSelectedModuleId(remainingIds[0]);
      } else {
        setSelectedModuleId("");
        setDraft(null);
      }
      
      setStatus("Module deleted successfully.");
    } catch {
      setStatus("Failed to delete module.");
    } finally {
      setSaving(false);
    }
  }

  if (!draft) {
    return (
      <main className="admin-main">
        <p style={{ fontWeight: 600 }}>No module content available.</p>
      </main>
    );
  }

  return (
    <main className="admin-main">
      <div className="admin-container">
        <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p className="admin-card-pre">
                Admin
              </p>
              <h1 className="admin-card-title" style={{ marginTop: "0.5rem" }}>
                Manage Module Content
              </h1>
              <p className="admin-card-desc">
                Edit module sections with a form UI. Learner pages use only{" "}
                <strong>Published</strong> content.
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
              <Link
                href="/admin"
                className="admin-btn secondary"
              >
                ← Back
              </Link>
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="admin-btn primary"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={deleteModule}
                className="admin-btn danger"
              >
                Delete Module
              </button>
            </div>
          </div>
        </div>

        {status && (
          <div className="result-message solved" style={{ marginBottom: "1.5rem" }}>
            {status}
            {loadState === "loading" && (
              <span style={{ marginLeft: "0.5rem", color: "#9ca3af" }}>(loading)</span>
            )}
          </div>
        )}

        <div className="admin-grid-12">
          <aside className="lg-col-4">
            <div className="admin-aside-card" style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>Modules</h2>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
                Choose a module to edit.
              </p>

              <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setCreateOpen((open) => !open)}
                  className="admin-btn secondary"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                >
                  {createOpen ? "Close" : "+ New module"}
                </button>
              </div>

              {createOpen && (
                <div className="admin-card-inner-box" style={{ marginTop: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <label className="admin-input-group">
                      <span className="admin-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>
                        Module ID
                      </span>
                      <input
                        value={createModuleId}
                        onChange={(event) => setCreateModuleId(event.target.value)}
                        placeholder="e.g. idor"
                        className="admin-input mono"
                      />
                    </label>

                    <label className="admin-input-group">
                      <span className="admin-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>
                        Title
                      </span>
                      <input
                        value={createTitle}
                        onChange={(event) => setCreateTitle(event.target.value)}
                        placeholder="e.g. Insecure Direct Object References"
                        className="admin-input"
                      />
                    </label>

                    <label className="admin-input-group">
                      <span className="admin-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>
                        Short Title
                      </span>
                      <input
                        value={createShortTitle}
                        onChange={(event) => setCreateShortTitle(event.target.value)}
                        placeholder="e.g. IDOR"
                        className="admin-input"
                      />
                    </label>

                    <label className="admin-input-group">
                      <span className="admin-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>
                        Description
                      </span>
                      <textarea
                        value={createDescription}
                        onChange={(event) => setCreateDescription(event.target.value)}
                        rows={3}
                        className="admin-textarea"
                      />
                    </label>

                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={createPublished}
                        onChange={(event) => setCreatePublished(event.target.checked)}
                        style={{ height: "1rem", width: "1rem" }}
                      />
                      Published (visible to learners)
                    </label>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={createModule}
                      className="admin-btn blue"
                    >
                      Create module
                    </button>
                  </div>
                </div>
              )}

              <div style={{
                marginTop: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                maxHeight: "350px",
                overflowY: "auto",
                paddingRight: "0.25rem"
              }}>
                {moduleList.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>No modules found.</p>
                ) : (
                  moduleList.map((moduleId) => {
                    const content = contents[moduleId];
                    const selected = selectedModuleId === moduleId;
                    return (
                      <button
                        key={moduleId}
                        type="button"
                        onClick={() => setSelectedModuleId(moduleId)}
                        className={`admin-select-btn ${selected ? 'active' : ''}`}
                      >
                        <div className="admin-select-btn-header">
                          <div>
                            <p className="admin-select-btn-title">
                              {content?.shortTitle || moduleId.toUpperCase()}
                            </p>
                            <p className="admin-select-btn-desc">
                              {content?.description || "No description yet"}
                            </p>
                          </div>
                          <span
                            className={`admin-status-badge ${
                              content?.published ? 'published' : 'draft'
                            }`}
                          >
                            {content?.published ? "Published" : "Draft"}
                          </span>
                        </div>
                        <div className="admin-select-btn-footer">
                          <span>{content?.sections?.length || 0} sections</span>
                          <span style={{ fontFamily: "monospace" }}>{moduleId}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="admin-aside-card">
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>Module Settings</h2>

              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="admin-input-group">
                  <span className="admin-label">Module ID (Read-only)</span>
                  <input
                    value={draft.moduleId || ""}
                    readOnly
                    className="admin-input mono"
                    style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
                  />
                </div>

                <label className="admin-input-group">
                  <span className="admin-label">Title</span>
                  <input
                    value={draft.title}
                    onChange={(event) => updateDraft({ title: event.target.value })}
                    className="admin-input"
                  />
                </label>

                <label className="admin-input-group">
                  <span className="admin-label">
                    Short Title (sidebar)
                  </span>
                  <input
                    value={draft.shortTitle}
                    onChange={(event) =>
                      updateDraft({ shortTitle: event.target.value })
                    }
                    className="admin-input"
                  />
                </label>

                <label className="admin-input-group">
                  <span className="admin-label">
                    Description (dashboard card)
                  </span>
                  <textarea
                    value={draft.description}
                    onChange={(event) =>
                      updateDraft({ description: event.target.value })
                    }
                    rows={3}
                    className="admin-textarea"
                  />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <label className="admin-input-group">
                    <span className="admin-label">Lab Path</span>
                    <input
                      value={draft.labPath}
                      onChange={(event) => updateDraft({ labPath: event.target.value })}
                      className="admin-input mono"
                    />
                  </label>

                  <label className="admin-input-group">
                    <span className="admin-label">Quiz Path</span>
                    <input
                      value={draft.quizPath}
                      onChange={(event) => updateDraft({ quizPath: event.target.value })}
                      className="admin-input mono"
                    />
                  </label>
                </div>

                <label className="admin-checkbox-label" style={{ padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", justifyContent: "space-between", backgroundColor: "#f9fafb" }}>
                  <span>
                    <span style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>
                      Published
                    </span>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem", fontWeight: 400 }}>
                      Public pages read published content.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={draft.published}
                    onChange={(event) => updateDraft({ published: event.target.checked })}
                    style={{ height: "1.25rem", width: "1.25rem" }}
                  />
                </label>

                <div style={{ fontSize: "0.875rem", color: "#4b5563", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "0.75rem", backgroundColor: "#ffffff" }}>
                  Labs are edited in{" "}
                  <Link href="/admin/labs" style={{ fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>
                    Manage Theory & Labs
                  </Link>
                  .
                </div>
              </div>
            </div>
          </aside>

          <section className="lg-col-8">
            <div className="admin-aside-card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>Sections</h2>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
                    Build the left sidebar and main content.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addSection}
                  className="admin-btn dashed"
                  style={{ borderStyle: "dashed", width: "auto", padding: "0.5rem 1rem" }}
                >
                  + Add Section
                </button>
              </div>

              <div className="admin-grid-12">
                <div className="lg-col-5">
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {draft.sections.map((section, index) => {
                      const selected = section.id === activeSectionId;
                      return (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => setActiveSectionId(section.id)}
                          className={`admin-select-btn ${selected ? 'active' : ''}`}
                          style={{ padding: "0.75rem 1rem" }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <p className="admin-select-btn-title" style={{ margin: 0 }}>
                                {section.label || "Untitled"}
                              </p>
                              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>
                                #{section.id} • {index === 0 ? "H1" : "H2"}
                              </p>
                            </div>
                            <div style={{ display: "flex", gap: "0.25rem" }}>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveSection(section.id, -1);
                                }}
                                className="admin-btn secondary"
                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveSection(section.id, 1);
                                }}
                                className="admin-btn secondary"
                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                              >
                                ↓
                              </button>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="lg-col-7">
                  {!activeSection ? (
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", backgroundColor: "#f9fafb", padding: "1.5rem", fontSize: "0.875rem", color: "#4b5563" }}>
                      Select a section to edit.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <div style={{ display: "flex", justify: "space-between", alignItems: "center", justifyContent: "space-between" }}>
                        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                          Edit Section
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeSection(activeSection.id)}
                          className="admin-btn danger-light"
                          style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                        >
                          Remove
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <label className="admin-input-group">
                          <span className="admin-label">ID</span>
                          <input
                            value={activeSection.id}
                            onChange={(event) => {
                              const nextId = event.target.value.trim();
                              if (!nextId) return;
                              if (draft.sections.some((s) => s.id === nextId && s.id !== activeSection.id)) {
                                  return;
                              }
                              const nextSections = draft.sections.map((s) =>
                                s.id === activeSection.id ? { ...s, id: nextId } : s
                              );
                              setDraft({ ...draft, sections: nextSections });
                              setActiveSectionId(nextId);
                            }}
                            className="admin-input mono"
                          />
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#6b7280" }}>
                            Used in URL hash (e.g. <span style={{ fontFamily: "monospace" }}>#intro</span>).
                          </p>
                        </label>

                        <label className="admin-input-group">
                          <span className="admin-label">Sidebar Label</span>
                          <input
                            value={activeSection.label}
                            onChange={(event) =>
                              updateSection(activeSection.id, { label: event.target.value })
                            }
                            className="admin-input"
                          />
                        </label>
                      </div>

                      <label className="admin-input-group">
                        <span className="admin-label">Heading</span>
                        <input
                          value={activeSection.heading}
                          onChange={(event) =>
                            updateSection(activeSection.id, { heading: event.target.value })
                          }
                          className="admin-input"
                        />
                      </label>

                      <label className="admin-input-group">
                        <span className="admin-label">Body</span>
                        <textarea
                          value={activeSection.body || ""}
                          onChange={(event) =>
                            updateSection(activeSection.id, { body: event.target.value })
                          }
                          rows={4}
                          className="admin-textarea"
                        />
                      </label>

                      <div className="admin-card-inner-box" style={{ margin: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700 }}>Bullets</h4>
                          <button
                            type="button"
                            onClick={() =>
                              updateSection(activeSection.id, {
                                items: [...(activeSection.items || []), { title: "", body: "" }],
                              })
                            }
                            className="admin-btn secondary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                          >
                            + Add
                          </button>
                        </div>

                        {(activeSection.items || []).length === 0 ? (
                          <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>
                            Add bullet items (Title + Body).
                          </p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {(activeSection.items || []).map((item, idx) => (
                              <div key={idx} className="admin-aside-card" style={{ padding: "0.75rem", backgroundColor: "#ffffff" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                  <p className="admin-card-pre" style={{ color: "#9ca3af" }}>
                                    Item {idx + 1}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...(activeSection.items || [])];
                                      next.splice(idx, 1);
                                      updateSection(activeSection.id, { items: next });
                                    }}
                                    className="admin-btn danger-light"
                                    style={{ padding: "0.125rem 0.375rem", fontSize: "0.625rem" }}
                                  >
                                    Remove
                                  </button>
                                </div>
                                <input
                                  value={item.title}
                                  onChange={(event) => {
                                    const next = [...(activeSection.items || [])];
                                    next[idx] = { ...next[idx], title: event.target.value };
                                    updateSection(activeSection.id, { items: next });
                                  }}
                                  placeholder="Title"
                                  className="admin-input"
                                  style={{ marginBottom: "0.5rem" }}
                                />
                                <textarea
                                  value={item.body}
                                  onChange={(event) => {
                                    const next = [...(activeSection.items || [])];
                                    next[idx] = { ...next[idx], body: event.target.value };
                                    updateSection(activeSection.id, { items: next });
                                  }}
                                  placeholder="Body"
                                  rows={2}
                                  className="admin-textarea"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="admin-card-inner-box" style={{ margin: 0 }}>
                        <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700 }}>Code Block</h4>
                        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          <input
                            value={activeSection.codeLabel || ""}
                            onChange={(event) =>
                              updateSection(activeSection.id, { codeLabel: event.target.value })
                            }
                            placeholder="Optional label (e.g. -- Injected query)"
                            className="admin-input mono"
                          />
                          <textarea
                            value={activeSection.code || ""}
                            onChange={(event) =>
                              updateSection(activeSection.id, { code: event.target.value })
                            }
                            placeholder="Code content"
                            rows={4}
                            spellCheck={false}
                            className="admin-textarea mono"
                          />
                        </div>
                      </div>

                      <div className="admin-card-inner-box" style={{ margin: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700 }}>Cards</h4>
                            <p style={{ margin: "0.125rem 0 0 0", fontSize: "0.75rem", color: "#6b7280" }}>
                              Small callout cards (tone + title + body).
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateSection(activeSection.id, {
                                cards: [
                                  ...(activeSection.cards || []),
                                  { title: "", body: "", tone: "blue" },
                                ],
                              })
                            }
                            className="admin-btn secondary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                          >
                            + Add
                          </button>
                        </div>

                        {(activeSection.cards || []).length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" }}>
                            {(activeSection.cards || []).map((card, idx) => (
                              <div key={idx} className="admin-aside-card" style={{ padding: "0.75rem", backgroundColor: "#ffffff" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                  <p className="admin-card-pre" style={{ color: "#9ca3af" }}>
                                    Card {idx + 1}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...(activeSection.cards || [])];
                                      next.splice(idx, 1);
                                      updateSection(activeSection.id, { cards: next });
                                    }}
                                    className="admin-btn danger-light"
                                    style={{ padding: "0.125rem 0.375rem", fontSize: "0.625rem" }}
                                  >
                                    Remove
                                  </button>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                  <input
                                    value={card.title}
                                    onChange={(event) => {
                                      const next = [...(activeSection.cards || [])];
                                      next[idx] = { ...next[idx], title: event.target.value };
                                      updateSection(activeSection.id, { cards: next });
                                    }}
                                    placeholder="Title"
                                    className="admin-input"
                                  />
                                  <select
                                    value={card.tone}
                                    onChange={(event) => {
                                      const next = [...(activeSection.cards || [])];
                                      next[idx] = {
                                        ...next[idx],
                                        tone: event.target.value,
                                      };
                                      updateSection(activeSection.id, { cards: next });
                                    }}
                                    className="admin-select"
                                  >
                                    {["green", "blue", "amber", "red"].map((tone) => (
                                      <option key={tone} value={tone}>
                                        {cardToneLabel(tone)}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <textarea
                                  value={card.body}
                                  onChange={(event) => {
                                    const next = [...(activeSection.cards || [])];
                                    next[idx] = { ...next[idx], body: event.target.value };
                                    updateSection(activeSection.id, { cards: next });
                                  }}
                                  placeholder="Body"
                                  rows={2}
                                  className="admin-textarea"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="admin-card-inner-box" style={{ margin: 0 }}>
                        <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700 }}>Video</h4>
                        <p style={{ margin: "0.125rem 0 0 0", fontSize: "0.75rem", color: "#6b7280" }}>
                          Paste an embeddable URL (e.g. YouTube embed link).
                        </p>
                        <input
                          value={activeSection.videoUrl || ""}
                          onChange={(event) =>
                            updateSection(activeSection.id, { videoUrl: event.target.value })
                          }
                          placeholder="https://www.youtube.com/embed/..."
                          className="admin-input mono"
                          style={{ marginTop: "0.75rem" }}
                        />
                      </div>

                      <div className="admin-card-inner-box" style={{ margin: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700 }}>Quick Check</h4>
                          <button
                            type="button"
                            onClick={() =>
                              updateSection(activeSection.id, {
                                quizOptions: [...(activeSection.quizOptions || []), ""],
                              })
                            }
                            className="admin-btn secondary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                          >
                            + Option
                          </button>
                        </div>

                        <label className="admin-input-group">
                          <span className="admin-label" style={{ fontSize: "0.75rem", textTransform: "uppercase", trackingWidest: "0.05em", color: "#9ca3af" }}>
                            Question
                          </span>
                          <textarea
                            value={activeSection.quizQuestion || ""}
                            onChange={(event) =>
                              updateSection(activeSection.id, { quizQuestion: event.target.value })
                            }
                            rows={2}
                            className="admin-textarea"
                          />
                        </label>

                        {(activeSection.quizOptions || []).length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
                            {(activeSection.quizOptions || []).map((option, idx) => (
                              <div key={idx} style={{ display: "flex", gap: "0.5rem" }}>
                                <input
                                  value={option}
                                  onChange={(event) => {
                                    const next = [...(activeSection.quizOptions || [])];
                                    next[idx] = event.target.value;
                                    updateSection(activeSection.id, { quizOptions: next });
                                  }}
                                  placeholder={`Option ${idx + 1}`}
                                  className="admin-input"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...(activeSection.quizOptions || [])];
                                    next.splice(idx, 1);
                                    updateSection(activeSection.id, { quizOptions: next });
                                  }}
                                  className="admin-btn danger-light"
                                  style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
