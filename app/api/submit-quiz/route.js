import clientPromise from "../../lib/mongodb";
import { normalizeModuleId, normalizeQuiz } from "../../lib/quizzes";

export async function POST(req) {
  try {
    const {
      moduleId: rawModuleId,
      levelId = "easy",
      answers,
    } = await req.json();

    if (!rawModuleId || !Array.isArray(answers)) {
      return Response.json({ error: "Invalid quiz submission" }, { status: 400 });
    }

    const moduleId = normalizeModuleId(rawModuleId);
    let quiz = null;

    try {
      const client = await clientPromise;
      const db = client.db("cyberlearn");
      quiz = await db.collection("quizzes").findOne({ moduleId });
    } catch (error) {
      console.error("Submit Quiz DB lookup failed:", error);
    }

    if (!quiz) {
      return Response.json({ error: "Quiz not found" }, { status: 404 });
    }

    const normalizedQuiz = normalizeQuiz(quiz);
    const levels = normalizedQuiz.levels || [];
    const levelIndex = levels.findIndex((level) => level.id === levelId);
    const level = levels[levelIndex];

    if (!level) {
      return Response.json({ error: "Quiz level not found" }, { status: 404 });
    }

    let score = 0;

    level.questions.forEach((question, index) => {
      const optionCount = Array.isArray(question.options) ? question.options.length : 0;
      const submitted = Array.isArray(answers[index]) ? answers[index] : [];
      const submittedIndices = submitted
        .map((value) => Number(value))
        .filter(
          (value) =>
            Number.isFinite(value) && value >= 0 && value < optionCount
        );

      const uniqueSubmitted = Array.from(new Set(submittedIndices)).sort(
        (a, b) => a - b
      );

      const correct = Array.isArray(question.correctAnswers)
        ? question.correctAnswers
        : Number.isFinite(Number(question.correctAnswer))
        ? [Number(question.correctAnswer)]
        : [];

      const uniqueCorrect = Array.from(
        new Set(
          correct
            .map((value) => Number(value))
            .filter(
              (value) =>
                Number.isFinite(value) && value >= 0 && value < optionCount
            )
        )
      ).sort((a, b) => a - b);

      const isCorrect =
        uniqueSubmitted.length === uniqueCorrect.length &&
        uniqueSubmitted.every((value, i) => value === uniqueCorrect[i]);

      if (isCorrect) {
        score++;
      }
    });

    const total = level.questions.length;
    const scoreOutOfTen = total > 0 ? Math.round((score / total) * 10) : 0;
    const passScore = Number.isFinite(Number(normalizedQuiz.passScore))
      ? Math.max(1, Math.min(10, Math.floor(Number(normalizedQuiz.passScore))))
      : 6;
    const passed = scoreOutOfTen >= passScore;
    const nextLevel = levels[levelIndex + 1];

    return Response.json({
      score,
      total,
      scoreOutOfTen,
      passScore,
      passed,
      levelId: level.id,
      nextLevelId: passed ? nextLevel?.id || null : null,
      allLevelsPassed: passed && !nextLevel,
    });
  } catch (error) {
    console.error("Submit Quiz Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
