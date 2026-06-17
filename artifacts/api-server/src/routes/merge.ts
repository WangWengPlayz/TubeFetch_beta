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

const YT_HEADERS =
  "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n" +
  "Referer: https://www.youtube.com/\r\n" +
  "Origin: https://www.youtube.com\r\n";

router.get("/merge", (req: Request, res: Response) => {
  const videoUrl = typeof req.query.v === "string" ? req.query.v : "";
  const audioUrl = typeof req.query.a === "string" ? req.query.a : "";

  if (!videoUrl || !audioUrl) {
    res.status(400).json({ error: "Missing v or a parameter." });
    return;
  }

  if (!isAllowedUrl(videoUrl) || !isAllowedUrl(audioUrl)) {
    res.status(403).json({ error: "Host not permitted." });
    return;
  }

  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Disposition", 'inline; filename="video.mp4"');
  res.setHeader("Access-Control-Allow-Origin", "*");

  const ffmpeg = spawn("ffmpeg", [
    "-headers", YT_HEADERS,
    "-i", videoUrl,
    "-headers", YT_HEADERS,
    "-i", audioUrl,
    "-c:v", "copy",
    "-c:a", "aac",
    "-movflags", "frag_keyframe+empty_moov+faststart",
    "-f", "mp4",
    "pipe:1",
  ]);

  ffmpeg.stdout.pipe(res);
  ffmpeg.stderr.on("data", () => {});
  ffmpeg.on("error", () => {
    if (!res.headersSent) res.status(500).end();
  });
  ffmpeg.on("close", () => {});

  req.on("close", () => ffmpeg.kill("SIGKILL"));
});

export default router;
