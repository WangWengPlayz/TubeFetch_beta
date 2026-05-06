import { Router, type IRouter, type Request, type Response } from "express";
import yts from "yt-search";
import { TtlCache } from "../lib/cache";
import { VERSION } from "../lib/version";
import { increment, recordSuccess, recordError } from "../lib/counter";
import { inferCategory } from "../lib/category";
import { dedup, withTimeout } from "../lib/dedup";

const router: IRouter = Router();

interface V3Video {
  rank: number;
  video_id: string;
  url: string;
  title: string;
  description: string | null;
  channel_name: string | null;
  channel_url: string | null;
  published: string | null;
  duration: string | null;
  duration_seconds: number | null;
  thumbnail: string;
  views: number | null;
  category: string;
}

interface V3Response {
  credit: "MJL";
  version: string;
  ApiCount: number;
  ms: number;
  query: string;
  total_results: number;
  results: V3Video[];
}

const cache = new TtlCache<Omit<V3Response, "ms" | "ApiCount">>(90_000);

function resolveAuthor(author: yts.VideoAuthor | string | undefined): {
  name: string | null;
  url: string | null;
} {
  if (!author) return { name: null, url: null };
  if (typeof author === "string") return { name: author, url: null };
  return { name: author.name ?? null, url: author.url ?? null };
}

router.get("/v3/q", async (req: Request, res: Response) => {
  const t0 = Date.now();
  const ApiCount = await increment();
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
      usage: "/api/v3/q?=(search title or keyword)",
      examples: ["/api/v3/q?=top hits 2025", "/api/v3/q?=relaxing music"],
    });
    return;
  }

  const input = query.trim();

  const cached = cache.get(input);
  if (cached) {
    res.setHeader("Cache-Control", "public, max-age=90");
    res.json({ ...cached, ApiCount, ms: Date.now() - t0 });
    return;
  }

  try {
    const searchResult = await dedup(
      `yts:${input}`,
      () => withTimeout(yts(input), 15_000, "yt-search"),
    );
    const videos = searchResult.videos.slice(0, 10);

    const results: V3Video[] = videos.map((v, i) => {
      const { name: channelName, url: channelUrl } = resolveAuthor(v.author);
      const thumbnail =
        v.thumbnail || v.image || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
      const desc = v.description ?? "";
      const category = inferCategory(v.keywords ?? [], v.title ?? "", desc);
      return {
        rank: i + 1,
        video_id: v.videoId,
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
        title: v.title ?? "",
        description: desc || null,
        channel_name: channelName,
        channel_url: channelUrl,
        published: v.ago ?? null,
        duration: v.duration?.timestamp ?? null,
        duration_seconds: v.duration?.seconds ?? null,
        thumbnail,
        views: v.views ?? null,
        category,
      };
    });

    const payload: Omit<V3Response, "ms" | "ApiCount"> = {
      credit: "MJL",
      version: VERSION,
      query: input,
      total_results: results.length,
      results,
    };

    cache.set(input, payload);
    res.setHeader("Cache-Control", "public, max-age=90");
    res.json({ ...payload, ApiCount, ms: Date.now() - t0 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    req.log.error({ err, input }, "v3 search error");
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
