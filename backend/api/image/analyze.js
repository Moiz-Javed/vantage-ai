import { applyCors, sendError } from "../../lib/cors.js";
import { requireUserId } from "../../lib/auth.js";
import { analyzeImage } from "../../services/gemini.js";
import { uploadImage, runMiddleware } from "../../lib/multer.js";

export const config = {
  api: { bodyParser: false, sizeLimit: "10mb" },
};

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await requireUserId(req);
    await runMiddleware(req, res, uploadImage.single("file"));

    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const description = await analyzeImage({
      base64Data: req.file.buffer.toString("base64"),
      mimeType: req.file.mimetype,
      prompt: req.body?.prompt,
    });

    res.status(200).json({ description });
  } catch (err) {
    sendError(res, err);
  }
}
