# Hookshot — Webhook Delivery Platform

A small webhook delivery backend demonstrating core reliability and safety
patterns used by production systems like Stripe and GitHub: ownership-based
access control, idempotent event ingestion, fixed-window rate limiting, and
cache-aside data access.

## Tech Stack

- Node.js + Express 5
- MongoDB + Mongoose
- JWT-based authentication (access + refresh tokens)
- bcrypt for password hashing

## Setup Instructions

### 1. Prerequisites

- Node.js installed
- MongoDB running locally (or a MongoDB Atlas connection string)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root with the following variables:

```
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/hookshot
JWT_SECRET=your_long_random_secret_here
JWT_REFRESH_SECRET=your_different_long_random_secret_here
```

### 4. Run the server

```bash
npm run dev
```

The server starts on `http://localhost:5001` (or whatever `PORT` you set).
Confirm it's running by visiting:

```
GET http://localhost:5001/api/health
```

### 5. Authenticate before testing protected routes

Every route below marked **Protected** requires a valid access token, sent as:

```
Authorization: Bearer <token>
```

Get a token by signing up and logging in (see API Routes below).

---

## API Routes

### Auth — `/api/auth`

| Method | Route | Protected | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Creates a new user account. Body: `{ email, password }`. |
| POST | `/api/auth/login` | No (rate-limited) | Logs in, returns a JWT access token, and sets an `httpOnly` refresh token cookie. Body: `{ email, password }`. Limited to 5 attempts per IP+email combo per minute. |
| POST | `/api/auth/refresh` | No (requires refresh cookie) | Issues a new access token using the refresh token cookie set at login. |
| POST | `/api/auth/logout` | Yes | Invalidates the current refresh token by incrementing the user's token version, and clears the refresh cookie. |

### Endpoints — `/api/endpoints`

Represents the URLs a user wants to receive webhook events at.

| Method | Route | Protected | Description |
|---|---|---|---|
| POST | `/api/endpoints` | Yes | Creates a new endpoint for the logged-in user. Body: `{ url }`. URL must start with `http://` or `https://`. |
| GET | `/api/endpoints` | Yes | Lists only the logged-in user's own endpoints. |
| PATCH | `/api/endpoints/:id` | Yes | Partially updates an endpoint (`url` and/or `active`). Only succeeds if the endpoint belongs to the logged-in user — otherwise returns `404`. |
| DELETE | `/api/endpoints/:id` | Yes | Deletes an endpoint. Only succeeds if it belongs to the logged-in user — otherwise returns `404`. |

### Events — `/api/events`

Represents incoming webhook events submitted by a user's own backend.

| Method | Route | Protected | Description |
|---|---|---|---|
| POST | `/api/events` | Yes (rate-limited) | Submits a new event. Requires an `Idempotency-Key` header — resending the same key returns the original event (`200`) instead of creating a duplicate (`201`). Automatically records which of the user's *active* endpoints should receive it. Limited to 20 requests per user per minute. |
| GET | `/api/events` | Yes | Returns the logged-in user's latest 50 events, newest first. |

---

## Key Design Notes

- **Ownership checks return `404`, not `403`**, for another user's endpoint — this avoids leaking whether a resource exists at all to someone who doesn't own it.
- **Idempotency** is enforced at the database level via a unique compound index on `{ userId, idempotencyKey }`, not just in application code — this holds correctly even under concurrent/simultaneous duplicate requests.
- **Rate limiting** uses a fixed-window algorithm (an in-memory `Map`, resets completely each window) with different limits per route: login is strict (5/min, guards against password guessing), events are more permissive (20/min, guards against a runaway sender while allowing legitimate bursts).
- **Caching** uses a cache-aside pattern for active-endpoint lookups (5-minute TTL), with explicit invalidation whenever a user's endpoints are created, updated, or deleted — preventing stale data from being served after a change.

## Environment Variables Reference

| Variable | Purpose |
|---|---|
| `PORT` | Port the server listens on |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Signs short-lived (15 min) access tokens |
| `JWT_REFRESH_SECRET` | Signs long-lived (7 day) refresh tokens, stored in an `httpOnly` cookie |