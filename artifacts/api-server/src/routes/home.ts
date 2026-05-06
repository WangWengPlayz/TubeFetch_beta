import { Router, type IRouter } from "express";
import { VERSION } from "../lib/version";

const router: IRouter = Router();

const CHANGELOG: { version: string; date: string; tag: string; notes: string[] }[] = [
  {
    version: "1.1.1",
    date: "2026-05-06",
    tag: "current",
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
    a: "<strong>v1</strong> returns full metadata (title, author, thumbnail, duration, views, description, category) plus MP4 &amp; MP3 download links. <strong>v2</strong> is the fastest — skips all metadata and returns only download links. <strong>v3</strong> returns a ranked list of up to 10 YouTube search results with full metadata but without download links.",
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

function buildHtml(version: string): string {
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
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      background:#0F0F0F;color:#F1F1F1;min-height:100vh;overflow-x:hidden;
      user-select:none;-webkit-user-select:none;
    }
    pre,code,input,textarea,.jbox{user-select:text;-webkit-user-select:text}

    /* ── SCROLL REVEAL ── */
    .reveal{opacity:0;transform:translateY(28px);transition:opacity .65s cubic-bezier(.25,.46,.45,.94),transform .65s cubic-bezier(.25,.46,.45,.94)}
    .reveal.in-view{opacity:1;transform:none}
    .reveal-d1{transition-delay:.1s}.reveal-d2{transition-delay:.18s}.reveal-d3{transition-delay:.26s}.reveal-d4{transition-delay:.34s}

    /* ── INTRO ── */
    #intro{
      position:fixed;inset:0;z-index:9999;background:#0A0A0A;
      display:flex;align-items:center;justify-content:center;
      overflow:hidden;
    }
    #intro::before{
      content:'';position:absolute;inset:0;
      background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px);
      background-size:32px 32px;
    }
    #intro::after{
      content:'';position:absolute;left:0;right:0;height:2px;top:-4px;
      background:linear-gradient(90deg,transparent,rgba(255,0,0,.7),transparent);
      animation:scan 2.4s linear forwards;z-index:2;
    }
    @keyframes scan{0%{top:-4px;opacity:1}100%{top:100%;opacity:0}}
    #intro.out{animation:intro-out .55s cubic-bezier(.4,0,.2,1) forwards}
    @keyframes intro-out{
      0%{opacity:1;filter:blur(0) brightness(1);transform:scale(1)}
      60%{opacity:1;filter:blur(0) brightness(2);transform:scale(1.04)}
      100%{opacity:0;filter:blur(8px) brightness(0);transform:scale(1.08)}
    }
    .i-wrap{text-align:center;position:relative;z-index:3}
    .i-icon{
      width:88px;height:88px;border-radius:24px;margin:0 auto 24px;
      background:linear-gradient(135deg,#CC0000,#FF0000);
      display:flex;align-items:center;justify-content:center;
      animation:icon-in .6s cubic-bezier(.34,1.56,.64,1) both;
      box-shadow:0 0 40px rgba(255,0,0,.4),0 0 80px rgba(255,0,0,.15);
      position:relative;overflow:hidden;
    }
    .i-icon::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.15),transparent)}
    .i-icon svg{width:38px;height:38px;fill:#fff;position:relative;z-index:1}
    @keyframes icon-in{from{opacity:0;transform:scale(.5) rotate(-12deg)}to{opacity:1;transform:scale(1) rotate(0)}}
    @keyframes icon-pulse{0%,100%{box-shadow:0 0 40px rgba(255,0,0,.4),0 0 80px rgba(255,0,0,.15)}50%{box-shadow:0 0 60px rgba(255,0,0,.6),0 0 120px rgba(255,0,0,.25)}}
    .i-title{font-size:clamp(2.4rem,8vw,3.2rem);font-weight:900;letter-spacing:-2px;display:flex;align-items:center;justify-content:center;gap:0;overflow:hidden}
    .i-word{overflow:hidden;display:inline-block}
    .i-word span{display:inline-block;animation:word-up .55s cubic-bezier(.34,1.2,.64,1) both}
    .i-word:nth-child(1) span{animation-delay:.3s}
    .i-word:nth-child(2) span{animation-delay:.45s;color:#FF0000}
    @keyframes word-up{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}
    .i-title-glitch{position:absolute;left:50%;transform:translateX(-50%);font-size:clamp(2.4rem,8vw,3.2rem);font-weight:900;letter-spacing:-2px;color:#FF0000;white-space:nowrap;pointer-events:none;animation:glitch-run 2.8s ease forwards;opacity:0}
    @keyframes glitch-run{
      0%,55%,100%{opacity:0;clip-path:inset(0 0 100% 0)}
      56%{opacity:1;clip-path:inset(20% 0 60% 0);transform:translateX(calc(-50% - 3px))}
      57%{clip-path:inset(70% 0 10% 0);transform:translateX(calc(-50% + 2px))}
      58%{clip-path:inset(40% 0 30% 0);transform:translateX(calc(-50% - 1px))}
      59%{opacity:0;clip-path:inset(0 0 100% 0)}
    }
    .i-sub{font-size:.72rem;font-weight:800;color:#717171;letter-spacing:3px;text-transform:uppercase;margin-top:10px;animation:fade-up .5s ease both;animation-delay:.65s}
    @keyframes fade-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    .i-bar-track{width:180px;height:2px;background:#1a1a1a;border-radius:2px;margin:28px auto 0;overflow:hidden}
    .i-bar{height:100%;width:0;background:linear-gradient(90deg,#CC0000,#FF4444);border-radius:2px;box-shadow:0 0 8px #FF0000;transition:width 2.2s cubic-bezier(.4,0,.2,1)}
    .i-ver{color:#2a2a2a;font-size:.65rem;font-family:monospace;margin-top:10px;animation:fade-up .5s ease both;animation-delay:.7s}

    /* ── TOPBAR ── */
    .topbar{position:sticky;top:0;z-index:100;height:56px;background:rgba(10,10,10,.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-between;padding:0 20px}
    .topbar::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,0,0,.25),transparent)}
    .topbar-logo{display:flex;align-items:center;gap:9px;text-decoration:none;transition:opacity .2s}
    .topbar-logo:hover{opacity:.8}
    .topbar-icon{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#CC0000,#FF0000);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 12px rgba(255,0,0,.3)}
    .topbar-icon svg{width:14px;height:14px;fill:#fff}
    .topbar-name{font-weight:900;font-size:.97rem;color:#F1F1F1;letter-spacing:-.3px}
    .topbar-tf{font-size:.62rem;font-weight:800;color:#FF0000;letter-spacing:1.5px;margin-left:3px;vertical-align:middle}
    .topbar-ver{font-size:.65rem;color:#3F3F3F;font-family:monospace;margin-left:5px}
    .topbar-right{display:flex;align-items:center;gap:6px}
    .nav-links{display:flex;gap:2px}
    .nav-links a{color:#717171;text-decoration:none;font-size:.78rem;font-weight:600;padding:5px 11px;border-radius:8px;transition:all .18s;white-space:nowrap}
    .nav-links a:hover{color:#F1F1F1;background:rgba(255,255,255,.06)}
    @media(max-width:540px){.nav-links{display:none}}

    /* ── BELL ── */
    .bell-wrap{position:relative}
    .bell-btn{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:9px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#717171;transition:all .18s;position:relative}
    .bell-btn:hover{background:rgba(255,255,255,.08);color:#F1F1F1;border-color:rgba(255,255,255,.15)}
    .bell-btn.active{background:rgba(255,0,0,.08);color:#FF4444;border-color:rgba(255,0,0,.25)}
    .bell-btn svg{width:15px;height:15px}
    .bell-dot{position:absolute;top:5px;right:5px;width:7px;height:7px;background:#FF0000;border-radius:50%;border:1.5px solid #0A0A0A;animation:dot-pulse 2s ease infinite}
    @keyframes dot-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.8)}}
    .bell-panel{display:none;position:absolute;top:calc(100% + 12px);right:0;width:316px;background:rgba(20,20,20,.95);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.03);z-index:200;overflow:hidden;transform-origin:top right}
    .bell-panel.opening{display:block;animation:bell-in .22s cubic-bezier(.34,1.2,.64,1) both}
    .bell-panel.open{display:block}
    .bell-panel.closing{display:block;animation:bell-out .16s ease forwards}
    @keyframes bell-in{from{opacity:0;transform:scale(.9) translateY(-10px)}to{opacity:1;transform:none}}
    @keyframes bell-out{from{opacity:1;transform:none}to{opacity:0;transform:scale(.9) translateY(-10px)}}
    .bell-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,.06)}
    .bell-head-title{font-size:.72rem;font-weight:800;color:#F1F1F1;letter-spacing:.8px;text-transform:uppercase;display:flex;align-items:center;gap:7px}
    .bell-head-title::before{content:'';width:7px;height:7px;background:#FF0000;border-radius:50%;display:inline-block;box-shadow:0 0 6px #FF0000}
    .bell-close{background:none;border:none;color:#555;cursor:pointer;padding:4px 7px;border-radius:5px;transition:all .15s;font-size:.85rem}
    .bell-close:hover{color:#F1F1F1;background:rgba(255,255,255,.08)}
    .bell-list{max-height:360px;overflow-y:auto;padding:8px 0}
    .bell-list::-webkit-scrollbar{width:3px}
    .bell-list::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:2px}
    .cl-item{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.04)}
    .cl-item:last-child{border-bottom:none}
    .cl-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
    .cl-left{display:flex;align-items:center;gap:7px}
    .cl-ver{font-size:.78rem;font-weight:800;color:#F1F1F1;font-family:monospace}
    .cl-tag{font-size:.58rem;font-weight:800;padding:2px 8px;border-radius:20px;letter-spacing:.4px;text-transform:uppercase}
    .cl-tag.current{background:rgba(255,0,0,.12);color:#FF4444;border:1px solid rgba(255,0,0,.2)}
    .cl-tag.init{background:rgba(255,255,255,.06);color:#717171}
    .cl-date{font-size:.67rem;color:#3F3F3F}
    .cl-notes{list-style:none;display:flex;flex-direction:column;gap:4px}
    .cl-notes li{font-size:.72rem;color:#717171;padding-left:13px;position:relative;line-height:1.45}
    .cl-notes li::before{content:'·';position:absolute;left:0;color:#FF0000;font-weight:900}

    /* ── HERO ── */
    .hero{position:relative;overflow:hidden;padding:clamp(56px,10vw,96px) 20px clamp(42px,7vw,72px);text-align:center;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(136,0,0,.35) 0%,transparent 70%),linear-gradient(180deg,#140000 0%,#0A0A0A 100%)}
    .hero::before{content:'';position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ff0000' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/svg%3E")}
    #hero-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
    .hero-content{position:relative;z-index:2}
    .hero-eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(255,0,0,.08);border:1px solid rgba(255,0,0,.15);border-radius:20px;padding:4px 14px;font-size:.67rem;font-weight:800;color:rgba(255,80,80,.9);letter-spacing:2px;text-transform:uppercase;margin-bottom:18px;animation:fade-up .5s ease both;animation-delay:.1s}
    .hero-eyebrow::before{content:'';width:6px;height:6px;background:#FF0000;border-radius:50%;box-shadow:0 0 6px #FF0000}
    .hero h1{font-size:clamp(2.8rem,8vw,4.4rem);font-weight:900;color:#F1F1F1;letter-spacing:-3px;line-height:1;animation:fade-up .6s ease both;animation-delay:.2s}
    .hero-tf{color:transparent;background:linear-gradient(90deg,#FF4444,#FF0000);-webkit-background-clip:text;background-clip:text}
    .hero-sub{margin-top:16px;color:rgba(241,241,241,.5);font-size:clamp(.85rem,2vw,.95rem);line-height:1.6;animation:fade-up .6s ease both;animation-delay:.3s}
    .hero-badges{display:flex;gap:8px;justify-content:center;margin-top:24px;flex-wrap:wrap;animation:fade-up .6s ease both;animation-delay:.4s}
    .hbadge{background:rgba(255,255,255,.05);backdrop-filter:blur(6px);color:rgba(241,241,241,.65);padding:5px 14px;border-radius:20px;font-size:.68rem;font-weight:700;letter-spacing:.5px;border:1px solid rgba(255,255,255,.07);transition:all .2s}
    .hbadge:hover{background:rgba(255,255,255,.09);color:#F1F1F1}

    /* ── STATS BAR ── */
    .stats-bar{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:24px;animation:fade-up .6s ease both;animation-delay:.5s}
    .stat-item{display:flex;flex-direction:column;align-items:center;gap:3px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:10px 18px;min-width:80px}
    .stat-num{font-size:1.25rem;font-weight:900;color:#F1F1F1;font-family:monospace;line-height:1;letter-spacing:-1px}
    .stat-num.red{color:#FF4444}
    .stat-lbl{font-size:.58rem;font-weight:700;color:#3F3F3F;text-transform:uppercase;letter-spacing:1px;margin-top:2px}

    /* ── LAYOUT ── */
    .wrap{max-width:840px;margin:0 auto;padding:clamp(28px,4vw,48px) 16px 80px}
    .sec-label{font-size:.65rem;font-weight:800;color:#3F3F3F;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:12px;padding-left:2px;display:flex;align-items:center;gap:10px}
    .sec-label::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(255,255,255,.06),transparent)}

    /* ── ENDPOINT ACCORDION ── */
    .ep-list{display:flex;flex-direction:column;gap:7px;margin-bottom:32px}
    .ep-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:14px;overflow:hidden;transition:border-color .25s,box-shadow .25s,transform .2s;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
    .ep-card:hover{border-color:rgba(255,255,255,.13);transform:translateY(-1px);box-shadow:0 8px 32px rgba(0,0,0,.4)}
    .ep-card.open{border-color:rgba(255,0,0,.3);box-shadow:0 0 0 1px rgba(255,0,0,.08),0 12px 40px rgba(0,0,0,.5);transform:none}
    .ep-header{display:flex;align-items:center;gap:11px;padding:14px 18px;cursor:pointer;transition:background .18s}
    .ep-header:hover{background:rgba(255,255,255,.025)}
    .ep-method{font-size:.62rem;font-weight:900;padding:3px 9px;border-radius:6px;background:rgba(74,222,128,.08);color:#4ade80;letter-spacing:.5px;flex-shrink:0;border:1px solid rgba(74,222,128,.15)}
    .ep-method.v2{background:rgba(96,165,250,.08);color:#60a5fa;border-color:rgba(96,165,250,.15)}
    .ep-method.v3{background:rgba(251,191,36,.08);color:#fbbf24;border-color:rgba(251,191,36,.15)}
    .ep-path{font-family:'Menlo','Consolas',monospace;font-size:.8rem;color:#60a5fa;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;user-select:text;-webkit-user-select:text}
    .ep-desc-label{font-size:.71rem;color:#3F3F3F;white-space:nowrap;margin-right:4px}
    @media(max-width:500px){.ep-desc-label{display:none}}
    .ep-chevron{color:#2a2a2a;flex-shrink:0;transition:transform .3s cubic-bezier(.34,1.2,.64,1),color .2s}
    .ep-chevron svg{width:14px;height:14px}
    .ep-card.open .ep-chevron{transform:rotate(180deg);color:#FF0000}
    .ep-body{max-height:0;overflow:hidden;transition:max-height .38s cubic-bezier(.4,0,.2,1);border-top:0 solid rgba(255,255,255,.06)}
    .ep-card.open .ep-body{max-height:3000px;border-top-width:1px}
    .ep-body-inner{padding:18px}
    .ep-info{font-size:.8rem;color:#717171;line-height:1.7;margin-bottom:16px}
    .ep-info code{background:rgba(255,255,255,.07);color:#F1F1F1;padding:1px 6px;border-radius:4px;font-size:.84em}
    .ep-info strong{color:#AAAAAA}
    .ep-badge-fast{display:inline-flex;align-items:center;gap:4px;background:rgba(96,165,250,.08);color:#60a5fa;border:1px solid rgba(96,165,250,.15);border-radius:5px;font-size:.66rem;font-weight:800;padding:2px 7px;letter-spacing:.4px;margin-left:5px;vertical-align:middle}
    .ep-badge-new{display:inline-flex;align-items:center;background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid rgba(251,191,36,.2);border-radius:5px;font-size:.66rem;font-weight:800;padding:2px 7px;letter-spacing:.4px;margin-left:5px;vertical-align:middle}
    .ep-input-row{display:flex;gap:8px;margin-bottom:14px}
    .ep-input{flex:1;min-width:0;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);border-radius:10px;color:#F1F1F1;padding:11px 15px;font-size:.84rem;outline:none;transition:border-color .2s,box-shadow .2s,background .2s;font-family:inherit;user-select:text;-webkit-user-select:text}
    .ep-input:focus{border-color:rgba(255,0,0,.4);box-shadow:0 0 0 3px rgba(255,0,0,.08);background:rgba(255,255,255,.05)}
    .ep-input::placeholder{color:#2a2a2a}
    .ep-fetch-btn{background:linear-gradient(135deg,#CC0000,#FF0000);color:#fff;border:none;padding:11px 20px;border-radius:10px;cursor:pointer;font-size:.82rem;font-weight:700;transition:all .18s;white-space:nowrap;display:flex;align-items:center;gap:7px;box-shadow:0 2px 12px rgba(255,0,0,.25)}
    .ep-fetch-btn:hover:not(:disabled){background:linear-gradient(135deg,#BB0000,#EE0000);transform:translateY(-1px);box-shadow:0 6px 20px rgba(255,0,0,.35)}
    .ep-fetch-btn:active:not(:disabled){transform:translateY(0);box-shadow:0 2px 8px rgba(255,0,0,.2)}
    .ep-fetch-btn:disabled{background:rgba(255,255,255,.06);color:#3F3F3F;cursor:not-allowed;transform:none;box-shadow:none}
    .ep-fetch-btn svg{width:13px;height:13px;flex-shrink:0}
    @media(max-width:440px){.ep-input-row{flex-direction:column}}

    /* ── EP RESULT META ── */
    .ep-result{display:none;margin-top:6px}
    .ep-result-meta{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}
    .ep-status{font-size:.67rem;font-weight:800;padding:2px 9px;border-radius:6px;letter-spacing:.3px}
    .ep-status.ok{background:rgba(74,222,128,.08);color:#4ade80;border:1px solid rgba(74,222,128,.15)}
    .ep-status.err{background:rgba(255,0,0,.08);color:#FF4444;border:1px solid rgba(255,0,0,.15)}
    .ep-ms{font-size:.67rem;color:#3F3F3F;font-family:monospace}
    .ep-cached{font-size:.67rem;color:#f59e0b;background:rgba(245,158,11,.08);padding:2px 8px;border-radius:5px;font-weight:700;border:1px solid rgba(245,158,11,.15)}
    .ep-apicount{font-size:.67rem;color:#a78bfa;background:rgba(167,139,250,.08);padding:2px 8px;border-radius:5px;font-weight:700;border:1px solid rgba(167,139,250,.15);display:none}

    /* ── COPY URL STRIP ── */
    .copy-url-strip{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:9px 13px;margin-bottom:12px;overflow:hidden}
    .copy-url-strip code{flex:1;font-family:'Menlo','Consolas',monospace;font-size:.72rem;color:#60a5fa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;user-select:text;-webkit-user-select:text}
    .copy-url-btn{background:rgba(255,255,255,.07);color:#AAAAAA;border:none;border-radius:6px;padding:4px 11px;font-size:.67rem;font-weight:700;cursor:pointer;white-space:nowrap;transition:all .15s;flex-shrink:0;display:flex;align-items:center;gap:4px}
    .copy-url-btn:hover{background:rgba(255,255,255,.12);color:#F1F1F1}
    .copy-url-btn svg{width:11px;height:11px}

    /* ── V1 RICH RESULT CARD ── */
    .r-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:12px;overflow:hidden;margin-bottom:12px;animation:slide-up .28s cubic-bezier(.34,1.2,.64,1) both;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
    @keyframes slide-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    .r-inner{display:grid;grid-template-columns:192px 1fr}
    @media(max-width:560px){.r-inner{grid-template-columns:1fr}}
    .r-thumb{position:relative;background:#0a0a0a;min-height:120px;overflow:hidden}
    .r-thumb-img{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0;transition:opacity .55s ease}
    .r-dur{position:absolute;bottom:6px;right:6px;z-index:4;background:rgba(0,0,0,.85);color:#F1F1F1;font-size:.63rem;font-weight:700;padding:2px 6px;border-radius:4px;font-family:monospace}
    .r-cached-badge{position:absolute;top:6px;left:6px;z-index:4;display:none;background:rgba(255,0,0,.15);color:#FF4444;font-size:.6rem;font-weight:800;padding:2px 7px;border-radius:4px;letter-spacing:.4px;text-transform:uppercase;border:1px solid rgba(255,0,0,.2)}
    .r-play-overlay{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(0,0,0,.3);cursor:pointer;transition:background .2s}
    .r-play-overlay:hover{background:rgba(0,0,0,.45)}
    .r-play-circle{width:52px;height:52px;border-radius:50%;background:rgba(255,0,0,.9);display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(255,0,0,.5);transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s}
    .r-play-overlay:hover .r-play-circle{transform:scale(1.1);box-shadow:0 0 32px rgba(255,0,0,.7)}
    .r-play-circle svg{width:20px;height:20px;fill:#fff;margin-left:3px}
    .r-play-label{font-size:.67rem;font-weight:800;color:rgba(255,255,255,.7);letter-spacing:1px;text-transform:uppercase}
    .r-countdown-wrap{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.5)}
    .r-ring-svg{width:90px;height:90px;transform:rotate(-90deg)}
    .r-ring-bg{fill:none;stroke:rgba(255,255,255,.1);stroke-width:4}
    .r-ring-arc{fill:none;stroke:#FF0000;stroke-width:4;stroke-linecap:round;stroke-dasharray:201;stroke-dashoffset:201;transition:stroke-dashoffset 5s linear;filter:drop-shadow(0 0 4px #FF0000)}
    .r-countdown-n{position:absolute;font-size:1.8rem;font-weight:900;color:#F1F1F1;text-shadow:0 0 20px rgba(255,0,0,.6)}
    .r-skip-btn{margin-top:10px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.6);font-size:.65rem;font-weight:700;padding:4px 12px;border-radius:6px;cursor:pointer;transition:all .15s;letter-spacing:.5px}
    .r-skip-btn:hover{background:rgba(255,255,255,.18);color:#fff}
    .r-yt-wrap{position:absolute;inset:0;z-index:5;display:none;animation:yt-fade-in .5s ease both}
    @keyframes yt-fade-in{from{opacity:0}to{opacity:1}}
    .r-yt-wrap>div,.r-yt-wrap iframe{width:100%!important;height:100%!important;border:none;display:block;}
    .r-body{padding:15px 18px;display:flex;flex-direction:column;gap:9px;min-width:0}
    .r-title{font-size:.9rem;font-weight:700;color:#F1F1F1;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .r-author{font-size:.74rem;color:#60a5fa;text-decoration:none;font-weight:600;transition:color .15s}
    .r-author:hover{color:#93c5fd}
    .r-stats{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center}
    .r-stat{font-size:.7rem;color:#717171;display:flex;align-items:center;gap:4px}
    .cat-badge{display:inline-flex;align-items:center;background:rgba(251,191,36,.08);color:#fbbf24;border:1px solid rgba(251,191,36,.14);border-radius:5px;font-size:.6rem;font-weight:800;padding:2px 8px;letter-spacing:.4px;display:none}
    .r-desc-wrap{font-size:.73rem;color:#717171;line-height:1.55;display:none}
    .r-desc-text{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-line;user-select:text;-webkit-user-select:text}
    .r-desc-text.exp{-webkit-line-clamp:unset;display:block;max-height:200px;overflow-y:auto;padding-right:4px}
    .r-desc-text.exp::-webkit-scrollbar{width:3px}
    .r-desc-text.exp::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:2px}
    .r-more{background:none;border:none;color:#FF0000;font-size:.68rem;font-weight:700;cursor:pointer;padding:2px 0;margin-top:3px;display:block;transition:color .15s}
    .r-more:hover{color:#FF4444}
    .r-dl{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}

    /* ── V2 QUICK RESULT CARD ── */
    .v2-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:18px 20px;margin-bottom:12px;animation:slide-up .28s cubic-bezier(.34,1.2,.64,1) both}
    .v2-label{font-size:.62rem;font-weight:800;color:#3F3F3F;text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px}
    .v2-dl{display:flex;gap:8px;flex-wrap:wrap}

    /* ── V3 RESULT LIST ── */
    .v3-list{display:flex;flex-direction:column;gap:8px;margin-bottom:14px;animation:slide-up .28s cubic-bezier(.34,1.2,.64,1) both}
    .v3-item{display:flex;gap:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:10px;transition:border-color .18s;overflow:hidden}
    .v3-item:hover{border-color:rgba(255,255,255,.12)}
    .v3-num{font-size:.65rem;font-weight:900;color:#2a2a2a;min-width:14px;padding-top:2px;text-align:right;flex-shrink:0}
    .v3-thumb-wrap{position:relative;flex-shrink:0;width:96px;height:54px;border-radius:6px;overflow:hidden;background:#111}
    .v3-thumb-img{width:100%;height:100%;object-fit:cover;display:block}
    .v3-dur-badge{position:absolute;bottom:3px;right:3px;background:rgba(0,0,0,.88);color:#F1F1F1;font-size:.55rem;font-weight:700;padding:1px 5px;border-radius:3px;font-family:monospace}
    .v3-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
    .v3-title{font-size:.79rem;font-weight:700;color:#F1F1F1;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-decoration:none}
    .v3-title:hover{color:#60a5fa}
    .v3-channel{font-size:.68rem;color:#60a5fa;font-weight:600;text-decoration:none;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .v3-channel:hover{color:#93c5fd}
    .v3-meta-row{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:1px}
    .v3-views,.v3-date{font-size:.64rem;color:#3F3F3F}
    .v3-cat-badge{font-size:.57rem;font-weight:800;color:#fbbf24;background:rgba(251,191,36,.07);border:1px solid rgba(251,191,36,.13);border-radius:4px;padding:1px 6px;letter-spacing:.3px}
    .v3-desc{font-size:.69rem;color:#444;line-height:1.4;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;margin-top:2px}
    @media(max-width:480px){.v3-thumb-wrap{width:72px;height:42px}.v3-title{font-size:.74rem}}

    /* ── SHARED DOWNLOAD BUTTONS ── */
    .dl-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:9px;font-size:.78rem;font-weight:700;text-decoration:none;transition:all .18s;border:1px solid transparent}
    .dl-mp4{background:rgba(255,0,0,.08);color:#FF4444;border-color:rgba(255,0,0,.15)}
    .dl-mp4:hover{background:rgba(255,0,0,.16);color:#FF6666;transform:translateY(-1px);box-shadow:0 4px 16px rgba(255,0,0,.15)}
    .dl-mp3{background:rgba(96,165,250,.08);color:#60a5fa;border-color:rgba(96,165,250,.15)}
    .dl-mp3:hover{background:rgba(96,165,250,.16);color:#93c5fd;transform:translateY(-1px);box-shadow:0 4px 16px rgba(96,165,250,.12)}
    .dl-btn svg{width:12px;height:12px;flex-shrink:0}
    .dl-none{font-size:.78rem;color:#3F3F3F;font-style:italic}

    /* ── SKELETON ── */
    .ep-skel{display:none;flex-direction:column;gap:10px;padding:4px 0 8px}
    .skel-line{background:linear-gradient(90deg,rgba(255,255,255,.03) 25%,rgba(255,255,255,.06) 50%,rgba(255,255,255,.03) 75%);background-size:200% 100%;animation:shim 1.4s infinite;border-radius:6px;height:12px}
    @keyframes shim{0%{background-position:200% 0}100%{background-position:-200% 0}}

    /* ── JSON BOX ── */
    .json-actions{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
    .json-label{font-size:.63rem;font-weight:800;color:#2a2a2a;text-transform:uppercase;letter-spacing:.8px}
    .copy-btn{background:rgba(255,255,255,.06);color:#717171;border:1px solid rgba(255,255,255,.08);border-radius:6px;padding:3px 10px;font-size:.66rem;cursor:pointer;font-weight:700;transition:all .15s}
    .copy-btn:hover{background:rgba(255,255,255,.1);color:#F1F1F1}
    pre.jbox{background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:14px 16px;font-family:'Menlo','Consolas',monospace;font-size:.72rem;line-height:1.75;overflow-x:auto;max-height:320px;overflow-y:auto;color:#717171;white-space:pre}
    pre.jbox::-webkit-scrollbar{width:4px;height:4px}
    pre.jbox::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:2px}
    .jk{color:#FF4444}.js{color:#86efac}.jn{color:#fbbf24}.jb{color:#818cf8}

    /* ── MISC CARDS ── */
    .card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:clamp(20px,3.5vw,28px);margin-bottom:22px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:border-color .25s,box-shadow .25s}
    .card:hover{border-color:rgba(255,255,255,.1);box-shadow:0 8px 32px rgba(0,0,0,.3)}
    .card-title{font-size:.67rem;font-weight:800;color:#3F3F3F;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;display:flex;align-items:center;gap:8px}
    .card-title::before{content:'';width:3px;height:11px;background:#FF0000;border-radius:2px;display:inline-block;box-shadow:0 0 6px rgba(255,0,0,.4)}
    .about p{color:#AAAAAA;line-height:1.9;font-size:.87rem}
    .about code{background:rgba(255,255,255,.07);color:#F1F1F1;padding:1px 6px;border-radius:4px;font-size:.88em;font-family:monospace}
    .about strong{color:#F1F1F1}
    .disc p{color:#AAAAAA;line-height:1.85;font-size:.86rem}
    .disc strong{color:#fbbf24}

    /* ── FAQ ── */
    .faq-list{display:flex;flex-direction:column;gap:6px;margin-bottom:22px}
    .faq-item{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:12px;overflow:hidden;transition:border-color .2s}
    .faq-item.open{border-color:rgba(255,0,0,.22)}
    .faq-q{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;cursor:pointer;font-size:.84rem;font-weight:600;color:#F1F1F1;transition:background .18s;line-height:1.4}
    .faq-q:hover{background:rgba(255,255,255,.025)}
    .faq-icon{font-size:1.1rem;color:#3F3F3F;flex-shrink:0;transition:transform .3s cubic-bezier(.34,1.2,.64,1),color .2s;line-height:1;font-weight:300}
    .faq-item.open .faq-icon{transform:rotate(45deg);color:#FF0000}
    .faq-a{max-height:0;overflow:hidden;transition:max-height .35s cubic-bezier(.4,0,.2,1)}
    .faq-item.open .faq-a{max-height:500px}
    .faq-a-inner{padding:0 18px 16px;font-size:.8rem;color:#AAAAAA;line-height:1.8;border-top:1px solid rgba(255,255,255,.05)}
    .faq-a-inner code{background:rgba(255,255,255,.07);color:#F1F1F1;padding:1px 6px;border-radius:4px;font-size:.88em;font-family:monospace}
    .faq-a-inner strong{color:#F1F1F1}

    /* ── STATS MODAL ── */
    .sm-overlay{position:fixed;inset:0;z-index:9997;background:rgba(0,0,0,.75);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:20px}
    .sm-overlay.open{display:flex;animation:sm-fade .2s ease both}
    @keyframes sm-fade{from{opacity:0}to{opacity:1}}
    .sm-modal{background:rgba(13,13,13,.98);border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:26px 22px 22px;width:min(360px,100%);box-shadow:0 40px 100px rgba(0,0,0,.95),0 0 0 1px rgba(255,255,255,.04);animation:sm-pop .28s cubic-bezier(.34,1.2,.64,1) both}
    @keyframes sm-pop{from{opacity:0;transform:scale(.86) translateY(16px)}to{opacity:1;transform:none}}
    .sm-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
    .sm-title{font-size:.84rem;font-weight:800;color:#F1F1F1;letter-spacing:.3px}
    .sm-close{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#717171;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;font-size:.75rem;flex-shrink:0}
    .sm-close:hover{background:rgba(255,255,255,.12);color:#F1F1F1}
    .sm-circles{display:flex;align-items:flex-start;gap:14px;justify-content:center}
    .sm-circle-wrap{display:flex;flex-direction:column;align-items:center;gap:10px;flex:1;max-width:145px}
    .sm-ring-wrap{position:relative;width:112px;height:112px}
    .sm-ring-svg{width:112px;height:112px;transform:rotate(-90deg);display:block}
    .sm-ring-bg{fill:none;stroke-width:9}
    .sm-ring-arc{fill:none;stroke-width:9;stroke-linecap:round;stroke-dasharray:289;stroke-dashoffset:289;transition:stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)}
    .sm-ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px}
    .sm-pct{font-size:1.25rem;font-weight:900;font-family:monospace;line-height:1;letter-spacing:-1px}
    .sm-count{font-size:.62rem;font-weight:700;color:#555;line-height:1}
    .sm-circle-lbl{font-size:.72rem;font-weight:700;text-align:center;letter-spacing:.2px}
    .sm-divider{width:1px;background:rgba(255,255,255,.06);align-self:stretch;margin:6px 0}
    .sm-footer{font-size:.62rem;color:#333;text-align:center;margin-top:20px;font-family:monospace;padding-top:16px;border-top:1px solid rgba(255,255,255,.05)}
    /* Clickable stat */
    .stat-clickable{cursor:pointer;transition:all .2s}
    .stat-clickable:hover{border-color:rgba(255,0,0,.28)!important;background:rgba(255,0,0,.05)!important;transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.4)}
    .stat-clickable:active{transform:translateY(0)}
    /* MongoDB indicator */
    .db-dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-left:5px;vertical-align:middle;flex-shrink:0}
    .db-dot.connected{background:#4ade80;box-shadow:0 0 5px #4ade8088}
    .db-dot.fallback{background:#f59e0b;box-shadow:0 0 5px #f59e0b88}
    .db-dot.failed{background:#FF4444;box-shadow:0 0 5px #FF444488}
    .sm-mongo-row{display:flex;align-items:center;justify-content:center;gap:7px;font-size:.62rem;font-family:monospace;margin-top:8px;padding-top:10px;border-top:1px solid rgba(255,255,255,.05)}
    .sm-mongo-badge{display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:20px;font-size:.6rem;font-weight:800;letter-spacing:.3px;text-transform:uppercase}
    .sm-mongo-badge.connected{background:rgba(74,222,128,.08);color:#4ade80;border:1px solid rgba(74,222,128,.18)}
    .sm-mongo-badge.fallback{background:rgba(245,158,11,.08);color:#f59e0b;border:1px solid rgba(245,158,11,.18)}
    .sm-mongo-badge.failed{background:rgba(255,68,68,.08);color:#FF4444;border:1px solid rgba(255,68,68,.18)}
    /* ── HOSTING BADGE ── */
    .host-badge{margin-top:12px;display:flex;align-items:center;justify-content:center}
    .host-pill{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:20px;padding:5px 15px;font-size:.68rem;font-weight:700;color:#3F3F3F;text-decoration:none;transition:all .18s;letter-spacing:.2px}
    .host-pill:hover{background:rgba(255,255,255,.06);color:#717171;border-color:rgba(255,255,255,.12)}
    .host-dot{width:7px;height:7px;border-radius:50%;display:inline-block;flex-shrink:0;box-shadow:0 0 6px currentColor}
    /* ── FOOTER ── */
    footer{text-align:center;padding:32px 20px 28px;color:#2a2a2a;font-size:.73rem;border-top:1px solid rgba(255,255,255,.04)}
    footer strong{color:#3F3F3F}
    footer .tf{color:#FF0000;font-weight:800}
  </style>
</head>
<body>

<!-- ── STATS MODAL ── -->
<div class="sm-overlay" id="sm-overlay">
  <div class="sm-modal" id="sm-modal">
    <div class="sm-head">
      <span class="sm-title">&#x1F4CA; API Call Analytics</span>
      <button class="sm-close" onclick="closeStatsPopup()">&#x2715;</button>
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
            <span class="sm-count" id="sm-count-s">0 calls</span>
          </div>
        </div>
        <span class="sm-circle-lbl" style="color:#4ade80">&#x2713; Successful</span>
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
            <span class="sm-count" id="sm-count-e">0 calls</span>
          </div>
        </div>
        <span class="sm-circle-lbl" style="color:#FF4444">&#x2715; Failed</span>
      </div>
    </div>
    <div class="sm-footer" id="sm-footer">Loading&hellip;</div>
  </div>
</div>

<!-- ── INTRO ── -->
<div id="intro">
  <div class="i-wrap">
    <div class="i-icon" id="i-icon">
      <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
    </div>
    <div class="i-title" style="position:relative">
      <div class="i-word"><span>Tube</span></div><div class="i-word"><span>Fetch</span></div>
      <div class="i-title-glitch" aria-hidden="true">TubeFetch</div>
    </div>
    <div class="i-sub">TF &middot; by MJL</div>
    <div class="i-bar-track"><div class="i-bar" id="i-bar"></div></div>
    <div class="i-ver">v${version}</div>
  </div>
</div>

<!-- ── TOPBAR ── -->
<nav class="topbar">
  <a class="topbar-logo" href="#">
    <div class="topbar-icon"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
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
      <button class="bell-btn" id="bell-btn" onclick="toggleBell()" title="Changelog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span class="bell-dot" id="bell-dot"></span>
      </button>
      <div class="bell-panel" id="bell-panel">
        <div class="bell-head">
          <span class="bell-head-title">Changelog</span>
          <button class="bell-close" onclick="closeBell()">&#x2715;</button>
        </div>
        <div class="bell-list">${clItems}</div>
      </div>
    </div>
  </div>
</nav>

<!-- ── HERO ── -->
<div class="hero">
  <canvas id="hero-canvas"></canvas>
  <div class="hero-content">
    <div class="hero-eyebrow">YouTube Downloader API</div>
    <h1>Tube<span class="hero-tf">Fetch</span></h1>
    <div class="hero-sub">Real-time metadata &middot; MP4 HD &amp; MP3 download links &middot; Top 10 search results &middot; by MJL</div>
    <div class="hero-badges">
      <span class="hbadge">v${version}</span>
      <span class="hbadge">by MJL</span>
      <span class="hbadge">YouTube Only</span>
      <span class="hbadge">90s Cache</span>
    </div>
    <div class="stats-bar">
      <div class="stat-item stat-clickable" onclick="openStatsPopup()" title="View success &amp; error breakdown">
        <span class="stat-num red" id="stat-count">—<span class="db-dot fallback" id="db-dot" title="Connecting to MongoDB..."></span></span>
        <span class="stat-lbl">API Calls &#x2197;</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">v${version}</span>
        <span class="stat-lbl">Version</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">90s</span>
        <span class="stat-lbl">Cache TTL</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">3</span>
        <span class="stat-lbl">Endpoints</span>
      </div>
    </div>
  </div>
</div>

<!-- ── MAIN ── -->
<div class="wrap">

  <div class="sec-label reveal" id="endpoints">&#x26A1; Endpoints &mdash; click to expand &amp; test</div>
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
          <p class="ep-info">Pass any YouTube <code>URL</code> or plain search title. Returns full metadata — title, author, thumbnail, duration, views, description, <strong>category</strong> — plus direct <code>MP4</code> &amp; <code>MP3</code> download links. Results cached <strong>90 seconds</strong>. Every response includes <code>ApiCount</code>.</p>
          <div class="ep-input-row">
            <input class="ep-input" id="q0" type="text" placeholder="e.g. bohemian rhapsody  or  https://youtu.be/&hellip;" onkeydown="if(event.key==='Enter')fetchEp(0)"/>
            <button class="ep-fetch-btn" id="btn0" onclick="fetchEp(0)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Search
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
              <span class="ep-cached" id="cac0" style="display:none">&#x26A1; Cached</span>
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
                    <button class="r-skip-btn" onclick="skipCountdown()">Skip</button>
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
        <span class="ep-desc-label">Fast &mdash; links only <span class="ep-badge-fast">&#x26A1; v2</span></span>
        <span class="ep-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>
      </div>
      <div class="ep-body">
        <div class="ep-body-inner">
          <p class="ep-info">Faster than v1 — skips all metadata, fetches only direct <code>MP4</code> &amp; <code>MP3</code> download links. Response includes <code>credit</code>, <code>version</code>, <code>ApiCount</code>, and <code>ms</code> timing. No title, no extra fields.</p>
          <div class="ep-input-row">
            <input class="ep-input" id="q3" type="text" placeholder="e.g. never gonna give you up  or  https://youtu.be/&hellip;" onkeydown="if(event.key==='Enter')fetchEp(3)"/>
            <button class="ep-fetch-btn" id="btn3" onclick="fetchEp(3)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Search
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
              <span class="ep-cached" id="cac3" style="display:none">&#x26A1; Cached</span>
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
        <span class="ep-desc-label">Top 10 search results <span class="ep-badge-new">&#x2605; New</span></span>
        <span class="ep-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>
      </div>
      <div class="ep-body">
        <div class="ep-body-inner">
          <p class="ep-info">Returns up to <strong>10 ranked YouTube search results</strong> — each with url, title, description, channel name &amp; url, published date, duration, thumbnail, views, and <strong>category</strong>. Includes <code>credit</code>, <code>version</code>, <code>ApiCount</code>, and <code>ms</code>. No download links — use v1/v2 for those.</p>
          <div class="ep-input-row">
            <input class="ep-input" id="q4" type="text" placeholder="e.g. top hits 2025  or  relaxing lofi music" onkeydown="if(event.key==='Enter')fetchEp(4)"/>
            <button class="ep-fetch-btn" id="btn4" onclick="fetchEp(4)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Search
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
            <button class="ep-fetch-btn" id="btn1" onclick="fetchEp(1)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>Fetch
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
            <button class="ep-fetch-btn" id="btn2" onclick="fetchEp(2)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>Fetch
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
  <div class="sec-label reveal" id="faq">&#x2753; Frequently Asked Questions</div>
  <div class="faq-list reveal">${faqItems}</div>

  <div class="card about reveal" id="about">
    <div class="card-title">About TubeFetch</div>
    <p>Pass any YouTube URL or plain search title to <code>/api/v1/q</code> for full metadata or <code>/api/v2/q</code> for a faster response with just the download links. Use <code>/api/v3/q</code> to get a ranked list of up to 10 search results. Get direct <strong>MP4 HD</strong> and <strong>MP3</strong> URLs ready for bots, apps, or scripts. Results are cached for <strong>90 seconds</strong>. Every response includes a <strong>ms</strong> timing field and an <strong>ApiCount</strong> showing the total number of API calls served.</p>
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
   INTRO
════════════════════════════════ */
(function(){
  var bar = document.getElementById('i-bar');
  var intro = document.getElementById('intro');
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ bar.style.width = '100%'; }); });
  setTimeout(function(){
    var ic = document.getElementById('i-icon');
    if(ic) ic.style.animation = 'icon-in .6s cubic-bezier(.34,1.56,.64,1) both, icon-pulse 2s ease 0.6s infinite';
  }, 600);
  setTimeout(function(){
    intro.classList.add('out');
    setTimeout(function(){ intro.style.display = 'none'; initParticles(); initReveal(); fetchStats(); }, 600);
  }, 2700);
})();

/* ════════════════════════════════
   LIVE STATS
════════════════════════════════ */
function fetchStats(){
  fetch('/api/stats').then(function(r){ return r.json(); }).then(function(d){
    var el = document.getElementById('stat-count');
    var dot = document.getElementById('db-dot');
    if(el && typeof d.ApiCount === 'number'){
      el.childNodes[0].nodeValue = d.ApiCount.toLocaleString();
    }
    if(dot){
      var connected = d.mongoConnected === true;
      var status = d.mongoStatus || 'unknown';
      dot.className = 'db-dot ' + (connected ? 'connected' : (status === 'failed' || status === 'no-uri' ? 'failed' : 'fallback'));
      dot.title = connected ? 'MongoDB connected — counts persist across restarts' : 'MongoDB ' + status + ' — counts are in-memory only';
    }
  }).catch(function(){});
}
setInterval(fetchStats, 5000);

/* ════════════════════════════════
   PARTICLES
════════════════════════════════ */
var PCV, PCTX, PW, PH, PARTS = [], MOUSE = {x:-9999,y:-9999}, RAF_RUNNING = false;

function initParticles(){
  PCV = document.getElementById('hero-canvas');
  if(!PCV) return;
  var hero = PCV.parentElement;
  PCTX = PCV.getContext('2d');
  PW = PCV.width = hero.offsetWidth;
  PH = PCV.height = hero.offsetHeight;
  PARTS = [];
  for(var i = 0; i < 48; i++){
    PARTS.push({x:Math.random()*PW,y:Math.random()*PH,vx:(Math.random()-.5)*.55,vy:(Math.random()-.5)*.55,r:Math.random()*1.4+.4,a:Math.random()*.25+.08});
  }
  hero.addEventListener('mousemove',function(e){ var rect=hero.getBoundingClientRect(); MOUSE.x=e.clientX-rect.left; MOUSE.y=e.clientY-rect.top; });
  hero.addEventListener('mouseleave',function(){ MOUSE.x=-9999; MOUSE.y=-9999; });
  window.addEventListener('resize',function(){ PW=PCV.width=hero.offsetWidth; PH=PCV.height=hero.offsetHeight; });
  if(!RAF_RUNNING){ RAF_RUNNING=true; tickParticles(); }
}

function tickParticles(){
  requestAnimationFrame(tickParticles);
  PCTX.clearRect(0,0,PW,PH);
  for(var i=0;i<PARTS.length;i++){
    var p=PARTS[i];
    var mx=p.x-MOUSE.x,my=p.y-MOUSE.y,md=Math.sqrt(mx*mx+my*my);
    if(md<90&&md>0){ var f=(90-md)/90*.04; p.vx+=mx/md*f; p.vy+=my/md*f; }
    var sp=Math.sqrt(p.vx*p.vx+p.vy*p.vy);
    if(sp>1.4){ p.vx=p.vx/sp*1.4; p.vy=p.vy/sp*1.4; }
    p.x+=p.vx; p.y+=p.vy;
    if(p.x<0){p.x=0;p.vx*=-1;} if(p.x>PW){p.x=PW;p.vx*=-1;}
    if(p.y<0){p.y=0;p.vy*=-1;} if(p.y>PH){p.y=PH;p.vy*=-1;}
    PCTX.beginPath(); PCTX.arc(p.x,p.y,p.r,0,6.2832);
    PCTX.fillStyle='rgba(255,255,255,'+p.a+')'; PCTX.fill();
    for(var j=i+1;j<PARTS.length;j++){
      var q=PARTS[j],dx=p.x-q.x,dy=p.y-q.y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<115){
        PCTX.beginPath(); PCTX.moveTo(p.x,p.y); PCTX.lineTo(q.x,q.y);
        PCTX.strokeStyle='rgba(255,255,255,'+(0.12*(1-d/115))+')'; PCTX.lineWidth=.6; PCTX.stroke();
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
  var io=new IntersectionObserver(function(entries){ entries.forEach(function(e){ if(e.isIntersecting) e.target.classList.add('in-view'); }); },{threshold:.08});
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
  setTimeout(function(){ p.classList.remove('opening'); p.classList.add('open'); },220);
  setTimeout(function(){ document.addEventListener('click',bellOutside,true); },10);
}
function closeBell(){
  var p=document.getElementById('bell-panel'),b=document.getElementById('bell-btn');
  bellOpen=false; b.classList.remove('active');
  document.removeEventListener('click',bellOutside,true);
  p.classList.remove('open','opening'); p.classList.add('closing');
  setTimeout(function(){ p.classList.remove('closing'); },160);
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
  if(!n) return null;
  if(n>=1e9) return (n/1e9).toFixed(1).replace(/\\.0$/,'')+'B views';
  if(n>=1e6) return (n/1e6).toFixed(1).replace(/\\.0$/,'')+'M views';
  if(n>=1e3) return (n/1e3).toFixed(1).replace(/\\.0$/,'')+'K views';
  return n.toLocaleString()+' views';
}

function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function hl(raw){
  var e=function(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  return e(raw).replace(
    /("(?:[^"\\\\]|\\\\.)*")(\\s*:)|("(?:[^"\\\\]|\\\\.)*")|(\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)|(\\btrue\\b|\\bfalse\\b|\\bnull\\b)/g,
    function(_,key,col,str,num,bool){
      if(key) return '<span class="jk">'+key+'</span>'+col;
      if(str) return '<span class="js">'+str+'</span>';
      if(num) return '<span class="jn">'+num+'</span>';
      if(bool) return '<span class="jb">'+bool+'</span>';
      return _;
    }
  );
}

function dlIcon(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'; }

function copyRaw(n){
  if(!rawStore[n]) return;
  navigator.clipboard.writeText(rawStore[n]).then(function(){
    var b=document.querySelector('#res'+n+' .copy-btn');
    if(b){ var o=b.textContent; b.textContent='Copied!'; setTimeout(function(){ b.textContent=o; },1500); }
  });
}
function copyUrl(n){
  var u=urlStore[n]||document.getElementById('curl'+n+'-text')&&document.getElementById('curl'+n+'-text').textContent;
  if(!u) return;
  navigator.clipboard.writeText(u).then(function(){
    var b=document.querySelector('#curl'+n+' .copy-url-btn');
    if(b){ var h=b.innerHTML; b.textContent='Copied!'; setTimeout(function(){ b.innerHTML=h; },1500); }
  });
}

/* Show ApiCount badge */
function showApiCount(n, data){
  var el=document.getElementById('apc'+n);
  if(!el) return;
  if(typeof data==='object'&&data&&typeof data.ApiCount==='number'){
    el.textContent='Call #'+data.ApiCount;
    el.style.display='inline-flex';
    /* update hero stats bar */
    var sc=document.getElementById('stat-count');
    if(sc) sc.textContent=data.ApiCount.toLocaleString();
  } else {
    el.style.display='none';
  }
}

/* ════════════════════════════════
   V3 RESULT LIST
════════════════════════════════ */
function renderV3List(results){
  var list=document.getElementById('v3list');
  if(!list) return;
  if(!results||!results.length){
    list.innerHTML='<div style="font-size:.8rem;color:#3F3F3F;padding:8px 0">No results found.</div>';
    sv('v3list',true,'block');
    return;
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
  list.innerHTML=html;
  sv('v3list',true,'block');
}

/* ════════════════════════════════
   DESC TOGGLE
════════════════════════════════ */
function toggleDesc(){
  descExpanded=!descExpanded;
  document.getElementById('r-desc').classList.toggle('exp',descExpanded);
  document.getElementById('r-more').textContent=descExpanded?'Show less':'Read more';
  if(!descExpanded){
    setTimeout(function(){ var c=document.getElementById('rcard0'); if(c) c.scrollIntoView({behavior:'smooth',block:'nearest'}); },50);
  }
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
  if(!v1VideoId) return;
  sv('r-play-overlay',false); sv('r-countdown-wrap',true,'flex');
  document.getElementById('r-countdown-n').textContent='5';
  var img=document.getElementById('r-thumb-img'); if(img) img.style.opacity='.35';
  var arc=document.getElementById('r-ring-arc');
  arc.style.transition='none'; arc.style.strokeDashoffset='201';
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ arc.style.transition='stroke-dashoffset 5s linear'; arc.style.strokeDashoffset='0'; }); });
  var secs=4;
  cdInterval=setInterval(function(){ document.getElementById('r-countdown-n').textContent=String(secs); secs--; if(secs<0){clearInterval(cdInterval);cdInterval=null;} },1000);
  cdTimer=setTimeout(function(){ launchVideo(); },5000);
}
function skipCountdown(){ clearTimers(); launchVideo(); }
function launchVideo(){
  sv('r-countdown-wrap',false);
  var img=document.getElementById('r-thumb-img');
  if(img){ img.style.transition='opacity .5s ease'; img.style.opacity='0'; }
  var wrap=document.getElementById('r-yt-wrap'); wrap.style.display='block';
  withYtApi(function(){
    if(ytPlayerInstance){ try{ ytPlayerInstance.destroy(); }catch(e){} ytPlayerInstance=null; }
    var pd=document.getElementById('r-yt-player'); if(pd) pd.innerHTML='';
    ytPlayerInstance=new YT.Player('r-yt-player',{
      videoId:v1VideoId,
      width:'100%',height:'100%',
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
   BTN RESET
════════════════════════════════ */
function setBtnDefault(n){
  var btn=document.getElementById('btn'+n); if(!btn) return;
  btn.disabled=false;
  var isSearch=(n===0||n===3||n===4);
  btn.innerHTML=isSearch
    ?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Search'
    :'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>Fetch';
}

/* ════════════════════════════════
   FETCH
════════════════════════════════ */
async function fetchEp(n){
  var btn=document.getElementById('btn'+n); if(!btn) return;
  btn.disabled=true;
  btn.textContent=(n===0||n===3||n===4)?'Searching\u2026':'Fetching\u2026';

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

    showApiCount(n, data);

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
      cbEl.textContent='Cached'; cbEl.style.display=data.cached?'inline-block':'none';

      document.getElementById('r-title').textContent=info.title||data.video_id||'';
      var aEl=document.getElementById('r-author');
      aEl.textContent=info.author||''; aEl.href=info.channel_url||'#';

      var stats=[];
      var v=fmtViews(info.views);
      if(v) stats.push('<span class="r-stat">&#x1F441; '+v+'</span>');
      if(info.published) stats.push('<span class="r-stat">&#x1F4C5; '+info.published+'</span>');
      document.getElementById('r-stats').innerHTML='<span class="cat-badge" id="r-cat"></span>'+stats.join('');

      /* category badge */
      var catEl=document.getElementById('r-cat');
      if(catEl&&data.category){
        catEl.textContent=data.category;
        catEl.style.display='inline-flex';
      }

      if(info.description){
        document.getElementById('r-desc').textContent=info.description;
        descExpanded=false;
        document.getElementById('r-desc').classList.remove('exp');
        document.getElementById('r-more').textContent='Read more';
        sv('r-desc-wrap',true,'block');
      } else {
        sv('r-desc-wrap',false);
      }

      var dlRow=document.getElementById('r-dl'); dlRow.innerHTML='';
      if(media.mp4&&media.mp4.url){
        var a4=document.createElement('a');
        a4.href=media.mp4.url; a4.target='_blank'; a4.rel='noopener noreferrer';
        a4.className='dl-btn dl-mp4'; a4.innerHTML=dlIcon()+'Download MP4';
        dlRow.appendChild(a4);
      }
      if(media.mp3&&media.mp3.url){
        var a3=document.createElement('a');
        a3.href=media.mp3.url; a3.target='_blank'; a3.rel='noopener noreferrer';
        a3.className='dl-btn dl-mp3'; a3.innerHTML=dlIcon()+'Download MP3';
        dlRow.appendChild(a3);
      }
      sv('rcard0',true,'block');
    }

    /* ── V2 quick card ── */
    if(n===3&&typeof data==='object'&&data&&data.credit){
      var media3=data.media||{};
      var dlRow3=document.getElementById('v2-dl'); dlRow3.innerHTML='';
      var hasLink=false;
      if(media3.mp4&&typeof media3.mp4==='string'){
        var b4=document.createElement('a');
        b4.href=media3.mp4; b4.target='_blank'; b4.rel='noopener noreferrer';
        b4.className='dl-btn dl-mp4'; b4.innerHTML=dlIcon()+'Download MP4';
        dlRow3.appendChild(b4); hasLink=true;
      }
      if(media3.mp3&&typeof media3.mp3==='string'){
        var b3=document.createElement('a');
        b3.href=media3.mp3; b3.target='_blank'; b3.rel='noopener noreferrer';
        b3.className='dl-btn dl-mp3'; b3.innerHTML=dlIcon()+'Download MP3';
        dlRow3.appendChild(b3); hasLink=true;
      }
      if(!hasLink) dlRow3.innerHTML='<span class="dl-none">No download links available</span>';
      sv('v2card',true,'block');
    }

    /* ── V3 search results ── */
    if(n===4&&typeof data==='object'&&data&&data.results){
      renderV3List(data.results);
    }

  }catch(e){
    sv('skel'+n,false,'flex');
    rawStore[n]='Network error: '+e.message;
    document.getElementById('raw'+n).textContent=rawStore[n];
    var se=document.getElementById('stat'+n);
    se.textContent='Error'; se.className='ep-status err';
    document.getElementById('ms'+n).textContent='\u2014';
    sv('res'+n,true,'block');
  }finally{
    setBtnDefault(n);
  }
}

/* ════════════════════════════════
   STATS POPUP
════════════════════════════════ */
var SM_CIRC = 289;
var smOpen = false;

function openStatsPopup() {
  document.getElementById('sm-overlay').classList.add('open');
  smOpen = true;
  loadStatsData();
  setTimeout(function() { document.addEventListener('click', smOutside, true); }, 60);
}

function closeStatsPopup() {
  document.getElementById('sm-overlay').classList.remove('open');
  smOpen = false;
  document.removeEventListener('click', smOutside, true);
}

function smOutside(e) {
  var modal = document.getElementById('sm-modal');
  if (modal && !modal.contains(e.target)) closeStatsPopup();
}

function loadStatsData() {
  fetch('/api/stats').then(function(r) { return r.json(); }).then(function(d) {
    var total = d.ApiCount || 0;
    var s = d.successCount || 0;
    var f = d.errorCount || 0;
    var sPct = total > 0 ? Math.round(s / total * 100) : 0;
    var fPct = total > 0 ? Math.round(f / total * 100) : 0;
    var arcS = document.getElementById('sm-arc-s');
    if (arcS) arcS.style.strokeDashoffset = SM_CIRC * (1 - sPct / 100);
    document.getElementById('sm-pct-s').textContent = sPct + '%';
    document.getElementById('sm-count-s').textContent = s.toLocaleString() + ' call' + (s !== 1 ? 's' : '');
    var arcE = document.getElementById('sm-arc-e');
    if (arcE) arcE.style.strokeDashoffset = SM_CIRC * (1 - fPct / 100);
    document.getElementById('sm-pct-e').textContent = fPct + '%';
    document.getElementById('sm-count-e').textContent = f.toLocaleString() + ' call' + (f !== 1 ? 's' : '');
    var connected = d.mongoConnected === true;
    var status = d.mongoStatus || 'unknown';
    var badgeCls = connected ? 'connected' : (status === 'failed' || status === 'no-uri' ? 'failed' : 'fallback');
    var badgeTxt = connected ? '&#x25CF; MongoDB' : (status === 'no-uri' ? '&#x25CB; No URI' : status === 'failed' ? '&#x25CF; DB Error' : '&#x25CF; Connecting');
    var storeTxt = connected ? 'Counts persist across restarts' : 'In-memory only \u2014 resets on restart';
    document.getElementById('sm-footer').innerHTML =
      'Total ' + total.toLocaleString() + ' API call' + (total !== 1 ? 's' : '') + ' &middot; ' + new Date().toLocaleTimeString() +
      '<div class="sm-mongo-row"><span class="sm-mongo-badge ' + badgeCls + '">' + badgeTxt + '</span><span style="color:#444">' + storeTxt + '</span></div>';
  }).catch(function() { document.getElementById('sm-footer').textContent = 'Failed to load stats'; });
}

/* ════════════════════════════════
   HOSTING BADGE
════════════════════════════════ */
(function() {
  var hosts = [
    { check: function(h) { return h.endsWith('.replit.app') || h.endsWith('.repl.co') || h.includes('.replit.dev'); }, name: 'Replit', url: 'https://replit.com', color: '#F26207' },
    { check: function(h) { return h.endsWith('.onrender.com'); }, name: 'Render', url: 'https://render.com', color: '#46E3B7' },
    { check: function(h) { return h.endsWith('.vercel.app'); }, name: 'Vercel', url: 'https://vercel.com', color: '#F1F1F1' },
    { check: function(h) { return h.endsWith('.railway.app'); }, name: 'Railway', url: 'https://railway.app', color: '#B200FF' },
    { check: function(h) { return h.endsWith('.fly.dev'); }, name: 'Fly.io', url: 'https://fly.io', color: '#8B5CF6' },
    { check: function(h) { return h.endsWith('.herokuapp.com'); }, name: 'Heroku', url: 'https://heroku.com', color: '#430098' },
    { check: function(h) { return h.endsWith('.koyeb.app'); }, name: 'Koyeb', url: 'https://koyeb.com', color: '#2563EB' },
    { check: function(h) { return h.endsWith('.netlify.app'); }, name: 'Netlify', url: 'https://netlify.com', color: '#00C7B7' },
    { check: function(h) { return h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.'); }, name: 'Local Dev', url: '', color: '#3F3F3F' },
  ];
  var h = window.location.hostname;
  var found = null;
  for (var i = 0; i < hosts.length; i++) { if (hosts[i].check(h)) { found = hosts[i]; break; } }
  if (!found && h) found = { name: h, url: '', color: '#3F3F3F' };
  if (!found) return;
  var badge = document.getElementById('host-badge');
  if (!badge) return;
  var dot = '<span class="host-dot" style="background:' + found.color + ';box-shadow:0 0 6px ' + found.color + '40"></span>';
  if (found.url) {
    badge.innerHTML = '<a class="host-pill" href="' + found.url + '" target="_blank" rel="noopener">' + dot + 'Hosted on ' + found.name + ' &#x2197;</a>';
  } else {
    badge.innerHTML = '<span class="host-pill">' + dot + (found.name === 'Local Dev' ? 'Running Locally' : found.name) + '</span>';
  }
})();

/* ════════════════════════════════
   SECURITY — anti-scrape / anti-devtools
════════════════════════════════ */
(function() {
  /* Disable right-click context menu */
  document.addEventListener('contextmenu', function(e) { e.preventDefault(); }, true);

  /* Block common keyboard shortcuts used to view source or open devtools */
  document.addEventListener('keydown', function(e) {
    var k = e.key || '';
    /* Ctrl/Cmd + U (view-source), Ctrl/Cmd + S (save), Ctrl/Cmd + A (select-all on body) */
    if ((e.ctrlKey || e.metaKey) && (k === 'u' || k === 'U' || k === 's' || k === 'S')) {
      e.preventDefault(); return false;
    }
    /* F12 */
    if (k === 'F12') { e.preventDefault(); return false; }
    /* Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C */
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'i' || k === 'I' || k === 'j' || k === 'J' || k === 'c' || k === 'C')) {
      e.preventDefault(); return false;
    }
  }, true);

  /* Detect devtools open via timing trick and blur content */
  var _dt = false;
  function _chk() {
    var t = new Date();
    debugger;
    if (new Date() - t > 100 && !_dt) {
      _dt = true;
      document.body.style.filter = 'blur(8px)';
      document.body.style.pointerEvents = 'none';
    } else if (new Date() - t <= 100 && _dt) {
      _dt = false;
      document.body.style.filter = '';
      document.body.style.pointerEvents = '';
    }
  }
  setInterval(_chk, 1500);

  /* Disable drag on images */
  document.addEventListener('dragstart', function(e) { e.preventDefault(); }, true);
})();
</script>
</body>
</html>`;
}

router.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'unsafe-inline' https://www.youtube.com https://www.youtube-nocookie.com; style-src 'unsafe-inline'; img-src * data:; connect-src 'self'; frame-src https://www.youtube.com https://www.youtube-nocookie.com; frame-ancestors 'none'",
  );
  res.send(buildHtml(VERSION));
});

export default router;
