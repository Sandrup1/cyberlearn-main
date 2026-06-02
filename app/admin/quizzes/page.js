"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../admin.css";

const emptyLevel = (id, title) => ({
  id,
  title,
  questions: [],
});

const defaultQuiz = () => ({
  moduleId: "",
  title: "",
  passScore: 6,
  levels: [
    emptyLevel("easy", "Easy"),
    emptyLevel("intermediate", "Intermediate"),
    emptyLevel("hard", "Hard"),
  ],
});

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState(defaultQuiz());
  const [activeLevel, setActiveLevel] = useState(0);
  const [optionsPerQuestion, setOptionsPerQuestion] = useState(4);

  useEffect(() => {
    fetchQuizzes();
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const res = await fetch("/api/admin/content", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch (err) {
      console.error("Failed to fetch modules:", err);
    }
  };

  useEffect(() => {
    const level = formData.levels[activeLevel];
    const existingCount = level?.questions?.[0]?.options?.length;
    setOptionsPerQuestion(typeof existingCount === "number" && existingCount > 1 ? existingCount : 4);
  }, [activeLevel, formData.levels]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/quizzes");
      if (!res.ok) throw new Error("Failed to fetch quizzes");
      const data = await res.json();
      setQuizzes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.moduleId) {
        throw new Error("Module ID is required");
      }

      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save quiz");
      }

      setSuccess(`Quiz '${formData.moduleId}' saved successfully!`);
      setFormData(defaultQuiz());
      fetchQuizzes();
    } catch (err) {
      setError(`Save failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (moduleId) => {
    if (!confirm(`Are you sure you want to delete the quiz for '${moduleId}'?`)) return;

    try {
      setError(null);
      const res = await fetch(`/api/admin/quizzes?moduleId=${moduleId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete quiz");

      setSuccess(`Quiz '${moduleId}' deleted successfully.`);
      fetchQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete quiz");
    }
  };

  const resizeOptions = (options, count) => {
    if (count < 2) return ["", ""];
    if (options.length === count) return options;
    if (options.length > count) return options.slice(0, count);
    return [...options, ...Array.from({ length: count - options.length }, () => "")];
  };

  const applyOptionsPerQuestionToActiveLevel = (count) => {
    if (!Number.isFinite(count)) return;
    const clamped = Math.max(2, Math.min(10, Math.floor(count)));
    const newFormData = { ...formData };
    const questions = newFormData.levels[activeLevel].questions;

    questions.forEach((q) => {
      q.options = resizeOptions(Array.isArray(q.options) ? q.options : [], clamped);
      q.correctAnswers = (Array.isArray(q.correctAnswers) ? q.correctAnswers : [])
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value >= 0 && value < clamped);
    });

    setFormData(newFormData);
    setOptionsPerQuestion(clamped);
  };

  const setActiveLevelQuestionCount = (count) => {
    if (!Number.isFinite(count)) return;
    const target = Math.max(0, Math.min(100, Math.floor(count)));
    const newFormData = { ...formData };
    const questions = newFormData.levels[activeLevel].questions;

    while (questions.length < target) {
      questions.push({
        question: "",
        options: Array.from({ length: optionsPerQuestion }, () => ""),
        correctAnswers: [],
      });
    }

    if (questions.length > target) {
      questions.splice(target, questions.length - target);
    }

    setFormData(newFormData);
  };

  const addQuestion = () => {
    const newFormData = { ...formData };
    newFormData.levels[activeLevel].questions.push({
      question: "",
      options: Array.from({ length: optionsPerQuestion }, () => ""),
      correctAnswers: [],
    });
    setFormData(newFormData);
  };

  const updateQuestion = (qIndex, field, value, optIndex) => {
    const newFormData = { ...formData };
    const q = newFormData.levels[activeLevel].questions[qIndex];
    if (field === "question") q.question = value;
    if (field === "option" && optIndex !== undefined) {
      q.options[optIndex] = value;
    }
    setFormData(newFormData);
  };

  const toggleCorrectOption = (qIndex, optIndex) => {
    const newFormData = { ...formData };
    const q = newFormData.levels[activeLevel].questions[qIndex];
    const existing = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];
    const next = existing.includes(optIndex)
      ? existing.filter((value) => value !== optIndex)
      : [...existing, optIndex];
    q.correctAnswers = next;
    setFormData(newFormData);
  };

  const removeQuestion = (qIndex) => {
    const newFormData = { ...formData };
    newFormData.levels[activeLevel].questions.splice(qIndex, 1);
    setFormData(newFormData);
  };

  const loadQuizIntoEditor = (quiz) => {
    // Merge loaded quiz with default structure to ensure all 3 levels exist
    const newForm = defaultQuiz();
    newForm.moduleId = quiz.moduleId || "";
    newForm.title = quiz.title || "";
    newForm.passScore = typeof quiz.passScore === "number" ? quiz.passScore : 6;
    
    if (quiz.levels) {
      quiz.levels.forEach((l) => {
        const idx = newForm.levels.findIndex(nl => nl.id === l.id);
        if (idx !== -1) {
          newForm.levels[idx].questions = (l.questions || []).map((q) => {
            const options = Array.isArray(q.options) ? q.options : ["", ""];
            const maybe = q || {};
            const correctAnswersRaw = Array.isArray(maybe.correctAnswers)
              ? maybe.correctAnswers
              : typeof maybe.correctAnswer === "number"
              ? [maybe.correctAnswer]
              : [];
            const correctAnswers = correctAnswersRaw
              .map((value) => Number(value))
              .filter(
                (value) =>
                  Number.isFinite(value) && value >= 0 && value < options.length
              );

            return {
              question: typeof q.question === "string" ? q.question : "",
              options,
              correctAnswers,
            };
          });
        }
      });
    }
    setFormData(newForm);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="admin-main">
      <div className="admin-container narrow" style={{ paddingBottom: "8rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h1 className="admin-card-title">Manage Quizzes</h1>
          <Link href="/admin" className="header-brand-desc-link" style={{ fontSize: "0.875rem" }}>
            &larr; Back to Admin Panel
          </Link>
        </div>

        {error && <div className="result-message unsolved" style={{ marginBottom: "1rem" }}>{error}</div>}
        {success && <div className="result-message solved" style={{ marginBottom: "1rem" }}>{success}</div>}

        <div className="admin-card">
          <h2 className="login-form-title">Quiz Editor</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="admin-input-group">
              <label className="admin-label">Module ID</label>
              <select
                value={formData.moduleId}
                onChange={e => {
                  const mId = e.target.value;
                  const selectedModule = modules.find(m => m.moduleId === mId);
                  setFormData({
                    ...formData,
                    moduleId: mId,
                    title: selectedModule ? `${selectedModule.shortTitle || selectedModule.title} Quiz` : formData.title
                  });
                }}
                className="admin-select"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem" }}
              >
                <option value="">-- Select Module --</option>
                {modules.map((m) => (
                  <option key={m.moduleId} value={m.moduleId}>
                    {m.shortTitle || m.title || m.moduleId.toUpperCase()} ({m.moduleId})
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-input-group">
              <label className="admin-label">Title</label>
              <input 
                type="text" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="admin-input" 
                placeholder="e.g. SQL Injection Quiz"
              />
            </div>
            <div className="admin-input-group">
              <label className="admin-label">Pass Score (out of 10)</label>
              <input 
                type="number" 
                value={formData.passScore} 
                onChange={e => setFormData({...formData, passScore: Number(e.target.value)})}
                className="admin-input" 
                min="1" max="10"
              />
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#6b7280" }}>
                Passing threshold for each level (e.g. 6 = 60%).
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="admin-input-group">
              <label className="admin-label">Questions in {formData.levels[activeLevel].title}</label>
              <input
                type="number"
                value={formData.levels[activeLevel].questions.length}
                onChange={(e) => setActiveLevelQuestionCount(Number(e.target.value))}
                className="admin-input"
                min="0"
                max="100"
              />
            </div>
            <div className="admin-input-group">
              <label className="admin-label">Options per Question ({formData.levels[activeLevel].title})</label>
              <input
                type="number"
                value={optionsPerQuestion}
                onChange={(e) => applyOptionsPerQuestionToActiveLevel(Number(e.target.value))}
                className="admin-input"
                min="2"
                max="10"
              />
            </div>
          </div>

          {/* Level Tabs */}
          <div className="admin-tabs-nav">
            {formData.levels.map((level, idx) => (
              <button
                key={level.id}
                type="button"
                onClick={() => setActiveLevel(idx)}
                className={`admin-tab-btn ${activeLevel === idx ? 'active' : ''}`}
              >
                {level.title} ({level.questions.length})
              </button>
            ))}
          </div>

          {/* Questions for active level */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {formData.levels[activeLevel].questions.map((q, qIndex) => (
              <div key={qIndex} className="admin-card-inner-box" style={{ margin: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Question {qIndex + 1}</h4>
                  <button type="button" onClick={() => removeQuestion(qIndex)} className="admin-btn danger-light" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>Remove</button>
                </div>
                
                <input
                  type="text"
                  value={q.question}
                  onChange={e => updateQuestion(qIndex, "question", e.target.value)}
                  placeholder="Question text"
                  className="admin-input"
                  style={{ marginBottom: "1rem" }}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={Array.isArray(q.correctAnswers) && q.correctAnswers.includes(optIndex)}
                        onChange={() => toggleCorrectOption(qIndex, optIndex)}
                        style={{ height: "1rem", width: "1rem" }}
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={e => updateQuestion(qIndex, "option", e.target.value, optIndex)}
                        placeholder={`Option ${optIndex + 1}`}
                        className="admin-input"
                        style={{ fontSize: "0.875rem" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button type="button" onClick={addQuestion} className="admin-btn dashed">
              + Add Question to {formData.levels[activeLevel].title}
            </button>
          </div>

          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <button type="button" onClick={() => setFormData(defaultQuiz())} className="admin-btn secondary">
              Clear Form
            </button>
            <button type="button" onClick={handleSave} disabled={isSaving} className="admin-btn primary">
              {isSaving ? "Saving..." : "Save Quiz"}
            </button>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Existing Quizzes</h2>
          {loading ? (
            <p style={{ color: "#6b7280" }}>Loading quizzes...</p>
          ) : quizzes.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No quizzes found in the database.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {quizzes.map((quiz) => (
                <div key={quiz._id} className="admin-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem", margin: 0 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>{quiz.title || quiz.moduleId}</h3>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
                      Module ID: <span style={{ fontFamily: "monospace", backgroundColor: "#f3f4f6", padding: "0.125rem 0.25rem", borderRadius: "0.25rem" }}>{quiz.moduleId}</span> • 
                      Pass Score: 60%
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button type="button" onClick={() => loadQuizIntoEditor(quiz)} className="admin-btn blue" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(quiz.moduleId)} className="admin-btn danger" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
