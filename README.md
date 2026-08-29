# ⚡ NexTrack — High-Frequency, Ultra-Low Latency Traffic Routing & S2S Affiliate Tracking Engine

NexTrack is a production-grade, high-frequency Traffic Routing and Server-to-Server (S2S) Affiliate Tracking platform built with **Node.js/Express, Redis, MaxMind GeoLite2, MongoDB, and React**.

It is engineered from the ground up around a **Dual-Path Architecture** that decouples the ultra-low latency hot redirect path from asynchronous database persistence, meeting the strict **< 50ms redirect constraint** and high-concurrency demands (500+ simultaneous requests/sec).

---

## 🚀 Key Features & Architectural Compliance

### 1. Ultra-Low Latency Hot Redirect Path (< 50ms)
- **Zero Database Queries on Click**: Pre-resolves campaign/offer/lander routing rules into a flat JSON payload stored in Redis hot cache (`link:rules:<slug>`).
- **In-Memory IP Geolocation**: Binary MaxMind GeoLite2 database (`GeoLite2-Country.mmdb`) is loaded directly into RAM at startup. Zero paid external API calls.
- **Asynchronous Click Ingestion**: Visitor metadata and click events are pushed to a Redis queue (`clicks:queue`) using non-blocking `LPUSH` (fire-and-forget). The HTTP 302 redirect is returned immediately.
- **Background Batch Worker**: An async worker pulls batches of up to 500 clicks from Redis every 200ms and flushes them to MongoDB using `insertMany({ ordered: false })`.

### 2. A/B Split Testing & Smart Traffic Distribution
- **Weighted Percentage Selection**: Distribute traffic dynamically across multiple targets (e.g. 70% to Lander A + Offer 1, 30% to Offer 2 directly).
- **Multi-Constraint Geo & Device Matching**: Evaluates ISO country codes (via offline GeoLite2) and device category (`mobile`, `desktop`, `tablet` via `ua-parser-js`) before applying weighted selection.
- **Normalized Reusable Catalog**: Offers and Pre-Landers are independent entities. Editing an offer or lander automatically re-syncs all referencing tracking links in Redis hot cache.

### 3. Server-to-Server (S2S) Postback & Idempotent Attribution
- **Unique `click_id` Generation**: Generates 16-character alphanumeric identifiers (`nanoid`) attached to outgoing destination URLs (`?click_id=<id>`).
- **30-Day Redis Metadata Cache**: Stores click metadata (`click:meta:<clickId>`) in Redis with automatic TTL for sub-5ms postback resolution, with graceful fallback to MongoDB `Click` collection.
- **Idempotent Webhooks**: MongoDB unique index on `Conversion.clickId` guarantees duplicate network postbacks will not double-count revenue.
- **Live S2S Simulator**: Built-in interactive simulator in the dashboard to test and verify webhook attribution live.

### 4. Modern Real-Time SaaS Analytics Dashboard
- **Live KPI Metrics**: Total Clicks, Conversions, Total Revenue, Conversion Rate (CR%), Earnings Per Click (EPC = Revenue / Clicks).
- **Time-Series Velocity Charts**: Interactive area charts showing daily clicks, conversions, and revenue.
- **Offline Geo Distribution Table**: Real-time country breakdown and percentage share.
- **Device Classification**: Mobile vs Desktop vs Tablet visual split.
- **Live Feed Streams**: Real-time Click Stream and Confirmed Conversions stream.

---

## 🛠️ Tech Stack

- **Backend**: Node.js (ES Modules), Express.js, ioredis, Mongoose, MaxMind (`maxmind` binary reader), `ua-parser-js`, `nanoid`, `bcrypt`, `jsonwebtoken`
- **Caching & Queue**: Redis (Strings, Hash, Lists/Queues, TTLs, Counters)
- **Database**: MongoDB (Mongoose schemas with compound indexes & TTL retention)
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Axios

---

## 📦 Quick Start & Local Setup

