import { clerkMiddleware, requireAuth } from "@clerk/express";

// Attaches req.auth (populated from the Clerk session token in the request)
// on every request. Individual routes then use `requireAuth()` to actually
// enforce that a valid session is present.
export const withClerk = clerkMiddleware();
export const requireUser = requireAuth();

/** Small helper so route handlers can read the logged-in user's id consistently. */
export function getUserId(req) {
  return req.auth?.userId;
}
