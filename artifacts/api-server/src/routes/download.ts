import { Router, type IRouter, type Request, type Response } from "express";
import { createRequire } from "module";
import yts from "yt-search";
import { TtlCache } from "../lib/cache";
import { VERSION } from "../lib/version";
import { increment, recordSuccess, recordError } from "../lib/counter";
import { inferCategory } from "../lib/category";
import { dedup, withTimeout } from "../lib/dedup";

const _require = createRequire(import.meta.url);
const { ytdown } = _require("nayan-media-downloaders") as typeof import("nayan-media-downloaders");

const router: IRouter = Router();

interface VideoResponse {
  version: string;
  success: true;
  creditTo: "MJL";
  ApiCount: number;
  cached: boolean;
  ms: number;
  video_id: string;
  url: string;
  category: string;
  info: Record<string, unknown>;
  media: {
    mp4: { url: string; quality: "HD" } | null;
    mp3: { url: string } | null;
  };
}

const cache = new TtlCache<Omit<VideoResponse, "ms" | "cached" | "ApiCount">>(90_000);

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

router.get("/v1/q", async (req: Request, res: Response) => {
  const t0 = Date.now();
  const ApiCount = await increment();
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) recordSuccess();
    else recordError();
  });

  const query = req.query[""] as string | undefined;

  if (!query || !query.trim()) {
    res.status(400).json({
      version: VERSION,
      success: false,
      creditTo: "MJL",
      ApiCount,
      ms: Date.now() - t0,
      error: "Missing query.",
      usage: "/api/v1/q?=(YouTube URL or song/video title)",
      examples: [
        "/api/v1/q?=lay me down sam smith",
        "/api/v1/q?=https://youtu.be/dQw4w9WgXcQ",
        "/api/v1/q?=https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      ],
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
          version: VERSION,
          success: false,
          creditTo: "MJL",
          ApiCount,
          ms: Date.now() - t0,
          error: "Could not extract a YouTube video ID from this URL.",
          input,
        });
        return;
      }
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
          query: input,
        });
        return;
      }
      videoId = first.videoId;
      youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }

    const cached = cache.get(videoId);
    if (cached) {
      res.setHeader("Cache-Control", "public, max-age=90");
      res.json({ ...cached, ApiCount, cached: true, ms: Date.now() - t0 });
      return;
    }

    const [infoResult, dlResult] = await Promise.allSettled([
      dedup(`yts-vid:${videoId}`, () => withTimeout(yts({ videoId }), 15_000, "yt-search-id")),
      dedup(`ytdown:${videoId}`, () => withTimeout(ytdown(youtubeUrl), 20_000, "ytdown")),
    ]);

    const info = infoResult.status === "fulfilled" ? infoResult.value : null;
    const dl = dlResult.status === "fulfilled" ? dlResult.value : null;
    const dlData = (dl?.status ? dl.data : null) ?? null;

    const { name: authorName, url: channelUrl } = resolveAuthor(info?.author);
    const thumbnail = resolveThumbnail(videoId, info, dlData?.thumbnail);
    const category = inferCategory(
      info?.keywords ?? [],
      info?.title ?? dlData?.title ?? "",
      info?.description ?? "",
    );

    const rawInfo: Record<string, unknown> = {
      title:            info?.title ?? dlData?.title ?? null,
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

    const mp4Url = dlData?.video ?? dlData?.high ?? null;
    const mp3Url = dlData?.audio ?? dlData?.low ?? null;

    const payload: Omit<VideoResponse, "ms" | "cached" | "ApiCount"> = {
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

    cache.set(videoId, payload);
    res.setHeader("Cache-Control", "public, max-age=90");
    res.json({ ...payload, ApiCount, cached: false, ms: Date.now() - t0 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    req.log.error({ err, input }, "YouTube download error");
    res.status(500).json({
      version: VERSION,
      success: false,
      creditTo: "MJL",
      ApiCount,
      ms: Date.now() - t0,
      error: message,
      input,
    });
  }
});

export default router;
