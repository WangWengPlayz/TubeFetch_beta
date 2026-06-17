import { createRequire } from "module";
import { withTimeout } from "./dedup";

const _require = createRequire(import.meta.url);

export interface DownloadLinks {
  mp4: string | null;
  mp3: string | null;
  thumbnail: string | null;
  title: string | null;
  server: 1;
}

/**
 * Fetch MP4 + audio download links using Server 1.
 *
 * Server 1 — btch-downloader
 *   Routes through an external conversion relay. Returns title, thumbnail,
 *   mp4, and mp3 in a single call. Fast and reliable for most videos.
 *   Timeout: 20 s.
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
  } catch { /* fall through */ }

  return { mp4: null, mp3: null, thumbnail: null, title: null, server: 1 };
}
