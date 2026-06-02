import clientPromise from "../../../lib/mongodb";
import { normalizeModuleId, normalizeQuiz } from "../../../lib/quizzes";

function removeAnswers(quiz) {
  return {
    moduleId: quiz.moduleId,
    title: quiz.title,
    passScore: quiz.passScore ?? 6,
    levels: (quiz.levels || []).map((level) => ({
      id: level.id,
      title: level.title,
      questions: level.questions.map((question) => ({
        question: question.question,
        options: question.options,
      })),
    })),
  };
}

export async function GET(_req, { params }) {
  try {
    const { moduleId: rawModuleId } = await params;
    const moduleId = normalizeModuleId(rawModuleId);
    let quiz = null;

    try {
      const client = await clientPromise;
      const db = client.db("cyberlearn");
      quiz = await db.collection("quizzes").findOne({ moduleId });
    } catch (error) {
      console.error("Quiz DB lookup failed:", error);
    }

    if (!quiz) {
      return Response.json({ error: "Quiz not found" }, { status: 404 });
    }

    return Response.json(removeAnswers(normalizeQuiz(quiz)));
  } catch (error) {
    console.error("Quiz API Error:", error);

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
