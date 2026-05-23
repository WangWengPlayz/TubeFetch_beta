import { Router, type IRouter, type Request, type Response } from "express";
import yts from "yt-search";
import { TtlCache } from "../lib/cache";
import { BoundedMap } from "../lib/bounded-map";
import { VERSION } from "../lib/version";
import { increment, recordSuccess, recordError } from "../lib/counter";
import { inferCategory } from "../lib/category";
import { dedup, withTimeout } from "../lib/dedup";
import { validateQuery, sanitizeError } from "../lib/validate";
import { downloadRateLimit } from "../middleware/rate-limit";
import { fetchDownloadLinks } from "../lib/downloader";

const router: IRouter = Router();

interface VideoPayload {
  version: string;
  success: true;
  creditTo: "MJL";
  video_id: string;
  url: string;
  category: string;
  info: Record<string, unknown>;
  media: {
    mp4: { url: string; quality: "HD" } | null;
    mp3: { url: string } | null;
  };
}

interface VideoResponse extends VideoPayload {
  ApiCount: number;
  cached: boolean;
  ms: number;
}

// Fresh 5 min, stale-served up to 20 min (SWR), max 500 entries.
// The size cap prevents heap exhaustion from unique-query flooding.
const cache = new TtlCache<VideoPayload>(300_000, 1_200_000, 500);

// Title → videoId lookup cache.
// BoundedMap (LRU, max 1000) instead of a plain Map — a plain Map never
// evicts entries, allowing an attacker to exhaust heap memory by sending
// an endless stream of distinct title queries.
const queryToId = new BoundedMap<string, string>(1_000);

const YT_URL_RE =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

function extractVideoId(input: string): string | null {
  const m = input.match(YT_URL_RE);
  return m ? m[1] : null;
}

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input);
}

function resolveAuthor(author: yts.VideoAuthor | string | undefined): {
  name: string | null;
  url: string | null;
} {
  if (!author) return { name: null, url: null };
  if (typeof author === "string") return { name: author, url: null };
  return { name: author.name ?? null, url: author.url ?? null };
}

function clean(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => {
      if (v === null || v === undefined) return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    }),
  );
}

function resolveThumbnail(
  videoId: string,
  info: yts.VideoResult | null,
  dlThumbnail?: string,
): string {
  const fromYts = info?.thumbnail || info?.image || null;
  if (fromYts) return fromYts;
  if (dlThumbnail) return dlThumbnail;
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

async function fetchPayload(videoId: string, youtubeUrl: string): Promise<VideoPayload> {
  const [infoResult, dlResult] = await Promise.allSettled([
    dedup(`yts-vid:${videoId}`, () => withTimeout(yts({ videoId }), 15_000, "yt-search-id")),
    dedup(`dl:${videoId}`, () => fetchDownloadLinks(youtubeUrl)),
  ]);

  const info = infoResult.status === "fulfilled" ? infoResult.value : null;
  const links = dlResult.status === "fulfilled" ? dlResult.value : null;

  const { name: authorName, url: channelUrl } = resolveAuthor(info?.author);
  const thumbnail = resolveThumbnail(videoId, info, links?.thumbnail ?? undefined);
  const category = inferCategory(
    info?.keywords ?? [],
    info?.title ?? "",
    info?.description ?? "",
  );

  const rawInfo: Record<string, unknown> = {
    title:            info?.title ?? null,
    author:           authorName,
    channel_url:      channelUrl,
    thumbnail,
    duration:         info?.duration?.timestamp ?? null,
    duration_seconds: info?.duration?.seconds ?? null,
    views:            info?.views ?? null,
    likes:            info?.likes ?? null,
    published:        info?.ago ?? null,
    description:      info?.description ?? null,
    keywords:         info?.keywords ?? [],
  };

  const mp4Url = links?.mp4 ?? null;
  const mp3Url = links?.mp3 ?? null;

  return {
    version: VERSION,
    success: true,
    creditTo: "MJL",
    video_id: videoId,
    url: youtubeUrl,
    category,
    info: clean(rawInfo),
    media: {
      mp4: mp4Url ? { url: mp4Url, quality: "HD" } : null,
      mp3: mp3Url ? { url: mp3Url } : null,
    },
  };
}

// Per-endpoint rate limit (stricter than the global one) applied before any
// handler logic — upstream calls are expensive and must be protected separately.
router.get("/v1/q", downloadRateLimit, async (req: Request, res: Response) => {
  const t0 = Date.now();
  const ApiCount = increment();
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) recordSuccess();
    else recordError();
  });

  // Validate and sanitize the query parameter before any further processing
  const validation = validateQuery(req.query[""]);
  if (!validation.ok) {
    res.status(400).json({
      version: VERSION,
      success: false,
      creditTo: "MJL",
      ApiCount,
      ms: Date.now() - t0,
      error: validation.reason,
      usage: "/api/v1/q?=(YouTube URL or song/video title)",
      examples: [
        "/api/v1/q?=lay me down sam smith",
        "/api/v1/q?=https://youtu.be/dQw4w9WgXcQ",
        "/api/v1/q?=https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      ],
    });
    return;
  }

  const input = validation.value;

  try {
    let videoId: string | null = null;
    let youtubeUrl: string;

    if (isUrl(input)) {
      videoId = extractVideoId(input);
      if (!videoId) {
        res.status(400).json({
          version: VERSION,
          success: false,
          creditTo: "MJL",
          ApiCount,
          ms: Date.now() - t0,
          error: "Could not extract a YouTube video ID from this URL.",
        });
        return;
      }
      youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else {
      const known = queryToId.get(input);
      if (known) {
        videoId = known;
        youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      } else {
        const searchResult = await dedup(
          `yts:${input}`,
          () => withTimeout(yts(input), 15_000, "yt-search"),
        );
        const first = searchResult.videos[0];
        if (!first) {
          res.status(404).json({
            version: VERSION,
            success: false,
            creditTo: "MJL",
            ApiCount,
            ms: Date.now() - t0,
            error: "No YouTube results found for this query.",
          });
          return;
        }
        videoId = first.videoId;
        youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        queryToId.set(input, videoId);
      }
    }

    const hit = cache.getWithMeta(videoId);
    if (hit) {
      // private: no-store — the server's SWR cache handles caching.
      // "public" would let CDNs/shared proxies cache API responses, which:
      //   1. breaks the ApiCount counter (served from proxy, counter not incremented)
      //   2. enables cache-poisoning attacks at the CDN layer
      res.setHeader("Cache-Control", "private, no-store");
      res.json({ ...hit.value, ApiCount, cached: true, ms: Date.now() - t0 } satisfies VideoResponse);
      if (hit.stale) {
        setImmediate(() => {
          dedup(`swr:${videoId}`, () => fetchPayload(videoId!, youtubeUrl))
            .then(payload => cache.set(videoId!, payload))
            .catch(() => {});
        });
      }
      return;
    }

    const payload = await dedup(`fetch:${videoId}`, () => fetchPayload(videoId!, youtubeUrl));
    cache.set(videoId, payload);
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ ...payload, ApiCount, cached: false, ms: Date.now() - t0 } satisfies VideoResponse);
  } catch (err: unknown) {
    // Log the full error server-side for debugging...
    req.log.error({ err, input }, "YouTube download error");
    // ...but never send raw error internals to the client.
    // Raw errors can expose: file paths, dependency names/versions,
    // upstream API error messages, internal timeout labels.
    res.status(500).json({
      version: VERSION,
      success: false,
      creditTo: "MJL",
      ApiCount,
      ms: Date.now() - t0,
      error: sanitizeError(err),
    });
  }
});

export default router;
