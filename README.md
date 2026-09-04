# World Facts

An immersive, cinema-style journey through the most fascinating places on Earth.

Every screen shows a real photograph of a remarkable place — from ancient stone circles and surreal salt deserts to remote islands and restless volcanoes — paired with a single curious, eerie, or rare fact about it. No maps, no diagrams: just the place itself and the story that makes it worth remembering.

The experience is built as an endless carousel. Use the left and right arrows (or your keyboard's arrow keys) to drift from one wonder to the next, in any direction, forever. Each fact is extracted and curated by an LLM (Google Gemini) from the place's Wikipedia article, so what you read is the most interesting, unusual, or surprising detail — not a dry introduction.

---

## Monorepo layout

This repository contains both the frontend and the backend:

```
world-facts-app/
├── src/                 # Angular frontend (the cinema carousel)
├── public/
│   └── data/places.json # Curated seed catalog of photogenic places
├── backend/             # Node.js + Express API (fact curation service)
│   ├── src/
│   │   ├── config/      # PostgreSQL pool, logger
│   │   ├── middleware/   # rate limiter, auth, metrics, error handling
│   │   ├── services/    # Wikipedia, Gemini, fact orchestration, auth, places
│   │   ├── routes/      # public + admin + metrics + auth endpoints
│   │   └── models/      # shared TypeScript types
│   ├── migrations/       # SQL schema
│   ├── scripts/          # migrate, seed-places, pre-generate-facts
│   └── docker/           # Dockerfile, docker-compose (postgres + nginx + certbot)
├── angular.json
└── README.md
```

---

## How it works

World Facts is a single-page web app (Angular) backed by a small API service. The app never talks to Wikipedia or Gemini directly — it asks its own backend, which does the heavy lifting and caches the result.

### The data flow

```
Angular carousel
   │  GET /api/places/:slug/fact   (x-session-id header)
   ▼
Backend API
   │ 1. DB cache hit?  → return cached fact (milliseconds)
   │ 2. Cache miss:
   │      a. Fetch enriched Wikipedia extract (intro + themed sections)
   │      b. Send it to Gemini with a strict prompt
   │      c. Store the curated fact in PostgreSQL
   ▼
PostgreSQL  ◄── Gemini (Google) + Wikipedia (es.wikipedia.org)
```

### Backend responsibilities

- **Wikipedia extraction** (`services/wikipedia.service.ts`): pulls the article introduction plus themed sections (Curiosidades, Historia, Leyendas, Misterios, …), cleans the text, and caps it so the LLM call stays cheap.
- **Gemini curation** (`services/gemini.service.ts`): an optimized prompt asks for exactly **one** unusual/surprising fact, max **100 words**, JSON-only (`{ "dato_curioso": "..." }`). If Gemini finds nothing or fails, the backend falls back to a keyword-scoring heuristic so the UI never breaks.
- **Caching** (`services/fact.service.ts`): every generated fact is stored in PostgreSQL keyed by place, so each slide is computed at most once. The frontend gets sub-second responses thereafter.
- **Rate limiting** (`middleware/rateLimiter.ts`): per-session counter (configurable window, e.g. 100 requests/hour) defends the API and your Gemini quota.
- **Auth** (`services/auth.service.ts`): admin endpoints are protected with JWT. Log in via `POST /api/auth/login`; manage places with a `Bearer` token.
- **Metrics** (`routes/metrics.routes.ts`): `/api/metrics/summary` and `/api/metrics/recent` report cache-hit rate, Gemini calls, and latency.
- **Endless catalog**: the frontend also grows its list of places from Wikipedia categories on the fly; the backend auto-provisions any unknown slug so the carousel never stops.

### Frontend

- `BackendApiService` requests a curated fact per place slug.
- `FactsService` wraps that with the real photo (Wikimedia Commons, no maps) and prefetches neighbours so navigation feels instant.
- `FactCard` renders the photo full-screen with a readable text bar (no ellipsis); on image failure it shows a moody gradient.

---

## Local development

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # set GEMINI_API_KEY and DB credentials
# have a PostgreSQL instance running, then:
npm run migrate               # create tables + default admin
npm run seed-places          # import public/data/places.json
npm run dev                  # listens on http://localhost:3000
```

Optional: warm the cache so swipes are instant —

```bash
npm run pre-generate-facts
```

Default admin login after migrate: `admin` / `admin123` (change it immediately).

### 2. Frontend

```bash
npm install
ng serve                      # http://localhost:4200
```

The frontend points at `http://localhost:3000/api` in dev (see `src/environments/environment.ts`).

---

## Deployment

- `backend/docker/docker-compose.yml` bundles PostgreSQL, the API, Nginx (SSL) and Certbot (Let's Encrypt).
- Build the API image with `backend/docker/Dockerfile`; for production set `environment.prod.ts` `apiUrl` to your domain.
- CI/CD: see `.github/workflows` (tests/lint/build + deploy).
