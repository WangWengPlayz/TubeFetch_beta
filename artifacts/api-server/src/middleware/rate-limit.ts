import rateLimit from "express-rate-limit";
import { VERSION } from "../lib/version";

/**
 * Global API rate limiter — applied to every /api/* route.
 *
 * Defends against:
 * - Automated scanners cycling through all endpoints
 * - DDoS amplification (each request may trigger expensive upstream calls)
 * - Credential/query stuffing at the API level
 *
 * 300 requests per 15-minute window per IP ≈ 20 req/min average.
 * Cache hits are served instantly so legitimate developers rarely approach this.
 */
export const globalApiRateLimit = rateLimit({
  windowMs: 15 * 60_000,
  max: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    version: VERSION,
    success: false,
    error: "Too many requests. Please slow down.",
    retryAfter: "15 minutes",
  },
});

/**
 * Strict rate limiter for the expensive download endpoints (v1, v2, v3).
 *
 * Each uncached request triggers external upstream API calls (yt-search +
 * nayan-media-downloaders). A single attacker sending unique queries can
 * exhaust upstream quotas and degrade service for all users.
 *
 * 60 requests per minute per IP = 1 per second sustained.
 * With the 5-min SWR cache, repeat queries are free and don't count toward
 * upstream load — so this limit only bites abusive unique-query flooding.
 */
export const downloadRateLimit = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    version: VERSION,
    success: false,
    error: "Download rate limit exceeded. Please wait before making more requests.",
    retryAfter: "60 seconds",
  },
});
