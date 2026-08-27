import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { applyCors, sendError } from "../../lib/cors.js";
import { requireUserId } from "../../lib/auth.js";
import { connectDB } from "../../config/db.js";
import { ingestDocument } from "../../services/rag.js";
import { uploadPdf, runMiddleware } from "../../lib/multer.js";

// Vercel's default body size limit is small; PDFs need more room.
export const config = {
  api: { bodyParser: false, sizeLimit: "15mb" },
};

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await requireUserId(req);
    await connectDB();
    await runMiddleware(req, res, uploadPdf.single("file"));

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const parsed = await pdfParse(req.file.buffer);
    if (!parsed.text || parsed.text.trim().length < 20) {
      return res.status(422).json({ error: "Couldn't extract readable text from this PDF." });
    }

    const { chunksStored } = await ingestDocument({
      userId,
      documentName: req.file.originalname,
      fullText: parsed.text,
    });

    res.status(200).json({
      documentName: req.file.originalname,
      pages: parsed.numpages,
      chunksStored,
    });
  } catch (err) {
    sendError(res, err);
  }
}