### 1. Prerequisites
- Node.js (v18+)
- Redis instance (Local or Redis Cloud / Upstash)
- MongoDB instance (Local or MongoDB Atlas)

### 2. Backend Setup
```bash
cd backend
npm install
```

Configure your `backend/.env` file:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/routing_db
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=your-jwt-secret-key-2026
POSTBACK_SECRET=your-postback-secret-token
```

Start the backend server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser. (Click **1-Click Instant Demo Login** for instant access).

---

## 🧪 Run End-to-End Pipeline & Latency Benchmark

To verify the entire pipeline (Campaign Creation → Tracking Link → <50ms Redirect → Click Queue → S2S Postback → Idempotency → Real-Time Analytics):

```bash
cd backend
node src/test-e2e.js
```

### Benchmark Results:
- **Min Latency**: `40.2 ms`
- **Average Latency**: `48.1 ms` (<50ms constraint verified ✅)
- **Postback Attribution**: `HTTP 200 OK` (Recorded & Idempotent verified ✅)

---

## 📡 API Endpoints Reference

### Public / Hot-Path Endpoints
| Method | Endpoint | Description | Latency |
|---|---|---|---|
| `GET` | `/go/:slug` | High-frequency 302 Redirect Engine | `< 50ms` |
| `GET/POST` | `/postback` | S2S Conversion Postback Webhook | `< 10ms` |
| `GET` | `/health` | System health, Redis & DB status | `< 2ms` |

### Management & Analytics Endpoints (Authenticated)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/users/register` | User registration |
| `POST` | `/api/users/login` | User login (HTTP-only JWT cookie) |
| `GET` | `/api/analytics/overview` | High-level KPIs & today's velocity |
| `GET` | `/api/analytics/timeseries` | Daily clicks, conversions & revenue for charts |
| `GET` | `/api/analytics/campaigns` | Aggregated campaign performance |
| `GET` | `/api/analytics/geo` | Offline GeoLite2 country breakdown |
| `GET` | `/api/analytics/device` | Device type distribution |
| `GET` | `/api/analytics/clicks` | Recent 50 live clicks feed |
| `GET` | `/api/analytics/conversions`| Recent 50 confirmed conversions feed |
| `GET/POST/PUT/DELETE` | `/api/campaigns` | Campaign CRUD & status toggle |
| `GET/POST/PUT/DELETE` | `/api/links` | Tracking link CRUD with multi-target rules |
| `GET/POST/PUT/DELETE` | `/api/offers` | Destination Offer catalog CRUD |
| `GET/POST/PUT/DELETE` | `/api/landers` | Pre-Lander catalog CRUD |

---

## 🌐 Deployment Guidelines

1. **Redirect Engine & Backend API**: Deploy to Render, Railway, DigitalOcean App Platform, or AWS ECS/EC2.
2. **Redis Layer**: Use Redis Cloud or Upstash Redis.
3. **Database**: MongoDB Atlas.
4. **Dashboard Frontend**: Deploy `frontend/` to Vercel, Netlify, Cloudflare Pages, or a separate Render static site with build command `npm run build` and output directory `dist`.
5. **Frontend Environment Variables**:
   - Set `VITE_API_URL=https://<your-backend>.onrender.com`
   - Set `VITE_TRACKING_BASE_URL=https://<your-backend>.onrender.com` when the frontend and backend are on different domains. This ensures copied/tested `/go/:slug` tracking links point at the Express redirect engine instead of the frontend site.
6. **Render Blueprint**:
   - A ready-to-sync Blueprint is included at `render.yaml`
   - It creates:
     - `routing-backend` as a Node web service
     - `routing-frontend` as a static site
   - The frontend Blueprint includes the required SPA rewrite from `/*` to `/index.html`, which fixes refreshes on routes like `/campaigns`
   - Fill these values in Render after syncing the Blueprint:
     - Backend: `MONGO_URI`, `REDIS_URL`, `JWT_SECRET`, `POSTBACK_SECRET`
     - Frontend: `VITE_API_URL`, `VITE_TRACKING_BASE_URL`
