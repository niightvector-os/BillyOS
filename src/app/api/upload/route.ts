import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { getErrorMessage } from "@/lib/errors";


const MAX_TOTAL_BYTES = 1024 * 1024 * 1024; // 1GB
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB per file

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

function getSupabaseAdmin(authHeader: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

async function extractFromImage(buffer: Buffer, mimeType: string): Promise<string> {
  const base64 = buffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  const completion = await openai.chat.completions.create({
    model: "google/gemma-4-31b-it:free",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe this image thoroughly and transcribe any visible text word-for-word, exactly as written (notes, handwriting, diagrams, charts, whatever is present). Be complete and accurate — this will be used to answer questions about the image later.",
          },
          { type: "image_url", image_url: { url: dataUri } },
        ] as ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[],
      },
    ],
  });

  return completion.choices[0]?.message?.content || "";
}

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp")) {
    const mimeType = name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";
    return await extractFromImage(buffer, mimeType);
  }

  return buffer.toString("utf-8");
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return Response.json({ error: "Not signed in." }, { status: 401 });

  const supabase = getSupabaseAdmin(authHeader);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return Response.json({ error: "Not signed in." }, { status: 401 });
  const userId = userData.user.id;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "No file provided." }, { status: 400 });

  const allowedTypes = [".txt", ".md", ".csv", ".pdf", ".docx", ".jpg", ".jpeg", ".png", ".webp"];
  const isAllowed = allowedTypes.some((ext) => file.name.toLowerCase().endsWith(ext));
  if (!isAllowed) {
    return Response.json({ error: "That file type isn't supported yet. Try .txt, .md, .csv, .pdf, .docx, or an image." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ error: "File is too large (25MB max per file)." }, { status: 400 });
  }

  const { data: existing } = await supabase.from("uploads").select("size_bytes").eq("user_id", userId);
  const currentTotal = (existing || []).reduce((sum, row) => sum + Number(row.size_bytes), 0);
  if (currentTotal + file.size > MAX_TOTAL_BYTES) {
    return Response.json({ error: "You've reached your 1GB storage limit. Delete some uploads to free up space." }, { status: 413 });
  }

  let extractedText = "";
  try {
    extractedText = await extractText(file);
  } catch (err) {
    console.log(`[UPLOAD] extraction failed for "${file.name}": ${getErrorMessage(err)}`);
    return Response.json({ error: `Couldn't read that file's content: ${getErrorMessage(err)}` }, { status: 422 });
  }

  const storagePath = `${userId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("uploads").upload(storagePath, file);
  if (uploadError) {
    console.log(`[UPLOAD] storage upload failed: ${uploadError.message}`);
    return Response.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  const { data: record } = await supabase
    .from("uploads")
    .insert({
      user_id: userId,
      filename: file.name,
      storage_path: storagePath,
      size_bytes: file.size,
      extracted_text: extractedText.slice(0, 20000),
    })
    .select()
    .single();

  return Response.json({
    id: record?.id,
    filename: file.name,
    extractedText: extractedText.slice(0, 20000),
  });
}
