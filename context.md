# NexTrack — Project Context

> **Generated context document.** This file captures the complete architectural, technical, and
> behavioural context of the **NexTrack** repo (folder name `routing`, UI product name "TrackFlow"),
> a high-frequency **traffic routing & S2S affiliate tracking engine** — covering both backend and frontend.

---

## 1. Project Overview

**NexTrack** is an ultra-low-latency (<50 ms) **Traffic Routing & Server-to-Server (S2S) Affiliate
Tracking Engine** in the style of Voluum / RedTrack. It lets affiliates:

- Create **Campaigns**, **Offers** (destination pages), and **Pre-Landers** (pre-landing pages).
- Create **Tracking Links** (`/go/:slug`) that route visitors with weighted A/B split + geo/device rules.
- Generate a unique `click_id` per visit and attach it to the destination URL.
- Attribute conversions via **S2S postback webhooks**, idempotently (no double counting).
- View **real-time analytics** in a React dashboard (clicks, conversions, revenue, geo, device).

Its core engineering goal is a **Dual-Path Architecture** that decouples the ultra-low-latency **hot
redirect path** from **asynchronous database persistence**, targeting **500+ concurrent requests/sec**
while keeping redirects under 50 ms.

The repo has two root folders — `backend/` (Express API + redirect engine) and `frontend/`
(React SPA dashboard) — plus root orchestration scripts, `README.md`, and a `roadmap (3).md`.

---

## 2. Tech Stack

### Backend
- **Runtime:** Node.js (ES Modules, `"type": "module"`)
- **Web framework:** Express 5
- **Database:** MongoDB + Mongoose 9
- **Cache / queue:** Redis via `ioredis`
- **Geolocation:** MaxMind `GeoLite2-Country.mmdb` (binary, in-memory, offline)
- **Device detection:** `ua-parser-js`
- **Auth / security:** `bcrypt`, `jsonwebtoken` (HTTP-only cookie JWT), `cookie-parser`, `cors`
- **IDs:** `nanoid` (16-char click IDs)
- **Config:** `dotenv`

### Frontend
- **Framework:** React 18 + Vite 6
- **Styling:** Tailwind CSS 3 (custom design tokens), PostCSS, Autoprefixer
- **State:** Redux Toolkit (`@reduxjs/toolkit`) + `react-redux`
- **Routing:** `react-router-dom` v6
- **Forms/validation:** `react-hook-form`, `zod`, `@hookform/resolvers`
- **Charts:** `recharts`
- **HTTP:** `axios`
- **Icons/helpers:** `lucide-react`, `clsx`, `tailwind-merge`

---

## 3. Repository / Directory Structure

```
routing/
├── package.json                 # Root orchestration scripts
├── README.md                    # Project doc, setup, endpoints, deployment
├── roadmap (3).md               # Design/development roadmap notes
├── context.md                   # THIS FILE
├── backend/
│   ├── package.json
│   ├── .env.example             # PORT, MONGO_URI, REDIS_URL, JWT_SECRET, POSTBACK_SECRET
│   ├── .gitignore
│   ├── data/
│   │   └── GeoLite2-Country.mmdb  # Offline MaxMind geolocation DB
│   └── src/
│       ├── index.js             # Express app entry + server bootstrap
│       ├── test-e2e.js          # End-to-end pipeline + latency benchmark script
│       ├── config/              # env.js, db.js, redis.js
│       ├── models/              # user, campaign, offer, lander, link, click, conversion
│       ├── middleware/          # auth.middleware.js
│       ├── controllers/         # user, redirect, postback, campaign, offer, lander, link, analytics
│       ├── routes/              # redirect, postback, user, campaign, offer, lander, link, analytics
│       └── services/            # cacheSync.js, batchWorker.js
└── frontend/
    ├── package.json, index.html, vite.config.js, tailwind.config.js, postcss.config.js
    └── src/
        ├── main.jsx, App.jsx, index.css
        ├── services/api.js      # Axios client + API wrappers
        ├── lib/utils.js         # cn() classname helper
        ├── store/               # Redux store + auth/ui slices
        ├── components/
        │   ├── ui/              # Button, Input/Select, Modal, Badge, Table
        │   ├── layout/          # Sidebar, AppNavbar, PublicNavbar, Footer, LogoutModal, ProtectedRoute
        │   └── (*) Legacy tab components (see §10)
        └── pages/               # LandingPage, Login, Register, Dashboard, Campaigns,
                                 # Offers, Landers, OffersLanders, Postback, Links, ReportsLogs
```

