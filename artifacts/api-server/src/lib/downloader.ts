import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { withTimeout } from "./dedup";
import { storeUrl } from "./url-store";

const _require = createRequire(import.meta.url);

interface YtFormat {
  url?: string;
  ext?: string;
  vcodec?: string;
  acodec?: string;
  format_note?: string;
  height?: number;
  tbr?: number;
  abr?: number;
}

interface YtMetadata {
  title?: string;
  thumbnail?: string;
  duration?: number;
  formats?: YtFormat[];
}

interface YtDlpInstance {
  getInfoAsync(url: string): Promise<YtMetadata>;
}

interface YtDlpConstructor {
  new (options?: { binaryPath?: string }): YtDlpInstance;
}

const QUALITIES = ["1080p", "720p", "480p", "360p"] as const;
type QualityKey = (typeof QUALITIES)[number];
export type QualityMap = Partial<Record<QualityKey | "mp3", string>>;

export interface StreamInfo {
  quality: string;
  ext: string;
  has_video: boolean;
  has_audio: boolean;
  is_combined: boolean;
  url: string;
}

export interface DownloadLinks {
  mp4: string | null;
  mp3: string | null;
  thumbnail: string | null;
  title: string | null;
  duration_seconds: number | null;
  qualities: QualityMap;
  /** Preview-safe URL — a combined (video+audio) proxy stream, suitable for
   *  an HTML5 <video> element. Null when no combined stream is available. */
  preview_url: string | null;
  streams: StreamInfo[];
  server: 1;
}

// Resolve binary path relative to the compiled output file so it works
// regardless of which directory the process is started from.
const _distDir = dirname(fileURLToPath(import.meta.url));
const YTDLP_BIN = resolve(_distDir, "..", "bin", "yt-dlp");

let _ytDlp: YtDlpInstance | null = null;
function getYtDlp(): YtDlpInstance {
  if (!_ytDlp) {
    const { YtDlp } = _require("ytdlp-nodejs") as { YtDlp: YtDlpConstructor };
    _ytDlp = new YtDlp({ binaryPath: YTDLP_BIN });
  }
  return _ytDlp;
}

const QUALITY_HEIGHTS: Record<QualityKey, number> = {
  "1080p": 1080,
  "720p": 720,
  "480p": 480,
  "360p": 360,
};

function proxyUrl(
  baseUrl: string,
  rawUrl: string,
  ext: string,
  title: string | null,
): string {
  const token = storeUrl({ type: "proxy", url: rawUrl, ext, title });
  return `${baseUrl}/api/dl/${token}`;
}

function mergeUrl(
  baseUrl: string,
  videoRaw: string,
  audioRaw: string,
  title: string | null,
  durationSeconds: number | null,
): string {
  const token = storeUrl({
    type: "merge",
    v: videoRaw,
    a: audioRaw,
    title,
    dur: durationSeconds != null && durationSeconds > 0 ? Math.ceil(durationSeconds) : null,
  });
  return `${baseUrl}/api/dl/${token}`;
}

