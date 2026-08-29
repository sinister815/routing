# Traffic Routing & Affiliate Tracking Engine — Roadmap

A high-frequency, ultra-low-latency click routing and S2S conversion tracking platform (Voluum/RedTrack-style), built on MERN + Redis + MaxMind GeoLite2.

---

## 1. System Design & Architecture

### 1.1 High-level architecture

```
                         ┌─────────────────────────────────────────┐
                         │              CLIENT LAYER                │
                         │   React Dashboard (campaigns, reports,   │
                         │   live analytics via Socket.io client)   │
                         └───────────────────┬───────────────────────┘
                                              │ REST API (auth'd)
                                              ▼
                         ┌─────────────────────────────────────────┐
                         │            MANAGEMENT API (Express)       │
                         │  /campaigns  /links  /offers  /reports    │
                         │  /auth       /settings                    │
                         │  Writes campaign/link config → MongoDB    │
                         │  AND pushes routing rules → Redis cache   │
                         └───────────────────┬───────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
            ┌───────────────┐        ┌───────────────┐         ┌───────────────┐
            │   MongoDB      │        │     Redis      │         │  GeoLite2 .mmdb│
            │ (source of     │        │ (hot cache:    │         │ (loaded in-    │
            │  truth: camp-  │        │  routing rules,│         │  process at    │
            │  aigns, links, │        │  counters,     │         │  startup, no   │
            │  clicks history,        │  click queue)  │         │  network call) │
            │  conversions)  │        └───────┬────────┘         └───────┬───────┘
            └───────▲────────┘                │                          │
                    │                          │                          │
                    │                  ┌───────▼──────────────────────────▼──────┐
                    │                  │        REDIRECT ENGINE (Node/Express)    │
                    │  batched async   │  GET /go/:slug                           │
                    │  writes          │  1. Parse IP + User-Agent                │
                    │                  │  2. GeoLite2 lookup (in-memory)          │
                    │                  │  3. Read link rules from Redis           │
                    │                  │  4. Weighted A/B + geo/device match      │
                    │                  │  5. Generate click_id (nanoid)           │
                    │                  │  6. Push click event to Redis queue      │
                    │                  │  7. 302 redirect (<50ms total)           │
                    │                  └───────┬──────────────────────────────────┘
                    │                          │ async, non-blocking
                    │                  ┌───────▼────────┐
                    └──────────────────┤ Background Worker│
                                       │ (BullMQ consumer) │
                                       │ batches clicks →  │
                                       │ writes to MongoDB │
                                       │ + emits Socket.io │
                                       │   event            │
                                       └───────┬────────────┘
                                               │
                                       ┌───────▼────────────┐
                                       │  Socket.io server   │
                                       │  pushes live click/ │
                                       │  conversion events  │
                                       │  to dashboard        │
                                       └─────────────────────┘

External affiliate network's server calls:
  GET/POST https://yourdomain.com/postback?click_id=xxx&payout=5.00
                    │
                    ▼
        Postback handler (Express) → looks up click_id in Redis (fast)
        → falls back to MongoDB if not in cache → writes Conversion doc
        → increments Redis revenue/conversion counters
        → emits Socket.io "conversion" event to dashboard
```

### 1.2 Two independent request paths — the core design principle

**Fast path (hot path)** — must complete in under 50ms, touches only memory:
`Click → parse UA → GeoLite2 lookup → Redis rule lookup → weighted selection → generate click_id → push to Redis queue (fire-and-forget) → 302 redirect`

**Slow path (cold path)** — runs in the background, has no latency budget:
`Redis queue → background worker batches events → write to MongoDB → update Redis counters → emit Socket.io event → dashboard updates live`

Never let the fast path wait on the slow path. This single rule is what makes the <50ms constraint achievable.

### 1.3 Data model (MongoDB collections)

```
User          { _id, email, passwordHash, role, createdAt }

Campaign      { _id, ownerId, name, status, createdAt }

Offer         { _id, ownerId, name, url, advertiserName, payout, currency, createdAt }

Lander        { _id, ownerId, name, url, createdAt }

Link          { _id, campaignId, slug, targets: [
                  { targetId, landerId: <ref Lander | null>, offerId: <ref Offer>,
                    weight, geo: ["IN","US"], device: ["mobile","desktop"] }
                ], createdAt, updatedAt }

Click         { _id, clickId, linkId, campaignId, targetId,
                ip, country, device, browser, ua,
                timestamp }

Conversion    { _id, clickId, payout, currency, status,
                networkName, receivedAt }
```

