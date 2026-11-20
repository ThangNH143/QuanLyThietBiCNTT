# 6. CHANGELOG.md — Nhật ký Thay đổi Dự án (`QuanLyThietBiCNTT`)

> Mọi thay đổi quan trọng về Cơ sở dữ liệu, Stored Procedure, Kiến trúc Backend, Bảo mật và Giao diện đều được ghi nhận tại đây theo chuẩn [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/).

---

## [3.0.1-plan] — 2026-11-20 (Bổ sung Phụ lục A Hướng dẫn Chọn Model Gemini 4, Lệnh `/` & Mở Chat theo Giai đoạn vào `IMPLEMENTATION-PLAN.md`)

> **Trạng thái:** chỉ cập nhật tài liệu (`docs/IMPLEMENTATION-PLAN.md`, `CHANGELOG.md`); chưa thay đổi DB Production hay source code ứng dụng.

### Docs (nhật ký chỉnh sửa theo `PROJECT-RULES.md` mục 9)
- `IMPLEMENTATION-PLAN.md` v5.0 → v5.1 — **thêm Phụ lục A**: bổ sung bảng chọn Model Gemini 4 (`Argon`, `Neon`, `Hydrogen`, `Orchestrator`, không dùng Carbon), lệnh `/` (`/plan`, `/boost`, `/goal`, `/browser`, `/teamwork`, `/compact`, `/grill-me`, `/learn`) và mẫu câu mở chat nhanh cho từng chặng trong 11 giai đoạn (`Phase 0 → 8`) cùng 4 loại nhiệm vụ ngoài kế hoạch — Lý do: giúp chủ dự án tra cứu nhanh và khởi chạy chính xác khi mở đoạn chat mới cho từng Phase/Task — Ảnh hưởng: toàn bộ quá trình điều phối thi công.
- `CHANGELOG.md` — thêm mục `[3.0.1-plan]` này.

---

## [3.0.0-plan] — 2026-11-20 (Chốt **Lộ trình B**: Chuyển sang Nền tảng Express 5 Modular API Server + ReactJS/Vite/TypeScript SPA 100% Offline LAN & Hệ thống UI/UX Thống nhất BVĐKKV Long Khánh)

> **Trạng thái:** chỉ cập nhật **toàn bộ bộ tài liệu thiết kế (`docs/*.md` v3.0 / v5.0), `AGENTS.md` và bộ 5 Workspace Skills** theo định hướng Lộ trình B của chủ dự án; **chưa thay đổi** DB Production hay source code ứng dụng.

### Decisions (quyết định kiến trúc chiến lược phiên 2026-11-20)
31. **Chốt Lộ trình B — Xây nền tảng WebApp dùng chung cho toàn Bệnh viện ĐKKV Long Khánh:**
    - **Backend (`server/`):** Express 5 Modular REST API Server phân vùng rõ `/api/v1/core/*` (lõi dùng chung đa-WebApp: SSO Auth, Tài khoản, Khoa/Phòng, Nhân sự, `SystemSettings`, `AuditLogs`, `healthz`) và `/api/v1/itam/*` (Quản lý Thiết bị CNTT), sẵn sàng cắm thêm `/api/v1/<future-app>/*` (Báo cáo CĐHA/Lâm sàng/TCKT, Helpdesk, Kho...) mà không đụng mã nguồn cũ; tài liệu hóa bằng `server/docs/openapi.yaml`.
    - **Xác thực & SSO Đa-WebApp:** Dùng Cookie phiên `HttpOnly` (`bv_lk.sid`, lưu SQL Server `dbo.Sessions` + Touch Throttling 5 phút, không cache RAM) + `X-CSRF-Token` (miễn nhiễm XSS `localStorage`, khóa tài khoản có hiệu lực tức thì, hỗ trợ SSO cùng host IIS bằng `SESSION_COOKIE_PATH=/`); kèm Auth Adapter sẵn sàng cho Mobile/External client.
    - **Frontend (`client/`):** React 19 + Vite + TypeScript (`strict: true`) + Tailwind CSS + TanStack Query + React Hook Form + Zod, đóng gói **100% Offline LAN** (tự gói Font tiếng Việt WOFF2 `@fontsource`, `lucide-react`, `qrcode` — 0 CDN/Google Fonts), phục vụ Same-Origin từ `server/` sau IIS ARR dưới `/QuanLyThietBiCNTT`.
    - **Bộ UI/UX Thống nhất Y tế (`client/src/design-system/`):** Tham khảo trực tiếp mẫu WebApp Báo cáo bệnh viện của chủ dự án (`Sổ Chẩn đoán hình ảnh`) kết hợp chuẩn UX y tế hiện đại — Sidebar trái xanh dương y tế `#00548F`, Topbar trắng có gạch dọc nhấn `#005A9C` và nút Đăng xuất đỏ, nút tác vụ chính xanh ngọc `#0B8A5C`, bảng dữ liệu header xanh `#005A9C` chữ trắng in hoa (sticky header/column + **Empty State căn giữa viewport**), tách độc lập 100% khỏi `features/` để tái sử dụng cho mọi WebApp sau này.
    - **Mở rộng CSDL An toàn:** Bổ sung cột `appCode` trên `AuditLogs` (mặc định `'itam'`) và `SystemSettings` (mặc định `'global'`), quy ước WebApp tương lai dùng SQL Schema riêng (vd `helpdesk.*`) và mở rộng phân quyền đa-app bằng `AccountAppRoles` theo mô hình Expand-Contract. Tầng DB/SP Phase 1 vẫn giữ tương thích ngược 100% với bản EJS cũ (`pre-v3.0`).

