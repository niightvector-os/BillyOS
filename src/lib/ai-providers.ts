import OpenAI from "openai";

// Each provider tried in order. If every model in a provider fails
// (rate-limited/exhausted), we move to the next provider automatically.
// Once a provider's daily quota resets, it's simply tried first again
// on the next request — no manual switching needed.

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const PROVIDER_CHAIN = [
  { client: openrouter, models: [
      "google/gemma-4-31b-it:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "openai/gpt-oss-20b:free",
    ] },
  { client: groq, models: ["llama-3.3-70b-versatile"] },
  { client: gemini, models: ["gemini-2.5-flash"] },
];

function isRetryableStatus(status: number | undefined) {
  return status === 429 || status === 503;
}

export async function createChatStream(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  extraHeaders?: Record<string, string>
) {
  const typedMessages = messages as OpenAI.Chat.ChatCompletionMessageParam[];
  for (const provider of PROVIDER_CHAIN) {
    for (const model of provider.models) {
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
        const status = (err as { status?: number })?.status;
        if (isRetryableStatus(status)) continue; // try next model/provider
        // Non-retryable error (bad request, auth issue, etc.) — stop entirely
        return Response.json(
          { error: "The AI is temporarily unavailable. Please try again shortly." },
          { status: 500 }
        );
      }
    }
  }
  // Every provider and every model exhausted
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
        const status = (err as { status?: number })?.status;
        if (status === 429 || status === 503) continue;
        return null; // non-retryable error — give up entirely
      }
    }
  }
  return null; // every provider/model exhausted
}