### 1.4 Redis key structure (cache + queue + counters)

```
link:rules:<slug>        -> JSON (targets array, with landerId/offerId RESOLVED to
                             landerUrl/offerUrl at write-time) — refreshed on campaign/link update
click:meta:<clickId>     -> JSON (linkId, campaignId, targetId) — TTL ~7-30 days, used by postback lookup
queue:clicks             -> Redis Stream or BullMQ queue — raw click events awaiting DB write
counter:clicks:<campId>:<date>       -> INCR per click
counter:conversions:<campId>:<date>  -> INCR per conversion
counter:revenue:<campId>:<date>      -> INCRBYFLOAT per conversion payout
```

> **Important:** `Offer` and `Lander` are normalized, reusable collections — the same offer/lander can be referenced by multiple campaigns/links. The Link schema only stores `landerId`/`offerId` references, never raw URLs. The actual URL lookup (joining `targetId` → `Offer`/`Lander` → `url`) happens **once**, whenever a campaign/link is created or edited, and the *resolved* flat URL is what gets cached into `link:rules:<slug>`. This keeps the hot redirect path free of any extra database joins while still giving you a single source of truth per offer/lander (edit the URL once, update the DB, and just re-push the cache).

### 1.5 Deployment topology

```
                ┌────────────┐
   Internet ──▶ │ Load        │
                │ Balancer /  │
                │ Nginx       │
                └──────┬──────┘
             ┌─────────┼─────────┐
             ▼         ▼         ▼
        Node app  Node app  Node app     (PM2 cluster / Docker replicas,
        instance  instance  instance      one per CPU core, stateless)
             │         │         │
             └─────────┼─────────┘
                        ▼
              Redis (managed, e.g. Redis Cloud / Upstash)
                        │
                        ▼
              MongoDB (managed, e.g. MongoDB Atlas)
```

Tracking domain (redirect engine) and dashboard can be deployed separately if desired — the redirect engine should be lean and deployed close to users (e.g. a VPS or Render/Railway instance with good network performance), while the dashboard API + React app can live on a more general host (Vercel for React, Render/Railway for API).

---

## 2. Phased build plan

### Phase 0 — Environment & foundations (setup only)
- Initialize Git repo, monorepo structure (`/server`, `/client`) or two repos.
- Set up Node + Express skeleton, connect MongoDB (Atlas free tier is fine).
- Set up Redis (local via Docker, or a free Upstash/Redis Cloud instance).
- Set up ESLint/Prettier, `.env` handling, basic logging (`pino` or `winston`).
- **Concepts needed:** Express routing basics, MongoDB/Mongoose schemas, environment variable management, basic Docker (optional but recommended for Redis locally).

### Phase 1 — Auth & core CRUD (no routing logic yet)
- User signup/login (JWT-based auth).
- CRUD APIs: Campaigns, Offers, Landers (each its own collection, reusable across campaigns), and Links (with a `targets` array that *references* `offerId`/`landerId` — never raw URLs).
- Basic React app: login page, campaign list, offers list, landers list, create/edit campaign form (which lets you pick existing offers/landers per target and set weights).
- **Goal:** you can create an offer, a lander, a campaign, and a link with 2 targets (each pointing at an offer/lander pair + a weight) in the DB, viewable in a plain dashboard. No redirect logic yet.
- **Concepts needed:** JWT auth, password hashing (bcrypt), Mongoose schema design (nested arrays + `ObjectId` references, when to embed vs. reference), protected routes (React Router + auth guards), REST API design.

### Phase 2 — Basic redirect engine (correctness first, speed later)
- Build `GET /go/:slug` — reads the link from MongoDB directly (not optimized yet), does weighted random selection among targets, generates a `click_id` (nanoid), writes a `Click` document to MongoDB synchronously, then redirects.
- **Goal:** end-to-end flow works — click the link, land on the right page with `?click_id=...` appended, and see a row appear in your Click collection.
- **Concepts needed:** weighted random selection algorithm, HTTP redirects (302 vs 301 — always use 302 here since destinations change), `nanoid`/UUID generation.

