import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
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

const DAILY_LIMIT = 50;

function todayString() {
  return new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function nextResetTime() {
  const now = new Date();
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return reset;
}

async function checkAndIncrementUsage(authHeader: string | null) {
  if (!authHeader) return { userId: null, count: 0, blocked: false };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { userId: null, count: 0, blocked: false };

  const userId = userData.user.id;
  const today = new Date().toISOString().slice(0, 10);

  const { data: row } = await supabase
    .from("usage_daily")
    .select("message_count")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();

  const currentCount = row?.message_count || 0;

  if (currentCount >= DAILY_LIMIT) {
    return { userId, count: currentCount, blocked: true };
  }

  const newCount = currentCount + 1;
  await supabase.from("usage_daily").upsert({ user_id: userId, usage_date: today, message_count: newCount });

  return { userId, count: newCount, blocked: false };
}

async function needsSearch(question: string): Promise<{ needed: boolean; query: string }> {
  for (const model of MODEL_FALLBACKS) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: `Today is ${todayString()}. Decide if answering this message well requires current/recent real-world information. Respond with ONLY JSON: {"needed": true or false, "query": "search query if needed, else empty string"}` },
          { role: "user", content: question },
        ],
        temperature: 0.1,
        max_tokens: 150,
      });
      const raw = completion.choices[0]?.message?.content || "{}";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1));
      return { needed: !!parsed.needed, query: parsed.query || question };
    } catch {
      continue;
    }
  }
  return { needed: false, query: question };
}

function buildSystemPrompt(complexity: string, personalization?: any, searchContext?: string) {
  const COMPLEXITY_TEXT: Record<string, string> = {
    simple: "Explain in the simplest possible terms, as if to a curious 10-year-old.",
    normal: "Explain at a normal, clear adult level.",
    expert: "Explain with real technical depth and precision, assuming an expert audience.",
  };
  let personal = "";
  if (personalization) {
    const parts: string[] = [];
    if (personalization.display_name) parts.push(`Address the user as "${personalization.display_name}" when natural.`);
    if (personalization.nickname) parts.push(`They also like being called "${personalization.nickname}" casually.`);
    if (personalization.occupation) parts.push(`Their occupation/context: ${personalization.occupation}.`);
    if (personalization.about_text) parts.push(`What they've shared about themselves: ${personalization.about_text}`);
    if (parts.length > 0) personal = `\n\nPERSONAL CONTEXT — use naturally and sparingly:\n${parts.join(" ")}`;
  }
  const searchBlock = searchContext
    ? `\n\nYou have real, current search results below from ${todayString()}. Use them as your primary source and cite with [1], [2] etc:\n${searchContext}`
    : `\n\nToday's real date is ${todayString()}. If unsure about something recent, say so rather than guessing.`;
  return `You are BillyOS, built by Billy Nandy, with guidance and direction from Ahmed Ghazi. If asked what you are, answer briefly.

Rules:
- UK English spelling. Never invent facts. Never use LaTeX. Format with proper markdown.
- ${COMPLEXITY_TEXT[complexity] || COMPLEXITY_TEXT.normal}${personal}${searchBlock}`;
}

export async function POST(req: Request) {
  const { messages, complexity, personalization } = await req.json();
  const authHeader = req.headers.get("Authorization");

  const usage = await checkAndIncrementUsage(authHeader);

  if (usage.blocked) {
    const resetAt = nextResetTime();
    return Response.json({
      error: `You're out of messages for today (${DAILY_LIMIT}/day limit). Your limit resets at ${resetAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} — you can still browse your saved chats until then.`,
    }, { status: 429 });
  }

  const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";
  const check = await needsSearch(lastUserMessage);
  let searchContext = "";
  let sourcesForClient: { title: string; url: string }[] = [];

  if (check.needed) {
    try {
      const results = await tavilySearch(check.query, 5);
      sourcesForClient = results.map((r) => ({ title: r.title, url: r.url }));
      searchContext = results.map((r, i) => `[${i + 1}] ${r.title}\n${r.content.slice(0, 500)}`).join("\n\n");
    } catch {}
  }

  const systemPrompt = buildSystemPrompt(complexity, personalization, searchContext || undefined);

  for (const model of MODEL_FALLBACKS) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.4,
        stream: true,
      });

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) controller.enqueue(encoder.encode(content));
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "X-Billy-Searched": check.needed ? "true" : "false",
          "X-Billy-Sources": encodeURIComponent(JSON.stringify(sourcesForClient)),
          "X-Billy-Usage-Count": String(usage.count),
          "X-Billy-Usage-Limit": String(DAILY_LIMIT),
        },
      });
    } catch (err: any) {
      const status = err?.status;
      if (status === 429 || status === 503) continue;
      return Response.json({ error: "The AI is temporarily unavailable. Please try again shortly." }, { status: 500 });
    }
  }

  return Response.json({ error: "BillyOS's free daily AI usage is used up for today. This resets at midnight UTC — please come back then." }, { status: 503 });
}
