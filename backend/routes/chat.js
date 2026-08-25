import express from "express";
import Conversation from "../models/Conversation.js";
import { streamChat, PERSONA_IDS } from "../services/gemini.js";
import { retrieveRelevantChunks } from "../services/rag.js";
import { requireUser, getUserId } from "../middleware/auth.js";

const router = express.Router();

/** GET /api/chat/personas — the list of assistant tones the UI can offer. */
router.get("/personas", (_req, res) => res.json(PERSONA_IDS));

/**
 * POST /api/chat/stream
 * body: {
 *   conversationId?, message, useDocument?, persona?,
 *   regenerate?,          // re-run the last assistant reply, no new user message
 *   editMessageIndex?,    // truncate history to this index, replace with `message`, continue
 * }
 * Streams the assistant's reply as Server-Sent Events, then saves both the
 * user message and the full assistant reply to Mongo once streaming ends.
 */
router.post("/stream", requireUser, async (req, res) => {
  const userId = getUserId(req);
  const { conversationId, message, useDocument, persona, regenerate, editMessageIndex } = req.body;

  if (!regenerate && (!message || !message.trim())) {
    return res.status(400).json({ error: "message is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

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
      // Drop the most recent assistant reply so we can re-generate it from
      // the same conversation state (the last message should be "user").
      if (conversation.messages[conversation.messages.length - 1]?.role === "assistant") {
        conversation.messages.pop();
      }
    } else if (typeof editMessageIndex === "number") {
      // User edited an earlier message — cut everything from that point
      // forward and continue the conversation with the edited text.
      conversation.messages = conversation.messages.slice(0, editMessageIndex);
      conversation.messages.push({ role: "user", content: message });
    } else {
      conversation.messages.push({ role: "user", content: message });
    }

    // If the user asked to use a document, pull the most relevant chunks
    // and hand them to Gemini as grounding context.
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
});

/** GET /api/chat/conversations — list the user's past conversations (sidebar). */
router.get("/conversations", requireUser, async (req, res) => {
  const userId = getUserId(req);
  const conversations = await Conversation.find({ userId })
    .select("title createdAt updatedAt")
    .sort({ updatedAt: -1 });
  res.json(conversations);
});

/** GET /api/chat/conversations/:id — full message history for one conversation. */
router.get("/conversations/:id", requireUser, async (req, res) => {
  const userId = getUserId(req);
  const conversation = await Conversation.findOne({ _id: req.params.id, userId });
  if (!conversation) return res.status(404).json({ error: "Not found" });
  res.json(conversation);
});

export default router;
