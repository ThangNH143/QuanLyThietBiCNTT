# AGENTS.md — Quy tắc Bắt buộc Tự động Nạp cho Nền tảng `QuanLyThietBiCNTT` (v3.0)

> **Dự án:** Hệ thống Quản lý Thiết bị CNTT (`QuanLyThietBiCNTT`) — Khung Nền tảng WebApp Nội bộ BVĐKKV Long Khánh  
> **Kiến trúc v3.0 (Lộ trình B):** **Backend `server/`** (Node.js ESM · Express 5 Modular REST API Server `/api/v1/core/*` & `/api/v1/itam/*`, sẵn sàng mở rộng đa-WebApp) · **Database** (SQL Server 2019 compat `140`, Stored Procedure trung tâm) · **Frontend `client/`** (React 19 + Vite + TypeScript + Tailwind CSS + BVĐKKV Long Khánh Design System `#00548F`/`#005A9C`/`#0B8A5C`, **100% Offline LAN**, sau IIS ARR sub-path `/QuanLyThietBiCNTT`).  
> **Hiến pháp đầy đủ:** Luôn tuân thủ tuyệt đối `docs/PROJECT-RULES.md`.

---

## 1. Quy tắc Sống còn (KHÔNG BAO GIỜ VI PHẠM)

1. **CẤM SUY ĐOÁN (Zero-Guessing — `PROJECT-RULES.md` Mục 0):**
   - Tuyệt đối không đoán tên bảng, cột, kiểu dữ liệu, SP, tham số `@p...`, thứ tự `recordsets[]`, đường dẫn `/api/v1/*`, key JSON, props component hay quyền RBAC.
   - Trước mọi chỉnh sửa/chẩn đoán, bắt buộc kiểm tra đủ **4 lớp**: **(1) `docs/*.md` → (2) Mã nguồn dọc `server/` & `client/` + tìm kiếm Blast Radius → (3) DB/SP thật (`db/sql/` hoặc `SELECT` chỉ đọc trên DEV) → (4) `client/src/design-system/` & feature UI hiện hữu**.
2. **AN TOÀN PRODUCTION TUYỆT ĐỐI:**
   - **CẤM** chạy bất kỳ lệnh DDL/DML nào lên DB Production (`QuanLyThietBiCNTT`). Mọi migration & kiểm thử chỉ chạy trên `QuanLyThietBiCNTT_DEV` qua `scripts/migrate.js`.
   - **CẤM** sửa file migration `db/sql/migrations/Vnnn__*.sql` đã chạy (bảo toàn SHA-256 `SchemaVersions`).
   - **CẤM** ghi IP thật, mật khẩu, tên login SQL (`sa`...) hay session secret vào code, docs, `.env.example`, `ecosystem.config.cjs`, `CHANGELOG.md` hay log.
3. **NGUỒN SỰ THẬT & DỪNG HỎI:**
   - Về *hiện trạng*: **DB thật / Code thật** > `docs/AS-IS-BASELINE.md` > `project_context.md` (lịch sử).
   - Về *thiết kế đích*: bộ `docs/*.md` v3.0 + `CHANGELOG.md` (`### Decisions`).
   - Gặp mâu thuẫn docs vs code/DB, yêu cầu chưa rõ, thay đổi bố cục UI ngoài `UI-DESIGN.md`, đổi schema có rủi ro dữ liệu, hoặc cần thêm gói npm mới → **DỪNG HỎI CHỦ DỰ ÁN** (trích dẫn `file:dòng` / SP).
4. **KỶ LUẬT 2 NHỊP & CỔNG DUYỆT (`🔒 GATE`):**
   - Chỉ bắt đầu sửa code/DB khi chủ dự án yêu cầu rõ ràng; mỗi lượt chỉ làm **1 Task** (hoặc phạm vi được giao), không sửa lan ngoài phạm vi.
   - Với **thêm chức năng/WebApp mới (`SOP-B`)** hoặc **đổi thiết kế UI/UX (`SOP-C`)**: bắt buộc chạy **Nhịp 1** (khảo sát 4 lớp + đề xuất đặc tả/wireframe → **DỪNG CHỜ DUYỆT**) trước khi sang **Nhịp 2** (code).
   - Xong 1 Phase trong `docs/IMPLEMENTATION-PLAN.md` → xuất `docs/acceptance/PHASE-<N>-REPORT.md` và **DỪNG TẠI `🔒 GATE <N>`**.
