import clientPromise from "../../../lib/mongodb";
import { normalizeModuleId } from "../../../lib/quizzes";

const levelOrder = ["easy", "intermediate", "hard"];

function normalizeQuestion(question) {
  const rawOptions = Array.isArray(question?.options) ? question.options : [];
  const options =
    rawOptions.length >= 2
      ? rawOptions.map((value) => String(value ?? ""))
      : ["", "", "", ""];

  const correctAnswers = Array.isArray(question?.correctAnswers)
    ? question.correctAnswers
    : Number.isFinite(Number(question?.correctAnswer))
    ? [Number(question.correctAnswer)]
    : [];

  const normalizedCorrectAnswers = Array.from(
    new Set(
      correctAnswers
        .map((value) => Number(value))
        .filter(
          (value) =>
            Number.isFinite(value) && value >= 0 && value < options.length
        )
    )
  );

  return {
    question: typeof question?.question === "string" ? question.question : "",
    options,
    correctAnswers: normalizedCorrectAnswers,
  };
}

function normalizeLevel(level, fallbackId) {
  const questions = Array.isArray(level?.questions) ? level.questions : [];
  const normalizedQuestions = questions.map(normalizeQuestion);

  while (normalizedQuestions.length < 10) {
    normalizedQuestions.push({
      question: "",
      options: ["", "", "", ""],
      correctAnswers: [],
    });
  }

  if (normalizedQuestions.length > 10) {
    normalizedQuestions.splice(10, normalizedQuestions.length - 10);
  }

  return {
    id: level?.id || fallbackId,
    title:
      typeof level?.title === "string"
        ? level.title
        : fallbackId
        ? fallbackId[0].toUpperCase() + fallbackId.slice(1)
        : "Level",
    questions: normalizedQuestions,
  };
}

function normalizeQuizPayload(payload, moduleId) {
  const levels = Array.isArray(payload?.levels) ? payload.levels : [];
  const byId = new Map(levels.map((level) => [level?.id, level]));
  const normalizedLevels = levelOrder.map((levelId) =>
    normalizeLevel(byId.get(levelId), levelId)
  );

  const rawPassScore = Number(payload?.passScore);
  const passScore = Number.isFinite(rawPassScore)
    ? Math.max(1, Math.min(10, Math.floor(rawPassScore)))
    : 6;

  return {
    ...payload,
    moduleId,
    passScore,
    title: payload?.title || moduleId.toUpperCase(),
    levels: normalizedLevels,
  };
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("cyberlearn");
    const quizzes = await db.collection("quizzes").find({}).toArray();

    return Response.json(quizzes);
  } catch (error) {
    console.error("Admin Quizzes GET Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const moduleId = normalizeModuleId(data.moduleId);

    if (!moduleId) {
      return Response.json({ error: "Missing moduleId in payload" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("cyberlearn");
    
    // Replace if exists, or insert new
    await db.collection("quizzes").replaceOne(
      { moduleId },
      normalizeQuizPayload(data, moduleId),
      { upsert: true }
    );

    return Response.json({ success: true, message: "Quiz saved successfully" });
  } catch (error) {
    console.error("Admin Quizzes POST Error:", error);
    return Response.json({ error: "Failed to save quiz" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rawModuleId = searchParams.get("moduleId");
    
    if (!rawModuleId) {
      return Response.json({ error: "Missing moduleId parameter" }, { status: 400 });
    }

    const moduleId = normalizeModuleId(rawModuleId);

    const client = await clientPromise;
    const db = client.db("cyberlearn");
    await db.collection("quizzes").deleteOne({ moduleId });

    return Response.json({ success: true, message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Admin Quizzes DELETE Error:", error);
    return Response.json({ error: "Failed to delete quiz" }, { status: 500 });
  }
}