---

## 4. Backend — Deep Dive

### 4.1 Entry point — `backend/src/index.js`

Bootstraps the Express app. Order of middleware matters:

1. `config/env.js` validation via `validateEnvironment()`.
2. `cors` (allows any origin, `credentials: true`), `express.json()`, `express.urlencoded()`,
   `cookie-parser`.
3. `app.set('trust proxy', true)` — critical for reading real client IP from `X-Forwarded-For`.
4. Route mounting:
   - `/` → redirect engine (mounts `GET /go/:slug`).
   - `/postback`, `/api/postback`, `/api/rules` → postback router (compatibility aliases).
   - `/api/campaigns`, `/api/offers`, `/api/landers`, `/api/links`, `/api/users`, `/api/analytics`.
5. `GET /health` returns `{ status: 'OK', timestamp, uptime }`.

**Server startup** (`startServer`): validates env → `connectDB()` → `startClickWorker()` →
`app.listen(PORT)`. Graceful shutdown on `SIGINT`/`SIGTERM` stops the click worker and quits Redis.

### 4.2 Configuration (`src/config/`)

- **env.js** — Loads the first existing `.env` found across several candidate paths
  (`backend/.env`, `src/.env`, CWD, `backend/.env`). Provides dev fallbacks for
  `JWT_SECRET`, `POSTBACK_SECRET`, and maps `REDIS_URI`→`REDIS_URL`. `validateEnvironment()`
  only **warns** (does not fail) if `MONGO_URI` is missing.
- **db.js** — `connectDB()` opens a Mongoose connection to `process.env.MONGO_URI`; exits process on error.
- **redis.js** — Singleton `ioredis` client (`redisClient`) using `REDIS_URL`/`REDIS_URI` or
  `redis://127.0.0.1:6379`. Configured with `maxRetriesPerRequest: null` and `enableReadyCheck: false`
  for the async hot path.

### 4.3 Authentication — `src/middlewares/auth.middleware.js`

`authenticate` reads the JWT from the **HTTP-only cookie** (`req.cookies.token`), verifies with
`process.env.JWT_SECRET`, and sets `req.user = { id, email }`. Returns 401 if missing, 403 if invalid/expired.
Applied to all management/analytics routes (`/api/*`), but **not** to the public `/go/:slug`, `/postback`,
or `/health` endpoints.

### 4.4 Data Models (`src/models/`) — MongoDB collections & indexes

| Model | Collection fields | Key indexes / constraints |
|---|---|---|
| **User** | `name`, `email` (unique), `password` (bcrypt hash) | `email` unique |
| **Campaign** | `ownerId` (→User), `name`, `status` (`active\|paused\|archived`) | `ownerId`, `status` |
| **Offer** | `ownerId`, `name`, `url`, `advertiserName`, `payout` (≥0), `currency` | `ownerId` |
| **Lander** | `ownerId`, `name`, `url` | `ownerId` |
| **Link** | `campaignId`, `slug` (unique), `targets[]` | `campaignId`, `slug` unique; targets ≥1 (validation) |
| **Click** | `clickId` (unique), `linkId`, `campaignId`, `targetId`, `offerId`, `ip`, `country`, `device`, `ua`, `timestamp` | `clickId` unique; compound `{campaignId,timestamp}`, `{campaignId,country,device}`; TTL `{timestamp}` 90 days |
| **Conversion** | `clickId` (unique → idempotency), `campaignId`, `offerId`, `linkId`, `payout`, `currency`, `status` (`approved\|pending\|rejected`), `networkName`, `transactionId`, `receivedAt` | `clickId` unique; `{campaignId, createdAt}` |

