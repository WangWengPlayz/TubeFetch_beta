# TubeFetch — YouTube Downloader REST API

> **Version 1.2.7** · Node.js 24 · Express 5 · TypeScript 5.9 · pnpm monorepo

A free, open REST API that accepts a YouTube URL **or a plain title/keyword** and returns direct MP4 and MP3 download links, full video metadata, and top search results — **no API key required**.

> ⚠️ See [DISCLAIMER.md](./DISCLAIMER.md) for copyright, legal terms, and usage restrictions before deploying or using this project.

---

## What's New in 1.2.7 — Big Update

- **Server 1 (btch-downloader)** is now the primary download source for all MP4 & MP3 links
- **Server 2 (nayan-media-downloaders)** is the automatic fallback — kicks in silently when Server 1 fails
- `media.server: 1 | 2` added to v1 and v2 responses — tells you which server delivered the links
- `@distube/ytdl-core` removed from the active download chain

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/v1/q?=(url or title)` | Full metadata + MP4 HD & MP3 download links |
| `GET /api/v2/q?=(url or title)` | Fast: title + MP4 & MP3 links only |
| `GET /api/v3/q?=(search query)` | Top 10 YouTube search results with full metadata |
| `GET /api/stats` | Total API call count (does not increment counter) |
| `GET /api/uptime` | Server uptime |
| `GET /api/healthz` | Liveness probe |

---

## Quick Start

```bash
# Full metadata + download links (v1)
curl "https://your-domain.com/api/v1/q?=bohemian rhapsody"

# Fast title + links (v2)
curl "https://your-domain.com/api/v2/q?=https://youtu.be/dQw4w9WgXcQ"

# Top 10 search results (v3)
curl "https://your-domain.com/api/v3/q?=lofi hip hop"

# Live stats
curl "https://your-domain.com/api/stats"
```

### Sample v1 Response

```json
{
  "version": "1.2.7",
  "success": true,
  "creditTo": "MJL",
  "video_id": "dQw4w9WgXcQ",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "short_url": "https://youtu.be/dQw4w9WgXcQ",
  "category": "Music",
  "info": {
    "title": "Rick Astley - Never Gonna Give You Up",
    "author": "Rick Astley",
    "thumbnail": "https://...",
    "duration": "3:33",
    "views": 1400000000,
    "published": "25 years ago",
    "description": "...",
    "keywords": ["rick astley", "never gonna give you up"]
  },
  "media": {
    "mp4": { "url": "https://...", "quality": "HD" },
    "mp3": { "url": "https://..." },
    "server": 1
  },
  "ApiCount": 1234,
  "cached": false,
  "ms": 2841
}
```

### Sample v2 Response

```json
{
  "credit": "MJL",
  "version": "1.2.7",
  "title": "Rick Astley - Never Gonna Give You Up",
  "media": {
    "mp4": "https://...",
    "mp3": "https://...",
    "server": 1
  },
  "ApiCount": 1235,
  "cached": false,
  "ms": 1203
}
```

### `media.server` Field

| Value | Meaning |
|---|---|
| `1` | Links delivered by **btch-downloader** (Server 1, primary) |
| `2` | Links delivered by **nayan-media-downloaders** (Server 2, fallback) |
| `null` | Both servers failed — mp4/mp3 will also be null |

---

## Download Server Chain

```
Request
  │
  ▼
Server 1: btch-downloader  ──── success ──▶  Return links (server: 1)
  │
  │ (failed / timeout 20s)
  ▼
Server 2: nayan-media-downloaders  ── success ──▶  Return links (server: 2)
  │
  │ (failed / timeout 20s)
  ▼
