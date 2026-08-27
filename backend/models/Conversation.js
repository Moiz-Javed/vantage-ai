import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    attachment: {
      type: { type: String, enum: ["image", "pdf", null], default: null },
      name: String,
    },
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true }, // Clerk user id
    title: { type: String, default: "New conversation" },
    persona: { type: String, default: "friendly" },
    messages: [messageSchema],
  },
  { timestamps: true }
);

// Prevent "OverwriteModelError" when a warm serverless instance re-imports
// this module — reuse the existing compiled model if it already exists.
export default mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);
