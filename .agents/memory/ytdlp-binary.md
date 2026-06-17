---
name: yt-dlp standalone binary
description: ytdlp-nodejs postinstall downloads a Python zip script that requires python3; Replit NixOS doesn't have python3, so we use the standalone Linux binary instead.
---

**Rule:** Always use the standalone `yt-dlp_linux` binary from the yt-dlp GitHub releases, not the Python-based binary that `ytdlp-nodejs` downloads at postinstall.

**Why:** The `ytdlp-nodejs` postinstall script downloads the Python zip version of yt-dlp. On Replit's NixOS environment, `python3` is not available (`/usr/bin/env: 'python3': No such file or directory`), so that binary exits with code 127. The standalone binary (`yt-dlp_linux`) has no Python dependency.

**How to apply:**
1. The standalone binary lives at `artifacts/api-server/bin/yt-dlp` (committed to the repo).
2. Download command: `curl -L -o artifacts/api-server/bin/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux && chmod +x artifacts/api-server/bin/yt-dlp`
3. In `downloader.ts`, after `new YtDlp()`, override `instance.binaryPath = resolve(process.cwd(), "bin", "yt-dlp")`.
4. `ytdlp-nodejs` must be in `onlyBuiltDependencies` in `pnpm-workspace.yaml` so its postinstall runs (it downloads its own binary but we override the path).
5. `ytdlp-nodejs` must also be in `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`.
6. `ytdlp-nodejs` must be in `external: []` in `build.mjs` so esbuild doesn't bundle it.
