# 1. PRD.md — Tài liệu Yêu cầu Sản phẩm (Product Requirements Document)

> **Dự án:** Hệ thống Quản lý Thiết bị CNTT (`QuanLyThietBiCNTT`) — Dự án Khung Nền tảng WebApp Bệnh viện  
> **Đơn vị sử dụng:** Bệnh viện Đa khoa Khu vực Long Khánh (Phòng CNTT & các Khoa/Phòng)  
> **Quy mô vận hành:** Mạng LAN nội bộ Bệnh viện (Đáp ứng mượt 20 → 200 người dùng đồng thời; kiến trúc mở rộng cho nhiều WebApp y tế về sau)  
> **Phiên bản tài liệu:** 3.0 (Chốt **Lộ trình B**: tách **Express 5 Modular REST API Server** dùng chung đa-WebApp + **ReactJS/Vite/TypeScript SPA** 100% Offline LAN + **Hệ thống Giao diện Y tế Thống nhất BVĐKKV Long Khánh** tham khảo mẫu WebApp Báo cáo bệnh viện; giữ nguyên 100% nghiệp vụ & quyết định v2.6)  
> **Cập nhật lần cuối:** 2026-11-20  
> **Xem thay đổi chi tiết tại:** `CHANGELOG.md` mục `[3.0.0-plan]`

---

## 1. Mục tiêu sản phẩm (The "Why")

### 1.1 Bối cảnh, Tầm nhìn Nền tảng & 7 Bài toán Cốt lõi
Bệnh viện Đa khoa Khu vực Long Khánh đang vận hành hệ thống nội bộ trên mạng LAN với dữ liệu thực tế đã xác minh tại `AS-IS-BASELINE.md` (2026-11-20): **410 Thiết bị CNTT** (hiện `0` máy in), **41 Khoa/Phòng**, **121 Mẫu phần cứng**, **2.154 Đơn vị phần cứng chi tiết**, **2.123 Liên kết cấu hình**, **415 Lượt bàn giao**, **11 Nhân sự CNTT**.

Từ phiên bản **v3.0 (Lộ trình B)**, chủ dự án định hướng không chỉ nâng cấp riêng `QuanLyThietBiCNTT`, mà còn biến dự án này thành **Nền tảng Khung chuẩn (Hospital WebApp Foundation)** để mở rộng cho nhiều WebApp nội bộ khác của Bệnh viện (như WebApp Báo cáo HIS/CĐHA/Lâm sàng/TCKT, Quản lý Hỗ trợ CNTT/Helpdesk, Quản lý Kho vật tư...):

1. **Kiến trúc Tách biệt API Server Đa-Module & React SPA 100% Offline LAN:**
   - **Backend (`server/`):** Express 5 Modular REST API Server phân vùng chuẩn `/api/v1/core/*` (lõi dùng chung: SSO/Auth, Tài khoản, Khoa/Phòng, Nhân sự, Cấu hình, Nhật ký) và `/api/v1/itam/*` (nghiệp vụ Quản lý Thiết bị CNTT), sẵn sàng cắm thêm `/api/v1/<future-app>/*` mà không đụng mã nguồn cũ.
   - **Frontend (`client/`):** React + Vite + TypeScript + Tailwind CSS đóng gói **100% Offline** (tự gói Font tiếng Việt WOFF2, SVG icons, QRCode — 0 request CDN ngoài Internet), triển khai cùng nguồn (same-origin) sau IIS Reverse Proxy ARR dưới `/QuanLyThietBiCNTT`.
   - **Bộ UI/UX Thống nhất Y tế (`design-system/`):** Xây dựng theo phong cách nhận diện thực tế của Bệnh viện ĐKKV Long Khánh (Sidebar trái xanh dương y tế `#00548F`, Topbar gạch dọc xanh `#005A9C`, nút tác vụ xanh ngọc `#0B8A5C`, bảng dữ liệu header xanh đậm chữ trắng in hoa) để dùng chung cho mọi WebApp sau này.