### Docs & AI Config (nhật ký chỉnh sửa theo `PROJECT-RULES.md` mục 9)
- `PRD.md` v2.6 → v3.0 — mục 1–4: cập nhật bối cảnh nền tảng đa-WebApp Lộ trình B, map lại SPA Route & API Prefix `/api/v1/*`, bổ sung `NFR-10` (khả năng tái sử dụng đa-WebApp) và giữ trọn 100% nghiệp vụ v2.6 — Lý do: đồng bộ định hướng Lộ trình B — Ảnh hưởng: toàn bộ lộ trình.
- `ARCHITECTURE.md` v2.6 → v3.0 — viết lại toàn diện kiến trúc Monorepo `server/` (Express 5 Modular API Server) + `client/` (React/Vite/TS Offline SPA + `design-system/`) + IIS Same-Origin đa-WebApp + hướng dẫn 4 bước cắm thêm WebApp mới — Lý do: thiết kế nền tảng API Server & UI Kit dùng chung — Ảnh hưởng: Phase 2A–8.
- `DATA-SCHEMA.md` v2.6 → v3.0 — mục 0, 2, 3, 4: phân nhóm rõ 7 bảng Core Platform vs 17 bảng ITAM, bổ sung `appCode` trên `AuditLogs` & `SystemSettings`, quy ước tách Schema cho WebApp tương lai — Lý do: sẵn sàng đa-WebApp từ Day 1 mà không làm rối `dbo` — Ảnh hưởng: T1.2, T1.6, T1.14.
- `API-CONTRACTS.md` v2.6 → v3.0 — chuẩn hóa toàn bộ giao ước REST `/api/v1/core/*` & `/api/v1/itam/*`, Envelope JSON chuẩn, luồng SPA CSRF (`/core/auth/csrf`, `/core/auth/me`), OpenAPI 3.1 và hướng dẫn mở rộng API cho WebApp mới — Lý do: chuyển sang API Server độc lập — Ảnh hưởng: Phase 2A–7.
- `UI-DESIGN.md` v2.6 → v3.0 — thiết kế lại hoàn chỉnh **Hệ thống UI/UX Y tế BVĐKKV Long Khánh (`design-system/`)** dựa trên ảnh mẫu WebApp Báo cáo bệnh viện của chủ dự án (`#00548F`, `#005A9C`, `#0B8A5C`, `#F4F7FA`, `<HospitalShell>`, `<FilterCard>`, `<DataTable>` empty state căn giữa, wireframe đầy đủ cho ITAM & hướng dẫn tái sử dụng đa-WebApp) — Lý do: đồng bộ nhận diện bệnh viện cho dự án hiện tại và tương lai — Ảnh hưởng: Phase 2B–7.
- `PROJECT-RULES.md` v2.9 → v3.0 — cập nhật mục 1, 2, 4, 5, 6, 7, 8, 12, 13, 14 cho stack `server/` + `client/` React/TypeScript/Vite (giữ nguyên 100% Hiến pháp Chống Suy Đoán Mục 0, 10 điều cấm, SOP 0/A/B/C/D & Bộ Prompt Mẫu gọi skill v3.0) — Lý do: khớp chuẩn kỹ thuật Lộ trình B — Ảnh hưởng: mọi Task.
- `IMPLEMENTATION-PLAN.md` v4.2 → v5.0 — đồng bộ toàn bộ 11 chặng (`Phase 0 → 8`, tag `pre-v3.0`, nhánh `feature/v3.0`, Phase 2A dựng `server/`, Phase 2B dựng `client/` + BVĐKKV UI Kit, Phase 3–8 hoàn thiện & Cutover) — Lý do: lộ trình thi công chi tiết cho Lộ trình B — Ảnh hưởng: toàn bộ triển khai.
- `AGENTS.md` & `.agents/skills/*` — nâng cấp `AGENTS.md`, `qltb-task-execution` (nâng cấp `self-audit.mjs` quét thêm CDN/Google Fonts, `dangerouslySetInnerHTML`, `localStorage` token, tách biệt `design-system/` vs `features/`), `qltb-mssql-sp-migration`, `qltb-express5-api`, `qltb-bugfix-refinement`, và thay `qltb-offline-ui-verify` bằng `qltb-react-ui-verify`.
- `AS-IS-BASELINE.md` v1.0 → v1.1 — mục 4 (Gap List G1, G7, G8, G10, G14, G16, G17): cập nhật phương án giải quyết khớp Lộ trình B v3.0 (`pre-v3.0`, `server/` `/api/v1/*`, `client/` React/Vite offline) — Lý do: bảo đảm đồng bộ 100% không còn mâu thuẫn giữa Baseline và tài liệu thiết kế v3.0 — Ảnh hưởng: Phase 0–8.
- `CHANGELOG.md` — thêm mục `[3.0.0-plan]` này.

