import { Router, type IRouter } from "express";
import { VERSION } from "../lib/version";

const router: IRouter = Router();

const CHANGELOG: { version: string; date: string; tag: string; notes: string[] }[] = [
  {
    version: "2.0.0",
    date: "2026-05-05",
    tag: "current",
    notes: [
      "Full premium redesign — Awwwards-level UI with Three.js WebGL hero",
      "GSAP ScrollTrigger scroll-reveal with stagger on all sections",
      "Custom cursor with magnetic button effect",
      "Aurora gradient blobs + grain noise overlay",
      "Cinematic GSAP intro with char-by-char text reveal",
      "Adaptive performance — lighter effects on mobile & low-end devices",
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
    ],
  },
  {
    version: "1.0.6",
    date: "2026-05-04",
    tag: "",
    notes: [
      "Fixed 'Read more' overflow — long text scrolls in bounded area",
      "API v2 revamp: credit, version, ms and flat media.mp4/mp3 URLs",
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0"/>
  <title>TubeFetch — MJL</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  <style>
    /* ── RESET & BASE ── */
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth;overflow-x:hidden}
    body{
      font-family:'Inter',system-ui,sans-serif;
      background:#07070A;color:#EDEDED;
      min-height:100vh;overflow-x:hidden;
      user-select:none;-webkit-user-select:none;
    }
    pre,code,input,textarea,[data-select]{user-select:text;-webkit-user-select:text}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:4px}
    ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.2)}

    /* ── CSS VARS ── */
    :root{
      --red:#FF0000;--red2:#CC0000;--red-glow:rgba(255,0,0,.35);
      --surface:rgba(255,255,255,.03);--surface2:rgba(255,255,255,.055);
      --border:rgba(255,255,255,.07);--border2:rgba(255,255,255,.13);
      --border-red:rgba(255,50,50,.3);
      --txt1:#EDEDED;--txt2:#888;--txt3:#3A3A3A;
      --radius:16px;--radius-sm:10px;
    }

    /* ── GRAIN OVERLAY ── */
    #grain{
      position:fixed;inset:0;z-index:9000;pointer-events:none;
      opacity:.035;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size:160px;
    }

    /* ── AURORA BACKGROUND ── */
    #aurora{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
    .aur{
      position:absolute;border-radius:50%;
      filter:blur(100px);opacity:.12;
      animation:aur-drift 20s ease-in-out infinite alternate;
    }
    .aur1{width:700px;height:500px;background:radial-gradient(circle,#FF0000,transparent 70%);top:-200px;left:-150px;animation-duration:22s}
    .aur2{width:500px;height:400px;background:radial-gradient(circle,#8B0000,transparent 70%);top:30%;right:-200px;animation-duration:28s;animation-delay:-10s}
    .aur3{width:400px;height:300px;background:radial-gradient(circle,#FF3300,transparent 70%);bottom:-100px;left:30%;animation-duration:18s;animation-delay:-5s}
    @keyframes aur-drift{0%{transform:translate(0,0) scale(1)}100%{transform:translate(40px,30px) scale(1.08)}}

    /* ── CUSTOM CURSOR ── */
    #cur-dot{
      position:fixed;width:6px;height:6px;background:#FF0000;border-radius:50%;
      pointer-events:none;z-index:9999;transform:translate(-50%,-50%);
      transition:transform .1s,background .2s;
      box-shadow:0 0 8px #FF0000;
    }
    #cur-ring{
      position:fixed;width:36px;height:36px;border:1.5px solid rgba(255,0,0,.5);
      border-radius:50%;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);
      transition:width .25s,height .25s,opacity .25s,border-color .25s;
    }
    body.cur-hover #cur-ring{width:52px;height:52px;border-color:rgba(255,0,0,.8)}
    body.cur-text #cur-dot{transform:translate(-50%,-50%) scale(.5)}
    @media(hover:none){#cur-dot,#cur-ring{display:none}}

    /* ── INTRO ── */
    #intro{
      position:fixed;inset:0;z-index:8000;background:#07070A;
      display:flex;align-items:center;justify-content:center;
      overflow:hidden;
    }
    #intro-bg{
      position:absolute;inset:0;
      background-image:
        linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),
        linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);
      background-size:48px 48px;
      mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black,transparent);
    }
    .i-wrap{text-align:center;position:relative;z-index:2;display:flex;flex-direction:column;align-items:center}
    .i-icon{
      width:96px;height:96px;border-radius:28px;
      background:linear-gradient(135deg,#CC0000,#FF2222);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 0 1px rgba(255,255,255,.1),0 0 60px var(--red-glow),0 0 120px rgba(255,0,0,.1);
      margin-bottom:28px;position:relative;overflow:hidden;opacity:0;
    }
    .i-icon::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.18),transparent 60%)}
    .i-icon svg{width:42px;height:42px;fill:#fff;position:relative;z-index:1}
    .i-chars{display:flex;align-items:center;justify-content:center;gap:0;overflow:hidden;font-size:clamp(2.6rem,8vw,3.6rem);font-weight:900;letter-spacing:-3px;line-height:1}
    .i-char{display:inline-block;transform:translateY(110%);opacity:0}
    .i-char.red{color:var(--red)}
    .i-sub{font-size:.7rem;font-weight:700;color:var(--txt3);letter-spacing:4px;text-transform:uppercase;margin-top:14px;opacity:0}
    .i-bar-track{width:200px;height:1.5px;background:rgba(255,255,255,.06);border-radius:2px;margin-top:36px;overflow:hidden;opacity:0}
    .i-bar{height:100%;width:0%;background:linear-gradient(90deg,var(--red2),var(--red));border-radius:2px;box-shadow:0 0 10px var(--red)}
    .i-ver{color:var(--txt3);font-size:.62rem;font-family:monospace;margin-top:10px;opacity:0;letter-spacing:1px}
    .i-scanline{
      position:absolute;left:0;right:0;height:1.5px;top:-4px;
      background:linear-gradient(90deg,transparent 0%,rgba(255,0,0,.6) 50%,transparent 100%);
      pointer-events:none;z-index:3;
    }

    /* ── TOPBAR ── */
    #page{position:relative;z-index:1;opacity:0}
    .topbar{
      position:sticky;top:0;z-index:200;height:60px;
      background:rgba(7,7,10,.75);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
      border-bottom:1px solid var(--border);
      display:flex;align-items:center;justify-content:space-between;padding:0 24px;
    }
    .topbar-inner-line{
      position:absolute;bottom:0;left:0;right:0;height:1px;
      background:linear-gradient(90deg,transparent,rgba(255,0,0,.2),transparent);
      pointer-events:none;
    }
    .topbar-logo{display:flex;align-items:center;gap:10px;text-decoration:none}
    .topbar-icon{
      width:32px;height:32px;border-radius:9px;
      background:linear-gradient(135deg,var(--red2),var(--red));
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
      box-shadow:0 0 16px rgba(255,0,0,.25);
      transition:box-shadow .25s;
    }
    .topbar-logo:hover .topbar-icon{box-shadow:0 0 24px rgba(255,0,0,.45)}
    .topbar-icon svg{width:15px;height:15px;fill:#fff}
    .topbar-name{font-weight:900;font-size:1rem;color:var(--txt1);letter-spacing:-.4px}
    .topbar-tf{font-size:.58rem;font-weight:800;color:var(--red);letter-spacing:2px;margin-left:3px;vertical-align:middle}
    .topbar-ver{font-size:.62rem;color:var(--txt3);font-family:monospace;margin-left:6px;opacity:.7}
    .topbar-right{display:flex;align-items:center;gap:8px}
    .nav-links{display:flex;gap:2px}
    .nav-link{
      color:var(--txt2);text-decoration:none;font-size:.78rem;font-weight:600;
      padding:6px 12px;border-radius:8px;transition:all .2s;white-space:nowrap;
    }
    .nav-link:hover{color:var(--txt1);background:var(--surface2)}
    @media(max-width:560px){.nav-links{display:none}}

    /* ── BELL ── */
    .bell-wrap{position:relative}
    .bell-btn{
      background:var(--surface);border:1px solid var(--border);
      border-radius:10px;width:40px;height:40px;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;color:var(--txt2);transition:all .2s;position:relative;
    }
    .bell-btn:hover{background:var(--surface2);color:var(--txt1);border-color:var(--border2)}
    .bell-btn.active{background:rgba(255,0,0,.08);color:#FF4444;border-color:var(--border-red)}
    .bell-btn svg{width:16px;height:16px;transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
    .bell-btn.active svg{transform:rotate(-12deg)}
    .bell-dot{
      position:absolute;top:6px;right:6px;width:7px;height:7px;
      background:var(--red);border-radius:50%;border:1.5px solid #07070A;
      animation:bell-pulse 2s ease infinite;
    }
    @keyframes bell-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.7)}}
    .bell-panel{
      display:none;position:absolute;top:calc(100% + 14px);right:0;width:320px;
      background:rgba(12,12,16,.96);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);
      border:1px solid var(--border);border-radius:20px;
      box-shadow:0 32px 80px rgba(0,0,0,.95),0 0 0 1px rgba(255,255,255,.03);
      z-index:300;overflow:hidden;transform-origin:top right;
    }
    .bell-panel.opening{display:block;animation:bp-in .22s cubic-bezier(.34,1.2,.64,1) both}
    .bell-panel.open{display:block}
    .bell-panel.closing{display:block;animation:bp-out .18s ease forwards}
    @keyframes bp-in{from{opacity:0;transform:scale(.88) translateY(-12px)}to{opacity:1;transform:none}}
    @keyframes bp-out{from{opacity:1;transform:none}to{opacity:0;transform:scale(.88) translateY(-12px)}}
    .bell-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 14px;border-bottom:1px solid var(--border)}
    .bell-head-title{
      font-size:.68rem;font-weight:800;color:var(--txt1);letter-spacing:1px;
      text-transform:uppercase;display:flex;align-items:center;gap:8px;
    }
    .bell-head-title::before{content:'';width:7px;height:7px;background:var(--red);border-radius:50%;box-shadow:0 0 8px var(--red)}
    .bell-close{background:none;border:none;color:var(--txt3);cursor:pointer;padding:4px 8px;border-radius:6px;transition:all .15s;font-size:.9rem;line-height:1}
    .bell-close:hover{color:var(--txt1);background:var(--surface2)}
    .bell-list{max-height:380px;overflow-y:auto;padding:8px 0}
    .bell-list::-webkit-scrollbar{width:3px}
    .bell-list::-webkit-scrollbar-thumb{background:#222;border-radius:2px}
    .cl-item{padding:13px 18px;border-bottom:1px solid rgba(255,255,255,.04)}
    .cl-item:last-child{border-bottom:none}
    .cl-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
    .cl-left{display:flex;align-items:center;gap:8px}
    .cl-ver{font-size:.78rem;font-weight:800;color:var(--txt1);font-family:monospace}
    .cl-tag{font-size:.58rem;font-weight:800;padding:2px 9px;border-radius:20px;letter-spacing:.5px;text-transform:uppercase}
    .cl-tag.current{background:rgba(255,0,0,.1);color:#FF4444;border:1px solid rgba(255,0,0,.18)}
    .cl-tag.init{background:rgba(255,255,255,.05);color:var(--txt2)}
    .cl-date{font-size:.65rem;color:var(--txt3)}
    .cl-notes{list-style:none;display:flex;flex-direction:column;gap:5px}
    .cl-notes li{font-size:.7rem;color:var(--txt2);padding-left:14px;position:relative;line-height:1.5}
    .cl-notes li::before{content:'·';position:absolute;left:0;color:var(--red);font-weight:900;font-size:1.1em}

    /* ── HERO ── */
    .hero{
      position:relative;overflow:hidden;
      padding:clamp(72px,12vw,120px) 20px clamp(56px,8vw,88px);
      text-align:center;
    }
    #hero-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}
    .hero-glow{
      position:absolute;inset:0;pointer-events:none;z-index:0;
      background:radial-gradient(ellipse 70% 55% at 50% 0%,rgba(180,0,0,.28) 0%,transparent 70%);
    }
    .hero-content{position:relative;z-index:2}
    .hero-eyebrow{
      display:inline-flex;align-items:center;gap:8px;
      background:rgba(255,0,0,.07);border:1px solid rgba(255,0,0,.18);
      border-radius:24px;padding:5px 16px;
      font-size:.65rem;font-weight:800;color:rgba(255,80,80,.9);
      letter-spacing:2.5px;text-transform:uppercase;margin-bottom:20px;
    }
    .hero-eyebrow-dot{width:6px;height:6px;background:var(--red);border-radius:50%;box-shadow:0 0 8px var(--red);flex-shrink:0;animation:bell-pulse 2s ease infinite}
    .hero h1{
      font-size:clamp(3rem,9vw,5rem);font-weight:900;color:var(--txt1);
      letter-spacing:-4px;line-height:1;
    }
    .hero-tf{
      background:linear-gradient(100deg,#FF4444 0%,#FF0000 50%,#CC0000 100%);
      -webkit-background-clip:text;background-clip:text;color:transparent;
    }
    .hero-sub{
      margin-top:20px;color:rgba(237,237,237,.45);
      font-size:clamp(.85rem,2.2vw,1rem);line-height:1.7;max-width:520px;margin-left:auto;margin-right:auto;
    }
    .hero-badges{
      display:flex;gap:8px;justify-content:center;margin-top:28px;flex-wrap:wrap;
    }
    .hbadge{
      background:var(--surface);backdrop-filter:blur(8px);
      color:rgba(237,237,237,.55);padding:5px 15px;border-radius:24px;
      font-size:.67rem;font-weight:600;letter-spacing:.4px;
      border:1px solid var(--border);transition:all .22s;cursor:default;
    }
    .hbadge:hover{background:var(--surface2);color:var(--txt1);border-color:var(--border2)}

    /* ── WRAP ── */
    .wrap{max-width:880px;margin:0 auto;padding:clamp(32px,5vw,56px) 16px 100px}
    .sec-label{
      font-size:.62rem;font-weight:800;color:var(--txt3);text-transform:uppercase;
      letter-spacing:1.5px;margin-bottom:14px;padding-left:2px;
      display:flex;align-items:center;gap:12px;
    }
    .sec-label::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(255,255,255,.06),transparent)}

    /* ── ENDPOINT CARDS ── */
    .ep-list{display:flex;flex-direction:column;gap:8px;margin-bottom:40px}
    .ep-card{
      background:var(--surface);border:1px solid var(--border);
      border-radius:var(--radius);overflow:hidden;
      transition:border-color .3s,box-shadow .3s,transform .25s;
      backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
      position:relative;
    }
    .ep-card::before{
      content:'';position:absolute;inset:0;border-radius:var(--radius);
      background:linear-gradient(135deg,rgba(255,255,255,.04),transparent 60%);
      pointer-events:none;
    }
    .ep-card:hover{border-color:var(--border2);transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,.5)}
    .ep-card.open{
      border-color:var(--border-red);transform:none;
      box-shadow:0 0 0 1px rgba(255,0,0,.06),0 16px 48px rgba(0,0,0,.55);
    }
    .ep-header{
      display:flex;align-items:center;gap:12px;padding:16px 20px;
      cursor:pointer;transition:background .2s;
    }
    .ep-header:hover{background:rgba(255,255,255,.02)}
    .ep-method{
      font-size:.6rem;font-weight:900;padding:3px 10px;border-radius:6px;
      background:rgba(74,222,128,.07);color:#4ade80;letter-spacing:.6px;flex-shrink:0;
      border:1px solid rgba(74,222,128,.13);font-family:monospace;
    }
    .ep-method.v2{background:rgba(96,165,250,.07);color:#60a5fa;border-color:rgba(96,165,250,.13)}
    .ep-method.health{background:rgba(168,85,247,.07);color:#c084fc;border-color:rgba(168,85,247,.13)}
    .ep-method.uptime{background:rgba(251,191,36,.07);color:#fbbf24;border-color:rgba(251,191,36,.13)}
    .ep-path{font-family:'Menlo','Consolas',monospace;font-size:.8rem;color:#60a5fa;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .ep-desc{font-size:.72rem;color:var(--txt3);white-space:nowrap;margin-right:4px}
    @media(max-width:520px){.ep-desc{display:none}}
    .ep-chev{color:var(--txt3);flex-shrink:0;transition:transform .35s cubic-bezier(.34,1.2,.64,1),color .2s}
    .ep-chev svg{width:14px;height:14px}
    .ep-card.open .ep-chev{transform:rotate(180deg);color:var(--red)}
    .ep-body{max-height:0;overflow:hidden;transition:max-height .4s cubic-bezier(.4,0,.2,1)}
    .ep-card.open .ep-body{max-height:2400px}
    .ep-body-inner{padding:20px;border-top:1px solid var(--border)}
    .ep-info{font-size:.8rem;color:var(--txt2);line-height:1.8;margin-bottom:18px}
    .ep-info code{background:rgba(255,255,255,.06);color:var(--txt1);padding:1px 7px;border-radius:5px;font-size:.83em;font-family:monospace}
    .ep-info strong{color:#AAAAAA}
    .ep-fast-badge{
      display:inline-flex;align-items:center;gap:4px;
      background:rgba(96,165,250,.07);color:#60a5fa;
      border:1px solid rgba(96,165,250,.13);border-radius:5px;
      font-size:.63rem;font-weight:800;padding:2px 8px;letter-spacing:.5px;margin-left:6px;vertical-align:middle;
    }

    /* ── INPUT ROW ── */
    .ep-input-row{display:flex;gap:8px;margin-bottom:16px}
    .ep-input{
      flex:1;min-width:0;background:rgba(255,255,255,.03);
      border:1px solid var(--border);border-radius:var(--radius-sm);
      color:var(--txt1);padding:12px 16px;font-size:.84rem;outline:none;
      transition:border-color .25s,box-shadow .25s,background .25s;
      font-family:'Inter',sans-serif;
    }
    .ep-input:focus{
      border-color:rgba(255,0,0,.35);
      box-shadow:0 0 0 3px rgba(255,0,0,.07);
      background:rgba(255,255,255,.05);
    }
    .ep-input::placeholder{color:var(--txt3)}
    @media(max-width:460px){.ep-input-row{flex-direction:column}}

    /* ── FETCH BUTTON (magnetic) ── */
    .ep-fetch-btn{
      background:linear-gradient(135deg,var(--red2),var(--red));
      color:#fff;border:none;padding:12px 22px;border-radius:var(--radius-sm);
      cursor:pointer;font-size:.82rem;font-weight:700;font-family:'Inter',sans-serif;
      transition:box-shadow .22s,opacity .22s;
      white-space:nowrap;display:flex;align-items:center;gap:8px;
      box-shadow:0 4px 20px rgba(255,0,0,.2);
      position:relative;overflow:hidden;
    }
    .ep-fetch-btn::before{
      content:'';position:absolute;inset:0;
      background:linear-gradient(135deg,rgba(255,255,255,.15),transparent 60%);
      pointer-events:none;
    }
    .ep-fetch-btn:hover:not(:disabled){box-shadow:0 6px 28px rgba(255,0,0,.38)}
    .ep-fetch-btn:disabled{background:rgba(255,255,255,.05);color:var(--txt3);cursor:not-allowed;box-shadow:none}
    .ep-fetch-btn svg{width:13px;height:13px;flex-shrink:0}
    .ep-fetch-btn .ripple{
      position:absolute;border-radius:50%;
      background:rgba(255,255,255,.25);
      transform:scale(0);animation:ripple .55s ease-out;
      pointer-events:none;
    }
    @keyframes ripple{to{transform:scale(4);opacity:0}}

    /* ── RESULT META ── */
    .ep-result{display:none;margin-top:8px}
    .ep-result-meta{display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap}
    .ep-status{font-size:.65rem;font-weight:800;padding:3px 10px;border-radius:6px;letter-spacing:.4px;font-family:monospace}
    .ep-status.ok{background:rgba(74,222,128,.07);color:#4ade80;border:1px solid rgba(74,222,128,.13)}
    .ep-status.err{background:rgba(255,0,0,.07);color:#FF4444;border:1px solid rgba(255,0,0,.13)}
    .ep-ms{font-size:.65rem;color:var(--txt3);font-family:monospace}
    .ep-cached{font-size:.65rem;color:#f59e0b;background:rgba(245,158,11,.07);padding:2px 9px;border-radius:5px;font-weight:700;border:1px solid rgba(245,158,11,.13)}

    /* ── COPY STRIP ── */
    .copy-strip{
      display:flex;align-items:center;gap:8px;
      background:rgba(255,255,255,.025);border:1px solid var(--border);
      border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:14px;overflow:hidden;
    }
    .copy-strip code{flex:1;font-family:'Menlo','Consolas',monospace;font-size:.7rem;color:#60a5fa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .copy-btn{
      background:rgba(255,255,255,.06);color:#999;border:none;border-radius:6px;
      padding:4px 12px;font-size:.65rem;font-weight:700;cursor:pointer;white-space:nowrap;
      transition:all .18s;flex-shrink:0;display:flex;align-items:center;gap:4px;font-family:'Inter',sans-serif;
    }
    .copy-btn:hover{background:rgba(255,255,255,.11);color:var(--txt1)}
    .copy-btn svg{width:10px;height:10px}

    /* ── JSON BOX ── */
    .jbox{
      background:rgba(0,0,0,.4);border:1px solid var(--border);border-radius:12px;
      padding:14px 16px;font-family:'Menlo','Consolas',monospace;font-size:.72rem;
      line-height:1.75;overflow-x:auto;max-height:320px;overflow-y:auto;
      color:var(--txt2);
    }
    .jbox::-webkit-scrollbar{width:3px;height:3px}
    .jbox::-webkit-scrollbar-thumb{background:#222;border-radius:2px}
    .j-key{color:#7dd3fc}.j-str{color:#86efac}.j-num{color:#fda4af}
    .j-bool{color:#c084fc}.j-null{color:var(--txt3)}

    /* ── SKELETON ── */
    .skel{display:none;flex-direction:column;gap:10px;margin-top:8px}
    .skel-line{
      height:12px;border-radius:6px;
      background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.09) 50%,rgba(255,255,255,.04) 75%);
      background-size:200% 100%;animation:skel-shimmer 1.4s ease infinite;
    }
    .skel-line:nth-child(2){width:80%}.skel-line:nth-child(3){width:60%}
    @keyframes skel-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

    /* ── V1 RICH CARD ── */
    .r-card{
      background:rgba(255,255,255,.02);border:1px solid var(--border);
      border-radius:var(--radius);overflow:hidden;margin-bottom:14px;
      animation:card-in .3s cubic-bezier(.34,1.2,.64,1) both;
    }
    @keyframes card-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
    .r-inner{display:grid;grid-template-columns:200px 1fr}
    @media(max-width:580px){.r-inner{grid-template-columns:1fr}}
    .r-thumb{position:relative;background:#0a0a0a;min-height:130px;overflow:hidden}
    .r-thumb-img{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0;transition:opacity .55s ease}
    .r-dur{position:absolute;bottom:8px;right:8px;z-index:4;background:rgba(0,0,0,.88);color:var(--txt1);font-size:.6rem;font-weight:700;padding:2px 7px;border-radius:4px;font-family:monospace}
    .r-cached-b{position:absolute;top:8px;left:8px;z-index:4;display:none;background:rgba(255,0,0,.14);color:#FF4444;font-size:.58rem;font-weight:800;padding:2px 8px;border-radius:4px;letter-spacing:.5px;text-transform:uppercase;border:1px solid rgba(255,0,0,.2)}
    .r-play-overlay{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(0,0,0,.28);cursor:pointer;transition:background .2s}
    .r-play-overlay:hover{background:rgba(0,0,0,.45)}
    .r-play-circle{width:54px;height:54px;border-radius:50%;background:rgba(220,0,0,.9);display:flex;align-items:center;justify-content:center;box-shadow:0 0 28px rgba(255,0,0,.5);transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .22s}
    .r-play-overlay:hover .r-play-circle{transform:scale(1.12);box-shadow:0 0 36px rgba(255,0,0,.75)}
    .r-play-circle svg{width:21px;height:21px;fill:#fff;margin-left:4px}
    .r-play-lbl{font-size:.64rem;font-weight:800;color:rgba(255,255,255,.7);letter-spacing:1.5px;text-transform:uppercase}
    .r-countdown-wrap{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.55)}
    .r-ring-svg{width:94px;height:94px;transform:rotate(-90deg)}
    .r-ring-bg{fill:none;stroke:rgba(255,255,255,.08);stroke-width:4}
    .r-ring-arc{fill:none;stroke:var(--red);stroke-width:4;stroke-linecap:round;stroke-dasharray:201;stroke-dashoffset:201;transition:stroke-dashoffset 5s linear;filter:drop-shadow(0 0 5px var(--red))}
    .r-countdown-n{position:absolute;font-size:1.9rem;font-weight:900;color:var(--txt1);text-shadow:0 0 24px rgba(255,0,0,.6)}
    .r-skip-btn{margin-top:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.55);font-size:.63rem;font-weight:700;padding:5px 14px;border-radius:6px;cursor:pointer;transition:all .18s;letter-spacing:.6px}
    .r-skip-btn:hover{background:rgba(255,255,255,.16);color:#fff}
    .r-yt-wrap{position:absolute;inset:0;z-index:5;display:none;animation:yt-fade .5s ease both}
    @keyframes yt-fade{from{opacity:0}to{opacity:1}}
    .r-yt-frame{width:100%;height:100%;border:none;display:block}
    .r-meta{padding:16px 18px}
    .r-title{font-size:.94rem;font-weight:700;color:var(--txt1);line-height:1.4;margin-bottom:8px}
    .r-author{font-size:.75rem;color:var(--red);text-decoration:none;font-weight:600;display:inline-block;margin-bottom:8px;transition:opacity .18s}
    .r-author:hover{opacity:.75}
    .r-stats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px}
    .r-stat{font-size:.7rem;color:var(--txt2);display:flex;align-items:center;gap:4px}
    .r-desc-wrap{margin-bottom:12px}
    .r-desc{font-size:.76rem;color:var(--txt2);line-height:1.65;max-height:64px;overflow:hidden;transition:max-height .3s ease}
    .r-desc.exp{max-height:400px;overflow-y:auto}
    .r-more{background:none;border:none;color:var(--red);font-size:.72rem;font-weight:700;cursor:pointer;padding:0;font-family:'Inter',sans-serif;transition:opacity .18s}
    .r-more:hover{opacity:.7}
    .r-dl{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .dl-btn{
      display:inline-flex;align-items:center;gap:7px;
      padding:9px 18px;border-radius:9px;font-size:.78rem;font-weight:700;
      text-decoration:none;transition:all .22s;
      font-family:'Inter',sans-serif;position:relative;overflow:hidden;
    }
    .dl-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.12),transparent 60%);pointer-events:none}
    .dl-mp4{background:linear-gradient(135deg,var(--red2),var(--red));color:#fff;box-shadow:0 4px 18px rgba(255,0,0,.2)}
    .dl-mp4:hover{box-shadow:0 6px 26px rgba(255,0,0,.38);transform:translateY(-1px)}
    .dl-mp3{background:rgba(255,255,255,.06);color:var(--txt1);border:1px solid var(--border)}
    .dl-mp3:hover{background:rgba(255,255,255,.1);border-color:var(--border2);transform:translateY(-1px)}
    .dl-btn svg{width:13px;height:13px}
    .dl-none{font-size:.75rem;color:var(--txt3)}

    /* ── V2 CARD ── */
    .v2-card{
      background:rgba(255,255,255,.02);border:1px solid var(--border);
      border-radius:var(--radius);padding:16px 18px;margin-bottom:14px;
      animation:card-in .3s cubic-bezier(.34,1.2,.64,1) both;
    }
    .v2-card-label{font-size:.62rem;font-weight:700;color:var(--txt3);letter-spacing:1px;text-transform:uppercase;margin-bottom:12px}

    /* ── FOOTER ── */
    .footer{text-align:center;padding:40px 20px;border-top:1px solid var(--border)}
    .footer-txt{font-size:.7rem;color:var(--txt3);letter-spacing:.5px}
    .footer-txt a{color:var(--red);text-decoration:none;font-weight:700;transition:opacity .18s}
    .footer-txt a:hover{opacity:.7}

    /* ── SCROLL REVEAL ── */
    .reveal{opacity:0;transform:translateY(24px);will-change:opacity,transform}
    .reveal.in-view{opacity:1;transform:none;transition:opacity .6s cubic-bezier(.25,.46,.45,.94),transform .6s cubic-bezier(.25,.46,.45,.94)}

    /* ── MEDIA RESPONSIVE ── */
    @media(max-width:600px){
      .hero h1{letter-spacing:-2px}
      .r-meta{padding:12px 14px}
    }
  </style>
</head>
<body>

<!-- Grain texture overlay -->
<div id="grain" aria-hidden="true"></div>

<!-- Aurora blobs -->
<div id="aurora" aria-hidden="true">
  <div class="aur aur1"></div>
  <div class="aur aur2"></div>
  <div class="aur aur3"></div>
</div>

<!-- Custom cursor -->
<div id="cur-dot" aria-hidden="true"></div>
<div id="cur-ring" aria-hidden="true"></div>

<!-- ── CINEMATIC INTRO ── -->
<div id="intro" aria-hidden="true">
  <div id="intro-bg"></div>
  <div class="i-scanline" id="i-scanline"></div>
  <div class="i-wrap">
    <div class="i-icon" id="i-icon">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5v-7l6.25 3.5-6.25 3.5z"/></svg>
    </div>
    <div class="i-chars" id="i-chars">
      <span class="i-char">T</span><span class="i-char">u</span><span class="i-char">b</span><span class="i-char">e</span><span class="i-char red">F</span><span class="i-char red">e</span><span class="i-char red">t</span><span class="i-char red">c</span><span class="i-char red">h</span>
    </div>
    <div class="i-sub" id="i-sub">YouTube Media API</div>
    <div class="i-bar-track" id="i-bar-track">
      <div class="i-bar" id="i-bar"></div>
    </div>
    <div class="i-ver" id="i-ver">v${version} — by MJL</div>
  </div>
</div>

<!-- ── MAIN PAGE ── -->
<div id="page">

  <!-- NAVBAR -->
  <nav class="topbar">
    <div class="topbar-inner-line"></div>
    <a class="topbar-logo magnet" href="/">
      <div class="topbar-icon">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5v-7l6.25 3.5-6.25 3.5z"/></svg>
      </div>
      <span class="topbar-name">TubeFetch<span class="topbar-tf">TF</span></span>
      <span class="topbar-ver">v${version}</span>
    </a>
    <div class="topbar-right">
      <nav class="nav-links">
        <a class="nav-link" href="#endpoints">Endpoints</a>
        <a class="nav-link" href="#about">About</a>
      </nav>
      <div class="bell-wrap">
        <button class="bell-btn magnet" id="bell-btn" aria-label="Changelog" onclick="toggleBell()">
          <div class="bell-dot" id="bell-dot"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </button>
        <div class="bell-panel" id="bell-panel">
          <div class="bell-head">
            <div class="bell-head-title">Changelog</div>
            <button class="bell-close" onclick="closeBell()">&#x2715;</button>
          </div>
          <div class="bell-list">${clItems}</div>
        </div>
      </div>
    </div>
  </nav>

  <!-- HERO -->
  <section class="hero" id="about">
    <canvas id="hero-canvas" aria-hidden="true"></canvas>
    <div class="hero-glow" aria-hidden="true"></div>
    <div class="hero-content" id="hero-content">
      <div class="hero-eyebrow">
        <span class="hero-eyebrow-dot"></span>
        Free YouTube Media API
      </div>
      <h1>Fetch Any Video<br/><span class="hero-tf">In Milliseconds</span></h1>
      <p class="hero-sub">A blazing-fast REST API that resolves YouTube URLs and search queries into direct MP4 + MP3 download links. No auth required.</p>
      <div class="hero-badges">
        <span class="hbadge">⚡ 90s Cache</span>
        <span class="hbadge">🎬 MP4 HD</span>
        <span class="hbadge">🎵 MP3 Audio</span>
        <span class="hbadge">🔍 Search</span>
        <span class="hbadge">🌐 No Auth</span>
      </div>
    </div>
  </section>

  <!-- ENDPOINTS -->
  <main class="wrap" id="endpoints">
    <div class="sec-label reveal">API Endpoints</div>
    <div class="ep-list">

      <!-- V1 Full -->
      <div class="ep-card reveal" id="card0">
        <div class="ep-header" onclick="toggleCard(0)">
          <span class="ep-method">GET</span>
          <span class="ep-path">/api/v1/q?=&lt;query&gt;</span>
          <span class="ep-desc">Full metadata + links</span>
          <span class="ep-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>
        </div>
        <div class="ep-body">
          <div class="ep-body-inner">
            <div class="ep-info">
              Pass a <strong>YouTube URL</strong> or a <strong>search query</strong> as the query parameter.<br/>
              Returns full metadata: title, author, thumbnail, duration, views, description, and direct <code>mp4</code> + <code>mp3</code> download URLs.
              Responses are cached for <code>90 seconds</code>.
            </div>
            <div class="ep-input-row">
              <input class="ep-input" id="q0" type="text" placeholder="e.g. lay me down sam smith" autocomplete="off" onkeydown="if(event.key==='Enter')fetchEp(0)"/>
              <button class="ep-fetch-btn magnet" id="btn0" onclick="fetchEp(0)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Search
              </button>
            </div>
            <div class="skel" id="skel0"><div class="skel-line"></div><div class="skel-line"></div><div class="skel-line"></div></div>
            <div class="ep-result" id="res0">
              <div class="ep-result-meta">
                <span class="ep-status" id="stat0"></span>
                <span class="ep-ms" id="ms0"></span>
                <span class="ep-cached" id="cac0" style="display:none">Cached</span>
              </div>
              <div class="copy-strip" id="curl0" style="display:none">
                <code id="curl0-text"></code>
                <button class="copy-btn" onclick="copyUrl(0)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</button>
              </div>
              <!-- V1 rich card -->
              <div class="r-card" id="rcard0" style="display:none">
                <div class="r-inner">
                  <div class="r-thumb">
                    <img class="r-thumb-img" id="r-thumb-img" src="" alt=""/>
                    <span class="r-dur" id="r-dur" style="display:none"></span>
                    <span class="r-cached-b" id="r-cached-b"></span>
                    <div class="r-play-overlay" id="r-play-overlay" onclick="startPreview()" style="display:none">
                      <div class="r-play-circle"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
                      <span class="r-play-lbl">Preview</span>
                    </div>
                    <div class="r-countdown-wrap" id="r-countdown-wrap" style="display:none">
                      <svg class="r-ring-svg" viewBox="0 0 64 64">
                        <circle class="r-ring-bg" cx="32" cy="32" r="28"/>
                        <circle class="r-ring-arc" id="r-ring-arc" cx="32" cy="32" r="28" stroke-dasharray="176" stroke-dashoffset="176"/>
                      </svg>
                      <span class="r-countdown-n" id="r-countdown-n">5</span>
                      <button class="r-skip-btn" onclick="skipCountdown()">Skip →</button>
                    </div>
                    <div class="r-yt-wrap" id="r-yt-wrap">
                      <iframe class="r-yt-frame" id="r-yt-frame" src="" allow="autoplay; fullscreen" allowfullscreen></iframe>
                    </div>
                  </div>
                  <div class="r-meta">
                    <div class="r-title" id="r-title"></div>
                    <a class="r-author" id="r-author" href="#" target="_blank" rel="noopener noreferrer"></a>
                    <div class="r-stats" id="r-stats"></div>
                    <div class="r-desc-wrap" id="r-desc-wrap" style="display:none">
                      <div class="r-desc" id="r-desc"></div>
                      <button class="r-more" id="r-more" onclick="toggleDesc()">Read more</button>
                    </div>
                    <div class="r-dl" id="r-dl"></div>
                  </div>
                </div>
              </div>
              <pre class="jbox" id="raw0"></pre>
            </div>
          </div>
        </div>
      </div>

      <!-- V2 Fast -->
      <div class="ep-card reveal reveal-d1" id="card3">
        <div class="ep-header" onclick="toggleCard(3)">
          <span class="ep-method v2">GET</span>
          <span class="ep-path">/api/v2/q?=&lt;query&gt;<span class="ep-fast-badge">⚡ Fast</span></span>
          <span class="ep-desc">Links only</span>
          <span class="ep-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>
        </div>
        <div class="ep-body">
          <div class="ep-body-inner">
            <div class="ep-info">
              Lightweight version — only fetches <code>mp4</code> and <code>mp3</code> URLs. No metadata scraping.
              Ideal when you only need download links fast.
            </div>
            <div class="ep-input-row">
              <input class="ep-input" id="q3" type="text" placeholder="e.g. https://youtu.be/dQw4w9WgXcQ" autocomplete="off" onkeydown="if(event.key==='Enter')fetchEp(3)"/>
              <button class="ep-fetch-btn magnet" id="btn3" onclick="fetchEp(3)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Search
              </button>
            </div>
            <div class="skel" id="skel3"><div class="skel-line"></div><div class="skel-line"></div><div class="skel-line"></div></div>
            <div class="ep-result" id="res3">
              <div class="ep-result-meta">
                <span class="ep-status" id="stat3"></span>
                <span class="ep-ms" id="ms3"></span>
              </div>
              <div class="copy-strip" id="curl3" style="display:none">
                <code id="curl3-text"></code>
                <button class="copy-btn" onclick="copyUrl(3)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</button>
              </div>
              <div class="v2-card" id="v2card" style="display:none">
                <div class="v2-card-label">Download Links</div>
                <div class="r-dl" id="v2-dl"></div>
              </div>
              <pre class="jbox" id="raw3"></pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Uptime -->
      <div class="ep-card reveal reveal-d2" id="card1">
        <div class="ep-header" onclick="toggleCard(1)">
          <span class="ep-method uptime">GET</span>
          <span class="ep-path">/api/uptime</span>
          <span class="ep-desc">Server uptime</span>
          <span class="ep-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>
        </div>
        <div class="ep-body">
          <div class="ep-body-inner">
            <div class="ep-info">Returns process uptime in seconds and a human-readable string.</div>
            <div class="ep-input-row">
              <button class="ep-fetch-btn magnet" id="btn1" onclick="fetchEp(1)" style="width:100%;justify-content:center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>Fetch
              </button>
            </div>
            <div class="skel" id="skel1"><div class="skel-line"></div><div class="skel-line"></div></div>
            <div class="ep-result" id="res1">
              <div class="ep-result-meta">
                <span class="ep-status" id="stat1"></span>
                <span class="ep-ms" id="ms1"></span>
              </div>
              <pre class="jbox" id="raw1"></pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Health -->
      <div class="ep-card reveal reveal-d3" id="card2">
        <div class="ep-header" onclick="toggleCard(2)">
          <span class="ep-method health">GET</span>
          <span class="ep-path">/api/healthz</span>
          <span class="ep-desc">Health check</span>
          <span class="ep-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>
        </div>
        <div class="ep-body">
          <div class="ep-body-inner">
            <div class="ep-info">Returns <code>{"status":"ok"}</code> when the server is healthy.</div>
            <div class="ep-input-row">
              <button class="ep-fetch-btn magnet" id="btn2" onclick="fetchEp(2)" style="width:100%;justify-content:center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>Fetch
              </button>
            </div>
            <div class="skel" id="skel2"><div class="skel-line"></div><div class="skel-line"></div></div>
            <div class="ep-result" id="res2">
              <div class="ep-result-meta">
                <span class="ep-status" id="stat2"></span>
                <span class="ep-ms" id="ms2"></span>
              </div>
              <pre class="jbox" id="raw2"></pre>
            </div>
          </div>
        </div>
      </div>

    </div><!-- /ep-list -->
  </main>

  <footer class="footer reveal">
    <p class="footer-txt">Built by <a href="#" target="_blank" rel="noopener noreferrer">MJL</a> &nbsp;·&nbsp; TubeFetch v${version} &nbsp;·&nbsp; No auth required</p>
  </footer>

</div><!-- /page -->

<script>
(function(){
'use strict';

/* ════════════════════════════════════════
   PERFORMANCE DETECTION
════════════════════════════════════════ */
var isMobile = window.innerWidth < 768 || ('ontouchstart' in window);
var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var isLowEnd = navigator.hardwareConcurrency <= 4 || isMobile;

/* ════════════════════════════════════════
   CUSTOM CURSOR
════════════════════════════════════════ */
var curDot = document.getElementById('cur-dot');
var curRing = document.getElementById('cur-ring');
var curX = 0, curY = 0, ringX = 0, ringY = 0;

if (!isMobile) {
  document.addEventListener('mousemove', function(e) {
    curX = e.clientX; curY = e.clientY;
    curDot.style.left = curX + 'px';
    curDot.style.top = curY + 'px';
  });

  (function animateCursor() {
    ringX += (curX - ringX) * 0.12;
    ringY += (curY - ringY) * 0.12;
    curRing.style.left = ringX + 'px';
    curRing.style.top = ringY + 'px';
    requestAnimationFrame(animateCursor);
  })();

  document.querySelectorAll('a,button,.ep-header,.hbadge,.magnet').forEach(function(el) {
    el.addEventListener('mouseenter', function() { document.body.classList.add('cur-hover'); });
    el.addEventListener('mouseleave', function() { document.body.classList.remove('cur-hover'); });
  });

  document.querySelectorAll('input,pre,code,[data-select]').forEach(function(el) {
    el.addEventListener('mouseenter', function() { document.body.classList.add('cur-text'); });
    el.addEventListener('mouseleave', function() { document.body.classList.remove('cur-text'); });
  });
}

/* ════════════════════════════════════════
   THREE.JS HERO PARTICLES
════════════════════════════════════════ */
(function initHero() {
  var canvas = document.getElementById('hero-canvas');
  if (!canvas || !window.THREE || prefersReduced) return;

  var W = canvas.offsetWidth, H = canvas.offsetHeight;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W, H);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
  camera.position.z = 320;

  var COUNT = isLowEnd ? 180 : 520;
  var positions = new Float32Array(COUNT * 3);
  var velocities = [];
  var spread = 320;

  for (var i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.5;
    velocities.push({
      x: (Math.random() - 0.5) * 0.04,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.02
    });
  }

  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  var mat = new THREE.PointsMaterial({
    size: isLowEnd ? 1.8 : 2.2,
    color: 0xFF2222,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  var points = new THREE.Points(geo, mat);
  scene.add(points);

  var mouseInfluenceX = 0, mouseInfluenceY = 0;
  var targetInflX = 0, targetInflY = 0;

  if (!isMobile) {
    document.addEventListener('mousemove', function(e) {
      targetInflX = (e.clientX / window.innerWidth - 0.5) * 28;
      targetInflY = (e.clientY / window.innerHeight - 0.5) * 14;
    });
  }

  var t = 0;
  var animating = true;

  function heroLoop() {
    if (!animating) return;
    requestAnimationFrame(heroLoop);
    t += 0.004;

    mouseInfluenceX += (targetInflX - mouseInfluenceX) * 0.04;
    mouseInfluenceY += (targetInflY - mouseInfluenceY) * 0.04;

    var pos = geo.attributes.position;
    for (var i = 0; i < COUNT; i++) {
      pos.array[i * 3]     += velocities[i].x;
      pos.array[i * 3 + 1] += velocities[i].y + Math.sin(t + i * 0.1) * 0.008;
      pos.array[i * 3 + 2] += velocities[i].z;

      var half = spread / 2;
      if (pos.array[i * 3] > half || pos.array[i * 3] < -half) velocities[i].x *= -1;
      if (pos.array[i * 3 + 1] > half * 0.6 || pos.array[i * 3 + 1] < -half * 0.6) velocities[i].y *= -1;
      if (pos.array[i * 3 + 2] > half * 0.5 || pos.array[i * 3 + 2] < -half * 0.5) velocities[i].z *= -1;
    }
    pos.needsUpdate = true;

    points.rotation.y = t * 0.04 + mouseInfluenceX * 0.004;
    points.rotation.x = mouseInfluenceY * 0.003;

    renderer.render(scene, camera);
  }

  heroLoop();

  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }, 200);
  });

  /* Pause when tab hidden */
  document.addEventListener('visibilitychange', function() {
    animating = !document.hidden;
    if (animating) heroLoop();
  });
})();

/* ════════════════════════════════════════
   MOUSE PARALLAX ON HERO CONTENT
════════════════════════════════════════ */
(function() {
  if (isMobile || prefersReduced) return;
  var content = document.getElementById('hero-content');
  if (!content) return;
  var tx = 0, ty = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', function(e) {
    tx = (e.clientX / window.innerWidth - 0.5) * 14;
    ty = (e.clientY / window.innerHeight - 0.5) * 8;
  });
  (function par() {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    content.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
    requestAnimationFrame(par);
  })();
})();

/* ════════════════════════════════════════
   MAGNETIC BUTTON EFFECT
════════════════════════════════════════ */
(function() {
  if (isMobile) return;
  document.querySelectorAll('.magnet').forEach(function(btn) {
    btn.addEventListener('mousemove', function(e) {
      var r = btn.getBoundingClientRect();
      var x = e.clientX - r.left - r.width / 2;
      var y = e.clientY - r.top - r.height / 2;
      btn.style.transform = 'translate(' + x * 0.22 + 'px,' + y * 0.22 + 'px)';
    });
    btn.addEventListener('mouseleave', function() {
      btn.style.transform = '';
    });
  });
})();

/* ════════════════════════════════════════
   RIPPLE EFFECT
════════════════════════════════════════ */
document.querySelectorAll('.ep-fetch-btn').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    if (btn.disabled) return;
    var r = btn.getBoundingClientRect();
    var rip = document.createElement('span');
    rip.className = 'ripple';
    var size = Math.max(r.width, r.height);
    rip.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX - r.left - size / 2) + 'px;top:' + (e.clientY - r.top - size / 2) + 'px';
    btn.appendChild(rip);
    setTimeout(function() { if (rip.parentNode) rip.parentNode.removeChild(rip); }, 600);
  });
});

/* ════════════════════════════════════════
   GSAP INTRO + SCROLL REVEAL
════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', function() {
  if (!window.gsap) { finishIntro(); return; }
  gsap.registerPlugin(ScrollTrigger);

  if (prefersReduced) { finishIntro(); return; }

  /* Scanline animation */
  var scanEl = document.getElementById('i-scanline');
  gsap.fromTo(scanEl, { top: '-4px', opacity: 1 }, { top: '100%', opacity: 0, duration: 2.4, ease: 'none' });

  /* Intro timeline */
  var tl = gsap.timeline({ delay: 0.15, onComplete: finishIntro });

  tl.to('#i-icon', {
    opacity: 1, scale: 1, rotation: 0, duration: 0.65,
    ease: 'back.out(1.7)',
    from: { scale: 0.3, rotation: -18, opacity: 0 }
  });

  tl.to('.i-char', {
    y: 0, opacity: 1, duration: 0.045, stagger: 0.055,
    ease: 'power2.out'
  }, '-=0.3');

  tl.to('#i-sub', { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out',
    from: { opacity: 0, y: 8 }
  }, '-=0.1');

  tl.to('#i-bar-track', { opacity: 1, duration: 0.3, ease: 'power2.out' }, '-=0.15');
  tl.to('#i-bar', { width: '100%', duration: 2.0, ease: 'power2.inOut' }, '-=0.2');
  tl.to('#i-ver', { opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=1.6');

  /* Exit */
  tl.to('#intro', {
    opacity: 0, scale: 1.06, filter: 'blur(10px)',
    duration: 0.55, ease: 'power2.in',
    delay: 0.2
  });

  /* Scroll reveals */
  function setupScrollReveal() {
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll('.reveal').forEach(function(el) {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        onEnter: function() { el.classList.add('in-view'); },
        once: true
      });
    });
  }

  setTimeout(setupScrollReveal, 100);
});

