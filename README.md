# TubeFetch — YouTube Downloader REST API

> **Version 1.2.9** · Built by **MJL** · All rights reserved

A free REST API that accepts a YouTube URL **or a plain title/keyword** and returns direct MP4 and MP3 download links, full video metadata, and top search results — **no API key required**.

> ⚠️ See [DISCLAIMER.md](./DISCLAIMER.md) for copyright, legal terms, and usage restrictions.

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/v1/q?=(url or title)` | Full metadata + MP4 HD & MP3 download links |
| `GET /api/v2/q?=(url or title)` | Fast: title + MP4 & MP3 links only |
| `GET /api/v3/q?=(search query)` | YouTube search results — default 10, up to 20 with `&?=N` |
| `GET /api/stats` | Total API call count |
| `GET /api/uptime` | Server uptime |
| `GET /api/healthz` | Liveness probe |

---

## Quick Start

```bash
# Full metadata + download links
curl "https://your-domain.com/api/v1/q?=bohemian rhapsody"

# Fast title + links
curl "https://your-domain.com/api/v2/q?=https://youtu.be/dQw4w9WgXcQ"

# Top 10 search results (default)
curl "https://your-domain.com/api/v3/q?=lofi hip hop"

# Top 20 search results
curl "https://your-domain.com/api/v3/q?=lofi hip hop&?=20"

# Custom limit (e.g. 5)
curl "https://your-domain.com/api/v3/q?=lofi hip hop&?=5"
```

---

## Sample v1 Response

```json
{
  "version": "1.2.9",
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
    "published": "25 years ago"
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

## Sample v2 Response

```json
{
  "credit": "MJL",
  "version": "1.2.9",
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
| `1` | Links from primary download server |
| `2` | Links from fallback download server |
| `null` | Both servers failed — mp4/mp3 will also be null |

---

## Hosting on Render

### Build & Start Commands

| Setting | Value |
|---|---|
| **Build Command** | `pnpm install && pnpm --filter @workspace/api-server run build` |
| **Start Command** | `node --enable-source-maps artifacts/api-server/dist/index.mjs` |
| **Health Check Path** | `/api/healthz` |

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `PORT` | Port the server listens on | Yes (Render sets this automatically) |
| `MONGODB_URI` | MongoDB connection string for persistent `ApiCount` | No — falls back to in-memory |
| `NODE_ENV` | Set to `production` | Recommended |

---

## Rate Limits

| Scope | Limit |
|---|---|
| Global | 300 requests / 15 minutes |
| Download endpoints | 60 requests / minute |

---

## Caching

Responses are cached with a stale-while-revalidate strategy: **5 minutes fresh**, up to **20 minutes stale** (served instantly while a background refresh runs silently).

---

## License & Legal

See **[DISCLAIMER.md](./DISCLAIMER.md)** for the full copyright notice and usage restrictions.

This project is for **educational and personal use only**. The developer (**MJL**) accepts no liability for any misuse. All rights reserved © 2024–2026 MJL.