### Phase 3 — Geo & device intelligence
- Integrate `ua-parser-js` to detect device type/browser/OS from the User-Agent header.
- Sign up for a free MaxMind account, download `GeoLite2-Country.mmdb` (or City), load it via the `maxmind` npm package at server startup.
- Extend the redirect logic: filter/prioritize targets by matching `geo` and `device` conditions before applying weights.
- Handle the "behind a proxy/load balancer" IP problem — real client IP usually comes via `X-Forwarded-For` header, not `req.ip`, once you're behind Nginx or a cloud LB.
- **Concepts needed:** HTTP headers and proxies, IP geolocation databases (how `.mmdb` binary lookup works conceptually), User-Agent string parsing, conditional routing logic design.

### Phase 4 — Introduce Redis: the caching layer (this is where <50ms starts becoming real)
- On campaign/link create or update, resolve each target's `offerId`/`landerId` into their actual `url` (a one-time lookup/join against the `Offer`/`Lander` collections), then write the fully-resolved routing rules as JSON into Redis (`link:rules:<slug>`).
- Change the redirect engine to read rules from Redis first; only fall back to MongoDB if Redis misses (and repopulate Redis, re-resolving offer/lander URLs, on a miss).
- Store `click:meta:<clickId>` in Redis so postbacks can be resolved fast without hitting MongoDB.
- **Goal:** redirect handler no longer makes any MongoDB read, join, or lookup on the hot path — it only ever reads one already-flattened JSON blob from Redis.
- **Concepts needed:** Redis data structures (strings, hashes), cache-aside pattern, cache invalidation on updates (re-push the cache whenever an Offer/Lander/Link is edited, not just Links), TTLs.

### Phase 5 — Async click logging (decouple writes from the redirect)
- Instead of writing `Click` documents to MongoDB synchronously inside the redirect handler, push the click event onto a queue (BullMQ backed by Redis, or a Redis Stream) and return the redirect immediately — don't `await` the DB write.
- Build a separate background worker process that consumes the queue, batches events (e.g. every 200ms or every 50 events), and bulk-inserts them into MongoDB (`insertMany`).
- **Goal:** measure actual redirect latency now (see Phase 7) — it should drop dramatically since the DB write is no longer in the critical path.
- **Concepts needed:** message queues, producer/consumer pattern, `async/await` vs fire-and-forget, MongoDB bulk writes, idempotency (avoid double-processing if a job is retried).

### Phase 6 — S2S postback & conversions
- Build `GET|POST /postback` endpoint: accepts `click_id`, `payout`, `status`, etc.
- Look up `click:meta:<clickId>` in Redis; fall back to MongoDB `Click` collection if expired/missing.
- Write a `Conversion` document, increment Redis counters (`counter:conversions:*`, `counter:revenue:*`).
- Add basic security: require a secret token per campaign/network in the postback URL so random people can't fake conversions (e.g. `/postback?click_id=x&payout=5&token=abc`).
- **Concepts needed:** webhook design, idempotency for postbacks (a network might send the same postback twice — dedupe by clickId+status), basic API security (shared secrets), calculating ROI (revenue vs. estimated cost).

### Phase 7 — Real-time dashboard
- Integrate Socket.io: background worker (or the postback handler) emits `click` and `conversion` events after processing.
- React dashboard subscribes and updates live counters/charts without polling.
- Build the Overview page (live clicks, conversions, CTR, revenue), Campaign detail page (breakdowns by geo/device/target), Click logs and Conversion logs tables.
- **Concepts needed:** WebSockets/Socket.io basics, React state management for live-updating data, charting libraries (Recharts/Chart.js), pub/sub pattern (can use Redis Pub/Sub if you run multiple server instances, so all instances know about events regardless of which one handled the click).

### Phase 8 — Load testing & hitting the constraints for real
- Use a load-testing tool (`autocannon`, `k6`, or `artillery`) to simulate 500+ concurrent requests to `/go/:slug` and measure p50/p95/p99 latency.
- Identify and fix bottlenecks (usually: something still synchronous in the hot path, Redis connection pool too small, single Node process not using multiple cores).
- Enable Node `cluster` module or PM2 cluster mode to use multiple CPU cores.
- **Concepts needed:** load testing methodology, percentile latency (p95/p99 matter more than average), Node.js clustering, connection pooling (MongoDB and Redis clients), horizontal scaling basics.

