import { Router, type IRouter, type Request, type Response } from "express";
import yts from "yt-search";
import { TtlCache } from "../lib/cache";
import { VERSION } from "../lib/version";
import { increment, recordSuccess, recordError } from "../lib/counter";
import { inferCategory } from "../lib/category";
import { dedup, withTimeout } from "../lib/dedup";
import { validateQuery, sanitizeError } from "../lib/validate";
import { downloadRateLimit } from "../middleware/rate-limit";

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

interface V3Payload {
  credit: "MJL";
  version: string;
  total_results: number;
  results: V3Video[];
  // Note: "query" field intentionally omitted from the cached payload to avoid
  // storing user-supplied strings inside shared cache entries. It is injected
  // at response time from the validated input.
}

interface V3Response extends V3Payload {
  query: string;
  ApiCount: number;
  ms: number;
}

// Fresh 5 min, stale-served up to 20 min (SWR), max 500 entries.
const cache = new TtlCache<V3Payload>(300_000, 1_200_000, 500);

function resolveAuthor(author: yts.VideoAuthor | string | undefined): {
  name: string | null;
  url: string | null;
} {
  if (!author) return { name: null, url: null };
  if (typeof author === "string") return { name: author, url: null };
  return { name: author.name ?? null, url: author.url ?? null };
}

async function fetchPayload(input: string): Promise<V3Payload> {
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

  return {
    credit: "MJL",
    version: VERSION,
    total_results: results.length,
    results,
  };
}

router.get("/v3/q", downloadRateLimit, async (req: Request, res: Response) => {
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
      usage: "/api/v3/q?=(search title or keyword)",
      examples: ["/api/v3/q?=top hits 2025", "/api/v3/q?=relaxing music"],
    });
    return;
  }

  const input = validation.value;

  const hit = cache.getWithMeta(input);
  if (hit) {
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ ...hit.value, query: input, ApiCount, ms: Date.now() - t0 } satisfies V3Response);
    if (hit.stale) {
      setImmediate(() => {
        dedup(`swr-v3:${input}`, () => fetchPayload(input))
          .then(payload => cache.set(input, payload))
          .catch(() => {});
      });
    }
    return;
  }

  try {
    const payload = await dedup(`fetch-v3:${input}`, () => fetchPayload(input));
    cache.set(input, payload);
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ ...payload, query: input, ApiCount, ms: Date.now() - t0 } satisfies V3Response);
  } catch (err: unknown) {
    req.log.error({ err, input }, "v3 search error");
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
