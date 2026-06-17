import { Router, type IRouter, type Request, type Response } from "express";
import yts from "yt-search";
import { TtlCache } from "../lib/cache";
import { BoundedMap } from "../lib/bounded-map";
import { VERSION } from "../lib/version";
import { increment, recordSuccess, recordError } from "../lib/counter";
import { dedup, withTimeout } from "../lib/dedup";
import { validateQuery, sanitizeError } from "../lib/validate";
import { downloadRateLimit } from "../middleware/rate-limit";
import { fetchDownloadLinks, type QualityMap } from "../lib/downloader";
import { isShutdown, emitAdminLog, recordApiCall, recordServerResult } from "../lib/admin-state";

const router: IRouter = Router();

interface V2Payload {
  credit: "MJL";
  version: string;
  title: string | null;
  media: {
    mp4: string | null;
    mp3: string | null;
    qualities: QualityMap;
    server: 1 | null;
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

async function fetchPayload(
  videoId: string,
  youtubeUrl: string,
  knownTitle: string | null,
  baseUrl: string,
): Promise<V2Payload> {
  const links = await dedup(`dl:${videoId}`, () => fetchDownloadLinks(youtubeUrl, baseUrl));

  const title = knownTitle ?? links?.title ?? null;

  return {
    credit: "MJL",
    version: VERSION,
    title,
    media: {
      mp4: links?.mp4 ?? null,
      mp3: links?.mp3 ?? null,
      qualities: links?.qualities ?? {},
      server: links?.server ?? null,
    },
  };
}

router.get("/v2/q", downloadRateLimit, async (req: Request, res: Response) => {
  const t0 = Date.now();

  if (isShutdown()) {
    emitAdminLog("warn", "[v2] Request blocked — server in shutdown mode");
    res.status(503).json({
      credit: "MJL", version: VERSION, status: "shutdown",
      message: "Temporary Shutdown — Admins are currently fixing or improving things. We'll be back in a little while — please be patient.",
    });
    return;
  }

  const validation = validateQuery(req.query[""]);
  if (!validation.ok) {
    res.status(400).json({
      credit: "MJL",
      version: VERSION,
      ms: Date.now() - t0,
      error: validation.reason,
      usage: "/api/v2/q?=(YouTube URL or title)",
    });
    return;
  }

  const input = validation.value;

  if (isUrl(input) && !extractVideoId(input)) {
    res.status(400).json({
      credit: "MJL",
      version: VERSION,
      ms: Date.now() - t0,
      error: "URL not supported. Only YouTube URLs are accepted.",
      supported: [
        "https://youtu.be/VIDEO_ID",
        "https://www.youtube.com/watch?v=VIDEO_ID",
        "https://www.youtube.com/shorts/VIDEO_ID",
      ],
      tip: "You can also search by title — e.g. /api/v2/q?=bohemian rhapsody",
    });
    return;
  }

  const ApiCount = increment();
  recordApiCall();
  emitAdminLog("info", `[v2] ${input.slice(0, 80)}`);
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) recordSuccess();
    else recordError();
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  try {
    let videoId: string | null = null;
    let youtubeUrl: string;
    let knownTitle: string | null = null;

    if (isUrl(input)) {
      videoId = extractVideoId(input);
      youtubeUrl = `https://www.youtube.com/watch?v=${videoId!}`;
      knownTitle = videoIdToTitle.get(videoId!) ?? null;
    } else {
      const known = queryToId.get(input);
      if (known) {
        videoId = known;
        youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        knownTitle = videoIdToTitle.get(videoId!) ?? null;
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

    const hit = cache.getWithMeta(videoId!);
    if (hit) {
      res.setHeader("Cache-Control", "private, no-store");
      res.json({
        ...hit.value,
        ApiCount,
        cached: true,
        ms: Date.now() - t0,
      } satisfies V2Response);
      if (hit.stale) {
        setImmediate(() => {
          dedup(`swr-v2:${videoId}`, () => fetchPayload(videoId!, youtubeUrl, null, baseUrl))
            .then(payload => cache.set(videoId!, payload))
            .catch(() => {});
        });
      }
      return;
    }

    const payload = await dedup(
      `fetch-v2:${videoId}`,
      () => fetchPayload(videoId!, youtubeUrl, knownTitle, baseUrl),
    );
    cache.set(videoId!, payload);
    res.setHeader("Cache-Control", "private, no-store");
    const srv2 = payload.media.server;
    if (srv2 === 1) recordServerResult(srv2, !!(payload.media.mp4 || payload.media.mp3));
    emitAdminLog("success", `[v2] ✓ ${videoId} server:${srv2 ?? "?"} ${Date.now()-t0}ms`);
    res.json({
      ...payload,
      ApiCount,
      cached: false,
      ms: Date.now() - t0,
    } satisfies V2Response);
  } catch (err: unknown) {
    req.log.error({ err, input }, "v2 YouTube download error");
    emitAdminLog("error", `[v2] ✗ ${sanitizeError(err)}`);
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
