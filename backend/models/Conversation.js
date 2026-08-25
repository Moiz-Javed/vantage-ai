import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    // Set when the message referenced an uploaded image or PDF, so the UI
    // can show a small attachment chip on the message bubble.
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

export default mongoose.model("Conversation", conversationSchema);
