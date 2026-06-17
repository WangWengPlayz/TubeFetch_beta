import { Router, type IRouter, type Request, type Response } from "express";
import https from "https";
import http from "http";

const router: IRouter = Router();

const ALLOWED_HOSTS = /^([a-z0-9-]+\.googlevideo\.com|[a-z0-9-]+\.ytimg\.com)$/;

const MIME: Record<string, string> = {
  mp4: "video/mp4",
  m4a: "audio/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
};

function isAllowedUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    return ALLOWED_HOSTS.test(u.hostname) ? u : null;
  } catch {
    return null;
  }
}

function sanitizeFilename(raw: string): string {
  return raw
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200) || "video";
}

router.get("/proxy", (req: Request, res: Response) => {
  const rawUrl = typeof req.query.url === "string" ? req.query.url : "";
  const ext = typeof req.query.ext === "string" ? req.query.ext.replace(/[^a-z0-9]/gi, "") : "mp4";
  const rawTitle = typeof req.query.title === "string" ? req.query.title : "";

  if (!rawUrl) {
    res.status(400).json({ error: "Missing url parameter." });
    return;
  }

  const parsed = isAllowedUrl(rawUrl);
  if (!parsed) {
    res.status(403).json({ error: "Host not permitted." });
    return;
  }

  const filename = rawTitle
    ? `${sanitizeFilename(rawTitle)}.${ext}`
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
});

export default router;
