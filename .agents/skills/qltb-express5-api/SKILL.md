---
name: qltb-express5-api
description: >-
  Use when creating, modifying, or testing Express 5 ES Module Modular REST API
  Server code in server/ (app.js, server.js, config/, middleware/, shared/,
  modules/core/*, modules/itam/*, modules/<future-app>/*, docs/openapi.yaml,
  tests/) or PDF/CSV/session/IIS configurations for QuanLyThietBiCNTT v3.0.
---

# QLTB Express 5 Modular API Server Guide (v3.0)

> **Reference:** [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md), [API-CONTRACTS.md](../../../docs/API-CONTRACTS.md), and [PROJECT-RULES.md](../../../docs/PROJECT-RULES.md) (Mục 1, 2, 4, 7, 8, 12).

## Mandatory Pre-Edit Inspection
Before writing or modifying ANY file in `server/`:
1. Read `docs/API-CONTRACTS.md` for exact `/api/v1/<domain>/<resource>` path, HTTP method, RBAC roles, request schema, and JSON envelope `{ success, message, data, meta, error }`.
2. Read the real SP definition (`db/sql/procedures/` or DEV catalog) to verify exact `@p...` parameter names, SQL types, and `recordsets[]` order.
3. Read `server/src/app.js`, `server/src/shared/`, and `server/src/modules/core/` so shared services (`apiResponse`, `AppError`, `asyncHandler`, `pagination`, `csv`, `docxReportService`, `auditLogService`, `settingsService`) are reused rather than duplicated.

## Modular Platform & Express 5 Rules
1. **Strict Module Boundaries:**
   - `/api/v1/core/*` (`server/src/modules/core/`): shared platform entities (`auth`, `accounts`, `departments`, `users`, `settings`, `audit-logs`, `health`).
   - `/api/v1/itam/*` (`server/src/modules/itam/`): ITAM domain modules.
   - Future Hospital WebApps (`/api/v1/<appCode>/*`) live in `server/src/modules/<appCode>/`.
   - **NEVER cross-import** between peer domain modules (e.g. `itam/` MUST NOT import from `helpdesk/`); only import from `shared/` and `modules/core/`.
2. **ES Modules (`"type": "module"`):**
   - Always include explicit `.js` extension on relative imports.
   - Export conventions: Routes = `export default router`; single middleware/helper = `export default fn`; Controllers & Services = Named Exports.
   - `__dirname` via `fileURLToPath(import.meta.url)`.
3. **Express 5 Specifics:**
   - `req.query` and `req.params` are read-only getters — NEVER reassign them. Put `zod`-validated values on `req.validated`.
   - Wildcards use `/*splat`; optional params use `{/:id}`.
   - Keep exact middleware order in `server/src/app.js`: `trust proxy` → Helmet (CSP) → Request Logger → CORS (DEV allowlist only) → BasePath Stripper → `express.json()` / `urlencoded` → Session (`MSSQLStore`) → CSRF → `/api/v1/*` routes → API 404 JSON (`/api/*splat`) → Static `client/dist/` → SPA Fallback (`GET /*splat` → `index.html`) → Global `errorHandler`.

## Layering, Security & Shared Services
1. **Routes (`*.routes.js`):** declare static/sub-resource routes (`/dropdown`, `/export`, `/import/*`, `/summary`, `/reports/*`) **BEFORE** `/:id`. Attach `requireAuth`, `requireRole(...)`, `validate(...)`, and wrap handlers with `asyncHandler`.
2. **Validators (`*.validators.js`):** validate every `POST/PUT/PATCH` (and key filter queries) with `zod` into `req.validated`.
3. **Controllers (`*.controller.js`):** thin HTTP coordinators only — NO `try/catch` boilerplate, NO `poolPromise`/`sql`, NO heavy business logic. Return JSON via `apiResponse` or throw `new AppError(message, statusCode, code)`.
4. **Services (`*.service.js`):**
   - Bind every SP param explicitly via `.input('pName', sql.<Type>, value)` and lists via `sql.Table` (TVP).
   - Call `auditLogService.log({ appCode, ... })` on every write action (never fail main flow if audit insert fails; NEVER log passwords, hashes, tokens, or session IDs).
   - Never swallow errors with empty `catch`.
5. **Security & Shared Utilities:**
   - Auth/SSO: Cookie `bv_lk.sid` (`httpOnly`, `sameSite: 'lax'`, `path` from `SESSION_COOKIE_PATH`, `secure` from `COOKIE_SECURE`) + CSRF (`GET /api/v1/core/auth/csrf` + `X-CSRF-Token`), generic login failure message, 15-min lockout after 5 failures, real-IP rate limit, `crypto.scrypt` + `timingSafeEqual`, `req.session.regenerate()`, `mustChangePassword = 1` on new/reset accounts.
   - Support `Idempotency-Key` header on `POST /api/v1/itam/devices/import/commit`, `POST /api/v1/itam/printer-ink/receipts`, and `POST /api/v1/itam/printer-ink/logs`.
   - Config: every new `.env` variable must update `.env.example` (no real secrets), `server/src/config/env.js` (fail-fast), and `docs/ARCHITECTURE.md`.
   - CSV export: always use `server/src/shared/csv.js` (UTF-8 BOM + formula injection guard).
   - PDF export (`server/src/shared/docxReportService.js`): 2-slot LibreOffice queue (max queue 20 → `429`, 60s timeout, 2 fixed profiles, tree kill on hang, `finally` temp cleanup).
   - Error 500: NEVER leak `err.stack` or SQL details.
   - Sync every new/changed endpoint into `server/docs/openapi.yaml`.

## Mandatory Verification Checklist
1. Run `node --test server/tests/<path>.test.js` covering `200/201`, `400`, `401`, `403`, `404`, `409`, `429`.
2. Run `node .agents/skills/qltb-task-execution/scripts/self-audit.mjs --files "<changed files>"` and confirm `0` findings.
3. Paste verbatim stdout into the Task Acceptance Evidence report.