**Link `targets[]` subdocument** (the routing rules). Each target has:
- `offerId` (required, →Offer)
- `landerId` (optional, →Lander)
- `weight` (0–100, default 100)
- `geo[]` (uppercase ISO 2-letter country codes)
- `device[]` (lowercase `mobile|desktop|tablet`)

A link requires **at least one target**; editing an Offer/Lander/Campaign automatically re-syncs
referencing links in Redis (see §4.8).

### 4.5 The Hot Redirect Path — `src/controllers/redirect.controller.js` (GET `/go/:slug`)

This is the **low-latency hot path** with zero blocking DB work in the request lifecycle.

1. **Load rules from Redis** — `GET link:rules:<slug>`. On a cache miss, falls back to
   `syncLinkBySlugToRedis(slug)` (cache-aside: re-populates from Mongo + Redis).
2. **Guard checks** — 404 if no rules exist or if the resolved `campaignStatus !== 'active'`.
3. **Sync parsing (memory only):**
   - IP from `X-Forwarded-For` first, else `req.socket.remoteAddress`.
   - Device type via `ua-parser-js` (`mobile | tablet | desktop`).
   - Country ISO code via in-memory MaxMind `geoLookup.get(ip)` (returns `UNKNOWN` on failure).
4. **Target selection** (`selectTarget`): filters `targets` by geo & device constraints; falls back to the
   full pool if no target matches; then performs **cumulative weighted random selection** by `weight`.
5. **Click ID + destination**: generates `clickId = nanoid(16)`; `destinationUrl = landerUrl || offerUrl`
   of the chosen target.
6. **Fire-and-forget writes (no await on the DB):**
   - `LPUSH clicks:queue` with the click event JSON.
   - `SETEX click:meta:<clickId>` (30-day TTL) storing `{ linkId, campaignId, offerId }` for fast postbacks.
   - `INCR counter:clicks:<campaignId>:<YYYY-MM-DD>` for live Redis counters.
7. **302 redirect** to `destinationUrl + ('?' or '&') + 'click_id=<clickId>'`.

GeoLite2 is loaded once at module load (async IIFE) from `data/GeoLite2-Country.mmdb` (searches a few
candidate paths).

### 4.6 Cache Synchronization Service — `src/services/cacheSync.js`

Pre-resolves Mongoose links into a **flat JSON routing payload** stored in Redis so the hot path never
does DB queries.

- **resolveLinkRules(link)** → `{ linkId, campaignId, campaignStatus, slug, targets:[{ targetId, weight,
  geo, device, offerId, offerUrl, landerId, landerUrl }] }` (populated from Offer/Lander/Campaign).
- **syncLinkToRedis(linkId)** — fetch + populate + `SET link:rules:<slug>`.
- **syncLinkBySlugToRedis(slug)** — cache-aside fallback used by the redirect engine.
- **syncCampaignLinksToRedis / syncOfferLinksToRedis / syncLanderLinksToRedis** — find all links
  referencing an entity and re-sync them (used by CRUD update/delete to keep cache fresh).

### 4.7 Background Batch Worker — `src/services/batchWorker.js`

- `startClickWorker()` runs a `setInterval` every **200 ms** that pulls up to **500** items from
  `clicks:queue` via `RPOP`, validates each (skips corrupted JSON / missing `clickId`), and flushes them
  to Mongo in one `Click.insertMany(..., { ordered: false })`.
- Duplicate-key errors (code `11000`) are ignored (safe on retries).
- `stopClickWorker()` clears the interval. Started from `index.js` and stopped on graceful shutdown.

### 4.8 Controllers — CRUD & behaviour highlights

- **user.controller.js** — `register` (bcrypt hash 10 rounds, sets cookie), `login` (compare, sets cookie),
  `logout` (clears cookie), `getProfile` (`GET /api/users/me`, returns user minus password).
  JWT cookie options: `httpOnly`, `secure` in production, `sameSite: 'lax'`, **7-day** expiry.
