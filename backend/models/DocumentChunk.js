import mongoose from "mongoose";

// One row per chunk of an uploaded PDF. `embedding` is a plain float array —
// similarity search is done in Node with cosine similarity (see
// services/rag.js) rather than a native Mongo vector index, so this works
// on the free MongoDB Atlas tier with no special setup.
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

export default mongoose.model("DocumentChunk", documentChunkSchema);
