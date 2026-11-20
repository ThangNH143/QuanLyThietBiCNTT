---
name: qltb-react-ui-verify
description: >-
  Use when designing, creating, or modifying React + Vite + TypeScript + Tailwind
  frontend code in client/ (design-system/, shared/, features/), print/QR layouts,
  or running browser visual, RBAC, and offline-LAN verification with screenshots
  for QuanLyThietBiCNTT v3.0 (BVĐKKV Long Khánh UI Kit).
---

# QLTB React SPA, BVĐKKV Long Khánh Design System & Browser Verification (`SOP-C` — v3.0)

> **Reference:** [UI-DESIGN.md](../../../docs/UI-DESIGN.md) and [PROJECT-RULES.md](../../../docs/PROJECT-RULES.md) (Mục 0, 1, 4.2, 5, 10.1, 11.3, 12.1–12.2).

## Nhịp 1 — Inspect Current UI/Design System & Approve Wireframe BEFORE Coding
1. Read `docs/UI-DESIGN.md`, `client/src/design-system/tokens.css`, `HospitalShell.tsx`, shared components (`DataTable`, `FilterCard`, `Modal`, `StatusBadge`, `SearchableSelect`, `RequireRole`), and the target feature in `client/src/features/`.
2. Do NOT alter stable screens outside the requested scope.
3. For any **new screen or major layout/UX change** not yet approved in `docs/UI-DESIGN.md`: draft a text wireframe + 3-role visibility table (`viewer` / `technician` / `admin`) and **STOP for user approval** before writing code.

## Nhịp 2 — 7 Mandatory React & BVĐKKV Long Khánh UI/UX Standards
1. **100% Offline LAN Bundle (`0` CDN & `0` Google Fonts):**
   - Bundle Vietnamese fonts locally (`@fontsource/inter` or `@fontsource/be-vietnam-pro` WOFF2), SVG icons (`lucide-react`), Tailwind CSS, and `qrcode` inside `client/dist/assets/`.
   - **NEVER** put any external CDN or Google Fonts URL in `client/index.html`, CSS, or TSX.
2. **BVĐKKV Long Khánh Visual Identity (`tokens.css` & `design-system/`):**
   - Strictly match the hospital brand tokens: Sidebar `#00548F`, Active pill `rgba(255,255,255,0.16)`, Table Header / Vertical Title Accent Bar / Secondary CTA `#005A9C`, Primary CTA `#0B8A5C`, Danger `#DC2626`, Canvas `#F4F7FA`, Pure White `12px` cards (`#FFFFFF`, border `#E2E8F0`).
   - **Strict Decoupling:** `client/src/design-system/` MUST NEVER import anything from `client/src/features/` so it stays 100% reusable for future Hospital WebApps (e.g., CĐHA/Lâm Sàng/TCKT Reporting, Helpdesk).
3. **Reusable Component Discipline (DRY):**
   - Build every screen with `<HospitalShell>`, `<FilterCard>`, `<DataTable>` (deep-blue uppercase header, sticky header & key/action columns, **viewport-centered empty/loading state** so wide tables never push messages off-screen!), `<Modal>`, `<SearchableSelect>`, `<StatusBadge>`, `<ConfirmDialog>`, `<Toast>`, `<RequireRole>`, `<PrintHeader>`.
   - Centralize API calls, CSRF injection, `credentials: 'include'`, `VITE_BASE_PATH`, and `401/403/409` handling in `client/src/shared/apiClient.ts` + TanStack Query.
4. **TypeScript & Security Hygiene:**
   - `strict: true` — NO lazy `any` or `@ts-ignore`.
   - **NEVER** store auth/session/CSRF tokens in `localStorage` or `sessionStorage`.
   - **NEVER** use `dangerouslySetInnerHTML` with dynamic/DB data.
5. **Smooth UX, Forms & Double-Submit Protection:**
   - Debounce search inputs `300 ms`; reset form state & errors cleanly when opening/closing Modals; disable Save button (`isPending` + spinner) during mutations; attach `Idempotency-Key` header for Bulk CSV Import, Ink Stock Receipts, and Ink Refill Logs.
   - Show `400` validation errors inline per field; show reload prompt on `409 CONCURRENT_MODIFICATION`; format Vietnamese dates (`dd/MM/yyyy`) and currency (`1.500.000 đ`) via `client/src/shared/formatters.ts` with `tabular-nums`.
6. **Visual RBAC (`<RequireRole>`):**
   - Hide unauthorized buttons, tabs, and the `⚙️ Quản trị` menu group completely for `viewer` and `technician` (server enforces RBAC independently).
7. **Responsive, Mobile QR & Print:**
   - Clean layout at Desktop `≥ 1366×768` (collapsible sidebar for wide tables); `/devices?profileId=<id>` must render cleanly on mobile viewports (`390×844`) for LAN QR scanning; Print A4 / 50×30mm QR layouts include `<PrintHeader>` and clean `@media print` CSS.

## Mandatory Build, Audit & Browser Verification
1. Inside `client/`, run `npm run typecheck` (`tsc --noEmit`) and `npm run build` — both MUST exit `0`.
2. Run `node .agents/skills/qltb-task-execution/scripts/self-audit.mjs --files "<changed client files>"` — MUST report `0` findings.
3. Verify live in the browser (via `chrome-devtools` or browser tool against the local DEV build served under `/QuanLyThietBiCNTT/`):
   - **DevTools Console:** `0` JS errors / uncaught rejections.
   - **DevTools Network:** `0` requests to external Internet domains/CDNs/Google Fonts.
   - **3-Role Visual Proof:** capture screenshots as `viewer`, `technician`, and `admin` (full desktop ≥ 1366px, empty & populated table, Modal states, validation errors, mobile QR view when applicable, PDF preview when applicable).
4. Save Phase Gate screenshots in `docs/acceptance/images/phase-<N>/` and embed in `docs/acceptance/PHASE-<N>-REPORT.md`.
5. Sync permanent UI changes back to `docs/UI-DESIGN.md` and `CHANGELOG.md`.