### Phase 9 — Hardening & polish
- Rate limiting on public endpoints (prevent postback spam/abuse) — `express-rate-limit` or a Redis-backed limiter.
- Input validation everywhere (`zod` or `joi`).
- Error handling & logging/monitoring (structured logs, maybe a free tier of a monitoring tool).
- Weekly cron job to refresh the GeoLite2 `.mmdb` file without downtime (load new file into memory, swap the reference).
- Basic tests: unit tests for the weighted-selection logic and geo/device matching (these are pure functions and easy to test), integration test for the full redirect flow.
- **Concepts needed:** rate limiting algorithms (token bucket/sliding window), schema validation libraries, cron jobs in Node (`node-cron`), basic testing (Jest/Vitest).

### Phase 10 — Deployment
- Containerize with Docker (separate images or a docker-compose for redirect engine, worker, dashboard API, React build).
- Deploy MongoDB Atlas (free tier) and a managed Redis (Upstash/Redis Cloud free tier).
- Deploy backend (Render/Railway/a VPS) and frontend (Vercel/Netlify).
- Point a real domain at the redirect engine (e.g. `go.yourdomain.com`) and the dashboard (`app.yourdomain.com`).
- **Concepts needed:** Docker basics, environment-based config for prod vs dev, DNS/domain setup, HTTPS/SSL (usually handled automatically by the host).

---

## 3. Full concept checklist (reference list)

**Backend/Node fundamentals**
- Express routing, middleware, error handling
- Async/await, event loop, why blocking code kills latency
- REST API design, status codes (302 vs 301 for redirects)
- JWT authentication, bcrypt password hashing

**Databases**
- MongoDB/Mongoose: schemas, indexes (index `clickId` and `slug` — you'll query by these constantly), bulk inserts
- Redis: strings, hashes, TTLs, INCR/HINCRBY, Pub/Sub, Streams (or BullMQ)
- Cache-aside pattern and cache invalidation

**Networking & web fundamentals**
- HTTP headers (`User-Agent`, `X-Forwarded-For`)
- IP geolocation via offline databases (MaxMind GeoLite2, `.mmdb` format)
- WebSockets (Socket.io)
- Webhooks (the postback URL concept)

**Concurrency & performance**
- Node.js `cluster` module / PM2 cluster mode
- Message queues, producer/consumer pattern (BullMQ)
- Batching writes vs. per-item writes
- Load testing and reading p95/p99 latency (not just averages)

**Algorithms/logic specific to this project**
- Weighted random selection (for A/B/N split traffic)
- Rule matching/filtering (geo + device conditions)
- Idempotent webhook handling (avoid double-counting conversions)

**Frontend**
- React fundamentals, React Router, protected routes
- State management for live data (Context/Zustand/Redux — pick one)
- Socket.io client, charting (Recharts/Chart.js)

**DevOps/deployment**
- Docker basics, docker-compose
- Environment variables/config per environment
- Basic CI (optional: GitHub Actions to run tests on push)
- Domain/DNS pointing, SSL

**Security basics**
- Rate limiting
- Input validation (`zod`/`joi`)
- Securing the postback endpoint (shared secret/token per network)

---

## 4. Suggested order of learning (if any concept above is new to you)

1. Express + MongoDB CRUD (if shaky) → build Phase 1 comfortably.
2. Redis basics (strings, TTL, INCR) → needed from Phase 4 onward.
3. Node event loop / async patterns → critical before Phase 5, since this is where "don't await the DB write" needs to actually make sense to you, not just be copy-pasted.
4. BullMQ or Redis Streams → needed for Phase 5.
5. Socket.io → needed for Phase 7.
6. Load testing tools (`autocannon`/`k6`) → needed for Phase 8, this is where you *prove* the 50ms constraint rather than assume it.

---

*Tip: build phases 0–3 without worrying about performance at all — get it correct first. Phases 4–5 are where you specifically address the latency/concurrency constraints, and Phase 8 is where you measure and prove you actually met them. Don't optimize before you can measure.*