2. **Hiệu năng & Độ ổn định cho 20 → 200 người dùng mạng LAN nội bộ:**
   - Chuẩn hóa `web.config` (gỡ bỏ `iisnode` & `maxConcurrentRequests="1"`), nâng SQL Pool lên `max=50`, thêm Touch Throttling 5 phút cho `MSSQLStore` (dọn sạch `4.277` phiên rác hết hạn, **không** dùng cache RAM để khóa tài khoản/đổi quyền có hiệu lực tức thì).
   - Hàng đợi PDF 2 slot với 2 thư mục profile cố định cho LibreOffice Headless.
3. **Đơn giản hóa đột phá thao tác nhập Thiết bị & Linh kiện (`1-Step Quick Config`, `Clone`, `Bulk Import`):**
   - Bảo toàn 100% `2.154` linh kiện cũ, bỏ bắt buộc nhập `serialNumber` (Filtered Unique Index) và tự sinh `code`.
   - Chọn trực tiếp **Khoa/Phòng bàn giao** + **Mẫu linh kiện kèm số lượng (`RAM × 2`)** ngay trong 1 Modal Tạo/Sửa Thiết bị.
   - Bổ sung nút **📋 Nhân bản 1-Click (Clone)** và **📥 Nhập hàng loạt từ Excel/CSV (Dry-run Preview)** để nhập nhanh lô máy tính đồng bộ hoặc 50–100 máy in ban đầu.
4. **Báo cáo Đa chiều ngay tại Trang chủ Dashboard (`/`):**
   - 4 Tab trực quan (Tổng quan KPI, Báo cáo Tình trạng Sử dụng Thiết bị, Báo cáo Tổng hợp Sửa chữa, Báo cáo Máy in & Mực) theo đúng chuẩn màn hình Báo cáo bệnh viện kèm nút **🔍 Xem báo cáo**, **🖨️ In báo cáo** và **📥 Xuất Excel (CSV UTF-8)** sinh phía server.
5. **Hoàn thiện Vòng đời Tài sản chuẩn Bệnh viện (Bàn giao/Luân chuyển, Bảo hành, Tem QR, Cấu hình Hệ thống):**
   - **🔄 Luân chuyển 1 bước (Khoa A → Khoa B)** + xuất **Biên bản Bàn giao / Thu hồi (DOCX → PDF)** dùng chung LibreOffice.
   - **🛡️ Theo dõi Bảo hành (`warrantyDate`):** Làm sạch `2.153` dòng rác `'1900-01-01'` → `NULL`, bổ sung hạn bảo hành cho cả `Devices` và hiển thị cảnh báo Còn/Sắp hết/Hết bảo hành trên Hồ sơ 360° & Sửa chữa.
   - **🏷️ In Tem dán Tài sản kèm Mã QR (Offline 100%):** Quét mã QR trên vỏ máy/máy in bằng điện thoại nội bộ LAN mở thẳng Hồ sơ 360° (tối ưu hiển thị di động) của thiết bị đó để kiểm kê và sửa chữa nhanh.
   - **⚙️ Cấu hình Hệ thống (`SystemSettings`):** Admin tự chỉnh tên Lãnh đạo ký mặc định trên biểu mẫu, mã Phòng CNTT (`PCNTT`) và ngưỡng cảnh báo bảo hành/bơm mực không cần sửa code.
6. **Mở rộng Module `🖨️ Máy in & Bơm mực` (`/printer-ink` — Phase 7):**
   - Liên thông với bảng `Devices` qua cờ `DeviceTypes.isPrinter = 1`.
   - Ghi nhận Bơm mực / Thay Drum / Thay Hộp mực trong 1 click (kèm `pageCounter`), quản lý **Phiếu nhập kho đơn giản (`receiptCode` duy nhất)** có **sổ cái biến động tồn kho (`PrinterStockMovements`)**, cho phép tồn âm, hủy mềm kèm lý do và tự tính lại bộ đếm từ nhật ký.
