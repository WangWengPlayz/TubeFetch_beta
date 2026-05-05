import { Router, type IRouter, type Request, type Response } from "express";
import { createRequire } from "module";
import yts from "yt-search";
import { TtlCache } from "../lib/cache";
import { VERSION } from "../lib/version";
import { increment } from "../lib/counter";

const _require = createRequire(import.meta.url);
const { ytdown } = _require("nayan-media-downloaders") as typeof import("nayan-media-downloaders");

const router: IRouter = Router();

interface V2Response {
  credit: "MJL";
  version: string;
  ApiCount: number;
  ms: number;
  media: {
    mp4: string | null;
    mp3: string | null;
  };
}

const cache = new TtlCache<Omit<V2Response, "ms" | "ApiCount">>(90_000);

const YT_URL_RE =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

function extractVideoId(input: string): string | null {
  const m = input.match(YT_URL_RE);
  return m ? m[1] : null;
}

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input);
}

router.get("/v2/q", async (req: Request, res: Response) => {
  const t0 = Date.now();
  const ApiCount = increment();
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
      const searchResult = await yts(input);
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
    }

    const hit = cache.get(videoId);
    if (hit) {
      res.setHeader("Cache-Control", "public, max-age=90");
      res.json({ ...hit, ApiCount, ms: Date.now() - t0 });
      return;
    }

    const dl = await ytdown(youtubeUrl);
    const dlData = (dl?.status ? dl.data : null) ?? null;

    const mp4Url = dlData?.video ?? dlData?.high ?? null;
    const mp3Url = dlData?.audio ?? dlData?.low ?? null;

    const payload: Omit<V2Response, "ms" | "ApiCount"> = {
      credit: "MJL",
      version: VERSION,
      media: {
        mp4: mp4Url ?? null,
        mp3: mp3Url ?? null,
      },
    };

    cache.set(videoId, payload);
    res.setHeader("Cache-Control", "public, max-age=90");
    res.json({ ...payload, ApiCount, ms: Date.now() - t0 });
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
