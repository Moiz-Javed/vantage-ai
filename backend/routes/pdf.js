import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { ingestDocument } from "../services/rag.js";
import { requireUser, getUserId } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

/**
 * POST /api/pdf/upload  (multipart/form-data, field name "file")
 * Extracts text from the PDF, chunks + embeds it, and stores it so the chat
 * route can retrieve relevant passages later.
 */
router.post("/upload", requireUser, upload.single("file"), async (req, res) => {
  const userId = getUserId(req);
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const parsed = await pdfParse(req.file.buffer);
    if (!parsed.text || parsed.text.trim().length < 20) {
      return res.status(422).json({ error: "Couldn't extract readable text from this PDF." });
    }

    const { chunksStored } = await ingestDocument({
      userId,
      documentName: req.file.originalname,
      fullText: parsed.text,
    });

    res.json({
      documentName: req.file.originalname,
      pages: parsed.numpages,
      chunksStored,
    });
  } catch (err) {
    console.error("PDF ingest error:", err);
    res.status(500).json({ error: "Failed to process PDF: " + err.message });
  }
});

export default router;
