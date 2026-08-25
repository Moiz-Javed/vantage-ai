import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { withClerk } from "./middleware/auth.js";
import chatRoutes from "./routes/chat.js";
import pdfRoutes from "./routes/pdf.js";
import imageRoutes from "./routes/image.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(withClerk);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/chat", chatRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/image", imageRoutes);

// Centralized error handler — catches anything a route forgot to try/catch,
// including Clerk's auth errors, so the client always gets clean JSON back.
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Vantage AI backend running on port ${PORT}`));
});
