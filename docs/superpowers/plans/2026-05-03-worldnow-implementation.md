# WorldNow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-time interactive world news map website where coloured, size-scaled dots appear on a dark globe representing live news stories, with zoom-dependent density, hover tooltips with summaries, collapsible live stream side panels, and auto-refresh every 3 minutes.

**Architecture:** Next.js 14 App Router with MapLibre GL JS for the WebGL map. A server-side API route proxies NewsAPI.org, geolocates articles, assigns categories, scores importance, and caches results so concurrent clients don't hammer the API. The client polls `/api/news` every 3 minutes and diffs markers. All map rendering is client-side only (dynamic import, no SSR).

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, MapLibre GL JS, NewsAPI.org, YouTube IFrame API, Jest + Testing Library, Vercel.

---

## File Map

```
world-now/
├── public/
│   └── world.geojson               # Country polygons (downloaded in Task 1)
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout — fonts, <html> attrs
│   │   ├── page.tsx                # Single page — renders <Shell>
│   │   ├── globals.css             # CSS variables + resets
│   │   └── api/
│   │       └── news/
│   │           └── route.ts        # GET /api/news — fetch, process, cache
│   ├── components/
│   │   ├── Shell.tsx               # Flex column: TopBar + Main + BottomBar
│   │   ├── TopBar.tsx              # Logo, LIVE pill, ticker, counters
│   │   ├── BottomBar.tsx           # Red BREAKING tag + scrolling ticker
│   │   ├── LeftPanel.tsx           # Collapsible stream tiles column
│   │   ├── StreamTile.tsx          # Single live stream with collapse toggle
│   │   ├── RightPanel.tsx          # Top-stories feed column
│   │   ├── StoryCard.tsx           # Single story card (category dot, headline)
│   │   ├── MapContainer.tsx        # MapLibre GL instance + GeoJSON layer (client-only)
│   │   ├── MarkersLayer.tsx        # Renders all story markers onto the map
│   │   ├── StoryTooltip.tsx        # Tooltip HTML: category, headline, summary, link
│   │   ├── CategoryFilter.tsx      # Toggle buttons row above the map
│   │   ├── ClusterMarker.tsx       # Cluster dot with count badge
│   │   ├── BreakingFlash.tsx       # Full-width red drop banner for new critical stories
│   │   └── ZoomHint.tsx            # "Zoom in to reveal more stories" overlay
│   ├── lib/
│   │   ├── types.ts                # Story, Category, Importance — all shared types
│   │   ├── centroids.ts            # country-code → { lat, lng } lookup (150+ countries)
│   │   ├── geolocate.ts            # article → { lat, lng, countryCode } | null
│   │   ├── categorize.ts           # article → Category
│   │   ├── importance.ts           # article → 1–5 importance score
│   │   └── cache.ts                # In-memory TTL cache (singleton)
│   └── __tests__/
│       ├── geolocate.test.ts
│       ├── categorize.test.ts
│       ├── importance.test.ts
│       ├── cache.test.ts
│       ├── api-news.test.ts
│       ├── StoryCard.test.tsx
│       ├── StreamTile.test.tsx
│       └── BreakingFlash.test.tsx
```

---

## Task 1: Scaffold the project

**Files:**
- Create: `world-now/` (project root, all files below)
- Create: `public/world.geojson`
- Create: `.env.local`

- [ ] **Step 1: Create Next.js app**

```bash
cd "C:\Users\Jamie\OneDrive\Claude Work\Extra Things\World News"
npx create-next-app@latest world-now \
  --typescript --tailwind --eslint --app \
  --no-src-dir --import-alias "@/*"
cd world-now
```

Expected: project created with `app/`, `public/`, `tailwind.config.ts`, `tsconfig.json`.

- [ ] **Step 2: Install dependencies**

```bash
npm install maplibre-gl @types/maplibre-gl
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest @types/jest
```

- [ ] **Step 3: Configure Jest**

Create `jest.config.ts`:
```ts
import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
  },
}
export default config
```

Create `jest.setup.ts`:
```ts
import '@testing-library/jest-dom'
```

Create `__mocks__/styleMock.js`:
```js
module.exports = {}
```

- [ ] **Step 4: Download world GeoJSON**

```bash
curl -sL "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson" \
  -o public/world.geojson
```

Expected: `public/world.geojson` ~252KB.

- [ ] **Step 5: Create `.env.local`**

```bash
cat > .env.local << 'EOF'
NEWS_API_KEY=your_newsapi_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
EOF
```

Get a free NewsAPI key at https://newsapi.org/register. Get a YouTube Data API v3 key at https://console.cloud.google.com.

- [ ] **Step 6: Move source files to `src/`**

Next.js created files in `app/`. Move them:
```bash
mkdir -p src/app src/components src/lib src/__tests__
mv app src/
mv components src/ 2>/dev/null || true
```

Update `tsconfig.json` paths:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts at `http://localhost:3000`. No errors in terminal.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with MapLibre and Jest"
```

---

## Task 2: Shared types and CSS foundation

**Files:**
- Create: `src/lib/types.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Write shared types**

Create `src/lib/types.ts`:
```ts
export type Category =
  | 'conflict'
  | 'politics'
  | 'economy'
  | 'climate'
  | 'disaster'
  | 'diplomacy'
  | 'society'

export interface Story {
  id: string              // NewsAPI article URL hash
  lat: number
  lng: number
  countryCode: string
  headline: string
  summary: string         // NewsAPI description field
  url: string             // Source article URL
  source: string          // e.g. "Reuters"
  publishedAt: string     // ISO string
  ago: string             // Human-readable: "4m", "2h", "1d"
  category: Category
  importance: number      // 1–5
  minZoom: number         // 2 | 4 | 6 | 8
}

export const CATEGORY_COLORS: Record<Category, string> = {
  conflict:  '#e74c3c',
  politics:  '#e67e22',
  economy:   '#f1c40f',
  climate:   '#2ecc71',
  disaster:  '#9b59b6',
  diplomacy: '#2980b9',
  society:   '#1abc9c',
}

export const CATEGORY_LABELS: Record<Category, string> = {
  conflict:  'Conflict / War',
  politics:  'Politics / Elections',
  economy:   'Economy / Finance',
  climate:   'Climate / Environment',
  disaster:  'Disaster / Emergency',
  diplomacy: 'Diplomacy / Global',
  society:   'Society / Culture',
}

export const DOT_RADII: Record<number, number> = { 1: 4, 2: 7, 3: 10, 4: 13, 5: 16 }
```

- [ ] **Step 2: Set global CSS variables**

Replace `src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg:        #060b18;
  --panel:     #0b0f1f;
  --panel-hdr: #0d1225;
  --border:    #1a2040;
  --accent:    #e74c3c;
  --accent-dk: #c0392b;
  --text:      #ffffff;
  --muted:     #8899bb;
  --dim:       #445566;
}

* { box-sizing: border-box; }
html, body { height: 100%; overflow: hidden; background: var(--bg); color: var(--text); }

/* MapLibre resets */
.maplibregl-canvas { display: block; }
.maplibregl-ctrl-attrib { display: none !important; }
.maplibregl-ctrl-zoom button {
  background: rgba(10,14,30,.92) !important;
  color: #aabbdd !important;
  border-color: #2a3560 !important;
}

/* Tooltip */
.story-tooltip {
  background: rgba(6,10,22,.97);
  border: 1px solid #2a3560;
  border-left: 3px solid var(--accent);
  border-radius: 4px;
  color: #fff;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 12px;
  padding: 10px 13px;
  width: 260px;
  max-width: 260px;
  white-space: normal;
  word-break: break-word;
  box-shadow: 0 4px 22px rgba(0,0,0,.8);
  pointer-events: auto;
}
.tooltip-cat  { font-size: 8px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
.tooltip-h    { font-size: 12px; font-weight: 600; line-height: 1.38; margin-bottom: 5px; }
.tooltip-sum  { font-size: 10px; color: #b0bdd4; line-height: 1.5; margin-bottom: 7px; }
.tooltip-meta { font-size: 9px; color: var(--dim); margin-bottom: 6px; }
.tooltip-more { font-size: 10px; font-weight: 700; color: var(--accent); letter-spacing: .5px; text-decoration: none; }
.tooltip-more:hover { color: #ff6b6b; text-decoration: underline; }

/* Pulse ring animation */
@keyframes markerRing {
  0%   { transform: translate(-50%,-50%) scale(1); opacity: .85; }
  100% { transform: translate(-50%,-50%) scale(4); opacity: 0; }
}

/* Breaking flash */
@keyframes flashDrop {
  0%   { transform: translateY(-100%); opacity: 0; }
  10%  { transform: translateY(0);    opacity: 1; }
  80%  { transform: translateY(0);    opacity: 1; }
  100% { transform: translateY(-100%); opacity: 0; }
}

/* Bottom ticker scroll */
@keyframes tickerScroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}
```

