import express, { type Express } from "express";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import router from "./routes";
import homeRouter from "./routes/home";
import { logger } from "./lib/logger";

const app: Express = express();

// Gzip all responses — big win for JSON payloads and HTML
app.use(compression());

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pretty-print all JSON responses automatically (2-space indent)
app.set("json spaces", 2);

// Favicon — inline SVG served directly, no static files needed
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#CC0000"/><polygon points="12,9 24,16 12,23" fill="white"/></svg>`;
app.get("/favicon.svg", (_req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(FAVICON_SVG);
});
app.get("/favicon.ico", (_req, res) => { res.redirect("/favicon.svg"); });
app.get("/og-image.svg", (_req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#080808"/><rect width="1200" height="630" fill="url(#g)"/><defs><radialGradient id="g" cx="50%" cy="30%" r="60%"><stop offset="0%" stop-color="#AA0000" stop-opacity=".4"/><stop offset="100%" stop-color="#080808" stop-opacity="0"/></radialGradient></defs><rect x="560" y="215" width="80" height="80" rx="20" fill="#CC0000"/><polygon points="584,239 624,255 584,271" fill="white"/><text x="600" y="340" font-family="Inter,sans-serif" font-size="72" font-weight="900" fill="white" text-anchor="middle">Tube<tspan fill="#FF4444">Fetch</tspan></text><text x="600" y="390" font-family="Inter,sans-serif" font-size="28" fill="#555" text-anchor="middle">YouTube Downloader API · No Key Required</text></svg>`);
});

// Home page — accessible at root (Render / Vercel) and at /api/ (Replit proxy)
app.use("/", homeRouter);
app.use("/api", router);

export default app;