7. **Bảo mật & Phân quyền nội bộ (Sẵn sàng SSO đa WebApp):**
   - Xác thực Session Cookie `HttpOnly` + CSRF + Phân quyền 3 vai trò (`admin`, `technician`, `viewer`), ép đổi mật khẩu lần đầu, chống XSS/SQLi/CSV Injection, chống ghi đè đồng thời (`rowVersion`) và `AuditLogs` (có `appCode` sẵn sàng cho nhiều WebApp).

### 1.2 Hiện trạng & Nguyên tắc Chuyển đổi An toàn
- **Hiện trạng (`AS-IS-BASELINE.md` v1.0):** 9 module EJS đang vận hành ổn định trên Production nhưng chưa có đăng nhập/phân quyền và tồn tại các lỗi thật trong code/SP đã được ghi nhận (`G1–G19`).
- **Nguyên tắc chuyển đổi v3.0:**
  1. **Tầng Database & Stored Procedures (Phase 1) tương thích ngược 100%** với ứng dụng EJS cũ (tag `pre-v3.0`) để bảo đảm quay lại tức thì nếu cần và tuyệt đối không mất dữ liệu (NFR-06, NFR-08).
  2. **Ứng dụng v3.0 (`server/` + `client/`) phát triển sạch trên nhánh `feature/v3.0`** và DB `QuanLyThietBiCNTT_DEV`, chỉ chuyển đổi Production (Cutover) sau khi vượt qua toàn bộ 8 Cổng Nghiệm thu (`🔒 GATE 0 → 8`).
  3. **Mọi Task & Phase đều có Báo cáo Nghiệm thu** kèm script/output thật và ảnh chụp màn hình đủ 3 vai trò.

### 1.3 Tiêu chí thành công
| Chỉ tiêu | Mục tiêu |
|---|---|
| Nhập 1 thiết bị mới đủ cấu hình + bàn giao | ≤ **1 Modal** (hoặc **1 Click Nhân bản** / **Import CSV hàng loạt**) |
| Lấy 1 báo cáo (lọc → xem → in/xuất) | ≤ **3 thao tác**, giao diện đồng nhất với WebApp Báo cáo bệnh viện |
| Luân chuyển thiết bị Khoa A → Khoa B & in Biên bản | **1 thao tác** + **1 click in PDF** |
| Bản ghi mất sau migration | **0** (đối chiếu số dòng, NFR-06) |
| Route `/api/v1/*` có xác thực & phân quyền đúng ma trận 2.2 | **100%** |
| Số liệu Dashboard so với danh sách thiết bị/báo cáo | **Khớp 100%** (cùng view `vw_DeviceCurrentStatus`) |
| Khả năng tái sử dụng cho WebApp sau | Module `server/src/modules/core/` và `client/src/design-system/` tách sạch, có tài liệu hướng dẫn cắm thêm WebApp mới |

---

## 2. Chân dung người dùng & Ma trận phân quyền (Personas & RBAC)

Hệ thống tách biệt **Danh mục Nhân sự bệnh viện (`Users`)** và **Tài khoản đăng nhập (`Accounts`)**.

### 2.1 Ba nhóm vai trò (Roles)

| Vai trò (`role`) | Đối tượng sử dụng | Phạm vi & Trách nhiệm chính |
|---|---|---|
| **`admin`** (Quản trị viên) | Lãnh đạo Phòng CNTT / Quản trị hệ thống | Toàn quyền cấu hình danh mục nền, quản lý tài khoản & phân quyền, cấu hình hệ thống (`SystemSettings`), toàn quyền nghiệp vụ, xóa cứng bản ghi chưa có ràng buộc, hủy phiếu nhập kho mực và xem Nhật ký hệ thống (`AuditLogs`). |
| **`technician`** (Kỹ thuật viên CNTT) | Chuyên viên / Kỹ thuật viên Phòng CNTT (`PCNTT`) | Toàn quyền tác nghiệp: Thiết bị (Thêm/Sửa/Nhân bản/Import/In tem QR/Toggle), Linh kiện & Gán/Gỡ, Bàn giao/Luân chuyển/Thu hồi/In Biên bản PDF, Sửa chữa & In biểu mẫu PDF, Máy in/Bơm mực/Lập phiếu nhập mực/Hủy nhật ký bơm mực, Xem & Xuất báo cáo. Không quản lý Tài khoản, Cấu hình hệ thống, Nhật ký và không xóa cứng danh mục/tài sản. |
| **`viewer`** (Người xem / Tra cứu) | Ban Giám đốc, Kiểm soát nội bộ, Phòng TC-KT, Khoa/Phòng được cấp tài khoản | **Xem toàn bộ dữ liệu toàn bệnh viện** (đã chốt: không giới hạn theo Khoa/Phòng): Dashboard & In/Xuất Báo cáo, tra cứu Thiết bị + Hồ sơ 360°, Lịch sử bàn giao, Sửa chữa + Xem/In PDF, Máy in & Bơm mực. Không được thêm/sửa/xóa/tạm ngưng/hủy dữ liệu. |

