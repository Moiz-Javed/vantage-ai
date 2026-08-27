import mongoose from "mongoose";

/**
 * Serverless-safe MongoDB connection. Vercel may reuse a "warm" function
 * instance across requests, so we cache the connection promise on the
 * module scope instead of reconnecting every invocation — reconnecting
 * every time would be slow and can exhaust MongoDB Atlas's connection
 * limit under load.
 */
let cached = global._mongooseConn;
if (!cached) cached = global._mongooseConn = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI not set — add a free MongoDB Atlas connection string to your environment variables."
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