function finishIntro() {
  var intro = document.getElementById('intro');
  var page = document.getElementById('page');
  if (intro) { intro.style.display = 'none'; }
  if (page && window.gsap) {
    gsap.to(page, { opacity: 1, duration: 0.5, ease: 'power2.out' });
  } else if (page) {
    page.style.opacity = '1';
  }
  /* Fallback scroll reveal without gsap */
  if (!window.gsap) {
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(en) { if (en.isIntersecting) { en.target.classList.add('in-view'); obs.unobserve(en.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(function(el) { obs.observe(el); });
  }
}

/* ════════════════════════════════════════
   BELL PANEL
════════════════════════════════════════ */
var bellOpen = false;
function toggleBell() {
  if (bellOpen) closeBell(); else openBell();
}
function openBell() {
  var panel = document.getElementById('bell-panel');
  var btn = document.getElementById('bell-btn');
  var dot = document.getElementById('bell-dot');
  panel.className = 'bell-panel opening';
  setTimeout(function() { panel.className = 'bell-panel open'; }, 220);
  btn.classList.add('active');
  if (dot) dot.style.display = 'none';
  bellOpen = true;
  setTimeout(function() {
    document.addEventListener('click', outsideBell);
  }, 10);
}
function closeBell() {
  var panel = document.getElementById('bell-panel');
  var btn = document.getElementById('bell-btn');
  panel.className = 'bell-panel closing';
  setTimeout(function() { panel.className = 'bell-panel'; }, 180);
  btn.classList.remove('active');
  bellOpen = false;
  document.removeEventListener('click', outsideBell);
}
function outsideBell(e) {
  var wrap = document.querySelector('.bell-wrap');
  if (wrap && !wrap.contains(e.target)) closeBell();
}

/* ════════════════════════════════════════
   ACCORDION CARDS
════════════════════════════════════════ */
var openCard = null;
function toggleCard(n) {
  var map = { 0: 'card0', 1: 'card1', 2: 'card2', 3: 'card3' };
  var id = map[n];
  var el = document.getElementById(id);
  if (!el) return;
  var isOpen = el.classList.contains('open');
  if (openCard !== null && openCard !== n) {
    var prev = document.getElementById(map[openCard]);
    if (prev) prev.classList.remove('open');
  }
  if (isOpen) {
    el.classList.remove('open');
    openCard = null;
  } else {
    el.classList.add('open');
    openCard = n;
  }
}

/* ════════════════════════════════════════
   JSON HIGHLIGHT
════════════════════════════════════════ */
function hl(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(m) {
      var cls = 'j-num';
      if (/^"/.test(m)) cls = /:$/.test(m) ? 'j-key' : 'j-str';
      else if (/true|false/.test(m)) cls = 'j-bool';
      else if (/null/.test(m)) cls = 'j-null';
      return '<span class="' + cls + '">' + m + '</span>';
    });
}

/* ════════════════════════════════════════
   COPY URL
════════════════════════════════════════ */
var urlStore = {};
var rawStore = {};
function copyUrl(n) {
  var url = urlStore[n];
  if (!url) return;
  navigator.clipboard.writeText(url).then(function() {
    var btns = document.querySelectorAll('.copy-btn');
    var btn = document.querySelector('#curl' + n + ' .copy-btn') || (n === 3 ? document.querySelector('#curl3 .copy-btn') : null);
    if (!btn) return;
    var orig = btn.innerHTML;
    btn.innerHTML = '&#x2713; Copied';
    btn.style.color = '#4ade80';
    setTimeout(function() { btn.innerHTML = orig; btn.style.color = ''; }, 1800);
  });
}

/* ════════════════════════════════════════
   FORMAT HELPERS
════════════════════════════════════════ */
function fmtViews(n) {
  if (!n) return '';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}
function sv(id, show, disp) {
  var el = document.getElementById(id);
  if (!el) return;
  el.style.display = show ? (disp || 'block') : 'none';
}
function dlIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
}

/* ════════════════════════════════════════
   VIDEO PREVIEW
════════════════════════════════════════ */
var v1VideoId = '';
var cdTimer = null, cdInterval = null;
var descExpanded = false;

function toggleDesc() {
  var el = document.getElementById('r-desc');
  var btn = document.getElementById('r-more');
  if (!el || !btn) return;
  descExpanded = !descExpanded;
  el.classList.toggle('exp', descExpanded);
  btn.textContent = descExpanded ? 'Read less' : 'Read more';
}

function resetVideoPreview() {
  clearTimers();
  sv('r-play-overlay', false);
  sv('r-countdown-wrap', false);
  sv('r-yt-wrap', false);
  var arc = document.getElementById('r-ring-arc');
  if (arc) { arc.style.transition = 'none'; arc.style.strokeDashoffset = '176'; }
  var frame = document.getElementById('r-yt-frame');
  if (frame) frame.src = '';
  var img = document.getElementById('r-thumb-img');
  if (img) img.style.opacity = '1';
}
function clearTimers() {
  if (cdTimer) { clearTimeout(cdTimer); cdTimer = null; }
  if (cdInterval) { clearInterval(cdInterval); cdInterval = null; }
}
function startPreview() {
  if (!v1VideoId) return;
  sv('r-play-overlay', false);
  sv('r-countdown-wrap', true, 'flex');
  var nEl = document.getElementById('r-countdown-n');
  if (nEl) nEl.textContent = '5';
  var img = document.getElementById('r-thumb-img');
  if (img) img.style.opacity = '.3';
  var arc = document.getElementById('r-ring-arc');
  if (arc) {
    arc.style.transition = 'none';
    arc.style.strokeDashoffset = '176';
    requestAnimationFrame(function() { requestAnimationFrame(function() {
      arc.style.transition = 'stroke-dashoffset 5s linear';
      arc.style.strokeDashoffset = '0';
    }); });
  }
  var secs = 4;
  cdInterval = setInterval(function() {
    var n = document.getElementById('r-countdown-n');
    if (n) n.textContent = String(secs);
    secs--;
    if (secs < 0) { clearInterval(cdInterval); cdInterval = null; }
  }, 1000);
  cdTimer = setTimeout(function() { launchVideo(); }, 5000);
}
function skipCountdown() { clearTimers(); launchVideo(); }
function launchVideo() {
  sv('r-countdown-wrap', false);
  var img = document.getElementById('r-thumb-img');
  if (img) { img.style.transition = 'opacity .5s ease'; img.style.opacity = '0'; }
  var wrap = document.getElementById('r-yt-wrap');
  if (wrap) wrap.style.display = 'block';
  setTimeout(function() {
    var frame = document.getElementById('r-yt-frame');
    if (frame) frame.src = 'https://www.youtube.com/embed/' + v1VideoId + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
  }, 120);
}

/* ════════════════════════════════════════
   RESET BUTTON STATE
════════════════════════════════════════ */
function setBtnDefault(n) {
  var btn = document.getElementById('btn' + n);
  if (!btn) return;
  btn.disabled = false;
  var isSearch = (n === 0 || n === 3);
  btn.innerHTML = isSearch
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Search'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>Fetch';
}

/* ════════════════════════════════════════
   FETCH ENDPOINT
════════════════════════════════════════ */
async function fetchEp(n) {
  var btn = document.getElementById('btn' + n);
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = (n === 0 || n === 3) ? 'Searching\u2026' : 'Fetching\u2026';

  sv('skel' + n, true, 'flex');
  sv('res' + n, false);
  if (n === 0) { sv('rcard0', false); sv('curl0', false); resetVideoPreview(); }
  if (n === 3) { sv('v2card', false); sv('curl3', false); }

  var url;
  if (n === 0) {
    var q = document.getElementById('q0').value.trim();
    if (!q) { setBtnDefault(n); sv('skel' + n, false, 'flex'); return; }
    url = '/api/v1/q?=' + encodeURIComponent(q);
  } else if (n === 3) {
    var q3 = document.getElementById('q3').value.trim();
    if (!q3) { setBtnDefault(n); sv('skel' + n, false, 'flex'); return; }
    url = '/api/v2/q?=' + encodeURIComponent(q3);
  } else if (n === 1) {
    url = '/api/uptime';
  } else {
    url = '/api/healthz';
  }

  urlStore[n] = window.location.origin + url;
  var t0 = Date.now();

  try {
    var resp = await fetch(url);
    var clientMs = Date.now() - t0;
    var text = await resp.text();
    var data;
    try { data = JSON.parse(text); } catch(e) { data = text; }
    rawStore[n] = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    sv('skel' + n, false, 'flex');

    var statEl = document.getElementById('stat' + n);
    statEl.textContent = resp.ok ? '200 OK' : (resp.status + ' Error');
    statEl.className = 'ep-status ' + (resp.ok ? 'ok' : 'err');

    var sms = (typeof data === 'object' && data && typeof data.ms === 'number') ? data.ms : null;
    document.getElementById('ms' + n).textContent = sms !== null ? (sms + 'ms server') : (clientMs + 'ms');

    var cacEl = document.getElementById('cac' + n);
    if (cacEl) cacEl.style.display = (typeof data === 'object' && data && data.cached) ? 'inline-flex' : 'none';

    var curlTextEl = document.getElementById('curl' + n + '-text');
    if (curlTextEl) curlTextEl.textContent = url;
    if (n === 0 || n === 3) sv('curl' + n, resp.ok, 'flex');

    document.getElementById('raw' + n).innerHTML = typeof data === 'string' ? data : hl(rawStore[n]);
    sv('res' + n, true, 'block');

    /* ── V1 rich card ── */
    if (n === 0 && typeof data === 'object' && data && data.success) {
      var info = data.info || {};
      var media = data.media || {};
      v1VideoId = data.video_id || '';

      var thumbEl = document.getElementById('r-thumb-img');
      thumbEl.src = info.thumbnail || '';
      thumbEl.alt = info.title || '';
      thumbEl.style.opacity = '1';
      thumbEl.style.transition = 'opacity .55s ease';

      sv('r-play-overlay', !!v1VideoId, 'flex');

      var durEl = document.getElementById('r-dur');
      durEl.textContent = info.duration || '';
      durEl.style.display = info.duration ? 'inline-block' : 'none';

      var cbEl = document.getElementById('r-cached-b');
      cbEl.textContent = 'Cached';
      cbEl.style.display = data.cached ? 'inline-block' : 'none';

      document.getElementById('r-title').textContent = info.title || data.video_id || '';
      var aEl = document.getElementById('r-author');
      aEl.textContent = info.author || '';
      aEl.href = info.channel_url || '#';

      var stats = [];
      var v = fmtViews(info.views);
      if (v) stats.push('<span class="r-stat">\uD83D\uDC41 ' + v + '</span>');
      if (info.published) stats.push('<span class="r-stat">\uD83D\uDCC5 ' + info.published + '</span>');
      document.getElementById('r-stats').innerHTML = stats.join('');

      if (info.description) {
        document.getElementById('r-desc').textContent = info.description;
        descExpanded = false;
        document.getElementById('r-desc').classList.remove('exp');
        document.getElementById('r-more').textContent = 'Read more';
        sv('r-desc-wrap', true, 'block');
      } else {
        sv('r-desc-wrap', false);
      }

      var dlRow = document.getElementById('r-dl');
      dlRow.innerHTML = '';
      if (media.mp4 && media.mp4.url) {
        var a4 = document.createElement('a');
        a4.href = media.mp4.url; a4.target = '_blank'; a4.rel = 'noopener noreferrer';
        a4.className = 'dl-btn dl-mp4';
        a4.innerHTML = dlIcon() + 'Download MP4';
        dlRow.appendChild(a4);
      }
      if (media.mp3 && media.mp3.url) {
        var a3 = document.createElement('a');
        a3.href = media.mp3.url; a3.target = '_blank'; a3.rel = 'noopener noreferrer';
        a3.className = 'dl-btn dl-mp3';
        a3.innerHTML = dlIcon() + 'Download MP3';
        dlRow.appendChild(a3);
      }
      sv('rcard0', true, 'block');
    }

    /* ── V2 quick card ── */
    if (n === 3 && typeof data === 'object' && data && data.credit) {
      var media3 = data.media || {};
      var dlRow3 = document.getElementById('v2-dl');
      dlRow3.innerHTML = '';
      var hasLink = false;
      if (media3.mp4 && typeof media3.mp4 === 'string') {
        var b4 = document.createElement('a');
        b4.href = media3.mp4; b4.target = '_blank'; b4.rel = 'noopener noreferrer';
        b4.className = 'dl-btn dl-mp4'; b4.innerHTML = dlIcon() + 'Download MP4';
        dlRow3.appendChild(b4); hasLink = true;
      }
      if (media3.mp3 && typeof media3.mp3 === 'string') {
        var b3 = document.createElement('a');
        b3.href = media3.mp3; b3.target = '_blank'; b3.rel = 'noopener noreferrer';
        b3.className = 'dl-btn dl-mp3'; b3.innerHTML = dlIcon() + 'Download MP3';
        dlRow3.appendChild(b3); hasLink = true;
      }
      if (!hasLink) dlRow3.innerHTML = '<span class="dl-none">No download links available</span>';
      sv('v2card', true, 'block');
    }

  } catch(e) {
    sv('skel' + n, false, 'flex');
    rawStore[n] = 'Network error: ' + e.message;
    document.getElementById('raw' + n).textContent = rawStore[n];
    var se = document.getElementById('stat' + n);
    se.textContent = 'Error'; se.className = 'ep-status err';
    document.getElementById('ms' + n).textContent = '\u2014';
    sv('res' + n, true, 'block');
  } finally {
    setBtnDefault(n);
  }
}

})();
</script>
</body>
</html>`;
}

router.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(buildHtml(VERSION));
});

export default router;
