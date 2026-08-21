import { checkAndIncrementUsage, usageBlockedResponse } from "@/lib/usage";
import { createChatCompletion } from "@/lib/ai-providers";

function buildSystemPrompt(preferredLanguage?: string) {
  const languageRule = preferredLanguage && preferredLanguage !== "en"
    ? `Write all CONTENT (summary, notes, flashcards, quiz questions/options) in the language with ISO code "${preferredLanguage}". Keep the JSON keys themselves in English exactly as shown below — only translate the values.`
    : `Use clear English (UK spelling).`;
  return `You are BillyOS's Study Mode. Given a topic, produce a study set.
Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "topic": "short topic title",
  "summary": "2-3 sentence plain-English overview",
  "key_concepts": ["concept 1", "concept 2", "..."],
  "notes": ["short note 1", "short note 2", "..."],
  "flashcards": [{"front": "question or term", "back": "answer or definition"}],
  "quiz": [{"question": "text", "options": ["a", "b", "c", "d"], "correct_index": 0}]
}
Include 5-6 key_concepts, 4-6 notes, 6-8 flashcards, and 5 quiz questions.
${languageRule} Never invent facts you're not confident about.
Never use LaTeX or math notation syntax (e.g. \\xrightarrow, \\text{}, \\frac{}). Write any equations or formulas in plain readable text, e.g. "6CO2 + 6H2O + light -> C6H12O6 + 6O2" rather than LaTeX.`;
}

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function POST(req: Request) {
  const usage = await checkAndIncrementUsage(req.headers.get("Authorization"));
  if (usage.blocked) return usageBlockedResponse();

  const { topic, preferred_language } = await req.json();
  console.log(`[STUDY] topic="${topic}"`);

  const raw = await createChatCompletion(buildSystemPrompt(preferred_language), topic, 0.4);

  if (raw === null) {
    console.log(`[STUDY] all providers exhausted`);
    return Response.json(
      { error: "BillyOS's free daily AI usage across all providers is used up for today. This resets at midnight UTC — please come back then." },
      { status: 503 }
    );
  }

  console.log(`[STUDY] raw length=${raw.length}`);
  console.log(`[STUDY] raw (first 300 chars): ${raw.slice(0, 300)}`);

  try {
    const parsed = extractJson(raw);
    console.log(`[STUDY] parsed OK, keys: ${Object.keys(parsed).join(", ")}`);
    return Response.json(parsed);
  } catch (err) {
    console.log(`[STUDY] JSON parse FAILED: ${(err as Error).message}`);
    return Response.json({ error: "Couldn't build a study set right now — please try again." }, { status: 500 });
  }
}
