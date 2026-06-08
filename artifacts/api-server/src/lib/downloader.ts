import { createRequire } from "module";
import { withTimeout } from "./dedup";

const _require = createRequire(import.meta.url);

export interface DownloadLinks {
  mp4: string | null;
  mp3: string | null;
  thumbnail: string | null;
  title: string | null;
  server: 1 | 2;
}

/**
 * Fetch MP4 + audio download links using a two-server fallback chain.
 *
 * Server 1 — btch-downloader (primary)
 *   Routes through an external conversion relay. Returns title, thumbnail,
 *   mp4, and mp3 in a single call. Fast and reliable for most videos.
 *   Timeout: 20 s.
 *
 * Server 2 — nayan-media-downloaders (fallback)
 *   Routes through ymcdn.org. Used automatically when Server 1 fails.
 *   Timeout: 20 s.
 *
 * Result: the API remains functional even when either source is down.
 */
export async function fetchDownloadLinks(youtubeUrl: string): Promise<DownloadLinks> {

  // ── Server 1: btch-downloader ─────────────────────────────────────────────
  try {
    const { youtube } = _require("btch-downloader") as {
      youtube: (url: string) => Promise<{
        status: boolean;
        title?: string;
        author?: string;
        thumbnail?: string;
        mp3?: string;
        mp4?: string;
      }>;
    };

    const data = await withTimeout(youtube(youtubeUrl), 20_000, "btch-youtube");

    if (data?.status && (data.mp4 || data.mp3)) {
      return {
        mp4: data.mp4 ?? null,
        mp3: data.mp3 ?? null,
        thumbnail: data.thumbnail ?? null,
        title: data.title ?? null,
        server: 1,
      };
    }
  } catch { /* fall through to Server 2 */ }

  // ── Server 2: nayan-media-downloaders ─────────────────────────────────────
  // Wrapped in its own try-catch — the upstream ymcdn.org relay can return
  // unexpected shapes that cause the library to throw internally.
  // We recover gracefully with null links rather than propagating a 500.
  try {
    const { ytdown } = _require("nayan-media-downloaders") as typeof import("nayan-media-downloaders");
    const dl = await withTimeout(ytdown(youtubeUrl), 20_000, "ytdown");
    const data = (dl?.status ? dl.data : null) ?? null;

    return {
      mp4: data?.video_hd ?? data?.video ?? data?.high ?? null,
      mp3: data?.audio ?? data?.low ?? null,
      thumbnail: data?.thumbnail ?? data?.thumb ?? null,
      title: null,
      server: 2,
    };
  } catch {
    return { mp4: null, mp3: null, thumbnail: null, title: null, server: 2 };
  }
}
