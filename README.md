# 🪝 Hookshot

A webhook event platform built to demonstrate the reliability and safety patterns that production systems like Stripe and GitHub rely on: **ownership-based access control, idempotent event ingestion, fixed-window rate limiting, and cache-aside reads with explicit invalidation.**

Full-stack: an Express + MongoDB API and a React dashboard.

---

## Features

| Pattern | What it does |
|---|---|
| **Ownership checks** | Every endpoint lookup filters on `{ _id, userId }` together. Requesting another user's resource returns `404`, never `403`, so existence is never leaked. |
| **Idempotent events** | A unique compound index on `{ userId, idempotencyKey }` means a retried event returns the original record (`200`) instead of creating a duplicate (`201`). Holds under concurrent requests. |
| **Rate limiting** | Custom fixed-window limiter (in-memory `Map`). Login: 5/min per IP + email. Events: 20/min per user. Over the limit returns `429` with a `Retry-After` header. |
| **Caching** | Active-endpoint lookups use a cache-aside pattern with a 5-minute TTL, cleared immediately when an endpoint is created, updated, or deleted. |
| **Auth** | JWT access tokens (15 min) plus an `httpOnly` refresh-token cookie (7 days), with bcrypt password hashing. |

## Tech Stack

**Backend:** Node.js, Express 5, MongoDB, Mongoose, JWT, bcrypt
**Frontend:** React 18, Vite, React Router, Tailwind CSS v4, shadcn/ui, Sonner, OGL (WebGL background)

---

## Project Structure

```
hookshot/                  # Backend (Express API)
├── config/db.js
├── middleware/authMiddleware.js
├── models/                # User, Endpoint, Event
├── routes/                # auth, endpoints, events
├── utils/endpointHelpers.js
├── rateLimiter.js         # Reusable fixed-window limiter
├── cache.js               # Reusable in-memory TTL cache
├── server.js
└── *-test.js              # Standalone test scripts

hookshot-react/            # Frontend (React dashboard)
└── src/
    ├── api.js             # All backend calls go through here
    ├── context/           # AuthContext, ThemeContext
    ├── components/        # Layout, ProtectedRoute, ui/ (shadcn)
    └── pages/             # Login, Signup, Dashboard, Endpoints, Events, SystemHealth
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

### 1. Backend

```bash
cd hookshot
npm install
```

Create a `.env` file in `hookshot/`:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/hookshot
JWT_SECRET=your_long_random_secret
JWT_REFRESH_SECRET=a_different_long_random_secret
```

Start the server:

```bash
npm run dev
```

Verify it's running: `GET http://localhost:5001/api/health`

### 2. Frontend

```bash
cd hookshot-react
npm install
npm run dev
```

Open **http://localhost:5173**. The frontend expects the API at `http://localhost:5001` (set in `src/api.js`), and the backend's CORS is configured for the Vite dev origin.

---

## API Reference

All routes marked 🔒 require `Authorization: Bearer <access token>`.

### Auth: `/api/auth`

| Method | Route | Description |
|---|---|---|
| POST | `/signup` | Create an account. Body: `{ email, password }` |
| POST | `/login` | Returns an access token and sets the refresh cookie. Rate limited (5/min per IP + email). |
| POST | `/refresh` | Issues a new access token from the refresh cookie. |
| POST 🔒 | `/logout` | Revokes the refresh token and clears the cookie. |

### Endpoints: `/api/endpoints`

| Method | Route | Description |
|---|---|---|
| POST 🔒 | `/` | Create an endpoint. Body: `{ url }` (must start with `http://` or `https://`). |
| GET 🔒 | `/` | List your own endpoints. |
| PATCH 🔒 | `/:id` | Update `url` and/or `active`. `404` if not yours. |
| DELETE 🔒 | `/:id` | Delete an endpoint. `404` if not yours. |

### Events: `/api/events`

| Method | Route | Description |
|---|---|---|
| POST 🔒 | `/` | Submit an event. Requires an `Idempotency-Key` header. Body: `{ type, data }`. Rate limited (20/min per user). |
| GET 🔒 | `/` | Your latest 50 events, newest first. |

### Other

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Health check. |
| GET 🔒 | `/api/debug/cache-stats` | Cache hits/misses and DB read count. Powers the System Health page. |

### Status codes

| Code | When |
|---|---|
| `200` | Successful read/update/delete, or a duplicate event (original returned) |
| `201` | New resource created (user, endpoint, event) |
| `400` | Invalid input: bad URL, missing event type, missing `Idempotency-Key`, malformed ID, failed login |
| `401` | Missing, invalid, or expired token |
| `404` | Endpoint doesn't exist **or belongs to another user** |
| `429` | Rate limit exceeded (includes `Retry-After`) |
| `500` | Unexpected server error |

---

## How It Works

**Sending an event**

```
Client → authMiddleware → rate limiter → field validation
       → getActiveEndpoints(userId) ──► cache hit?  → return cached list
                                    └─► cache miss → query MongoDB, cache for 5 min
       → Event.create()  ──► new key       → 201 + saved event
                         └─► duplicate key → MongoDB error 11000 → 200 + original event
```

**Cache invalidation:** creating, updating, or deleting an endpoint calls `cache.del()` for that user, so the next event always sees fresh data.

**Middleware order matters:** `authMiddleware` must run before the events rate limiter, because the limiter's key is `req.user.id`, which `authMiddleware` attaches.

---

## Dashboard

- **Overview**: endpoint and event counts
- **Endpoints**: add, pause/resume, and delete endpoints
- **Events**: send events, with an optional visible idempotency key and a "resend last event" action that demonstrates duplicate handling
- **System Health**: live cache hit rate, hits, misses, and database reads
- Light/dark theme toggle (login and signup are always dark)

---

## Testing

Standalone scripts in `hookshot/` (the server must be running for the first two):

```bash
node concurrent-test.js        # 10 simultaneous identical events → expect 1×201, 9×200
node event-rate-limit-test.js  # 21 rapid events → expect the 21st to return 429
node test-rate-limiter.js      # Limiter logic only, no server needed
```

Paste a fresh access token into the `TOKEN` constant of the first two scripts (tokens expire after 15 minutes).

**Manual checks worth running**
1. Sign up two accounts, then try to `PATCH`/`DELETE` one user's endpoint ID with the other's token. Expect `404`.
2. Send the same `Idempotency-Key` twice. Expect `201` then `200` with the same `_id`.
3. Send events repeatedly and watch the System Health page: hits climb while DB reads stay flat. Edit an endpoint and DB reads tick up again.

---

## Scope & Limitations

- Hookshot **records which active endpoints an event is addressed to** (`endpointIds`), but does not yet make outbound HTTP calls to those URLs. Delivery with retries would be the natural next step.
- The rate limiter and cache are **in-memory**, so they reset on server restart and aren't shared across multiple server instances. A production deployment would use Redis.
- `/api/debug/cache-stats` exists to power the System Health page. Remove it for a production deployment.

## Security Notes

- Never commit `.env`. It is listed in `.gitignore`.
- Use long, random, distinct values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
