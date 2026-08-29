import { getLocations, getRouteIfRequested } from "@/lib/geocode";
import { fetchWikipediaImages } from "@/lib/wikipedia";
import { createChatCompletion } from "@/lib/ai-providers";

function buildExplanationPrompt(topic: string, preferredLanguage?: string) {
  const languageRule = preferredLanguage && preferredLanguage !== "en"
    ? `Write your ENTIRE answer in the language with ISO code "${preferredLanguage}".`
    : "Use clear English (UK spelling).";
  return `You are BillyOS's Find on Map feature. The user asked about: "${topic}"
Give a genuinely informative answer about this place — not just a one-line blurb. Cover things like: what it actually is, why it's notable or worth knowing about, relevant history or context, and anything practically useful (best time to visit, what it's known for, nearby significance) if applicable.
${languageRule}
Structure: a short bolded lead sentence with the core answer, then 2-4 short paragraphs or bullet points covering the above. Never invent facts you're not confident about — if you're unsure of a specific detail, say so rather than guessing. Never use LaTeX.`;
}

export async function POST(req: Request) {
  const { topic, preferred_language } = await req.json();

  const routeResult = await getRouteIfRequested(topic);
  if (routeResult) {
    const [explanation, images] = await Promise.all([
      createChatCompletion(buildExplanationPrompt(topic, preferred_language), topic, 0.4),
      fetchWikipediaImages(topic, 4).catch(() => []),
    ]);
    return Response.json({
      topic,
      isRoute: true,
      origin: routeResult.origin,
      destination: routeResult.destination,
      routes: routeResult.routes,
      locations: [routeResult.origin, routeResult.destination],
      explanation: explanation || null,
      images: images || [],
    });
  }

  const [locations, explanation, images] = await Promise.all([
    getLocations(topic, 5),
    createChatCompletion(buildExplanationPrompt(topic, preferred_language), topic, 0.4),
    fetchWikipediaImages(topic, 4).catch(() => []),
  ]);

  if (locations.length === 0) {
    return Response.json({ error: "Couldn't find real-world locations for that." }, { status: 404 });
  }

  return Response.json({ topic, isRoute: false, locations, explanation: explanation || null, images: images || [] });
}
