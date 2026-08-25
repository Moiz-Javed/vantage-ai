import express from "express";
import multer from "multer";
import { analyzeImage } from "../services/gemini.js";
import { requireUser } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * POST /api/image/analyze  (multipart/form-data, field name "file")
 * Optional body field "prompt" — what to ask about the image.
 */
router.post("/analyze", requireUser, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });

  try {
    const description = await analyzeImage({
      base64Data: req.file.buffer.toString("base64"),
      mimeType: req.file.mimetype,
      prompt: req.body.prompt,
    });
    res.json({ description });
  } catch (err) {
    console.error("Image analysis error:", err);
    res.status(500).json({ error: "Failed to analyze image: " + err.message });
  }
});

export default router;