### 2.2 Ma trận phân quyền chi tiết theo Module

| STT | Module / Chức năng | SPA Route | API Prefix | `viewer` | `technician` | `admin` |
|---|---|---|---|---|---|---|
| 1 | Đăng nhập / Đăng xuất / Đổi mật khẩu cá nhân | `/login` | `/api/v1/core/auth/*` | ✅ | ✅ | ✅ |
| 2 | Dashboard Tổng quan & Trung tâm Báo cáo (4 Tabs) | `/`, `/reports/*` | `/api/v1/itam/dashboard/*` | 👁️ Xem + In/CSV | 👁️ Xem + In/CSV | 👁️ Xem + In/CSV |
| 3 | Danh mục Phòng ban & Loại thiết bị (`isPrinter`) | `/departments`, `/device-types` | `/api/v1/core/departments`, `/api/v1/itam/device-types` | 👁️ Xem | 👁️ Xem | ✅ Toàn quyền |
| 4 | Thiết bị + Quick Config + Clone + Import + 360° + Tem QR | `/devices` | `/api/v1/itam/devices/*` | 👁️ Xem + 360° + In tem QR | ✅ Thêm/Sửa/Clone/Import/Toggle/QR | ✅ Toàn quyền (+ Xóa an toàn) |
| 5 | Cụm Linh kiện (4 Tabs: Cá thể, Mẫu PC, Loại PC, Gán/Gỡ) | `/hardware` | `/api/v1/itam/hardware-*`, `/device-hardware` | 👁️ Xem | ✅ Thêm/Sửa/Toggle/Gán/Gỡ | ✅ Toàn quyền (+ Xóa an toàn) |
| 6 | Bàn giao / **Luân chuyển 1 bước** / Thu hồi & **Biên bản PDF** | `/assignments` | `/api/v1/itam/assignments/*` | 👁️ Xem + In PDF | ✅ Gán mới / Sửa / Luân chuyển / Thu hồi / In PDF | ✅ Toàn quyền (+ Xóa lịch sử sai) |
| 7 | Quản lý Sửa chữa & In 2 biểu mẫu PDF | `/repairs` | `/api/v1/itam/repairs/*` | 👁️ Xem + In PDF | ✅ Tạo/Sửa/Xóa (`opened`)/Biểu mẫu/In PDF | ✅ Toàn quyền |
| 8 | Quản lý Máy in, Phiếu nhập Mực & Bơm mực (Phase 7) | `/printer-ink` | `/api/v1/itam/printer-ink/*` | 👁️ Xem + Thống kê | ✅ Bơm/Thay/Hủy log, Phiếu nhập, Vật tư, Hồ sơ máy in | ✅ Toàn quyền (+ **Hủy phiếu nhập kho**) |
| 9 | Quản trị: Tài khoản, **Cấu hình Hệ thống** & Nhật ký | `/admin/accounts`, `/admin/settings`, `/admin/audit-logs` | `/api/v1/core/{accounts,settings,audit-logs}` | ❌ Chặn (403) | ❌ Chặn (403) | ✅ Toàn quyền |

---

## 3. Yêu cầu Chức năng theo từng Màn hình (Functional Requirements)

