import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const CHAT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const EMBED_MODEL = "gemini-embedding-001";

const PERSONAS = {
  friendly: "You are Vantage AI, a warm, conversational assistant. Explain things simply and encouragingly.",
  professional: "You are Vantage AI, a precise, formal assistant. Be concise, structured, and businesslike — no small talk.",
  concise: "You are Vantage AI. Answer as briefly as possible — short sentences, no filler, bullet points over prose where it fits.",
  creative: "You are Vantage AI, an imaginative, expressive assistant. Use vivid language and don't be afraid of analogies and humor.",
};

export const PERSONA_IDS = Object.keys(PERSONAS);

function buildSystemInstruction(persona, context) {
  const base = PERSONAS[persona] || PERSONAS.friendly;
  if (!context) return base;
  return (
    `${base}\n\nUse the following retrieved document context to answer the ` +
    `user's question when it's relevant. If the context doesn't help, answer ` +
    `from general knowledge instead.\n\n--- CONTEXT ---\n${context}\n--- END CONTEXT ---`
  );
}

/**
 * Streams a chat response chunk-by-chunk. `onChunk` is called with each
 * piece of text as it arrives from Gemini — the route handler forwards
 * these straight to the client over Server-Sent Events.
 *
 * `history` is an array of {role: "user"|"assistant", content} — mapped to
 * Gemini's {role: "user"|"model", parts} shape here.
 * `context` is optional extra text (e.g. retrieved PDF chunks) prepended as
 * a system-style instruction so the model grounds its answer in it.
 * `persona` picks the assistant's tone (see PERSONAS above).
 */
export async function streamChat({ history, context, persona, onChunk }) {
  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: buildSystemInstruction(persona, context),
  });

  const geminiHistory = history.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = history[history.length - 1];

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessageStream(lastMessage.content);

  let full = "";
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      full += text;
      onChunk(text);
    }
  }
  return full;
}

/** Describes/answers questions about an uploaded image (base64). */
export async function analyzeImage({ base64Data, mimeType, prompt }) {
  const model = genAI.getGenerativeModel({ model: CHAT_MODEL });
  const result = await model.generateContent([
    prompt || "Describe this image in detail.",
    { inlineData: { data: base64Data, mimeType } },
  ]);
  return result.response.text();
}

/** Embeds a piece of text into a float vector for RAG similarity search. */
export async function embedText(text) {
  const model = genAI.getGenerativeModel({ model: EMBED_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}
