---
name: qltb-bugfix-refinement
description: >-
  Use when diagnosing and fixing bugs (SOP-A) or refining previously delivered
  work that does not yet match user expectations (SOP-D) in QuanLyThietBiCNTT v3.0
  (React/Vite SPA + Express 5 Modular API Server + SQL Server 2019).
---

# QLTB Bug-Fix (`SOP-A`) & Refinement (`SOP-D`) Guide (v3.0)

> **Reference:** [PROJECT-RULES.md](../../../docs/PROJECT-RULES.md) (Mục 0, 6, 8, 11.1, 11.4, 13).

## Mode A — Bug-Fix Protocol (`SOP-A`)
1. **Capture Exact Symptoms:** record SPA route/URL, API endpoint, user role, reproduction steps, HTTP status, Console errors, Network payload, and server logs.
2. **Full 4-Layer Vertical Trace (ZERO Guessing):**
   Read directly from top to bottom:
   `client/src/features/<feature>/*` + `design-system/*` + `client/src/shared/apiClient.ts` → `server/src/app.js` → `server/src/modules/<domain>/<feature>/{routes,validators,controller,service}.js` → real Stored Procedure body (`db/sql/procedures/` or read-only `sys.sql_modules` on DEV) → real table data/constraints (read-only `SELECT` on DEV).
3. **Diagnostic Report (Root Cause + Blast Radius):**
   - Cite exact `file:line`, SP name, or SQL constraint causing the defect.
   - Search all callers/components/SPs sharing the affected symbol (`Select-String` / `grep`) to map Blast Radius.
   - If the fix touches DB schema, business rules, `core/`, `design-system/`, or multiple screens → **STOP and present diagnosis for user approval** before editing.
4. **Minimal Root-Level Fix + Regression Test:**
   - Fix the true root cause at the right layer (NEVER patch over an SP/API bug with a client workaround; NEVER swallow errors with empty `catch`; NEVER hide TS errors with `@ts-ignore`).
   - Add at least **1 Regression Test** (`db/tests/*.test.sql` or `server/tests/*.test.js`) reproducing the bug condition so it cannot recur.
5. **Verify & Document:**
   - Run affected tests + `npm run typecheck` / `npm run build` (if touching `client/`) + `node .agents/skills/qltb-task-execution/scripts/self-audit.mjs --files "<changed files>"`.
   - For UI bugs, verify live in browser (Console `0` errors, Network `0` CDN) with Before/After screenshots.
   - Log under `### Fixed` in `CHANGELOG.md` (and sync `docs/` & `server/docs/openapi.yaml` if contract/behavior changed).

## Mode B — Refinement When Output Doesn't Match Expectations (`SOP-D`)
When the user reports that a completed Task/Screen/Feature is not yet as intended:
1. **Re-read Actual Code/DB/UI (Never Rely on Memory):** open the exact files involved and produce a concise 3-column alignment table:
   `| Hiện tại đang thế nào | Chủ dự án yêu cầu thế nào | File / SP / Component gốc cần chỉnh |`
2. **Preserve Already-Passing Work:** NEVER rewrite or break working parts, unrelated modules, or other RBAC roles. Make targeted edits strictly to the delta items.
3. **Check Documentation Impact:** if the refinement changes business rules, API payloads, or UI wireframes compared to earlier docs → update `docs/*.md`, `server/docs/openapi.yaml`, and `CHANGELOG.md` in the same turn.
4. **Regression Test & Before/After Proof:** re-run existing tests + typecheck/build + `self-audit.mjs`, capture Before/After screenshots (for UI/PDF), and present the updated `PASS/FAIL` table.
