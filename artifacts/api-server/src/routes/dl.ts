import { Router, type IRouter, type Request, type Response } from "express";
import https from "https";
import http from "http";
import { spawn } from "child_process";
import { lookupUrl } from "../lib/url-store";

const router: IRouter = Router();

const MIME: Record<string, string> = {
  mp4: "video/mp4",
  m4a: "audio/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
};

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

router.get("/dl/:token", (req: Request, res: Response) => {
  const token = req.params["token"] ?? "";
  const entry = lookupUrl(token);

  if (!entry) {
    res.status(404).json({ error: "Download link expired or not found." });
    return;
  }

  if (entry.type === "proxy") {
    const { url: rawUrl, ext, title } = entry;

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      res.status(400).json({ error: "Invalid stored URL." });
      return;
    }

    const filename = title
      ? `${sanitizeFilename(title)}.${ext}`
      : `stream.${ext}`;

    const lib = parsed.protocol === "https:" ? https : http;

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Referer": "https://www.youtube.com/",
        "Origin": "https://www.youtube.com",
        ...(req.headers["range"] ? { Range: req.headers["range"] } : {}),
      },
    };

    const proxyReq = lib.get(options, (proxyRes) => {
      const contentType =
        proxyRes.headers["content-type"] ??
        MIME[ext] ??
        "application/octet-stream";

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      );
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Access-Control-Allow-Origin", "*");

      if (proxyRes.headers["content-length"])
        res.setHeader("Content-Length", proxyRes.headers["content-length"]);
      if (proxyRes.headers["content-range"])
        res.setHeader("Content-Range", proxyRes.headers["content-range"]);

      res.status(proxyRes.statusCode ?? 200);
      proxyRes.pipe(res);
    });

    proxyReq.on("error", () => {
      if (!res.headersSent) res.status(502).json({ error: "Upstream error." });
    });

    req.on("close", () => proxyReq.destroy());
    return;
  }

  // type === "merge"
  const { v: videoUrl, a: audioUrl, title, dur } = entry;

  const filename = title ? `${sanitizeFilename(title)}.mp4` : "video.mp4";

  res.setHeader("Content-Type", "video/mp4");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  );
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Minimize probe/analysis time to reduce startup delay, then stream
  const ffmpegArgs: string[] = [
    "-loglevel", "error",
    "-probesize", "32",
    "-analyzeduration", "0",
    "-headers", YT_HEADERS,
    "-i", videoUrl,
    "-probesize", "32",
    "-analyzeduration", "0",
    "-headers", YT_HEADERS,
    "-i", audioUrl,
    "-c:v", "copy",
    "-c:a", "copy",
  ];

  if (dur != null && dur > 0) {
    ffmpegArgs.push("-t", String(dur));
  }

  ffmpegArgs.push(
    "-movflags", "frag_keyframe+empty_moov",
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
