import express, { type Express } from "express";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import helmet from "helmet";
import router from "./routes";
import homeRouter from "./routes/home";
import adminRouter from "./routes/admin";
import adminApiRouter from "./routes/admin-api";
import { logger } from "./lib/logger";
import { globalApiRateLimit } from "./middleware/rate-limit";
import { optionalTokenAuth } from "./middleware/token-auth";

const app: Express = express();

// ── Trust proxy ──────────────────────────────────────────────────────────────
// Replit (and most PaaS platforms) sit behind a reverse proxy that appends the
// real client IP in X-Forwarded-For. Without this setting, req.ip is always the
// proxy's address, which means rate limiters treat every user as the same IP —
// rendering them completely useless.
// "1" trusts exactly one hop (the immediate proxy), preventing header spoofing
// by clients who might inject extra X-Forwarded-For values.
app.set("trust proxy", 1);

// ── Security headers (Helmet) ────────────────────────────────────────────────
// Adds ~15 security response headers in one call:
// X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security,
// Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control, etc.
// Also removes the X-Powered-By: Express header that fingerprints the stack.
app.use(
  helmet({
    // The home page builds its own detailed CSP inline — let it handle its own.
    // For API JSON routes there is no HTML so a CSP isn't meaningful.
    contentSecurityPolicy: false,
    // Not needed — API responses are never embedded in iframes.
    crossOriginEmbedderPolicy: false,
    // HSTS: force HTTPS for 1 year, including subdomains.
    hsts: {
      maxAge: 31_536_000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "no-referrer" },
  }),
);

// ── CORS ─────────────────────────────────────────────────────────────────────
// This is a public read-only API — any origin may read it.
// However, we lock down methods and headers to the bare minimum needed.
// credentials: false ensures cookies and auth headers are never forwarded,
// closing the CSRF-via-CORS attack vector entirely.
app.use(
  cors({
    origin: "*",
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    credentials: false,
    maxAge: 86_400, // browsers cache the OPTIONS preflight for 24h
  }),
);

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Request logging ──────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── Body parsers ──────────────────────────────────────────────────────────────
// Strict 16 KB body limit — this API only receives query strings, never bodies.
app.use(express.json({ limit: "16kb" }));
// extended: false uses the simpler querystring parser instead of qs.
// qs's "extended" mode allows deeply nested objects which can be leveraged for
// prototype-pollution attacks on older Node.js versions.
app.use(express.urlencoded({ extended: false, limit: "16kb" }));

// ── Pretty-print JSON ─────────────────────────────────────────────────────────
app.set("json spaces", 2);

// ── Server-level request timeout ─────────────────────────────────────────────
// Protects against slow-loris / slow-body attacks that hold a socket open by
// trickling bytes very slowly. After 30 s of inactivity the socket is destroyed.
app.use((_req, res, next) => {
  res.setTimeout(30_000, () => {
    if (!res.headersSent) {
      res.status(408).json({ error: "Request timeout." });
    }
  });
  next();
});

// ── Static assets ─────────────────────────────────────────────────────────────
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#CC0000"/><polygon points="12,9 24,16 12,23" fill="white"/></svg>`;
app.get("/favicon.svg", (_req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(FAVICON_SVG);
});
app.get("/favicon.ico", (_req, res) => { res.redirect("/favicon.svg"); });
app.get("/og-image.svg", (_req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#080808"/><rect width="1200" height="630" fill="url(#g)"/><defs><radialGradient id="g" cx="50%" cy="30%" r="60%"><stop offset="0%" stop-color="#AA0000" stop-opacity=".4"/><stop offset="100%" stop-color="#080808" stop-opacity="0"/></radialGradient></defs><rect x="560" y="215" width="80" height="80" rx="20" fill="#CC0000"/><polygon points="584,239 624,255 584,271" fill="white"/><text x="600" y="340" font-family="Inter,sans-serif" font-size="72" font-weight="900" fill="white" text-anchor="middle">Tube<tspan fill="#FF4444">Fetch</tspan></text><text x="600" y="390" font-family="Inter,sans-serif" font-size="28" fill="#555" text-anchor="middle">YouTube Downloader API · No Key Required</text></svg>`);
});

// ── Routes ────────────────────────────────────────────────────────────────────
// Admin panel and its API — mounted before the public routes, no rate limiting
app.use(adminRouter);
app.use(adminApiRouter);
app.use("/", homeRouter);

// Apply the global rate limiter and optional token auth to all API routes.
// globalApiRateLimit fires first (cheap), then optionalTokenAuth (no-op when
// API_TOKEN env var is unset), then the actual route handler.
app.use("/api", globalApiRateLimit, optionalTokenAuth, router);

export default app;
