import { createRequire } from "module";
import { resolve } from "path";
import { withTimeout } from "./dedup";

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
  new (): YtDlpInstance;
}

const QUALITIES = ["1080p", "720p", "480p", "360p"] as const;
type QualityKey = (typeof QUALITIES)[number];
export type QualityMap = Partial<Record<QualityKey | "mp3", string>>;

export interface DownloadLinks {
  mp4: string | null;
  mp3: string | null;
  thumbnail: string | null;
  title: string | null;
  qualities: QualityMap;
  server: 1;
}

// Standalone yt-dlp binary path (doesn't require Python)
const YTDLP_BIN = resolve(process.cwd(), "bin", "yt-dlp");

let _ytDlp: YtDlpInstance | null = null;
function getYtDlp(): YtDlpInstance {
  if (!_ytDlp) {
    const { YtDlp } = _require("ytdlp-nodejs") as { YtDlp: YtDlpConstructor };
    const instance = new YtDlp() as YtDlpInstance & { binaryPath?: string };
    instance.binaryPath = YTDLP_BIN;
    _ytDlp = instance;
  }
  return _ytDlp;
}

const QUALITY_HEIGHTS: Record<QualityKey, number> = {
  "1080p": 1080,
  "720p": 720,
  "480p": 480,
  "360p": 360,
};

function proxyUrl(baseUrl: string, rawUrl: string, ext: string): string {
  return `${baseUrl}/api/proxy?url=${encodeURIComponent(rawUrl)}&ext=${encodeURIComponent(ext)}`;
}

function mergeUrl(baseUrl: string, videoRaw: string, audioRaw: string): string {
  return `${baseUrl}/api/merge?v=${encodeURIComponent(videoRaw)}&a=${encodeURIComponent(audioRaw)}`;
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

    const formats: YtFormat[] = (metadata.formats ?? []).filter(
      (f) => f.url && f.url.length > 0,
    );

    // ── Best audio-only stream (m4a preferred, then highest-bitrate) ──────────
    const audioOnly = formats.filter(
      (f) => f.acodec !== "none" && (f.vcodec === "none" || !f.vcodec),
    );
    const bestAudio =
      audioOnly.find((f) => f.ext === "m4a") ??
      [...audioOnly].sort((a, b) => (b.abr ?? b.tbr ?? 0) - (a.abr ?? a.tbr ?? 0))[0] ??
      null;

    const qualities: QualityMap = {};

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
        );
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
        qualities[qualityLabel] = mergeUrl(baseUrl, videoOnly.url, bestAudio.url);
      }
    }

    // ── MP3 — best audio only ─────────────────────────────────────────────────
    if (bestAudio?.url) {
      qualities["mp3"] = proxyUrl(baseUrl, bestAudio.url, bestAudio.ext ?? "m4a");
    }

    // ── Best mp4: highest available quality ───────────────────────────────────
    const bestMp4 =
      qualities["1080p"] ??
      qualities["720p"] ??
      qualities["480p"] ??
      qualities["360p"] ??
      null;
    const bestMp3 = qualities["mp3"] ?? null;

    return {
      mp4: bestMp4,
      mp3: bestMp3,
      thumbnail: metadata.thumbnail ?? null,
      title: metadata.title ?? null,
      qualities,
      server: 1,
    };
  } catch {
    return {
      mp4: null,
      mp3: null,
      thumbnail: null,
      title: null,
      qualities: {},
      server: 1,
    };
  }
}
