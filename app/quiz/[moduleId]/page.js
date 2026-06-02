"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  saveModuleQuizLevelResult,
  useModuleQuizLevels,
} from "../../learn/progress-state";
import "../quiz.css";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const levelProgress = useModuleQuizLevels(params.moduleId);
  const [quiz, setQuiz] = useState(null);
  const [activeLevelId, setActiveLevelId] = useState("easy");
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await fetch(`/api/quiz/${params.moduleId}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error);
          return;
        }

        setQuiz(data);
        setActiveLevelId(data.levels?.[0]?.id || "easy");
      } catch {
        setError("Failed to load quiz");
      }
    }

    loadQuiz();
  }, [params.moduleId]);

  const activeLevel = useMemo(() => {
    return quiz?.levels.find((level) => level.id === activeLevelId) || null;
  }, [activeLevelId, quiz]);

  const activeLevelIndex = quiz?.levels.findIndex(
    (level) => level.id === activeLevelId
  ) ?? 0;

  function isLevelUnlocked(levelIndex) {
    if (levelIndex === 0 || !quiz) {
      return true;
    }

    const previousLevel = quiz.levels[levelIndex - 1];
    return Boolean(levelProgress[previousLevel.id]?.passed);
  }

  function selectLevel(level, levelIndex) {
    if (!isLevelUnlocked(levelIndex)) {
      return;
    }

    setActiveLevelId(level.id);
    setAnswers([]);
    setSubmitted(false);
    setResult(null);
  }

  function handleToggle(qIndex, optionIndex) {
    const updated = [...answers];
    const existing = Array.isArray(updated[qIndex]) ? updated[qIndex] : [];
    const next = existing.includes(optionIndex)
      ? existing.filter((value) => value !== optionIndex)
      : [...existing, optionIndex];
    updated[qIndex] = next;
    setAnswers(updated);
  }

  async function handleSubmit() {
    if (!activeLevel) {
      return;
    }

    try {
      const res = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moduleId: params.moduleId,
          levelId: activeLevel.id,
          answers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Quiz submission failed");
        return;
      }

      setResult(data);
      setSubmitted(true);
      saveModuleQuizLevelResult(
        params.moduleId,
        data.levelId,
        data.score,
        data.total,
        data.scoreOutOfTen,
        data.passScore,
        data.passed,
        data.allLevelsPassed
      );
    } catch {
      setError("Failed to submit quiz");
    }
  }

  function goToNextLevel() {
    if (!quiz || !result?.nextLevelId) {
      return;
    }

    const nextLevel = quiz.levels.find((level) => level.id === result.nextLevelId);

    if (nextLevel) {
      setActiveLevelId(nextLevel.id);
      setAnswers([]);
      setSubmitted(false);
      setResult(null);
    }
  }

  if (error) return <p className="result-message-error" style={{ textAlign: "center", marginTop: "2.5rem" }}>{error}</p>;
  if (!quiz || !activeLevel) return <p style={{ textAlign: "center", marginTop: "2.5rem" }}>Loading...</p>;

  return (
    <div className="quiz-page-container">
      <div className="quiz-wrapper">
        <button
          onClick={() => router.back()}
          className="back-button"
        >
          <span aria-hidden="true">‹</span>
          Back
        </button>

        <div className="quiz-header-card">
          <p className="quiz-header-tag">
            Module Quiz
          </p>
          <h1 className="quiz-header-title">{quiz.title}</h1>
          <p className="quiz-header-desc">
            Each level has {activeLevel.questions.length} questions. Score at
            least {quiz.passScore}/10 ({Math.ceil((quiz.passScore / 10) * activeLevel.questions.length)} correct)
            to unlock the next level.
          </p>
        </div>

        <div className="quiz-levels-grid">
          {quiz.levels.map((level, levelIndex) => {
            const unlocked = isLevelUnlocked(levelIndex);
            const passed = Boolean(levelProgress[level.id]?.passed);

            const levelClass = activeLevelId === level.id
              ? "active"
              : unlocked
              ? "unlocked"
              : "locked";

            const tagClass = passed
              ? "passed"
              : unlocked
              ? "unlocked"
              : "locked";

            return (
              <button
                key={level.id}
                type="button"
                onClick={() => selectLevel(level, levelIndex)}
                className={`level-select-btn ${levelClass}`}
                disabled={!unlocked}
              >
                <div className="level-header-row">
                  <span className="level-title">{level.title}</span>
                  <span className={`status-tag ${tagClass}`}>
                    {passed ? "Passed" : unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
                <p className="level-desc-text">
                  {level.questions.length} questions
                </p>
              </button>
            );
          })}
        </div>

        <div className="quiz-main-card">
          <div className="quiz-card-header">
            <div>
              <p className="quiz-card-header-tag">
                Level {activeLevelIndex + 1}
              </p>
              <h2 className="quiz-card-header-title">
                {activeLevel.title}
              </h2>
            </div>
            <p className="quiz-passing-score">
              Passing score: {quiz.passScore}/10
            </p>
          </div>

          {activeLevel.questions.map((q, index) => (
            <div key={index} className="question-box">
              <p className="question-text">
                {index + 1}. {q.question}
              </p>

              {q.options.map((opt, i) => {
                const checked = (answers[index] ?? []).includes(i);
                return (
                  <label
                    key={i}
                    className={`option-row ${checked ? "checked" : ""}`}
                  >
                    <input
                      type="checkbox"
                      name={`q${index}`}
                      className="option-checkbox"
                      checked={checked}
                      onChange={() => handleToggle(index, i)}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          ))}

          {!submitted && (
            <button
              onClick={handleSubmit}
              className="btn-submit"
            >
              Submit {activeLevel.title} Quiz
            </button>
          )}

          {submitted && result && (
            <div className="result-box">
              <h2
                className={`result-score ${result.passed ? "success" : "failed"}`}
              >
                Score: {result.score} / {result.total} ({result.scoreOutOfTen}/10)
              </h2>

              {!result.passed && (
                <p className="result-message-error">
                  You need {result.passScore}/10 to unlock the next level. Try
                  this level again.
                </p>
              )}

              {result.passed && result.nextLevelId && (
                <button
                  type="button"
                  onClick={goToNextLevel}
                  className="btn-next-level"
                >
                  Go to Next Level
                </button>
              )}

              {result.allLevelsPassed && (
                <p className="all-complete-text">
                  All quiz levels complete. Good job!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