### 3.1 Lõi Dùng chung (`Core Platform`: Auth, Accounts, Settings, AuditLogs, Departments, Users)
- **FR-AUTH-01..04:** Đăng nhập bằng `username` + `password` (`scrypt`); thông báo lỗi luôn chung; khóa tạm 15 phút theo tài khoản sau 5 lần sai; rate limit theo IP thật; phiên 8 giờ (`HttpOnly`, Touch Throttling 5 phút, không cache RAM); lấy CSRF token qua `GET /api/v1/core/auth/csrf` & trạng thái người dùng qua `GET /api/v1/core/auth/me`; bắt buộc đổi mật khẩu ở lần đầu/sau reset (`mustChangePassword = 1`); tự đổi mật khẩu cá nhân từ Header.
- **FR-ACC-01..02:** Admin tạo tài khoản (gắn tối đa 1 tài khoản / 1 nhân sự `Users`), gán vai trò, khóa/mở khóa, reset mật khẩu (mật khẩu tạm chỉ hiển thị 1 lần). Tài khoản `admin` đầu tiên tạo bằng `scripts/seed-admin.js`.
- **FR-SET-01 (Cấu hình Hệ thống `/admin/settings`):** Admin quản lý `dbo.SystemSettings` (có cột `appCode` sẵn sàng cho cấu hình toàn cục `'global'` và theo từng app `'itam'`):
  - **Biểu mẫu in mặc định:** `default_director_name`, `default_finance_head_name`, `default_admin_head_name`, `default_it_rep_name`.
  - **Tổ chức:** `it_department_code` (mặc định `'PCNTT'`).
  - **Cảnh báo Máy in:** `printer_drum_warn_refills` (`3`), `printer_cartridge_warn_refills` (`5`).
  - **Cảnh báo Bảo hành:** `warranty_expiring_days` (`30` ngày).
- **FR-AUDIT-01:** Tự động ghi `AuditLogs` (có `appCode`, IP máy trạm thật, không ghi mật khẩu/hash/token), lưu trữ 24 tháng, hỗ trợ lọc theo ứng dụng/tài khoản/hành động/thời gian.

### 3.2 Màn hình Trang chủ — Dashboard & Trung tâm Báo cáo Đa chiều (`/`)
- **FR-DASH-01 (Tổng quan KPI & Cảnh báo):** 4 thẻ KPI theo view `vw_DeviceCurrentStatus` (`totalDevices`, `assignedDevices`, `availableDevices`, `activeRepairs`, phụ đề `inactiveDevices`) + thẻ cảnh báo bảo hành & phiếu sửa chữa tồn đọng + máy in cần chú ý + lối tắt nhanh.
- **FR-DASH-02 (Báo cáo Tình trạng Sử dụng Thiết bị):** Bộ lọc đa chiều theo mẫu WebApp Báo cáo bệnh viện → Ma trận Khoa/Phòng × Loại máy + Danh sách chi tiết + **🖨️ In báo cáo** (A4 ngang, tối đa 5.000 dòng) + **📥 Xuất Excel (CSV UTF-8)**.
- **FR-DASH-03 (Báo cáo Sửa chữa theo Thời gian & Loại máy):** Tổng ca, tổng giờ sửa (`COALESCE(actualRepairHours, expectedRepairHours)`), tổng chi phí dự kiến (`estimatedCost`) + In & Xuất CSV.
- **FR-DASH-04 (Báo cáo Máy in & Sử dụng Vật tư Mực — Phase 7):** Lọc thời gian/Khoa/Vật tư → thống kê bơm mực, thay Drum/Hộp mực và tổng vật tư tiêu hao + In & Xuất CSV.