- **campaign.controller.js** — CRUD scoped by `ownerId`. `update` re-syncs campaign links to Redis;
  `delete` purges each link's Redis key and deletes its links.
- **offer.controller.js** — CRUD scoped by `ownerId`. `update`/`delete` call `syncOfferLinksToRedis`.
- **lander.controller.js** — CRUD scoped by `ownerId`. `update`/`delete` call `syncLanderLinksToRedis`.
- **link.controller.js** — CRUD; `create` validates the campaign belongs to the user and calls
  `syncLinkToRedis` (hot-cache prep). `update` purges the old slug key if changed and re-syncs.
  `delete` purges `link:rules:<slug>`.
- **postback.controller.js** — see §5.
- **analytics.controller.js** — see §6.

---

## 5. S2S Postback Attribution — `src/controllers/postback.controller.js`

Routed from `/postback`, `/api/postback`, and `/api/rules` (GET and POST). Handles GET and POST.

- **`getPostbackToken`** (`GET /config/token`) — returns the active `POSTBACK_SECRET` for the frontend simulator.
- **`handlePostback`**:
  1. Merges `req.query` + `req.body` into params; reads `click_id|clickId`, `payout`, `token`,
     `status`, `currency`, `network|networkName`, `txid|transaction_id|transactionId`.
  2. **Security** — if `POSTBACK_SECRET` is set, requires `token` to match exactly (else 401).
  3. Validation — requires `click_id`, and `payout` must be a finite, non-negative number (else 400).
  4. **Metadata resolution** — reads Redis `click:meta:<clickId>`; if expired/missing, falls back to
     `Click.findOne({ clickId })` in Mongo (cold path). 404 if no metadata found.
  5. **Save conversion** — `Conversion.create({ clickId, campaignId, offerId, linkId, payout, currency,
     status, networkName, transactionId, receivedAt })`. The **unique `clickId` index guarantees idempotency**;
     a duplicate raises Mongo `code 11000`, which returns `200` with `"Postback already processed (Idempotent)"`.
  6. **Update live counters** — `INCR counter:conversions:<campaignId>:<date>` and
     `INCRBYFLOAT counter:revenue:<campaignId>:<date>`, `+payout`.

---

## 6. Analytics API — `src/controllers/analytics.controller.js`

All endpoints are authenticated and scoped to the logged-in user's campaign IDs.

| Endpoint | Route | What it returns |
|---|---|---|
| Overview | `GET /api/analytics/overview` | totalClicks, totalConversions, totalRevenue, conversionRate, epc, totalCampaigns, activeCampaigns, totalOffers, totalLanders, totalLinks, todayClicks, todayConversions, todayRevenue |
| Time-series | `GET /api/analytics/timeseries?days=7` | daily `{ date, clicks, conversions, revenue, ctr }` series (fills all days in range) |
| Campaigns | `GET /api/analytics/campaigns` | per-campaign `linkCount, clicks, conversions, revenue, conversionRate, epc` |
| Geo | `GET /api/analytics/geo` | top-20 country breakdown by clicks |
| Device | `GET /api/analytics/device` | clicks grouped by `device` |
| Recent clicks | `GET /api/analytics/clicks?limit=50` | recent clicks (limit capped at 100), populated with campaign/link/offer names |
| Recent conversions | `GET /api/analytics/conversions?limit=50` | recent conversions (limit capped at 100), populated names |

---

## 7. Redis Key Schema

| Key pattern | Type / TTL | Purpose |
|---|---|---|
| `link:rules:<slug>` | String | Flat routing rules payload (hot-path redirect) |
| `clicks:queue` | List | FIFO click queue for the batch worker (`LPUSH` / `RPOP`) |
| `click:meta:<clickId>` | String, 30-day TTL | Click metadata for fast postback attribution |
| `counter:clicks:<campaignId>:<date>` | Counter | Live click count per campaign/day |
| `counter:conversions:<campaignId>:<date>` | Counter | Live conversion count per campaign/day |
| `counter:revenue:<campaignId>:<date>` | Float counter | Live revenue per campaign/day |

