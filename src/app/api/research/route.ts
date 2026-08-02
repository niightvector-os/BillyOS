import OpenAI from "openai";
import { checkAndIncrementUsage, usageBlockedResponse } from "@/lib/usage";
import { tavilySearch } from "@/lib/tavily";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const MODEL_FALLBACKS = [
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-20b:free",
];

function buildSystemPrompt(sources: { title: string; url: string; content: string }[]) {
  const sourceBlock = sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.content.slice(0, 600)}`).join("\n\n");
  return `You are BillyOS's Deep Research mode. Answer using ONLY the sources below.
Rules:
- Write in clear English (UK spelling), well-organised with markdown.
- Cite claims using ONLY simple bracket numbers like [1] or [2], matching the source list below. NEVER use any other citation format such as 【2†L1-L2】 or similar tool-generated syntax — plain [1], [2] only, nothing else.
- Never use LaTeX. Plain text formulas only.
- Be concise.

SOURCES:
${sourceBlock}`;
}

// Safety net: strip any stray non-standard citation tokens that slip through despite the instruction above
function cleanCitations(text: string) {
  return text.replace(/【[^】]*】/g, "");
}

export async function POST(req: Request) {
  const usage = await checkAndIncrementUsage(req.headers.get("Authorization"));
  if (usage.blocked) return usageBlockedResponse();

  const { query } = await req.json();

  let sources;
  try {
    sources = await tavilySearch(query);
  } catch {
    return Response.json({ error: "Web search is temporarily unavailable. Please try again shortly." }, { status: 502 });
  }

  if (sources.length === 0) {
    return Response.json({ error: "No relevant sources found for that." }, { status: 404 });
  }

  for (const model of MODEL_FALLBACKS) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: "system", content: buildSystemPrompt(sources) }, { role: "user", content: query }],
        temperature: 0.3,
      });

      const answer = cleanCitations(completion.choices[0]?.message?.content || "");
      return Response.json({ answer, sources: sources.map((s) => ({ title: s.title, url: s.url })) });
    } catch (err: any) {
      if (err?.status === 429 || err?.status === 503) continue;
      continue;
    }
  }

  return Response.json({ error: "BillyOS's free daily AI usage is used up for today. This resets at midnight UTC — please come back then." }, { status: 503 });
}
