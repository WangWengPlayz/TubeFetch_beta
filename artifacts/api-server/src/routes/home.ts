import { Router, type IRouter } from "express";
import { VERSION } from "../lib/version";

const router: IRouter = Router();

const CHANGELOG: { version: string; date: string; tag: string; notes: string[] }[] = [
  {
    version: "1.2.3",
    date: "2026-06-02",
    tag: "current",
    notes: [
      "v2: response now includes <code>title</code> — the video title is returned alongside the MP4 &amp; MP3 download links",
    ],
  },
  {
    version: "1.2.2",
    date: "2026-05-23",
    tag: "",
    notes: [
      "Security: global rate limiting (300 req / 15 min) and per-endpoint download rate limiting (60 req / min) via express-rate-limit — protects upstream APIs from abuse",
      "Security: HTTP security headers hardened with Helmet — HSTS, X-Content-Type-Options, Referrer-Policy, X-Frame-Options enforced on all responses",
      "Security: query input validation added — 500-character max length and control-character stripping before any upstream call",
      "Security: error responses sanitised — internal file paths, dependency names and timeout labels are never sent to clients",
      "Security: BoundedMap (LRU, max 1 000) replaces unbounded Maps — eliminates heap-exhaustion from unique-query flooding",
      "Security: TtlCache capped at 500 entries — prevents memory growth under sustained unique-URL traffic",
      "Reliability: downloader replaced with a two-source fallback chain — @distube/ytdl-core (direct YouTube CDN, no third-party relay) is tried first; nayan-media-downloaders is used automatically if the primary fails — API stays up even when either source goes down",
    ],
  },
  {
    version: "1.2.1",
    date: "2026-05-16",
    tag: "",
    notes: [
      "Removed Skip button from intro — sequence plays through cleanly without the option to skip",
      "Removed YouTube video preview from V1 result card — thumbnail still shows, iframe player removed for performance",
      "Performance: noise grain texture is now static — eliminates constant full-viewport repaint that caused lag on low-end devices",
      "Performance: hero particle count reduced from 60 to 35; canvas capped at 30 fps; line connections disabled on narrow screens",
      "Performance: card 3D tilt handler throttled with requestAnimationFrame — eliminates layout thrash on every mousemove",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-05-16",
    tag: "",
    notes: [
      "VFX: layered noise grain texture breathes over the aurora at all times — background feels alive even when idle",
      "VFX: intro letters materialise one by one left-to-right; a 0→100% counter fills in sync; screen splits on exit — top half rises, bottom half drops — revealing the site like a curtain",
      "VFX: navbar starts fully transparent and gains frosted-glass backdrop + border as the user scrolls; nav links get a center-outward underline on hover; primary CTA pulses with a soft breathing glow on idle",
      "VFX: scroll-reveal cards scale up from 96% and stagger in one after another; aurora hue shifts subtly as the user scrolls for a sense of journey",
      "VFX: endpoint cards tilt in 3D toward the cursor on hover; buttons glow, rise, and press down with spring physics",
      "VFX: hero-to-content transition uses a gradient fade — no hard section edge",
      "VFX: full prefers-reduced-motion support — all CSS transitions and JS animations disabled cleanly for users who opt out",
    ],
  },
  {
    version: "1.1.4",
    date: "2026-05-06",
    tag: "",
    notes: [
      "Performance: stale-while-revalidate (SWR) caching — repeat requests are served instantly from cache while a background refresh runs silently; only the very first request for any video is slow",
      "Performance: fresh cache TTL extended from 90 s to 5 min; stale window up to 20 min — dramatically reduces upstream API calls under real traffic",
      "Performance: fetch logic factored into reusable functions (v1/v2/v3) enabling clean SWR background refresh without code duplication",
    ],
  },
  {
    version: "1.1.3",
    date: "2026-05-06",
    tag: "",
    notes: [
      "Concurrency: in-flight request deduplication — duplicate queries share one upstream call instead of each hitting the external API independently",
      "Reliability: hard 20 s timeout on all download calls and 15 s on search — eliminates indefinite hangs that caused 502 errors under load",
      "MongoDB: stats result cached in-memory for 4 s — reduces database round-trips by ~97% (stats bar now responds in <1 ms instead of 140+ ms)",
      "MongoDB: automatic reconnect retry after 60 s if initial connection fails — no longer stays permanently disconnected after a transient error",
      "MongoDB: connection pool tuned (min 1, max 5, idle timeout 30 s) for efficient multi-user throughput",
      "API errors now return structured JSON with timeout message instead of a silent 502",
    ],
  },
  {
    version: "1.1.2",
    date: "2026-05-06",
    tag: "",
    notes: [
      "V1 result card: video preview now full-width 16:9 — no longer a narrow side column",
      "V1 Preview plays YouTube via the IFrame Player API — reliable autoplay, no CORS issues",
      "Terms & Conditions popup on first visit — Decline redirects to google.com",
      "Open Graph & Twitter Card meta tags — rich link previews on Messenger, WhatsApp, Discord etc.",
      "Favicon added — tab icon now shows the TubeFetch play button logo",
      "Build: mockup-sandbox excluded from production typecheck and build",
    ],
  },
  {
    version: "1.1.1",
    date: "2026-05-06",
    tag: "",
    notes: [
      "V1 Preview plays YouTube via the IFrame Player API — reliable autoplay, no CORS issues",
      "MongoDB: detailed error logging (name, message, code, stack) on connection failure",
      "MongoDB: logs URI host (credentials redacted) so misconfigured URIs are easy to spot",
      "MongoDB: increased connection timeouts to 8 s and socket timeout to 10 s",
      "render.yaml: MONGODB_URI now declared as a required env var (set it in Render dashboard)",
      "Build: mockup-sandbox excluded from production typecheck and build",
    ],
  },
  {
    version: "1.0.8",
    date: "2026-05-05",
    tag: "",
    notes: [
      "Global ApiCount — every response now includes the total request counter",
      "Live stats bar in hero: total calls, version, cache TTL",
      "New /api/v3/q — returns top 10 search results with full metadata",
      "New /api/stats — monitor total API calls in real time",
      "V1 response now includes category (Music, Gaming, Education, etc.)",
      "FAQ section with 10 professional Q&As",
      "Disabled browser zoom for consistent mobile UX",
    ],
  },
  {
    version: "1.0.7",
    date: "2026-05-04",
    tag: "",
    notes: [
      "Full UI redesign — glassmorphism 2.0, particle VFX hero, 2026 web aesthetics",
      "Cinematic intro with scanlines, split-word reveal and glitch text effect",
      "Scroll-triggered reveal animations on all sections",
      "V1: thumbnail shows for 5s with SVG countdown ring, then fades to inline YouTube embed",
      "YouTube preview: seek/play/pause/fullscreen available — download only via page buttons",
    ],
  },
  {
    version: "1.0.6",
    date: "2026-05-04",
    tag: "",
    notes: [
      "Fixed 'Read more' overflow — long text scrolls in bounded area, 'Read less' always reachable",
      "API v2 revamp: credit, version, ms and flat media.mp4/mp3 URLs — no title or video_id",
      "Guaranteed thumbnail fallback chain in v1",
    ],
  },
  {
    version: "1.0.5",
    date: "2026-05-04",
    tag: "",
    notes: [
      "New /api/v2/q — fast endpoint: title + download links only",
      "Fixed 'Show less' scroll snap",
    ],
  },
  {
    version: "1.0.4",
    date: "2026-05-04",
    tag: "",
    notes: [
      "Rebranded to TubeFetch (TF)",
      "YouTube Dark Mode theme",
      "Copy endpoint URL button",
      "Smooth accordion & bell animations",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-05-01",
    tag: "initial",
    notes: [
      "YouTube URL and title/keyword search",
      "MP4 HD + MP3 direct download links",
      "90-second in-memory cache, Replit/Render/Vercel ready",
    ],
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is TubeFetch?",
    a: "TubeFetch is a free, open REST API that lets developers search YouTube and retrieve direct download links for <code>MP4</code> (HD video) and <code>MP3</code> (audio). Pass any YouTube URL or a plain search query and get back structured JSON with metadata and media URLs — <strong>no API key required</strong>.",
  },
  {
    q: "Do I need an API key or account?",
    a: "No. TubeFetch is completely free with <strong>zero authentication</strong> required. Simply call the endpoints from any HTTP client — a browser, curl, Postman, or your own app — and get results instantly.",
  },
  {
    q: "What is the difference between v1, v2, and v3?",
    a: "<strong>v1</strong> returns full metadata (title, author, thumbnail, duration, views, description, category) plus MP4 &amp; MP3 download links. <strong>v2</strong> is the fastest — returns the video title plus direct MP4 &amp; MP3 download links with minimal overhead. <strong>v3</strong> returns a ranked list of up to 10 YouTube search results with full metadata but without download links.",
  },
  {
    q: "How long are responses cached?",
    a: "All successful responses are cached <strong>in-memory for 90 seconds</strong>. If the same query is made within that window, the cached result is returned instantly and the response will include <code>\"cached\": true</code>. The <code>ApiCount</code> counter increments on every request regardless of cache status.",
  },
  {
    q: "Can I search by title instead of a URL?",
    a: "Yes. All endpoints accept both a full YouTube URL (e.g. <code>https://youtu.be/dQw4w9WgXcQ</code>) and a plain-text search query (e.g. <code>never gonna give you up</code>). For v1 and v2, the top search result is used. For v3, up to 10 results are returned.",
  },
  {
    q: "What formats are available?",
    a: "TubeFetch provides a direct <strong>MP4</strong> link (HD quality where available) and a direct <strong>MP3</strong> link (audio only). Links are sourced in real-time and may expire after a period of time, so they should be consumed promptly after fetching.",
  },
  {
    q: "What is ApiCount?",
    a: "<code>ApiCount</code> is a global request counter that increments by 1 on every API call to TubeFetch (v1, v2, v3, uptime, and healthz). It reflects the <strong>total number of requests served</strong> since the server last started. View the live count at <code>/api/stats</code> or in the stats bar above.",
  },
  {
    q: "What categories does TubeFetch detect?",
    a: "TubeFetch automatically classifies content into: <strong>Music, Gaming, Education, News &amp; Politics, Comedy, Sports, Film &amp; Entertainment, Science &amp; Technology, Travel &amp; Vlogs, Food &amp; Cooking, Health &amp; Fitness, Beauty &amp; Fashion,</strong> and <strong>Entertainment</strong> (default). Classification is based on title, description, and keywords.",
  },
  {
    q: "Is there a rate limit?",
    a: "There is <strong>no enforced rate limit</strong>. However, please be respectful of the underlying services TubeFetch depends on. Excessive polling or abusive usage may result in temporary throttling from YouTube's infrastructure.",
  },
  {
    q: "Is TubeFetch free for commercial use?",
    a: "TubeFetch is free for personal and educational use. Commercial use is at your own discretion — please ensure compliance with <strong>YouTube's Terms of Service</strong> and applicable copyright laws. The developer (MJL) accepts no liability for any misuse. All content belongs to its respective owners.",
  },
];

function buildHtml(version: string, baseUrl: string): string {
  const clItems = CHANGELOG.map((e) => {
    const tagHtml =
      e.tag === "current"
        ? `<span class="cl-tag current">Latest</span>`
        : e.tag === "initial"
        ? `<span class="cl-tag init">Initial</span>`
        : "";
    const notes = e.notes.map((n) => `<li>${n}</li>`).join("");
    return `<div class="cl-item">
      <div class="cl-row"><div class="cl-left"><span class="cl-ver">v${e.version}</span>${tagHtml}</div><span class="cl-date">${e.date}</span></div>
      <ul class="cl-notes">${notes}</ul>
    </div>`;
  }).join("");

  const faqItems = FAQS.map((f, i) => `
    <div class="faq-item" id="faq${i}">
      <div class="faq-q" onclick="toggleFaq(${i})">
        <span>${f.q}</span>
        <span class="faq-icon">+</span>
      </div>
      <div class="faq-a">
        <div class="faq-a-inner">${f.a}</div>
      </div>
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex"/>
  <meta name="googlebot" content="noindex,nofollow"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>TubeFetch — MJL</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
  <link rel="shortcut icon" href="/favicon.svg"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
  <meta property="og:type" content="website"/>
  <meta property="og:site_name" content="TubeFetch"/>
  <meta property="og:title" content="TubeFetch — YouTube Download API"/>
  <meta property="og:description" content="Free REST API — pass any YouTube URL or title and get direct MP4 &amp; MP3 download links. No API key required."/>
  <meta property="og:image" content="${baseUrl}/og-image.svg"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:url" content="${baseUrl}/"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="TubeFetch — YouTube Download API"/>
  <meta name="twitter:description" content="Free REST API — pass any YouTube URL or title and get direct MP4 &amp; MP3 download links. No API key required."/>
  <meta name="twitter:image" content="${baseUrl}/og-image.svg"/>
  <style>
    :root {
      --red: #FF0000;
      --red-dark: #CC0000;
      --red-dim: rgba(255,0,0,.12);
      --red-glow: rgba(255,0,0,.35);
      --bg: #080808;
      --bg2: #0D0D0D;
      --bg3: #111111;
      --surface: rgba(255,255,255,.03);
      --surface2: rgba(255,255,255,.055);
      --border: rgba(255,255,255,.07);
      --border2: rgba(255,255,255,.12);
      --text: #F0F0F0;
      --text2: #A0A0A0;
      --text3: #555;
      --text4: #2E2E2E;
      --green: #4ade80;
      --blue: #60a5fa;
      --amber: #fbbf24;
      --purple: #a78bfa;
      --font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --mono: 'JetBrains Mono', 'Menlo', 'Consolas', monospace;
      --ease-spring: cubic-bezier(.34,1.56,.64,1);
      --ease-out: cubic-bezier(.25,.46,.45,.94);
      --ease-in-out: cubic-bezier(.4,0,.2,1);
      --radius: 16px;
      --radius-sm: 10px;
      --radius-xs: 6px;
    }

    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
      user-select: none;
      -webkit-user-select: none;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    pre,code,input,textarea,.jbox { user-select: text; -webkit-user-select: text; }

    /* ══════════════════════════════════════
       CURSOR
    ══════════════════════════════════════ */
    #tf-cursor {
      position: fixed; pointer-events: none; z-index: 99999;
      width: 20px; height: 20px;
      border-radius: 50%;
      background: rgba(255,0,0,.15);
      border: 1.5px solid rgba(255,0,0,.5);
      transform: translate(-50%,-50%);
      transition: width .2s var(--ease-out), height .2s var(--ease-out), background .2s, border-color .2s, opacity .3s;
      mix-blend-mode: screen;
      will-change: transform;
    }
    #tf-cursor.hovering {
      width: 40px; height: 40px;
      background: rgba(255,0,0,.08);
      border-color: rgba(255,0,0,.7);
    }
    @media (hover: none) { #tf-cursor { display: none; } }

    /* ══════════════════════════════════════
       AURORA BACKGROUND
    ══════════════════════════════════════ */
    #aurora {
      position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
    }
    .aurora-orb {
      position: absolute; border-radius: 50%;
      filter: blur(80px); will-change: transform;
      animation: aurora-drift 20s ease-in-out infinite alternate;
    }
    .ao1 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(180,0,0,.18) 0%, transparent 70%); top: -200px; left: -100px; animation-duration: 18s; }
    .ao2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(120,0,0,.12) 0%, transparent 70%); top: 20%; right: -150px; animation-duration: 24s; animation-delay: -8s; }
    .ao3 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(80,0,0,.1) 0%, transparent 70%); bottom: 10%; left: 20%; animation-duration: 30s; animation-delay: -15s; }
    @keyframes aurora-drift {
      0%   { transform: translate(0, 0) scale(1); }
      33%  { transform: translate(60px, -40px) scale(1.1); }
      66%  { transform: translate(-30px, 50px) scale(.95); }
      100% { transform: translate(40px, 20px) scale(1.05); }
    }

    /* ══════════════════════════════════════
       NOISE GRAIN
    ══════════════════════════════════════ */
    #grain {
      position: fixed; inset: 0; z-index: 1; pointer-events: none;
      opacity: .04; mix-blend-mode: overlay;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-repeat: repeat; background-size: 200px 200px;
    }

    /* ══════════════════════════════════════
       GRID OVERLAY
    ══════════════════════════════════════ */
    #grid-overlay {
      position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background-image:
        linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px);
      background-size: 44px 44px;
      mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
      -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
    }

    /* ══════════════════════════════════════
       SCROLL REVEAL
    ══════════════════════════════════════ */
    .reveal { opacity: 0; transform: translateY(28px) scale(.97); transition: opacity .65s var(--ease-out), transform .65s var(--ease-out); }
    .reveal.in-view { opacity: 1; transform: none; }
    .reveal-d1 { transition-delay: .1s; }
    .reveal-d2 { transition-delay: .2s; }
    .reveal-d3 { transition-delay: .3s; }
    .reveal-d4 { transition-delay: .4s; }

    /* ══════════════════════════════════════
       INTRO
    ══════════════════════════════════════ */
    #intro {
      position: fixed; inset: 0; z-index: 9999;
      background: transparent;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    #intro-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
      background-size: 40px 40px;
      animation: intro-grid-fade 1.2s ease both;
    }
    @keyframes intro-grid-fade { from { opacity: 0; } to { opacity: 1; } }
    #intro-aurora {
      position: absolute; inset: 0; pointer-events: none;
    }
    .ia1 {
      position: absolute; width: 700px; height: 700px; border-radius: 50%;
      background: radial-gradient(circle, rgba(200,0,0,.22) 0%, transparent 65%);
      top: 50%; left: 50%; transform: translate(-50%,-50%);
      filter: blur(60px); animation: ia-pulse 3s ease-in-out infinite;
    }
    .ia2 {
      position: absolute; width: 400px; height: 400px; border-radius: 50%;
      background: radial-gradient(circle, rgba(255,40,40,.1) 0%, transparent 65%);
      top: 30%; left: 60%; transform: translate(-50%,-50%);
      filter: blur(80px); animation: ia-pulse 4s ease-in-out infinite reverse;
    }
    @keyframes ia-pulse {
      0%,100% { transform: translate(-50%,-50%) scale(1); opacity: .6; }
      50% { transform: translate(-50%,-50%) scale(1.15); opacity: 1; }
    }
    #intro-scanline {
      position: absolute; left: 0; right: 0; height: 2px; top: -4px;
      background: linear-gradient(90deg, transparent, rgba(255,60,60,.8) 30%, rgba(255,255,255,.4) 50%, rgba(255,60,60,.8) 70%, transparent);
      animation: intro-scan 2.8s ease-in-out forwards;
      z-index: 3; box-shadow: 0 0 20px rgba(255,0,0,.5);
    }
    @keyframes intro-scan { 0% { top: -4px; opacity: 1; } 100% { top: 100%; opacity: 0; } }
    .i-wrap { text-align: center; position: relative; z-index: 4; }
    .i-icon {
      width: 96px; height: 96px; border-radius: 26px; margin: 0 auto 28px;
      background: linear-gradient(135deg, #AA0000, #FF2020, #FF0000);
      display: flex; align-items: center; justify-content: center;
      animation: intro-icon-in .7s var(--ease-spring) both .4s;
      position: relative; overflow: hidden;
    }
    .i-icon::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,.25) 0%, transparent 50%);
    }
    .i-icon::after {
      content: ''; position: absolute; inset: -2px;
      border-radius: 28px;
      background: transparent;
      border: 2px solid transparent;
      background-clip: padding-box;
      box-shadow: 0 0 0 2px rgba(255,80,80,.4), 0 0 60px rgba(255,0,0,.6), 0 0 120px rgba(255,0,0,.2);
    }
    .i-icon svg { width: 42px; height: 42px; fill: #fff; position: relative; z-index: 1; drop-shadow: 0 0 10px rgba(255,255,255,.5); }
    @keyframes intro-icon-in {
      from { opacity: 0; transform: scale(.3) rotate(-20deg); filter: blur(10px); }
      to   { opacity: 1; transform: scale(1) rotate(0); filter: blur(0); }
    }
    .i-title {
      font-size: clamp(2.8rem, 9vw, 3.8rem); font-weight: 900;
      letter-spacing: -3px; display: flex; align-items: center; justify-content: center;
      line-height: 1;
    }
    .i-word { overflow: hidden; display: inline-block; }
    .i-word span { display: inline-block; animation: word-rise .6s var(--ease-spring) both; }
    .i-word:nth-child(1) span { animation-delay: .8s; }
    .i-word:nth-child(2) span { animation-delay: .95s; color: transparent; background: linear-gradient(135deg, #FF4444, #FF0000, #CC0000); -webkit-background-clip: text; background-clip: text; }
    @keyframes word-rise { from { transform: translateY(110%); opacity: 0; } to { transform: none; opacity: 1; } }
    .i-sub {
      font-size: .7rem; font-weight: 700; color: var(--text3);
      letter-spacing: 3.5px; text-transform: uppercase;
      margin-top: 14px;
      animation: fade-up-soft .5s ease both 1.4s;
    }
    .i-badges {
      display: flex; gap: 8px; justify-content: center; margin-top: 20px;
      animation: fade-up-soft .5s ease both 1.55s;
    }
    .i-badge {
      font-size: .6rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
      padding: 3px 10px; border-radius: 20px;
      background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
      color: var(--text3);
    }
    .i-bar-track {
      width: 200px; height: 1.5px; background: rgba(255,255,255,.06);
      border-radius: 2px; margin: 28px auto 0; overflow: hidden;
    }
    .i-bar {
      height: 100%; width: 0;
      background: linear-gradient(90deg, #880000, #FF0000, #FF6644);
      border-radius: 2px; box-shadow: 0 0 10px #FF0000, 0 0 20px rgba(255,0,0,.4);
      transition: width 3.8s cubic-bezier(.12,.8,.4,1);
    }
    .i-ver {
      color: var(--text4); font-size: .6rem; font-family: var(--mono);
      margin-top: 12px; animation: fade-up-soft .5s ease both 1.65s;
      letter-spacing: 1px;
    }
    @keyframes fade-up-soft { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    #intro.out { animation: intro-exit .65s var(--ease-in-out) forwards; }
    @keyframes intro-exit {
      0%   { opacity: 1; filter: blur(0) brightness(1); transform: scale(1); }
      50%  { opacity: 1; filter: blur(0) brightness(2.5); transform: scale(1.03); }
      100% { opacity: 0; filter: blur(16px) brightness(0); transform: scale(1.06); }
    }

    /* ── INTRO SPLIT CURTAIN ── */
    #intro-split-top, #intro-split-bottom {
      position: absolute; left: 0; right: 0; z-index: 0;
      background: #050505;
      transition: transform .72s cubic-bezier(.76,0,.24,1);
    }
    #intro-split-top { top: 0; height: 50%; transform: translateY(0); }
    #intro-split-bottom { bottom: 0; height: 50%; transform: translateY(0); }
    #intro.splitting #intro-split-top { transform: translateY(-100%); }
    #intro.splitting #intro-split-bottom { transform: translateY(100%); }

    /* ── INTRO LETTERS ── */
    .i-l {
      display: inline-block;
      animation: letter-rise .44s var(--ease-spring) both;
      animation-delay: calc(.75s + var(--di) * .065s);
    }
    .i-l-red {
      color: transparent;
      background: linear-gradient(135deg, #FF6666, #FF0000, #CC0000);
      -webkit-background-clip: text; background-clip: text;
    }
    @keyframes letter-rise {
      from { transform: translateY(105%) scaleY(1.15); opacity: 0; }
      to   { transform: none; opacity: 1; }
    }

    /* ── INTRO COUNTER ── */
    .i-counter {
      font-size: .64rem; font-weight: 900; color: rgba(255,80,80,.55);
      font-family: var(--mono); letter-spacing: 2px;
      margin-top: 6px; animation: fade-up-soft .4s ease both 1.4s;
    }

    /* ══════════════════════════════════════
       TERMS OVERLAY
    ══════════════════════════════════════ */
    #terms-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,.9); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      display: none; align-items: center; justify-content: center; padding: 16px;
    }
    #terms-overlay.show { display: flex; animation: fade-in-ov .4s ease both; }
    #terms-overlay.out  { display: flex; animation: fade-out-ov .3s ease forwards; }
    @keyframes fade-in-ov  { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fade-out-ov { from { opacity: 1; } to { opacity: 0; } }
    .terms-modal {
      background: rgba(12,12,12,.98); border: 1px solid rgba(255,255,255,.1);
      border-radius: 24px; max-width: 460px; width: 100%;
      box-shadow: 0 60px 120px rgba(0,0,0,.9), 0 0 0 1px rgba(255,0,0,.06), 0 0 60px rgba(255,0,0,.04);
      overflow: hidden; animation: modal-up .45s var(--ease-spring) both .1s;
    }
    @keyframes modal-up { from { opacity: 0; transform: translateY(28px) scale(.94); } to { opacity: 1; transform: none; } }
    .terms-head { padding: 28px 26px 0; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
    .terms-icon {
      width: 56px; height: 56px; border-radius: 16px;
      background: linear-gradient(135deg, #AA0000, #FF2020);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 30px rgba(255,0,0,.35), 0 0 60px rgba(255,0,0,.1);
    }
    .terms-icon svg { width: 24px; height: 24px; fill: none; stroke: #fff; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .terms-title { font-size: 1.08rem; font-weight: 800; color: var(--text); letter-spacing: -.3px; }
    .terms-sub { font-size: .62rem; color: var(--text4); font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
    .terms-body { padding: 18px 26px; max-height: 240px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #2a2a2a transparent; }
    .terms-body::-webkit-scrollbar { width: 3px; }
    .terms-body::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
    .terms-section { margin-bottom: 16px; }
    .terms-section:last-child { margin-bottom: 0; }
    .terms-section-title { font-size: .6rem; font-weight: 800; color: #FF4444; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px; }
    .terms-text { font-size: .74rem; color: #666; line-height: 1.75; }
    .terms-text strong { color: #999; font-weight: 700; }
    .terms-footer { padding: 14px 26px 24px; border-top: 1px solid rgba(255,255,255,.06); }
    .terms-notice { font-size: .62rem; color: #2a2a2a; text-align: center; line-height: 1.6; margin-bottom: 14px; }
    .terms-btns { display: flex; gap: 8px; }
    .terms-accept {
      flex: 1; background: linear-gradient(135deg, #AA0000, #FF0000); color: #fff; border: none;
      padding: 13px; border-radius: 12px; font-size: .84rem; font-weight: 700; cursor: pointer;
      transition: all .2s; box-shadow: 0 4px 20px rgba(255,0,0,.3); font-family: var(--font);
      position: relative; overflow: hidden;
    }
    .terms-accept::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,.15) 0%, transparent 50%);
    }
    .terms-accept:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,0,0,.45); }
    .terms-decline {
      flex: 0 0 auto; background: rgba(255,255,255,.04); color: #444; border: 1px solid rgba(255,255,255,.08);
      padding: 13px 18px; border-radius: 12px; font-size: .84rem; font-weight: 600; cursor: pointer;
      transition: all .2s; font-family: var(--font);
    }
    .terms-decline:hover { background: rgba(255,255,255,.08); color: #666; border-color: rgba(255,255,255,.14); }

    /* ── DECLINE OVERLAY ── */
    #decline-overlay {
      position: fixed; inset: 0; z-index: 10001;
      background: rgba(0,0,0,.97); backdrop-filter: blur(20px);
      display: none; align-items: center; justify-content: center; padding: 16px;
    }
    #decline-overlay.show { display: flex; animation: fade-in-ov .3s ease both; }
    .decline-modal {
      background: rgba(10,10,10,.99); border: 1px solid rgba(255,255,255,.07);
      border-radius: 24px; max-width: 340px; width: 100%; padding: 40px 30px;
      text-align: center; box-shadow: 0 60px 100px rgba(0,0,0,.95);
      animation: modal-up .35s var(--ease-spring) both;
    }
    .decline-icon {
      width: 48px; height: 48px; border-radius: 50%;
      background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
      display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
    }
    .decline-icon svg { width: 20px; height: 20px; stroke: #444; fill: none; stroke-width: 2; stroke-linecap: round; }
    .decline-title { font-size: .95rem; font-weight: 800; color: var(--text); margin-bottom: 10px; }
    .decline-msg { font-size: .76rem; color: #444; line-height: 1.7; margin-bottom: 24px; }
    .decline-bar-track { width: 100%; height: 1.5px; background: #1a1a1a; border-radius: 2px; overflow: hidden; }
    .decline-bar { height: 100%; width: 0; background: linear-gradient(90deg, #2a2a2a, #555); border-radius: 2px; transition: width 3s linear; }
    .decline-redirect { font-size: .62rem; color: #2a2a2a; margin-top: 10px; font-family: var(--mono); letter-spacing: .5px; }

    /* ══════════════════════════════════════
       TOPBAR
    ══════════════════════════════════════ */
    .topbar {
      position: sticky; top: 0; z-index: 100; height: 60px;
      background: transparent; backdrop-filter: none; -webkit-backdrop-filter: none;
      border-bottom: 1px solid transparent;
      display: flex; align-items: center; justify-content: space-between; padding: 0 24px;
      transition: background .45s var(--ease-in-out), border-color .45s var(--ease-in-out), backdrop-filter .45s var(--ease-in-out);
    }
    .topbar.scrolled {
      background: rgba(8,8,8,.88); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
      border-bottom-color: rgba(255,255,255,.07);
    }
    .topbar::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent 0%, rgba(255,0,0,.3) 30%, rgba(255,80,80,.15) 50%, rgba(255,0,0,.3) 70%, transparent 100%);
      opacity: 0; transition: opacity .45s var(--ease-in-out);
    }
    .topbar.scrolled::after { opacity: 1; }
    .topbar-logo {
      display: flex; align-items: center; gap: 10px; text-decoration: none;
      transition: opacity .2s; cursor: pointer;
    }
    .topbar-logo:hover { opacity: .8; }
    .topbar-icon {
      width: 32px; height: 32px; border-radius: 9px;
      background: linear-gradient(135deg, #AA0000, #FF1a1a);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 14px rgba(255,0,0,.35), 0 2px 8px rgba(0,0,0,.5);
      position: relative; overflow: hidden; flex-shrink: 0;
    }
    .topbar-icon::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,.2) 0%, transparent 60%); }
    .topbar-icon svg { width: 15px; height: 15px; fill: #fff; position: relative; z-index: 1; }
    .topbar-name { font-weight: 800; font-size: .97rem; color: var(--text); letter-spacing: -.4px; }
    .topbar-tf { font-size: .58rem; font-weight: 800; color: var(--red); letter-spacing: 1.8px; margin-left: 4px; vertical-align: middle; }
    .topbar-ver { font-size: .6rem; color: var(--text4); font-family: var(--mono); margin-left: 6px; }
    .topbar-right { display: flex; align-items: center; gap: 6px; }
    .nav-links { display: flex; gap: 2px; }
    .nav-links a {
      color: var(--text3); text-decoration: none; font-size: .78rem; font-weight: 600;
      padding: 6px 12px; border-radius: var(--radius-xs); transition: color .2s, background .2s; white-space: nowrap;
      position: relative;
    }
    .nav-links a::after {
      content: ''; position: absolute; bottom: 3px; left: 50%; right: 50%;
      height: 1px; background: var(--red); border-radius: 1px;
      transition: left .25s var(--ease-out), right .25s var(--ease-out);
    }
    .nav-links a:hover { color: var(--text); background: rgba(255,255,255,.04); }
    .nav-links a:hover::after { left: 12px; right: 12px; }
    @media (max-width: 540px) { .nav-links { display: none; } }

    /* ── BELL ── */
    .bell-wrap { position: relative; }
    .bell-btn {
      background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
      border-radius: var(--radius-xs); width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: var(--text3); transition: all .2s; position: relative;
    }
    .bell-btn:hover { background: rgba(255,255,255,.08); color: var(--text); border-color: var(--border2); }
    .bell-btn.active { background: rgba(255,0,0,.08); color: #FF4444; border-color: rgba(255,0,0,.25); }
    .bell-btn svg { width: 15px; height: 15px; }
    .bell-dot {
      position: absolute; top: 6px; right: 6px; width: 7px; height: 7px;
      background: var(--red); border-radius: 50%; border: 1.5px solid var(--bg);
      animation: dot-pulse 2s ease infinite;
    }
    @keyframes dot-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .5; transform: scale(.7); } }
    .bell-panel {
      display: none; position: absolute; top: calc(100% + 14px); right: 0; width: 320px;
      background: rgba(14,14,14,.97); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
      border: 1px solid rgba(255,255,255,.09); border-radius: 18px;
      box-shadow: 0 32px 80px rgba(0,0,0,.95), 0 0 0 1px rgba(255,255,255,.03);
      z-index: 200; overflow: hidden; transform-origin: top right;
    }
    .bell-panel.opening { display: block; animation: bell-in .24s var(--ease-spring) both; }
    .bell-panel.open    { display: block; }
    .bell-panel.closing { display: block; animation: bell-out .18s ease forwards; }
    @keyframes bell-in  { from { opacity: 0; transform: scale(.88) translateY(-12px); } to { opacity: 1; transform: none; } }
    @keyframes bell-out { from { opacity: 1; transform: none; } to { opacity: 0; transform: scale(.88) translateY(-12px); } }
    .bell-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 18px 14px; border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .bell-head-title {
      font-size: .7rem; font-weight: 800; color: var(--text); letter-spacing: 1px; text-transform: uppercase;
      display: flex; align-items: center; gap: 8px;
    }
    .bell-head-title::before { content: ''; width: 7px; height: 7px; background: var(--red); border-radius: 50%; display: inline-block; box-shadow: 0 0 8px var(--red); }
    .bell-close { background: none; border: none; color: var(--text3); cursor: pointer; padding: 4px 8px; border-radius: 5px; transition: all .15s; font-size: .85rem; }
    .bell-close:hover { color: var(--text); background: rgba(255,255,255,.08); }
    .bell-list { max-height: 360px; overflow-y: auto; padding: 8px 0; }
    .bell-list::-webkit-scrollbar { width: 3px; }
    .bell-list::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
    .cl-item { padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,.04); }
    .cl-item:last-child { border-bottom: none; }
    .cl-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .cl-left { display: flex; align-items: center; gap: 8px; }
    .cl-ver { font-size: .76rem; font-weight: 800; color: var(--text); font-family: var(--mono); }
    .cl-tag { font-size: .56rem; font-weight: 800; padding: 2px 9px; border-radius: 20px; letter-spacing: .5px; text-transform: uppercase; }
    .cl-tag.current { background: rgba(255,0,0,.1); color: #FF4444; border: 1px solid rgba(255,0,0,.2); }
    .cl-tag.init { background: rgba(255,255,255,.05); color: var(--text3); }
    .cl-date { font-size: .64rem; color: var(--text4); font-family: var(--mono); }
    .cl-notes { list-style: none; display: flex; flex-direction: column; gap: 4px; }
    .cl-notes li { font-size: .7rem; color: var(--text3); padding-left: 14px; position: relative; line-height: 1.5; }
    .cl-notes li::before { content: '·'; position: absolute; left: 0; color: var(--red); font-weight: 900; }

    /* ══════════════════════════════════════
       HERO
    ══════════════════════════════════════ */
    .hero {
      position: relative; overflow: hidden;
      padding: clamp(64px, 11vw, 110px) 24px clamp(50px, 8vw, 84px);
      text-align: center;
      background: radial-gradient(ellipse 90% 70% at 50% -10%, rgba(160,0,0,.32) 0%, transparent 65%);
    }
    .hero::before {
      content: ''; position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,0,0,.07) 0%, transparent 70%);
    }
    #hero-canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
    .hero-content { position: relative; z-index: 2; }
    .hero-eyebrow {
      display: inline-flex; align-items: center; gap: 9px;
      background: rgba(255,0,0,.07); border: 1px solid rgba(255,0,0,.18);
      border-radius: 24px; padding: 5px 16px;
      font-size: .62rem; font-weight: 800; color: rgba(255,100,100,.9);
      letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 22px;
      animation: fade-up-soft .6s ease both .1s;
    }
    .hero-eyebrow::before { content: ''; width: 6px; height: 6px; background: var(--red); border-radius: 50%; box-shadow: 0 0 8px var(--red); animation: dot-pulse 1.8s ease infinite; }
    .hero h1 {
      font-size: clamp(3rem, 9vw, 5rem); font-weight: 900; color: var(--text);
      letter-spacing: -4px; line-height: .95;
      animation: fade-up-soft .7s ease both .2s;
    }
    .hero-tf {
      color: transparent;
      background: linear-gradient(135deg, #FF6666 0%, #FF0000 50%, #CC0000 100%);
      -webkit-background-clip: text; background-clip: text;
      position: relative;
    }
    .hero-tf::after {
      content: attr(data-text);
      position: absolute; inset: 0;
      background: linear-gradient(135deg, #FF6666, #FF0000);
      -webkit-background-clip: text; background-clip: text;
      color: transparent;
      filter: blur(12px); opacity: .4;
      z-index: -1;
    }
    .hero-sub {
      margin-top: 20px; color: rgba(240,240,240,.45);
      font-size: clamp(.85rem, 2.2vw, 1rem); line-height: 1.7;
      animation: fade-up-soft .7s ease both .32s;
      font-weight: 400;
    }
    .hero-badges {
      display: flex; gap: 8px; justify-content: center; margin-top: 28px;
      flex-wrap: wrap; animation: fade-up-soft .7s ease both .44s;
    }
    .hbadge {
      background: rgba(255,255,255,.04); backdrop-filter: blur(8px);
      color: rgba(240,240,240,.55); padding: 5px 15px; border-radius: 24px;
      font-size: .66rem; font-weight: 700; letter-spacing: .6px;
      border: 1px solid rgba(255,255,255,.07); transition: all .25s;
      cursor: default;
    }
    .hbadge:hover { background: rgba(255,255,255,.08); color: var(--text); border-color: rgba(255,255,255,.14); transform: translateY(-2px); }

    /* ── STATS BAR ── */
    .stats-bar {
      display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
      margin-top: 28px; animation: fade-up-soft .7s ease both .56s;
    }
    .stat-item {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
      border-radius: var(--radius); padding: 12px 20px; min-width: 84px;
      backdrop-filter: blur(10px); transition: all .3s var(--ease-out);
    }
    .stat-item:hover { border-color: rgba(255,255,255,.12); transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,.5); }
    .stat-num { font-size: 1.3rem; font-weight: 900; color: var(--text); font-family: var(--mono); line-height: 1; letter-spacing: -1px; }
    .stat-num.red { color: #FF4444; text-shadow: 0 0 20px rgba(255,68,68,.3); }
    .stat-lbl { font-size: .56rem; font-weight: 700; color: var(--text4); text-transform: uppercase; letter-spacing: 1.2px; }

    /* ══════════════════════════════════════
       LAYOUT
    ══════════════════════════════════════ */
    .wrap { max-width: 860px; margin: 0 auto; padding: clamp(32px, 5vw, 56px) 20px 100px; position: relative; z-index: 1; }
    .sec-label {
      font-size: .62rem; font-weight: 800; color: var(--text4);
      text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px; padding-left: 2px;
      display: flex; align-items: center; gap: 12px;
    }
    .sec-label::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(255,255,255,.07), transparent); }

    /* ══════════════════════════════════════
       ENDPOINT ACCORDION
    ══════════════════════════════════════ */
    .ep-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 36px; }
    .ep-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); overflow: hidden;
      transition: border-color .28s, box-shadow .28s, transform .22s var(--ease-out);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      position: relative;
    }
    .ep-card::before {
      content: ''; position: absolute; inset: 0; border-radius: var(--radius);
      background: linear-gradient(135deg, rgba(255,255,255,.03) 0%, transparent 60%);
      pointer-events: none;
    }
    .ep-card:hover { border-color: rgba(255,255,255,.14); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,.5); }
    .ep-card.open { border-color: rgba(255,0,0,.35); box-shadow: 0 0 0 1px rgba(255,0,0,.08), 0 16px 50px rgba(0,0,0,.6); transform: none; }
    .ep-header {
      display: flex; align-items: center; gap: 12px; padding: 16px 20px;
      cursor: pointer; transition: background .2s; user-select: none;
    }
    .ep-header:hover { background: rgba(255,255,255,.025); }
    .ep-method {
      font-size: .6rem; font-weight: 900; padding: 3px 10px; border-radius: var(--radius-xs);
      background: rgba(74,222,128,.07); color: var(--green); letter-spacing: .6px;
      flex-shrink: 0; border: 1px solid rgba(74,222,128,.14); font-family: var(--mono);
    }
    .ep-method.v2 { background: rgba(96,165,250,.07); color: var(--blue); border-color: rgba(96,165,250,.14); }
    .ep-method.v3 { background: rgba(251,191,36,.07); color: var(--amber); border-color: rgba(251,191,36,.14); }
    .ep-path { font-family: var(--mono); font-size: .78rem; color: var(--blue); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; user-select: text; -webkit-user-select: text; }
    .ep-desc-label { font-size: .7rem; color: var(--text4); white-space: nowrap; margin-right: 4px; }
    @media (max-width: 500px) { .ep-desc-label { display: none; } }
    .ep-chevron { color: var(--text4); flex-shrink: 0; transition: transform .35s var(--ease-spring), color .2s; }
    .ep-chevron svg { width: 14px; height: 14px; }
    .ep-card.open .ep-chevron { transform: rotate(180deg); color: var(--red); }
    .ep-body { max-height: 0; overflow: hidden; transition: max-height .4s var(--ease-in-out); border-top: 0 solid rgba(255,255,255,.07); }
    .ep-card.open .ep-body { max-height: 3000px; border-top-width: 1px; }
    .ep-body-inner { padding: 20px; }
    .ep-info { font-size: .8rem; color: var(--text3); line-height: 1.75; margin-bottom: 18px; }
    .ep-info code { background: rgba(255,255,255,.07); color: var(--text); padding: 1px 7px; border-radius: 4px; font-size: .84em; font-family: var(--mono); }
    .ep-info strong { color: var(--text2); }
    .ep-badge-fast {
      display: inline-flex; align-items: center; gap: 4px;
      background: rgba(96,165,250,.07); color: var(--blue); border: 1px solid rgba(96,165,250,.14);
      border-radius: 4px; font-size: .64rem; font-weight: 800; padding: 2px 8px; letter-spacing: .5px; margin-left: 6px; vertical-align: middle;
    }
    .ep-badge-new {
      display: inline-flex; align-items: center;
      background: rgba(251,191,36,.08); color: var(--amber); border: 1px solid rgba(251,191,36,.18);
      border-radius: 4px; font-size: .64rem; font-weight: 800; padding: 2px 8px; letter-spacing: .5px; margin-left: 6px; vertical-align: middle;
    }
    .ep-input-row { display: flex; gap: 8px; margin-bottom: 14px; }
    .ep-input {
      flex: 1; min-width: 0; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.09);
      border-radius: var(--radius-sm); color: var(--text); padding: 12px 16px;
      font-size: .84rem; outline: none; transition: border-color .22s, box-shadow .22s, background .22s;
      font-family: var(--font);
    }
    .ep-input:focus { border-color: rgba(255,0,0,.45); box-shadow: 0 0 0 3px rgba(255,0,0,.07); background: rgba(255,255,255,.05); }
    .ep-input::placeholder { color: var(--text4); }
    .ep-fetch-btn {
      background: linear-gradient(135deg, #AA0000, #FF0000);
      color: #fff; border: none; padding: 12px 22px; border-radius: var(--radius-sm);
      cursor: pointer; font-size: .82rem; font-weight: 700; transition: all .22s;
      white-space: nowrap; display: flex; align-items: center; gap: 8px;
      box-shadow: 0 4px 16px rgba(255,0,0,.28); position: relative; overflow: hidden;
      font-family: var(--font);
    }
    .ep-fetch-btn::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,.18) 0%, transparent 50%);
    }
    .ep-fetch-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,0,0,.42); background: linear-gradient(135deg, #CC0000, #FF2020); animation: none; }
    .ep-fetch-btn:active:not(:disabled) { transform: translateY(1px); box-shadow: 0 2px 10px rgba(255,0,0,.25); }
    .ep-fetch-btn:disabled { background: rgba(255,255,255,.05); color: var(--text4); cursor: not-allowed; transform: none; box-shadow: none; animation: none; }
    .ep-fetch-btn:not(:disabled):not(:active) { animation: btn-breathe 2.8s ease-in-out infinite; }
    @keyframes btn-breathe {
      0%,100% { box-shadow: 0 4px 16px rgba(255,0,0,.28); }
      50%      { box-shadow: 0 6px 32px rgba(255,0,0,.56), 0 0 50px rgba(255,0,0,.1); }
    }
    .ep-fetch-btn svg { width: 13px; height: 13px; flex-shrink: 0; position: relative; z-index: 1; }
    .ep-fetch-btn span { position: relative; z-index: 1; }
    @media (max-width: 440px) { .ep-input-row { flex-direction: column; } }

    /* ── RIPPLE ── */
    .ripple-container { position: relative; overflow: hidden; }
    .ripple-el {
      position: absolute; border-radius: 50%;
      background: rgba(255,255,255,.3); transform: scale(0);
      animation: ripple .6s linear; pointer-events: none;
    }
    @keyframes ripple { to { transform: scale(4); opacity: 0; } }

    /* ── EP RESULT META ── */
    .ep-result { display: none; margin-top: 6px; }
    .ep-result-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
    .ep-status { font-size: .65rem; font-weight: 800; padding: 3px 10px; border-radius: var(--radius-xs); letter-spacing: .4px; font-family: var(--mono); }
    .ep-status.ok  { background: rgba(74,222,128,.07); color: var(--green); border: 1px solid rgba(74,222,128,.14); }
    .ep-status.err { background: rgba(255,0,0,.08); color: #FF4444; border: 1px solid rgba(255,0,0,.15); }
    .ep-ms { font-size: .65rem; color: var(--text4); font-family: var(--mono); }
    .ep-cached { font-size: .65rem; color: var(--amber); background: rgba(245,158,11,.07); padding: 3px 9px; border-radius: 5px; font-weight: 700; border: 1px solid rgba(245,158,11,.14); }
    .ep-apicount { font-size: .65rem; color: var(--purple); background: rgba(167,139,250,.07); padding: 3px 9px; border-radius: 5px; font-weight: 700; border: 1px solid rgba(167,139,250,.14); display: none; }

    /* ── COPY URL STRIP ── */
    .copy-url-strip {
      display: flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
      border-radius: var(--radius-sm); padding: 10px 14px; margin-bottom: 14px; overflow: hidden;
    }
    .copy-url-strip code { flex: 1; font-family: var(--mono); font-size: .7rem; color: var(--blue); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .copy-url-btn {
      background: rgba(255,255,255,.06); color: var(--text2); border: none;
      border-radius: 6px; padding: 4px 12px; font-size: .65rem; font-weight: 700;
      cursor: pointer; white-space: nowrap; transition: all .18s;
      flex-shrink: 0; display: flex; align-items: center; gap: 5px; font-family: var(--font);
    }
    .copy-url-btn:hover { background: rgba(255,255,255,.12); color: var(--text); }
    .copy-url-btn svg { width: 11px; height: 11px; }

    /* ── V1 RICH RESULT ── */
    .r-card {
      background: rgba(255,255,255,.022); border: 1px solid rgba(255,255,255,.08);
      border-radius: var(--radius); overflow: hidden; margin-bottom: 14px;
      animation: slide-up .32s var(--ease-spring) both;
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    }
    @keyframes slide-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
    .r-inner { display: flex; flex-direction: column; }
    .r-thumb { position: relative; background: #0a0a0a; width: 100%; aspect-ratio: 16/9; overflow: hidden; }
    .r-thumb-img { width: 100%; height: 100%; object-fit: cover; display: block; position: absolute; inset: 0; transition: opacity .55s ease; }
    .r-dur {
      position: absolute; bottom: 8px; right: 8px; z-index: 4;
      background: rgba(0,0,0,.88); color: var(--text); font-size: .62rem; font-weight: 700;
      padding: 3px 7px; border-radius: 5px; font-family: var(--mono);
      backdrop-filter: blur(6px);
    }
    .r-cached-badge {
      position: absolute; top: 8px; left: 8px; z-index: 4; display: none;
      background: rgba(255,0,0,.14); color: #FF4444; font-size: .58rem; font-weight: 800;
      padding: 2px 8px; border-radius: 4px; letter-spacing: .5px; text-transform: uppercase;
      border: 1px solid rgba(255,0,0,.2); backdrop-filter: blur(6px);
    }
    .r-play-overlay {
      position: absolute; inset: 0; z-index: 3;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
      background: rgba(0,0,0,.32); cursor: pointer; transition: background .25s;
    }
    .r-play-overlay:hover { background: rgba(0,0,0,.5); }
    .r-play-circle {
      width: 58px; height: 58px; border-radius: 50%;
      background: rgba(220,0,0,.92); display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 30px rgba(255,0,0,.55), 0 8px 24px rgba(0,0,0,.5);
      transition: transform .25s var(--ease-spring), box-shadow .25s;
    }
    .r-play-overlay:hover .r-play-circle { transform: scale(1.12); box-shadow: 0 0 45px rgba(255,0,0,.75), 0 12px 32px rgba(0,0,0,.6); }
    .r-play-circle svg { width: 22px; height: 22px; fill: #fff; margin-left: 4px; }
    .r-play-label { font-size: .64rem; font-weight: 800; color: rgba(255,255,255,.7); letter-spacing: 1.5px; text-transform: uppercase; }
    .r-countdown-wrap { position: absolute; inset: 0; z-index: 3; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,.55); }
    .r-ring-svg { width: 90px; height: 90px; transform: rotate(-90deg); }
    .r-ring-bg { fill: none; stroke: rgba(255,255,255,.1); stroke-width: 4; }
    .r-ring-arc { fill: none; stroke: var(--red); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 201; stroke-dashoffset: 201; transition: stroke-dashoffset 5s linear; filter: drop-shadow(0 0 6px var(--red)); }
    .r-countdown-n { position: absolute; font-size: 1.9rem; font-weight: 900; color: var(--text); text-shadow: 0 0 24px rgba(255,0,0,.6); }
    .r-yt-wrap { position: absolute; inset: 0; z-index: 5; display: none; animation: yt-fade-in .5s ease both; }
    @keyframes yt-fade-in { from { opacity: 0; } to { opacity: 1; } }
    .r-yt-wrap > div, .r-yt-wrap iframe { width: 100% !important; height: 100% !important; border: none; display: block; }
    .r-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
    .r-title { font-size: .9rem; font-weight: 700; color: var(--text); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .r-author { font-size: .74rem; color: var(--blue); text-decoration: none; font-weight: 600; transition: color .18s; }
    .r-author:hover { color: #93c5fd; }
    .r-stats { display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: center; }
    .r-stat { font-size: .68rem; color: var(--text3); display: flex; align-items: center; gap: 4px; }
    .cat-badge {
      display: none; align-items: center;
      background: rgba(251,191,36,.07); color: var(--amber); border: 1px solid rgba(251,191,36,.14);
      border-radius: 5px; font-size: .6rem; font-weight: 800; padding: 2px 9px; letter-spacing: .5px;
    }
    .r-desc-wrap { font-size: .73rem; color: var(--text3); line-height: 1.6; display: none; }
    .r-desc-text { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: pre-line; }
    .r-desc-text.exp { -webkit-line-clamp: unset; display: block; max-height: 200px; overflow-y: auto; padding-right: 4px; }
    .r-desc-text.exp::-webkit-scrollbar { width: 3px; }
    .r-desc-text.exp::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
    .r-more { background: none; border: none; color: var(--red); font-size: .68rem; font-weight: 700; cursor: pointer; padding: 2px 0; margin-top: 3px; display: block; transition: color .15s; font-family: var(--font); }
    .r-more:hover { color: #FF4444; }
    .r-dl { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }

    /* ── V2 QUICK RESULT ── */
    .v2-card {
      background: rgba(255,255,255,.022); border: 1px solid rgba(255,255,255,.08);
      border-radius: var(--radius); padding: 20px 22px; margin-bottom: 14px;
      animation: slide-up .32s var(--ease-spring) both;
    }
    .v2-label { font-size: .6rem; font-weight: 800; color: var(--text4); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
    .v2-dl { display: flex; gap: 8px; flex-wrap: wrap; }

    /* ── V3 RESULT LIST ── */
    .v3-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; animation: slide-up .32s var(--ease-spring) both; }
    .v3-item {
      display: flex; gap: 12px; background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.06);
      border-radius: var(--radius-sm); padding: 12px; transition: border-color .22s, transform .22s, box-shadow .22s; overflow: hidden;
    }
    .v3-item:hover { border-color: rgba(255,255,255,.13); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.4); }
    .v3-num { font-size: .62rem; font-weight: 900; color: var(--text4); min-width: 14px; padding-top: 2px; text-align: right; flex-shrink: 0; font-family: var(--mono); }
    .v3-thumb-wrap { position: relative; flex-shrink: 0; width: 100px; height: 56px; border-radius: 7px; overflow: hidden; background: #111; }
    .v3-thumb-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .v3-dur-badge { position: absolute; bottom: 3px; right: 3px; background: rgba(0,0,0,.9); color: var(--text); font-size: .54rem; font-weight: 700; padding: 1px 5px; border-radius: 3px; font-family: var(--mono); }
    .v3-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .v3-title { font-size: .78rem; font-weight: 700; color: var(--text); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-decoration: none; transition: color .18s; }
    .v3-title:hover { color: var(--blue); }
    .v3-channel { font-size: .67rem; color: var(--blue); font-weight: 600; text-decoration: none; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color .18s; }
    .v3-channel:hover { color: #93c5fd; }
    .v3-meta-row { display: flex; gap: 7px; flex-wrap: wrap; align-items: center; margin-top: 1px; }
    .v3-views, .v3-date { font-size: .62rem; color: var(--text4); font-family: var(--mono); }
    .v3-cat-badge { font-size: .56rem; font-weight: 800; color: var(--amber); background: rgba(251,191,36,.06); border: 1px solid rgba(251,191,36,.12); border-radius: 4px; padding: 1px 6px; letter-spacing: .4px; }
    .v3-desc { font-size: .68rem; color: #444; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; margin-top: 2px; }
    @media (max-width: 480px) { .v3-thumb-wrap { width: 76px; height: 44px; } .v3-title { font-size: .74rem; } }

    /* ── DOWNLOAD BUTTONS ── */
    .dl-btn {
      display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px;
      border-radius: var(--radius-sm); font-size: .78rem; font-weight: 700;
      text-decoration: none; transition: all .22s; border: 1px solid transparent;
      position: relative; overflow: hidden;
    }
    .dl-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,.1) 0%, transparent 60%); opacity: 0; transition: opacity .22s; }
    .dl-btn:hover::before { opacity: 1; }
    .dl-mp4 { background: rgba(255,0,0,.08); color: #FF4444; border-color: rgba(255,0,0,.16); }
    .dl-mp4:hover { background: rgba(255,0,0,.16); color: #FF6666; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,0,0,.18); }
    .dl-mp3 { background: rgba(96,165,250,.08); color: var(--blue); border-color: rgba(96,165,250,.16); }
    .dl-mp3:hover { background: rgba(96,165,250,.16); color: #93c5fd; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(96,165,250,.15); }
    .dl-btn svg { width: 13px; height: 13px; flex-shrink: 0; }
    .dl-none { font-size: .78rem; color: var(--text4); font-style: italic; }

    /* ── SKELETON ── */
    .ep-skel { display: none; flex-direction: column; gap: 10px; padding: 4px 0 8px; }
    .skel-line {
      background: linear-gradient(90deg, rgba(255,255,255,.03) 25%, rgba(255,255,255,.065) 50%, rgba(255,255,255,.03) 75%);
      background-size: 200% 100%; animation: shim 1.4s infinite; border-radius: 7px; height: 12px;
    }
    @keyframes shim { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* ── JSON BOX ── */
    .json-actions { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .json-label { font-size: .6rem; font-weight: 800; color: var(--text4); text-transform: uppercase; letter-spacing: 1px; }
    .copy-btn {
      background: rgba(255,255,255,.05); color: var(--text3); border: 1px solid rgba(255,255,255,.08);
      border-radius: 6px; padding: 3px 11px; font-size: .64rem; cursor: pointer; font-weight: 700;
      transition: all .18s; font-family: var(--font);
    }
    .copy-btn:hover { background: rgba(255,255,255,.1); color: var(--text); }
    pre.jbox {
      background: rgba(0,0,0,.4); border: 1px solid rgba(255,255,255,.07); border-radius: var(--radius-sm);
      padding: 16px 18px; font-family: var(--mono); font-size: .7rem; line-height: 1.8;
      overflow-x: auto; max-height: 320px; overflow-y: auto; color: var(--text3); white-space: pre;
    }
    pre.jbox::-webkit-scrollbar { width: 4px; height: 4px; }
    pre.jbox::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
    .jk { color: #FF4444; } .js { color: #86efac; } .jn { color: var(--amber); } .jb { color: #818cf8; }

    /* ── MISC CARDS ── */
    .card {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
      padding: clamp(22px, 4vw, 32px); margin-bottom: 22px;
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      transition: border-color .28s, box-shadow .28s; position: relative; overflow: hidden;
    }
    .card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,.025) 0%, transparent 60%); pointer-events: none; }
    .card:hover { border-color: rgba(255,255,255,.12); box-shadow: 0 12px 40px rgba(0,0,0,.4); }
    .card-title { font-size: .62rem; font-weight: 800; color: var(--text4); text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 16px; display: flex; align-items: center; gap: 9px; }
    .card-title::before { content: ''; width: 3px; height: 12px; background: var(--red); border-radius: 2px; display: inline-block; box-shadow: 0 0 8px rgba(255,0,0,.5); }
    .about p { color: var(--text2); line-height: 1.9; font-size: .87rem; }
    .about code { background: rgba(255,255,255,.07); color: var(--text); padding: 1px 7px; border-radius: 4px; font-size: .88em; font-family: var(--mono); }
    .about strong { color: var(--text); }
    .disc p { color: var(--text2); line-height: 1.9; font-size: .86rem; }
    .disc strong { color: var(--amber); }

    /* ── FAQ ── */
    .faq-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 24px; }
    .faq-item {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm);
      overflow: hidden; transition: border-color .22s, box-shadow .22s;
    }
    .faq-item.open { border-color: rgba(255,0,0,.25); box-shadow: 0 4px 20px rgba(0,0,0,.3); }
    .faq-q {
      display: flex; align-items: center; justify-content: space-between; gap: 14px;
      padding: 16px 20px; cursor: pointer; font-size: .84rem; font-weight: 600; color: var(--text);
      transition: background .2s; line-height: 1.4;
    }
    .faq-q:hover { background: rgba(255,255,255,.025); }
    .faq-icon { font-size: 1.15rem; color: var(--text4); flex-shrink: 0; transition: transform .35s var(--ease-spring), color .2s; line-height: 1; font-weight: 300; }
    .faq-item.open .faq-icon { transform: rotate(45deg); color: var(--red); }
    .faq-a { max-height: 0; overflow: hidden; transition: max-height .38s var(--ease-in-out); }
    .faq-item.open .faq-a { max-height: 500px; }
    .faq-a-inner { padding: 0 20px 18px; font-size: .8rem; color: var(--text2); line-height: 1.85; border-top: 1px solid rgba(255,255,255,.06); }
    .faq-a-inner code { background: rgba(255,255,255,.07); color: var(--text); padding: 1px 7px; border-radius: 4px; font-size: .88em; font-family: var(--mono); }
    .faq-a-inner strong { color: var(--text); }

    /* ── STATS MODAL ── */
    .sm-overlay {
      position: fixed; inset: 0; z-index: 9997;
      background: rgba(0,0,0,.82); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      display: none; align-items: center; justify-content: center; padding: 20px;
    }
    .sm-overlay.open { display: flex; animation: sm-fade .2s ease both; }
    @keyframes sm-fade { from { opacity: 0; } to { opacity: 1; } }
    .sm-modal {
      background: rgba(10,10,10,.99); border: 1px solid rgba(255,255,255,.1);
      border-radius: 24px; padding: 28px 24px 24px; width: min(360px, 100%);
      box-shadow: 0 50px 120px rgba(0,0,0,.97), 0 0 0 1px rgba(255,255,255,.04);
      animation: sm-pop .3s var(--ease-spring) both;
    }
    @keyframes sm-pop { from { opacity: 0; transform: scale(.84) translateY(18px); } to { opacity: 1; transform: none; } }
    .sm-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .sm-title { font-size: .84rem; font-weight: 800; color: var(--text); letter-spacing: .3px; }
    .sm-close {
      background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 8px;
      color: var(--text3); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all .18s; font-size: .75rem; flex-shrink: 0;
    }
    .sm-close:hover { background: rgba(255,255,255,.12); color: var(--text); }
    .sm-circles { display: flex; align-items: flex-start; gap: 14px; justify-content: center; }
    .sm-circle-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; flex: 1; max-width: 145px; }
    .sm-ring-wrap { position: relative; width: 112px; height: 112px; }
    .sm-ring-svg { width: 112px; height: 112px; transform: rotate(-90deg); display: block; }
    .sm-ring-bg { fill: none; stroke-width: 9; }
    .sm-ring-arc { fill: none; stroke-width: 9; stroke-linecap: round; stroke-dasharray: 289; stroke-dashoffset: 289; transition: stroke-dashoffset 1s var(--ease-in-out); }
    .sm-ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; }
    .sm-pct { font-size: 1.28rem; font-weight: 900; font-family: var(--mono); line-height: 1; letter-spacing: -1px; }
    .sm-count { font-size: .6rem; font-weight: 700; color: #555; line-height: 1; }
    .sm-circle-lbl { font-size: .72rem; font-weight: 700; text-align: center; letter-spacing: .2px; }
    .sm-divider { width: 1px; background: rgba(255,255,255,.06); align-self: stretch; margin: 6px 0; }
    .sm-footer { font-size: .6rem; color: #333; text-align: center; margin-top: 22px; font-family: var(--mono); padding-top: 18px; border-top: 1px solid rgba(255,255,255,.05); }
    .stat-clickable { cursor: pointer; transition: all .25s; }
    .stat-clickable:hover { border-color: rgba(255,0,0,.28) !important; background: rgba(255,0,0,.05) !important; transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,.5); }
    .stat-clickable:active { transform: translateY(0); }
    .db-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-left: 6px; vertical-align: middle; flex-shrink: 0; }
    .db-dot.connected { background: var(--green); box-shadow: 0 0 6px rgba(74,222,128,.6); }
    .db-dot.fallback   { background: var(--amber); box-shadow: 0 0 6px rgba(245,158,11,.6); }
    .db-dot.failed     { background: #FF4444; box-shadow: 0 0 6px rgba(255,68,68,.6); }
    .sm-mongo-row { display: flex; align-items: center; justify-content: center; gap: 7px; font-size: .6rem; font-family: var(--mono); margin-top: 8px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.05); }
    .sm-mongo-badge { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 20px; font-size: .58rem; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; }
    .sm-mongo-badge.connected { background: rgba(74,222,128,.07); color: var(--green); border: 1px solid rgba(74,222,128,.17); }
    .sm-mongo-badge.fallback  { background: rgba(245,158,11,.07); color: var(--amber); border: 1px solid rgba(245,158,11,.17); }
    .sm-mongo-badge.failed    { background: rgba(255,68,68,.07); color: #FF4444; border: 1px solid rgba(255,68,68,.17); }

    /* ── HOST BADGE ── */
    .host-badge { margin-top: 14px; display: flex; align-items: center; justify-content: center; }
    .host-pill {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
      border-radius: 24px; padding: 5px 16px; font-size: .66rem; font-weight: 700;
      color: var(--text4); text-decoration: none; transition: all .22s; letter-spacing: .3px;
    }
    .host-pill:hover { background: rgba(255,255,255,.06); color: var(--text3); border-color: var(--border2); }
    .host-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex-shrink: 0; box-shadow: 0 0 6px currentColor; }

    /* ── FOOTER ── */
    footer {
      text-align: center; padding: 36px 24px 32px;
      color: var(--text4); font-size: .72rem;
      border-top: 1px solid rgba(255,255,255,.05);
      position: relative; z-index: 1;
    }
    footer strong { color: var(--text3); }
    footer .tf { color: var(--red); font-weight: 800; }

    /* ══════════════════════════════════════
       HERO GRADIENT BLEED
    ══════════════════════════════════════ */
    .hero::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 100px;
      background: linear-gradient(to bottom, transparent, var(--bg));
      pointer-events: none; z-index: 2;
    }

    /* ══════════════════════════════════════
       CARD 3D TILT
    ══════════════════════════════════════ */
    .ep-card {
      transform-style: preserve-3d; will-change: transform;
    }

    /* ══════════════════════════════════════
       MOBILE
    ══════════════════════════════════════ */
    @media (max-width: 640px) {
      .topbar { padding: 0 16px; height: 56px; }
      .hero { padding: 52px 18px 40px; }
      .wrap { padding: clamp(24px, 4vw, 40px) 14px 80px; }
      .ep-header { padding: 14px 16px; }
      .ep-body-inner { padding: 16px; }
      .r-body { padding: 14px 16px; }
    }

    /* ══════════════════════════════════════
       REDUCED MOTION
    ══════════════════════════════════════ */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: .01ms !important;
        animation-delay: .01ms !important;
      }
      .reveal { opacity: 1 !important; transform: none !important; }
      #grain { animation: none !important; }
    }
  </style>
</head>
<body>

<!-- CURSOR -->
<div id="tf-cursor"></div>

<!-- AURORA -->
<div id="aurora" aria-hidden="true">
  <div class="aurora-orb ao1"></div>
  <div class="aurora-orb ao2"></div>
  <div class="aurora-orb ao3"></div>
</div>
<div id="grid-overlay" aria-hidden="true"></div>
<div id="grain" aria-hidden="true"></div>

<!-- ══════════════════════════════════════
     INTRO
══════════════════════════════════════ -->
<div id="intro" role="status" aria-label="Loading TubeFetch">
  <div id="intro-split-top"></div>
  <div id="intro-split-bottom"></div>
  <div id="intro-grid"></div>
  <div id="intro-aurora">
    <div class="ia1"></div>
    <div class="ia2"></div>
  </div>
  <div id="intro-scanline"></div>
  <div class="i-wrap">
    <div class="i-icon" id="i-icon">
      <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
    </div>
    <div class="i-title">
      <div class="i-word"><span class="i-l" style="--di:0">T</span><span class="i-l" style="--di:1">u</span><span class="i-l" style="--di:2">b</span><span class="i-l" style="--di:3">e</span></div><div class="i-word"><span class="i-l i-l-red" style="--di:4">F</span><span class="i-l i-l-red" style="--di:5">e</span><span class="i-l i-l-red" style="--di:6">t</span><span class="i-l i-l-red" style="--di:7">c</span><span class="i-l i-l-red" style="--di:8">h</span></div>
    </div>
    <div class="i-sub">YouTube Downloader API</div>
    <div class="i-badges">
      <span class="i-badge">No Key Required</span>
      <span class="i-badge">MP4 &amp; MP3</span>
      <span class="i-badge">by MJL</span>
    </div>
    <div class="i-bar-track"><div class="i-bar" id="i-bar"></div></div>
    <div class="i-counter" id="i-counter">0%</div>
    <div class="i-ver">v${version}</div>
  </div>
</div>

<!-- ══════════════════════════════════════
     TERMS OVERLAY
══════════════════════════════════════ -->
<div id="terms-overlay" role="dialog" aria-modal="true" aria-label="Terms and Conditions">
  <div class="terms-modal">
    <div class="terms-head">
      <div class="terms-icon">
        <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <div class="terms-title">Terms &amp; Conditions</div>
      <div class="terms-sub">TubeFetch · Educational Use Only</div>
    </div>
    <div class="terms-body">
      <div class="terms-section">
        <div class="terms-section-title">Usage</div>
        <p class="terms-text">TubeFetch is provided <strong>for educational and personal use only</strong>. This service fetches publicly available YouTube metadata and download links.</p>
      </div>
      <div class="terms-section">
        <div class="terms-section-title">Copyright</div>
        <p class="terms-text">Downloading copyrighted content may violate <strong>YouTube's Terms of Service</strong> and applicable copyright laws. You are solely responsible for how you use any links obtained through TubeFetch.</p>
      </div>
      <div class="terms-section">
        <div class="terms-section-title">Liability</div>
        <p class="terms-text">The developer (<strong>MJL</strong>) accepts <strong>no responsibility</strong> for any misuse of this service. All content belongs to its respective owners.</p>
      </div>
      <div class="terms-section">
        <div class="terms-section-title">No Warranty</div>
        <p class="terms-text">This service is provided <strong>"as is"</strong> without warranty of any kind. Download links may expire. Service availability is not guaranteed.</p>
      </div>
    </div>
    <div class="terms-footer">
      <p class="terms-notice">By clicking Accept, you agree to these terms and confirm you understand the educational nature of this service.</p>
      <div class="terms-btns">
        <button class="terms-accept" onclick="acceptTerms()">Accept &amp; Continue</button>
        <button class="terms-decline" onclick="declineTerms()">Decline</button>
      </div>
    </div>
  </div>
</div>

<!-- ── DECLINE OVERLAY ── -->
<div id="decline-overlay" role="alert">
  <div class="decline-modal">
    <div class="decline-icon">
      <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </div>
    <div class="decline-title">Access Denied</div>
    <p class="decline-msg">You must accept the Terms &amp; Conditions to use TubeFetch. Redirecting you to Google.</p>
    <div class="decline-bar-track"><div class="decline-bar" id="decline-bar"></div></div>
    <div class="decline-redirect" id="decline-redirect">Redirecting in 3s…</div>
  </div>
</div>

<!-- ══════════════════════════════════════
     STATS MODAL
══════════════════════════════════════ -->
<div class="sm-overlay" id="sm-overlay" onclick="smOutsideClick(event)">
  <div class="sm-modal" id="sm-modal">
    <div class="sm-head">
      <span class="sm-title">📊 API Call Analytics</span>
      <button class="sm-close" onclick="closeStatsPopup()">✕</button>
    </div>
    <div class="sm-circles">
      <div class="sm-circle-wrap">
        <div class="sm-ring-wrap">
          <svg class="sm-ring-svg" viewBox="0 0 112 112">
            <circle class="sm-ring-bg" cx="56" cy="56" r="46" stroke="rgba(74,222,128,.12)"/>
            <circle class="sm-ring-arc" id="sm-arc-s" cx="56" cy="56" r="46" stroke="#4ade80"/>
          </svg>
          <div class="sm-ring-center">
            <span class="sm-pct" id="sm-pct-s" style="color:#4ade80">—</span>
            <span class="sm-count" id="sm-cnt-s">success</span>
          </div>
        </div>
        <div class="sm-circle-lbl" style="color:#4ade80">Success</div>
      </div>
      <div class="sm-divider"></div>
      <div class="sm-circle-wrap">
        <div class="sm-ring-wrap">
          <svg class="sm-ring-svg" viewBox="0 0 112 112">
            <circle class="sm-ring-bg" cx="56" cy="56" r="46" stroke="rgba(255,68,68,.12)"/>
            <circle class="sm-ring-arc" id="sm-arc-e" cx="56" cy="56" r="46" stroke="#FF4444"/>
          </svg>
          <div class="sm-ring-center">
            <span class="sm-pct" id="sm-pct-e" style="color:#FF4444">—</span>
            <span class="sm-count" id="sm-cnt-e">errors</span>
          </div>
        </div>
        <div class="sm-circle-lbl" style="color:#FF4444">Errors</div>
      </div>
    </div>
    <div class="sm-mongo-row">
      <span id="sm-mongo-badge" class="sm-mongo-badge fallback">Connecting…</span>
    </div>
    <div class="sm-footer" id="sm-footer">— / — total · updated live</div>
  </div>
</div>

<!-- ══════════════════════════════════════
     TOPBAR
══════════════════════════════════════ -->
<nav class="topbar">
  <a class="topbar-logo" href="#">
    <div class="topbar-icon">
      <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
    </div>
    <span class="topbar-name">TubeFetch</span>
    <span class="topbar-tf">TF</span>
    <span class="topbar-ver">v${version}</span>
  </a>
  <div class="topbar-right">
    <div class="nav-links">
      <a href="#endpoints">Endpoints</a>
      <a href="#faq">FAQ</a>
      <a href="#about">About</a>
    </div>
    <div class="bell-wrap">
      <button class="bell-btn" id="bell-btn" onclick="toggleBell()" title="Changelog" aria-label="Open changelog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span class="bell-dot" id="bell-dot"></span>
      </button>
      <div class="bell-panel" id="bell-panel" role="dialog" aria-label="Changelog">
        <div class="bell-head">
          <span class="bell-head-title">Changelog</span>
          <button class="bell-close" onclick="closeBell()" aria-label="Close changelog">✕</button>
        </div>
        <div class="bell-list">${clItems}</div>
      </div>
    </div>
  </div>
</nav>

<!-- ══════════════════════════════════════
     HERO
══════════════════════════════════════ -->
<div class="hero">
  <canvas id="hero-canvas" aria-hidden="true"></canvas>
  <div class="hero-content">
    <div class="hero-eyebrow">YouTube Downloader API</div>
    <h1>Tube<span class="hero-tf" data-text="Fetch">Fetch</span></h1>
    <div class="hero-sub">Real-time metadata &middot; MP4 HD &amp; MP3 download links &middot; Top 10 search results &middot; by MJL</div>
    <div class="hero-badges">
      <span class="hbadge">v${version}</span>
      <span class="hbadge">by MJL</span>
      <span class="hbadge">YouTube Only</span>
      <span class="hbadge">No Key Required</span>
    </div>
    <div class="stats-bar">
      <div class="stat-item stat-clickable" onclick="openStatsPopup()" title="View success &amp; error breakdown">
        <span class="stat-num red" id="stat-count">—<span class="db-dot fallback" id="db-dot" title="Connecting to MongoDB…"></span></span>
        <span class="stat-lbl">API Calls ↗</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">v${version}</span>
        <span class="stat-lbl">Version</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">5m</span>
        <span class="stat-lbl">Cache TTL</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">3</span>
        <span class="stat-lbl">Endpoints</span>
      </div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════
     MAIN
══════════════════════════════════════ -->
<div class="wrap">

  <div class="sec-label reveal" id="endpoints">⚡ Endpoints — click to expand &amp; test</div>
  <div class="ep-list">

    <!-- V1 -->
    <div class="ep-card reveal reveal-d1" id="ep0">
      <div class="ep-header" onclick="toggleEp(0)">
        <span class="ep-method">GET</span>
        <span class="ep-path">/api/v1/q?=(url or title)</span>
        <span class="ep-desc-label">Full metadata + downloads</span>
        <span class="ep-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>
      </div>
      <div class="ep-body">
        <div class="ep-body-inner">
          <p class="ep-info">Pass any YouTube <code>URL</code> or plain search title. Returns full metadata — title, author, thumbnail, duration, views, description, <strong>category</strong> — plus direct <code>MP4</code> &amp; <code>MP3</code> download links. Results cached <strong>5 minutes</strong>. Every response includes <code>ApiCount</code>.</p>
          <div class="ep-input-row">
            <input class="ep-input" id="q0" type="text" placeholder="e.g. bohemian rhapsody  or  https://youtu.be/…" onkeydown="if(event.key==='Enter')fetchEp(0)" autocomplete="off"/>
            <button class="ep-fetch-btn ripple-container" id="btn0" onclick="addRipple(event);fetchEp(0)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Search</span>
            </button>
          </div>
          <div class="ep-skel" id="skel0">
            <div class="skel-line" style="width:55%;height:14px"></div>
            <div class="skel-line" style="width:30%"></div>
            <div class="skel-line" style="width:75%"></div>
            <div class="skel-line" style="width:68%"></div>
            <div class="skel-line" style="width:42%;height:30px;border-radius:8px;margin-top:4px"></div>
          </div>
          <div class="ep-result" id="res0">
            <div class="ep-result-meta">
              <span class="ep-status" id="stat0"></span>
              <span class="ep-ms" id="ms0"></span>
              <span class="ep-cached" id="cac0" style="display:none">⚡ Cached</span>
              <span class="ep-apicount" id="apc0"></span>
            </div>
            <div class="copy-url-strip" id="curl0" style="display:none">
              <code id="curl0-text"></code>
              <button class="copy-url-btn" onclick="copyUrl(0)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy URL
              </button>
            </div>
            <div class="r-card" id="rcard0" style="display:none">
              <div class="r-inner">
                <div class="r-thumb" id="r-thumb-wrap">
                  <img id="r-thumb-img" src="" alt="" class="r-thumb-img"/>
                  <span class="r-dur" id="r-dur" style="display:none"></span>
                  <span class="r-cached-badge" id="r-cached-b"></span>
                  <div class="r-play-overlay" id="r-play-overlay" onclick="startPreview()">
                    <div class="r-play-circle"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
                    <span class="r-play-label">Preview</span>
                  </div>
                  <div class="r-countdown-wrap" id="r-countdown-wrap" style="display:none">
                    <svg class="r-ring-svg" viewBox="0 0 80 80">
                      <circle class="r-ring-bg" cx="40" cy="40" r="32"/>
                      <circle class="r-ring-arc" id="r-ring-arc" cx="40" cy="40" r="32"/>
                    </svg>
                    <span class="r-countdown-n" id="r-countdown-n">5</span>
                  </div>
                  <div class="r-yt-wrap" id="r-yt-wrap">
                    <div id="r-yt-player"></div>
                  </div>
                </div>
                <div class="r-body">
                  <div class="r-title" id="r-title"></div>
                  <a class="r-author" id="r-author" href="#" target="_blank" rel="noopener"></a>
                  <div class="r-stats" id="r-stats">
                    <span class="cat-badge" id="r-cat"></span>
                  </div>
                  <div class="r-desc-wrap" id="r-desc-wrap">
                    <div class="r-desc-text" id="r-desc"></div>
                    <button class="r-more" id="r-more" onclick="toggleDesc()">Read more</button>
                  </div>
                  <div class="r-dl" id="r-dl"></div>
                </div>
              </div>
            </div>
            <div class="json-actions">
              <span class="json-label">Raw Response</span>
              <button class="copy-btn" onclick="copyRaw(0)">Copy JSON</button>
            </div>
            <pre class="jbox" id="raw0"></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- V2 -->
    <div class="ep-card reveal reveal-d2" id="ep3">
      <div class="ep-header" onclick="toggleEp(3)">
        <span class="ep-method v2">GET</span>
        <span class="ep-path">/api/v2/q?=(url or title)</span>
        <span class="ep-desc-label">Fast — links only <span class="ep-badge-fast">⚡ v2</span></span>
        <span class="ep-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>
      </div>
      <div class="ep-body">
        <div class="ep-body-inner">
          <p class="ep-info">Faster than v1 — skips all metadata, fetches only direct <code>MP4</code> &amp; <code>MP3</code> download links. Response includes <code>credit</code>, <code>version</code>, <code>ApiCount</code>, and <code>ms</code> timing. No title, no extra fields.</p>
          <div class="ep-input-row">
            <input class="ep-input" id="q3" type="text" placeholder="e.g. never gonna give you up  or  https://youtu.be/…" onkeydown="if(event.key==='Enter')fetchEp(3)" autocomplete="off"/>
            <button class="ep-fetch-btn ripple-container" id="btn3" onclick="addRipple(event);fetchEp(3)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Search</span>
            </button>
          </div>
          <div class="ep-skel" id="skel3">
            <div class="skel-line" style="width:60%;height:14px"></div>
            <div class="skel-line" style="width:42%;height:30px;border-radius:8px;margin-top:4px"></div>
          </div>
          <div class="ep-result" id="res3">
            <div class="ep-result-meta">
              <span class="ep-status" id="stat3"></span>
              <span class="ep-ms" id="ms3"></span>
              <span class="ep-cached" id="cac3" style="display:none">⚡ Cached</span>
              <span class="ep-apicount" id="apc3"></span>
            </div>
            <div class="copy-url-strip" id="curl3" style="display:none">
              <code id="curl3-text"></code>
              <button class="copy-url-btn" onclick="copyUrl(3)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy URL
              </button>
            </div>
            <div class="v2-card" id="v2card" style="display:none">
              <div class="v2-label">Download Links</div>
              <div class="v2-dl" id="v2-dl"></div>
            </div>
            <div class="json-actions">
              <span class="json-label">Raw Response</span>
              <button class="copy-btn" onclick="copyRaw(3)">Copy JSON</button>
            </div>
            <pre class="jbox" id="raw3"></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- V3 -->
    <div class="ep-card reveal reveal-d3" id="ep4">
      <div class="ep-header" onclick="toggleEp(4)">
        <span class="ep-method v3">GET</span>
        <span class="ep-path">/api/v3/q?=(title or keyword)</span>
        <span class="ep-desc-label">Top 10 search results <span class="ep-badge-new">★ New</span></span>
        <span class="ep-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>
      </div>
      <div class="ep-body">
        <div class="ep-body-inner">
          <p class="ep-info">Returns up to <strong>10 ranked YouTube search results</strong> — each with url, title, description, channel name &amp; url, published date, duration, thumbnail, views, and <strong>category</strong>. Includes <code>credit</code>, <code>version</code>, <code>ApiCount</code>, and <code>ms</code>. No download links — use v1/v2 for those.</p>
          <div class="ep-input-row">
            <input class="ep-input" id="q4" type="text" placeholder="e.g. top hits 2025  or  relaxing lofi music" onkeydown="if(event.key==='Enter')fetchEp(4)" autocomplete="off"/>
            <button class="ep-fetch-btn ripple-container" id="btn4" onclick="addRipple(event);fetchEp(4)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Search</span>
            </button>
          </div>
          <div class="ep-skel" id="skel4">
            <div class="skel-line" style="width:70%;height:14px"></div>
            <div class="skel-line" style="width:55%"></div>
            <div class="skel-line" style="width:60%;height:14px"></div>
            <div class="skel-line" style="width:45%"></div>
          </div>
          <div class="ep-result" id="res4">
            <div class="ep-result-meta">
              <span class="ep-status" id="stat4"></span>
              <span class="ep-ms" id="ms4"></span>
              <span class="ep-apicount" id="apc4"></span>
            </div>
            <div class="copy-url-strip" id="curl4" style="display:none">
              <code id="curl4-text"></code>
              <button class="copy-url-btn" onclick="copyUrl(4)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy URL
              </button>
            </div>
            <div class="v3-list" id="v3list" style="display:none"></div>
            <div class="json-actions">
              <span class="json-label">Raw Response</span>
              <button class="copy-btn" onclick="copyRaw(4)">Copy JSON</button>
            </div>
            <pre class="jbox" id="raw4"></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Uptime -->
    <div class="ep-card reveal reveal-d4" id="ep1">
      <div class="ep-header" onclick="toggleEp(1)">
        <span class="ep-method">GET</span>
        <span class="ep-path">/api/uptime</span>
        <span class="ep-desc-label">Server uptime &amp; status</span>
        <span class="ep-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>
      </div>
      <div class="ep-body">
        <div class="ep-body-inner">
          <p class="ep-info">Returns the server uptime in seconds plus a status string. Includes <code>ApiCount</code>. Useful for monitoring or health dashboards.</p>
          <div class="ep-input-row">
            <button class="ep-fetch-btn ripple-container" id="btn1" onclick="addRipple(event);fetchEp(1)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg><span>Fetch</span>
            </button>
          </div>
          <div class="ep-skel" id="skel1"><div class="skel-line" style="width:55%"></div><div class="skel-line" style="width:38%"></div></div>
          <div class="ep-result" id="res1">
            <div class="ep-result-meta">
              <span class="ep-status" id="stat1"></span>
              <span class="ep-ms" id="ms1"></span>
              <span class="ep-apicount" id="apc1"></span>
            </div>
            <div class="copy-url-strip" id="curl1"><code id="curl1-text">/api/uptime</code><button class="copy-url-btn" onclick="copyUrl(1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy URL</button></div>
            <div class="json-actions"><span class="json-label">Raw Response</span><button class="copy-btn" onclick="copyRaw(1)">Copy JSON</button></div>
            <pre class="jbox" id="raw1"></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Health -->
    <div class="ep-card reveal" id="ep2">
      <div class="ep-header" onclick="toggleEp(2)">
        <span class="ep-method">GET</span>
        <span class="ep-path">/api/healthz</span>
        <span class="ep-desc-label">Health check</span>
        <span class="ep-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>
      </div>
      <div class="ep-body">
        <div class="ep-body-inner">
          <p class="ep-info">Simple liveness probe. Returns <code>ok</code> when the server is healthy. Includes <code>ApiCount</code>. Used by Render, Replit, and Vercel.</p>
          <div class="ep-input-row">
            <button class="ep-fetch-btn ripple-container" id="btn2" onclick="addRipple(event);fetchEp(2)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg><span>Fetch</span>
            </button>
          </div>
          <div class="ep-skel" id="skel2"><div class="skel-line" style="width:38%"></div></div>
          <div class="ep-result" id="res2">
            <div class="ep-result-meta">
              <span class="ep-status" id="stat2"></span>
              <span class="ep-ms" id="ms2"></span>
              <span class="ep-apicount" id="apc2"></span>
            </div>
            <div class="copy-url-strip" id="curl2"><code id="curl2-text">/api/healthz</code><button class="copy-url-btn" onclick="copyUrl(2)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy URL</button></div>
            <div class="json-actions"><span class="json-label">Raw Response</span><button class="copy-btn" onclick="copyRaw(2)">Copy JSON</button></div>
            <pre class="jbox" id="raw2"></pre>
          </div>
        </div>
      </div>
    </div>

  </div><!-- /ep-list -->

  <!-- FAQ -->
  <div class="sec-label reveal" id="faq">❓ Frequently Asked Questions</div>
  <div class="faq-list reveal">${faqItems}</div>

  <div class="card about reveal" id="about">
    <div class="card-title">About TubeFetch</div>
    <p>Pass any YouTube URL or plain search title to <code>/api/v1/q</code> for full metadata or <code>/api/v2/q</code> for a faster response with just the download links. Use <code>/api/v3/q</code> to get a ranked list of up to 10 search results. Get direct <strong>MP4 HD</strong> and <strong>MP3</strong> URLs ready for bots, apps, or scripts. Results are cached for <strong>5 minutes</strong>. Every response includes a <strong>ms</strong> timing field and an <strong>ApiCount</strong> showing the total number of API calls served.</p>
  </div>

  <div class="card disc reveal" id="disclaimer">
    <div class="card-title">Copyright Disclaimer</div>
    <p>This project is for <strong>educational and personal use only</strong>. Downloading copyrighted content may violate YouTube's Terms of Service and applicable copyright laws. The developer (<strong>MJL</strong>) accepts no responsibility for any misuse. All content belongs to respective owners.</p>
  </div>

</div><!-- /wrap -->

<footer>
  <p>&copy; 2026 <strong>MJL</strong> &middot; <span class="tf">TubeFetch</span> <strong>v${version}</strong> &middot; For educational purposes only</p>
  <div class="host-badge" id="host-badge"></div>
</footer>

<script>
/* ════════════════════════════════
   CURSOR
════════════════════════════════ */
(function(){
  var cur=document.getElementById('tf-cursor');
  if(!cur||window.matchMedia('(hover:none)').matches)return;
  var cx=0,cy=0,tx=0,ty=0,raf;
  document.addEventListener('mousemove',function(e){ tx=e.clientX; ty=e.clientY; });
  function loop(){
    cx+=(tx-cx)*.14; cy+=(ty-cy)*.14;
    cur.style.transform='translate3d('+(cx-10)+'px,'+(cy-10)+'px,0)';
    raf=requestAnimationFrame(loop);
  }
  loop();
  document.querySelectorAll('a,button,input,textarea,.ep-header,.faq-q,.stat-item,.hbadge').forEach(function(el){
    el.addEventListener('mouseenter',function(){ cur.classList.add('hovering'); });
    el.addEventListener('mouseleave',function(){ cur.classList.remove('hovering'); });
  });
})();

/* ════════════════════════════════
   RIPPLE
════════════════════════════════ */
function addRipple(e){
  var btn=e.currentTarget;
  var rect=btn.getBoundingClientRect();
  var r=document.createElement('span');
  var d=Math.max(btn.offsetWidth,btn.offsetHeight);
  r.className='ripple-el';
  r.style.cssText='width:'+d+'px;height:'+d+'px;left:'+(e.clientX-rect.left-d/2)+'px;top:'+(e.clientY-rect.top-d/2)+'px';
  btn.appendChild(r);
  setTimeout(function(){ r.remove(); },700);
}

/* ════════════════════════════════
   INTRO
════════════════════════════════ */
var introSkipped=false;
(function(){
  var bar=document.getElementById('i-bar');
  var counterEl=document.getElementById('i-counter');
  var reducedMotion=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  requestAnimationFrame(function(){ requestAnimationFrame(function(){
    if(bar) bar.style.width='100%';
  }); });
  if(counterEl && !reducedMotion){
    var cnt=0;
    var cntIntvl=setInterval(function(){
      cnt=Math.min(100,cnt+1);
      counterEl.textContent=cnt+'%';
      if(cnt>=100) clearInterval(cntIntvl);
    },36);
  }
  var timer=setTimeout(function(){ if(!introSkipped) endIntro(); }, 5000);
  window._introTimer=timer;
})();
function endIntro(){
  var intro=document.getElementById('intro');
  if(!intro||intro.style.display==='none')return;
  var reducedMotion=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(reducedMotion){ intro.style.display='none'; showTerms(); return; }
  var wrap=intro.querySelector('.i-wrap');
  if(wrap){ wrap.style.transition='opacity .25s ease'; wrap.style.opacity='0'; }
  var scanline=document.getElementById('intro-scanline');
  if(scanline) scanline.style.display='none';
  setTimeout(function(){
    intro.classList.add('splitting');
    setTimeout(function(){ intro.style.display='none'; showTerms(); }, 740);
  }, 180);
}

/* ════════════════════════════════
   TERMS
════════════════════════════════ */
function showTerms(){
  var o=document.getElementById('terms-overlay');
  o.classList.add('show');
}
function acceptTerms(){
  var o=document.getElementById('terms-overlay');
  o.classList.remove('show'); o.classList.add('out');
  setTimeout(function(){ o.style.display='none'; o.classList.remove('out'); initParticles(); initReveal(); fetchStats(); }, 320);
}
function declineTerms(){
  var o=document.getElementById('terms-overlay');
  o.classList.remove('show'); o.style.display='none';
  var d=document.getElementById('decline-overlay');
  d.classList.add('show');
  requestAnimationFrame(function(){ requestAnimationFrame(function(){
    var b=document.getElementById('decline-bar'); if(b) b.style.width='100%';
  }); });
  var secs=3;
  var ri=setInterval(function(){
    secs--;
    var el=document.getElementById('decline-redirect');
    if(el) el.textContent='Redirecting in '+secs+'s\u2026';
    if(secs<=0){ clearInterval(ri); window.location.href='https://www.google.com'; }
  },1000);
}

/* ════════════════════════════════
   LIVE STATS
════════════════════════════════ */
function fetchStats(){
  fetch('/api/stats').then(function(r){ return r.json(); }).then(function(d){
    var el=document.getElementById('stat-count');
    var dot=document.getElementById('db-dot');
    if(el&&typeof d.ApiCount==='number'){
      el.childNodes[0].nodeValue=d.ApiCount.toLocaleString();
    }
    if(dot){
      var connected=d.mongoConnected===true;
      var status=d.mongoStatus||'unknown';
      dot.className='db-dot '+(connected?'connected':(status==='failed'||status==='no-uri'?'failed':'fallback'));
      dot.title=connected?'MongoDB connected — counts persist across restarts':'MongoDB '+status+' — counts are in-memory only';
    }
  }).catch(function(){});
}
setInterval(fetchStats,5000);

/* ════════════════════════════════
   PARTICLES
════════════════════════════════ */
var PCV,PCTX,PW,PH,PARTS=[],MOUSE={x:-9999,y:-9999},RAF_RUNNING=false;
function initParticles(){
  PCV=document.getElementById('hero-canvas');
  if(!PCV)return;
  var hero=PCV.parentElement;
  PCTX=PCV.getContext('2d');
  PW=PCV.width=hero.offsetWidth;
  PH=PCV.height=hero.offsetHeight;
  PARTS=[];
  var count=PW<640?20:35;
  for(var i=0;i<count;i++){
    PARTS.push({
      x:Math.random()*PW,y:Math.random()*PH,
      vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.5,
      r:Math.random()*1.6+.4,a:Math.random()*.2+.06
    });
  }
  hero.addEventListener('mousemove',function(e){ var rect=hero.getBoundingClientRect(); MOUSE.x=e.clientX-rect.left; MOUSE.y=e.clientY-rect.top; });
  hero.addEventListener('mouseleave',function(){ MOUSE.x=-9999; MOUSE.y=-9999; });
  window.addEventListener('resize',function(){ PW=PCV.width=hero.offsetWidth; PH=PCV.height=hero.offsetHeight; });
  if(!RAF_RUNNING){ RAF_RUNNING=true; tickParticles(); }
}
var _ptLastT=0;
var _ptLines=window.innerWidth>=640;
function tickParticles(ts){
  requestAnimationFrame(tickParticles);
  if(document.hidden) return;
  if(ts-_ptLastT<33) return;
  _ptLastT=ts;
  PCTX.clearRect(0,0,PW,PH);
  for(var i=0;i<PARTS.length;i++){
    var p=PARTS[i];
    var mx=p.x-MOUSE.x,my=p.y-MOUSE.y,md=Math.sqrt(mx*mx+my*my);
    if(md<100&&md>0){ var f=(100-md)/100*.045; p.vx+=mx/md*f; p.vy+=my/md*f; }
    var sp=Math.sqrt(p.vx*p.vx+p.vy*p.vy);
    if(sp>1.5){ p.vx=p.vx/sp*1.5; p.vy=p.vy/sp*1.5; }
    p.x+=p.vx; p.y+=p.vy;
    if(p.x<0){p.x=0;p.vx*=-1;} if(p.x>PW){p.x=PW;p.vx*=-1;}
    if(p.y<0){p.y=0;p.vy*=-1;} if(p.y>PH){p.y=PH;p.vy*=-1;}
    PCTX.beginPath(); PCTX.arc(p.x,p.y,p.r,0,6.2832);
    PCTX.fillStyle='rgba(255,255,255,'+p.a+')'; PCTX.fill();
    if(_ptLines){
      for(var j=i+1;j<PARTS.length;j++){
        var q=PARTS[j],dx=p.x-q.x,dy=p.y-q.y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<120){
          PCTX.beginPath(); PCTX.moveTo(p.x,p.y); PCTX.lineTo(q.x,q.y);
          PCTX.strokeStyle='rgba(255,80,80,'+(0.1*(1-d/120))+')';
          PCTX.lineWidth=.7; PCTX.stroke();
        }
      }
    }
  }
}

/* ════════════════════════════════
   SCROLL REVEAL
════════════════════════════════ */
function initReveal(){
  var els=document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){ els.forEach(function(el){ el.classList.add('in-view'); }); return; }
  var io=new IntersectionObserver(function(entries){ entries.forEach(function(e){ if(e.isIntersecting) e.target.classList.add('in-view'); }); },{threshold:.07});
  els.forEach(function(el){ io.observe(el); });
}

/* ════════════════════════════════
   BELL
════════════════════════════════ */
var bellOpen=false;
function toggleBell(){ bellOpen?closeBell():openBell(); }
function openBell(){
  var p=document.getElementById('bell-panel'),b=document.getElementById('bell-btn');
  bellOpen=true; b.classList.add('active');
  document.getElementById('bell-dot').style.display='none';
  p.classList.remove('closing'); p.classList.add('opening');
  setTimeout(function(){ p.classList.remove('opening'); p.classList.add('open'); },240);
  setTimeout(function(){ document.addEventListener('click',bellOutside,true); },10);
}
function closeBell(){
  var p=document.getElementById('bell-panel'),b=document.getElementById('bell-btn');
  bellOpen=false; b.classList.remove('active');
  document.removeEventListener('click',bellOutside,true);
  p.classList.remove('open','opening'); p.classList.add('closing');
  setTimeout(function(){ p.classList.remove('closing'); },180);
}
function bellOutside(e){ if(!document.querySelector('.bell-wrap').contains(e.target)) closeBell(); }

/* ════════════════════════════════
   ACCORDION
════════════════════════════════ */
function toggleEp(n){ document.getElementById('ep'+n).classList.toggle('open'); }

/* ════════════════════════════════
   FAQ
════════════════════════════════ */
function toggleFaq(i){ document.getElementById('faq'+i).classList.toggle('open'); }

/* ════════════════════════════════
   STATS POPUP
════════════════════════════════ */
function openStatsPopup(){
  var ov=document.getElementById('sm-overlay');
  ov.classList.add('open');
  fetch('/api/stats').then(function(r){ return r.json(); }).then(function(d){
    var total=d.ApiCount||0;
    var succ=d.successCount||0;
    var err=d.errorCount||0;
    var sp=total>0?Math.round(succ/total*100):0;
    var ep=total>0?Math.round(err/total*100):0;
    document.getElementById('sm-pct-s').textContent=sp+'%';
    document.getElementById('sm-cnt-s').textContent=succ+' calls';
    document.getElementById('sm-pct-e').textContent=ep+'%';
    document.getElementById('sm-cnt-e').textContent=err+' calls';
    document.getElementById('sm-footer').textContent=total.toLocaleString()+' total · updated live';
    var arcS=document.getElementById('sm-arc-s');
    var arcE=document.getElementById('sm-arc-e');
    var circ=289;
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      if(arcS) arcS.style.strokeDashoffset=String(circ-(circ*sp/100));
      if(arcE) arcE.style.strokeDashoffset=String(circ-(circ*ep/100));
    }); });
    var connected=d.mongoConnected===true;
    var status=d.mongoStatus||'unknown';
    var badge=document.getElementById('sm-mongo-badge');
    if(badge){
      var cls=connected?'connected':(status==='failed'||status==='no-uri'?'failed':'fallback');
      badge.className='sm-mongo-badge '+cls;
      badge.textContent=connected?'MongoDB Connected':(status==='no-uri'?'No URI Set':'In-Memory Fallback');
    }
  }).catch(function(){});
}
function closeStatsPopup(){ document.getElementById('sm-overlay').classList.remove('open'); }
function smOutsideClick(e){ if(e.target===document.getElementById('sm-overlay')) closeStatsPopup(); }

/* ════════════════════════════════
   STATE
════════════════════════════════ */
var rawStore={0:'',1:'',2:'',3:'',4:''};
var urlStore={0:'',1:'',2:'',3:'',4:''};
var descExpanded=false;
var v1VideoId='';
var ytPlayerInstance=null;
var ytApiReady=false;
var ytApiCallbacks=[];
var cdTimer=null,cdInterval=null;

/* ════════════════════════════════
   UTILS
════════════════════════════════ */
function sv(id,vis,t){ var el=document.getElementById(id); if(el) el.style.display=vis?(t||'block'):'none'; }
function fmtViews(n){
  if(!n)return null;
  if(n>=1e9)return(n/1e9).toFixed(1).replace(/\\.0$/,'')+'B views';
  if(n>=1e6)return(n/1e6).toFixed(1).replace(/\\.0$/,'')+'M views';
  if(n>=1e3)return(n/1e3).toFixed(1).replace(/\\.0$/,'')+'K views';
  return n.toLocaleString()+' views';
}
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function hl(raw){
  var e=function(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  return e(raw).replace(
    /("(?:[^"\\\\]|\\\\.)*")(\\s*:)|("(?:[^"\\\\]|\\\\.)*")|(\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)|(\\btrue\\b|\\bfalse\\b|\\bnull\\b)/g,
    function(_,key,col,str,num,bool){
      if(key)return'<span class="jk">'+key+'</span>'+col;
      if(str)return'<span class="js">'+str+'</span>';
      if(num)return'<span class="jn">'+num+'</span>';
      if(bool)return'<span class="jb">'+bool+'</span>';
      return _;
    }
  );
}
function dlIcon(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'; }
function copyRaw(n){
  if(!rawStore[n])return;
  navigator.clipboard.writeText(rawStore[n]).then(function(){
    var b=document.querySelector('#res'+n+' .copy-btn');
    if(b){ var o=b.textContent; b.textContent='Copied!'; setTimeout(function(){ b.textContent=o; },1500); }
  });
}
function copyUrl(n){
  var u=urlStore[n]||document.getElementById('curl'+n+'-text')&&document.getElementById('curl'+n+'-text').textContent;
  if(!u)return;
  navigator.clipboard.writeText(u).then(function(){
    var b=document.querySelector('#curl'+n+' .copy-url-btn');
    if(b){ var h=b.innerHTML; b.textContent='Copied!'; setTimeout(function(){ b.innerHTML=h; },1500); }
  });
}
function showApiCount(n,data){
  var el=document.getElementById('apc'+n);
  if(!el)return;
  if(typeof data==='object'&&data&&typeof data.ApiCount==='number'){
    el.textContent='Call #'+data.ApiCount;
    el.style.display='inline-flex';
    var sc=document.getElementById('stat-count');
    if(sc) sc.childNodes[0].nodeValue=data.ApiCount.toLocaleString();
  } else { el.style.display='none'; }
}

/* ════════════════════════════════
   V3 RESULT LIST
════════════════════════════════ */
function renderV3List(results){
  var list=document.getElementById('v3list');
  if(!list)return;
  if(!results||!results.length){
    list.innerHTML='<div style="font-size:.8rem;color:var(--text4);padding:8px 0">No results found.</div>';
    sv('v3list',true,'block'); return;
  }
  var html='';
  for(var i=0;i<results.length;i++){
    var v=results[i];
    var thumb=esc(v.thumbnail||'');
    var title=esc(v.title||'');
    var chanName=esc(v.channel_name||'');
    var chanUrl=esc(v.channel_url||'#');
    var dur=esc(v.duration||'');
    var views=v.views?fmtViews(v.views):'';
    var date=esc(v.published||'');
    var cat=esc(v.category||'');
    var url=esc(v.url||'#');
    var desc=v.description?esc(v.description.slice(0,120)):'';
    html+='<div class="v3-item">';
    html+='<div class="v3-num">'+(i+1)+'</div>';
    html+='<div class="v3-thumb-wrap"><img class="v3-thumb-img" src="'+thumb+'" alt="" loading="lazy"/>';
    if(dur) html+='<span class="v3-dur-badge">'+dur+'</span>';
    html+='</div>';
    html+='<div class="v3-info">';
    html+='<a class="v3-title" href="'+url+'" target="_blank" rel="noopener noreferrer">'+title+'</a>';
    html+='<a class="v3-channel" href="'+chanUrl+'" target="_blank" rel="noopener noreferrer">'+chanName+'</a>';
    html+='<div class="v3-meta-row">';
    if(views) html+='<span class="v3-views">'+views+'</span>';
    if(date) html+='<span class="v3-date">'+date+'</span>';
    if(cat) html+='<span class="v3-cat-badge">'+cat+'</span>';
    html+='</div>';
    if(desc) html+='<div class="v3-desc">'+desc+'</div>';
    html+='</div></div>';
  }
  list.innerHTML=html; sv('v3list',true,'block');
}

/* ════════════════════════════════
   VIDEO PREVIEW
════════════════════════════════ */
function resetVideoPreview(){
  clearTimers();
  sv('r-play-overlay',true,'flex'); sv('r-countdown-wrap',false); sv('r-yt-wrap',false);
  var arc=document.getElementById('r-ring-arc');
  if(arc){ arc.style.transition='none'; arc.style.strokeDashoffset='201'; }
  if(ytPlayerInstance){ try{ ytPlayerInstance.destroy(); }catch(e){} ytPlayerInstance=null; }
  var pd=document.getElementById('r-yt-player'); if(pd) pd.innerHTML='';
  var img=document.getElementById('r-thumb-img'); if(img) img.style.opacity='1';
}
function clearTimers(){ if(cdTimer){clearTimeout(cdTimer);cdTimer=null;} if(cdInterval){clearInterval(cdInterval);cdInterval=null;} }
function startPreview(){
  if(!v1VideoId)return;
  sv('r-play-overlay',false); sv('r-countdown-wrap',true,'flex');
  document.getElementById('r-countdown-n').textContent='5';
  var img=document.getElementById('r-thumb-img'); if(img) img.style.opacity='.3';
  var arc=document.getElementById('r-ring-arc');
  arc.style.transition='none'; arc.style.strokeDashoffset='201';
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ arc.style.transition='stroke-dashoffset 5s linear'; arc.style.strokeDashoffset='0'; }); });
  var secs=4;
  cdInterval=setInterval(function(){ document.getElementById('r-countdown-n').textContent=String(secs); secs--; if(secs<0){clearInterval(cdInterval);cdInterval=null;} },1000);
  cdTimer=setTimeout(function(){ launchVideo(); },5000);
}
function launchVideo(){
  sv('r-countdown-wrap',false);
  var img=document.getElementById('r-thumb-img');
  if(img){ img.style.transition='opacity .5s ease'; img.style.opacity='0'; }
  var wrap=document.getElementById('r-yt-wrap'); wrap.style.display='block';
  withYtApi(function(){
    if(ytPlayerInstance){ try{ ytPlayerInstance.destroy(); }catch(e){} ytPlayerInstance=null; }
    var pd=document.getElementById('r-yt-player'); if(pd) pd.innerHTML='';
    ytPlayerInstance=new YT.Player('r-yt-player',{
      videoId:v1VideoId,width:'100%',height:'100%',
      playerVars:{autoplay:1,rel:0,modestbranding:1,playsinline:1,controls:1},
      events:{onReady:function(e){ e.target.playVideo(); }}
    });
  });
}
function withYtApi(cb){
  if(ytApiReady){ cb(); return; }
  ytApiCallbacks.push(cb);
  if(!document.getElementById('yt-iframe-api')){
    var s=document.createElement('script');
    s.id='yt-iframe-api'; s.src='https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }
}
window.onYouTubeIframeAPIReady=function(){
  ytApiReady=true;
  ytApiCallbacks.forEach(function(cb){ cb(); });
  ytApiCallbacks=[];
};

/* ════════════════════════════════
   DESC TOGGLE
════════════════════════════════ */
function toggleDesc(){
  descExpanded=!descExpanded;
  document.getElementById('r-desc').classList.toggle('exp',descExpanded);
  document.getElementById('r-more').textContent=descExpanded?'Show less':'Read more';
  if(!descExpanded){ setTimeout(function(){ var c=document.getElementById('rcard0'); if(c) c.scrollIntoView({behavior:'smooth',block:'nearest'}); },50); }
}


/* ════════════════════════════════
   BTN RESET
════════════════════════════════ */
function setBtnDefault(n){
  var btn=document.getElementById('btn'+n); if(!btn)return;
  btn.disabled=false;
  var isSearch=(n===0||n===3||n===4);
  btn.innerHTML=isSearch
    ?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Search</span>'
    :'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg><span>Fetch</span>';
}

/* ════════════════════════════════
   FETCH
════════════════════════════════ */
async function fetchEp(n){
  var btn=document.getElementById('btn'+n); if(!btn)return;
  btn.disabled=true;
  btn.innerHTML=(n===0||n===3||n===4)
    ?'<span>Searching\u2026</span>'
    :'<span>Fetching\u2026</span>';

  sv('skel'+n,true,'flex'); sv('res'+n,false);
  if(n===0){ sv('rcard0',false); sv('curl0',false); resetVideoPreview(); }
  if(n===3){ sv('v2card',false); sv('curl3',false); }
  if(n===4){ sv('v3list',false); sv('curl4',false); }

  var url;
  if(n===0){
    var q=document.getElementById('q0').value.trim();
    if(!q){ setBtnDefault(n); sv('skel'+n,false,'flex'); return; }
    url='/api/v1/q?='+encodeURIComponent(q);
  } else if(n===3){
    var q3=document.getElementById('q3').value.trim();
    if(!q3){ setBtnDefault(n); sv('skel'+n,false,'flex'); return; }
    url='/api/v2/q?='+encodeURIComponent(q3);
  } else if(n===4){
    var q4=document.getElementById('q4').value.trim();
    if(!q4){ setBtnDefault(n); sv('skel'+n,false,'flex'); return; }
    url='/api/v3/q?='+encodeURIComponent(q4);
  } else if(n===1){
    url='/api/uptime';
  } else {
    url='/api/healthz';
  }

  urlStore[n]=window.location.origin+url;
  var t0=Date.now();
  try{
    var resp=await fetch(url);
    var clientMs=Date.now()-t0;
    var text=await resp.text();
    var data; try{ data=JSON.parse(text); }catch(e){ data=text; }
    rawStore[n]=typeof data==='string'?data:JSON.stringify(data,null,2);
    sv('skel'+n,false,'flex');
    var statEl=document.getElementById('stat'+n);
    statEl.textContent=resp.ok?'200 OK':(resp.status+' Error');
    statEl.className='ep-status '+(resp.ok?'ok':'err');
    var sms=(typeof data==='object'&&data&&typeof data.ms==='number')?data.ms:null;
    document.getElementById('ms'+n).textContent=sms!==null?(sms+'ms server'):(clientMs+'ms');
    var cacEl=document.getElementById('cac'+n);
    if(cacEl) cacEl.style.display=(typeof data==='object'&&data&&data.cached)?'inline-flex':'none';
    showApiCount(n,data);
    var curlTextEl=document.getElementById('curl'+n+'-text');
    if(curlTextEl) curlTextEl.textContent=url;
    if(n===0||n===3||n===4) sv('curl'+n,resp.ok,'flex');
    document.getElementById('raw'+n).innerHTML=typeof data==='string'?data:hl(rawStore[n]);
    sv('res'+n,true,'block');

    /* ── V1 rich card ── */
    if(n===0&&typeof data==='object'&&data&&data.success){
      var info=data.info||{};
      var media=data.media||{};
      v1VideoId=data.video_id||'';
      var thumbEl=document.getElementById('r-thumb-img');
      thumbEl.src=info.thumbnail||''; thumbEl.alt=info.title||'';
      thumbEl.style.opacity='1'; thumbEl.style.transition='opacity .55s ease';
      sv('r-play-overlay',!!v1VideoId,'flex');
      var durEl=document.getElementById('r-dur');
      durEl.textContent=info.duration||'';
      durEl.style.display=info.duration?'inline-block':'none';
      var cbEl=document.getElementById('r-cached-b');
      if(cbEl){ cbEl.textContent=data.cached?'\u26a1 Cached':''; cbEl.style.display=data.cached?'inline-flex':'none'; }
      document.getElementById('r-title').textContent=info.title||'';
      var authEl=document.getElementById('r-author');
      authEl.textContent=info.author||'';
      authEl.href=info.channel_url||'#';
      authEl.style.display=info.author?'block':'none';
      var statsEl=document.getElementById('r-stats');
      var viewsHtml='';
      if(info.views) viewsHtml+='<span class="r-stat">'+fmtViews(info.views)+'</span>';
      if(info.published) viewsHtml+='<span class="r-stat">'+esc(info.published)+'</span>';
      if(info.duration_seconds) viewsHtml+='<span class="r-stat">'+esc(info.duration)+'</span>';
      statsEl.innerHTML=viewsHtml+'<span class="cat-badge" id="r-cat"></span>';
      var catEl=document.getElementById('r-cat');
      if(catEl&&data.category){ catEl.textContent=data.category; catEl.style.display='inline-flex'; }
      var descEl=document.getElementById('r-desc');
      var descWrap=document.getElementById('r-desc-wrap');
      if(info.description&&info.description.trim()){
        descEl.textContent=info.description; descWrap.style.display='block'; descExpanded=false;
        descEl.classList.remove('exp'); document.getElementById('r-more').textContent='Read more';
      } else { descWrap.style.display='none'; }
      var dlEl=document.getElementById('r-dl');
      var dlHtml='';
      if(media.mp4&&media.mp4.url) dlHtml+='<a class="dl-btn dl-mp4" href="'+esc(media.mp4.url)+'" target="_blank" rel="noopener noreferrer">'+dlIcon()+' MP4 HD</a>';
      if(media.mp3&&media.mp3.url) dlHtml+='<a class="dl-btn dl-mp3" href="'+esc(media.mp3.url)+'" target="_blank" rel="noopener noreferrer">'+dlIcon()+' MP3</a>';
      if(!dlHtml) dlHtml='<span class="dl-none">No download links available.</span>';
      dlEl.innerHTML=dlHtml;
      sv('rcard0',true,'block');
    }

    /* ── V2 quick card ── */
    if(n===3&&typeof data==='object'&&data&&data.media){
      var m=data.media;
      var v2html='';
      if(m.mp4) v2html+='<a class="dl-btn dl-mp4" href="'+esc(m.mp4)+'" target="_blank" rel="noopener noreferrer">'+dlIcon()+' MP4 HD</a>';
      if(m.mp3) v2html+='<a class="dl-btn dl-mp3" href="'+esc(m.mp3)+'" target="_blank" rel="noopener noreferrer">'+dlIcon()+' MP3</a>';
      if(!v2html) v2html='<span class="dl-none">No download links.</span>';
      document.getElementById('v2-dl').innerHTML=v2html;
      sv('v2card',true,'block');
    }

    /* ── V3 list ── */
    if(n===4&&typeof data==='object'&&data&&data.results){ renderV3List(data.results); }

    setBtnDefault(n);
  } catch(err){
    sv('skel'+n,false,'flex'); sv('res'+n,true,'block');
    var statElErr=document.getElementById('stat'+n);
    if(statElErr){ statElErr.textContent='Network Error'; statElErr.className='ep-status err'; }
    document.getElementById('raw'+n).textContent=String(err);
    setBtnDefault(n);
  }
}

/* ════════════════════════════════
   NAVBAR SCROLL
════════════════════════════════ */
(function(){
  var nav=document.querySelector('.topbar');
  if(!nav) return;
  function onScroll(){ nav.classList.toggle('scrolled', window.scrollY > 60); }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();

/* ════════════════════════════════
   CARD 3D TILT
════════════════════════════════ */
(function(){
  if(window.matchMedia('(hover:none)').matches) return;
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  document.querySelectorAll('.ep-card').forEach(function(card){
    var raf=null,lastE=null;
    card.addEventListener('mousemove',function(e){
      lastE=e;
      if(raf) return;
      raf=requestAnimationFrame(function(){
        raf=null;
        if(!lastE) return;
        var rect=card.getBoundingClientRect();
        var dx=(lastE.clientX-rect.left-rect.width/2)/rect.width;
        var dy=(lastE.clientY-rect.top-rect.height/2)/rect.height;
        card.style.transform='perspective(700px) rotateY('+(dx*5)+'deg) rotateX('+(-dy*3.5)+'deg) translateY(-2px)';
      });
    });
    card.addEventListener('mouseleave',function(){
      if(raf){ cancelAnimationFrame(raf); raf=null; } lastE=null;
      card.style.transform='';
    });
  });
})();

/* ════════════════════════════════
   AURORA HUE SHIFT ON SCROLL
════════════════════════════════ */
(function(){
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  var aurora=document.getElementById('aurora');
  if(!aurora) return;
  function onScroll(){
    var max=document.body.scrollHeight-window.innerHeight||1;
    var pct=Math.min(1, window.scrollY/max);
    var hue=Math.round(pct*14);
    aurora.style.filter='hue-rotate('+hue+'deg)';
  }
  window.addEventListener('scroll', onScroll, {passive:true});
})();

/* ════════════════════════════════
   HOST BADGE
════════════════════════════════ */
(function(){
  var hb=document.getElementById('host-badge'); if(!hb)return;
  var h=window.location.hostname;
  var label,color;
  if(h.includes('replit')) { label='Hosted on Replit'; color='#E97A3B'; }
  else if(h.includes('render')) { label='Hosted on Render'; color='#46E3B7'; }
  else if(h.includes('vercel')) { label='Hosted on Vercel'; color='#ffffff'; }
  else { label='Self-hosted'; color='#717171'; }
  hb.innerHTML='<span class="host-pill"><span class="host-dot" style="color:'+color+'"></span>'+label+'</span>';
})();

/* ════════════════════════════════
   SECURITY
════════════════════════════════ */
document.addEventListener('contextmenu',function(e){ e.preventDefault(); });
document.addEventListener('keydown',function(e){
  if(e.key==='F12'||(e.ctrlKey&&(e.key==='u'||e.key==='U'||e.key==='s'||e.key==='S'))||(e.ctrlKey&&e.shiftKey&&(e.key==='I'||e.key==='J'||e.key==='C'))) e.preventDefault();
});
document.addEventListener('dragstart',function(e){ e.preventDefault(); });
var _dbgTimer=null;
function _chkDbg(){
  var t=Date.now();
  debugger;
  if(Date.now()-t>100) document.body.style.filter='blur(8px)';
  else document.body.style.filter='';
}
setInterval(_chkDbg,4000);
window.addEventListener('blur',function(){ document.body.style.filter='blur(6px)'; });
window.addEventListener('focus',function(){ document.body.style.filter=''; });
</script>
</body>
</html>`;
}

router.get("/", (req, res) => {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  const host = req.headers["x-forwarded-host"] as string || req.headers.host || "localhost";
  const baseUrl = `${proto}://${host}`;
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src https://fonts.gstatic.com; img-src * data:; frame-src https://www.youtube.com; connect-src 'self'; media-src 'none'");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader("Cache-Control", "no-store");
  res.type("html").send(buildHtml(VERSION, baseUrl));
});

export default router;
