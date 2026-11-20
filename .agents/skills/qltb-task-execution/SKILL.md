---
name: qltb-task-execution
description: >-
  Use when executing a planned Task (T<P>.<N>) or Phase (Phase 0..8) from
  docs/IMPLEMENTATION-PLAN.md, running the automated pre-delivery self-audit,
  or producing Task/Phase acceptance evidence reports (docs/acceptance/PHASE-<N>-REPORT.md)
  for QuanLyThietBiCNTT v3.0 (Express 5 Modular API Server + React/Vite SPA).
---

# QLTB Task & Phase Execution (`SOP-0` — v3.0)

> **Reference:** [PROJECT-RULES.md](../../../docs/PROJECT-RULES.md) (Mục 0, 6, 10, 11.0, 12, 13) and [IMPLEMENTATION-PLAN.md](../../../docs/IMPLEMENTATION-PLAN.md).

## Mandatory 6-Step Loop per Task (`T<P>.<N>`)

1. **Scope & Preconditions:**
   - Read the exact Task entry in `docs/IMPLEMENTATION-PLAN.md`.
   - Confirm the previous Task / Gate is `PASS` and confirm all DB work targets `QuanLyThietBiCNTT_DEV` ONLY (NEVER touch Production `QuanLyThietBiCNTT`).
2. **4-Layer Pre-Flight Inspection (Zero-Guessing):**
   - **Layer 1 (Docs):** Read every referenced section in `docs/PRD.md`, `ARCHITECTURE.md`, `DATA-SCHEMA.md`, `API-CONTRACTS.md`, `UI-DESIGN.md`, `AS-IS-BASELINE.md`.
   - **Layer 2 (Code + Blast Radius):** Read the full vertical code path (`server/src/` & `client/src/`) and search callers across the repo (`Select-String` / `grep`) before editing.
   - **Layer 3 (DB / SP):** Read real SQL definitions (`db/sql/migrations/`, `db/sql/procedures/`, `db/sql/baseline/`) or run read-only catalog queries on DEV.
   - **Layer 4 (Design System / UI):** Read `client/src/design-system/tokens.css`, `HospitalShell.tsx`, shared components, and the target feature page.
   - If ANY conflict or ambiguity hits a Stop-and-Ask trigger (`PROJECT-RULES.md` 0.3), **STOP and ask the user** with exact `file:line` and SP citations.
3. **Layered Implementation (Stay Strictly in Scope):**
   - Combine with the specialist skills as needed:
     - DB/SP work → read `qltb-mssql-sp-migration`
     - `server/` Express 5 Modular API work → read `qltb-express5-api`
     - `client/` React/Vite/TS & Design System work → read `qltb-react-ui-verify`
   - Maintain strict module boundaries: `server/src/modules/core/` vs `itam/` (no cross-domain imports), `client/src/design-system/` independent of `features/`.
   - Do not modify files outside the Task's scope or refactor unrelated screens/modules.
4. **Real Testing & Automated Self-Audit:**
   - Run real DB tests (`db/tests/*.test.sql` with `ROLLBACK`), API tests (`node --test`), React checks (`npm run typecheck` & `npm run build` in `client/`), and live Browser verification (if UI/PDF).
   - Run the automated self-audit script on every created/edited file:
     ```powershell
     node .agents/skills/qltb-task-execution/scripts/self-audit.mjs --files "path/to/file1,path/to/file2"
     ```
     Fix any reported failures (leaked secrets/IPs, external CDN / Google Fonts URLs, `localStorage` auth token storage, `dangerouslySetInnerHTML`, `design-system/` importing `features/`, missing `.js` in backend ESM imports).
5. **12-Point Self-Audit (`PROJECT-RULES.md` Mục 13) & Docs Sync:**
   - Verify all 12 items pass.
   - Update `server/docs/openapi.yaml`, affected `docs/*.md` (increment version + date), and `CHANGELOG.md` (`PROJECT-RULES.md` Mục 9) whenever contracts/design/baseline changed.
   - Commit cleanly as `T<ID>: <mô tả>` (when Git commits are used).
6. **Deliver Task Acceptance Evidence (`PROJECT-RULES.md` 10.1):**
   Output all **4 mandatory sections**:
   - **(1) Phạm vi thay đổi:** list of created/edited files (`git status --short` / `git diff --stat`) + commit hash.
   - **(2) Script & Output kiểm thử thật (nguyên văn):** exact commands + verbatim stdout/exit code + `rowCounts` diff (DB) or HTTP code matrix (API) + `typecheck`/`build` (React) + `self-audit.mjs` output.
   - **(3) Hình ảnh minh chứng (Screenshot):** mandatory for UI/PDF/Print tasks (≥ 1366px matching BVĐKKV Long Khánh UI Kit, Modal, 3 roles `viewer`/`technician`/`admin`, DevTools Console `0` errors & Network `0` external CDN).
   - **(4) Bảng Checklist `PASS / FAIL`:** every acceptance criterion from `IMPLEMENTATION-PLAN.md` for this Task.

## Phase Gate Completion (`Phase <N>` → `🔒 GATE <N>`)

When all Tasks in a Phase are complete:
1. Run an integrated **Phase Smoke Test** across the Phase's flows and verify no regression.
2. Capture `rowCounts` before/after on core tables (`NFR-06`).
3. Create **`docs/acceptance/PHASE-<N>-REPORT.md`** with screenshots stored in **`docs/acceptance/images/phase-<N>/`** and embedded directly in the report.
4. Update `docs/AS-IS-BASELINE.md` (if tables/SPs/endpoints/screens changed) and `CHANGELOG.md`.
5. **STOP AT `🔒 GATE <N>`** and ask the user for explicit approval before starting the next Phase.
