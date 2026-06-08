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

const LIMIT_MIN = 1;
const LIMIT_MAX = 20;
const LIMIT_DEFAULT = 10;

interface V3Video {
  rank: number;
  video_id: string;
  url: string;
  short_url: string;
  title: string;
  description: string | null;
  channel_name: string | null;
  channel_url: string | null;
  published: string | null;
  duration: string | null;
  duration_seconds: number | null;
  thumbnail: string;
  views: number | null;
  keywords: string[];
  category: string;
}

// Cache stores up to LIMIT_MAX results — limit is sliced at response time
// so a single cache entry serves any limit without a refetch.
interface V3Payload {
  credit: "MJL";
  version: string;
  results: V3Video[];
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
    `yts-v3:${input}`,
    () => withTimeout(yts({ query: input, pages: 2 }), 20_000, "yt-search"),
  );

  // Always fetch up to LIMIT_MAX so the cache can serve any requested limit.
  // Using pages:2 ensures enough raw results to fill 20 video slots.
  const videos = searchResult.videos.slice(0, LIMIT_MAX);

  const results: V3Video[] = videos.map((v, i) => {
    const { name: channelName, url: channelUrl } = resolveAuthor(v.author);
    const thumbnail =
      v.thumbnail || v.image || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
    const desc = v.description ?? "";
    const keywords = v.keywords ?? [];
    const category = inferCategory(keywords, v.title ?? "", desc);
    return {
      rank: i + 1,
      video_id: v.videoId,
      url: `https://www.youtube.com/watch?v=${v.videoId}`,
      short_url: `https://youtu.be/${v.videoId}`,
      title: v.title ?? "",
      description: desc || null,
      channel_name: channelName,
      channel_url: channelUrl,
      published: v.ago ?? null,
      duration: v.duration?.timestamp ?? null,
      duration_seconds: v.duration?.seconds ?? null,
      thumbnail,
      views: v.views ?? null,
      keywords,
      category,
    };
  });

  return { credit: "MJL", version: VERSION, results };
}

router.get("/v3/q", downloadRateLimit, async (req: Request, res: Response) => {
  const t0 = Date.now();

  // ── Validate search query ─────────────────────────────────────────────────
  const validation = validateQuery(req.query[""]);
  if (!validation.ok) {
    const ApiCount = increment();
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 400) recordSuccess();
      else recordError();
    });
    res.status(400).json({
      credit: "MJL",
      version: VERSION,
      ApiCount,
      ms: Date.now() - t0,
      error: validation.reason,
      usage: "/api/v3/q?=QUERY or /api/v3/q?=QUERY&?=LIMIT",
      examples: [
        "/api/v3/q?=top hits 2025",
        "/api/v3/q?=relaxing music&?=20",
        "/api/v3/q?=taylor swift&?=5",
      ],
    });
    return;
  }

  const input = validation.value;

  // ── v3 is search-only — URLs are not accepted and do not count ────────────
  if (/^https?:\/\//i.test(input)) {
    res.status(400).json({
      credit: "MJL",
      version: VERSION,
      ms: Date.now() - t0,
      error: "v3 only accepts search titles or keywords, not URLs. Use /api/v1/q or /api/v2/q for URL-based lookups.",
      usage: "/api/v3/q?=QUERY or /api/v3/q?=QUERY&?=LIMIT",
      examples: ["/api/v3/q?=top hits 2025", "/api/v3/q?=relaxing music&?=20"],
    });
    return;
  }

  // ── Parse optional limit param (?=QUERY&?=LIMIT) ──────────────────────────
  let limit = LIMIT_DEFAULT;
  const rawLimit = req.query["?"];
  if (rawLimit !== undefined) {
    const parsed = parseInt(String(rawLimit), 10);
    if (!Number.isNaN(parsed) && parsed > LIMIT_MAX) {
      res.status(400).json({
        credit: "MJL",
        version: VERSION,
        ms: Date.now() - t0,
        error: `Search limit exceeded — the maximum is ${LIMIT_MAX} results per request.`,
        tip: `Set the limit to ${LIMIT_MAX} or lower, e.g. /api/v3/q?=QUERY&?=${LIMIT_MAX}`,
      });
      return;
    }
    if (Number.isNaN(parsed) || parsed < LIMIT_MIN) {
      res.status(400).json({
        credit: "MJL",
        version: VERSION,
        ms: Date.now() - t0,
        error: `Limit must be a whole number between ${LIMIT_MIN} and ${LIMIT_MAX}.`,
        usage: "/api/v3/q?=QUERY&?=LIMIT",
        examples: [
          "/api/v3/q?=lofi hip hop&?=5",
          "/api/v3/q?=lofi hip hop&?=20",
        ],
      });
      return;
    }
    limit = parsed;
  }

  // ── Count only real, processable requests ─────────────────────────────────
  const ApiCount = increment();
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) recordSuccess();
    else recordError();
  });

  // ── Cache lookup — limit applied at slice time, not stored in cache ───────
  const hit = cache.getWithMeta(input);
  if (hit) {
    const sliced = hit.value.results.slice(0, limit);
    res.setHeader("Cache-Control", "private, no-store");
    res.json({
      ...hit.value,
      query: input,
      limit,
      total_results: sliced.length,
      results: sliced,
      cached: true,
      ApiCount,
      ms: Date.now() - t0,
    });
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
    const sliced = payload.results.slice(0, limit);
    res.setHeader("Cache-Control", "private, no-store");
    res.json({
      ...payload,
      query: input,
      limit,
      total_results: sliced.length,
      results: sliced,
      cached: false,
      ApiCount,
      ms: Date.now() - t0,
    });
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