---

## [2.9.0-plan] — 2026-11-20 (Khởi tạo `AGENTS.md`, Bộ 5 Workspace Skills tại `.agents/skills/`, Script `self-audit.mjs` & Cập nhật Bộ Prompt Mẫu Mục 14)

> **Trạng thái:** chỉ thêm file cấu hình AI (`AGENTS.md`, `.agents/skills/*`) và cập nhật tài liệu (`docs/PROJECT-RULES.md`, `CHANGELOG.md`); **chưa thay đổi** DB Production hay source code ứng dụng.

### Added
- `AGENTS.md` (Workspace Rule luôn tự động nạp ở mọi phiên chat mới, ~4 KB < giới hạn 24 KB): khóa cứng Quy tắc Chống Suy Đoán 4 Lớp, cấm đụng DB Production, kỷ luật 2 Nhịp & `🔒 GATE`, ràng buộc kỹ thuật lõi và bảng ánh xạ 5 Workspace Skills.
- Bộ 5 Workspace Skills trong `.agents/skills/`:
  - `qltb-task-execution` (kèm script kiểm tra tự động `scripts/self-audit.mjs` quét bí mật/IP thật, link CDN ngoài, inline `onclick=`, nạp trùng Bootstrap/jQuery ở view con, thiếu đuôi `.js` ESM).
  - `qltb-mssql-sp-migration` (chuẩn SQL Server 2019 compat `140`, guard `_DEV`, migration idempotent bất biến, khuôn đầu SP, TVP, `THROW`, `rowVersion`, test `ROLLBACK`).
  - `qltb-express5-api` (chuẩn ES Modules, Express 5 `req.validated`/`/*splat`, layering, route REST+legacy G1, `zod`, RBAC, CSRF, `auditLogService`, LibreOffice queue, CSV an toàn).
  - `qltb-offline-ui-verify` (chuẩn 2 Nhịp `SOP-C`, 100% `public/vendor/`, `AppCore`, Select2 `dropdownParent`, ẩn nút 3 vai trò, kiểm thử trình duyệt & chụp screenshot).
  - `qltb-bugfix-refinement` (truy vết dọc 4 lớp `SOP-A` + tinh chỉnh bảo toàn phần đã `PASS` `SOP-D`).

### Docs (nhật ký chỉnh sửa tài liệu theo `PROJECT-RULES.md` mục 9)
- `PROJECT-RULES.md` v2.8 → v2.9 — mục 14: cập nhật toàn bộ 5 nhóm Prompt Mẫu (1A, 1B, 2, 3, 4, 5) để gọi đích danh `AGENTS.md`, 5 Workspace Skills và script `self-audit.mjs` — Lý do: đồng bộ bộ prompt với cấu hình tự động mới và rút gọn thao tác giao việc — Ảnh hưởng: mọi phiên làm việc tiếp theo.
- `CHANGELOG.md` — thêm mục `[2.9.0-plan]` này.

---

## [2.8.0-plan] — 2026-11-20 (Bổ sung Quy trình AI Agent Thực thi Kế hoạch `SOP-0`, Mô hình 2 Nhịp cho Tính năng/UI-UX, `SOP-D` Chỉnh sửa Chưa Đúng Ý & Bộ Prompt Mẫu Chuẩn Mục 14)

> **Trạng thái:** chỉ cập nhật **tài liệu quy chuẩn** (`docs/PROJECT-RULES.md`, `docs/IMPLEMENTATION-PLAN.md`, `CHANGELOG.md`); **chưa thay đổi** DB Production hay source code ứng dụng.

