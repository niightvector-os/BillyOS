import OpenAI from "openai";

// Each provider tried in order. If every model in a provider fails
// for ANY reason (rate-limited, auth issue, transient error, timeout, etc.),
// we move to the next provider automatically. Once a provider's daily quota
// resets, it's simply tried first again on the next request — no manual
// switching needed. We never give up early on a single provider's failure —
// only after every provider AND every model has been tried.
//
// CRITICAL: every call has a hard timeout (REQUEST_TIMEOUT_MS) and
// maxRetries: 0. Without this, a slow/hanging provider can stall the
// whole chain for minutes before we ever try the next one.

const REQUEST_TIMEOUT_MS = 20_000; // 20 seconds — fail fast, try the next provider

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  timeout: REQUEST_TIMEOUT_MS,
  maxRetries: 0,
});

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  timeout: REQUEST_TIMEOUT_MS,
  maxRetries: 0,
});

const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  timeout: REQUEST_TIMEOUT_MS,
  maxRetries: 0,
});

export const PROVIDER_CHAIN = [
  { name: "openrouter", client: openrouter, models: [
      "google/gemma-4-31b-it:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "openai/gpt-oss-20b:free",
    ] },
  { name: "groq", client: groq, models: ["llama-3.3-70b-versatile"] },
  { name: "gemini", client: gemini, models: ["gemini-2.5-flash"] },
];

function describeError(err: unknown) {
  const e = err as { status?: number; message?: string };
  return `status=${e?.status ?? "unknown"} message=${e?.message ?? String(err)}`;
}

export async function createChatStream(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  extraHeaders?: Record<string, string>
) {
  const typedMessages = messages as OpenAI.Chat.ChatCompletionMessageParam[];

  for (const provider of PROVIDER_CHAIN) {
    for (const model of provider.models) {
      const start = Date.now();
      try {
        const completion = await provider.client.chat.completions.create({
          model,
          messages: [{ role: "system", content: systemPrompt }, ...typedMessages],
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

        return new Response(stream, { headers: extraHeaders });
      } catch (err) {
        console.error(`[ai-providers] ${provider.name}/${model} failed after ${Date.now() - start}ms — ${describeError(err)}`);
        continue;
      }
    }
  }
  console.error("[ai-providers] all providers and models exhausted for createChatStream");
  return Response.json(
    {
      error:
        "BillyOS's free daily AI usage across all providers is used up for today. This resets at midnight UTC — please come back then.",
    },
    { status: 503 }
  );
}

// Non-streaming variant — returns the full completion text (or null if every
// provider/model failed), for routes that need the whole answer before
// responding (e.g. research, which post-processes citations).
export async function createChatCompletion(
  systemPrompt: string,
  userMessage: string,
  temperature = 0.4
): Promise<string | null> {
  for (const provider of PROVIDER_CHAIN) {
    for (const model of provider.models) {
      const start = Date.now();
      try {
        const completion = await provider.client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature,
        });
        return completion.choices[0]?.message?.content || "";
      } catch (err) {
        console.error(`[ai-providers] ${provider.name}/${model} failed after ${Date.now() - start}ms — ${describeError(err)}`);
        continue;
      }
    }
  }
  console.error("[ai-providers] all providers and models exhausted for createChatCompletion");
  return null;
}
