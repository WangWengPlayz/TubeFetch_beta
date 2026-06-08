import { Router, type IRouter } from "express";
import { VERSION } from "../lib/version";

const router: IRouter = Router();

function buildAdminHtml(version: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>TubeFetch Admin</title>
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
:root{--bg:#080808;--s1:#111;--s2:#181818;--bd:rgba(204,0,0,.2);--acc:#E50914;--acc2:#CC0000;--tx:#eee;--tx2:#777;--ok:#22c55e;--er:#ef4444;--wn:#f59e0b;--inf:#60a5fa;--r:12px;--mono:'Courier New',monospace}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--tx);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;overflow-x:hidden}
body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(204,0,0,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(204,0,0,.05) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:0}
body::after{content:'';position:fixed;top:-20%;left:50%;transform:translateX(-50%);width:600px;height:400px;background:radial-gradient(ellipse,rgba(204,0,0,.12) 0%,transparent 70%);pointer-events:none;z-index:0}

/* ── Screens ── */
.scr{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:10}
.scr.hidden{display:none!important}
#scr-dash{flex-direction:column;align-items:stretch;justify-content:flex-start;overflow:hidden}

/* ── Login card ── */
.card{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);padding:48px 40px;width:100%;max-width:420px;box-shadow:0 0 60px rgba(204,0,0,.1);position:relative;z-index:10}
.logo-wrap{text-align:center;margin-bottom:30px}
.logo-icon{width:56px;height:56px;background:var(--acc2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;box-shadow:0 0 30px rgba(204,0,0,.3)}
.logo-icon svg{width:28px;height:28px}
.logo-wrap h1{font-size:22px;font-weight:700;letter-spacing:-.3px}
.badge{display:inline-block;background:rgba(204,0,0,.12);border:1px solid var(--bd);color:var(--acc);font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 10px;border-radius:20px;margin-top:6px}
.badge.blue{color:var(--inf);border-color:rgba(96,165,250,.3);background:rgba(96,165,250,.1)}
.sub{font-size:13px;color:var(--tx2);margin-bottom:26px;text-align:center}
.field{margin-bottom:16px}
.field label{display:block;font-size:11px;font-weight:600;color:var(--tx2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px}
.field input{width:100%;background:var(--s2);border:1px solid var(--bd);border-radius:8px;color:var(--tx);font-size:15px;padding:12px 16px;outline:none;transition:border-color .2s;font-family:inherit}
.field input:focus{border-color:var(--acc);box-shadow:0 0 0 3px rgba(229,9,20,.1)}
.btn{display:block;width:100%;padding:13px;background:var(--acc);color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit}
.btn:hover{background:#c70812;transform:translateY(-1px)}
.btn:active{transform:none}
.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.err{color:var(--er);font-size:13px;margin-top:12px;text-align:center;min-height:18px}

/* ── Intro ── */
#scr-intro{flex-direction:column;gap:20px;background:var(--bg)}
.i-logo{opacity:0;animation:iScale .6s cubic-bezier(.34,1.56,.64,1) .1s forwards}
@keyframes iScale{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
.i-icon{width:80px;height:80px;background:var(--acc2);border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 60px rgba(204,0,0,.4);margin:0 auto}
.i-title{font-size:30px;font-weight:800;letter-spacing:4px;text-transform:uppercase;opacity:0;animation:iFup .5s ease .5s forwards}
.i-sub{font-size:12px;color:var(--tx2);letter-spacing:3px;text-transform:uppercase;opacity:0;animation:iFup .5s ease .8s forwards}
@keyframes iFup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.i-bar-wrap{width:280px;height:3px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden;opacity:0;animation:iFup .4s ease 1s forwards}
.i-bar{height:100%;width:0;background:linear-gradient(90deg,var(--acc2),var(--acc));border-radius:2px;transition:width 2.4s cubic-bezier(.4,0,.2,1)}

/* ── Nav ── */
.nav{display:flex;align-items:center;gap:14px;padding:0 24px;height:54px;background:rgba(8,8,8,.97);border-bottom:1px solid var(--bd);flex-shrink:0;z-index:20;backdrop-filter:blur(10px)}
.nav-logo{display:flex;align-items:center;gap:9px;font-size:15px;font-weight:700}
.nav-icon{width:26px;height:26px;background:var(--acc2);border-radius:7px;display:flex;align-items:center;justify-content:center}
.nav-icon svg{width:13px;height:13px}
.nav-badge{background:rgba(204,0,0,.12);border:1px solid var(--bd);color:var(--acc);font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:2px 8px;border-radius:20px}
.sp{flex:1}
.sd-ind{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--tx2)}
.sd-dot{width:8px;height:8px;border-radius:50%;background:var(--ok);transition:background .3s}
.sd-dot.off{background:var(--er);animation:pulse 1s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.nav-ver{font-size:10px;color:var(--tx2);font-family:var(--mono)}

/* ── Dashboard body ── */
.dbody{flex:1;overflow-y:auto;padding:18px 22px;display:flex;flex-direction:column;gap:16px;position:relative;z-index:10}

/* ── Stat cards ── */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.sc{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);padding:16px 18px;position:relative;overflow:hidden}
.sc::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--ac,var(--acc))}
.sc-lbl{font-size:10px;font-weight:600;color:var(--tx2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
.sc-val{font-size:28px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-1px}
.sc-sub{font-size:10px;color:var(--tx2);margin-top:3px}

/* ── Charts ── */
.charts{display:grid;grid-template-columns:260px 1fr;gap:12px}
.cc{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);padding:16px 18px}
.cc-ttl{font-size:10px;font-weight:600;color:var(--tx2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px}
.pie-w{height:170px;display:flex;align-items:center;justify-content:center}
.line-w{height:170px;position:relative}

/* ── Packages ── */
.pkgs{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pkg{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);padding:14px 18px;display:flex;align-items:center;gap:12px}
.pkg-dot{width:11px;height:11px;border-radius:50%;flex-shrink:0;transition:background .3s}
.pkg-dot.up{background:var(--ok);box-shadow:0 0 8px rgba(34,197,94,.4)}
.pkg-dot.degraded{background:var(--wn);box-shadow:0 0 8px rgba(245,158,11,.4)}
.pkg-dot.unknown{background:var(--tx2)}
.pkg-inf{flex:1}
.pkg-name{font-size:13px;font-weight:600}
.pkg-desc{font-size:10px;color:var(--tx2);margin-top:2px}
.pkg-st{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
.pkg-st.up{color:var(--ok)}.pkg-st.degraded{color:var(--wn)}.pkg-st.unknown{color:var(--tx2)}

/* ── Controls ── */
.ctrls{display:flex;gap:10px;flex-wrap:wrap}
.cbtn{padding:9px 20px;border:1px solid var(--bd);border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:7px;background:var(--s1);color:var(--tx);font-family:inherit}
.cbtn:hover{transform:translateY(-1px)}
.cbtn-sd{border-color:rgba(239,68,68,.25)}.cbtn-sd:hover{background:rgba(239,68,68,.1);border-color:var(--er);color:var(--er)}
.cbtn-run{border-color:rgba(34,197,94,.25)}.cbtn-run:hover{background:rgba(34,197,94,.1);border-color:var(--ok);color:var(--ok)}
.cbtn-rs{border-color:rgba(96,165,250,.25)}.cbtn-rs:hover{background:rgba(96,165,250,.1);border-color:var(--inf);color:var(--inf)}

/* ── Console ── */
.con{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);overflow:hidden;display:flex;flex-direction:column;height:260px;flex-shrink:0}
.tabs{display:flex;border-bottom:1px solid var(--bd);padding:0 4px}
.tab{padding:9px 14px;font-size:11px;font-weight:600;color:var(--tx2);background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;transition:color .2s;margin-bottom:-1px;font-family:inherit}
.tab.on{color:var(--acc);border-bottom-color:var(--acc)}
.con-body{flex:1;overflow-y:auto;padding:10px 14px;font-family:var(--mono);font-size:11px;line-height:1.65;scroll-behavior:smooth}
.ll{display:flex;gap:6px;margin-bottom:1px;word-break:break-all}
.lt{color:var(--tx2);flex-shrink:0}.lm{}
.lm.info{color:var(--inf)}.lm.success{color:var(--ok)}.lm.error{color:var(--er)}.lm.warn{color:var(--wn)}

/* ── Modal ── */
.modal{position:fixed;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;z-index:200;opacity:0;pointer-events:none;transition:opacity .2s}
.modal.on{opacity:1;pointer-events:all}
.mbox{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);padding:30px;max-width:360px;width:90%;box-shadow:0 24px 60px rgba(0,0,0,.5)}
.mttl{font-size:17px;font-weight:700;margin-bottom:10px}
.mdsc{font-size:13px;color:var(--tx2);line-height:1.55;margin-bottom:22px}
.mbtns{display:flex;gap:8px;justify-content:flex-end}
.mok{padding:9px 18px;border:none;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
.mcanc{padding:9px 18px;background:transparent;color:var(--tx2);border:1px solid var(--bd);border-radius:7px;font-size:12px;cursor:pointer;font-family:inherit}
.mcanc:hover{border-color:var(--tx2)}

/* ── Toast ── */
.toast{position:fixed;bottom:28px;right:28px;z-index:300;display:flex;flex-direction:column;gap:8px}
.toastitem{background:var(--s2);border:1px solid var(--bd);border-radius:9px;padding:12px 18px;font-size:13px;font-weight:500;max-width:320px;box-shadow:0 8px 24px rgba(0,0,0,.4);animation:tIn .25s ease;pointer-events:none}
.toastitem.ok{border-left:3px solid var(--ok)}.toastitem.err{border-left:3px solid var(--er)}
@keyframes tIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}

/* ── Responsive ── */
@media(max-width:860px){.stats{grid-template-columns:1fr 1fr}.charts{grid-template-columns:1fr}}
@media(max-width:520px){.stats{grid-template-columns:1fr}.pkgs{grid-template-columns:1fr}}
</style>
</head>
<body>

<!-- LOGIN -->
<div class="scr" id="scr-login">
<div class="card">
  <div class="logo-wrap">
    <div class="logo-icon"><svg viewBox="0 0 24 24" fill="white"><polygon points="9.5,7 18,12 9.5,17"/></svg></div>
    <h1>TubeFetch</h1>
    <div class="badge">Admin Access</div>
  </div>
  <p class="sub">Secured administrative console</p>
  <div class="field"><label>Access Code</label><input type="password" id="inp-pass" placeholder="Enter access code" autocomplete="off"></div>
  <button class="btn" id="btn-pass">Authenticate</button>
  <div class="err" id="err-login"></div>
</div>
</div>

<!-- BIRTHDAY / DEVICE VERIFY -->
<div class="scr hidden" id="scr-bday">
<div class="card">
  <div class="logo-wrap">
    <div class="logo-icon" style="background:#1d4ed8"><svg viewBox="0 0 24 24" fill="white" width="28" height="28"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg></div>
    <h1>TubeFetch</h1>
    <div class="badge blue">Device Verification</div>
  </div>
  <p class="sub">Additional verification required for this device.</p>
  <div class="field"><label>When is my birthday?</label><input type="text" id="inp-bday" placeholder="MM-DD-YYYY" autocomplete="off" maxlength="10"></div>
  <button class="btn" id="btn-bday">Verify</button>
  <div class="err" id="err-bday"></div>
</div>
</div>

<!-- INTRO -->
<div class="scr hidden" id="scr-intro">
  <div class="i-logo">
    <div class="i-icon"><svg viewBox="0 0 24 24" fill="white" width="40" height="40"><polygon points="9.5,7 18,12 9.5,17"/></svg></div>
  </div>
  <div class="i-title">Admin Panel</div>
  <div class="i-sub">TubeFetch v${version}</div>
  <div class="i-bar-wrap"><div class="i-bar" id="ibar"></div></div>
</div>

<!-- DASHBOARD -->
<div class="scr hidden" id="scr-dash">
  <nav class="nav">
    <div class="nav-logo">
      <div class="nav-icon"><svg viewBox="0 0 24 24" fill="white" width="14" height="14"><polygon points="9.5,7 18,12 9.5,17"/></svg></div>
      TubeFetch
    </div>
    <span class="nav-badge">Admin</span>
    <div class="sp"></div>
    <div class="sd-ind"><div class="sd-dot" id="sd-dot"></div><span id="sd-lbl">Online</span></div>
    <div class="nav-ver">v${version}</div>
  </nav>

  <div class="dbody">
    <!-- Stats -->
    <div class="stats">
      <div class="sc" style="--ac:var(--acc)"><div class="sc-lbl">Total API Calls</div><div class="sc-val" id="s-total">—</div><div class="sc-sub">lifetime requests</div></div>
      <div class="sc" style="--ac:var(--ok)"><div class="sc-lbl">Successful</div><div class="sc-val" style="color:var(--ok)" id="s-succ">—</div><div class="sc-sub" id="s-succ-p">—</div></div>
      <div class="sc" style="--ac:var(--er)"><div class="sc-lbl">Errors</div><div class="sc-val" style="color:var(--er)" id="s-err">—</div><div class="sc-sub" id="s-err-p">—</div></div>
      <div class="sc" style="--ac:var(--inf)"><div class="sc-lbl">Uptime</div><div class="sc-val" style="font-size:20px;letter-spacing:-.4px" id="s-up">—</div><div class="sc-sub">server uptime</div></div>
    </div>

    <!-- Charts -->
    <div class="charts">
      <div class="cc"><div class="cc-ttl">Success vs Error</div><div class="pie-w"><canvas id="c-pie" width="160" height="160"></canvas></div></div>
      <div class="cc"><div class="cc-ttl">API Calls / Minute (last 30 min)</div><div class="line-w"><canvas id="c-line"></canvas></div></div>
    </div>

    <!-- Packages -->
    <div class="pkgs">
      <div class="pkg"><div class="pkg-dot unknown" id="p1-dot"></div><div class="pkg-inf"><div class="pkg-name">btch-downloader</div><div class="pkg-desc">Server 1 — Primary MP4/MP3 source</div></div><div class="pkg-st unknown" id="p1-st">Unknown</div></div>
      <div class="pkg"><div class="pkg-dot unknown" id="p2-dot"></div><div class="pkg-inf"><div class="pkg-name">nayan-media-downloaders</div><div class="pkg-desc">Server 2 — Fallback source</div></div><div class="pkg-st unknown" id="p2-st">Unknown</div></div>
    </div>

    <!-- Controls -->
    <div class="ctrls">
      <button class="cbtn cbtn-sd" id="btn-sd">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="12"/><path d="M6.35 6.35A8 8 0 1 0 17.65 17.65"/></svg>
        Temporary Shutdown
      </button>
      <button class="cbtn cbtn-run" id="btn-run">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,3 19,12 5,21"/></svg>
        Run
      </button>
      <button class="cbtn cbtn-rs" id="btn-rs">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Restart
      </button>
    </div>

    <!-- Console -->
    <div class="con">
      <div class="tabs">
        <button class="tab on" data-tab="live">Live Console</button>
        <button class="tab" data-tab="success">Success</button>
        <button class="tab" data-tab="error">Errors</button>
      </div>
      <div class="con-body" id="con-live"></div>
      <div class="con-body hidden" id="con-success"></div>
      <div class="con-body hidden" id="con-error"></div>
    </div>
  </div>
</div>

<!-- Modal -->
<div class="modal" id="modal">
  <div class="mbox">
    <div class="mttl" id="m-ttl">Confirm</div>
    <div class="mdsc" id="m-dsc">Are you sure?</div>
    <div class="mbtns">
      <button class="mcanc" id="m-canc">Cancel</button>
      <button class="mok" id="m-ok">Confirm</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div class="toast" id="toast-area"></div>

<script>
// ── State ──────────────────────────────────────────────────────────────────────
let TOK = sessionStorage.getItem('_atk') || '';
let pieChart, lineChart;
const logs = { live:[], success:[], error:[] };
const MAX = 500;
let activeTab = 'live';

// ── Screen management ─────────────────────────────────────────────────────────
function showScr(id) {
  ['scr-login','scr-bday','scr-intro','scr-dash'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.toggle('hidden', s !== id);
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const f = n => Number(n).toLocaleString();
const pct = (a,b) => b>0 ? ((a/b)*100).toFixed(1)+'%' : '0%';
function upFmt(s) {
  s = Math.floor(s);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  if (h>0) return h+'h '+m+'m';
  return m+'m '+sec+'s';
}
function fmtT(ts) {
  return new Date(ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, type='ok') {
  const area = document.getElementById('toast-area');
  const el = document.createElement('div');
  el.className = 'toastitem ' + type;
  el.textContent = msg;
  area.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
const inpPass = document.getElementById('inp-pass');
const btnPass = document.getElementById('btn-pass');
const errLogin = document.getElementById('err-login');

inpPass.addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
btnPass.addEventListener('click', doLogin);

async function doLogin() {
  const pw = inpPass.value.trim();
  if (!pw) { errLogin.textContent = 'Access code required.'; return; }
  btnPass.disabled = true; btnPass.textContent = 'Authenticating…';
  errLogin.textContent = '';
  const isOppo = /OPPO[_ -]?A3x/i.test(navigator.userAgent);
  try {
    const r = await fetch('/admin/api/auth', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ password: pw })
    });
    const d = await r.json();
    if (d.ok) {
      if (!d.needsBirthday || isOppo) {
        TOK = d.token; sessionStorage.setItem('_atk', TOK);
        startIntro();
      } else {
        window._pt = d.partialToken;
        showScr('scr-bday');
        document.getElementById('inp-bday').focus();
      }
    } else {
      errLogin.textContent = d.error || 'Authentication failed.';
    }
  } catch { errLogin.textContent = 'Connection error.'; }
  btnPass.disabled = false; btnPass.textContent = 'Authenticate';
}

// ── BIRTHDAY ──────────────────────────────────────────────────────────────────
const inpBday = document.getElementById('inp-bday');
const btnBday = document.getElementById('btn-bday');
const errBday = document.getElementById('err-bday');

inpBday.addEventListener('keydown', e => { if(e.key==='Enter') doBday(); });
btnBday.addEventListener('click', doBday);

async function doBday() {
  const ans = inpBday.value.trim();
  if (!ans) { errBday.textContent = 'Answer required.'; return; }
  btnBday.disabled = true; btnBday.textContent = 'Verifying…';
  errBday.textContent = '';
  try {
    const r = await fetch('/admin/api/auth', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ partialToken: window._pt, birthday: ans })
    });
    const d = await r.json();
    if (d.ok) {
      TOK = d.token; sessionStorage.setItem('_atk', TOK);
      startIntro();
    } else {
      errBday.textContent = d.error || 'Incorrect answer.';
    }
  } catch { errBday.textContent = 'Connection error.'; }
  btnBday.disabled = false; btnBday.textContent = 'Verify';
}

// ── INTRO ─────────────────────────────────────────────────────────────────────
function startIntro() {
  showScr('scr-intro');
  requestAnimationFrame(() => {
    setTimeout(() => { document.getElementById('ibar').style.width = '100%'; }, 80);
    setTimeout(() => {
      initDash();
      showScr('scr-dash');
    }, 3100);
  });
}

// ── DASHBOARD INIT ────────────────────────────────────────────────────────────
function initDash() {
  initCharts();
  connectSSE();
  setupControls();
  setupTabs();
}

// ── CHARTS ────────────────────────────────────────────────────────────────────
function initCharts() {
  const cPie = document.getElementById('c-pie').getContext('2d');
  pieChart = new Chart(cPie, {
    type:'doughnut',
    data:{ labels:['Success','Error'], datasets:[{ data:[0,0], backgroundColor:['#22c55e','#ef4444'], borderWidth:0, hoverOffset:4 }] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ color:'#666', font:{size:11}, padding:10 } } },
      cutout:'65%' }
  });

  const cLine = document.getElementById('c-line').getContext('2d');
  lineChart = new Chart(cLine, {
    type:'line',
    data:{ labels:[], datasets:[{ label:'Calls/min', data:[], borderColor:'#E50914',
      backgroundColor:'rgba(229,9,20,.07)', fill:true, tension:.4, pointRadius:2, pointBackgroundColor:'#E50914' }] },
    options:{ responsive:true, maintainAspectRatio:false,
      scales:{
        x:{ ticks:{color:'#444',font:{size:10},maxTicksLimit:8}, grid:{color:'rgba(255,255,255,.03)'} },
        y:{ ticks:{color:'#444',font:{size:10}}, grid:{color:'rgba(255,255,255,.03)'}, beginAtZero:true }
      },
      plugins:{ legend:{display:false} } }
  });
}