Return null links (server: 2)
```

The fallback is fully automatic — users always get the best available result with no extra configuration needed.

---

## Hosting on Render

### 1. Fork / Clone

```bash
git clone https://github.com/your-username/tubefetch.git
cd tubefetch
```

### 2. Create a Web Service on Render

Go to [https://render.com](https://render.com) → **New** → **Web Service** → connect your GitHub repo.

### 3. Build & Start Commands

| Setting | Value |
|---|---|
| **Runtime** | Node |
| **Build Command** | `pnpm install && pnpm --filter @workspace/api-server run build` |
| **Start Command** | `node --enable-source-maps artifacts/api-server/dist/index.mjs` |
| **Health Check Path** | `/api/healthz` |

### 4. Environment Variables (optional)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the server listens on | `10000` (Render default) |
| `MONGODB_URI` | MongoDB connection string for persistent `ApiCount` | In-memory fallback if unset |
| `NODE_ENV` | Set to `production` for JSON logs | `development` |

> **Tip:** Without `MONGODB_URI`, the API call counter resets on every deploy. Set it to a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI to persist counts across restarts.

### 5. Deploy

Click **Deploy** — Render will install dependencies, run the esbuild bundle, and start the server. The health check at `/api/healthz` will confirm the service is live.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 24 |
| Framework | Express 5 |
| Language | TypeScript 5.9 (strict) |
| Package Manager | pnpm workspaces |
| Search | yt-search |
| Downloads (Server 1) | btch-downloader (primary) |
| Downloads (Server 2) | nayan-media-downloaders (fallback) |
| Persistence | MongoDB (optional, Atlas free tier works) |
| Logging | pino + pino-http |
| Build | esbuild |

---

## Key Source Files

```
artifacts/api-server/src/
├── routes/
│   ├── home.ts          — Server-rendered HTML landing page
│   ├── download.ts      — v1 endpoint (full metadata + downloads)
│   ├── download-v2.ts   — v2 endpoint (title + links only, fast)
│   ├── download-v3.ts   — v3 endpoint (top 10 search results)
│   ├── stats.ts         — ApiCount stats endpoint
│   ├── uptime.ts        — Uptime endpoint
│   └── health.ts        — Health check
├── lib/
│   ├── cache.ts         — TtlCache (5 min fresh / 20 min stale SWR)
│   ├── counter.ts       — Global ApiCount singleton (MongoDB-backed)
│   ├── downloader.ts    — Two-server download chain (btch → nayan)
│   ├── category.ts      — YouTube content category inference
│   └── version.ts       — VERSION constant
└── middleware/
    └── rate-limit.ts    — express-rate-limit configuration
```

---

## Rate Limits

| Scope | Limit |
|---|---|
| Global (all endpoints) | 300 requests / 15 minutes |
| Download endpoints (v1, v2, v3) | 60 requests / minute |

Exceeding either limit returns `429 Too Many Requests`.

---

## Caching

All successful responses are cached in-memory using a **stale-while-revalidate** strategy:

- **Fresh:** 5 minutes — served from cache, no upstream call
- **Stale:** up to 20 minutes — stale result returned instantly while a background refresh runs
- **Expired:** full upstream fetch

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start the dev server (port 5000)
PORT=5000 pnpm --filter @workspace/api-server run dev

# Type-check all packages
pnpm run typecheck
```

---

## Changelog

### v1.2.7 — Big Update (2026-06-08)
- `btch-downloader` is now **Server 1** (primary download source)
- `nayan-media-downloaders` is now **Server 2** (fallback)
- `media.server: 1 | 2` added to v1 and v2 responses
- `@distube/ytdl-core` removed from active download chain

### v1.2.6 — Hotfix (2026-06-06)
- Fixed v2 `title` returning `null` on URL inputs

### v1.2.5 (2026-06-02)
- v2 URL requests now fetch metadata and download links in parallel
- v1 keyword queries reuse search result metadata (no redundant lookup)

### v1.2.2 (2026-05-23)
- Global rate limiting + Helmet security headers
- Two-source download fallback chain introduced

---

## License & Legal

See **[DISCLAIMER.md](./DISCLAIMER.md)** for the full copyright notice, legal disclaimers, and usage restrictions.

This project is provided for **educational and personal use only**. Downloading copyrighted content without permission may violate YouTube's Terms of Service and applicable copyright laws in your jurisdiction. The developer (**MJL**) accepts no liability for any misuse.

---

*Built by **MJL** · TubeFetch v1.2.7*
