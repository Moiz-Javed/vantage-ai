import { verifyToken } from "@clerk/backend";

/**
 * Verifies the Bearer token the frontend sends (from Clerk's getToken())
 * and returns the Clerk user id, or throws a 401-style error the caller
 * can catch and respond to. Used in place of Express's requireAuth()
 * middleware, since standalone Vercel functions have no middleware chain.
 */
export async function requireUserId(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    const err = new Error("Missing Authorization header");
    err.status = 401;
    throw err;
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    return payload.sub; // Clerk's user id claim
  } catch (e) {
    const err = new Error("Invalid or expired session token");
    err.status = 401;
    throw err;
  }
}
