---
purpose: AI/agent context file — full unencrypted project reference
visibility: hidden dotfile directory, not exposed to users
note: The production build (dist/index.mjs) is obfuscated. This file is the authoritative source of truth for any AI or agent working on this project.
---

## MAINTENANCE RULE — READ BEFORE DOING ANY WORK

**This file must be kept up to date at all times.**

- After every change to the project — new features, bug fixes, removed code, changed behaviour, updated dependencies, version bumps — you MUST update the relevant sections of this file to reflect the new state.
- When you update this file (for any reason), you MUST include **[Code 5]** in your reply to the user so they know this context file was refreshed.
- Never leave this file stale. If you changed something and did not update this file, go back and do it before finishing.
- If a section is no longer accurate, fix or delete it. Do not leave outdated information.

# TubeFetch — Full Project Context

## What this project is

TubeFetch is a **YouTube Downloader REST API** built with Node.js 24 + Express 5 + TypeScript 5.9 in a pnpm monorepo. It accepts a YouTube URL or plain keyword/title and returns direct MP4 and MP3 download links, video metadata, and search results — no YouTube API key required.

- Author: **MJL**
- Current version: **1.3.0**
- All rights reserved © 2024–2026 MJL

---

## Monorepo layout

```
/                          ← workspace root (pnpm workspaces)
├── artifacts/
│   ├── api-server/        ← main Express API (@workspace/api-server)
│   └── mockup-sandbox/    ← Vite/React UI sandbox (dev only)
├── lib/
│   ├── api-spec/          ← OpenAPI spec + Orval codegen config
│   ├── api-zod/           ← Zod schemas generated from the spec
│   ├── api-client-react/  ← React Query hooks (generated)
│   └── db/                ← Drizzle ORM + PostgreSQL schema (@workspace/db)
├── scripts/
│   └── post-merge.sh      ← runs after task-agent merges (pnpm install + db push)
├── .agents/
│   ├── memory/MEMORY.md   ← persistent agent memory index
│   └── context/PROJECT.md ← THIS FILE
├── .replit                ← Replit workflow/port config
├── replit.md              ← project README + user preferences (loaded into agent system prompt)
├── README.md              ← public-facing docs (intentionally stripped of internals)
└── DISCLAIMER.md          ← copyright + legal notice
```

---

## api-server — source file map

All source lives under `artifacts/api-server/src/`.

### Entry point

**`src/index.ts`**
- Reads `PORT` env var (required, throws if missing or invalid)
- Calls `app.listen(port)`
- In `NODE_ENV=production`: sets a 24-hour `setTimeout(() => process.exit(0))` for memory hygiene

### Express app

**`src/app.ts`**
- `app.set("trust proxy", 1)` — Replit/Render sit behind a reverse proxy; without this, rate limiting breaks
- Helmet (custom): CSP disabled (API routes + home page manages its own), HSTS 1 year, `referrerPolicy: no-referrer`
- CORS: `origin: "*"`, methods `GET/OPTIONS` only, `credentials: false`
- compression, pino-http, body parsers (16 KB limit, extended: false)
- `json spaces: 2` — pretty-printed JSON responses
- 30-second response timeout (slow-loris protection)
- Favicon/og-image served as inline SVG strings
- Routes: `adminRouter` at `/admin`, `adminApiRouter` at `/admin/api/*`, `homeRouter` at `/`, `globalApiRateLimit + router` at `/api`
- Admin routes are mounted before public routes and are NOT subject to the global API rate limiter

### Routes

**`src/routes/index.ts`** — mounts all sub-routers on the `/api` prefix:
- `healthRouter` → `/api/healthz`
- `uptimeRouter` → `/api/uptime`
- `downloadRouter` → `/api/v1/q`
- `downloadV2Router` → `/api/v2/q`
- `downloadV3Router` → `/api/v3/q`
- `statsRouter` → `/api/stats`
- `homeRouter` also mounted at `/api/` (Replit proxy fallback)

