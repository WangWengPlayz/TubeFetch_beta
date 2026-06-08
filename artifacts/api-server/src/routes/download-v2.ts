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
    server: 1 | 2 | null;
  };
}

interface V2Response extends V2Payload {
  ApiCount: number;
  cached: boolean;
  ms: number;
}

// Fresh 5 min, stale-served up to 20 min (SWR), max 500 entries.
const cache = new TtlCache<V2Payload>(300_000, 1_200_000, 500);

// Keyword → videoId (LRU, max 1000) — avoids re-running keyword searches.
const queryToId = new BoundedMap<string, string>(1_000);

// videoId → title (LRU, max 1000) — caches resolved titles for URL inputs.
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

/**
 * Fetch title + download links for a video.
 *
 * knownTitle = string → keyword path: title already known; only fetches download links.
 * knownTitle = null   → URL path: fetches download links first (ytdl.getInfo already
 *                        returns the title as a free bonus). If the nayan fallback was
 *                        used instead (ytdl failed), links.title is null and we fall
 *                        back to a yts({ videoId }) call to recover the title.
 */
async function fetchPayload(
  videoId: string,
  youtubeUrl: string,
  knownTitle: string | null,
): Promise<V2Payload> {
  const links = await dedup(`dl:${videoId}`, () => fetchDownloadLinks(youtubeUrl));

  let title = knownTitle ?? links?.title ?? null;

  // URL path fallback: ytdl failed (nayan was used) so links.title is null.
  // Try yts({ videoId }) to recover the title. This is rare — ytdl succeeds
  // in the vast majority of requests.
  if (!title) {
    try {
      const info = await dedup(`yts-id:${videoId}`, () =>
        withTimeout(yts({ videoId }), 12_000, "yt-search-id"),
      );
      title = (info as unknown as { title?: string }).title ?? null;
      if (title) videoIdToTitle.set(videoId, title);
    } catch { /* best-effort */ }
  }

  return {
    credit: "MJL",
    version: VERSION,
    title,
    media: {
      mp4: links?.mp4 ?? null,
      mp3: links?.mp3 ?? null,
      server: links?.server ?? null,
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
    let knownTitle: string | null = null;

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
      // Use cached title if available; otherwise fetchPayload resolves it in parallel with dl.
      knownTitle = videoIdToTitle.get(videoId) ?? null;
    } else {
      const known = queryToId.get(input);
      if (known) {
        videoId = known;
        youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        knownTitle = videoIdToTitle.get(videoId) ?? null;
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
        knownTitle = first.title ?? null;
        queryToId.set(input, videoId);
        if (knownTitle) videoIdToTitle.set(videoId, knownTitle);
      }
    }

    const hit = cache.getWithMeta(videoId);
    if (hit) {
      res.setHeader("Cache-Control", "private, no-store");
      res.json({ ...hit.value, ApiCount, cached: true, ms: Date.now() - t0 } satisfies V2Response);
      if (hit.stale) {
        setImmediate(() => {
          dedup(`swr-v2:${videoId}`, () => fetchPayload(videoId!, youtubeUrl, null))
            .then(payload => cache.set(videoId!, payload))
            .catch(() => {});
        });
      }
      return;
    }

    const payload = await dedup(
      `fetch-v2:${videoId}`,
      () => fetchPayload(videoId!, youtubeUrl, knownTitle),
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