*Note: the analytics controllers currently compute most report numbers directly from MongoDB (Click/
Conversion collections); the Redis `counter:*` keys are incremented on the hot path but the dashboard
overview reads Mongo aggregates (`countDocuments` / `$group`), not the Redis counters.*

---

## 8. Frontend — Deep Dive

### 8.1 Entry & routing
- **`src/main.jsx`** — mounts `<App/>` wrapped in Redux `<Provider store={store}>`.
- **`src/App.jsx`** — `BrowserRouter` with:
  - Public: `/` (LandingPage), `/login`, `/register`.
  - Protected (wrapped in `ProtectedRoute`): `/analytics` (DashboardPage), `/campaigns`
    (CampaignsPage), `/offers` (OffersPage), `/landers` (LandersPage), `/postbacks` (PostbackPage).
  - Fallback: `*` → redirect to `/`.
  - On mount it dispatches `checkAuth()` to restore the session from the cookie.

### 8.2 Store — Redux Toolkit
- **`store/index.js`** — `configureStore({ reducer: { auth, ui } })`.
- **`store/slices/authSlice.js`** — thunks `checkAuth`, `loginUser`, `registerUser`, `logoutUser`.
  State: `{ user, loading, submitting, error }`. Uses `rejectWithValue` for error payloads.
- **`store/slices/uiSlice.js`** — UI state `{ isLogoutModalOpen, toast }` with actions
  `openLogoutModal`, `closeLogoutModal`, `showToast`, `clearToast`.

### 8.3 API layer — `src/services/api.js`
Single `axios` instance: `baseURL = '/api'`, `withCredentials: true` (sends HTTP-only cookie), JSON headers.
Exports grouped API objects used by pages:
- `authApi` (login/register/logout/getProfile)
- `campaignApi`, `offerApi`, `landerApi`, `linkApi` (CRUD)
- `analyticsApi` (overview, timeseries, campaigns, geo, device, clicks, conversions)
- `postbackApi` — `simulate(params)` calls `axios.get('/postback', { params })` (the real webhook endpoint,
  proxied in dev); `getToken()` fetches `/api/postback/config/token`.
- Note: `linkApi.getById/update/delete` use `/links/:id` in the wrapper, but the backend `link.route.js`
  actually registers `'/:slug'` for get/put/delete. The two keyed usage (`getLinkById(link._id)`) works
  because the backend resolves `req.params.slug` to `_id` only in the `:slug`-named handler — see §10 caveat.

### 8.4 Layout & reusable components
- **`components/layout/ProtectedRoute.jsx`** — while `loading` shows a spinner; if `!user` → `<Navigate to="/login"/>`; else renders Sidebar + AppNavbar + `<Outlet/>` (page content) + Footer + LogoutModal.
- **`components/layout/Sidebar.jsx`** — grouped nav (Analytics / Tracking / Catalog / Integrations), responsive drawer on mobile, uses `NavLink` for active styling.
- **`components/layout/AppNavbar.jsx`** — sticky header with page title, user avatar + email, and a logout button that opens `LogoutModal`.
- **`components/layout/PublicNavbar.jsx`** — landing-page marketing nav (features/architecture/about/benchmarks anchors); used by the marketing site.
- **`components/layout/LogoutModal.jsx`** — confirm logout → dispatches `logoutUser`, closes modal, navigates to `/login`.
- **`components/layout/Footer.jsx`** — simple footer.
- **`components/ui/`** — `Button` (variants primary/secondary/outline/danger/ghost + sizes, loading spinner), `Input`/`Select` (forwardRef form fields with label/error/helper), `Modal` (Escape-to-close, backdrop, scroll-lock), `Badge` (status pills w/ optional dot), `Table` primitives (`TableContainer`, `Table`, `TableHead`, `TableBody`, `TableRow`, `TableHeader`, `TableCell`).
- **`lib/utils.js`** — `cn(...)` combining `clsx` + `tailwind-merge`.