---

**`src/routes/admin.ts`** — `/admin`

Serves the admin panel as a single-page HTML application. No auth required to load the page (auth handled client-side via POST /admin/api/auth).

Security headers: `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.

The `buildAdminHtml(version)` function returns the full SPA. UI features:
- Login screen (password-based access code)
- Birthday/device verification screen (shown to non-OPPO-A3x devices)
- 3-second intro animation with progress bar
- Real-time dashboard via SSE (Server-Sent Events)

Dashboard sections:
- Stat cards: Total API Calls, Successful, Errors, Uptime
- Charts: Doughnut (success vs error), Line chart (calls/minute, last 30 min) via Chart.js CDN
- Package status: btch-downloader (Server 1) and nayan-media-downloaders (Server 2)
- Control buttons: Temporary Shutdown, Run, Restart (all with confirmation modal)
- 3-tab live console: Live (all), Success only, Error only — streamed in real-time via SSE

Client auth: sessionStorage key `_atk`. Token sent as `Authorization: Bearer <token>` for API calls and `?tok=` query param for EventSource (EventSource can't set custom headers).

---

**`src/routes/admin-api.ts`** — `/admin/api/*`

All endpoints require a valid session token (Bearer header or `?tok=` param). Returns `401` if missing/invalid.

```
POST /admin/api/auth
  Body: { password } OR { partialToken, birthday }
  - Password path: verifies SHA-256 hash; if OPPO A3x UA detected → issues full token immediately
  - Non-OPPO path: issues partialToken (5-min TTL), client must POST birthday to exchange
  - Birthday path: consumes partialToken, verifies birthday SHA-256 hash → issues full token
  Response: { ok, token?, needsBirthday?, partialToken?, error? }

GET /admin/api/stats (auth required)
  Returns: { ok, version, apiCount, successCount, errorCount, uptimeSeconds, shutdown, minuteBuckets[], packages: { server1, server2 } }
  Does NOT increment ApiCount.

GET /admin/api/events (auth required)
  SSE stream. Sends: Content-Encoding: identity (bypasses compression middleware)
  Events:
    history → AdminLogEntry[] (last 150 log entries, sent immediately on connect)
    stats   → stats payload (every 3 seconds)
    log     → AdminLogEntry (on each new log entry)
  Heartbeat: ": ping\n\n" every 25s

POST /admin/api/shutdown (auth required)
  Calls setShutdown(true). Emits admin log. Response: { ok: true }

POST /admin/api/run (auth required)
  Calls setShutdown(false). Emits admin log. Response: { ok: true }

POST /admin/api/restart (auth required)
  Emits admin log. Responds { ok: true }. setTimeout(process.exit(0), 500ms).
```

---

**`src/routes/health.ts`**
```
GET /api/healthz
Response: { status: "ok", version, creditTo: "MJL" }
Does NOT increment ApiCount.
```

**`src/routes/uptime.ts`**
```
GET /api/uptime
Response: { version, creditTo: "MJL", status: "online", uptime_seconds, timestamp }
Does NOT increment ApiCount.
```

**`src/routes/stats.ts`**
```
GET /api/stats
Response: { version, creditTo: "MJL", ApiCount, successCount, errorCount, mongoConnected, timestamp }
Does NOT increment ApiCount.
```

---

**`src/routes/download.ts`** — `/api/v1/q`

Full metadata + download links endpoint.

Query param: `?=` (URL or keyword/title, 1–500 chars, no control chars)

Flow:
1. Validate query via `validateQuery()` — if invalid, return 400 with NO ApiCount increment
2. If input is a URL but NOT a YouTube URL → return 400 with NO ApiCount increment, NO errorCount increment
   - Error: `"URL not supported. Only YouTube URLs are accepted."`
   - Includes `supported[]` array of valid URL formats and a `tip` to search by title instead
3. **Only after passing both checks**: call `increment()` and attach `res.on("finish", ...)` for success/error tracking
4. If URL: extract video ID with regex `/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/`
5. If keyword: check `queryToId` BoundedMap (LRU 1000); if miss, run `yts(input)` search, take first result
6. Check `TtlCache` (5 min fresh / 20 min stale, max 500 entries)
   - Cache hit: return immediately; if stale, trigger background SWR refresh via `setImmediate`
7. Cache miss: call `fetchPayload(videoId, url, preInfo?)`
   - URL path: `yts({ videoId })` + `fetchDownloadLinks(url)` run in **parallel** via `Promise.allSettled`
   - Keyword path: preInfo already in hand → only `fetchDownloadLinks` runs

Response shape:
```json
{
  "version": "1.2.7",
  "success": true,
  "creditTo": "MJL",
  "video_id": "...",
  "url": "https://www.youtube.com/watch?v=...",
  "short_url": "https://youtu.be/...",
  "category": "Music",
  "info": {
    "title": "...",
    "author": "...",
    "channel_url": "...",
    "thumbnail": "...",
    "duration": "3:33",
    "duration_seconds": 213,
    "views": 1000000,
    "likes": 50000,
    "published": "2 years ago",
    "description": "...",
    "keywords": ["..."]
  },
  "media": {
    "mp4": { "url": "...", "quality": "HD" },
    "mp3": { "url": "..." },
    "server": 1
  },
  "ApiCount": 42,
  "cached": false,
  "ms": 2800
}
```

Null fields are stripped by `clean()` before returning.
Thumbnail fallback chain: `yts.thumbnail` → `yts.image` → `links.thumbnail` → `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

---

**`src/routes/download-v2.ts`** — `/api/v2/q` — **updated in v1.2.9**

Fast endpoint — title + links only. Minimal response shape.

Flow:
1. Same validation and videoId resolution as v1
2. `queryToId` + `videoIdToTitle` BoundedMaps (LRU 1000 each)
3. Cache check (same TtlCache strategy, separate cache instance)
4. `fetchPayload(videoId, url, knownTitle)`:
   - Calls `fetchDownloadLinks(url)` (always)
   - Title resolution: `knownTitle` (keyword path) → `links.title` (from btch Server 1) → `yts({ videoId })` fallback (rare, only if btch failed and nayan was used)

Response shape (v1.2.9 — `video_id`, `duration`, `thumbnail` removed):
```json
{
  "credit": "MJL",
  "version": "1.2.9",
  "title": "...",
  "media": {
    "mp4": "https://...",
    "mp3": "https://...",
    "server": 1
  },
  "ApiCount": 43,
  "cached": false,
  "ms": 1200
}
```

---

**`src/routes/download-v3.ts`** — `/api/v3/q` — **updated in v1.2.9**

YouTube search results with configurable limit. Accepts keywords/titles only — rejects YouTube URLs with 400 (not counted against ApiCount).

URL format: `/api/v3/q?=QUERY` (default 10) or `/api/v3/q?=QUERY&?=LIMIT` (1–20)
- Limit param key is `"?"` (i.e. `req.query["?"]`), parsed from `&?=N` in the URL
- Default: 10. Min: 1. Max: 20. Limit > 20 → specific 400 "Search limit exceeded — max is 20" error. Other invalid (NaN, < 1) → generic 400. Both fire BEFORE `increment()` — not counted in ApiCount.

Cache strategy: always fetches and stores up to 20 results per query using `pages: 2` (two search pages) to guarantee a full 20-video result set. The limit is sliced at response time — so one cache entry serves any limit 1–20 without a refetch. Dedup key is `yts-v3:${input}` (separate from v1/v2's single-page search).

Response fields (top-level): `credit`, `version`, `query`, `limit`, `total_results`, `results[]`, `cached`, `ApiCount`, `ms`
Each result object: `rank`, `video_id`, `url`, `short_url`, `title`, `description`, `channel_name`, `channel_url`, `published`, `duration`, `duration_seconds`, `thumbnail`, `views`, `keywords`, `category`

---

**`src/routes/home.ts`**

The entire web UI (landing page, changelog, FAQ, API explorer) is rendered as a single large HTML string from this file. No template engine — pure TypeScript string template.

Key sections:
- `CHANGELOG[]` — version history array rendered to the changelog widget
- `FAQS[]` — Q&A pairs
- `buildHtml(version, baseUrl)` — assembles the full HTML
- Security headers set on the `/` response: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, CSP, `Cache-Control: no-store`, `X-Robots-Tag: noindex`
- Client-side: right-click disabled, F12/Ctrl+U/Ctrl+Shift+I blocked, devtools blur detection, drag disabled
- **Shutdown banner (v1.3.0)**: If `isShutdown()` is true, a fixed dark-red banner is injected via `html.replace(/(<body[^>]*>)/, `$1${banner}`)` before sending the response

Changelog tag values and their badge colors:
- `"big-update"` → purple `#a78bfa` — [Big Update]
- `"hotfix"` → orange `#FFA500` — [Hotfix]
- `"current"` → red `#FF4444` — [Latest]
- `"initial"` → muted — [Initial]
- `""` → no badge

---

### Libraries

**`src/lib/downloader.ts`** — Two-server download chain

```
Server 1: btch-downloader  (primary)
  - Calls youtube(url) → { status, title, author, thumbnail, mp3, mp4 }
  - Timeout: 20s
  - Returns server: 1 if mp4 or mp3 is present

Server 2: nayan-media-downloaders  (fallback, used only if Server 1 fails/times out)
  - Calls ytdown(url) → { status, data: { video_hd, video, high, audio, low, thumbnail, thumb } }
  - Timeout: 20s
  - Returns server: 2 always

Returns DownloadLinks: { mp4, mp3, thumbnail, title, server: 1|2 }
If both fail: { mp4: null, mp3: null, thumbnail: null, title: null, server: 2 }
```

Both packages are CJS-only → loaded via `createRequire(import.meta.url)`.
Both are externalized in `build.mjs` so esbuild doesn't try to bundle them.

**`src/lib/counter.ts`** — Global ApiCount singleton

- Connects to MongoDB on startup using `MONGODB_URI` env var
- Falls back to in-memory counters if MongoDB is unavailable or URI not set
- Retry after 60s on failure
- `increment()` → sync; **checks `isShutdown()` first** — returns `_localTotal` without incrementing if server is in shutdown mode
- `recordSuccess()` / `recordError()` → track split; called on `res.on("finish")`
- `getAllCounts()` → async, returns `{ total, successCount, errorCount }`; result cached 4s
- `getMongoStatus()` → returns `"idle" | "connecting" | "connected" | "no-uri" | "failed"`
- Collection: `tubefetch.counters`, doc `_id: "apiCount"` with fields `value`, `successCount`, `errorCount`

**`src/lib/admin-state.ts`** — Admin shared state singleton

- `isShutdown()` / `setShutdown(val)` — global shutdown flag
- `adminBus` — EventEmitter for broadcasting log entries to SSE clients (max 200 listeners)
- `emitAdminLog(level, message)` — appends to ring buffer (max 500), emits `"log"` on `adminBus`
- `getRecentLogs(limit)` — returns last N log entries
- `recordApiCall()` — per-minute bucket tracker (last 30 min), called in v1/v2/v3 on each real request
- `getMinuteBuckets()` — returns `ApiMinuteBucket[]` for line chart
- `recordServerResult(server: 1|2, success)` — tracks last success/failure timestamps per server
- `getServerStatus(server)` → `"up" | "degraded" | "unknown"` (up = lastSuccess >= lastFailure)
- Log levels: `"info" | "success" | "error" | "warn"`

**`src/lib/admin-auth.ts`** — Session + credential management

- `verifyPassword(input)` — SHA-256 hash comparison (hash stored in split string segments, never plaintext)
- `verifyBirthday(input)` — SHA-256 hash comparison
- `createSession()` → UUID token added to `_sessions` Set
- `isValidSession(token)` → boolean check against Set
- `destroySession(token)` — removes from Set
- `createPartialToken()` → UUID with 5-min TTL in `_partials` Map
- `consumePartialToken(token)` → validates TTL, deletes, returns boolean

**`src/lib/cache.ts`** — TtlCache\<T\>

SWR (stale-while-revalidate) in-memory cache.
- Constructor: `new TtlCache<T>(freshMs, staleMs, maxEntries)`
- Default: 300_000ms fresh (5 min), 1_200_000ms stale (20 min), max 500 entries
- `getWithMeta(key)` → `{ value, stale: boolean } | null`
- `set(key, value)` → stores with timestamp; evicts oldest entry if over cap

**`src/lib/dedup.ts`** — In-flight request deduplication

- `dedup(key, fn)` → if a promise for `key` is already in-flight, returns the same promise instead of spawning a second upstream call
- `withTimeout(promise, ms, label)` → wraps promise in a race with a labeled timeout error

**`src/lib/bounded-map.ts`** — LRU map (max N entries)

Used for `queryToId` and `videoIdToTitle` caches. Evicts oldest entry on overflow.

**`src/lib/category.ts`** — Content category inference

Maps keywords/title/description to one of:
Music, Gaming, Education, News & Politics, Comedy, Sports, Film & Entertainment, Science & Technology, Travel & Vlogs, Food & Cooking, Health & Fitness, Beauty & Fashion, Entertainment (default)

**`src/lib/logger.ts`** — pino logger

Always uses pino-pretty transport (both dev and production) for human-readable output in all terminals including Render's log viewer.
Format: `[2026-06-08 08:48:28] INFO: [TubeFetch] {msg}`
Redacts: `req.headers.authorization`, `req.headers.cookie`, `res.headers['set-cookie']`

**`src/lib/validate.ts`** — Input validation

`validateQuery(raw)` → strips control chars, trims, enforces 1–500 char length.
`sanitizeError(err)` → removes internal paths, dependency names, timeout labels from error messages before sending to client.

**`src/lib/version.ts`**
```ts
export const VERSION = "1.3.0";
```

---

### Middleware

**`src/middleware/rate-limit.ts`**

- `globalApiRateLimit`: 300 req / 15 min across all `/api/*` routes
- `downloadRateLimit`: 60 req / min applied to v1, v2, v3 individually
- Uses `express-rate-limit`; respects `X-Forwarded-For` (trust proxy is set)

---

## Build pipeline

**`artifacts/api-server/build.mjs`** — ESM build script

1. Cleans `dist/`
2. esbuild bundles `src/index.ts` → `dist/index.mjs` (ESM, Node platform, all bundleable packages inlined)
3. External packages (CJS-only or native): `btch-downloader`, `nayan-media-downloaders`, `yt-search`, `mongodb`, etc.
4. No sourcemaps (intentionally removed — sourcemaps would expose original source)
5. esbuild-plugin-pino handles pino's worker files → emits `dist/pino-worker.mjs`, `dist/pino-file.mjs`, `dist/pino-pretty.mjs`, `dist/thread-stream-worker.mjs`
6. **javascript-obfuscator** runs on `dist/index.mjs` only (pino workers are left plain — they're internal runtime threads that would break if obfuscated)
   - Settings: RC4 string encryption, hex identifiers, control flow flattening (0.75), dead code injection (0.4), split strings, transform object keys, renameGlobals: false, selfDefending: false, debugProtection: false
7. Output: `dist/index.mjs` (obfuscated), 4 pino worker .mjs files (plain)

Build command: `node ./build.mjs`
Start command: `node --enable-source-maps artifacts/api-server/dist/index.mjs`

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | **Yes** | Port to listen on (throws at startup if missing) |
| `MONGODB_URI` | No | MongoDB Atlas connection string; falls back to in-memory ApiCount if unset |
| `NODE_ENV` | No | Set to `production` on Render; enables 24-hour auto-restart |
| `LOG_LEVEL` | No | pino log level (default: `info`) |
| `DATABASE_URL` | No | PostgreSQL URL for Drizzle ORM (lib/db) — not used by core API |

---

## ApiCount behaviour

- **Incremented by**: v1, v2, v3 requests (one increment per request, before processing)
- **Not incremented by**: `/api/healthz`, `/api/uptime`, `/api/stats`, home page, any `/admin/*` route
- **Suspended during shutdown**: `increment()` short-circuits and returns the current total without incrementing when `isShutdown()` is true
- `successCount` incremented when response status is 2xx–3xx (on `res.finish`)
- `errorCount` incremented on 4xx–5xx responses
- Persisted to MongoDB (`tubefetch.counters`, doc `_id: "apiCount"`)
- Local in-memory counter seeded from MongoDB on startup
- Stats result cached 4s in-memory to avoid hammering MongoDB on every poll

---

## Caching strategy

All three download endpoints (v1, v2, v3) use independent `TtlCache` instances:
- **Fresh window (5 min)**: served from cache, zero upstream calls
- **Stale window (20 min)**: returned from cache immediately; background SWR refresh fires via `setImmediate`
- **Expired**: full upstream fetch

In-flight dedup via `dedup()` ensures concurrent requests for the same video share one upstream call.

---

## Deployment (Render)

Build: `pnpm install && pnpm --filter @workspace/api-server run build`
Start: `node --enable-source-maps artifacts/api-server/dist/index.mjs`
Health check: `GET /api/healthz`
Auto-restart: every 24h in production (setTimeout process.exit(0))

---

## Admin shutdown behaviour (v1.3.0)

When shutdown is active (`isShutdown()` returns true):
1. All v1, v2, v3 route handlers return **HTTP 503** immediately:
   `{ version, creditTo/credit: "MJL", status: "shutdown", message: "Temporary Shutdown — Admins are currently fixing or improving things. We'll be back in a little while — please be patient." }`
2. `increment()` is a no-op — ApiCount does not advance during shutdown
3. The home page (`/`) displays a fixed red banner at the top
4. `/admin` panel continues to work regardless of shutdown state (different routes)
5. `/api/healthz`, `/api/uptime`, `/api/stats` are unaffected (they don't check shutdown)

---

## Key design decisions

1. **btch-downloader as Server 1** (v1.2.7): replaced @distube/ytdl-core. btch returns title + thumbnail + mp4 + mp3 in one call, no YouTube bot-detection issues on cloud IPs.
2. **nayan-media-downloaders as Server 2**: automatic silent fallback. `server: 1|2` in response tells caller which was used.
3. **Obfuscation**: production bundle is RC4-obfuscated. This file is the source of truth for any agent needing to understand the real logic.
4. **Trust proxy 1**: critical for rate limiting on Replit/Render — without it all requests appear to come from the same IP.
5. **No sourcemaps in production**: deliberately removed to complement obfuscation.
6. **pino-pretty always on**: both dev and production use human-readable logs so Render's terminal is easy to read.
7. **SWR cache + dedup**: together these make repeated requests for popular videos essentially free.
8. **Admin panel 2FA** (v1.3.0): password-only for OPPO A3x (UA detection); password + birthday answer for all other devices. Partial tokens expire in 5 min. Full session tokens stored in server-side Set (cleared on restart). All credentials stored only as SHA-256 hashes split into segments — never plaintext.
9. **SSE for admin realtime** (v1.3.0): `Content-Encoding: identity` header on the events endpoint bypasses the compression middleware. Token passed as `?tok=` query param since EventSource cannot set custom headers. Stats pushed every 3s; logs pushed on-event.
10. **Admin route placement** (v1.3.0): admin routers mounted before `homeRouter` and before the global rate limiter — admin panel is never affected by API abuse throttling.
