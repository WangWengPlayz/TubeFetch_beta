import { Router, type IRouter, type Request, type Response } from "express";
import { spawn } from "child_process";

const router: IRouter = Router();

const ALLOWED_HOST = /^[a-z0-9-]+\.googlevideo\.com$/;

function isAllowedUrl(raw: string): boolean {
  try {
    return ALLOWED_HOST.test(new URL(raw).hostname);
  } catch {
    return false;
  }
}

function sanitizeFilename(raw: string): string {
  return raw
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200) || "video";
}

const YT_HEADERS =
  "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n" +
  "Referer: https://www.youtube.com/\r\n" +
  "Origin: https://www.youtube.com\r\n";

router.get("/merge", (req: Request, res: Response) => {
  const videoUrl = typeof req.query.v === "string" ? req.query.v : "";
  const audioUrl = typeof req.query.a === "string" ? req.query.a : "";
  const rawTitle = typeof req.query.title === "string" ? req.query.title : "";
  const durParam = typeof req.query.dur === "string" ? parseFloat(req.query.dur) : NaN;

  if (!videoUrl || !audioUrl) {
    res.status(400).json({ error: "Missing v or a parameter." });
    return;
  }

  if (!isAllowedUrl(videoUrl) || !isAllowedUrl(audioUrl)) {
    res.status(403).json({ error: "Host not permitted." });
    return;
  }

  const filename = rawTitle
    ? `${sanitizeFilename(rawTitle)}.mp4`
    : "video.mp4";

  res.setHeader("Content-Type", "video/mp4");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  );
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Build ffmpeg args — include duration hint when available so the
  // fragmented MP4 moov declares the correct length instead of "?"
  const ffmpegArgs: string[] = [
    "-headers", YT_HEADERS,
    "-i", videoUrl,
    "-headers", YT_HEADERS,
    "-i", audioUrl,
    "-c:v", "copy",
    "-c:a", "aac",
  ];

  if (!isNaN(durParam) && durParam > 0) {
    ffmpegArgs.push("-t", String(Math.ceil(durParam)));
  }

  ffmpegArgs.push(
    "-movflags", "frag_keyframe+empty_moov+faststart",
    "-f", "mp4",
    "pipe:1",
  );

  const ffmpeg = spawn("ffmpeg", ffmpegArgs);

  ffmpeg.stdout.pipe(res);
  ffmpeg.stderr.on("data", () => {});
  ffmpeg.on("error", () => {
    if (!res.headersSent) res.status(500).end();
  });
  ffmpeg.on("close", () => {});

  req.on("close", () => ffmpeg.kill("SIGKILL"));
});

export default router;
