import { checkAndIncrementUsage, usageBlockedResponse } from "@/lib/usage";
import { RouterResponseSchema, GENERATIVE_SCHEMAS } from "@/lib/visualize-schema";
import type { RouterResponse } from "@/lib/visualize-schema";
import { tavilySearch } from "@/lib/tavily";
import { getLocations } from "@/lib/geocode";
import { fetchWikipediaImages } from "@/lib/wikipedia";
import { searchYoutube } from "@/lib/youtube";
import { Timer } from "@/lib/timing";
import { createChatCompletion } from "@/lib/ai-providers";

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function buildRouterSystem(preferredLanguage?: string) {
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const languageRule = preferredLanguage && preferredLanguage !== "en"
    ? `Write the "summary" field in the language with ISO code "${preferredLanguage}". Keep all other JSON keys/values (block types, reasons) in English exactly as specified.`
    : "";
  return `You are BillyOS's Visual Intelligence router. Today's real date is ${today}.
FIRST, decide needs_live_research (true for current events/prices/deadlines/officeholders/sports/schedules; false for stable knowledge; prefer true when unsure).
SECOND, choose visual blocks: bar_chart, line_chart, pie_chart, timeline, comparison_cards, table, map, video, images, text_only. Most questions need 0-2. text_only is valid.
${languageRule}
Respond ONLY JSON: {"summary": "...", "needs_live_research": boolean, "research_query": "...", "blocks": [{"type": "...", "reason": "..."}]}`;
}

function buildGenerationSystem(blockTypes: string[], sources: { title: string; content: string }[] | null, preferredLanguage?: string) {
  const sourceBlock = sources && sources.length > 0
    ? `\n\nGROUND DATA IN THESE SOURCES:\n${sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.content.slice(0, 500)}`).join("\n\n")}`
    : "\n\nUse only stable, well-established knowledge. Never invent numbers.";
  const shapes: Record<string, string> = {
    bar_chart: `"bar_chart": {"title":"...","unit":"...","data":[{"label":"...","value":number}]}`,
    line_chart: `"line_chart": {"title":"...","series":[{"label":"...","points":[{"x":"...","y":number}]}]}`,
    pie_chart: `"pie_chart": {"title":"...","data":[{"label":"...","value":number}]}`,
    timeline: `"timeline": {"events":[{"date":"...","label":"...","description":"..."}]}`,
    comparison_cards: `"comparison_cards": {"items":[{"title":"...","facts":[{"label":"...","value":"..."}]}]}`,
    table: `"table": {"columns":["..."],"rows":[["...","..."]]}`,
  };
  const wanted = blockTypes.filter((t) => shapes[t]).map((t) => shapes[t]);
  const languageRule = preferredLanguage && preferredLanguage !== "en"
    ? ` Write all title/label/description/text VALUES in the language with ISO code "${preferredLanguage}", but keep the JSON key names shown above exactly as given (do not translate keys like "title", "data", "label", "value").`
    : " UK English.";
  return `Generate real, accurate data for: ${wanted.join(", ")}. Respond ONLY JSON: {"generated": {${wanted.join(", ")}}}${sourceBlock}\nNever use LaTeX.${languageRule}`;
}

export async function POST(req: Request) {
  const usage = await checkAndIncrementUsage(req.headers.get("Authorization"));
  if (usage.blocked) return usageBlockedResponse();

  const timer = new Timer();
  const { question, preferred_language, context } = await req.json();
  const effectiveQuestion = context ? `${context}\n\nFollow-up question: ${question}` : question;

  let routed: RouterResponse | null = null;
  const routerRaw = await createChatCompletion(buildRouterSystem(preferred_language), effectiveQuestion, 0.2);
  if (routerRaw !== null) {
    try {
      const parsed = RouterResponseSchema.safeParse(extractJson(routerRaw));
      if (parsed.success) routed = parsed.data;
    } catch {}
  }
  timer.mark("classify");
  if (!routed) {
    timer.log("/api/visualize [classify failed]");
    return Response.json(
      { error: "BillyOS's free daily AI usage across all providers is used up for today. This resets at midnight UTC — please come back then." },
      { status: 503 }
    );
  }

  let sourcesForGeneration: { title: string; content: string }[] = [];
  let sourcesForDisplay: { title: string; url: string }[] = [];
  let researchFailed = false;

  if (routed.needs_live_research) {
    try {
      const results = await tavilySearch(routed.research_query || question, 5);
      sourcesForGeneration = results.map((r) => ({ title: r.title, content: r.content }));
      sourcesForDisplay = results.map((r) => ({ title: r.title, url: r.url }));
    } catch {
      researchFailed = true;
    }
  }
  timer.mark(`research(needed=${routed.needs_live_research})`);

  const blockTypes: string[] = routed.blocks.map((b) => b.type).filter((t: string) => t !== "text_only");
  const generativeTypes = blockTypes.filter((t) => GENERATIVE_SCHEMAS[t]);
  const finalBlocks: { type: string; data: unknown }[] = [];

  if (generativeTypes.length > 0) {
    let generated: Record<string, unknown> | null = null;
    const genRaw = await createChatCompletion(
      buildGenerationSystem(generativeTypes, routed.needs_live_research ? sourcesForGeneration : null, preferred_language),
      effectiveQuestion,
      0.3
    );
    if (genRaw !== null) {
      try {
        generated = extractJson(genRaw).generated || null;
      } catch {}
    }
    if (generated) {
      for (const type of generativeTypes) {
        const check = GENERATIVE_SCHEMAS[type].safeParse(generated[type]);
        if (type === "trip_plan") {
          const tripData = check.data as { destination: string; thingsToDo: string[] };
          const encoded = encodeURIComponent(tripData.destination);
          finalBlocks.push({
            type,
            data: {
              ...tripData,
              hotelUrl: `https://www.booking.com/searchresults.html?ss=${encoded}`,
              flightUrl: `https://www.google.com/travel/flights?q=Flights%20to%20${encoded}`,
            },
          });
        } else {
          finalBlocks.push({ type, data: check.data });
        }
      }
    }
  }
  timer.mark(`generation(${generativeTypes.join(",") || "none"})`);

  const lookupPromises: Promise<void>[] = [];
  if (blockTypes.includes("map")) {
    lookupPromises.push(getLocations(question, 4).then((locations) => { if (locations.length > 0) finalBlocks.push({ type: "map", data: { locations } }); }));
  }
  if (blockTypes.includes("images")) {
    lookupPromises.push(fetchWikipediaImages(question, 4).then((images) => { if (images.length > 0) finalBlocks.push({ type: "images", data: { images } }); }));
  }
  if (blockTypes.includes("video")) {
    lookupPromises.push(searchYoutube(question, 3).then((videos) => { if (videos.length > 0) finalBlocks.push({ type: "video", data: { videos } }); }));
  }
  await Promise.all(lookupPromises);
  timer.mark(`lookups(${blockTypes.filter((t) => ["map", "images", "video"].includes(t)).join(",") || "none"})`);
  timer.log("/api/visualize");

  return Response.json({ summary: routed.summary, needs_live_research: routed.needs_live_research, researchFailed, sources: sourcesForDisplay, blocks: finalBlocks });
}