function updCharts(s) {
  if (!pieChart || !lineChart) return;
  pieChart.data.datasets[0].data = [s.successCount, s.errorCount];
  pieChart.update('none');
  if (s.minuteBuckets && s.minuteBuckets.length) {
    const mb = s.minuteBuckets;
    lineChart.data.labels = mb.map(b => {
      const d = new Date(b.minute);
      return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
    });
    lineChart.data.datasets[0].data = mb.map(b => b.count);
    lineChart.update('none');
  }
}

// ── SSE ───────────────────────────────────────────────────────────────────────
let sse;
function connectSSE() {
  if (sse) sse.close();
  sse = new EventSource('/admin/api/events?tok='+encodeURIComponent(TOK));
  sse.addEventListener('stats', e => {
    const s = JSON.parse(e.data);
    updStats(s); updCharts(s); updPkgs(s.packages); updShutdown(s.shutdown);
  });
  sse.addEventListener('log', e => appendLog(JSON.parse(e.data)));
  sse.addEventListener('history', e => { JSON.parse(e.data).forEach(appendLog); scrollConsoles(); });
  sse.onerror = () => setTimeout(connectSSE, 5000);
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function updStats(s) {
  document.getElementById('s-total').textContent = f(s.apiCount);
  document.getElementById('s-succ').textContent  = f(s.successCount);
  document.getElementById('s-err').textContent   = f(s.errorCount);
  document.getElementById('s-succ-p').textContent = pct(s.successCount,s.apiCount) + ' of total';
  document.getElementById('s-err-p').textContent  = pct(s.errorCount,s.apiCount) + ' of total';
  document.getElementById('s-up').textContent    = upFmt(s.uptimeSeconds);
}

function updPkgs(pkg) {
  if (!pkg) return;
  setPkg(1, pkg.server1); setPkg(2, pkg.server2);
}
function setPkg(n, st) {
  const dot = document.getElementById('p'+n+'-dot');
  const txt = document.getElementById('p'+n+'-st');
  dot.className = 'pkg-dot '+st;
  txt.className = 'pkg-st '+st;
  txt.textContent = st.charAt(0).toUpperCase()+st.slice(1);
}

function updShutdown(active) {
  const dot = document.getElementById('sd-dot');
  const lbl = document.getElementById('sd-lbl');
  if (active) { dot.classList.add('off'); lbl.textContent='SHUTDOWN'; lbl.style.color='var(--er)'; }
  else        { dot.classList.remove('off'); lbl.textContent='Online'; lbl.style.color=''; }
}

// ── CONSOLE ───────────────────────────────────────────────────────────────────
function appendLog(e) {
  logs.live.push(e);
  if (logs.live.length>MAX) logs.live.shift();
  if (e.level==='success') { logs.success.push(e); if(logs.success.length>MAX) logs.success.shift(); }
  if (e.level==='error')   { logs.error.push(e);   if(logs.error.length>MAX)   logs.error.shift(); }
  pushLine(e);
}

function pushLine(e) {
  const body = document.getElementById('con-'+activeTab);
  if (!body) return;
  if (activeTab!=='live' && e.level!==activeTab) return;
  const html = lineHtml(e);
  body.insertAdjacentHTML('beforeend', html);
  if (body.scrollHeight - body.scrollTop < body.clientHeight + 160) body.scrollTop = body.scrollHeight;
}

function lineHtml(e) {
  const t = fmtT(e.ts);
  const m = e.message.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return '<div class="ll"><span class="lt">['+t+']</span><span class="lm '+e.level+'">'+m+'</span></div>';
}

function scrollConsoles() {
  ['live','success','error'].forEach(t => {
    const el = document.getElementById('con-'+t);
    if (el) el.scrollTop = el.scrollHeight;
  });
}

function renderTab(tab) {
  const el = document.getElementById('con-'+tab);
  if (!el) return;
  el.innerHTML = logs[tab].map(lineHtml).join('');
  el.scrollTop = el.scrollHeight;
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      activeTab = btn.dataset.tab;
      ['live','success','error'].forEach(t => {
        const el = document.getElementById('con-'+t);
        if (el) el.classList.toggle('hidden', t!==activeTab);
      });
      renderTab(activeTab);
    });
  });
}

