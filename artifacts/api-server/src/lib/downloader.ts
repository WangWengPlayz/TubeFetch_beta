import ytdl from "@distube/ytdl-core";
import { createRequire } from "module";
import { withTimeout } from "./dedup";

const _require = createRequire(import.meta.url);

export interface DownloadLinks {
  mp4: string | null;
  mp3: string | null;
  thumbnail: string | null;
}

/**
 * Fetch MP4 + audio download links using a two-source fallback chain.
 *
 * Source 1 — @distube/ytdl-core (primary)
 *   Extracts URLs directly from YouTube's own CDN. No third-party relay.
 *   More private and reliable when it works, but YouTube's bot detection on
 *   cloud server IPs can cause it to fail on some videos.
 *   Timeout: 12 s.
 *
 * Source 2 — nayan-media-downloaders (fallback)
 *   Routes through ymcdn.org, a third-party conversion service.
 *   Works on virtually all videos but depends on an external service being up.
 *   Timeout: 20 s.
 *
 * Result: the API remains functional even when either source is down.
 */
export async function fetchDownloadLinks(youtubeUrl: string): Promise<DownloadLinks> {

  // ── Source 1: @distube/ytdl-core ─────────────────────────────────────────
  try {
    const info = await withTimeout(
      ytdl.getInfo(youtubeUrl),
      12_000,
      "ytdl-getInfo",
    );

    let mp4: string | null = null;
    let mp3: string | null = null;

    // Best combined format (video + audio in one file)
    try {
      const fmt = ytdl.chooseFormat(info.formats, {
        quality: "highestvideo",
        filter: "audioandvideo",
      });
      if (fmt?.url) mp4 = fmt.url;
    } catch { /* format may not exist — handled below */ }

    // Best audio-only format
    try {
      const fmt = ytdl.chooseFormat(info.formats, {
        quality: "highestaudio",
        filter: "audioonly",
      });
      if (fmt?.url) mp3 = fmt.url;
    } catch { /* format may not exist — handled below */ }

    // Only declare success if both URLs were resolved — partial results
    // (e.g. mp4 without mp3) fall through to nayan which always provides both.
    if (mp4 && mp3) {
      const thumbs = info.videoDetails.thumbnails ?? [];
      const thumbnail =
        thumbs.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? null;
      return { mp4, mp3, thumbnail };
    }
  } catch { /* fall through to source 2 */ }

  // ── Source 2: nayan-media-downloaders ────────────────────────────────────
  // Wrapped in its own try-catch — the upstream ymcdn.org relay can return
  // unexpected shapes that cause the library to throw internally (e.g.
  // "Cannot read properties of undefined (reading '0')"). We recover
  // gracefully with null links rather than propagating a 500 to the caller.
  try {
    const { ytdown } = _require("nayan-media-downloaders") as typeof import("nayan-media-downloaders");
    const dl = await withTimeout(ytdown(youtubeUrl), 20_000, "ytdown");
    const data = (dl?.status ? dl.data : null) ?? null;

    return {
      mp4: data?.video_hd ?? data?.video ?? data?.high ?? null,
      mp3: data?.audio ?? data?.low ?? null,
      // nayan returns the thumbnail as "thumb" in practice despite the type
      thumbnail: data?.thumbnail ?? data?.thumb ?? null,
    };
  } catch {
    return { mp4: null, mp3: null, thumbnail: null };
  }
}
