/**
 * lnx2-verify — Cloudflare Worker
 *
 * Checks whether a given handle exists on each verifiable platform.
 *
 * Request:  GET https://<worker-url>?handle=<handle>
 * Response: JSON { "github": "confirmed"|"notfound"|"unverified", ... }
 *
 * DEPLOY
 * ------
 * Option A — Cloudflare dashboard (no tooling required):
 *   1. Go to workers.cloudflare.com → Create Worker
 *   2. Paste this file into the editor
 *   3. Note the worker URL (e.g. lnx2-verify.yourname.workers.dev)
 *   4. Set verifyWorkerURL in lnx2.js to that URL
 *
 * Option B — Wrangler CLI:
 *   npm install -g wrangler
 *   wrangler login
 *   wrangler deploy workers/worker.js --name lnx2-verify --compatibility-date 2024-01-01
 *
 * FREE TIER: 100,000 requests/day — more than sufficient.
 *
 * ADDING API KEYS (YouTube, Twitch)
 * -----------------------------------
 * When you're ready to verify YouTube or Twitch, add the keys as Worker secrets
 * (never in source code):
 *   wrangler secret put YOUTUBE_API_KEY
 *   wrangler secret put TWITCH_CLIENT_ID
 *   wrangler secret put TWITCH_CLIENT_SECRET
 * Then update the youtube() and twitch() functions below to use env.YOUTUBE_API_KEY etc.
 */


// ─── PLATFORM CHECK DEFINITIONS ───────────────────────────────────────────────

// Platforms we actively check. Each returns { url, method }.
const CHECKABLE = {

  github:   h => ({ url: `https://github.com/${h}`,                           method: 'HEAD' }),
  reddit:   h => ({ url: `https://www.reddit.com/user/${h}`,                  method: 'HEAD' }),
  pinterest:h => ({ url: `https://www.pinterest.com/${h}/`,                   method: 'HEAD' }),
  vimeo:    h => ({ url: `https://vimeo.com/${h}`,                            method: 'HEAD' }),
  tumblr:   h => ({ url: `https://www.tumblr.com/${h}`,                       method: 'HEAD' }),
  substack: h => ({ url: `https://substack.com/@${h}`,                        method: 'HEAD' }),

  // Bluesky uses the AT Protocol — returns JSON 200 if found, 400 if not.
  // No API key required.
  bluesky:  h => ({ url: `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${h}.bsky.social`, method: 'GET' }),

};

// Platforms blocked by CORS / bot detection / JS rendering — no check attempted.
const UNVERIFIABLE = [
  'instagram', 'x', 'facebook', 'tiktok', 'linkedin',
  'threads', 'snapchat', 'telegram', 'website',
];

// Platforms that need API keys — checked once keys are configured.
const NEEDS_KEY = ['youtube', 'twitch'];


// ─── CORE CHECK LOGIC ─────────────────────────────────────────────────────────

async function checkPlatform(key, handle) {
  const { url, method } = CHECKABLE[key](handle);

  try {
    const resp = await fetch(url, {
      method,
      redirect: 'follow',
      headers: {
        // A real UA avoids bot blocks on some platforms
        'User-Agent': 'Mozilla/5.0 (compatible; lnx2-verify/1.0; +https://lnx2.io)',
      },
    });

    // Bluesky: 200 = handle resolved, anything else = not found
    if (key === 'bluesky') {
      return resp.ok ? 'confirmed' : 'notfound';
    }

    if (resp.status === 200) return 'confirmed';
    if (resp.status === 404) return 'notfound';

    // Any other status (301 without redirect resolution, 403, 429, etc.)
    // — treat as unverified rather than notfound to avoid false negatives
    return 'unverified';

  } catch {
    return 'unverified';
  }
}


// ─── FETCH HANDLER ────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age':       '86400',
};

export default {
  async fetch(request) {

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url    = new URL(request.url);
    const handle = (url.searchParams.get('handle') || '').trim();

    // Basic handle validation — alphanumeric, dots, hyphens, underscores only
    if (!handle || handle.length > 50 || !/^[\w.\-]+$/.test(handle)) {
      return new Response(
        JSON.stringify({ error: 'invalid handle' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const results = {};

    // Set known-unverifiable platforms immediately (no fetch needed)
    for (const key of UNVERIFIABLE) results[key] = 'unverified';
    for (const key of NEEDS_KEY)    results[key] = 'unverified';

    // Run all live checks in parallel
    await Promise.all(
      Object.keys(CHECKABLE).map(async key => {
        results[key] = await checkPlatform(key, handle);
      })
    );

    return new Response(JSON.stringify(results), {
      headers: {
        ...CORS_HEADERS,
        'Content-Type':  'application/json',
        'Cache-Control': 'no-store',
      },
    });
  },
};
