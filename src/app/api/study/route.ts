import OpenAI from "openai";
import { checkAndIncrementUsage, usageBlockedResponse } from "@/lib/usage";
import { getErrorStatus, getErrorMessage } from "@/lib/errors";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const MODEL_FALLBACKS = [
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-20b:free",
];

const SYSTEM_PROMPT = `You are BillyOS's Study Mode. Given a topic, produce a study set.
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
Use clear English (UK spelling). Never invent facts you're not confident about.
Never use LaTeX or math notation syntax (e.g. \\xrightarrow, \\text{}, \\frac{}). Write any equations or formulas in plain readable text, e.g. "6CO2 + 6H2O + light -> C6H12O6 + 6O2" rather than LaTeX.`;

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function POST(req: Request) {
  const usage = await checkAndIncrementUsage(req.headers.get("Authorization"));
  if (usage.blocked) return usageBlockedResponse();

  const { topic } = await req.json();
  console.log(`[STUDY] topic="${topic}"`);

  for (const model of MODEL_FALLBACKS) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: topic },
        ],
        temperature: 0.4,
      });

      const raw = completion.choices[0]?.message?.content || "";
      console.log(`[STUDY] model=${model} raw length=${raw.length}`);
      console.log(`[STUDY] model=${model} raw (first 300 chars): ${raw.slice(0, 300)}`);

      const parsed = extractJson(raw);
      console.log(`[STUDY] model=${model} parsed OK, keys: ${Object.keys(parsed).join(", ")}`);
      return Response.json(parsed);
    } catch (err) {
      const status = getErrorStatus(err);
      console.log(`[STUDY] model=${model} FAILED: ${getErrorMessage(err)}`);
      if (status === 429 || status === 503) continue;
      continue;
    }
  }

  console.log(`[STUDY] all models exhausted`);
  return Response.json({ error: "BillyOS's free daily AI usage is used up for today. This resets at midnight UTC — please come back then." }, { status: 503 });
}
