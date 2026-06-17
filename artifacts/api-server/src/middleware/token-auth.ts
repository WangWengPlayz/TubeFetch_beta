import type { Request, Response, NextFunction } from "express";

/**
 * Optional token authentication middleware.
 *
 * Activated only when the `API_TOKEN` environment variable is set.
 * When active, every request must supply the token via one of:
 *   - Query param:       ?token=<token>
 *   - Authorization header: Bearer <token>
 *
 * When `API_TOKEN` is not set (the default), this middleware is a no-op
 * and all routes remain publicly accessible — preserving full backward
 * compatibility with existing integrations.
 */
export function optionalTokenAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = process.env["API_TOKEN"]?.trim();

  if (!token) {
    next();
    return;
  }

  const provided =
    (typeof req.query.token === "string" ? req.query.token : null) ??
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null);

  if (!provided) {
    res.status(401).json({
      error: "Unauthorized",
      hint: "Provide a valid token via ?token=<token> or Authorization: Bearer <token>",
    });
    return;
  }

  if (provided !== token) {
    res.status(403).json({ error: "Invalid token" });
    return;
  }

  next();
}
