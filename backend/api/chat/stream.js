import { applyCors, sendError } from "../../lib/cors.js";
import { requireUserId } from "../../lib/auth.js";
import { connectDB } from "../../config/db.js";
import Conversation from "../../models/Conversation.js";
import { streamChat } from "../../services/gemini.js";
import { retrieveRelevantChunks } from "../../services/rag.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let userId;
  try {
    userId = await requireUserId(req);
    await connectDB();
  } catch (err) {
    return sendError(res, err);
  }

  const { conversationId, message, useDocument, persona, regenerate, editMessageIndex } =
    req.body || {};

  if (!regenerate && (!message || !message.trim())) {
    return res.status(400).json({ error: "message is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    let conversation = conversationId
      ? await Conversation.findOne({ _id: conversationId, userId })
      : null;

    if (!conversation) {
      conversation = await Conversation.create({
        userId,
        title: (message || "New conversation").slice(0, 60),
        persona: persona || "friendly",
        messages: [],
      });
    }

    if (persona) conversation.persona = persona;

    if (regenerate) {
      if (conversation.messages[conversation.messages.length - 1]?.role === "assistant") {
        conversation.messages.pop();
      }
    } else if (typeof editMessageIndex === "number") {
      conversation.messages = conversation.messages.slice(0, editMessageIndex);
      conversation.messages.push({ role: "user", content: message });
    } else {
      conversation.messages.push({ role: "user", content: message });
    }

    let context = null;
    const lastUserMessage = [...conversation.messages].reverse().find((m) => m.role === "user");
    if (useDocument && lastUserMessage) {
      const chunks = await retrieveRelevantChunks({
        userId,
        question: lastUserMessage.content,
        documentName: useDocument === true ? undefined : useDocument,
      });
      if (chunks.length > 0) {
        context = chunks.map((c) => `[from ${c.documentName}]: ${c.text}`).join("\n\n");
      }
    }

    const history = conversation.messages.map((m) => ({ role: m.role, content: m.content }));

    const fullReply = await streamChat({
      history,
      context,
      persona: conversation.persona,
      onChunk: (text) => {
        res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
      },
    });

    conversation.messages.push({ role: "assistant", content: fullReply });
    await conversation.save();

    res.write(`data: ${JSON.stringify({ done: true, conversationId: conversation._id })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Chat stream error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}