### 3.3 Màn hình Thiết bị (`/devices`) — Quick Config, Clone, Bulk Import, Bảo hành, 360° & Tem QR
- **FR-DEV-01:** Danh sách Thiết bị hiển thị Mã, Tên, Loại, Khoa/Phòng đang dùng, Cấu hình tóm tắt, Ngày mua, Tình trạng bảo hành (`warrantyDate`) và Trạng thái vận hành (4 nhãn chuẩn).
- **FR-DEV-02:** Modal Thêm/Sửa kèm **Quick Config 1 Bước** (`warrantyDate`, Khoa/Phòng, `hardwareItems: [{ hardwareId, qty }]` 1–20/mẫu); khi Sửa chỉ bổ sung linh kiện thiếu, không tự gỡ; đổi Khoa/Phòng có xác nhận; `rowVersion` chống ghi đè đồng thời.
- **FR-DEV-03:** Modal Hồ sơ Thiết bị 360° (`GET /api/v1/itam/devices/:id/profile-360` — 5 recordsets), tự động mở khi truy cập `/devices?profileId=<id>` (quét QR trên điện thoại LAN tự chuyển sang bố cục đọc gọn trên di động).
- **FR-DEV-04:** **Nhân bản 1-Click (`Clone`)** & **Nhập hàng loạt CSV (`Dry-run Preview` + `Commit` có `Idempotency-Key`)**.
- **FR-DEV-05:** **In Tem dán Tài sản kèm Mã QR 100% Offline** (lưới A4 3×8 và tem nhiệt đơn 50×30mm, sinh QR nội bộ bằng gói `qrcode` đóng gói trong bundle).

### 3.4 Cụm Linh kiện (`/hardware` — 4 Tabs)
- **FR-HW-01..02:** 4 Tabs (`Cá thể linh kiện`, `Mẫu phần cứng`, `Loại phần cứng`, `Gán / Gỡ linh kiện`). `serialNumber` tùy chọn, `code` tối đa 60 ký tự tự sinh khi trống, làm sạch `2.153` dòng `warrantyDate = '1900-01-01'` → `NULL`, lịch sử gắn/gỡ giữ nguyên `attachedDate` bằng thuật toán diff, chặn gỡ linh kiện đang sửa mở.

### 3.5 Màn hình Bàn giao (`/assignments`) — Luân chuyển 1 bước & Biên bản PDF
- **FR-ASG-01..03:** Gán mới (chặn trùng active), Sửa (`rowVersion`), Thu hồi (giữ lịch sử), Xóa (`admin`), **Luân chuyển 1 bước (`Khoa A → Khoa B`)** trong 1 Transaction, và **In Biên bản Bàn giao / Thu hồi (DOCX → PDF)** qua LibreOffice.

### 3.6 Màn hình Sửa chữa & Xuất PDF (`/repairs`)
- **FR-REP-01..04:** Hỗ trợ **nhiều linh kiện (tối đa 20)** qua `RepairHardwareUnits`, badge Bảo hành, tự động điền tên người ký mặc định từ `SystemSettings` & gợi ý nhân sự theo `it_department_code`, xuất 2 mẫu PDF chuẩn Khoa/Phòng tại ngày hỏng + gộp nhiều linh kiện bằng `STRING_AGG` qua hàng đợi 2 slot.

### 3.7 Module Mới: Quản lý Máy in, Phiếu nhập Mực & Bơm mực (`/printer-ink` — Phase 7)
- **FR-PRT-01..03:** Nhận diện qua `DeviceTypes.isPrinter = 1`, 1-click ghi nhận Bơm/Thay mực (`pageCounter`), bộ đếm tính lại từ nhật ký theo ngưỡng `SystemSettings`, Phiếu nhập kho đơn giản (`receiptCode` duy nhất), sổ cái `PrinterStockMovements`, cho phép tồn âm tô đỏ, hủy mềm kèm lý do.

---

## 4. Yêu cầu Phi chức năng, Quy tắc Dùng chung & Quyết định Đã Chốt