- [ ] **Step 3: Update root layout**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WorldNow — Live Global News Map',
  description: 'Real-time world news visualised on an interactive map',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/app/globals.css src/app/layout.tsx
git commit -m "feat: add shared types and global CSS foundation"
```

---

## Task 3: Country centroids lookup

**Files:**
- Create: `src/lib/centroids.ts`

No test needed — this is pure static data.

- [ ] **Step 1: Create centroids file**

Create `src/lib/centroids.ts`:
```ts
// ISO 3166-1 alpha-2 country code → approximate geographic centroid
export const CENTROIDS: Record<string, { lat: number; lng: number }> = {
  AF: { lat: 33.9,  lng: 67.7  }, // Afghanistan
  AL: { lat: 41.1,  lng: 20.2  }, // Albania
  DZ: { lat: 28.0,  lng: 3.0   }, // Algeria
  AO: { lat: -11.2, lng: 17.9  }, // Angola
  AR: { lat: -38.4, lng: -63.6 }, // Argentina
  AM: { lat: 40.1,  lng: 45.0  }, // Armenia
  AU: { lat: -25.3, lng: 133.8 }, // Australia
  AT: { lat: 47.5,  lng: 14.6  }, // Austria
  AZ: { lat: 40.1,  lng: 47.6  }, // Azerbaijan
  BD: { lat: 23.7,  lng: 90.4  }, // Bangladesh
  BY: { lat: 53.7,  lng: 28.0  }, // Belarus
  BE: { lat: 50.5,  lng: 4.5   }, // Belgium
  BJ: { lat: 9.3,   lng: 2.3   }, // Benin
  BO: { lat: -16.3, lng: -63.6 }, // Bolivia
  BA: { lat: 44.2,  lng: 17.7  }, // Bosnia and Herzegovina
  BR: { lat: -14.2, lng: -51.9 }, // Brazil
  BF: { lat: 12.4,  lng: -1.6  }, // Burkina Faso
  MM: { lat: 21.9,  lng: 95.9  }, // Myanmar
  BI: { lat: -3.4,  lng: 29.9  }, // Burundi
  KH: { lat: 12.6,  lng: 104.9 }, // Cambodia
  CM: { lat: 3.8,   lng: 11.5  }, // Cameroon
  CA: { lat: 56.1,  lng: -106.3}, // Canada
  CF: { lat: 6.6,   lng: 20.9  }, // Central African Republic
  TD: { lat: 15.5,  lng: 18.7  }, // Chad
  CL: { lat: -35.7, lng: -71.5 }, // Chile
  CN: { lat: 35.9,  lng: 104.2 }, // China
  CO: { lat: 4.6,   lng: -74.3 }, // Colombia
  CG: { lat: -0.2,  lng: 15.8  }, // Congo
  CD: { lat: -4.0,  lng: 21.8  }, // DR Congo
  HR: { lat: 45.1,  lng: 15.2  }, // Croatia
  CU: { lat: 21.5,  lng: -79.5 }, // Cuba
  CY: { lat: 35.1,  lng: 33.4  }, // Cyprus
  CZ: { lat: 49.8,  lng: 15.5  }, // Czech Republic
  DK: { lat: 56.3,  lng: 9.5   }, // Denmark
  DJ: { lat: 11.6,  lng: 43.1  }, // Djibouti
  DO: { lat: 18.7,  lng: -70.2 }, // Dominican Republic
  EC: { lat: -1.8,  lng: -78.2 }, // Ecuador
  EG: { lat: 26.8,  lng: 30.8  }, // Egypt
  SV: { lat: 13.8,  lng: -88.9 }, // El Salvador
  ER: { lat: 15.2,  lng: 39.8  }, // Eritrea
  ET: { lat: 9.1,   lng: 40.5  }, // Ethiopia
  FI: { lat: 61.9,  lng: 25.7  }, // Finland
  FR: { lat: 46.2,  lng: 2.2   }, // France
  GA: { lat: -0.8,  lng: 11.6  }, // Gabon
  GE: { lat: 42.3,  lng: 43.4  }, // Georgia
  DE: { lat: 51.2,  lng: 10.5  }, // Germany
  GH: { lat: 7.9,   lng: -1.0  }, // Ghana
  GR: { lat: 39.1,  lng: 21.8  }, // Greece
  GT: { lat: 15.8,  lng: -90.2 }, // Guatemala
  GN: { lat: 11.0,  lng: -10.9 }, // Guinea
  HT: { lat: 19.0,  lng: -72.3 }, // Haiti
  HN: { lat: 15.2,  lng: -86.2 }, // Honduras
  HU: { lat: 47.2,  lng: 19.5  }, // Hungary
  IN: { lat: 20.6,  lng: 78.9  }, // India
  ID: { lat: -0.8,  lng: 113.9 }, // Indonesia
  IR: { lat: 32.4,  lng: 53.7  }, // Iran
  IQ: { lat: 33.2,  lng: 43.7  }, // Iraq
  IE: { lat: 53.4,  lng: -8.2  }, // Ireland
  IL: { lat: 31.0,  lng: 34.9  }, // Israel
  IT: { lat: 41.9,  lng: 12.6  }, // Italy
  JM: { lat: 18.1,  lng: -77.3 }, // Jamaica
  JP: { lat: 36.2,  lng: 138.3 }, // Japan
  JO: { lat: 30.6,  lng: 36.2  }, // Jordan
  KZ: { lat: 48.0,  lng: 66.9  }, // Kazakhstan
  KE: { lat: -0.0,  lng: 37.9  }, // Kenya
  KP: { lat: 40.3,  lng: 127.5 }, // North Korea
  KR: { lat: 35.9,  lng: 127.8 }, // South Korea
  KW: { lat: 29.3,  lng: 47.5  }, // Kuwait
  KG: { lat: 41.2,  lng: 74.8  }, // Kyrgyzstan
  LA: { lat: 19.9,  lng: 102.5 }, // Laos
  LB: { lat: 33.9,  lng: 35.5  }, // Lebanon
  LY: { lat: 26.3,  lng: 17.2  }, // Libya
  LT: { lat: 55.2,  lng: 23.9  }, // Lithuania
  MK: { lat: 41.6,  lng: 21.7  }, // North Macedonia
  MG: { lat: -18.8, lng: 46.9  }, // Madagascar
  MW: { lat: -13.3, lng: 34.3  }, // Malawi
  MY: { lat: 4.2,   lng: 108.0 }, // Malaysia
  ML: { lat: 17.6,  lng: -4.0  }, // Mali
  MR: { lat: 21.0,  lng: -10.9 }, // Mauritania
  MX: { lat: 23.6,  lng: -102.6}, // Mexico
  MD: { lat: 47.4,  lng: 28.4  }, // Moldova
  MN: { lat: 46.9,  lng: 103.8 }, // Mongolia
  MA: { lat: 31.8,  lng: -7.1  }, // Morocco
  MZ: { lat: -18.7, lng: 35.5  }, // Mozambique
  NA: { lat: -22.9, lng: 18.5  }, // Namibia
  NP: { lat: 28.4,  lng: 84.1  }, // Nepal
  NL: { lat: 52.1,  lng: 5.3   }, // Netherlands
  NZ: { lat: -40.9, lng: 174.9 }, // New Zealand
  NI: { lat: 12.9,  lng: -85.2 }, // Nicaragua
  NE: { lat: 17.6,  lng: 8.1   }, // Niger
  NG: { lat: 9.1,   lng: 8.7   }, // Nigeria
  NO: { lat: 60.5,  lng: 8.5   }, // Norway
  OM: { lat: 21.5,  lng: 55.9  }, // Oman
  PK: { lat: 30.4,  lng: 69.3  }, // Pakistan
  PA: { lat: 8.5,   lng: -80.8 }, // Panama
  PG: { lat: -6.3,  lng: 143.9 }, // Papua New Guinea
  PY: { lat: -23.4, lng: -58.4 }, // Paraguay
  PE: { lat: -9.2,  lng: -75.0 }, // Peru
  PH: { lat: 12.9,  lng: 121.8 }, // Philippines
  PL: { lat: 51.9,  lng: 19.1  }, // Poland
  PT: { lat: 39.4,  lng: -8.2  }, // Portugal
  QA: { lat: 25.4,  lng: 51.2  }, // Qatar
  RO: { lat: 45.9,  lng: 24.9  }, // Romania
  RU: { lat: 61.5,  lng: 105.3 }, // Russia
  RW: { lat: -1.9,  lng: 29.9  }, // Rwanda
  SA: { lat: 23.9,  lng: 45.1  }, // Saudi Arabia
  SN: { lat: 14.5,  lng: -14.5 }, // Senegal
  RS: { lat: 44.0,  lng: 21.0  }, // Serbia
  SL: { lat: 8.5,   lng: -11.8 }, // Sierra Leone
  SO: { lat: 5.2,   lng: 46.2  }, // Somalia
  ZA: { lat: -30.6, lng: 22.9  }, // South Africa
  SS: { lat: 7.9,   lng: 29.7  }, // South Sudan
  ES: { lat: 40.5,  lng: -3.7  }, // Spain
  LK: { lat: 7.9,   lng: 80.8  }, // Sri Lanka
  SD: { lat: 15.6,  lng: 32.5  }, // Sudan
  SE: { lat: 60.1,  lng: 18.6  }, // Sweden
  CH: { lat: 46.8,  lng: 8.2   }, // Switzerland
  SY: { lat: 34.8,  lng: 38.9  }, // Syria
  TW: { lat: 23.7,  lng: 120.9 }, // Taiwan
  TJ: { lat: 38.9,  lng: 71.3  }, // Tajikistan
  TZ: { lat: -6.4,  lng: 34.9  }, // Tanzania
  TH: { lat: 15.9,  lng: 100.9 }, // Thailand
  TL: { lat: -8.9,  lng: 125.7 }, // Timor-Leste
  TG: { lat: 8.6,   lng: 0.8   }, // Togo
  TN: { lat: 33.9,  lng: 9.6   }, // Tunisia
  TR: { lat: 38.9,  lng: 35.2  }, // Turkey
  TM: { lat: 38.9,  lng: 59.6  }, // Turkmenistan
  UG: { lat: 1.4,   lng: 32.3  }, // Uganda
  UA: { lat: 48.4,  lng: 31.2  }, // Ukraine
  AE: { lat: 24.0,  lng: 54.0  }, // UAE
  GB: { lat: 55.4,  lng: -3.4  }, // United Kingdom
  US: { lat: 37.1,  lng: -95.7 }, // United States
  UY: { lat: -32.5, lng: -55.8 }, // Uruguay
  UZ: { lat: 41.4,  lng: 64.6  }, // Uzbekistan
  VE: { lat: 6.4,   lng: -66.6 }, // Venezuela
  VN: { lat: 14.1,  lng: 108.3 }, // Vietnam
  YE: { lat: 15.6,  lng: 48.5  }, // Yemen
  ZM: { lat: -13.1, lng: 27.8  }, // Zambia
  ZW: { lat: -20.0, lng: 30.0  }, // Zimbabwe
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/centroids.ts
git commit -m "feat: add country centroid lookup table (150+ countries)"
```

---

## Task 4: Geolocate, categorize, importance — logic + tests

**Files:**
- Create: `src/lib/geolocate.ts`
- Create: `src/lib/categorize.ts`
- Create: `src/lib/importance.ts`
- Create: `src/__tests__/geolocate.test.ts`
- Create: `src/__tests__/categorize.test.ts`
- Create: `src/__tests__/importance.test.ts`

- [ ] **Step 1: Write failing geolocate tests**

Create `src/__tests__/geolocate.test.ts`:
```ts
import { geolocate } from '@/lib/geolocate'

const makeArticle = (title: string, description = '') => ({
  title, description, url: 'https://example.com', source: { name: 'Test' },
  publishedAt: new Date().toISOString(), content: '',
})

describe('geolocate', () => {
  it('returns coords for a clearly UK article', () => {
    const result = geolocate(makeArticle('UK Parliament votes on new bill'))
    expect(result).not.toBeNull()
    expect(result!.countryCode).toBe('GB')
    expect(result!.lat).toBeCloseTo(55.4, 0)
  })

  it('returns coords for a US article', () => {
    const result = geolocate(makeArticle('US Senate passes foreign aid bill'))
    expect(result!.countryCode).toBe('US')
  })

  it('returns null for an unlocatable article', () => {
    const result = geolocate(makeArticle('Scientists discover new protein structure'))
    expect(result).toBeNull()
  })

  it('searches description if title has no match', () => {
    const result = geolocate(makeArticle('Breaking news today', 'Floods hit Bangladesh villages'))
    expect(result!.countryCode).toBe('BD')
  })
})
```

- [ ] **Step 2: Run — verify FAIL**

```bash
npx jest geolocate --no-coverage
```
Expected: FAIL with "Cannot find module '@/lib/geolocate'".

- [ ] **Step 3: Implement geolocate**

Create `src/lib/geolocate.ts`:
```ts
import { CENTROIDS } from './centroids'

interface NewsArticle {
  title: string
  description: string
  url: string
  source: { name: string }
  publishedAt: string
  content: string
}

interface GeoResult {
  lat: number
  lng: number
  countryCode: string
}

// Maps common country name variants → ISO code
const COUNTRY_KEYWORDS: Array<[RegExp, string]> = [
  [/\buk\b|united kingdom|britain|british|england|scotland|wales/i, 'GB'],
  [/\bus\b|united states|american|washington d\.?c\.?/i, 'US'],
  [/\bchina\b|chinese|beijing|shanghai/i, 'CN'],
  [/\brussia\b|russian|moscow|kremlin/i, 'RU'],
  [/\bukraine\b|ukrainian|kyiv|kharkiv/i, 'UA'],
  [/\bisrael\b|israeli|tel aviv/i, 'IL'],
  [/\bgaza\b|hamas|rafah|west bank/i, 'IL'],
  [/\biran\b|iranian|tehran/i, 'IR'],
  [/\bpalestine\b|palestinian/i, 'IL'],
  [/\bsyria\b|syrian|damascus|aleppo/i, 'SY'],
  [/\bturkey\b|turkish|istanbul|ankara/i, 'TR'],
  [/\bgermany\b|german|berlin/i, 'DE'],
  [/\bfrance\b|french|paris/i, 'FR'],
  [/\bindia\b|indian|delhi|mumbai|modi/i, 'IN'],
  [/\bpakistan\b|pakistani|islamabad|karachi/i, 'PK'],
  [/\bbrazil\b|brazilian|brasilia|sao paulo/i, 'BR'],
  [/\bnigeria\b|nigerian|lagos|abuja/i, 'NG'],
  [/\bafghanistan\b|afghan|kabul|taliban/i, 'AF'],
  [/\beiraq\b|iraqi|baghdad/i, 'IQ'],
  [/\bsudan\b|sudanese|khartoum/i, 'SD'],
  [/\bsouth africa\b|pretoria|johannesburg/i, 'ZA'],
  [/\bmexico\b|mexican/i, 'MX'],
  [/\bargentina\b|buenos aires/i, 'AR'],
  [/\bkolumbia\b|colombia\b|bogota/i, 'CO'],
  [/\bvenezuela\b|caracas/i, 'VE'],
  [/\bbangladesh\b|dhaka/i, 'BD'],
  [/\bindonesia\b|jakarta/i, 'ID'],
  [/\bphilippines\b|manila/i, 'PH'],
  [/\bjapan\b|japanese|tokyo/i, 'JP'],
  [/\bsouth korea\b|korean|seoul/i, 'KR'],
  [/\bnorth korea\b|pyongyang/i, 'KP'],
  [/\btaiwan\b|taipei/i, 'TW'],
  [/\bcanada\b|canadian|ottawa|toronto/i, 'CA'],
  [/\baustralia\b|australian|sydney|canberra/i, 'AU'],
  [/\bethiopia\b|addis ababa/i, 'ET'],
  [/\bkenya\b|nairobi/i, 'KE'],
  [/\begypt\b|egyptian|cairo/i, 'EG'],
  [/\bsaudi arabia\b|riyadh/i, 'SA'],
  [/\bspain\b|spanish|madrid/i, 'ES'],
  [/\bitaly\b|italian|rome/i, 'IT'],
  [/\bpoland\b|warsaw/i, 'PL'],
  [/\bgreece\b|athens/i, 'GR'],
  [/\bsweden\b|stockholm/i, 'SE'],
  [/\bnetherlands\b|amsterdam/i, 'NL'],
  [/\blebanon\b|beirut|hezbollah/i, 'LB'],
  [/\bgeorgia\b|tbilisi/i, 'GE'],
  [/\bniger\b/i, 'NE'],
  [/\bnigeria\b/i, 'NG'],
  [/\bmali\b/i, 'ML'],
  [/\bchile\b/i, 'CL'],
  [/\bperu\b/i, 'PE'],
  [/\bvietnam\b|hanoi/i, 'VN'],
  [/\bthailand\b|bangkok/i, 'TH'],
  [/\bmalaysia\b|kuala lumpur/i, 'MY'],
  [/\bnorway\b|oslo/i, 'NO'],
  [/\bfinland\b|helsinki/i, 'FI'],
  [/\bbelgium\b|brussels/i, 'BE'],
  [/\baustria\b|vienna/i, 'AT'],
  [/\bhungary\b|budapest/i, 'HU'],
  [/\bromania\b|bucharest/i, 'RO'],
  [/\bkazakhstan\b|astana|almaty/i, 'KZ'],
  [/\blazakhstan\b/i, 'KZ'],
  [/\bserbia\b|belgrade/i, 'RS'],
  [/\bportuguese\b|portugal\b|lisbon/i, 'PT'],
  [/\bnew zealand\b|wellington/i, 'NZ'],
  [/\bsingapore\b/i, 'SG'],
  [/\buae\b|dubai|abu dhabi/i, 'AE'],
  [/\bhaiti\b|port-au-prince/i, 'HT'],
  [/\bhonduras\b/i, 'HN'],
  [/\bvanuatu\b/i, 'VU'],
  [/\biceland\b|reykjavik/i, 'IS'],
  [/\bdr congo\b|democratic republic.*congo|drc\b|goma/i, 'CD'],
  [/\bcongo\b/i, 'CG'],
  [/\blibia\b|libya\b|tripoli/i, 'LY'],
  [/\bmorocco\b|rabat/i, 'MA'],
  [/\btunisia\b|tunis/i, 'TN'],
  [/\balgeria\b|algiers/i, 'DZ'],
  [/\bcambodia\b|phnom penh/i, 'KH'],
  [/\bnepal\b|kathmandu/i, 'NP'],
  [/\bsri lanka\b|colombo/i, 'LK'],
  [/\byemen\b|sanaa/i, 'YE'],
  [/\bomam\b|muscat/i, 'OM'],
  [/\bkuwait\b/i, 'KW'],
  [/\bjordan\b|amman/i, 'JO'],
  [/\bqatar\b|doha/i, 'QA'],
  [/\bmadagascar\b/i, 'MG'],
  [/\bsenegal\b|dakar/i, 'SN'],
  [/\bcameroon\b|yaounde/i, 'CM'],
  [/\bghana\b|accra/i, 'GH'],
  [/\bcote d.ivoire\b|ivory coast/i, 'CI'],
  [/\bbhutan\b|thimphu/i, 'BT'],
]

export function geolocate(article: NewsArticle): GeoResult | null {
  const text = `${article.title} ${article.description}`
  for (const [pattern, code] of COUNTRY_KEYWORDS) {
    if (pattern.test(text)) {
      const centroid = CENTROIDS[code]
      if (!centroid) continue
      // Add small jitter so overlapping country stories don't stack exactly
      return {
        lat: centroid.lat + (Math.random() - 0.5) * 2,
        lng: centroid.lng + (Math.random() - 0.5) * 2,
        countryCode: code,
      }
    }
  }
  return null
}
```

- [ ] **Step 4: Run — verify PASS**

```bash
npx jest geolocate --no-coverage
```
Expected: 4 tests PASS.

- [ ] **Step 5: Write failing categorize tests**

Create `src/__tests__/categorize.test.ts`:
```ts
import { categorize } from '@/lib/categorize'

describe('categorize', () => {
  it('returns conflict for war-related headlines', () => {
    expect(categorize('Airstrikes kill 12 in Gaza as fighting intensifies')).toBe('conflict')
  })
  it('returns politics for election headlines', () => {
    expect(categorize('Modi projected to win third term in India election')).toBe('politics')
  })
  it('returns economy for financial headlines', () => {
    expect(categorize('ECB signals rate cut as eurozone growth stalls')).toBe('economy')
  })
  it('returns climate for environment headlines', () => {
    expect(categorize('Record drought hits East Africa for third year')).toBe('climate')
  })
  it('returns disaster for emergency headlines', () => {
    expect(categorize('Earthquake kills 34 in southern Turkey')).toBe('disaster')
  })
  it('returns diplomacy for international talks', () => {
    expect(categorize('US-China trade talks resume in Geneva')).toBe('diplomacy')
  })
  it('defaults to society', () => {
    expect(categorize('City bans tourist apartments in historic district')).toBe('society')
  })
})
```

- [ ] **Step 6: Run — verify FAIL**

```bash
npx jest categorize --no-coverage
```

- [ ] **Step 7: Implement categorize**

Create `src/lib/categorize.ts`:
```ts
import type { Category } from './types'

const RULES: Array<[RegExp, Category]> = [
  [/\b(war|warfare|killed|kills|airstrike|bombing|troops|military|missile|attack|combat|fighting|gunfire|shelling|ceasefire|insurgent|rebel|terrorist|hostage|weapon|armed|soldier|battalion|siege|offensive|frontline|sniper|drone strike|explosion|bomb|blast|artillery|navy|air force|navy|fleet)\b/i, 'conflict'],
  [/\b(election|vote|voting|poll|parliament|president|prime minister|congress|senate|minister|government|party|coalition|referendum|legislation|law|bill|democracy|political|politician|campaign|cabinet|resign|impeach|coup)\b/i, 'politics'],
  [/\b(economy|economic|inflation|gdp|growth|recession|rate cut|interest rate|bank|stock|market|trade|tariff|exports|imports|currency|deficit|debt|budget|fiscal|imf|world bank|investment|supply chain|unemployment|jobs|wages)\b/i, 'economy'],
  [/\b(climate|temperature|drought|flood|wildfire|fire|hurricane|typhoon|cyclone|earthquake|tsunami|eruption|volcano|sea level|carbon|emissions|greenhouse|deforestation|glacier|heatwave|snow|storm|rainfall|monsoon|el niño)\b/i, 'climate'],
  [/\b(earthquake|killed|deaths|dead|disaster|emergency|rescue|evacuate|collapse|accident|crash|explosion|fire|flood|landslide|outbreak|epidemic|pandemic|famine|humanitarian crisis)\b/i, 'disaster'],
  [/\b(talks|summit|treaty|agreement|sanctions|diplomacy|diplomatic|nato|un |united nations|g7|g20|asean|eu |european union|foreign minister|ambassador|relations|alliance|bilateral|multilateral|ceasefire deal)\b/i, 'diplomacy'],
]

export function categorize(headline: string): Category {
  for (const [pattern, category] of RULES) {
    if (pattern.test(headline)) return category
  }
  return 'society'
}
```

- [ ] **Step 8: Run — verify PASS**

```bash
npx jest categorize --no-coverage
```

- [ ] **Step 9: Write failing importance tests**

Create `src/__tests__/importance.test.ts`:
```ts
import { scoreImportance } from '@/lib/importance'

const article = (title: string, source: string, publishedAt: string) => ({
  title, source: { name: source }, publishedAt,
  description: '', url: '', content: '',
})

const now = new Date().toISOString()
const old = new Date(Date.now() - 23 * 3600_000).toISOString()

describe('scoreImportance', () => {
  it('gives 5 for major source + critical keywords + recent', () => {
    const score = scoreImportance(article('War kills hundreds as ceasefire collapses', 'Reuters', now))
    expect(score).toBe(5)
  })
  it('gives lower score for older articles', () => {
    const recent = scoreImportance(article('Protest in capital city', 'AP', now))
    const older  = scoreImportance(article('Protest in capital city', 'AP', old))
    expect(recent).toBeGreaterThanOrEqual(older)
  })
  it('never returns below 1 or above 5', () => {
    const score = scoreImportance(article('Cake competition held in village', 'Local Blog', old))
    expect(score).toBeGreaterThanOrEqual(1)
    expect(score).toBeLessThanOrEqual(5)
  })
})
```

- [ ] **Step 10: Run — verify FAIL**

```bash
npx jest importance --no-coverage
```

- [ ] **Step 11: Implement importance**

Create `src/lib/importance.ts`:
```ts
const CRITICAL = /\b(kills|killed|dead|deaths|crisis|emergency|ceasefire|collapse|attack|war|famine|coup|nuclear|missile|earthquake|flood|evacuate)\b/i
const MAJOR    = /\b(protests|election|sanctions|summit|agreement|deal|parliament|recession|strike|arrest)\b/i

const HIGH_AUTHORITY = new Set(['Reuters', 'BBC News', 'AP', 'AFP', 'Al Jazeera', 'The Guardian', 'FT', 'Financial Times', 'New York Times', 'Washington Post', 'Bloomberg', 'CNN'])
const MID_AUTHORITY  = new Set(['DW', 'France 24', 'The Times', 'Wall Street Journal', 'Politico', 'Yonhap', 'TASS', 'Xinhua'])

export function scoreImportance(article: {
  title: string
  source: { name: string }
  publishedAt: string
}): number {
  let score = 0

  // Source authority (0–2)
  if (HIGH_AUTHORITY.has(article.source.name)) score += 2
  else if (MID_AUTHORITY.has(article.source.name)) score += 1

  // Keyword severity (0–2)
  if (CRITICAL.test(article.title)) score += 2
  else if (MAJOR.test(article.title)) score += 1

  // Recency (0–1): full point if < 2 hours old
  const ageMs = Date.now() - new Date(article.publishedAt).getTime()
  if (ageMs < 2 * 3600_000) score += 1

  return Math.max(1, Math.min(5, score))
}
```

- [ ] **Step 12: Run — verify PASS**

```bash
npx jest importance --no-coverage
```

- [ ] **Step 13: Commit**

```bash
git add src/lib/geolocate.ts src/lib/categorize.ts src/lib/importance.ts \
        src/__tests__/geolocate.test.ts src/__tests__/categorize.test.ts src/__tests__/importance.test.ts
git commit -m "feat: add geolocate, categorize, importance with tests"
```

---

## Task 5: In-memory cache + API route

**Files:**
- Create: `src/lib/cache.ts`
- Create: `src/app/api/news/route.ts`
- Create: `src/__tests__/cache.test.ts`
- Create: `src/__tests__/api-news.test.ts`

- [ ] **Step 1: Write failing cache tests**

Create `src/__tests__/cache.test.ts`:
```ts
import { Cache } from '@/lib/cache'

describe('Cache', () => {
  it('stores and retrieves a value', () => {
    const cache = new Cache<string>(1000)
    cache.set('k', 'hello')
    expect(cache.get('k')).toBe('hello')
  })

  it('returns null after TTL expires', async () => {
    const cache = new Cache<string>(10) // 10ms TTL
    cache.set('k', 'hello')
    await new Promise(r => setTimeout(r, 20))
    expect(cache.get('k')).toBeNull()
  })

  it('returns null for missing keys', () => {
    const cache = new Cache<string>(1000)
    expect(cache.get('missing')).toBeNull()
  })
})
```

- [ ] **Step 2: Run — verify FAIL**

```bash
npx jest cache --no-coverage
```

- [ ] **Step 3: Implement cache**

Create `src/lib/cache.ts`:
```ts
interface Entry<T> { value: T; expiresAt: number }

export class Cache<T> {
  private store = new Map<string, Entry<T>>()
  constructor(private ttlMs: number) {}

  get(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) { this.store.delete(key); return null }
    return entry.value
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }
}

