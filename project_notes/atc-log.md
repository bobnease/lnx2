# lnx2 ATC Log

---

## 2026-06-29 — Desktop Look & Feel

**Status: Shipped**

- `css/lnx2-index.css` — `.btn-social` restyled from filled DodgerBlue button to minimal card (`#f5f5f5` background, `1px solid #ddd` border, `#222` text, `#ebebeb` hover). Added `max-width: 480px; display: block; margin: 0 auto` to cap and center buttons on wide screens. Mobile unchanged.
- `js/lnx2.js` — Config page icon grid refactored from explicit per-4-item row grouping to a single `<div class="row row-cols-4 row-cols-lg-6 m-1 g-2">`. Result: 4 columns mobile/tablet, 6 columns desktop (≥992px). `maxIconCols` / `iconColWidth` kept as reference comments but no longer drive HTML output. Bitmask `dec` values untouched.
- Unchanged: `index.html`, `config.html`, `css/lnx2-config.css`, `css/simple-template.css`, all platform definitions.
- Deployed to `bobnease.github.io/lnx2/`.

**Up next:** Platform verification or monetization — TBD next session.

---

## 2026-06-29 — Platform Verification (Prototype)

**Status: Built, not yet deployed**

Architecture: Cloudflare Worker (`workers/worker.js`) that accepts `?handle=xxx` and returns a JSON map of platform → `confirmed` / `notfound` / `unverified`. The browser calls it after the user finishes typing (800ms debounce on `onkeyup`, immediate on `onblur`).

**Files changed:**
- `workers/worker.js` — new file; parallel HEAD checks for GitHub, Reddit, Pinterest, Vimeo, Tumblr, Substack; Bluesky via AT Protocol (no key). Unverifiable platforms (Instagram, X, Facebook, etc.) return `'unverified'` immediately.
- `js/lnx2.js` — added `verifyKey` to all 18 `lnxObjects` entries; added `verifyWorkerURL` config var (empty by default — disables verification until deployed); added `scheduleVerification()`, `verifyHandle()`, `applyVerificationStates()`; `updateAll()` now calls `scheduleVerification()`.
- `css/lnx2-config.css` — added `.verify-confirmed` (green outline), `.verify-notfound` (dimmed to 40% opacity), `.verify-checking` (pulse animation).
- `config.html` — added `onblur="verifyHandle(this.value)"` to handle input.
- `project_notes/platform-verification.md` — new; notes on each platform, API key requirements for YouTube/Twitch, deploy instructions.

**Bitmask `dec` values:** untouched.

**To go live:** deploy `workers/worker.js` to Cloudflare (free, ~5 min), then set `verifyWorkerURL` in `js/lnx2.js` to the deployed URL and push. Everything else is already in place.

**Known platform quirks:** Telegram always returns HTTP 200 regardless of handle — marked unverifiable. Tumblr and Substack need live testing to confirm HEAD behavior. YouTube and Twitch need API keys (instructions in `platform-verification.md`).

**Up next:** Deploy Worker and test with real handles. Then decide: YouTube/Twitch API keys, or move to monetization.
