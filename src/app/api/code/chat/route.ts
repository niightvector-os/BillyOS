import OpenAI from "openai";
import { getErrorStatus } from "@/lib/errors";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const MODEL_FALLBACKS = [
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-20b:free",
];

const SYSTEM = `You are BillyOS Code, an AI coding assistant embedded in BillyOS. You help build real HTML/CSS/JS projects.

Rules:
- Understand what the user wants before acting. If their proposed approach is technically wrong, insecure, or inefficient, explain what would be better and why, then build the better version unless they insist otherwise.
- Only include files in your response that actually changed — omit files you didn't touch.
- Keep "message" conversational and brief.
- Never use LaTeX. Plain text only. UK English spelling.
- If a terminal command would genuinely help, include it in "commands" — shown to the user for manual review only, never executed automatically.

Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{"message": "what you're doing", "files": {"index.html": "full new content if changed", "style.css": "full new content if changed", "script.js": "full new content if changed"}, "commands": ["optional suggested commands"]}`;

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function POST(req: Request) {
  const { message, currentFiles, history } = await req.json();

  const context = `Current files:\n${Object.entries(currentFiles || {})
    .map(([k, v]) => `--- ${k} ---\n${v}`)
    .join("\n\n")}`;

  const historyMessages = (history || []).slice(-6).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function emit(obj: Record<string, unknown>) {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      }

      // Real, not simulated: this step is genuinely happening the moment we've received the request.
      emit({ type: "step", label: "Understanding request" });

      let parsed: Record<string, unknown> | null = null;

      for (const model of MODEL_FALLBACKS) {
        try {
          // Real: we are about to actually call the model to plan and generate.
          emit({ type: "step", label: "Planning approach" });

          const completion = await openai.chat.completions.create({
            model,
            messages: [
              { role: "system", content: `${SYSTEM}\n\n${context}` },
              ...historyMessages,
              { role: "user", content: message },
            ],
            temperature: 0.3,
          });

          const raw = completion.choices[0]?.message?.content || "";
          parsed = extractJson(raw);
          break;
        } catch (err) {
          const status = getErrorStatus(err);
          if (status === 429 || status === 503) continue;
          continue;
        }
      }

      if (!parsed) {
        emit({ type: "error", message: "BillyOS Code is temporarily unavailable. Please try again." });
        controller.close();
        return;
      }

      // Real: each of these only fires because that file's content genuinely exists in the response we got back.
      if (parsed.files) {
        for (const filename of Object.keys(parsed.files)) {
          emit({ type: "step", label: `Writing ${filename}` });
        }
      }

      emit({ type: "final", message: parsed.message, files: parsed.files || {}, commands: parsed.commands || [] });
      controller.close();
    },
  });

  return new Response(stream);
}
