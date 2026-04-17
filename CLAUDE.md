# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"一起存" (Heal Savings) — a couples' joint savings tracker. Partners create savings plans as grids of cells, fill cells with pledges (承诺书), and track progress together. Unfill requests require partner approval.

## Commands

```bash
# Development (runs both client + server concurrently)
npm run dev

# Development individually
npm run dev:server    # Express on :4000 via tsx watch
npm run dev:client    # Vite dev server on :3000, proxies /api → :4000

# Build
npm run build         # Builds client (tsc + vite) then server (tsc)

# Build individually
npm run build --workspace=client
npm run build --workspace=server
```

No test framework is configured yet. No linting is configured.

## Architecture

Monorepo with npm workspaces: `client/` and `server/`.

### Server (Express + sql.js)

- **Database**: sql.js (SQLite in WASM) — data persisted to `data/heal.sqlite`. The DB module (`server/src/db/`) exports `initDatabase()`, `getDb()`, `saveDb()`, and a `dbHelpers` object with `queryAll`, `queryOne`, `run`, `runReturningId`, `runInTransaction`. Every write immediately calls `saveDb()` (unless inside a transaction).
- **Auth**: JWT-based (`jsonwebtoken`). `server/src/middleware/auth.ts` provides `generateToken`, `authMiddleware`, `getUser`. Token stored in `Authorization: Bearer` header, 30-day expiry. Secret defaults to `'heal-savings-secret-key-change-in-prod'` (override with `JWT_SECRET` env var).
- **Routes**:
  - `/api/auth` — register, login, get current user
  - `/api/partner` — invite/bind partner via 6-char code
  - `/api/plans` — CRUD savings plans + cell fill/unfill-request/unfill-approve + stats
- **Error handling**: Centralized in `server/src/middleware/errorHandler.ts`.
- In production, the server also serves the built client from `client/dist/`.

### Client (React + Vite + Tailwind)

- **Routing**: `react-router-dom` v6. Auth-protected routes wrapped in `ProtectedRoute` + `AppLayout` (sidebar on desktop, bottom tabs on mobile).
- **Auth state**: `useAuth` hook via React Context (`AuthProvider`). Token stored in `localStorage`.
- **API layer**: `client/src/services/api.ts` — thin fetch wrapper auto-injecting JWT. Domain services: `authService.ts`, `savingsService.ts`.
- **Path alias**: `@/` maps to `client/src/`.
- **Styling**: Tailwind with custom theme (pink-warm, mint, warm-yellow, cute font family). Rounded, soft aesthetic.
- **Key pages**: Dashboard (`/`), CreatePlan (`/plan/new`), PlanDetail (`/plan/:id`), Partner (`/partner`).

### Data Model

- **users** — id, username, password_hash, nickname, avatar_emoji, partner_id
- **partnerships** — id, user1_id, user2_id, invite_code, status (pending/active)
- **savings_plans** — id, name, target_amount, cell_count, cell_amount, created_by, partner_id, status (active/completed)
- **savings_cells** — id, plan_id, cell_index, filled_by, pledge_content, status (filled/unfill_pending), unfill flow fields

Cell amount is auto-calculated as `target_amount / cell_count`. Filled cells require a pledge_content (承诺书). Unfill is a two-step: request → partner approves.

## Deployment (PM2)

### Build

```bash
# In project root — builds client first, then server
npm run build
```

Output: `client/dist/` (static files) + `server/dist/` (ESM .js files).

### PM2 Start

```bash
# On the server (e.g. /opt/heal)
pm2 start server/dist/index.js --name heal
```

Key points:
- Node must support ESM (Node 16+). The server uses `"type": "module"` in package.json.
- All relative imports use `.js` extensions (required by ESM resolution). TypeScript `module: "Node16"`, `moduleResolution: "Node16"` enforces this at build time.
- No separate client server needed — Express serves the built frontend from `client/dist/` in production (see `server/src/index.ts`).

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Server listen port |
| `JWT_SECRET` | `heal-savings-secret-key-change-in-prod` | JWT signing key (MUST change in production) |

### Data Persistence

- SQLite file: `data/heal.sqlite` (relative to CWD). Ensure the PM2 CWD is the project root so the DB file is at `/opt/heal/data/heal.sqlite`.
- Every write calls `saveDb()` immediately (except inside transactions), so the file is always up-to-date.
- **Backup**: periodically copy `data/heal.sqlite` (stop the process first for a clean snapshot, or use SQLite `.backup` command).

### PM2 Ecosystem Config (Optional)

Create `ecosystem.config.cjs` at project root:

```js
module.exports = {
  apps: [{
    name: 'heal',
    script: 'server/dist/index.js',
    cwd: '/opt/heal',       // must be project root for DB path
    env: {
      PORT: 4000,
      JWT_SECRET: 'your-production-secret',
    },
  }]
}
```

Then: `pm2 start ecosystem.config.cjs`

### Common Operations

```bash
pm2 logs heal          # View logs
pm2 restart heal       # Restart after rebuild
pm2 stop heal          # Stop
pm2 delete heal        # Remove from PM2
pm2 monit              # CPU/memory monitor
```

After code changes: `npm run build && pm2 restart heal`

## Frontend-Backend Communication

### Development Mode

```
Browser → Vite dev server (:3000) ──proxy /api──→ Express (:4000)
                      ↑                              ↑
           React HMR, static assets           API + DB
```

- Vite dev server runs on port 3000 with HMR.
- `vite.config.ts` proxies all `/api` requests to `http://localhost:4000`.
- No CORS issues because the browser only talks to Vite.

### Production Mode

```
Browser ──→ Express (:4000)
              ├── /api/*     → API routes (auth, partner, plans)
              └── /*         → client/dist/index.html (SPA fallback)
```

- Single origin: Express serves both API and static files.
- `server/src/index.ts`: `express.static(clientDist)` + `app.get('*', ...)` SPA fallback.
- No CORS, no proxy — browser and API share the same host:port.
- Client API base is `/api` (relative path, `client/src/services/api.ts`), works in both dev and prod without changes.

### Auth Flow

1. Client stores JWT in `localStorage` after login/register.
2. Every API request auto-injects `Authorization: Bearer <token>` header via `client/src/services/api.ts`.
3. Server validates token via `authMiddleware` on protected routes.
4. Token expires in 30 days.

## Language

All UI text and server error messages are in **Chinese (简体中文)**.