export async function fetchDownloadLinks(
  youtubeUrl: string,
  baseUrl: string,
): Promise<DownloadLinks> {
  try {
    const ytDlp = getYtDlp();
    const metadata = await withTimeout(
      ytDlp.getInfoAsync(youtubeUrl),
      30_000,
      "ytdlp-getInfo",
    );

    const title = metadata.title ?? null;
    const durationSeconds = metadata.duration ?? null;

    const formats: YtFormat[] = (metadata.formats ?? []).filter(
      (f) => f.url && f.url.length > 0,
    );

    // ── Best audio-only stream (m4a preferred, then highest-bitrate) ─────────
    const audioOnly = formats.filter(
      (f) => f.acodec !== "none" && (f.vcodec === "none" || !f.vcodec),
    );
    const bestAudio =
      audioOnly.find((f) => f.ext === "m4a") ??
      [...audioOnly].sort((a, b) => (b.abr ?? b.tbr ?? 0) - (a.abr ?? a.tbr ?? 0))[0] ??
      null;

    const qualities: QualityMap = {};
    // Track which qualities are combined (proxy) vs merged (ffmpeg)
    const combinedFlags: Partial<Record<QualityKey | "mp3", boolean>> = {};

    for (const qualityLabel of QUALITIES) {
      const targetHeight = QUALITY_HEIGHTS[qualityLabel];

      // 1. Combined stream (video + audio together)
      const combined =
        formats.find(
          (f) =>
            f.vcodec !== "none" &&
            f.acodec !== "none" &&
            f.height === targetHeight &&
            f.ext === "mp4",
        ) ??
        formats.find(
          (f) =>
            f.vcodec !== "none" &&
            f.acodec !== "none" &&
            (f.format_note === qualityLabel || f.height === targetHeight),
        );

      if (combined?.url) {
        qualities[qualityLabel] = proxyUrl(
          baseUrl,
          combined.url,
          combined.ext ?? "mp4",
          title,
        );
        combinedFlags[qualityLabel] = true;
        continue;
      }

      // 2. Video-only + merge with best audio
      const videoOnly =
        formats.find(
          (f) =>
            f.vcodec !== "none" &&
            (f.acodec === "none" || !f.acodec) &&
            f.height === targetHeight &&
            f.ext === "mp4",
        ) ??
        formats.find(
          (f) =>
            f.vcodec !== "none" &&
            (f.acodec === "none" || !f.acodec) &&
            (f.format_note === qualityLabel || f.height === targetHeight),
        );

      if (videoOnly?.url && bestAudio?.url) {
        qualities[qualityLabel] = mergeUrl(
          baseUrl,
          videoOnly.url,
          bestAudio.url,
          title,
          durationSeconds,
        );
        combinedFlags[qualityLabel] = false;
      }
    }

    // ── MP3 — best audio only ────────────────────────────────────────────────
    if (bestAudio?.url) {
      qualities["mp3"] = proxyUrl(baseUrl, bestAudio.url, bestAudio.ext ?? "m4a", title);
      combinedFlags["mp3"] = true;
    }

    // ── Best mp4: highest available quality ──────────────────────────────────
    const bestMp4 =
      qualities["1080p"] ??
      qualities["720p"] ??
      qualities["480p"] ??
      qualities["360p"] ??
      null;
    const bestMp3 = qualities["mp3"] ?? null;

    // ── Preview URL: best combined (proxy) stream for HTML5 <video> ──────────
    // Prefer lower quality for faster preview loading
    const previewUrl =
      (combinedFlags["360p"] ? qualities["360p"] : null) ??
      (combinedFlags["480p"] ? qualities["480p"] : null) ??
      (combinedFlags["720p"] ? qualities["720p"] : null) ??
      (combinedFlags["1080p"] ? qualities["1080p"] : null) ??
      null;

    // ── Streams array (inspired by Global_TubeFetch_Server) ──────────────────
    const streams: StreamInfo[] = [];
    for (const q of QUALITIES) {
      if (qualities[q]) {
        streams.push({
          quality: q,
          ext: "mp4",
          has_video: true,
          has_audio: combinedFlags[q] ?? false,
          is_combined: combinedFlags[q] ?? false,
          url: qualities[q]!,
        });
      }
    }
    if (qualities["mp3"]) {
      streams.push({
        quality: "audio",
        ext: bestAudio?.ext ?? "m4a",
        has_video: false,
        has_audio: true,
        is_combined: true,
        url: qualities["mp3"]!,
      });
    }

    return {
      mp4: bestMp4,
      mp3: bestMp3,
      thumbnail: metadata.thumbnail ?? null,
      title,
      duration_seconds: durationSeconds,
      qualities,
      preview_url: previewUrl,
      streams,
      server: 1,
    };
  } catch {
    return {
      mp4: null,
      mp3: null,
      thumbnail: null,
      title: null,
      duration_seconds: null,
      qualities: {},
      preview_url: null,
      streams: [],
      server: 1,
    };
  }
}