### 8.5 Pages
- **LandingPage.jsx** — public marketing hero + features + about + CTA.
- **LoginPage / RegisterPage** — `react-hook-form` forms calling `loginUser` / `registerUser`; navigate to `/analytics` on success; clear error on unmount.
- **DashboardPage.jsx** (`/analytics`) — KPIs, time-series area chart (Recharts), geo & device breakdown, recent clicks/conversions feed; **auto-refreshes every 8 s** plus a manual refresh button and time-range selector.
- **CampaignsPage.jsx** (`/campaigns`) — the largest screen: full campaign + tracking-link management.
  Lists campaigns with performance from `analyticsApi.getCampaigns()`; a modal manages campaign info and,
  per link, multi-target routing rules (weight, geo chips, device chips), including **inline quick-create**
  of Offers/Landers. Auto-suggests a random slug (`tr-xxxxxx`). This is where links are created/synced to Redis.
- **OffersPage / LandersPage** — thin wrappers rendering `OffersLandersPage` with `initialTab="offers"|"landers"`.
- **OffersLandersPage.jsx** — tabbed catalog for Offers (name, url, advertiser, payout, currency) and
  Landers (name, url) with CRUD modals and delete confirmation.
- **PostbackPage.jsx** (`/postbacks`) — the **S2S simulator**: fetches recent clicks + the postback token,
  lets you pick a `click_id`, set payout/network/txid/token, dispatch a GET postback, and shows the JSON
  response + latency. Also shows a copy-ready postback URL template.
- **LinksPage.jsx** — a **standalone tracking-link manager** (add/edit/delete links with campaign filter,
  weight + geo/device chips). **Not currently routed from `App.jsx`.**
- **ReportsLogsPage.jsx** — live click/conversion log tables with search and 6-second auto-refresh.
  **Not currently routed from `App.jsx`.**

---

## 9. Styling & Design Tokens (`tailwind.config.js`)

