# YouTube Downloader API

REST API that accepts a YouTube URL **or a plain title/keyword** and returns real-time video info plus direct MP4 and MP3 download links.

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24
- **Framework**: Express 5
- **Search**: `yt-search` — resolves title queries to a YouTube video ID and fetches real-time metadata (title, views, duration, thumbnail, description)
- **Downloads**: `nayan-media-downloaders` — returns direct MP4 (HD) and MP3 download URLs
- **Logging**: pino + pino-http (pretty in dev, JSON in production)
- **Build**: esbuild (CJS/ESM bundle via `build.mjs`)
- **TypeScript**: 5.9, strict

## API

### `GET /api/v1/q?=(url or title)`

Accepts either a YouTube URL or a plain text title/search query.

**Examples:**
```
/api/v1/q?=lay me down sam smith
/api/v1/q?=https://youtu.be/dQw4w9WgXcQ
/api/v1/q?=https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**Response:**
```json
{
  "success": true,
  "video_id": "HaMq2nn5ac0",
  "url": "https://www.youtube.com/watch?v=HaMq2nn5ac0",
  "info": {
    "title": "Sam Smith - Lay Me Down (Official Music Video)",
    "author": "SAM SMITH",
    "thumbnail": "https://i.ytimg.com/vi/.../hqdefault.jpg",
    "duration": "4:10",
    "views": 508389582,
    "published": "11 years ago",
    "description": "..."
  },
  "media": {
    "mp4": { "url": "https://...", "quality": "HD" },
    "mp3": { "url": "https://..." }
  }
}
```

### `GET /api/healthz`

Returns `{ "status": "ok" }`.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — build/emit composite lib declarations
- `pnpm --filter @workspace/api-server run dev` — run API server in dev mode
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle

## Deployment

### Replit (one-click)
Click **Publish** in the top bar. The artifact.toml already configures build and run commands.

### Render
1. Connect your GitHub repo to [Render](https://render.com)
2. Render auto-detects `render.yaml` — no manual config needed
3. The free plan is pre-configured in `render.yaml`
4. Health check: `GET /api/healthz`

### Vercel
1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Vercel reads `vercel.json` automatically — no manual config needed
3. Install command: `pnpm install`
4. Build command: `pnpm run typecheck:libs` (already set in `vercel.json`)
5. The serverless entry is `artifacts/api-server/api/index.ts`

### Self-hosted / Docker
```bash
pnpm install
pnpm run typecheck:libs
pnpm --filter @workspace/api-server run build
NODE_ENV=production PORT=8080 node --enable-source-maps artifacts/api-server/dist/index.mjs
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | — | Set to `production` for JSON logs and no pino-pretty |
| `PORT` | Yes | — | Port to listen on (set automatically by most platforms) |
| `LOG_LEVEL` | No | `info` | Pino log level |

No database or external API keys required.
