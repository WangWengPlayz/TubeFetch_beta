import { Router, type IRouter, type Request, type Response } from "express";
import yts from "yt-search";
import { TtlCache } from "../lib/cache";
import { BoundedMap } from "../lib/bounded-map";
import { VERSION } from "../lib/version";
import { increment, recordSuccess, recordError } from "../lib/counter";
import { dedup, withTimeout } from "../lib/dedup";
import { validateQuery, sanitizeError } from "../lib/validate";
import { downloadRateLimit } from "../middleware/rate-limit";
import { fetchDownloadLinks } from "../lib/downloader";

const router: IRouter = Router();

interface V2Payload {
  credit: "MJL";
  version: string;
  title: string | null;
  media: {
    mp4: string | null;
    mp3: string | null;
  };
}

interface V2Response extends V2Payload {
  ApiCount: number;
  ms: number;
}

// Fresh 5 min, stale-served up to 20 min (SWR), max 500 entries.
const cache = new TtlCache<V2Payload>(300_000, 1_200_000, 500);

// BoundedMap (LRU, max 1000) — prevents heap exhaustion from unique-query flooding.
const queryToId = new BoundedMap<string, string>(1_000);

// Stores resolved title per videoId — avoids redundant yts lookups on cache miss.
const videoIdToTitle = new BoundedMap<string, string>(1_000);

const YT_URL_RE =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

function extractVideoId(input: string): string | null {
  const m = input.match(YT_URL_RE);
  return m ? m[1] : null;
}

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input);
}

async function fetchPayload(videoId: string, youtubeUrl: string, title: string | null): Promise<V2Payload> {
  const links = await dedup(
    `dl:${videoId}`,
    () => fetchDownloadLinks(youtubeUrl),
  );
  return {
    credit: "MJL",
    version: VERSION,
    title,
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
    let title: string | null = null;

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
      // Resolve title for URL-based requests via a cached yts lookup.
      title = videoIdToTitle.get(videoId) ?? null;
      if (!title) {
        const info = await dedup(
          `yts-id:${videoId}`,
          () => withTimeout(yts({ videoId }), 15_000, "yt-search"),
        );
        // yts({ videoId }) returns a VideoMetadataResult — title is directly
        // on the object, NOT nested inside a .videos[] array like a search result.
        title = (info as unknown as { title?: string }).title ?? null;
        if (title) videoIdToTitle.set(videoId, title);
      }
    } else {
      const known = queryToId.get(input);
      if (known) {
        videoId = known;
        youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        title = videoIdToTitle.get(videoId) ?? null;
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
        title = first.title ?? null;
        youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        queryToId.set(input, videoId);
        if (title) videoIdToTitle.set(videoId, title);
      }
    }

    const hit = cache.getWithMeta(videoId);
    if (hit) {
      res.setHeader("Cache-Control", "private, no-store");
      res.json({ ...hit.value, ApiCount, ms: Date.now() - t0 } satisfies V2Response);
      if (hit.stale) {
        setImmediate(() => {
          const cachedTitle = hit.value.title;
          dedup(`swr-v2:${videoId}`, () => fetchPayload(videoId!, youtubeUrl, cachedTitle))
            .then(payload => cache.set(videoId!, payload))
            .catch(() => {});
        });
      }
      return;
    }

    const payload = await dedup(`fetch-v2:${videoId}`, () => fetchPayload(videoId!, youtubeUrl, title));
    cache.set(videoId, payload);
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ ...payload, ApiCount, ms: Date.now() - t0 } satisfies V2Response);
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