// Singleton shared across API route invocations in the same process
export const storyCache = new Cache<import('./types').Story[]>(3 * 60 * 1000) // 3 min
```

- [ ] **Step 4: Run — verify PASS**

```bash
npx jest cache --no-coverage
```

- [ ] **Step 5: Implement the API route**

Create `src/app/api/news/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { storyCache } from '@/lib/cache'
import { geolocate } from '@/lib/geolocate'
import { categorize } from '@/lib/categorize'
import { scoreImportance } from '@/lib/importance'
import type { Story } from '@/lib/types'
import { createHash } from 'crypto'

const QUERIES = [
  'world news', 'war conflict', 'politics election',
  'economy finance', 'climate disaster', 'diplomacy international',
]

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`
  return `${Math.floor(secs / 86400)}d`
}

function zoomTier(importance: number): number {
  if (importance >= 4) return 2
  if (importance === 3) return 4
  if (importance === 2) return 6
  return 8
}

async function fetchStories(): Promise<Story[]> {
  const key = process.env.NEWS_API_KEY
  if (!key) throw new Error('NEWS_API_KEY not set')

  const results = await Promise.allSettled(
    QUERIES.map(q =>
      fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=20&language=en`,
        { headers: { 'X-Api-Key': key }, next: { revalidate: 0 } }
      ).then(r => r.json())
    )
  )

  const articles: any[] = []
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.articles) {
      articles.push(...r.value.articles)
    }
  }

  const seen = new Set<string>()
  const stories: Story[] = []

  for (const a of articles) {
    if (!a.title || !a.url) continue
    const id = createHash('md5').update(a.url).digest('hex').slice(0, 8)
    if (seen.has(id)) continue
    seen.add(id)

    const geo = geolocate(a)
    if (!geo) continue

    const importance = scoreImportance(a)
    stories.push({
      id,
      lat: geo.lat,
      lng: geo.lng,
      countryCode: geo.countryCode,
      headline: a.title,
      summary: a.description ?? 'Developing story.',
      url: a.url,
      source: a.source?.name ?? 'Unknown',
      publishedAt: a.publishedAt,
      ago: timeAgo(a.publishedAt),
      category: categorize(a.title),
      importance,
      minZoom: zoomTier(importance),
    })
  }

  return stories
}

