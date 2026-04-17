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

## Language

All UI text and server error messages are in **Chinese (简体中文)**.
