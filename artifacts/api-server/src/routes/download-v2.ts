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
import { fetchDownloadLinks, type DownloadLinks } from "../lib/downloader";

const router: IRouter = Router();

// Metadata resolved from either a keyword search result or a yts({ videoId }) lookup.
interface VideoMeta {
  title: string | null;
  channelName: string | null;
  channelUrl: string | null;
  thumbnail: string | null;
  duration: string | null;
  durationSeconds: number | null;
  views: number | null;
  published: string | null;
  keywords: string[];
  description: string;
}

interface V2Payload {
  credit: "MJL";
  version: string;
  video_id: string;
  video_url: string;
  short_url: string;
  title: string | null;
  channel_name: string | null;
  channel_url: string | null;
  thumbnail: string | null;
  duration: string | null;
  duration_seconds: number | null;
  views: number | null;
  published: string | null;
  category: string | null;
  media: {
    mp4: string | null;
    mp3: string | null;
  };
}

interface V2Response extends V2Payload {
  ApiCount: number;
  cached: boolean;
  ms: number;
}

// Fresh 5 min, stale-served up to 20 min (SWR), max 500 entries.
const cache = new TtlCache<V2Payload>(300_000, 1_200_000, 500);

// Keyword → videoId lookup (LRU, max 1000) — avoids re-running keyword searches.
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

/**
 * Assemble the full v2 payload.
 *
 * @param preMeta - Pre-loaded metadata from a keyword search result.
 *   When provided, only the download fetch runs.
 *   When null (URL input), yts({ videoId }) and download run in parallel.
 */
async function fetchPayload(
  videoId: string,
  youtubeUrl: string,
  preMeta: VideoMeta | null,
): Promise<V2Payload> {
  let meta = preMeta;
  let links: DownloadLinks | null = null;

  if (meta) {
    // Keyword path — metadata already in hand; only fetch download links.
    links = await dedup(`dl:${videoId}`, () => fetchDownloadLinks(youtubeUrl));
  } else {
    // URL path — run metadata lookup and download fetch in parallel.
    const [infoResult, dlResult] = await Promise.allSettled([
      dedup(`yts-id:${videoId}`, () =>
        withTimeout(yts({ videoId }), 15_000, "yt-search"),
      ),
      dedup(`dl:${videoId}`, () => fetchDownloadLinks(youtubeUrl)),
    ]);
    links = dlResult.status === "fulfilled" ? dlResult.value : null;
    if (infoResult.status === "fulfilled") {
      const raw = infoResult.value as unknown as {
        title?: string;
        author?: yts.VideoAuthor | string;
        thumbnail?: string;
        image?: string;
        duration?: { timestamp?: string; seconds?: number };
        views?: number;
        ago?: string;
        keywords?: string[];
        description?: string;
      };
      const { name: channelName, url: channelUrl } = resolveAuthor(raw.author);
      meta = {
        title: raw.title ?? null,
        channelName,
        channelUrl,
        thumbnail: raw.thumbnail ?? raw.image ?? null,
        duration: raw.duration?.timestamp ?? null,
        durationSeconds: raw.duration?.seconds ?? null,
        views: raw.views ?? null,
        published: raw.ago ?? null,
        keywords: raw.keywords ?? [],
        description: raw.description ?? "",
      };
    }
  }

  const thumbnail =
    meta?.thumbnail ?? links?.thumbnail ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const category = meta
    ? inferCategory(meta.keywords, meta.title ?? "", meta.description)
    : null;

  return {
    credit: "MJL",
    version: VERSION,
    video_id: videoId,
    video_url: youtubeUrl,
    short_url: `https://youtu.be/${videoId}`,
    title: meta?.title ?? null,
    channel_name: meta?.channelName ?? null,
    channel_url: meta?.channelUrl ?? null,
    thumbnail,
    duration: meta?.duration ?? null,
    duration_seconds: meta?.durationSeconds ?? null,
    views: meta?.views ?? null,
    published: meta?.published ?? null,
    category,
    media: {
      mp4: links?.mp4 ?? null,
      mp3: links?.mp3 ?? null,
    },
  };
}

router.get("/v2/q", downloadRateLimit, async (req: Request, res: Response) => {
  const t0 = Date.now();
  const ApiCount = increment();
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) recordSuccess();
    else recordError();
  });

  const validation = validateQuery(req.query[""]);
  if (!validation.ok) {
    res.status(400).json({
      credit: "MJL",
      version: VERSION,
      ApiCount,
      ms: Date.now() - t0,
      error: validation.reason,
      usage: "/api/v2/q?=(YouTube URL or title)",
    });
    return;
  }

  const input = validation.value;

  try {
    let videoId: string | null = null;
    let youtubeUrl: string;
    let preMeta: VideoMeta | null = null;

    if (isUrl(input)) {
      videoId = extractVideoId(input);
      if (!videoId) {
        res.status(400).json({
          credit: "MJL",
          version: VERSION,
          ApiCount,
          ms: Date.now() - t0,
          error: "Could not extract a YouTube video ID from this URL.",
        });
        return;
      }
      youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      // preMeta stays null — fetchPayload will run yts + download in parallel.
    } else {
      const known = queryToId.get(input);
      if (known) {
        videoId = known;
        youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        // preMeta stays null — metadata served from payload cache or parallel fetch.
      } else {
        const searchResult = await dedup(
          `yts:${input}`,
          () => withTimeout(yts(input), 15_000, "yt-search"),
        );
        const first = searchResult.videos[0];
        if (!first) {
          res.status(404).json({
            credit: "MJL",
            version: VERSION,
            ApiCount,
            ms: Date.now() - t0,
            error: "No YouTube results found for this query.",
          });
          return;
        }
        videoId = first.videoId;
        youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        queryToId.set(input, videoId);
        const { name: channelName, url: channelUrl } = resolveAuthor(first.author);
        preMeta = {
          title: first.title ?? null,
          channelName,
          channelUrl,
          thumbnail: first.thumbnail ?? first.image ?? null,
          duration: first.duration?.timestamp ?? null,
          durationSeconds: first.duration?.seconds ?? null,
          views: first.views ?? null,
          published: first.ago ?? null,
          keywords: first.keywords ?? [],
          description: first.description ?? "",
        };
      }
    }

    const hit = cache.getWithMeta(videoId);
    if (hit) {
      res.setHeader("Cache-Control", "private, no-store");
      res.json({ ...hit.value, ApiCount, cached: true, ms: Date.now() - t0 } satisfies V2Response);
      if (hit.stale) {
        setImmediate(() => {
          // SWR background refresh always re-fetches both yts + download in parallel.
          dedup(`swr-v2:${videoId}`, () => fetchPayload(videoId!, youtubeUrl, null))
            .then(payload => cache.set(videoId!, payload))
            .catch(() => {});
        });
      }
      return;
    }

    const payload = await dedup(
      `fetch-v2:${videoId}`,
      () => fetchPayload(videoId!, youtubeUrl, preMeta),
    );
    cache.set(videoId, payload);
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ ...payload, ApiCount, cached: false, ms: Date.now() - t0 } satisfies V2Response);
  } catch (err: unknown) {
    req.log.error({ err, input }, "v2 YouTube download error");
    res.status(500).json({
      credit: "MJL",
      version: VERSION,
      ApiCount,
      ms: Date.now() - t0,
      error: sanitizeError(err),
    });
  }
});

export default router;
