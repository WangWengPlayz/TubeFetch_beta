# TubeFetch — YouTube Downloader API

REST API that accepts a YouTube URL **or a plain title/keyword** and returns direct MP4 and MP3 download links, metadata, and top search results.

## Current Version: 1.1.3

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24
- **Framework**: Express 5
- **Search**: `yt-search` — resolves title queries to YouTube video IDs and metadata
- **Downloads**: `nayan-media-downloaders` — returns direct MP4 (HD) and MP3 download URLs
- **Logging**: pino + pino-http (pretty in dev, JSON in production)
- **Build**: esbuild (via `build.mjs`)
- **TypeScript**: 5.9, strict

## Key Source Files

- `artifacts/api-server/src/routes/home.ts` — server-rendered HTML frontend
- `artifacts/api-server/src/routes/download.ts` — v1 endpoint (full metadata + downloads)
- `artifacts/api-server/src/routes/download-v2.ts` — v2 endpoint (fast, links only)
- `artifacts/api-server/src/routes/download-v3.ts` — v3 endpoint (top 10 search results)
- `artifacts/api-server/src/routes/uptime.ts` — uptime/status endpoint
- `artifacts/api-server/src/routes/health.ts` — health check endpoint
- `artifacts/api-server/src/routes/stats.ts` — global ApiCount stats endpoint
- `artifacts/api-server/src/lib/counter.ts` — global API call counter singleton
- `artifacts/api-server/src/lib/category.ts` — YouTube content category inference
- `artifacts/api-server/src/lib/cache.ts` — TtlCache (90s in-memory)
- `artifacts/api-server/src/lib/version.ts` — VERSION constant

## API Endpoints

### `GET /api/v1/q?=(url or title)`
Full metadata + download links. Response includes `ApiCount`, `category`, `cached`, `ms`.

### `GET /api/v2/q?=(url or title)`
Fast links-only endpoint. Returns `credit`, `version`, `ApiCount`, `ms`, `media.mp4`, `media.mp3`.

### `GET /api/v3/q?=(search query)`
Returns top 10 YouTube search results. Each result includes: `rank`, `video_id`, `url`, `title`, `description`, `channel_name`, `channel_url`, `published`, `duration`, `thumbnail`, `views`, `category`. Response includes `ApiCount` and `ms`.

### `GET /api/stats`
Returns total API call count: `{ version, creditTo, ApiCount, timestamp }`. Does NOT increment the counter.

### `GET /api/uptime`
Server uptime. Includes `ApiCount`.

### `GET /api/healthz`
Liveness probe. Includes `ApiCount`.

## ApiCount

Only v1, v2, and v3 requests increment ApiCount. `/api/uptime` and `/api/healthz` do NOT count. The counter is stored persistently in MongoDB (`tubefetch.counters` collection, `_id: "apiCount"`). A local fallback counter is used if MongoDB is unavailable. Success/error split is tracked in-memory and exposed via `/api/stats`. The web UI polls `/api/stats` every 5 seconds.

## Security (Web UI)

- HTTP headers on `/`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`, `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex`, `Cache-Control: no-store`
- Meta robots: `noindex, nofollow, noarchive, nosnippet`
- Client-side: right-click disabled, F12/Ctrl+U/Ctrl+S/Ctrl+Shift+I blocked, devtools detection (blur), drag disabled

## Categories

Content is auto-classified into: Music, Gaming, Education, News & Politics, Comedy, Sports, Film & Entertainment, Science & Technology, Travel & Vlogs, Food & Cooking, Health & Fitness, Beauty & Fashion, Entertainment (default).

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-server run dev` — run API server in dev mode (port 8080)
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle

## Deployment

- **Dev (Replit):** `PORT=8080 pnpm --filter @workspace/api-server run dev`
- **Render:** Build: `pnpm install && pnpm --filter @workspace/api-server run build` | Start: `node --enable-source-maps artifacts/api-server/dist/index.mjs`
- **Health check:** `GET /api/healthz`