### Decisions (bổ sung)
30. **Chuẩn hóa Luồng Thực thi AI Agent & Bộ Prompt Mẫu (`PROJECT-RULES.md` mục 11 & 14):** Quy định chu trình 6 bước `SOP-0` cho từng Task/Phase trong `IMPLEMENTATION-PLAN.md` (dừng bắt buộc tại `🔒 GATE`), áp dụng mô hình **2 Nhịp có Cổng Duyệt** cho mọi yêu cầu thêm chức năng (`SOP-B`) hoặc thiết kế/đổi UI-UX (`SOP-C`) (*Nhịp 1 chỉ đọc 4 lớp + đề xuất đặc tả/wireframe → Dừng chờ duyệt → Nhịp 2 mới code*), bổ sung `SOP-D` khoanh vùng chỉnh sửa khi kết quả chưa đúng ý (không đập đi làm lại phần đã `PASS`), và cung cấp sẵn **Bộ Prompt Mẫu Copy-Paste (Mục 14)** để chủ dự án điều phối AI chính xác trong mọi phiên làm việc.

### Docs (nhật ký chỉnh sửa tài liệu theo `PROJECT-RULES.md` mục 9)
- `PROJECT-RULES.md` v2.7 → v2.8 — thêm mục lục nhanh, mở rộng mục 11 (thêm sơ đồ Mermaid luồng AI Agent, `11.0 SOP-0` thực thi Task/Phase, chuẩn hóa 2 Nhịp cho `11.2 SOP-B` & `11.3 SOP-C`, thêm `11.4 SOP-D` chỉnh sửa kết quả chưa đúng ý) và **thêm mục 14** (5 nhóm Prompt Mẫu Copy-Paste: 1 Task, 1 Phase + Gate, Thêm chức năng & UI/UX 2 nhịp, Sửa lỗi, Chỉnh sửa chưa đúng ý, Duyệt Gate mở bước tiếp) — Lý do: giúp AI Agent bám sát từng bước quy trình và giúp chủ dự án giao việc nhanh, nhất quán không bị sai lệch quy chuẩn — Ảnh hưởng: toàn bộ quá trình thi công & bảo trì về sau.
- `IMPLEMENTATION-PLAN.md` v4.1 → v4.2 — mục 0: cập nhật liên kết sang `PROJECT-RULES.md` v2.8 (`SOP-0` Mục 11.0 và Bộ Prompt Mẫu Mục 14) — Lý do: đồng bộ tài liệu kế hoạch với bộ quy tắc v2.8 — Ảnh hưởng: toàn bộ lộ trình thực thi.
- `CHANGELOG.md` — thêm mục `[2.8.0-plan]` này.

---

## [2.7.0-plan] — 2026-11-20 (Bổ sung Hiến pháp Chống Suy Đoán 4 Lớp, Bộ SOP Sửa lỗi / Thêm chức năng / UI-UX & Chuẩn Bảo trì - Nâng cấp trong `PROJECT-RULES.md`)

> **Trạng thái:** chỉ cập nhật **tài liệu quy chuẩn** (`docs/PROJECT-RULES.md`, `docs/IMPLEMENTATION-PLAN.md`, `CHANGELOG.md`); **chưa thay đổi** DB Production hay source code ứng dụng.

### Decisions (bổ sung)
29. **Hiến pháp Chống Suy Đoán & Kiểm tra 4 Lớp bắt buộc (`PROJECT-RULES.md` mục 0, 6, 11, 12, 13):** Mọi AI Agent và lập trình viên **tuyệt đối không được suy đoán** tên bảng/cột/SP/tham số/route/key JSON/DOM ID hay luồng nghiệp vụ; trước mọi thao tác sửa lỗi, thêm chức năng hoặc đổi UI/UX phải kiểm tra trực tiếp đủ **4 lớp** (*Tài liệu → Mã nguồn chuỗi dọc + Blast Radius → DB/SP thật → UI/DOM hiện hữu*), dừng hỏi khi phát hiện mâu thuẫn, áp dụng đúng quy trình SOP (SOP-A Bug-fix, SOP-B Spec-first Feature/Upgrade, SOP-C UI/UX), tuân thủ chuẩn bảo trì sạch mã/tương thích ngược (*Expand → Migrate → Verify → Contract*) và tự kiểm đủ 12 mục Cổng Tự Kiểm tra trước khi báo hoàn thành.

