import { Router, type IRouter, type Request, type Response } from "express";
import { createRequire } from "module";
import yts from "yt-search";
import { TtlCache } from "../lib/cache";
import { VERSION } from "../lib/version";
import { increment, recordSuccess, recordError } from "../lib/counter";
import { dedup, withTimeout } from "../lib/dedup";

const _require = createRequire(import.meta.url);
const { ytdown } = _require("nayan-media-downloaders") as typeof import("nayan-media-downloaders");

const router: IRouter = Router();

interface V2Payload {
  credit: "MJL";
  version: string;
  media: {
    mp4: string | null;
    mp3: string | null;
  };
}

interface V2Response extends V2Payload {
  ApiCount: number;
  ms: number;
}

// Fresh 5 min, stale-served up to 20 min (SWR window)
const cache = new TtlCache<V2Payload>(300_000, 1_200_000);

// Maps title query → videoId so repeat title lookups skip the yt-search call entirely
const queryToId = new Map<string, string>();

const YT_URL_RE =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

function extractVideoId(input: string): string | null {
  const m = input.match(YT_URL_RE);
  return m ? m[1] : null;
}

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input);
}

async function fetchPayload(videoId: string, youtubeUrl: string): Promise<V2Payload> {
  const dl = await dedup(
    `ytdown:${videoId}`,
    () => withTimeout(ytdown(youtubeUrl), 20_000, "ytdown"),
  );
  const dlData = (dl?.status ? dl.data : null) ?? null;
  return {
    credit: "MJL",
    version: VERSION,
    media: {
      mp4: dlData?.video ?? dlData?.high ?? null,
      mp3: dlData?.audio ?? dlData?.low ?? null,
    },
  };
}

router.get("/v2/q", async (req: Request, res: Response) => {
  const t0 = Date.now();
  const ApiCount = increment();
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) recordSuccess();
    else recordError();
  });

  const query = req.query[""] as string | undefined;

  if (!query || !query.trim()) {
    res.status(400).json({
      credit: "MJL",
      version: VERSION,
      ApiCount,
      ms: Date.now() - t0,
      error: "Missing query.",
      usage: "/api/v2/q?=(YouTube URL or title)",
    });
    return;
  }

  const input = query.trim();

  try {
    let videoId: string | null = null;
    let youtubeUrl: string;

    if (isUrl(input)) {
      videoId = extractVideoId(input);
      if (!videoId) {
        res.status(400).json({
          credit: "MJL",
          version: VERSION,
          ApiCount,
          ms: Date.now() - t0,
          error: "Could not extract a YouTube video ID from this URL.",
          input,
        });
        return;
      }
      youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else {
      // Fast path: previously resolved title → videoId (skips the yt-search call entirely)
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
            credit: "MJL",
            version: VERSION,
            ApiCount,
            ms: Date.now() - t0,
            error: "No YouTube results found for this query.",
            query: input,
          });
          return;
        }
        videoId = first.videoId;
        youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        queryToId.set(input, videoId);
      }
    }

    // Stale-while-revalidate: serve stale cache instantly, refresh in background
    const hit = cache.getWithMeta(videoId);
    if (hit) {
      res.setHeader("Cache-Control", "public, max-age=300");
      res.json({ ...hit.value, ApiCount, ms: Date.now() - t0 } satisfies V2Response);
      if (hit.stale) {
        setImmediate(() => {
          dedup(`swr-v2:${videoId}`, () => fetchPayload(videoId!, youtubeUrl))
            .then(payload => cache.set(videoId!, payload))
            .catch(() => {});
        });
      }
      return;
    }

    const payload = await dedup(`fetch-v2:${videoId}`, () => fetchPayload(videoId!, youtubeUrl));
    cache.set(videoId, payload);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ ...payload, ApiCount, ms: Date.now() - t0 } satisfies V2Response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    req.log.error({ err, input }, "v2 YouTube download error");
    res.status(500).json({
      credit: "MJL",
      version: VERSION,
      ApiCount,
      ms: Date.now() - t0,
      error: message,
      input,
    });
  }
});

export default router;
