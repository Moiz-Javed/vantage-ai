/**
 * Sets CORS headers so the Vercel-hosted frontend (a different origin)
 * can call this API. Call at the top of every function, before anything
 * else. Returns true if the request was an OPTIONS preflight that's
 * already been fully handled (caller should just `return`).
 */
export function applyCors(req, res) {
  const allowedOrigin = process.env.FRONTEND_URL || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

/** Standard error response shape used across all functions. */
export function sendError(res, err) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
}