### 4.1 Yêu cầu Phi chức năng (NFR)
| Mã | Yêu cầu | Tiêu chí nghiệm thu |
|---|---|---|
| NFR-01 | Hiệu năng | 100–200 người dùng thao tác: p95 API danh sách/báo cáo **< 500 ms**, 0 lỗi 5xx (`ARCHITECTURE.md` 2.6) |
| NFR-02 | Vận hành offline 100% | **0 request ra Internet/CDN** (kể cả Font tiếng Việt, Icons, QRCode, Swagger UI nội bộ) |
| NFR-03 | Sao lưu & Phục hồi | Backup hằng ngày + đã **thử restore thành công** ra `_DEV` trước Phase 1 |
| NFR-04 | Bảo mật | Checklist OWASP Top 10, `scrypt`, `HttpOnly` cookie + CSRF, `rowVersion`, `qltb_app` chỉ `EXECUTE`, `npm audit` sạch `high/critical` |
| NFR-05 | Truy vết | Mọi thao tác ghi có `AuditLogs` (gồm `appCode` + IP máy trạm thật), lưu 24 tháng |
| NFR-06 | Toàn vẹn dữ liệu | Số dòng 12 bảng lõi trước/sau migration bằng nhau (riêng `Sessions` dọn dòng hết hạn) |
| NFR-07 | Quan sát | Log xoay vòng theo ngày + `/api/v1/healthz` kiểm tra kết nối DB |
| NFR-08 | Tương thích ngược DB | Code EJS cũ (tag `pre-v3.0`) chạy trên DB DEV sau Phase 1 cho kết quả giống hệt trước migration |
| NFR-09 | Nghiệm thu nghiêm ngặt | Mọi Task & Phase đều có Báo cáo Nghiệm thu kèm ảnh chụp 3 vai trò, output script & runbook go-live |
| NFR-10 | Khả năng mở rộng đa WebApp | Thêm 1 WebApp mới chỉ cần thêm 1 module trong `server/src/modules/<app>/` + tái sử dụng `core/` & `client/src/design-system/` |

### 4.2 Định nghĩa Trạng thái Vận hành Thiết bị (`vw_DeviceCurrentStatus`)
Ưu tiên từ trên xuống: **Tạm ngưng** (`isInactive = 1`) → **Đang sửa** (phiếu `opened`/`in-progress`) → **Đang sử dụng** (bàn giao active) → **Trong kho chưa bàn giao**.

### 4.3 Ngoài phạm vi (Non-goals) của v3.0
- Không quản lý khấu hao tài sản cố định, quy trình đấu thầu/mua sắm.
- Không đồng bộ tự động với phần mềm kế toán/HIS (chỉ lưu `receiptCode` để đối chiếu thủ công).
- Không mở truy cập từ Internet ngoài mạng LAN bệnh viện.
- Không chạy PM2 cluster nhiều tiến trình (dùng `fork`, 1 tiến trình).

### 4.4 Toàn bộ Quyết định Đã Chốt (0 câu hỏi còn tồn đọng)
| # | Nội dung | Quyết định chính thức |
|---|---|---|
| 1 | Kiến trúc nền tảng | **Lộ trình B (v3.0):** Express 5 Modular API Server (`/api/v1/core/*`, `/api/v1/itam/*`) + ReactJS/Vite/TypeScript SPA 100% Offline LAN + Bộ UI/UX dùng chung BVĐKKV Long Khánh. |
| 2 | Phạm vi `viewer` | Xem toàn bộ dữ liệu toàn bệnh viện (không giới hạn theo Khoa/Phòng). |
| 3 | Lộ trình HTTP → HTTPS trên IIS | Giai đoạn 1 chạy **HTTP trong LAN (`COOKIE_SECURE=false`)**; sau ổn định triển khai chứng chỉ CA nội bộ trên IIS và bật `COOKIE_SECURE=true`. |
| 4 | Ngưỡng cảnh báo & người ký | Cấu hình động qua `dbo.SystemSettings` (mặc định 3 lần/Drum, 5 lần/Hộp mực, 30 ngày bảo hành, `it_department_code = 'PCNTT'`). |
| 5 | Trạng thái `Repairs.status` | 4 giá trị chuẩn: `('opened', 'in-progress', 'completed', 'canceled')`. |
| 6 | Tương thích ngược | Tầng DB/SP tương thích ngược 100% với bản EJS cũ (`pre-v3.0`); tầng API/SPA mới thống nhất 100% theo chuẩn REST `/api/v1/*`. |
