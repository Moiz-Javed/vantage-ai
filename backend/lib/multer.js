import multer from "multer";

export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * Multer is Express middleware (req, res, next) — this wraps it in a
 * Promise so it can be awaited inside a plain Vercel serverless function,
 * which has no middleware chain to run it through automatically.
 */
export function runMiddleware(req, res, middleware) {
  return new Promise((resolve, reject) => {
    middleware(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      resolve(result);
    });
  });
}