### Docs (nhật ký chỉnh sửa tài liệu theo `PROJECT-RULES.md` mục 9)
- `PROJECT-RULES.md` v2.6 → v2.7 — **thêm mục 0, 11, 12, 13** và mở rộng mục 5, 6, 8, 9: bổ sung quy tắc Zero-Assumption & Kiểm tra 4 Lớp bắt buộc, Cổng Dừng Hỏi (Stop-and-Ask), danh sách 10 hành vi bị CẤM tuyệt đối với AI, 3 bộ SOP (Sửa lỗi / Thêm-Nâng cấp chức năng / Thay đổi UI-UX), Bản đồ đặt tên module 1-1, chuẩn Clean Code/DRY, chiến lược nâng cấp tương thích ngược (Expand-Migrate-Verify-Contract), quản trị cấu hình/dependencies và Cổng Tự Kiểm tra 12 mục trước bàn giao — Lý do: bảo đảm dự án dễ bảo trì, nâng cấp lâu dài và ngăn tuyệt đối tình trạng AI tự suy đoán không đối chiếu tài liệu/code/DB/UI — Ảnh hưởng: toàn bộ các Task Phase 0–8 và mọi phiên bảo trì/nâng cấp sau này.
- `IMPLEMENTATION-PLAN.md` v4.0 → v4.1 — mục 0: bổ sung liên kết bắt buộc tới `PROJECT-RULES.md` v2.7 (Mục 0, 6, 11, 12, 13) trước khi thực thi bất kỳ Task nào — Lý do: đồng bộ quy trình thi công với bộ quy tắc v2.7 — Ảnh hưởng: toàn bộ lộ trình thực thi.
- `CHANGELOG.md` — thêm mục `[2.7.0-plan]` này.

---

## [2.6.0-plan] — 2026-11-20 (Đối chiếu 100% Code + DB thật, Chốt mọi Câu hỏi Mở, Bổ sung 5 Tính năng ITAM Bệnh viện & Quy chuẩn Báo cáo Nghiệm thu)

> **Trạng thái:** chỉ cập nhật **tài liệu thiết kế & tạo 2 script SQL baseline chỉ đọc**; **chưa thay đổi** DB Production hay source code ứng dụng. Toàn bộ 8 file docs + 2 script baseline đã hoàn thiện 100% (0 ô `CHƯA XÁC MINH`, 0 câu hỏi mở), sẵn sàng triển khai ngay khi chủ dự án yêu cầu.

