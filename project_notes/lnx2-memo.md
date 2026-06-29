# lnx2 Project Memo
*June 29, 2026*

## Goal

lnx2 is a lightweight social link aggregator. A user enters their handle and selects which platforms to include; the service generates a single shareable URL that renders a page of links to all their profiles. No registration is required. The service works on the premise that many creators and professionals use the same handle across multiple platforms — and for those users, a single handle plus a bitmask code is all that's needed to generate their full link bundle.

## Current State

The core application is built and deployed at `bobnease.github.io/lnx2/`. It is a fully static site (HTML, CSS, vanilla JS) hosted on GitHub Pages. It consists of two pages: a configurator (`config.html`) where users build their link bundle and copy a shareable URL, and an index page (`index.html`) that renders the links for a given URL.

The platform list currently covers 18 platforms: Instagram, X, YouTube, TikTok, Facebook, Bluesky, Threads, LinkedIn, GitHub, Reddit, Snapchat, Twitch, Pinterest, Telegram, Substack, Tumblr, Vimeo, and Website. Platforms are encoded as a hex bitmask in the URL, with each platform assigned a permanent power-of-2 value. This encoding is backward-compatible by design: as long as `dec` values are never reassigned, links generated today will resolve correctly indefinitely, even if platforms are added or retired.

## Next Steps

**Look & feel.** ~~Done (2026-06-29).~~ Core desktop layout shipped. Further visual identity work (typography, color palette, branding) remains open if desired.

**Automatic platform verification.** The original vision included a step where, after a user enters their handle, the service automatically checks which platforms have an account with that handle — and presents only confirmed platforms for selection. A prototype of this using the Google Custom Search API exists in `search.html` but was never integrated. This feature would significantly improve the user experience and is the logical next major build. It requires either a search API integration or direct platform API calls, and would need a lightweight backend or serverless function to keep API keys off the client.

**Monetization.** Several options are worth exploring as the service matures. Promoted placement — platforms paying to appear first in the link grid — is the most natural fit given the architecture, since display order is already controlled by a simple `order` field. Default-on placement (a platform appearing on all pages unless the user opts out) is a more aggressive variant. A JSON-driven config file served from a backend would enable real-time order adjustments across all user pages without a code deploy. Longer term, once platform verification is live, confirmed-account placement (showing a platform prominently because the handle is verified as active) adds a quality signal that could command premium pricing.

## Folder Structure

The project lives at `lnx2 claude/` with two top-level subfolders:

- `project_notes/` — all non-code items: memos, specs, research, ATC logs, and any other reference material. This is where the ATC log and this memo live.
- (repo root) — all deployable code files (`index.html`, `config.html`, `js/`, `css/`), served directly by GitHub Pages.

New non-code items should be saved to `project_notes/`. Code changes go in the root and pushed to GitHub to deploy.

## Project ATC

To coordinate ongoing development, a dedicated foreman chat ("ATC") will serve as the running log for this project — tracking what has been decided, what has been built, what is in progress, and what comes next. The ATC chat should be consulted at the start of each working session and updated at the end. It is the authoritative record of project state and serves as the briefing document for any AI collaborator picking up the thread. ATC logs and session summaries are saved to `project_notes/`.
