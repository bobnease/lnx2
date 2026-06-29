# Platform Verification — Notes
*2026-06-29*

## Architecture

Verification runs through a Cloudflare Worker (`workers/worker.js`) that the browser calls after the user finishes typing their handle. The browser can't make these checks directly — most platforms block cross-origin requests. The Worker runs server-side, checks in parallel, and returns a JSON map of `platform → status`.

Three statuses:
- `confirmed` — platform returned HTTP 200 for that handle
- `notfound` — platform returned HTTP 404
- `unverified` — platform is blocked, needs an API key, or the response was ambiguous

The front end maps these to tile CSS classes: `verify-confirmed` (green outline), `verify-notfound` (dimmed), and nothing for `unverified` (neutral gray, same as before).

**To activate:** deploy `workers/worker.js` to Cloudflare, then set `verifyWorkerURL` in `js/lnx2.js` to the deployed URL. Until that's set, the config page behaves exactly as it does today.

---

## Platform-by-Platform Notes

### ✅ Verified via HEAD request (reliable)

**GitHub** — `github.com/{handle}`
200 for existing users, 404 for non-existing. Very clean and reliable.

**Reddit** — `reddit.com/user/{handle}`
200 for existing users, 404 for non-existing. Reliable, but Reddit may rate-limit the Worker if volume is high.

**Bluesky** — AT Protocol: `bsky.social/xrpc/com.atproto.identity.resolveHandle?handle={handle}.bsky.social`
Returns 200 + JSON for resolved handles, 400 for unknown. No API key required. Most reliable method of all — it's a purpose-built API.

**Pinterest** — `pinterest.com/{handle}/`
200 for existing profiles, 404 for non-existing. Needs testing to confirm it doesn't bot-block Workers.

**Vimeo** — `vimeo.com/{handle}`
200 for existing, 404 for non-existing. Generally reliable.

**Tumblr** — `tumblr.com/{handle}`
Should work, but Tumblr's URL routing has changed over time. Worth verifying with a known handle. Older Tumblr blogs may also live at `{handle}.tumblr.com` (subdomain format) rather than `tumblr.com/{handle}`. The Worker checks the www path; if HEAD results seem off, the subdomain format is the fallback to try.

**Substack** — `substack.com/@{handle}`
Likely works, but Substack writers sometimes use custom domains (e.g. `bobsnewsletter.substack.com` or just `bobsnewsletter.com`). A 404 here doesn't necessarily mean no Substack — just no account at the standard @handle path.

---

### ⚠️ Always returns `unverified` (requires API key)

**YouTube** — needs Google Data API v3 key
- Free API key from Google Cloud Console (no billing required for read-only search)
- Endpoint: `GET https://www.googleapis.com/youtube/v3/channels?part=id&forHandle={handle}&key={YOUTUBE_API_KEY}`
- Store key as a Cloudflare Worker secret: `wrangler secret put YOUTUBE_API_KEY`

**Twitch** — needs client credentials (OAuth 2.0)
- Free app registration at dev.twitch.tv
- Endpoint: `GET https://api.twitch.tv/helix/users?login={handle}`
- Requires a bearer token obtained via client_credentials grant (refresh logic needed)
- Store as Worker secrets: `wrangler secret put TWITCH_CLIENT_ID` and `wrangler secret put TWITCH_CLIENT_SECRET`

---

### 🚫 Always returns `unverified` (blocked / JS-rendered)

| Platform | Reason |
|----------|--------|
| Instagram | Requires login; returns 200 with empty content or redirects to login |
| X (Twitter) | Bot detection; likely 403 or JS-gated content |
| Facebook | Bot detection and login wall |
| TikTok | JS-rendered; HEAD returns 200 regardless |
| LinkedIn | Requires login for profile pages |
| Threads | Served via Instagram infrastructure; same blocks apply |
| Snapchat | Profile pages are not public HTML |
| Telegram | `t.me/{handle}` always returns HTTP 200 regardless of whether the handle exists — the page content (not the status code) indicates existence, and HEAD requests don't return content |
| Website | Generic `.com` URL can't be meaningfully checked |

---

## On False Negatives

The UI treats `notfound` as "dimmed" rather than "hidden" or crossed out. This is intentional. False negatives are real — a user might have a different handle on one platform, or a platform might return an unexpected status code. The user can always click a dimmed tile to include it.

Do not auto-deselect or hide `notfound` tiles. The user decides.

---

## Deploying the Worker

**Option A — Cloudflare dashboard (no CLI required):**
1. Go to [workers.cloudflare.com](https://workers.cloudflare.com) and sign in (free account)
2. Create a new Worker
3. Paste the contents of `workers/worker.js` into the editor
4. Click Deploy
5. Copy the worker URL (e.g. `https://lnx2-verify.yourname.workers.dev`)
6. Set `verifyWorkerURL = 'https://lnx2-verify.yourname.workers.dev'` in `js/lnx2.js`
7. Push to deploy

**Option B — Wrangler CLI:**
```bash
npm install -g wrangler
wrangler login
wrangler deploy workers/worker.js --name lnx2-verify --compatibility-date 2024-01-01
```

---

## Testing the Worker

Once deployed, test it directly in the browser:

```
https://lnx2-verify.yourname.workers.dev?handle=bobnease
```

Expected response (shape):
```json
{
  "github": "confirmed",
  "reddit": "confirmed",
  "bluesky": "confirmed",
  "pinterest": "notfound",
  "vimeo": "unverified",
  "tumblr": "unverified",
  "substack": "notfound",
  "instagram": "unverified",
  "x": "unverified",
  ...
}
```

Test a known non-existent handle too (e.g. `?handle=zzznobodyhasthishandle999`) to confirm `notfound` responses come back correctly for GitHub and Reddit.
