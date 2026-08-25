/**
 * All calls go through "/api/..." — in dev, Vite's proxy (vite.config.js)
 * forwards these to the Express backend; in production, set VITE_API_URL
 * to your deployed backend's URL (e.g. your Render service) and requests
 * go there directly instead.
 */
const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Streams a chat reply. Calls `onChunk(text)` as pieces arrive, and
 * `onDone({ conversationId })` once the stream finishes.
 * `getToken` is Clerk's session token getter, passed in from the caller.
 */
export async function streamChatMessage({
  message,
  conversationId,
  useDocument,
  persona,
  regenerate,
  editMessageIndex,
  getToken,
  onChunk,
  onDone,
  onError,
}) {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, conversationId, useDocument, persona, regenerate, editMessageIndex }),
    });

    if (!response.ok || !response.body) {
      const err = await response.json().catch(() => ({ error: "Request failed" }));
      onError?.(err.error || "Request failed");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop(); // last part may be incomplete, keep for next chunk

      for (const part of parts) {
        if (!part.startsWith("data: ")) continue;
        const payload = JSON.parse(part.slice(6));
        if (payload.error) onError?.(payload.error);
        else if (payload.done) onDone?.(payload);
        else if (payload.chunk) onChunk?.(payload.chunk);
      }
    }
  } catch (err) {
    onError?.(err.message);
  }
}

export async function fetchPersonas() {
  const res = await fetch(`${API_BASE}/api/chat/personas`);
  if (!res.ok) return ["friendly", "professional", "concise", "creative"];
  return res.json();
}

/** Downloads the given messages as a Markdown file — no backend round-trip needed. */
export function exportConversationAsMarkdown(title, messages) {
  const lines = [`# ${title}`, ""];
  for (const m of messages) {
    lines.push(`**${m.role === "user" ? "You" : "Vantage AI"}:**`, "", m.content, "");
  }
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^\w\- ]/g, "").slice(0, 50) || "conversation"}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function fetchConversations(getToken) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/api/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load conversations");
  return res.json();
}

export async function fetchConversation(id, getToken) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/api/chat/conversations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load conversation");
  return res.json();
}

export async function uploadPdf(file, getToken) {
  const token = await getToken();
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/pdf/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "PDF upload failed");
  return data;
}

export async function analyzeImage(file, prompt, getToken) {
  const token = await getToken();
  const formData = new FormData();
  formData.append("file", file);
  if (prompt) formData.append("prompt", prompt);
  const res = await fetch(`${API_BASE}/api/image/analyze`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Image analysis failed");
  return data;
}
