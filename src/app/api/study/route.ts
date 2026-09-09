import { checkAndIncrementUsage, usageBlockedResponse, checkAnonymousUsage, anonymousLimitResponse } from "@/lib/usage";
import { createChatCompletion } from "@/lib/ai-providers";

type StudyIntent =
  | "QUICK_ANSWER"
  | "PERSONAL_KNOWLEDGE"
  | "EXAM_EXPLANATION"
  | "STEP_BY_STEP"
  | "ESSAY"
  | "SUMMARY"
  | "FLASHCARDS"
  | "CHALLENGE"
  | "MATERIAL_ANALYSIS"
  | "IMAGE_EXPLANATION"
  | "HEALTH_INFORMATION"
  | "OTHER";

const INTENTS: StudyIntent[] = [
  "QUICK_ANSWER",
  "PERSONAL_KNOWLEDGE",
  "EXAM_EXPLANATION",
  "STEP_BY_STEP",
  "ESSAY",
  "SUMMARY",
  "FLASHCARDS",
  "CHALLENGE",
  "MATERIAL_ANALYSIS",
  "IMAGE_EXPLANATION",
  "HEALTH_INFORMATION",
  "OTHER",
];

function buildSystemPrompt(preferredLanguage?: string) {
  const languageRule = preferredLanguage && preferredLanguage !== "en"
    ? `Write all user-facing CONTENT in the language with ISO code "${preferredLanguage}". Keep JSON keys and enum values in English exactly as defined.`
    : "Use clear English (UK spelling) for user-facing content.";

  return `You are BillyOS Study Intelligence — an adaptive learning and knowledge assistant.

Your job is NOT to turn every question into a lesson, essay, or quiz. First understand what the user is actually trying to accomplish, then choose the smallest useful response format.

Study Mode can receive almost ANY question: school topics, general knowledge, explanations, practical questions, health-information questions, uploaded study material, image-based questions, essays, summaries, flashcards, tests, and anything else the user wants clarified or learned.

INTENT RULES:
- QUICK_ANSWER: simple, narrow factual or clarifying question where a direct answer is best.
- PERSONAL_KNOWLEDGE: the user wants to understand something for themselves, not specifically for an exam. Explain naturally and proportionally.
- EXAM_EXPLANATION: the user explicitly mentions an exam, test, revision, marks, assessment, studying for a test, or asks for exam-focused teaching.
- STEP_BY_STEP: the user needs a worked solution or process explained step by step.
- ESSAY: the user explicitly asks to write, plan, structure, improve, or analyse an essay.
- SUMMARY: the main goal is summarising supplied or referenced material.
- FLASHCARDS: the user explicitly wants flashcards.
- CHALLENGE: the user explicitly wants to be quizzed/tested/challenged or asks for a particular number of questions.
- MATERIAL_ANALYSIS: the user provides or asks to work from a document/text/file and the material itself is central to the task.
- IMAGE_EXPLANATION: the user provides an image and wants the image understood or explained.
- HEALTH_INFORMATION: the question concerns health, body, symptoms, teeth, nutrition, sleep, exercise, or wellbeing and is primarily asking for information or clarification. Provide general educational information, avoid pretending to diagnose, and encourage appropriate professional care when symptoms may need it. For emergencies, advise seeking urgent local medical help.
- OTHER: anything that does not fit the categories above.

IMPORTANT AMBIGUITY RULE:
- If the request is clearly a quick/general question, DO NOT ask a mode question. Answer it directly.
- If the request is clearly an exam/test request, DO NOT ask a mode question. Use EXAM_EXPLANATION.
- If the request clearly asks for an essay, challenge, flashcards, summary, or step-by-step solution, DO NOT ask a mode question. Use the matching intent.
- Only set clarification_required=true when the user's request is genuinely ambiguous between PERSONAL_KNOWLEDGE and EXAM_EXPLANATION and the distinction would materially change the response.
- When clarification is needed, do NOT invent an answer yet. Return a brief clarification_prompt such as: "How should I approach this?" and two choices: "Personal knowledge" and "Exam / Test explanation".

RESPONSE LENGTH RULE:
Match the user's actual request. A one-line question can deserve a few sentences. A deeper request can deserve a structured explanation. Never inflate a short question into an essay merely because Study Mode is active.

When the user says something like "explain like I'm 10", "make it simple", or gives an age/level, honour that instruction as a response style.

OUTPUT CONTRACT:
Return ONLY valid JSON. No markdown fences and no commentary.
Use exactly this top-level shape:
{
  "intent": "QUICK_ANSWER|PERSONAL_KNOWLEDGE|EXAM_EXPLANATION|STEP_BY_STEP|ESSAY|SUMMARY|FLASHCARDS|CHALLENGE|MATERIAL_ANALYSIS|IMAGE_EXPLANATION|HEALTH_INFORMATION|OTHER",
  "confidence": 0.0,
  "clarification_required": false,
  "clarification_prompt": "",
  "clarification_options": ["Personal knowledge", "Exam / Test explanation"],
  "topic": "short useful title",
  "summary": "concise overview appropriate to the request",
  "direct_answer": "the main answer when a direct answer is appropriate",
  "key_concepts": [],
  "notes": [],
  "flashcards": [],
  "quiz": [],
  "next_steps": []
}

FIELD RULES:
- confidence must be between 0 and 1.
- clarification_options must contain the two strings exactly when clarification_required=true; otherwise return [].
- For QUICK_ANSWER, PERSONAL_KNOWLEDGE, EXAM_EXPLANATION, STEP_BY_STEP, HEALTH_INFORMATION, and OTHER, prefer direct_answer and keep supporting fields proportionate. Do not fabricate a full study pack unless it is genuinely useful.
- For ESSAY, SUMMARY, FLASHCARDS, CHALLENGE, MATERIAL_ANALYSIS, and IMAGE_EXPLANATION, populate the fields that make sense for that task.
- For CHALLENGE, honour explicit requested question count, difficulty, and type when present. Never silently substitute a different count.
- For FLASHCARDS, return only as many as the user reasonably asked for; otherwise use about 6.
- For quiz entries use objects shaped like {"question":"...","options":["..."],"correct_index":0}. For written questions, options may be [].
- Never use LaTeX. Write equations in plain readable text.
- Do not claim to have seen a file or image unless material was actually supplied in this request.
- Do not invent facts you are not confident about.
- If supplied material contains the answer, ground the response in that material rather than silently replacing it with unrelated content.

${languageRule}`;
}

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("No JSON object found in model response.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function isValidIntent(value: unknown): value is StudyIntent {
  return typeof value === "string" && INTENTS.includes(value as StudyIntent);
}

