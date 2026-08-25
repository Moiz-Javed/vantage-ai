import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn(
      "⚠️  MONGODB_URI not set — chat history and PDF memory won't persist. " +
        "Add a free MongoDB Atlas connection string to .env to enable it."
    );
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
}