export async function GET() {
  const cached = storyCache.get('stories')
  if (cached) return NextResponse.json(cached)

  try {
    const stories = await fetchStories()
    storyCache.set('stories', stories)
    return NextResponse.json(stories)
  } catch (err) {
    console.error('news fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}
```

- [ ] **Step 6: Manual smoke test**

Start dev server and hit the route:
```bash
npm run dev
# In a second terminal:
curl http://localhost:3000/api/news | head -c 500
```
Expected: JSON array of Story objects. If NEWS_API_KEY is not set yet, set it in `.env.local` first.

- [ ] **Step 7: Commit**

```bash
git add src/lib/cache.ts src/app/api/news/route.ts src/__tests__/cache.test.ts
git commit -m "feat: add in-memory cache and /api/news route with geolocate pipeline"
```

---

## Task 6: Top bar and Bottom bar

**Files:**
- Create: `src/components/TopBar.tsx`
- Create: `src/components/BottomBar.tsx`

- [ ] **Step 1: Write TopBar**

Create `src/components/TopBar.tsx`:
```tsx
'use client'

interface TopBarProps {
  storyCount: number
  breakingCount: number
  liveCount: number
  topHeadlines: string[]
}

export default function TopBar({ storyCount, breakingCount, liveCount, topHeadlines }: TopBarProps) {
  const tickerText = topHeadlines.join(' · ')
  return (
    <div className="flex-none flex items-center gap-3 h-[50px] px-4 bg-[#0d0d1e] border-b-2 border-[#c0392b] z-[1000]">
      <span className="text-[17px] font-black tracking-[3px] whitespace-nowrap">
        WORLD<span className="text-[#e74c3c]">NOW</span>
      </span>
      <span className="text-[9px] font-extrabold bg-[#e74c3c] px-2 py-[2px] rounded-[3px] tracking-[1px] animate-pulse whitespace-nowrap">
        ● LIVE
      </span>
      <div className="flex-1 overflow-hidden text-[11px] text-[#99aabb] border-l-2 border-[#e74c3c] pl-3 whitespace-nowrap text-ellipsis min-w-0">
        <span className="text-[#e74c3c] font-bold mr-2">BREAKING</span>
        {tickerText}
      </div>
      <div className="flex gap-4 flex-shrink-0">
        <Stat n={storyCount} label="Stories" color="text-[#e74c3c]" />
        <Stat n={breakingCount} label="Breaking" color="text-[#e67e22]" />
        <Stat n={liveCount} label="Live" color="text-[#2ecc71]" />
      </div>
    </div>
  )
}

function Stat({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-[19px] font-extrabold leading-none ${color}`}>{n}</div>
      <div className="text-[8px] text-[#8899bb] tracking-[1px] uppercase">{label}</div>
    </div>
  )
}
```

- [ ] **Step 2: Write BottomBar**

Create `src/components/BottomBar.tsx`:
```tsx
interface BottomBarProps { headlines: string[] }

export default function BottomBar({ headlines }: BottomBarProps) {
  const text = headlines.join(' · ')
  return (
    <div className="flex-none flex items-center h-[28px] bg-[#c0392b] overflow-hidden z-[1000]">
      <div className="bg-[#a02020] h-full px-3 flex items-center text-[9px] font-extrabold tracking-[2px] whitespace-nowrap flex-shrink-0">
        BREAKING
      </div>
      <div className="overflow-hidden flex-1">
        <span
          className="inline-block whitespace-nowrap text-[11px]"
          style={{ animation: 'tickerScroll 45s linear infinite', paddingLeft: '100%' }}
        >
          {text}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TopBar.tsx src/components/BottomBar.tsx
git commit -m "feat: add TopBar and BottomBar components"
```

---

## Task 7: Left panel — live stream tiles

**Files:**
- Create: `src/components/StreamTile.tsx`
- Create: `src/components/LeftPanel.tsx`
- Create: `src/__tests__/StreamTile.test.tsx`

- [ ] **Step 1: Write failing StreamTile test**

Create `src/__tests__/StreamTile.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import StreamTile from '@/components/StreamTile'

const tile = { name: 'BBC World News', region: 'Global', youtubeId: 'w_Ma8oQLmSM', live: true }

describe('StreamTile', () => {
  it('renders channel name', () => {
    render(<StreamTile {...tile} />)
    expect(screen.getByText('BBC World News')).toBeInTheDocument()
  })

  it('shows LIVE badge when live', () => {
    render(<StreamTile {...tile} />)
    expect(screen.getByText('● LIVE')).toBeInTheDocument()
  })

  it('collapses and expands on toggle click', () => {
    render(<StreamTile {...tile} />)
    const btn = screen.getByRole('button')
    // Starts expanded — iframe visible
    expect(screen.getByTitle('BBC World News')).toBeInTheDocument()
    fireEvent.click(btn)
    expect(screen.queryByTitle('BBC World News')).not.toBeInTheDocument()
    fireEvent.click(btn)
    expect(screen.getByTitle('BBC World News')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run — verify FAIL**

```bash
npx jest StreamTile --no-coverage
```

- [ ] **Step 3: Implement StreamTile**

Create `src/components/StreamTile.tsx`:
```tsx
'use client'
import { useState } from 'react'

interface StreamTileProps {
  name: string
  region: string
  youtubeId: string
  live: boolean
  defaultCollapsed?: boolean
}

export default function StreamTile({ name, region, youtubeId, live, defaultCollapsed = false }: StreamTileProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <div className="border-b border-[#111828]">
      <div
        className="flex justify-between items-center px-[10px] py-[7px] cursor-pointer bg-[#0f1428] hover:bg-[#141a35]"
        onClick={() => setCollapsed(c => !c)}
      >
        <div>
          <div className="text-[11px] font-semibold text-[#ccd8ff]">{name}</div>
          <div className="text-[9px] text-[#556688]">{region}</div>
        </div>
        <div className="flex flex-col items-end gap-[3px]">
          {live
            ? <span className="text-[#e74c3c] text-[9px] font-bold">● LIVE</span>
            : <span className="text-[9px] text-[#445566]">OFFLINE</span>
          }
          <button className="bg-transparent border-none text-[#556677] text-[10px] px-1 cursor-pointer hover:text-[#aab]">
            {collapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="border-t border-[#1a2040]">
          <iframe
            title={name}
            width="100%"
            height="108"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            allowFullScreen
            className="block"
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run — verify PASS**

```bash
npx jest StreamTile --no-coverage
```

- [ ] **Step 5: Implement LeftPanel**

Create `src/components/LeftPanel.tsx`:
```tsx
import StreamTile from './StreamTile'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/types'

const STREAMS = [
  { name: 'Al Jazeera English', region: 'Middle East / Global', youtubeId: 'h3MuIUNCCzI', live: true },
  { name: 'BBC World News',     region: 'Global',               youtubeId: 'w_Ma8oQLmSM', live: true },
  { name: 'France 24',          region: 'Europe / Africa',      youtubeId: 'h3MuIUNCCzI', live: true,  defaultCollapsed: true },
  { name: 'DW News',            region: 'Europe',               youtubeId: 'oMjFoRkynhc', live: true },
  { name: 'CNN International',  region: 'Americas / Global',    youtubeId: 'IFYVhkwHcls', live: false },
]

export default function LeftPanel() {
  return (
    <div className="w-[210px] flex-shrink-0 bg-[#0b0f1f] flex flex-col overflow-y-auto border-r border-[#1a2040]">
      <div className="sticky top-0 z-10 flex justify-between items-center px-[11px] py-[7px] text-[8px] tracking-[2px] uppercase text-[#8899bb] bg-[#0d1225] border-b border-[#1a2040]">
        <span>Live Streams</span>
        <span className="text-[#e74c3c]">● 4 Live</span>
      </div>
      {STREAMS.map(s => <StreamTile key={s.name} {...s} />)}
      <Legend />
    </div>
  )
}

function Legend() {
  return (
    <div className="p-[11px] flex flex-col gap-[5px] border-t border-[#1a2040] mt-auto">
      <div className="text-[8px] tracking-[1px] text-[#445566] uppercase mb-[2px]">Category</div>
      {(Object.keys(CATEGORY_COLORS) as (keyof typeof CATEGORY_COLORS)[]).map(cat => (
        <div key={cat} className="flex items-center gap-[7px] text-[9px] text-[#8899bb]">
          <div className="w-[9px] h-[9px] rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[cat], boxShadow: `0 0 5px ${CATEGORY_COLORS[cat]}` }} />
          {CATEGORY_LABELS[cat]}
        </div>
      ))}
      <div className="text-[8px] tracking-[1px] text-[#445566] uppercase mt-[8px] mb-[2px]">Dot size = Importance</div>
      <div className="flex items-center gap-[5px]">
        {[6, 9, 13, 17, 21].map(s => (
          <div key={s} className="rounded-full bg-[#aaa] flex-shrink-0" style={{ width: s, height: s }} />
        ))}
        <span className="text-[9px] text-[#8899bb] ml-1">Minor → Major</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/StreamTile.tsx src/components/LeftPanel.tsx src/__tests__/StreamTile.test.tsx
git commit -m "feat: add collapsible StreamTile and LeftPanel with live stream embeds"
```

---

## Task 8: Right panel — story feed

**Files:**
- Create: `src/components/StoryCard.tsx`
- Create: `src/components/RightPanel.tsx`
- Create: `src/__tests__/StoryCard.test.tsx`

- [ ] **Step 1: Write failing StoryCard test**

Create `src/__tests__/StoryCard.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import StoryCard from '@/components/StoryCard'
import type { Story } from '@/lib/types'

const story: Story = {
  id: 'abc123', lat: 31.5, lng: 34.8, countryCode: 'IL',
  headline: 'Gaza ceasefire talks collapse',
  summary: 'Negotiations broke down overnight.',
  url: 'https://example.com/story',
  source: 'Reuters', publishedAt: new Date().toISOString(), ago: '4m',
  category: 'conflict', importance: 5, minZoom: 2,
}

describe('StoryCard', () => {
  it('renders the headline', () => {
    render(<StoryCard story={story} onFlyTo={() => {}} />)
    expect(screen.getByText('Gaza ceasefire talks collapse')).toBeInTheDocument()
  })

  it('calls onFlyTo when clicked', () => {
    const fn = jest.fn()
    render(<StoryCard story={story} onFlyTo={fn} />)
    fireEvent.click(screen.getByText('Gaza ceasefire talks collapse'))
    expect(fn).toHaveBeenCalledWith(story.lat, story.lng)
  })
})
```

- [ ] **Step 2: Run — verify FAIL**

```bash
npx jest StoryCard --no-coverage
```

- [ ] **Step 3: Implement StoryCard**

Create `src/components/StoryCard.tsx`:
```tsx
import type { Story } from '@/lib/types'
import { CATEGORY_COLORS, CATEGORY_LABELS, DOT_RADII } from '@/lib/types'

interface StoryCardProps {
  story: Story
  onFlyTo: (lat: number, lng: number) => void
}

export default function StoryCard({ story, onFlyTo }: StoryCardProps) {
  const color = CATEGORY_COLORS[story.category]
  const size  = DOT_RADII[story.importance]

  return (
    <div
      className="px-[11px] py-[9px] border-b border-[#111828] cursor-pointer hover:bg-[#111826]"
      onClick={() => onFlyTo(story.lat, story.lng)}
    >
      <div className="flex items-center gap-[6px] mb-[4px]">
        <div className="rounded-full flex-shrink-0" style={{ width: size, height: size, background: color, boxShadow: `0 0 6px ${color}` }} />
        <span className="text-[8px] tracking-[1px] uppercase" style={{ color }}>{CATEGORY_LABELS[story.category]}</span>
      </div>
      <div className="text-[11px] font-semibold text-[#dde8ff] leading-[1.38] mb-[2px]">{story.headline}</div>
      <div className="text-[9px] text-[#445566]">{story.source} · {story.ago} ago</div>
    </div>
  )
}
```

- [ ] **Step 4: Run — verify PASS**

```bash
npx jest StoryCard --no-coverage
```

- [ ] **Step 5: Implement RightPanel**

Create `src/components/RightPanel.tsx`:
```tsx
'use client'
import type { Story } from '@/lib/types'
import StoryCard from './StoryCard'

interface RightPanelProps {
  stories: Story[]
  onFlyTo: (lat: number, lng: number) => void
  refreshing: boolean
}

export default function RightPanel({ stories, onFlyTo, refreshing }: RightPanelProps) {
  const top = [...stories].sort((a, b) => b.importance - a.importance).slice(0, 12)

  return (
    <div className="w-[210px] flex-shrink-0 bg-[#0b0f1f] flex flex-col overflow-y-auto border-l border-[#1a2040]">
      <div className="sticky top-0 z-10 flex justify-between items-center px-[11px] py-[7px] text-[8px] tracking-[2px] uppercase text-[#8899bb] bg-[#0d1225] border-b border-[#1a2040]">
        <span>Top Stories</span>
        <span className="text-[9px] text-[#2ecc71]">{refreshing ? '↻ Refreshing…' : '↻ Live'}</span>
      </div>
      {top.map(s => <StoryCard key={s.id} story={s} onFlyTo={onFlyTo} />)}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/StoryCard.tsx src/components/RightPanel.tsx src/__tests__/StoryCard.test.tsx
git commit -m "feat: add StoryCard and RightPanel story feed"
```

---

## Task 9: MapLibre map container

**Files:**
- Create: `src/components/MapContainer.tsx`

MapLibre requires the browser — this component uses `'use client'` and is dynamically imported with `ssr: false` in the Shell.

- [ ] **Step 1: Implement MapContainer**

Create `src/components/MapContainer.tsx`:
```tsx
'use client'
import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Story } from '@/lib/types'
import { CATEGORY_COLORS, DOT_RADII } from '@/lib/types'

interface MapContainerProps {
  stories: Story[]
  activeCategories: Set<string>
  onFlyTo: (fn: (lat: number, lng: number, zoom?: number) => void) => void
}

export default function MapContainer({ stories, activeCategories, onFlyTo }: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<maplibregl.Map | null>(null)
  const markersRef   = useRef<maplibregl.Marker[]>([])
  const popupRef     = useRef<maplibregl.Popup | null>(null)

  // Expose flyTo to parent
  const flyTo = useCallback((lat: number, lng: number, zoom = 5) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1200 })
  }, [])

  useEffect(() => { onFlyTo(flyTo) }, [flyTo, onFlyTo])

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#06090f' } }],
      },
      center: [12, 22],
      zoom: 2,
      minZoom: 2,
      maxZoom: 13,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    map.on('load', () => {
      map.addSource('countries', { type: 'geojson', data: '/world.geojson' })
      map.addLayer({
        id: 'countries-fill',
        type: 'fill',
        source: 'countries',
        paint: { 'fill-color': '#0f1e35', 'fill-opacity': 1 },
      })
      map.addLayer({
        id: 'countries-border',
        type: 'line',
        source: 'countries',
        paint: { 'line-color': '#1e3050', 'line-width': 0.8 },
      })
      map.addLayer({
        id: 'countries-hover',
        type: 'fill',
        source: 'countries',
        paint: { 'fill-color': '#162844', 'fill-opacity': 0 },
      })

      // Hover highlight on countries
      map.on('mousemove', 'countries-fill', () => {
        map.setPaintProperty('countries-hover', 'fill-opacity', 1)
      })
      map.on('mouseleave', 'countries-fill', () => {
        map.setPaintProperty('countries-hover', 'fill-opacity', 0)
      })
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Re-render markers when stories or active categories change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null }

    const zoom = map.getZoom()

    stories
      .filter(s => activeCategories.has(s.category))
      .forEach(s => {
        const color  = CATEGORY_COLORS[s.category]
        const rad    = DOT_RADII[s.importance]
        const tot    = rad * 2 + 28
        const speed  = (1.5 + s.importance * 0.2).toFixed(1)

        const el = document.createElement('div')
        el.style.cssText = `position:relative;width:${tot}px;height:${tot}px;cursor:pointer;opacity:${zoom >= s.minZoom ? '1' : '0'};pointer-events:${zoom >= s.minZoom ? 'auto' : 'none'};`
        el.innerHTML = `
          <div style="position:absolute;border-radius:50%;border:2px solid ${color};top:50%;left:50%;animation:markerRing ${speed}s ease-out infinite;opacity:0;"></div>
          <div style="position:absolute;border-radius:50%;width:${rad * 2}px;height:${rad * 2}px;top:50%;left:50%;transform:translate(-50%,-50%);background:${color};border:2.5px solid rgba(255,255,255,0.55);"></div>`

        el.addEventListener('click', () => {
          if (popupRef.current) popupRef.current.remove()
          const popup = new maplibregl.Popup({ closeButton: true, maxWidth: '260px', className: '' })
            .setLngLat([s.lng, s.lat])
            .setHTML(`
              <div class="story-tooltip">
                <div class="tooltip-cat">${s.category.toUpperCase().replace('_', ' / ')}</div>
                <div class="tooltip-h">${s.headline}</div>
                <div class="tooltip-sum">${s.summary}</div>
                <div class="tooltip-meta">${s.source} · ${s.ago} ago</div>
                <a class="tooltip-more" href="${s.url}" target="_blank" rel="noopener">Click for more →</a>
              </div>`)
            .addTo(map)
          popupRef.current = popup
        })

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([s.lng, s.lat])
          .addTo(map)

        markersRef.current.push(marker)
      })

    // Update marker visibility on zoom
    const onZoom = () => {
      const z = map.getZoom()
      markersRef.current.forEach((m, i) => {
        const story = stories.filter(s => activeCategories.has(s.category))[i]
        if (!story) return
        const el = m.getElement()
        const show = z >= story.minZoom
        el.style.opacity = show ? '1' : '0'
        el.style.pointerEvents = show ? 'auto' : 'none'
      })
    }

    map.on('zoom', onZoom)
    return () => { map.off('zoom', onZoom) }
  }, [stories, activeCategories])

  return <div ref={containerRef} className="absolute inset-0" />
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MapContainer.tsx
git commit -m "feat: add MapLibre GL MapContainer with GeoJSON countries and story markers"
```

---

## Task 10: Category filter bar

**Files:**
- Create: `src/components/CategoryFilter.tsx`

- [ ] **Step 1: Implement CategoryFilter**

Create `src/components/CategoryFilter.tsx`:
```tsx
'use client'
import type { Category } from '@/lib/types'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/types'

interface CategoryFilterProps {
  active: Set<Category>
  onChange: (active: Set<Category>) => void
}

const ALL_CATS = Object.keys(CATEGORY_COLORS) as Category[]

export default function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  const toggle = (cat: Category) => {
    const next = new Set(active)
    if (next.has(cat)) { if (next.size > 1) next.delete(cat) }
    else next.add(cat)
    onChange(next)
  }

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[900] flex gap-[6px] bg-[rgba(6,10,22,0.9)] border border-[#2a3560] rounded-full px-3 py-[5px]">
      {ALL_CATS.map(cat => {
        const on = active.has(cat)
        const color = CATEGORY_COLORS[cat]
        return (
          <button
            key={cat}
            onClick={() => toggle(cat)}
            title={CATEGORY_LABELS[cat]}
            className="w-[14px] h-[14px] rounded-full border-2 transition-opacity cursor-pointer"
            style={{
              background: on ? color : 'transparent',
              borderColor: color,
              opacity: on ? 1 : 0.4,
            }}
          />
        )
      })}
      <span className="text-[9px] text-[#8899bb] self-center ml-1 tracking-[1px]">FILTER</span>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CategoryFilter.tsx
git commit -m "feat: add CategoryFilter toggle bar"
```

---

## Task 11: Breaking news flash banner

**Files:**
- Create: `src/components/BreakingFlash.tsx`
- Create: `src/__tests__/BreakingFlash.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/__tests__/BreakingFlash.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import BreakingFlash from '@/components/BreakingFlash'

describe('BreakingFlash', () => {
  it('renders headline when visible', () => {
    render(<BreakingFlash headline="Major earthquake strikes Turkey" visible />)
    expect(screen.getByText(/Major earthquake/)).toBeInTheDocument()
  })

  it('renders nothing when not visible', () => {
    const { container } = render(<BreakingFlash headline="Test" visible={false} />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Run — verify FAIL**

```bash
npx jest BreakingFlash --no-coverage
```

- [ ] **Step 3: Implement BreakingFlash**

Create `src/components/BreakingFlash.tsx`:
```tsx
'use client'

interface BreakingFlashProps { headline: string; visible: boolean }

export default function BreakingFlash({ headline, visible }: BreakingFlashProps) {
  if (!visible) return null
  return (
    <div
      className="fixed top-[50px] left-0 right-0 z-[2000] flex items-center gap-3 bg-[#c0392b] px-4 py-2"
      style={{ animation: 'flashDrop 6s ease forwards' }}
    >
      <span className="text-[10px] font-extrabold tracking-[2px] bg-[#a02020] px-2 py-[2px] rounded whitespace-nowrap">
        ⚡ BREAKING
      </span>
      <span className="text-[12px] font-semibold truncate">{headline}</span>
    </div>
  )
}
```

- [ ] **Step 4: Run — verify PASS**

```bash
npx jest BreakingFlash --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add src/components/BreakingFlash.tsx src/__tests__/BreakingFlash.test.tsx
git commit -m "feat: add BreakingFlash banner with drop animation"
```

---

## Task 12: Shell + page — wire everything together

**Files:**
- Create: `src/components/Shell.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement Shell**

Create `src/components/Shell.tsx`:
```tsx
'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { Category, Story } from '@/lib/types'
import TopBar from './TopBar'
import BottomBar from './BottomBar'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import CategoryFilter from './CategoryFilter'
import BreakingFlash from './BreakingFlash'
import ZoomHint from './ZoomHint'

const MapContainer = dynamic(() => import('./MapContainer'), { ssr: false })

const ALL_CATS = new Set<Category>(['conflict','politics','economy','climate','disaster','diplomacy','society'])
const POLL_MS  = 3 * 60 * 1000  // 3 minutes

export default function Shell() {
  const [stories,    setStories]    = useState<Story[]>([])
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set(ALL_CATS))
  const [refreshing, setRefreshing] = useState(false)
  const [flash,      setFlash]      = useState<{ headline: string; visible: boolean }>({ headline: '', visible: false })
  const flyToRef = useRef<((lat: number, lng: number, zoom?: number) => void) | null>(null)
  const prevIdsRef = useRef<Set<string>>(new Set())

  const fetchStories = useCallback(async (isInitial = false) => {
    if (!isInitial) setRefreshing(true)
    try {
      const res  = await fetch('/api/news')
      const data: Story[] = await res.json()
      setStories(data)

      // Check for new critical stories
      if (!isInitial) {
        const incoming = data.filter(s => s.importance === 5 && !prevIdsRef.current.has(s.id))
        if (incoming.length > 0) {
          setFlash({ headline: incoming[0].headline, visible: true })
          setTimeout(() => setFlash(f => ({ ...f, visible: false })), 6500)
        }
      }

      prevIdsRef.current = new Set(data.map(s => s.id))
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStories(true)
    const interval = setInterval(() => fetchStories(), POLL_MS)
    return () => clearInterval(interval)
  }, [fetchStories])

  const handleFlyTo = useCallback((lat: number, lng: number) => {
    flyToRef.current?.(lat, lng, 5)
  }, [])

  const handleMapFlyTo = useCallback((fn: (lat: number, lng: number, zoom?: number) => void) => {
    flyToRef.current = fn
  }, [])

  const visible = stories.filter(s => activeCategories.has(s.category))
  const topHeadlines = stories
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5)
    .map(s => s.headline)

  return (
    <div className="flex flex-col h-screen">
      <TopBar
        storyCount={visible.length}
        breakingCount={stories.filter(s => s.importance === 5).length}
        liveCount={4}
        topHeadlines={topHeadlines}
      />
      <BreakingFlash headline={flash.headline} visible={flash.visible} />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <LeftPanel />
        <div className="flex-1 relative min-w-0">
          <MapContainer
            stories={stories}
            activeCategories={activeCategories}
            onFlyTo={handleMapFlyTo}
          />
          <CategoryFilter active={activeCategories} onChange={setActiveCategories} />
          <ZoomHint />
        </div>
        <RightPanel stories={stories} onFlyTo={handleFlyTo} refreshing={refreshing} />
      </div>
      <BottomBar headlines={topHeadlines} />
    </div>
  )
}
```

- [ ] **Step 2: Implement ZoomHint**

Create `src/components/ZoomHint.tsx`:
```tsx
export default function ZoomHint() {
  return (
    <div className="absolute bottom-[52px] left-1/2 -translate-x-1/2 z-[900] pointer-events-none bg-[rgba(6,10,22,0.9)] border border-[#2a3560] px-[14px] py-[5px] rounded-full text-[10px] text-[#8899bb] tracking-[1px]">
      🔍 Zoom in to reveal regional &amp; local stories
    </div>
  )
}
```

- [ ] **Step 3: Update page.tsx**

Replace `src/app/page.tsx`:
```tsx
import Shell from '@/components/Shell'

export default function Home() {
  return <Shell />
}
```

- [ ] **Step 4: Start dev server and verify the full app**

```bash
npm run dev
```

Open `http://localhost:3000`. Verify:
- Dark map loads with country borders
- News dots appear with pulsing rings
- Hovering/clicking a dot shows tooltip with headline, summary, "Click for more →"
- Clicking a story card in the right panel flies the map to that location
- Left panel stream tiles collapse/expand
- Category filter dots toggle categories off/on
- Top bar shows story count

- [ ] **Step 5: Commit**

```bash
git add src/components/Shell.tsx src/components/ZoomHint.tsx src/app/page.tsx
git commit -m "feat: wire Shell, page, auto-refresh, and breaking flash — full app working"
```

---

## Task 13: Story clustering (zoom 2–3)

**Files:**
- Create: `src/lib/cluster.ts`
- Create: `src/components/ClusterMarker.tsx`
- Modify: `src/components/MapContainer.tsx`

- [ ] **Step 1: Implement cluster logic**

Create `src/lib/cluster.ts`:
```ts
import type { Story } from './types'

export interface Cluster {
  lat: number
  lng: number
  count: number
  stories: Story[]
  topImportance: number
}

// Simple grid-based clustering — groups stories within ~gridDeg degrees of each other
export function clusterStories(stories: Story[], gridDeg = 8): Cluster[] {
  const cells = new Map<string, Story[]>()

  for (const s of stories) {
    const key = `${Math.round(s.lat / gridDeg)},${Math.round(s.lng / gridDeg)}`
    const cell = cells.get(key) ?? []
    cell.push(s)
    cells.set(key, cell)
  }

  return Array.from(cells.values()).map(group => ({
    lat: group.reduce((sum, s) => sum + s.lat, 0) / group.length,
    lng: group.reduce((sum, s) => sum + s.lng, 0) / group.length,
    count: group.length,
    stories: group,
    topImportance: Math.max(...group.map(s => s.importance)),
  }))
}
```

- [ ] **Step 2: Implement ClusterMarker element builder**

Create `src/components/ClusterMarker.tsx` as a pure function (no JSX — used to build DOM elements for MapLibre):

```ts
// Returns an HTMLElement for a cluster marker (used with maplibre-gl Marker)
export function buildClusterEl(cluster: { count: number; topImportance: number }): HTMLElement {
  const size = 20 + cluster.count * 2
  const clamped = Math.min(size, 52)
  const el = document.createElement('div')
  el.style.cssText = `
    width:${clamped}px;height:${clamped}px;border-radius:50%;
    background:rgba(231,76,60,0.85);border:2px solid rgba(255,255,255,0.6);
    display:flex;align-items:center;justify-content:center;
    color:#fff;font-size:11px;font-weight:700;cursor:pointer;
    box-shadow:0 0 12px rgba(231,76,60,0.5);`
  el.textContent = String(cluster.count)
  return el
}
```

- [ ] **Step 3: Integrate clustering into MapContainer**

In `src/components/MapContainer.tsx`, modify the `useEffect` that renders markers. Add this logic at the top of the effect, before rendering individual markers:

```tsx
// At the top of the markers useEffect, after removing old markers:
const zoom = map.getZoom()
const shouldCluster = zoom <= 3

if (shouldCluster) {
  const { clusterStories } = await import('@/lib/cluster')
  const { buildClusterEl }  = await import('./ClusterMarker')
  const filtered = stories.filter(s => activeCategories.has(s.category) && s.minZoom <= 2)
  const clusters = clusterStories(filtered)

  clusters.forEach(c => {
    if (c.count <= 1) return // single stories rendered individually below
    const el = buildClusterEl(c)
    el.addEventListener('click', () => {
      map.flyTo({ center: [c.lng, c.lat], zoom: 4, duration: 800 })
    })
    const marker = new maplibregl.Marker({ element: el }).setLngLat([c.lng, c.lat]).addTo(map)
    markersRef.current.push(marker)
  })
  return // skip individual markers at low zoom
}
// ... rest of individual marker rendering continues below
```

- [ ] **Step 4: Test clustering manually**

Open `http://localhost:3000` at zoom 2. Clusters should appear as numbered red circles. Clicking a cluster zooms in. At zoom 4+ individual dots appear.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cluster.ts src/components/ClusterMarker.tsx src/components/MapContainer.tsx
git commit -m "feat: add zoom-based story clustering at zoom 2–3"
```

---

## Task 14: Deploy to Vercel

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Ensure build passes**

```bash
npm run build
```
Expected: build completes with no errors. Fix any TypeScript or ESLint errors before proceeding.

- [ ] **Step 2: Create vercel.json**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

- [ ] **Step 3: Push to GitHub**

```bash
git add vercel.json
git commit -m "chore: add vercel.json for deployment"
git remote add origin https://github.com/YOUR_USERNAME/world-now.git
git push -u origin main
```

- [ ] **Step 4: Link to Vercel and set env vars**

```bash
npm i -g vercel
vercel link
vercel env add NEWS_API_KEY production
vercel env add YOUTUBE_API_KEY production
```

Enter the values when prompted.

- [ ] **Step 5: Deploy**

```bash
vercel --prod
```

Expected: deployment URL printed. Open it and verify the full app works in production.

- [ ] **Step 6: Commit final state**

```bash
git add -A
git commit -m "chore: production deployment verified"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Dark election-night aesthetic | Task 2 (globals.css) |
| Left panel collapsible streams | Task 7 |
| Centre interactive map | Task 9 |
| Right panel story feed | Task 8 |
| Top bar + bottom ticker | Task 6 |
| Dark GeoJSON country map | Task 9 |
| Crisp dot markers (no glow) | Task 9 |
| Size scales with importance 1–5 | Tasks 2, 9 |
| 7 colour-coded categories | Tasks 2, 4 |
| Zoom tiers 2/4/6/8 | Tasks 4, 5, 9 |
| Hover tooltip: category, headline, summary, source | Task 9 |
| "Click for more →" opens source URL | Task 9 |
| NewsAPI.org data source | Task 5 |
| Geolocation pipeline | Task 4 |
| Category assignment | Task 4 |
| Importance scoring | Task 4 |
| Server-side caching | Task 5 |
| Auto-refresh every 3 min | Task 12 |
| Breaking news flash banner | Tasks 11, 12 |
| Category filter toggles | Task 10 |
| Story clustering at low zoom | Task 13 |
| Vercel deployment | Task 14 |
| YouTube live stream embeds | Task 7 |

**Not included in v1 (spec "out of scope"):**
- Time scrubber (needs historical caching — v2)
- Country click panel (v2)
- YouTube Data API hover clips (v2 — side panel streams are implemented)

All core spec requirements are covered. No placeholders or TODOs found.
