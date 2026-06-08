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
  short_url: string;
  category: string;
  info: Record<string, unknown>;
  media: {
    mp4: { url: string; quality: "HD" } | null;
    mp3: { url: string } | null;
    server: 1 | 2 | null;
  };
}

interface VideoResponse extends VideoPayload {
  ApiCount: number;
  cached: boolean;
  ms: number;
}

// Fresh 5 min, stale-served up to 20 min (SWR), max 500 entries.
const cache = new TtlCache<VideoPayload>(300_000, 1_200_000, 500);

// Title → videoId lookup cache (LRU, max 1000).
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

/**
 * Fetch and assemble the full video payload.
 *
 * @param preInfo - Pre-loaded yts.VideoResult from a keyword search.
 *   When provided, the redundant second yts({ videoId }) lookup is skipped
 *   and only the download fetch runs — saving a full network round-trip.
 *   Pass null for URL-based requests to run yts + download in parallel.
 */
async function fetchPayload(
  videoId: string,
  youtubeUrl: string,
  preInfo: yts.VideoResult | null = null,
): Promise<VideoPayload> {
  let info: yts.VideoResult | null = preInfo;
  let links: Awaited<ReturnType<typeof fetchDownloadLinks>> | null = null;

  if (info) {
    // Keyword path — metadata already in hand from the search result.
    // Only fetch download links (no second yts call needed).
    links = await dedup(`dl:${videoId}`, () => fetchDownloadLinks(youtubeUrl));
  } else {
    // URL path — run metadata lookup and download fetch in parallel.
    const [infoResult, dlResult] = await Promise.allSettled([
      dedup(`yts-vid:${videoId}`, () =>
        withTimeout(yts({ videoId }), 15_000, "yt-search-id"),
      ),
      dedup(`dl:${videoId}`, () => fetchDownloadLinks(youtubeUrl)),
    ]);
    info = infoResult.status === "fulfilled"
      ? (infoResult.value as unknown as yts.VideoResult)
      : null;
    links = dlResult.status === "fulfilled" ? dlResult.value : null;
  }

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
    short_url: `https://youtu.be/${videoId}`,
    category,
    info: clean(rawInfo),
    media: {
      mp4: mp4Url ? { url: mp4Url, quality: "HD" } : null,
      mp3: mp3Url ? { url: mp3Url } : null,
      server: links?.server ?? null,
    },
  };
}

router.get("/v1/q", downloadRateLimit, async (req: Request, res: Response) => {
  const t0 = Date.now();
  const ApiCount = increment();
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) recordSuccess();
    else recordError();
  });

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
    let preInfo: yts.VideoResult | null = null;

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
      // preInfo stays null — fetchPayload runs yts + download in parallel.
    } else {
      const known = queryToId.get(input);
      if (known) {
        videoId = known;
        youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        // preInfo stays null — metadata comes from cache or parallel fetch.
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
        // Pass the search result directly — avoids a redundant yts({ videoId }) call.
        preInfo = first;
      }
    }

    const hit = cache.getWithMeta(videoId);
    if (hit) {
      res.setHeader("Cache-Control", "private, no-store");
      res.json({ ...hit.value, ApiCount, cached: true, ms: Date.now() - t0 } satisfies VideoResponse);
      if (hit.stale) {
        setImmediate(() => {
          dedup(`swr:${videoId}`, () => fetchPayload(videoId!, youtubeUrl, null))
            .then(payload => cache.set(videoId!, payload))
            .catch(() => {});
        });
      }
      return;
    }

    const payload = await dedup(`fetch:${videoId}`, () => fetchPayload(videoId!, youtubeUrl, preInfo));
    cache.set(videoId, payload);
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ ...payload, ApiCount, cached: false, ms: Date.now() - t0 } satisfies VideoResponse);
  } catch (err: unknown) {
    req.log.error({ err, input }, "YouTube download error");
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