5. **KHÔNG BẰNG CHỨNG = CHƯA HOÀN TẤT (`PROJECT-RULES.md` Mục 10 & 13):**
   - Tự rà soát **12 mục Cổng Tự Kiểm tra (`PROJECT-RULES.md` Mục 13)** và chạy `node .agents/skills/qltb-task-execution/scripts/self-audit.mjs` trên các file vừa tạo/sửa.
   - Mọi Task hoàn thành phải có đủ 4 thành phần: (1) File diff, (2) Script + **output kiểm thử nguyên văn** (gồm `typecheck`/`build` nếu chạm `client/`), (3) **Screenshot thật** (nếu có UI/PDF: Desktop ≥ 1366px đúng màu BVĐKKV Long Khánh, 3 role `viewer`/`technician`/`admin`, DevTools Console `0` lỗi & Network `0` CDN ngoài), (4) Bảng `PASS/FAIL`.

---

## 2. Ràng buộc Kỹ thuật Nhanh (v3.0 Platform)

- **Backend `server/` (Express 5 ESM):** bắt buộc đuôi `.js` import nội bộ; `req.validated` (không gán đè `req.query`); wildcard `/*splat`; phân tách cứng `modules/core/` (`/api/v1/core/*`) vs `modules/itam/` (`/api/v1/itam/*`) vs `<future-app>/` (cấm import chéo giữa domain); Cookie SSO `HttpOnly` (`bv_lk.sid`) + `X-CSRF-Token`; cập nhật `server/docs/openapi.yaml`.
- **SQL Server 2019 (compat `140`):** đầu SP có `SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON;`, thân có `SET NOCOUNT ON; SET XACT_ABORT ON;`; lỗi `THROW` `50001/50004/50009/50010`; TVP cho tham số danh sách; không `ON DELETE CASCADE`; không Dynamic SQL; không hard-code `deptId = 295` hay `deviceTypeId = 1` (dùng `SystemSettings` & `isPrinter`); `AuditLogs`/`SystemSettings` có `appCode`.
- **Frontend `client/` (React 19 + Vite + TypeScript + Tailwind):** **0 CDN & 0 Google Fonts** (bundle 100% font WOFF2 + `lucide-react` + `qrcode`); `design-system/` độc lập 100% không import từ `features/`; giữ chuẩn nhận diện BVĐKKV Long Khánh (`#00548F`, `#005A9C`, `#0B8A5C`, `#F4F7FA`, `<HospitalShell>`, `<DataTable>` empty state căn giữa); cấm lưu token trong `localStorage`; cấm `dangerouslySetInnerHTML` với dữ liệu động; ẩn nút bằng `<RequireRole>`.
- **Tài liệu sống:** mọi thay đổi tài liệu/hành vi phải đồng bộ `docs/*.md` và ghi vào `CHANGELOG.md` (`PROJECT-RULES.md` Mục 9).

---

## 3. Bộ 5 Workspace Skills Chuyên biệt (`.agents/skills/`)

Khi thực hiện tác vụ tương ứng, bắt buộc đọc và tuân theo Skill phù hợp:
- **`qltb-task-execution`** — Thực thi từng Task (`T<P>.<N>`) / Phase trong `docs/IMPLEMENTATION-PLAN.md`, chạy `self-audit.mjs` và xuất `PHASE-<N>-REPORT.md`.
- **`qltb-mssql-sp-migration`** — Viết/sửa Migration `Vnnn__*.sql`, SP/View `CREATE OR ALTER`, và SQL Test `ROLLBACK` trên DEV.
- **`qltb-express5-api`** — Viết/sửa `server/` Express 5 Modular API Server (`/api/v1/core/*`, `/api/v1/itam/*`, OpenAPI, PDF/CSV, Session/CSRF, `tests`).
- **`qltb-react-ui-verify`** — Thiết kế/sửa `client/` React/Vite/TS + BVĐKKV Long Khánh Design System (`design-system/`), phân quyền 3 vai trò và kiểm thử trình duyệt + screenshot.
- **`qltb-bugfix-refinement`** — Truy vết lỗi dọc 4 lớp (`SOP-A`) hoặc chỉnh sửa kết quả chưa đúng ý (`SOP-D`) bảo toàn phần đã `PASS`.
