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
import { fetchDownloadLinks, type QualityMap } from "../lib/downloader";
import { isShutdown, emitAdminLog, recordApiCall, recordServerResult } from "../lib/admin-state";

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
    mp4: { url: string; quality: string } | null;
    mp3: { url: string } | null;
    qualities: QualityMap;
    server: 1 | null;
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

function bestQualityLabel(qualities: QualityMap, mp4Url: string | null): string {
  if (!mp4Url) return "HD";
  const order = ["1080p", "720p", "480p", "360p"] as const;
  return order.find((q) => qualities[q] === mp4Url) ?? "HD";
}

/**
 * Fetch and assemble the full video payload.
 *
 * @param preInfo - Pre-loaded yts.VideoResult from a keyword search.
 * @param baseUrl - Server base URL used to build proxy/merge links.
 */
async function fetchPayload(
  videoId: string,
  youtubeUrl: string,
  preInfo: yts.VideoResult | null = null,
  baseUrl: string,
): Promise<VideoPayload> {
  let info: yts.VideoResult | null = preInfo;
  let links: Awaited<ReturnType<typeof fetchDownloadLinks>> | null = null;

  if (info) {
    links = await dedup(`dl:${videoId}`, () => fetchDownloadLinks(youtubeUrl, baseUrl));
  } else {
    const [infoResult, dlResult] = await Promise.allSettled([
      dedup(`yts-vid:${videoId}`, () =>
        withTimeout(yts({ videoId }), 15_000, "yt-search-id"),
      ),
      dedup(`dl:${videoId}`, () => fetchDownloadLinks(youtubeUrl, baseUrl)),
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
  const qualities = links?.qualities ?? {};
  const quality = bestQualityLabel(qualities, mp4Url);

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
      mp4: mp4Url ? { url: mp4Url, quality } : null,
      mp3: mp3Url ? { url: mp3Url } : null,
      qualities,
      server: links?.server ?? null,
    },
  };
}

router.get("/v1/q", downloadRateLimit, async (req: Request, res: Response) => {
  const t0 = Date.now();

  if (isShutdown()) {
    emitAdminLog("warn", "[v1] Request blocked — server in shutdown mode");
    res.status(503).json({
      version: VERSION, creditTo: "MJL", status: "shutdown",
      message: "Temporary Shutdown — Admins are currently fixing or improving things. We'll be back in a little while — please be patient.",
    });
    return;
  }

  const validation = validateQuery(req.query[""]);
  if (!validation.ok) {
    res.status(400).json({
      version: VERSION,
      success: false,
      creditTo: "MJL",
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

  if (isUrl(input) && !extractVideoId(input)) {
    res.status(400).json({
      version: VERSION,
      success: false,
      creditTo: "MJL",
      ms: Date.now() - t0,
      error: "URL not supported. Only YouTube URLs are accepted.",
      supported: [
        "https://youtu.be/VIDEO_ID",
        "https://www.youtube.com/watch?v=VIDEO_ID",
        "https://www.youtube.com/shorts/VIDEO_ID",
      ],
      tip: "You can also search by title — e.g. /api/v1/q?=bohemian rhapsody",
    });
    return;
  }

  const ApiCount = increment();
  recordApiCall();
  emitAdminLog("info", `[v1] ${input.slice(0, 80)}`);
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) recordSuccess();
    else recordError();
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  try {
    let videoId: string | null = null;
    let youtubeUrl: string;
    let preInfo: yts.VideoResult | null = null;

    if (isUrl(input)) {
      videoId = extractVideoId(input);
      youtubeUrl = `https://www.youtube.com/watch?v=${videoId!}`;
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
        preInfo = first;
      }
    }

    const hit = cache.getWithMeta(videoId!);
    if (hit) {
      res.setHeader("Cache-Control", "private, no-store");
      res.json({ ...hit.value, ApiCount, cached: true, ms: Date.now() - t0 } satisfies VideoResponse);
      if (hit.stale) {
        setImmediate(() => {
          dedup(`swr:${videoId}`, () => fetchPayload(videoId!, youtubeUrl, null, baseUrl))
            .then(payload => cache.set(videoId!, payload))
            .catch(() => {});
        });
      }
      return;
    }

    const payload = await dedup(`fetch:${videoId}`, () => fetchPayload(videoId!, youtubeUrl, preInfo, baseUrl));
    cache.set(videoId!, payload);
    res.setHeader("Cache-Control", "private, no-store");
    const srv = payload.media.server;
    if (srv === 1) recordServerResult(srv, !!(payload.media.mp4 || payload.media.mp3));
    emitAdminLog("success", `[v1] ✓ ${videoId} server:${srv ?? "?"} ${Date.now()-t0}ms`);
    res.json({ ...payload, ApiCount, cached: false, ms: Date.now() - t0 } satisfies VideoResponse);
  } catch (err: unknown) {
    req.log.error({ err, input }, "YouTube download error");
    emitAdminLog("error", `[v1] ✗ ${sanitizeError(err)}`);
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
