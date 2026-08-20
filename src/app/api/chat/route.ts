import { tavilySearch } from "@/lib/tavily";
import { createChatStream } from "@/lib/ai-providers";


function todayString() {
  return new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function needsSearch(question: string): { needed: boolean; query: string } {
  const t = question.toLowerCase();
  const patterns = [
    /\btoday\b/, /\blatest\b/, /\bcurrent(ly)?\b/, /\bright now\b/,
    /\bthis (year|month|week)\b/, /\b202[4-9]\b/, /\brecent(ly)?\b/, /\bnews\b/,
    /\bwho won\b/, /\bthe score\b/, /\bhappening\b/, /\bupdate on\b/,
    /\bwhat(\'s| is)? (happening|going on)\b/,
  ];
  return { needed: patterns.some((p) => p.test(t)), query: question };
}

type PersonalizationLite = { display_name?: string | null; nickname?: string | null; occupation?: string | null; about_text?: string | null };

function buildSystemPrompt(complexity: string, personalization?: PersonalizationLite, searchContext?: string) {
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
  return `You are BillyOS, built by Billy Nandy, with guidance and direction from Ahmed Ghazi.

If someone asks what you are or what you can do, answer in short, simple, everyday words — no jargon, no technical terms. Describe yourself as a helpful AI assistant that can:
- Chat and answer questions on any topic, explained simply
- Look up current, up-to-date information from the internet when needed (so you can answer questions about recent events, not just older knowledge)
- Turn answers into charts, pictures, maps, and other visuals when that helps explain something
- Find places and show them on a map, including distance and directions
- Find and show helpful videos to explain a topic
- Build a study guide with notes, flashcards, and a quiz on any topic
Do not describe technical limits like "I cannot access the internet" or "I cannot execute code" — those are not true for you. If you genuinely don't know something or aren't sure, just say so plainly.

Rules:
- UK English spelling. Never invent facts. Never use LaTeX. Format with proper markdown, and use short paragraphs (2-4 sentences each) rather than one long block of text.
- ${COMPLEXITY_TEXT[complexity] || COMPLEXITY_TEXT.normal}${personal}${searchBlock}`;
}

export async function POST(req: Request) {
  const { messages, complexity, personalization } = await req.json();

  type IncomingMessage = { role: string; content: string };
  const lastUserMessage = [...(messages as IncomingMessage[])].reverse().find((m) => m.role === "user")?.content || "";
  const check = needsSearch(lastUserMessage);
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

  return createChatStream(systemPrompt, messages, {
    "X-Billy-Searched": check.needed ? "true" : "false",
    "X-Billy-Sources": encodeURIComponent(JSON.stringify(sourcesForClient)),
  });
}
