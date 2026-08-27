import { applyCors, sendError } from "../../../lib/cors.js";
import { requireUserId } from "../../../lib/auth.js";
import { connectDB } from "../../../config/db.js";
import Conversation from "../../../models/Conversation.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await requireUserId(req);
    await connectDB();

    const conversations = await Conversation.find({ userId })
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (err) {
    sendError(res, err);
  }
}
