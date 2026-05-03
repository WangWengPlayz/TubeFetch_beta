import { Router, type IRouter, type Request, type Response } from "express";
import { createRequire } from "module";
import yts from "yt-search";

const _require = createRequire(import.meta.url);
const { ytdown } = _require("nayan-media-downloaders") as typeof import("nayan-media-downloaders");

const router: IRouter = Router();

const YT_URL_RE = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

function extractVideoId(input: string): string | null {
  const m = input.match(YT_URL_RE);
  return m ? m[1] : null;
}

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input);
}

router.get("/v1/q", async (req: Request, res: Response) => {
  const query = req.query[""] as string | undefined;

  if (!query || !query.trim()) {
    res.status(400).json({
      success: false,
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

    // --- Step 1: Resolve to a YouTube video ID ---
    if (isUrl(input)) {
      videoId = extractVideoId(input);
      if (!videoId) {
        res.status(400).json({
          success: false,
          error: "Could not extract a YouTube video ID from this URL. Make sure it's a valid YouTube link.",
          input,
        });
        return;
      }
      youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else {
      // Title / keyword search — find the best matching video
      const searchResult = await yts(input);
      const first = searchResult.videos[0];
      if (!first) {
        res.status(404).json({ success: false, error: "No YouTube results found for this query.", query: input });
        return;
      }
      videoId = first.videoId;
      youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }

    // --- Step 2: Fetch rich info + download links in parallel ---
    const [infoResult, dlResult] = await Promise.allSettled([
      yts({ videoId }),
      ytdown(youtubeUrl),
    ]);

    const info = infoResult.status === "fulfilled" ? infoResult.value : null;
    const dl   = dlResult.status === "fulfilled"   ? dlResult.value   : null;

    // Resolve author name (yt-search returns string or object)
    const authorName =
      info && "author" in info
        ? typeof info.author === "string"
          ? info.author
          : (info.author as { name?: string }).name ?? null
        : null;

    const dlData = dl?.status ? dl.data : null;

    res.json({
      success: true,
      video_id: videoId,
      url: youtubeUrl,
      info: {
        title:       info ? (info as { title?: string }).title ?? null       : dlData?.title ?? null,
        author:      authorName,
        thumbnail:   info ? (info as { thumbnail?: string }).thumbnail ?? null : null,
        duration:    info ? (info as { duration?: { timestamp?: string } }).duration?.timestamp ?? null : null,
        views:       info ? (info as { views?: number }).views ?? null       : null,
        published:   info ? (info as { ago?: string }).ago ?? null           : null,
        description: info ? (info as { description?: string }).description ?? null : null,
      },
      media: {
        mp4: dlData?.video ?? dlData?.high
          ? { url: dlData.video ?? dlData.high, quality: "HD" }
          : null,
        mp3: dlData?.audio ?? dlData?.low
          ? { url: dlData.audio ?? dlData.low }
          : null,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    req.log.error({ err, input }, "YouTube download error");
    res.status(500).json({ success: false, error: message, input });
  }
});

export default router;