function extractChallengeSettings(topic: string) {
  const countMatch = topic.match(/\b(?:exactly\s+)?(\d{1,3})\s+questions?\b/i);
  const count = countMatch
    ? Math.max(1, Math.min(50, Number(countMatch[1])))
    : 10;

  let questionType = "Mixed";
  if (/\bwritten\b/i.test(topic)) questionType = "Written";
  else if (/\bmultiple[- ]choice\b|\bmcq\b/i.test(topic)) questionType = "Multiple choice";

  let difficulty = "Medium";
  if (/\bextreme\b/i.test(topic)) difficulty = "Extreme";
  else if (/\bhard\b/i.test(topic)) difficulty = "Hard";
  else if (/\beasy\b/i.test(topic)) difficulty = "Easy";

  return { count, questionType, difficulty };
}

function challengeItemIsValid(
  item: unknown,
  questionType: string
): item is { question: string; options: string[]; correct_index: number } {
  if (!item || typeof item !== "object") return false;

  const q = item as Record<string, unknown>;

  if (typeof q.question !== "string" || !q.question.trim()) return false;
  if (!Array.isArray(q.options)) return false;
  if (!q.options.every((option) => typeof option === "string")) return false;
  if (!Number.isInteger(q.correct_index)) return false;

  const options = q.options as string[];
  const correctIndex = q.correct_index as number;

  if (questionType === "Written") {
    return options.length === 0 && correctIndex === -1;
  }

  if (questionType === "Multiple choice") {
    return options.length >= 2 &&
      options.length <= 4 &&
      correctIndex >= 0 &&
      correctIndex < options.length;
  }

  return (
    (options.length === 0 && correctIndex === -1) ||
    (
      options.length >= 2 &&
      options.length <= 4 &&
      correctIndex >= 0 &&
      correctIndex < options.length
    )
  );
}

function normalizeChallengeQuiz(
  quiz: unknown,
  count: number,
  questionType: string
) {
  if (!Array.isArray(quiz)) return [];

  return quiz
    .filter((item) => challengeItemIsValid(item, questionType))
    .slice(0, count);
}

