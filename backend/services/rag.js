import DocumentChunk from "../models/DocumentChunk.js";
import { embedText } from "./gemini.js";

const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 150;

export function chunkText(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + CHUNK_SIZE, clean.length);
    chunks.push(clean.slice(start, end));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function ingestDocument({ userId, documentName, fullText }) {
  const chunks = chunkText(fullText);
  const docs = [];
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedText(chunks[i]);
    docs.push({ userId, documentName, chunkIndex: i, text: chunks[i], embedding });
  }
  await DocumentChunk.insertMany(docs);
  return { chunksStored: docs.length };
}

export async function retrieveRelevantChunks({ userId, question, documentName, topK = 4 }) {
  const filter = { userId };
  if (documentName) filter.documentName = documentName;

  const candidates = await DocumentChunk.find(filter).lean();
  if (candidates.length === 0) return [];

  const questionEmbedding = await embedText(question);

  const scored = candidates.map((c) => ({
    text: c.text,
    documentName: c.documentName,
    score: cosineSimilarity(questionEmbedding, c.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