- **Colors** — `primary` (#1E56E0, hover #173F9E, 50/100 tints), `brand` (indigo scale), `surface` (#FFF),
  `page` (#F7F9FC), `border` (#E2E8F0), `ink` (#101828), `muted` (#475467), `success`, `warning`, `danger`,
  and `alice` (custom blue scale).
- **Fonts** — Inter (sans), Space Grotesk (display), IBM Plex Mono (mono).
- **Shadows** — `card`, `card-hover`, `glow`.
- **Font sizes** — custom `sm`→`3xl` scale.
- **`darkMode: 'class'`** (class-based dark mode toggle readiness).
- `index.css` adds Tailwind base layers plus `.table-dense` table styling and custom scrollbars.

---

## 10. Environment Variables & Configuration

Provided by `backend/.env` (see `.env.example`; `src/.env` also exists locally but is git-ignored):

| Variable | Purpose |
|---|---|
| `PORT` | Backend listen port (default `5000`) |
| `MONGO_URI` | MongoDB connection string (required) |
| `REDIS_URL` (or `REDIS_URI`) | Redis connection string (default `redis://127.0.0.1:6379`) |
| `JWT_SECRET` | JWT signing secret (dev fallback provided) |
| `POSTBACK_SECRET` | Shared token for postback webhooks (dev fallback provided) |

Frontend environment: Vite reads `VITE_*` vars (e.g. `VITE_API_URL` for production API base).

---

## 11. NPM Scripts & Commands

Root `package.json` (project name `nextrack-traffic-routing-engine`, v2.0.0):

| Command | What it runs |
|---|---|
| `npm run dev:backend` | `cd backend && nodemon src/index.js` |
| `npm run start:backend` | `cd backend && node src/index.js` |
| `npm run dev:frontend` | `cd frontend && npm run dev` (Vite on port 3000) |
| `npm run build:frontend` | `cd frontend && npm run build` (Vite build → `dist`) |
| `npm run test:e2e` | `cd backend && node src/test-e2e.js` |

**Dev proxy** — `frontend/vite.config.js` proxies `/api`, `/postback`, and `/go` to
`http://localhost:5000`, so the SPA can call the same-relative URLs it uses in production.

**E2E benchmark** (`backend/src/test-e2e.js`) — runs a full pipeline against a live backend
(health → register/login → create campaign/offers/lander/link → 10 redirects measured for latency →
extract `click_id` → dispatch postback → verify idempotency → analytics overview). The README reports
benchmark results: min ~40.2 ms, avg ~48.1 ms (<50 ms constraint), postback 200 OK & idempotent.

---

## 12. Full API Endpoint Reference

**Public / hot-path (no auth):**
| Method | Endpoint | Description |
|---|---|---|
| GET | `/go/:slug` | Fast 302 redirect engine (weighted, geo/device aware) |
| GET/POST | `/postback` (also `/api/postback`, `/api/rules`) | S2S conversion webhook (idempotent) |
| GET | `/health` | Health check |

**Authenticated management & analytics:**
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/register` | Register (sets cookie) |
| POST | `/api/users/login` | Login (sets cookie) |
| POST | `/api/users/logout` | Logout (clears cookie) |
| GET | `/api/users/me` | Current profile |
| GET/POST/PUT/DELETE | `/api/campaigns` | Campaign CRUD + status |
| GET/POST/PUT/DELETE | `/api/offers` | Offer catalog CRUD |
| GET/POST/PUT/DELETE | `/api/landers` | Pre-lander catalog CRUD |
| GET/POST/PUT/DELETE | `/api/links` | Tracking-link CRUD (multi-target rules) |
| GET | `/api/analytics/overview` | Dashboard KPI totals |
| GET | `/api/analytics/timeseries?days=7` | Daily series for charts |
| GET | `/api/analytics/campaigns` | Per-campaign performance |
| GET | `/api/analytics/geo` | Country breakdown |
| GET | `/api/analytics/device` | Device breakdown |
| GET | `/api/analytics/clicks?limit=50` | Recent click stream |
| GET | `/api/analytics/conversions?limit=50` | Recent conversion stream |

---

## 13. Known Caveats / Notes for Maintainers

1. **Legacy, unrouted feature components** — `frontend/src/components/` contains older tab-based
   components (`Dashboard.jsx`, `Campaigns.jsx`, `LinksManager.jsx`, `LiveLogs.jsx`, `OffersLanders.jsx`,
   `PostbackTester.jsx`, `Navbar.jsx `). They are **not imported anywhere** and are superseded by the
   page-based implementation under `src/pages/`. Safe to delete once the pages are confirmed complete.
2. **Unrouted pages** — `LinksPage.jsx` and `ReportsLogsPage.jsx` exist but are not wired into `App.jsx`
   (link/live-log functionality is embedded in `CampaignsPage` and `DashboardPage` respectively).
3. **Link route param mismatch** — backend `link.route.js` uses `:slug` for `get/put/delete` (expecting a
   slug string), while `api.js` wrappers call them with a document `_id`. Works for `getLinkById(link._id)`
   only because Mongoose coerces a valid ObjectId; passing a real slug to the wrapper would not behave
   as documented. Avoid surprising edits here.
4. **HTTP-only JWT in cookie** — the frontend never stores the token; auth state comes from `/api/users/me`.
5. **`trust proxy` is enabled for the redirect engine** — in production make sure the proxy/CDN that
   fronts the app sets `X-Forwarded-For` correctly and that direct exposure is not leaking spoofable IPs   (geo attribution relies on it).
6. **TTL retention** — Clicks auto-expire after 90 days (`expireAfterSeconds: 7776000`); conversion records
   are not TTL-managed and persist.
7. **Redis counters vs Mongo analytics** — live counter keys are incremented but the dashboard overview
   computes from Mongo; the two can drift if you rely on the counter keys for reporting.

---

*End of context document.*