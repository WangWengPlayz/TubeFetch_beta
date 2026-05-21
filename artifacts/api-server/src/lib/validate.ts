/**
 * Input validation and error sanitization helpers.
 *
 * All user-supplied values must pass through validateQuery() before use.
 * All caught errors must pass through sanitizeError() before being sent to a client.
 */

const MAX_QUERY_LEN = 500;

// Control characters (C0/C1 range) have no legitimate use in a search query.
// Null bytes (\x00) are especially dangerous — they can truncate strings in C-based
// downstream systems. Strip them all before any further processing.
const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; reason: string };

/**
 * Validates a raw query parameter value.
 * - Rejects non-strings
 * - Strips control characters (null bytes, etc.)
 * - Enforces a maximum length to prevent amplification via oversized inputs
 * - Rejects empty / whitespace-only strings
 */
export function validateQuery(raw: unknown): ValidationResult {
  if (typeof raw !== "string") {
    return { ok: false, reason: "Query must be a string." };
  }

  const cleaned = raw.replace(CONTROL_CHAR_RE, "").trim();

  if (cleaned.length === 0) {
    return { ok: false, reason: "Missing query." };
  }

  if (cleaned.length > MAX_QUERY_LEN) {
    return {
      ok: false,
      reason: `Query too long. Maximum ${MAX_QUERY_LEN} characters allowed.`,
    };
  }

  return { ok: true, value: cleaned };
}

const IS_PROD = process.env["NODE_ENV"] === "production";

/**
 * Sanitizes error messages before they are included in HTTP responses.
 *
 * In production: always returns a generic message — never leak internal paths,
 * dependency names, timeout labels, or upstream API error details to clients.
 * The full error is already captured in server logs.
 *
 * In development: returns a lightly sanitized message (absolute file paths
 * stripped, length capped) so the developer still gets useful context.
 */
export function sanitizeError(err: unknown): string {
  if (IS_PROD) {
    return "Request failed. Please try again.";
  }
  const raw = err instanceof Error ? err.message : String(err);
  return raw
    .replace(/(?:\/[^\s:,'"]+)+/g, "<path>")
    .slice(0, 300);
}
