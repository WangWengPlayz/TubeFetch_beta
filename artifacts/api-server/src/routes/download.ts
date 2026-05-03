import { Router, type IRouter, type Request, type Response } from "express";
import { createRequire } from "module";
import yts from "yt-search";
import { TtlCache } from "../lib/cache";

const _require = createRequire(import.meta.url);
const { ytdown } = _require("nayan-media-downloaders") as typeof import("nayan-media-downloaders");

const router: IRouter = Router();

// Cache full responses for 90 seconds (safe for expiring download links)
interface CachedResponse {
  success: true;
  creditTo: "MJL";
  cached: boolean;
  video_id: string;
  url: string;
  info: {
    title: string | null;
    author: string | null;
    channel_url: string | null;
    thumbnail: string | null;
    duration: string | null;
    duration_seconds: number | null;
    views: number | null;
    likes: number | null;
    published: string | null;
    description: string | null;
    keywords: string[];
  };
  media: {
    mp4: { url: string; quality: "HD" } | null;
    mp3: { url: string } | null;
  };
}

const cache = new TtlCache<CachedResponse>(90_000);

const YT_URL_RE = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

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

router.get("/v1/q", async (req: Request, res: Response) => {
  const query = req.query[""] as string | undefined;

  if (!query || !query.trim()) {
    res.status(400).json({
      success: false,
      creditTo: "MJL",
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
    let prefetchedInfo: yts.VideoResult | null = null;

    // --- Step 1: Resolve to a video ID (and grab info early if title search) ---
    if (isUrl(input)) {
      videoId = extractVideoId(input);
      if (!videoId) {
        res.status(400).json({
          success: false,
          creditTo: "MJL",
          error: "Could not extract a YouTube video ID from this URL. Make sure it's a valid YouTube link.",
          input,
        });
        return;
      }
      youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else {
      // Title / keyword search — the search result already carries full metadata,
      // so we reuse it directly and skip the extra yts({ videoId }) call.
      const searchResult = await yts(input);
      const first = searchResult.videos[0];
      if (!first) {
        res.status(404).json({
          success: false,
          creditTo: "MJL",
          error: "No YouTube results found for this query.",
          query: input,
        });
        return;
      }
      videoId = first.videoId;
      youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      prefetchedInfo = first; // reuse — no second yts call needed
    }

    // --- Cache hit? Return immediately ---
    const cached = cache.get(videoId);
    if (cached) {
      res.json({ ...cached, cached: true });
      return;
    }

    // --- Step 2: Fetch info + download links (parallel where possible) ---
    let info: yts.VideoResult | null = prefetchedInfo;
    let dlData: import("nayan-media-downloaders").YtdownData | null = null;

    if (prefetchedInfo) {
      // Title search: info already known — only need download links
      const dlResult = await ytdown(youtubeUrl).catch(() => null);
      dlData = (dlResult?.status ? dlResult.data : null) ?? null;
    } else {
      // URL search: fetch info + links in parallel
      const [infoResult, dlResult] = await Promise.allSettled([
        yts({ videoId }),
        ytdown(youtubeUrl),
      ]);
      info = infoResult.status === "fulfilled" ? infoResult.value : null;
      const dl = dlResult.status === "fulfilled" ? dlResult.value : null;
      dlData = (dl?.status ? dl.data : null) ?? null;
    }

    const { name: authorName, url: channelUrl } = resolveAuthor(info?.author);

    const response: CachedResponse = {
      success: true,
      creditTo: "MJL",
      cached: false,
      video_id: videoId,
      url: youtubeUrl,
      info: {
        title:            info?.title ?? dlData?.title ?? null,
        author:           authorName,
        channel_url:      channelUrl,
        thumbnail:        info?.thumbnail ?? info?.image ?? null,
        duration:         info?.duration?.timestamp ?? null,
        duration_seconds: info?.duration?.seconds ?? null,
        views:            info?.views ?? null,
        likes:            info?.likes ?? null,
        published:        info?.ago ?? null,
        description:      info?.description ?? null,
        keywords:         info?.keywords ?? [],
      },
      media: {
        mp4: dlData?.video ?? dlData?.high
          ? { url: (dlData?.video ?? dlData?.high)!, quality: "HD" }
          : null,
        mp3: dlData?.audio ?? dlData?.low
          ? { url: (dlData?.audio ?? dlData?.low)! }
          : null,
      },
    };

    cache.set(videoId, response);
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    req.log.error({ err, input }, "YouTube download error");
    res.status(500).json({ success: false, creditTo: "MJL", error: message, input });
  }
});

export default router;
