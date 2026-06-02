const levelOrder = ["easy", "intermediate", "hard"];

export function normalizeModuleId(moduleId) {
  return moduleId === "sqli-module" ? "sqli" : moduleId;
}

function normalizeQuestion(question) {
  const options = Array.isArray(question?.options) ? question.options : [];
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? option : String(option ?? "")
  );

  const safeOptions =
    normalizedOptions.length >= 2 ? normalizedOptions : ["", ""];

  const correctAnswers = Array.isArray(question?.correctAnswers)
    ? question.correctAnswers
    : [];

  const normalizedCorrectAnswers = correctAnswers
    .map((value) => Number(value))
    .filter(
      (value) =>
        Number.isFinite(value) && value >= 0 && value < safeOptions.length
    );

  const legacyCorrectAnswer = Number(question?.correctAnswer);
  const legacyCorrectAnswers =
    Number.isFinite(legacyCorrectAnswer) &&
    legacyCorrectAnswer >= 0 &&
    legacyCorrectAnswer < safeOptions.length
      ? [legacyCorrectAnswer]
      : [];

  const safeCorrectAnswers =
    normalizedCorrectAnswers.length > 0 ? normalizedCorrectAnswers : legacyCorrectAnswers;

  return {
    question: typeof question?.question === "string" ? question.question : "",
    options: safeOptions,
    correctAnswers: safeCorrectAnswers,
  };
}

function normalizeLevel(level) {
  const questions = Array.isArray(level?.questions) ? level.questions : [];

  return {
    id: level?.id ?? "easy",
    title: typeof level?.title === "string" ? level.title : "Level",
    questions: questions.map(normalizeQuestion),
  };
}

export function normalizeQuiz(quiz) {
  if (quiz.levels?.length) {
    return {
      ...quiz,
      passScore: quiz.passScore ?? 2,
      levels: [...quiz.levels]
        .map(normalizeLevel)
        .sort((a, b) => levelOrder.indexOf(a.id) - levelOrder.indexOf(b.id)),
    };
  }

  return {
    ...quiz,
    passScore: quiz.passScore ?? 2,
    levels: [
      {
        id: "easy",
        title: "Easy",
        questions: (quiz.questions || []).map(normalizeQuestion),
      },
    ],
  };
}
