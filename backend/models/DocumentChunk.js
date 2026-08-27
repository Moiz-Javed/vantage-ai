import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    documentName: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

export default mongoose.models.DocumentChunk ||
  mongoose.model("DocumentChunk", documentChunkSchema);
