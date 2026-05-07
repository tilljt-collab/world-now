# WorldNow — Design Spec
**Date:** 2026-05-03  
**Status:** Approved

---

## Overview

WorldNow is a website that displays a real-time interactive world map overlaid with live news stories. Stories are represented as colour-coded, size-scaled dots on the map. Zooming in reveals progressively more localised coverage. Side panels show collapsible live news streams. The aesthetic is election-night broadcast energy (bold red/white palette, live counters, breaking news tickers) layered over a dark situation-room map.

---

## Visual Design

**Palette:** Deep navy/black background (`#060b18`), dark country fills (`#0f1e35`), red accent (`#c0392b` / `#e74c3c`), white text.

**Layout (left to right):**
- **Left panel (210px):** Collapsible live stream tiles (Al Jazeera, BBC, DW, France 24, CNN International). Each tile shows channel name, region tag, LIVE badge, and an embedded YouTube player. Click ▲/▼ to collapse/expand individual streams.
- **Centre (flex-1):** Interactive map. Dark country polygons on a near-black ocean. News dots overlaid. Zoom controls bottom-right. Severity hint fades out at zoom 5+.
- **Right panel (210px):** Live top-stories feed, sorted by importance. Each card shows category colour dot, category label, headline, source, and time ago. Clicking a card flies the map to that story's location.

**Top bar:** Logo, LIVE pill, scrolling breaking news ticker, story/breaking/live counters.

**Bottom bar:** Red BREAKING tag + auto-scrolling ticker of top headlines.

---

## Map

**Library:** MapLibre GL JS (WebGL, smooth zoom/pan, supports custom dark styles).

**Base map:** Vector GeoJSON country polygons rendered locally — no tile server dependency. Country fills are dark navy; borders are slightly lighter. Countries subtly highlight on hover.

**Dot markers:**
- Shape: clean crisp circle with a thin white border (`2.5px solid rgba(255,255,255,0.55)`). No blur or glow.
- Size: scales with importance 1–5 → 4px / 7px / 10px / 13px / 16px radius.
- Colour: determined by story category (see Categories).
- Animation: a sharp pulsing ring radiates outward from each dot (CSS `@keyframes`, speed varies by importance).

**Zoom tiers (story density):**
| Zoom level | Stories shown | Coverage |
|---|---|---|
| 2 (default) | ~28 | Global — major international events |
| 4 | +40 | Regional — national politics, city-level disasters |
| 6 | +50 | Local — neighbourhood incidents, city council, local strikes |
| 8 | +30 | Hyper-local — street-level flooding, planning disputes, local crime |

Markers outside the current zoom tier are hidden; they appear smoothly as the user zooms in. The story counter in the top bar updates to reflect visible count.

---

## Story Categories

Each story belongs to one category, shown via dot colour and label:

| Category | Colour | Hex |
|---|---|---|
| Conflict / War | Red | `#e74c3c` |
| Politics / Elections | Orange | `#e67e22` |
| Economy / Finance | Yellow | `#f1c40f` |
| Climate / Environment | Green | `#2ecc71` |
| Disaster / Emergency | Purple | `#9b59b6` |
| Diplomacy / Global | Blue | `#2980b9` |
| Society / Culture | Teal | `#1abc9c` |

---

## Hover Tooltip

Hovering a dot shows a dark tooltip (260px wide, word-wrapped) containing:

1. **Category label** (small caps, muted colour)
2. **Headline** (bold, 12px)
3. **Summary** (1–2 sentences from the NewsAPI article description)
4. **Source + time ago** (muted, 9px)
5. **"Click for more →"** (red, links to the original article URL in a new tab)

Clicking the dot or the "Click for more →" link opens the source article in a new tab.

---

## Video / Live Streams

**Side panel streams:** Hardcoded YouTube channel embeds for Al Jazeera English, BBC World News, DW News, France 24, and CNN International. Each is collapsible. These load immediately on page open.

**Hover video clip:** On hover, a YouTube Data API search fires for the region's top story and surfaces the most recent relevant clip as a "▶ Watch clip" link in the tooltip. This is a secondary action below the summary.

---

## Data — News Stories

**Source:** [NewsAPI.org](https://newsapi.org) (free tier → paid as traffic grows).

**Flow:**
1. A Next.js API route (`/api/news`) runs server-side every 3 minutes, fetching top headlines by region (US, Europe, Middle East, Asia, Africa, Latin America, Asia-Pacific).
2. Each article is matched to lat/lng via a keyword → country → centroid lookup table (no extra API calls).
3. Category is assigned by keyword matching against the headline and description.
4. Importance (1–5) is derived from source authority + recency + keyword severity signals (e.g. "kills", "crisis", "emergency" = higher).
5. Results are cached server-side (in-memory or Redis) so concurrent users don't each hit NewsAPI.
6. The client polls `/api/news` every 3 minutes and diffs the response against current markers, adding/removing smoothly.

---

## Auto-Refresh

- Client polls every 3 minutes.
- New markers animate in; removed markers fade out.
- When a new importance-5 story appears during a refresh, the Breaking News Flash (see Additional Features) triggers automatically.

---

## Additional Features

**Story clustering:** At zoom levels 2–3, nearby dots within ~80px of each other merge into a single larger dot with a count badge. Expanding zoom dissolves the cluster back into individual markers.

**Category filter bar:** A row of toggleable category buttons above the map (or in a compact drawer). Deselecting a category hides all its markers globally. Defaults to all categories on.

**Time scrubber:** A slider at the bottom of the map area lets users rewind to see the news landscape 1h / 6h / 24h ago. Requires the API route to cache historical snapshots.

**Country click panel:** Clicking a country polygon opens a right-side drawer listing all stories for that country, independent of zoom level.

**Breaking news flash banner:** Full-width red strip that drops from the top bar on new importance-5 stories, showing the headline, and fades after 5 seconds.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | API routes for server-side NewsAPI proxy, easy Vercel deployment |
| Map | MapLibre GL JS | WebGL smooth zoom, custom dark vector styles, free |
| Styling | Tailwind CSS | Rapid UI, consistent dark theme tokens |
| News data | NewsAPI.org | Simple REST API, structured JSON, free tier available |
| Video | YouTube Data API v3 | Clip search + embed for hover; hardcoded channel IDs for side streams |
| Caching | Next.js route cache / Redis | Prevent NewsAPI rate limiting under concurrent users |
| Deployment | Vercel | One-command deploy, serverless API routes, CDN |

---

## Out of Scope (v1)

- User accounts or saved preferences
- Push notifications
- Mobile app
- Paid content or paywalled sources
- Custom news ingestion beyond NewsAPI
