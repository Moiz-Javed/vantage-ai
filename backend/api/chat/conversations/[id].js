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

    const { id } = req.query; // Vercel fills this from the [id].js filename
    const conversation = await Conversation.findOne({ _id: id, userId });
    if (!conversation) return res.status(404).json({ error: "Not found" });

    res.status(200).json(conversation);
  } catch (err) {
    sendError(res, err);
  }
}