// ── CONTROLS ─────────────────────────────────────────────────────────────────
let _pendingAction = null;

function setupControls() {
  document.getElementById('btn-sd').addEventListener('click', () =>
    modal('Temporary Shutdown', 'All API endpoints will return a maintenance message and ApiCount will pause. Continue?',
      () => doCtrl('shutdown','var(--er)'), 'Shutdown', 'var(--er)')
  );
  document.getElementById('btn-run').addEventListener('click', () =>
    modal('Restore Service', 'All APIs will go back online and ApiCount will resume. Continue?',
      () => doCtrl('run','var(--ok)'), 'Restore', 'var(--ok)')
  );
  document.getElementById('btn-rs').addEventListener('click', () =>
    modal('Restart Server', 'The server will restart immediately. The panel will reconnect automatically. Continue?',
      () => doCtrl('restart','var(--inf)'), 'Restart', 'var(--inf)')
  );
  document.getElementById('m-canc').addEventListener('click', closeModal);
}

async function doCtrl(action, _color) {
  try {
    const r = await fetch('/admin/api/'+action, {
      method:'POST', headers:{'Authorization':'Bearer '+TOK}
    });
    const d = await r.json();
    if (d.ok) toast('Action completed: '+action, 'ok');
    else toast('Failed: '+(d.error||'unknown'), 'err');
  } catch { toast('Connection error.','err'); }
}

function modal(ttl, dsc, onOk, okTxt, okColor) {
  document.getElementById('m-ttl').textContent = ttl;
  document.getElementById('m-dsc').textContent = dsc;
  const ok = document.getElementById('m-ok');
  ok.textContent = okTxt;
  ok.style.background = okColor || 'var(--er)';
  ok.style.color = '#fff';
  _pendingAction = onOk;
  ok.onclick = () => { closeModal(); _pendingAction && _pendingAction(); };
  document.getElementById('modal').classList.add('on');
}

function closeModal() {
  document.getElementById('modal').classList.remove('on');
  _pendingAction = null;
}

// ── BOOT ──────────────────────────────────────────────────────────────────────
if (TOK) {
  fetch('/admin/api/stats', { headers:{'Authorization':'Bearer '+TOK} })
    .then(r => { if(r.ok) startIntro(); else { sessionStorage.removeItem('_atk'); TOK=''; showScr('scr-login'); } })
    .catch(() => showScr('scr-login'));
} else {
  showScr('scr-login');
}
</script>
</body>
</html>`;
}

router.get("/admin", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.type("html").send(buildAdminHtml(VERSION));
});

export default router;
