---
name: Admin Panel Architecture
description: How the v1.3.0 admin panel is built, auth flow, and key gotchas
---

# Admin Panel — v1.3.0

## Route structure
- `GET /admin` → `src/routes/admin.ts` — serves SPA HTML (no rate limit, no auth to load)
- `POST /admin/api/auth` → `src/routes/admin-api.ts` — 2FA auth
- `GET /admin/api/events` → SSE stream (auth via `?tok=` query param)
- `GET /admin/api/stats`, `POST /admin/api/shutdown|run|restart` → admin-api.ts

Both admin routers are mounted in app.ts BEFORE homeRouter and BEFORE globalApiRateLimit.

## Auth flow
- All credentials stored as SHA-256 hashes in split string segments in admin-auth.ts (never plaintext)
- OPPO A3x detected via `/OPPO[_ -]?A3x/i.test(userAgent)` — issues full token immediately
- Non-OPPO: issues `partialToken` (UUID, 5-min TTL in Map), client must POST `{ partialToken, birthday }` to exchange for full token
- Full session tokens stored in server-side `Set<string>` — cleared on restart

## SSE gotcha
- EventSource cannot set custom headers → token passed as `?tok=` query param
- `res.setHeader("Content-Encoding", "identity")` is REQUIRED to bypass compression middleware

## ESM gotcha — counter.ts import
- counter.ts imports admin-state with a STATIC import (`import { isShutdown as _adminIsShutdown } from "./admin-state"`)
- Do NOT use `require()` — the output bundle is ESM (.mjs) and runtime require() is not available
- There is no circular dependency: counter.ts → admin-state.ts (admin-state does NOT import counter)

## Shutdown behaviour
- `isShutdown()` checked at top of v1/v2/v3 handlers → 503 immediately, no increment
- `increment()` also checks `isShutdown()` as a second safety net
- Home page injects banner via `html.replace(/(<body[^>]*>)/, "$1<banner>")` after buildHtml()
- /admin, /api/healthz, /api/uptime, /api/stats are NOT affected by shutdown

**Why:** Shutdown must block API calls and pause counting without affecting monitoring routes.
**How to apply:** Always check isShutdown() BEFORE increment() in any new API route handler.