### Decisions (quyết định chốt chính thức phiên 2026-11-20)
24. **Phạm vi `viewer` (Chốt câu hỏi mở #1 `PRD 4.6`):** `viewer` xem toàn bộ dữ liệu toàn bệnh viện (không giới hạn theo Khoa/Phòng).
25. **Chuẩn Route G1 (Sửa Quyết định 13 v2.4 theo code thật):** Xác minh code thật cho thấy cả 6 route danh mục/thiết bị/linh kiện **đã có song song cả REST và legacy** (và `hardwareTypes.js`, `hardwares.js` đã gọi REST). Chốt: **giữ song song cả 2 bộ route trên backend** để tương thích ngược tuyệt đối; khi chuẩn hóa giao diện JS (Phase 4–5) thì chuyển toàn bộ Frontend gọi về **1 chuẩn REST sạch (`PUT /:id`, `PATCH /:id/toggle`, `DELETE /:id`)**.
26. **Lộ trình HTTP → HTTPS trên IIS (Chốt câu hỏi mở #3 `PRD 4.6` / `T2.8`):** Giai đoạn đầu chạy **HTTP nội bộ trong mạng LAN (`COOKIE_SECURE=false`)** — rủi ro được ghi nhận và chấp nhận trong LAN nội bộ; sau khi hoàn thiện toàn bộ dự án sẽ triển khai **chứng chỉ CA nội bộ trên IIS** và bật `COOKIE_SECURE=true`.
27. **Bổ sung 5 tính năng ITAM Bệnh viện thực dụng (tham khảo Snipe-IT / GLPI):**
    - `dbo.SystemSettings`: Admin tự cấu hình tên người ký mặc định biểu mẫu sửa chữa (`Giám đốc`, `TP.TC-KT`, `TP.HCQT-TCCB`, `Đại diện CNTT`), mã Phòng CNTT (`PCNTT` thay hardcode `deptId = 295`), ngưỡng cảnh báo bảo hành (`30` ngày) và ngưỡng bơm mực (`3` lần/Drum, `5` lần/Hộp mực — **chốt câu hỏi mở #5 `PRD 4.6`**).
    - **Quản lý Hạn bảo hành (`warrantyDate`):** Làm sạch `2.153` dòng rác `HardwareUnits.warrantyDate = '1900-01-01'` → `NULL`, thêm `Devices.warrantyDate`, hiển thị badge Còn/Sắp hết/Hết bảo hành trên Thiết bị, Hồ sơ 360° & Sửa chữa.
    - **Nhân bản 1-Click (`Clone`) + Nhập hàng loạt từ Excel/CSV (`Dry-run Preview + Commit`):** Phục vụ nhập nhanh 50–100 máy in hoặc lô máy tính đồng bộ.
    - **Luân chuyển 1 bước (`Khoa A → Khoa B`) + In Biên bản Bàn giao / Thu hồi (DOCX → PDF):** Dùng chung hàng đợi LibreOffice tại `docxReportService.js`.
    - **In Tem dán Tài sản kèm Mã QR 100% Offline (`public/vendor/qrcode/`):** Trỏ tới `/devices?profileId=<id>` tự mở Hồ sơ 360° khi quét bằng điện thoại trong LAN.
28. **Quy chuẩn Báo cáo Nghiệm thu Bắt buộc ở mọi Task & Giai đoạn nhỏ (`PROJECT-RULES` mục 10, `IMPLEMENTATION-PLAN` v4.0):** Mọi Task và mọi Phase Gate (`PHASE-<N>-REPORT.md`) đều phải có bằng chứng định lượng: danh sách file/diff, script & output kiểm thử nguyên văn, và **ảnh chụp màn hình (Screenshot)** giao diện/phân quyền/DevTools/PDF.

### Added
- Tạo 2 script SQL **chỉ đọc** phục vụ Phase 0 Baseline:
  - `scripts/baseline/export-schema.sql`
  - `scripts/baseline/preflight-checks.sql`
- Hoàn tất khảo sát thực tế DB (SQL Server 2019 RTM 15.0.2000.5, compat `140`) & source code thật: phát hiện `4.277` phiên `Sessions` rác hết hạn, `2.153/2.154` dòng `HardwareUnits.warrantyDate = '1900-01-01'`, `2.154/2.154` `code = serialNumber`, `0` dòng `Repairs`, `0` trùng bàn giao active, `0` SP `QUOTED_IDENTIFIER OFF`, và phân loại rõ `7` SP `sp_DeviceHardwareUnits_*` đang dùng vs `5` SP chết + `10` SP backup + `6` SP cũ.

### Fixed (sửa mâu thuẫn & điểm khuyết trong bộ docs v2.5)
- Sửa mâu thuẫn `G1` về route REST/legacy và `G3` về 5 SP chết vs 7 SP đang dùng của `sp_DeviceHardwareUnits_*`.
- Bổ sung cách hiển thị nhiều linh kiện trên mẫu in PDF (`STRING_AGG` trong `sp_Repairs_GetPrintDataById`).
- Bổ sung thuật toán **diff** cho `sp_DeviceHardwareUnits_UpdateAssigned` để bảo toàn `attachedDate` của linh kiện không thay đổi.
- Chốt toàn bộ 6 câu hỏi mở ở `PRD.md` mục 4.6 (còn `0` câu hỏi mở).

### Docs (nhật ký chỉnh sửa tài liệu theo `PROJECT-RULES.md` mục 9)
- `AS-IS-BASELINE.md` v0.2 → v1.0 — mục 1–5: điền 100% số liệu thật từ SQL Server 2019 và source code thật (0 ô `CHƯA XÁC MINH`), thêm G18 (`warrantyDate 1900-01-01`) & G19 (`SystemSettings`), chốt toàn bộ G1–G19 — Lý do: hoàn thiện baseline thật trước khi code — Ảnh hưởng: Phase 0–8.
- `PRD.md` v2.5 → v2.6 — mục 1–4: chốt 6/6 câu hỏi mở, thêm FR-SET-01 (`SystemSettings`), FR-DEV-04 (Clone/Bulk Import CSV), FR-DEV-05 (In tem QR offline), FR-ASG-02/03 (Luân chuyển 1 bước + Biên bản Bàn giao PDF), Bảo hành, NFR-09 (báo cáo nghiệm thu kèm hình ảnh & script) — Lý do: hoàn thiện nghiệp vụ ITAM bệnh viện theo quyết định chủ dự án — Ảnh hưởng: T1.2, T1.3, T1.12, T3.3, T5.x, T6.2–T6.3, T7.x.
- `ARCHITECTURE.md` v2.4 → v2.6 — mục 1–4: thêm `public/vendor/qrcode/`, luồng Bulk Import CSV, Luân chuyển + Biên bản PDF dùng chung LibreOffice Queue, `SystemSettings`, lộ trình HTTP LAN → HTTPS CA nội bộ, thư mục `docs/acceptance/` — Lý do: đồng bộ kiến trúc với PRD v2.6 — Ảnh hưởng: T2.5–T2.7, T5.x, T6.2.
- `DATA-SCHEMA.md` v2.5 → v2.6 — mục 0–4: thêm bảng `dbo.SystemSettings` (8 khóa seed), cột `Devices.warrantyDate`, làm sạch `2.153` dòng `1900-01-01`, thuật toán diff `UpdateAssigned`, `sp_DeviceAssignments_Transfer`, `sp_DeviceAssignments_GetPrintDataById`, `STRING_AGG` nhiều linh kiện cho `sp_Repairs_GetPrintDataById`, bỏ hardcode `deptId = 295` — Lý do: đồng bộ DB thật & tính năng mới — Ảnh hưởng: Phase 1, 3, 5, 6, 7.
- `API-CONTRACTS.md` v2.5 → v2.6 — mục 1.3, 2.1–2.8: sửa quy ước route G1 theo code thật (backend giữ song song REST + legacy, frontend chuẩn hóa REST), thêm API `/settings`, `/devices/import/*`, `/assignments/:id/transfer`, `/assignments/:id/reports/{handover,revoke}/pdf` — Lý do: đồng bộ code thật & PRD v2.6 — Ảnh hưởng: Phase 3–7.
- `PROJECT-RULES.md` v2.2 → v2.6 — mục 2, 3, 4, 5, **thêm mục 10**: quy tắc `SystemSettings`, G1 route song song, và Quy chuẩn Báo cáo Nghiệm thu bắt buộc (kèm ảnh chụp + script + output) cho mọi Task & Phase — Lý do: chuẩn hóa kiểm soát chất lượng thi công — Ảnh hưởng: mọi Task.
- `UI-DESIGN.md` v2.5 → v2.6 — mục 2–4: thêm wireframe `/settings`, Modal Import CSV Dry-run, Xem trước In Tem QR, nút Clone/Luân chuyển/Biên bản PDF và Badge Bảo hành — Lý do: đủ thiết kế UI cho 5 tính năng mới — Ảnh hưởng: T3.3, T5.2–T5.3, T6.2–T6.3.
- `IMPLEMENTATION-PLAN.md` v3.2 → v4.0 — viết lại phân rã chi tiết 11 chặng (`Phase 0, 1A, 1B, 2A, 2B, 3, 4, 5, 6, 7, 8`) với cổng `🔒 GATE` và tiêu chí bằng chứng nghiệm thu (hình ảnh, script, output) cho từng Task & từng Giai đoạn — Lý do: đáp ứng yêu cầu chia nhỏ & nghiệm thu nghiêm ngặt của chủ dự án — Ảnh hưởng: toàn bộ lộ trình thực thi.
- `CHANGELOG.md` — thêm mục `[2.6.0-plan]` này.

---

## [2.5.0-plan] — 2026-11-18 (Rà soát & hoàn thiện `PRD.md` và `UI-DESIGN.md` để trọn bộ docs)

> **Trạng thái:** chỉ thay đổi **tài liệu**; chưa có thay đổi nào lên code hay DB. Bộ docs v2.x đã đủ 9 file để giao AI Agent thực thi từ Phase 0. *(Người sửa: Claude, phiên 2026-11-18, theo yêu cầu của chủ dự án.)*

### Decisions (bổ sung)
19. **KPI Dashboard thống nhất:** `totalDevices` = `in_use + in_stock + under_repair` (**không** gồm Tạm ngưng); thêm `inactiveDevices` riêng.
20. **Cảnh báo bơm mực = đếm từ nhật ký** *(từ v2.6 ngưỡng 3 lần/Drum và 5 lần/Hộp mực cấu hình được qua `SystemSettings`)*.
21. **`viewer` thấy toàn bộ dữ liệu** *(đã chốt chính thức ở v2.6)*.
22. **Màn hình hiện có giữ bố cục**; UI-DESIGN thiết kế màn hình mới/nâng cấp và quy tắc chung.
23. **Nút không đủ quyền ẩn hẳn**; server kiểm tra quyền độc lập.

---

## [2.4.0-plan] — 2026-11-18 (Đối chiếu bộ docs v2.3 với `git ls-files` & `project_context.md`)

### Decisions (bổ sung)
13. *(Đã cập nhật tại Quyết định 25 v2.6 sau khi xác minh trực tiếp code `routes/*.js`.)*
14. **Tương thích ngược bắt buộc ở Phase 1–2:** SP hiện hữu giữ tên, tham số, cột và thứ tự recordset.
15. **Sửa tại chỗ các helper đã có** (`apiResponse`, `asyncHandler`, `errorHandler`, `pagination`, `sessionStore`, `cleanupTempReports`, `docxReportService`).
16. **Không dùng `ON DELETE CASCADE`**; xóa con tường minh trong SP.
17. **Báo cáo sửa chữa dùng cột thật** `actualRepairHours` (fallback `expectedRepairHours`) và `estimatedCost`.
18. **7 SP `sp_DeviceHardwareUnits_*` đang dùng** không xóa *(từ v2.6 tách rõ 7 SP đang dùng vs 5 SP chết tham chiếu bảng không tồn tại)*.

---

## [2.3.0-plan] — 2026-11-18 (Rà soát schema, bảo mật, sổ cái tồn kho mực & quy trình migration)

### Decisions
1. **Bỏ cache RAM của session (`get`)**, giữ Touch Throttling 5 phút; PM2 chạy **fork, 1 tiến trình**.
2. **Trạng thái thiết bị suy ra** từ view `vw_DeviceCurrentStatus` (`inactive` > `under_repair` > `in_use` > `in_stock`).
3. **Một phiếu sửa chữa có nhiều linh kiện** qua `RepairHardwareUnits`.
4. **Lịch sử gắn linh kiện:** gắn = `INSERT`, gỡ = `isInactive = 1` + `detachedDate`, Filtered Unique Index `WHERE isInactive = 0`.
5. **Quick Config khi Sửa chỉ bổ sung**, không tự gỡ/xóa; nhận `hardwareItems: [{ hardwareId, qty }]`.
6. **Tồn kho mực có sổ cái `PrinterStockMovements`**; cho phép âm; hủy mềm kèm lý do; `receiptCode` duy nhất; bộ đếm tính lại từ nhật ký.
7. **Migration** bằng `db/sql/migrations/Vnnn__*.sql` (`SchemaVersions` + SHA-256) và `db/sql/procedures/*.sql` (`CREATE OR ALTER`).
8. **Tham số danh sách dùng TVP** (`tt_IdList`, `tt_HardwareItem`, `tt_SupplyQty`).
9. **Chống ghi đè đồng thời** bằng `rowVersion` (`50010` → `409 CONCURRENT_MODIFICATION`).
10. **Xuất CSV phía server** (BOM UTF-8 + chống formula injection); in giới hạn 5.000 dòng.
11. **Đăng nhập:** thông báo thất bại chung, khóa tạm 15 phút sau 5 lần sai, rate limit theo IP thật, bắt buộc đổi mật khẩu lần đầu.
12. **Máy in nhận diện bằng `DeviceTypes.isPrinter`**, không hard-code `deviceTypeId = 1`.

---

## [2.2.0-plan] — 2026-11-17 (Tối ưu LAN 200 CCU, Báo cáo Đa chiều & Phiếu nhập Mực đơn giản)
- Nội bộ hóa thư viện Frontend về `public/vendor/`, tối ưu `MSSQLStore` & SQL Pool, gỡ `maxConcurrentRequests="1"` ở `web.config`, hàng đợi LibreOffice PDF, tích hợp Báo cáo Đa chiều 4 Tab trên Dashboard và thiết kế Phiếu nhập kho vật tư mực đơn giản (`PrinterStockReceipts`).

---

## [2.1.0-plan] — 2026-11-17 (Rút gọn Quy trình Linh kiện 1-Bước & Thiết kế Module Máy in - Bơm mực)
- Thiết kế `1-Step Quick Hardware Config`, bỏ bắt buộc `serialNumber`, gom cụm Tab Linh kiện và thiết kế Module `🖨️ Máy in & Bơm mực` (`/printer-ink`).

---

## [2.0.0-plan] — 2026-11-17 (Khởi tạo Bộ Tài liệu Chuẩn hóa Dự án)
- Khởi tạo bộ 6 tài liệu kiến trúc/đặc tả chuẩn trong `docs/` và `IMPLEMENTATION-PLAN.md`.

---

## [1.2.0] — 2026-05-25 (Module Báo cáo Sửa chữa DOCX → PDF & Dọn file tạm)
- Bổ sung bảng `RepairReportDetails`, 5 Stored Procedure, luồng xuất 2 mẫu PDF qua `docxtemplater` + LibreOffice Headless và `utils/cleanupTempReports.js`.

---

## [1.1.0] — 2026-05-15 (Chuẩn hóa Bước 1 Nền tảng Phân trang & API Response)
- Thêm `utils/apiResponse.js`, `utils/pagination.js`, `utils/asyncHandler.js`, `middleware/errorHandler.js`, `public/js/common/pagination.js`.
