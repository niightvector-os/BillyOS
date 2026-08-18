import { NextRequest, NextResponse } from "next/server";

const MODEL_FALLBACKS = [
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-20b:free",
];

const VALID_MODES = ["research", "visualize", "map", "video", "none"] as const;
type ClassifiedMode = typeof VALID_MODES[number];

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ mode: "none" });
  }

  const prompt = `Classify the user's message into exactly one category based on intent.

Categories:
- "research": wants current facts, news, or information that needs live web sources
- "visualize": wants a chart, comparison, timeline, table, or trip plan
- "map": wants directions, distance, or to find a place
- "video": wants something explained via video
- "none": plain conversation, no special mode needed

Message: "${message}"

Respond with ONLY valid JSON, nothing else: {"mode": "..."}`;

  for (const model of MODEL_FALLBACKS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 20,
          temperature: 0,
        }),
      });
      if (!res.ok) continue;

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content ?? "";
      const parsed = JSON.parse(raw.trim());
      if (VALID_MODES.includes(parsed.mode)) {
        return NextResponse.json({ mode: parsed.mode as ClassifiedMode });
      }
    } catch {
      continue;
    }
  }
  return NextResponse.json({ mode: "none" });
}