function normalizeResult(value: unknown) {
  const item = (value && typeof value === "object") ? value as Record<string, unknown> : {};
  const intent = isValidIntent(item.intent) ? item.intent : "OTHER";
  const clarificationRequired = item.clarification_required === true &&
    intent === "OTHER" || item.clarification_required === true &&
    (intent === "PERSONAL_KNOWLEDGE" || intent === "EXAM_EXPLANATION");

  const arrayOfStrings = (input: unknown) => Array.isArray(input)
    ? input.filter((v): v is string => typeof v === "string").slice(0, 30)
    : [];

  const flashcards = Array.isArray(item.flashcards)
    ? item.flashcards.filter((v): v is { front: string; back: string } =>
        !!v && typeof v === "object" && typeof (v as Record<string, unknown>).front === "string" && typeof (v as Record<string, unknown>).back === "string"
      ).slice(0, 50)
    : [];

  const quiz = Array.isArray(item.quiz)
    ? item.quiz.filter((v): v is { question: string; options: string[]; correct_index: number } => {
        if (!v || typeof v !== "object") return false;
        const q = v as Record<string, unknown>;
        return typeof q.question === "string" && Array.isArray(q.options) &&
          q.options.every((option) => typeof option === "string") && Number.isInteger(q.correct_index);
      }).slice(0, 50)
    : [];

  return {
    intent,
    confidence: typeof item.confidence === "number" ? Math.max(0, Math.min(1, item.confidence)) : 0.5,
    clarification_required: clarificationRequired,
    clarification_prompt: clarificationRequired
      ? (typeof item.clarification_prompt === "string" && item.clarification_prompt.trim()
        ? item.clarification_prompt.trim()
        : "How should I approach this?")
      : "",
    clarification_options: clarificationRequired
      ? ["Personal knowledge", "Exam / Test explanation"]
      : [],
    topic: typeof item.topic === "string" && item.topic.trim() ? item.topic.trim().slice(0, 160) : "Study",
    summary: typeof item.summary === "string" ? item.summary.trim() : "",
    direct_answer: typeof item.direct_answer === "string" ? item.direct_answer.trim() : "",
    key_concepts: arrayOfStrings(item.key_concepts),
    notes: arrayOfStrings(item.notes),
    flashcards,
    quiz,
    next_steps: arrayOfStrings(item.next_steps),
  };
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    const anon = await checkAnonymousUsage();
    if (anon.blocked) return anonymousLimitResponse();
  } else {
    const usage = await checkAndIncrementUsage(authHeader);
    if (usage.blocked) return usageBlockedResponse();
  }

  const body = await req.json().catch(() => ({}));
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const preferredLanguage = typeof body.preferred_language === "string" ? body.preferred_language : "en";
  const material = typeof body.material === "string" ? body.material.trim() : "";
  const studyIntent = isValidIntent(body.study_intent) ? body.study_intent : null;
  const userContext = typeof body.context === "string" ? body.context.trim() : "";

  if (!topic) {
    return Response.json({ error: "Tell me what you'd like to learn or clarify." }, { status: 400 });
  }

  const requestParts = [
    `USER REQUEST:\n${topic}`,
    studyIntent ? `USER-SELECTED INTENT:\n${studyIntent}` : "",
    userContext ? `CURRENT STUDY CONTEXT:\n${userContext.slice(0, 12000)}` : "",
    material ? `SUPPLIED STUDY MATERIAL:\n${material.slice(0, 30000)}` : "",
  ].filter(Boolean);

  console.log(`[STUDY] intent=${studyIntent ?? "auto"} topic="${topic.slice(0, 160)}" material=${material ? "yes" : "no"}`);

  const raw = await createChatCompletion(
    buildSystemPrompt(preferredLanguage),
    requestParts.join("\n\n"),
    0.25
  );

  if (raw === null) {
    console.log(`[STUDY] all providers exhausted`);
    return Response.json(
      { error: "BillyOS's free daily AI usage across all providers is used up for today. This resets at midnight UTC — please come back then." },
      { status: 503 }
    );
  }

  console.log(`[STUDY] raw length=${raw.length}`);

  try {
    const parsed = normalizeResult(extractJson(raw));

    if (parsed.intent === "CHALLENGE") {
      const settings = extractChallengeSettings(topic);

      parsed.quiz = normalizeChallengeQuiz(
        parsed.quiz,
        settings.count,
        settings.questionType
      );

      if (parsed.quiz.length !== settings.count) {
        console.log(
          `[STUDY] challenge mismatch expected=${settings.count} actual=${parsed.quiz.length} ` +
          `type=${settings.questionType} difficulty=${settings.difficulty}; retrying`
        );

        const repairPrompt = [
          `Create exactly ${settings.count} ${settings.difficulty.toLowerCase()} questions.`,
          `Question type: ${settings.questionType}.`,
          `Do not add extra questions.`,
          `Return ONLY valid JSON using this shape:`,
          `{"quiz":[{"question":"...","options":[],"correct_index":-1}]}`,
          `For Multiple choice, use 2 to 4 options and a valid correct_index.`,
          `For Written, use options: [] and correct_index: -1.`,
          `Topic/request: ${topic}`
        ].join("\\n");

        const repairedRaw = await createChatCompletion(
          buildSystemPrompt(preferredLanguage),
          repairPrompt,
          0.15
        );

        if (repairedRaw !== null) {
          try {
            const repaired = extractJson(repairedRaw) as Record<string, unknown>;
            parsed.quiz = normalizeChallengeQuiz(
              repaired.quiz,
              settings.count,
              settings.questionType
            );
          } catch {
            console.log(`[STUDY] challenge repair JSON parse failed`);
          }
        }
      }

      console.log(
        `[STUDY] challenge final=${parsed.quiz.length}/${settings.count} ` +
        `type=${settings.questionType} difficulty=${settings.difficulty}`
      );
    }

    console.log(`[STUDY] parsed OK intent=${parsed.intent} clarification=${parsed.clarification_required}`);
    return Response.json(parsed);
  } catch (err) {
    console.log(`[STUDY] JSON parse FAILED: ${(err as Error).message}`);
    return Response.json({ error: "Couldn't understand that Study request right now — please try again." }, { status: 500 });
  }
}
