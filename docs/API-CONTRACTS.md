# 3b. API-CONTRACTS.md — Đặc tả Giao ước REST API Server Đa-WebApp (`/api/v1/*`)

> **Dự án:** Hệ thống Quản lý Thiết bị CNTT (`QuanLyThietBiCNTT`) — Nền tảng REST API Server BVĐKKV Long Khánh  
> **Phiên bản:** 3.0 (**Lộ trình B**: Chuẩn hóa toàn bộ API dưới `/api/v1/core/*` dùng chung đa-WebApp và `/api/v1/itam/*` cho nghiệp vụ QLTB CNTT; hỗ trợ SPA React + SSO Cookie/CSRF + OpenAPI 3.1; hướng dẫn mở rộng cho WebApp tương lai)  
> **Cập nhật lần cuối:** 2026-11-20  
> **Xem thay đổi chi tiết tại:** `CHANGELOG.md` mục `[3.0.0-plan]`

---

## 1. Quy ước Chung của API Server Platform

### 1.1 Quy tắc Định danh & Phân vùng URL (`/api/v1/<domain>/<resource>`)
Mọi endpoint API đều **thuần JSON (hoặc binary stream cho PDF/CSV)**, không trả HTML:
- **`/api/v1/healthz`:** Kiểm tra sức khỏe API Server & kết nối SQL Server (Public).
- **`/api/v1/core/*`:** Các tài nguyên lõi **dùng chung cho mọi WebApp bệnh viện** (`auth`, `accounts`, `departments`, `users`, `settings`, `audit-logs`).
- **`/api/v1/itam/*`:** Toàn bộ tài nguyên của dự án Quản lý Thiết bị CNTT hiện tại (`dashboard`, `device-types`, `devices`, `hardware-types`, `hardwares`, `hardware-units`, `device-hardware`, `assignments`, `repairs`, `printer-ink`).
- **`/api/v1/<future-app>/*`:** Quy ước cắm thêm các WebApp sau này (vd `/api/v1/reports/*`, `/api/v1/helpdesk/*`) mà không ảnh hưởng `core` hay `itam`.
- **Thứ tự đăng ký route:** mọi route tĩnh/sub-resource (`/dropdown`, `/export`, `/import/*`, `/ungrouped`, `/summary`, `/reports/*`) luôn đăng ký **trước** `/:id`.
- **Chuẩn REST thống nhất 100%:** `GET /` (danh sách phân trang), `GET /dropdown`, `GET /:id`, `POST /`, `PUT /:id`, `PATCH /:id/<action>`, `DELETE /:id`. *(Không còn dùng các đường dẫn legacy `/ajax`, `/:id/update`, `/:id/delete` trên API Server v3.0 mới.)*

### 1.2 Envelope JSON Chuẩn (`server/src/shared/apiResponse.js`)
- **Danh sách phân trang (`GET /api/v1/<domain>/<resource>`):**
  ```json
  {
    "success": true,
    "message": "OK",
    "data": [],
    "meta": {
      "pagination": { "page": 1, "limit": 20, "totalItems": 410, "totalPages": 21 },
      "filters": {}
    }
  }
  ```
  *(Giới hạn `limit` tối đa `100`, mặc định `20`; danh mục dropdown không phân trang trả `data: [...]`.)*
- **Chi tiết / Tạo / Cập nhật / Xóa:** `{ "success": true, "message": "...", "data": { ... } }`.
- **Lỗi (mọi 4xx / 5xx):**
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Dữ liệu đầu vào không hợp lệ",
      "details": [{ "field": "code", "message": "Mã thiết bị không được để trống" }]
    }
  }
  ```

### 1.3 Bảng Mã Lỗi HTTP Chuẩn
| HTTP | `error.code` | Nguồn phát sinh | Hành xử chuẩn tại React `apiClient.ts` |
|---|---|---|---|
| `400` | `VALIDATION_ERROR` | `validate` middleware (`zod`) hoặc SQL `THROW 50001` | Hiển thị lỗi inline dưới đúng trường nhập liệu theo `error.details` |
| `401` | `UNAUTHENTICATED` | `requireAuth` (hết phiên / chưa đăng nhập / tài khoản vừa bị khóa) | Xóa trạng thái auth client & chuyển về `/login?next=<currentPath>` |
| `403` | `FORBIDDEN` | `requireRole` hoặc thiếu/sai `X-CSRF-Token` | Hiện Toast cảnh báo không đủ quyền (hoặc tự refresh CSRF nếu hết hạn CSRF) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | `enforcePasswordChange` (`mustChangePassword = 1`) | Tự động mở Modal ép đổi mật khẩu không cho đóng |
| `404` | `NOT_FOUND` | SQL `THROW 50004` hoặc không tìm thấy route API | Thông báo bản ghi không tồn tại |
| `409` | `BUSINESS_RULE_VIOLATION` | SQL `THROW 50009` hoặc Unique Key (`2627`/`2601`) | Hiện thông báo rõ lý do nghiệp vụ (vd: trùng mã, đang có phiếu sửa mở) |
| `409` | `CONCURRENT_MODIFICATION` | SQL `THROW 50010` (lệch `rowVersion`) | Hiện hộp thoại cảnh báo dữ liệu vừa được người khác cập nhật → nút Tải lại |
| `429` | `TOO_MANY_REQUESTS` | `rateLimiter` hoặc hàng đợi LibreOffice PDF đầy (> 20 job) | Thông báo tạm thời quá tải, thử lại sau |
| `500` | `INTERNAL_ERROR` | `errorHandler` (**ẩn 100% `err.stack` và chi tiết SQL**) | Hiện thông báo chung thân thiện + mã tham chiếu log (`requestId`) |

### 1.4 Quy ước Bảo mật SPA, `rowVersion`, `Idempotency-Key` & Xuất File
- **Cookie + CSRF cho SPA:**
  - Frontend luôn gửi `credentials: 'include'` (`withCredentials: true`).
  - Khi ứng dụng khởi động, gọi `GET /api/v1/core/auth/csrf` lấy `{ csrfToken }` (lưu trong bộ nhớ RAM của JS, không lưu `localStorage`), và gắn Header `X-CSRF-Token` cho mọi `POST / PUT / PATCH / DELETE`.
- **Chống ghi đè đồng thời (`rowVersion`):** `Devices`, `Repairs`, `DeviceAssignments` gửi `rowVersion` (chuỗi base64) trong body của `PUT` / `POST .../transfer`.
- **Chống bấm đúp (`Idempotency-Key`):** Header `Idempotency-Key: <uuid>` bắt buộc cho `POST /api/v1/itam/devices/import/commit`, `POST /api/v1/itam/printer-ink/receipts`, và `POST /api/v1/itam/printer-ink/logs` (lưu cache khóa trong 5 phút trên server để trả lại kết quả cũ nếu bấm đúp).
- **Xuất CSV & PDF:** CSV sinh phía server qua `server/src/shared/csv.js` (`Content-Type: text/csv; charset=utf-8`, BOM UTF-8, chống formula injection); PDF trả `Content-Type: application/pdf` (`Content-Disposition: inline; filename="..."`).
- **Tài liệu OpenAPI 3.1:** Mọi endpoint mới/sửa phải cập nhật đồng bộ vào `server/docs/openapi.yaml` để các WebApp/Mobile client về sau tra cứu chuẩn xác 100%.

---

## 2. Đặc tả Endpoint Nhóm Lõi Dùng Chung (`/api/v1/core/*` & `/api/v1/healthz`)

### 2.1 Sức khỏe & Xác thực / SSO (`/api/v1/healthz`, `/api/v1/core/auth/*`)
| Method | Endpoint | Quyền | Request | Response `data` / Ghi chú |
|---|---|---|---|---|
| `GET` | `/api/v1/healthz` | Public | — | `{ status: "ok", db: "connected", timestamp }` |
| `GET` | `/api/v1/core/auth/csrf` | Public | — | `{ csrfToken }` (khởi tạo token CSRF cho phiên hiện tại) |
| `GET` | `/api/v1/core/auth/me` | `requireAuth` | — | `{ account: { id, username, fullName, role, deptName, mustChangePassword, apps: ['itam'] } }` |
| `POST` | `/api/v1/core/auth/login` | Public (+ RateLimit 20/15m) | `{ username, password }` | Thông báo sai luôn chung; khóa 15p sau 5 lần sai; `session.regenerate()`; trả `{ account, csrfToken }` |
| `POST` | `/api/v1/core/auth/logout` | `requireAuth` | — | Hủy phiên `dbo.Sessions` + xóa cookie `bv_lk.sid` |
| `POST` | `/api/v1/core/auth/change-password` | `requireAuth` | `{ currentPassword, newPassword }` | Đổi mật khẩu (`≥ 8` ký tự), đặt `mustChangePassword = 0` |

### 2.2 Tài khoản, Khoa/Phòng, Nhân sự, Cấu hình & Nhật ký (`/api/v1/core/*`)
| Method | Endpoint | Quyền | Ghi chú |
|---|---|---|---|
| `GET` | `/api/v1/core/accounts` | `admin` | Danh sách phân trang (`?page=&limit=&search=&role=&isLocked=`) |
| `POST` | `/api/v1/core/accounts` | `admin` | Tạo tài khoản (gắn tối đa 1 `userId`), trả mật khẩu tạm **1 lần duy nhất** |
| `PUT` | `/api/v1/core/accounts/:id` | `admin` | Sửa `fullName`, `role`, `userId` |
| `PATCH` | `/api/v1/core/accounts/:id/toggle-lock` | `admin` | Khóa / Mở khóa (hiệu lực ngay vì không cache session RAM) |
| `PATCH` | `/api/v1/core/accounts/:id/unlock` | `admin` | Gỡ khóa tạm do đăng nhập sai 5 lần |
| `POST` | `/api/v1/core/accounts/:id/reset-password` | `admin` | Sinh mật khẩu tạm hiện 1 lần, đặt `mustChangePassword = 1` |
| `GET` | `/api/v1/core/departments` | `viewer` | Phân trang (`?page=&limit=&code=&name=&note=&isInactive=`) |
| `GET` | `/api/v1/core/departments/dropdown` | `viewer` | `?includeId=` — Danh sách active cho Select |
| `POST/PUT/PATCH/DELETE` | `/api/v1/core/departments[/:id][/toggle]` | `admin` | CRUD đầy đủ danh mục Khoa/Phòng dùng chung |
| `GET` | `/api/v1/core/users/dropdown` | `viewer` | `?deptCode=&includeId=` — Danh sách nhân sự dùng chung (mặc định lọc phòng CNTT khi truyền `deptCode=PCNTT` hoặc từ `SystemSettings`) |
| `GET` | `/api/v1/core/settings` | `admin` | `?appCode=` — Lấy toàn bộ cấu hình trong `dbo.SystemSettings` |
| `PUT` | `/api/v1/core/settings` | `admin` | `{ settings: [{ key, value }] }` — Cập nhật hàng loạt & xóa cache |
| `GET` | `/api/v1/core/audit-logs` | `admin` | Phân trang (`?page=&limit=&appCode=&username=&action=&entityType=&startDate=&endDate=`) |

---

## 3. Đặc tả Endpoint Module Quản lý Thiết bị CNTT (`/api/v1/itam/*`)

### 3.1 Dashboard & Trung tâm Báo cáo Đa chiều (`/api/v1/itam/dashboard/*`)
| Method | Endpoint | Quyền | Request Query | Response `data` |
|---|---|---|---|---|
| `GET` | `/api/v1/itam/dashboard/summary` | `viewer` | — | `{ kpi: { totalDevices, assignedDevices, availableDevices, activeRepairs, inactiveDevices, monthlyRefills, expiringWarranties }, devicesByType, pendingRepairs, printerWarnings }` |
| `GET` | `/api/v1/itam/dashboard/reports/device-usage` | `viewer` | `?deptId=&deviceTypeId=&usageStatus=&startDate=&endDate=` | `{ summaryByDeptAndType, items }`, `meta.truncated` |
| `GET` | `/api/v1/itam/dashboard/reports/device-usage/export` | `viewer` | (như trên) | Stream file CSV UTF-8 BOM |
| `GET` | `/api/v1/itam/dashboard/reports/repairs` | `viewer` | `?startDate=&endDate=&deviceTypeId=&deptId=&status=&technicianId=` | `{ kpi: { totalTickets, completedTickets, totalHours, totalEstimatedCost }, summaryByType, summaryByDept, items }`, `meta.truncated` |
| `GET` | `/api/v1/itam/dashboard/reports/repairs/export` | `viewer` | (như trên) | Stream file CSV UTF-8 BOM |
| `GET` | `/api/v1/itam/dashboard/reports/printer-ink` *(Phase 7)* | `viewer` | `?startDate=&endDate=&deptId=&supplyType=` | `{ summaryByDept, summaryBySupply, items }` |
| `GET` | `/api/v1/itam/dashboard/reports/printer-ink/export` *(Phase 7)* | `viewer` | (như trên) | Stream file CSV UTF-8 BOM |

### 3.2 Danh mục Loại Thiết bị & Cụm Linh kiện (`/api/v1/itam/*`)
- **`/api/v1/itam/device-types`:** `GET /`, `GET /dropdown?includeId=`, `POST /`, `PUT /:id`, `PATCH /:id/toggle`, `DELETE /:id` *(ghi chỉ `admin`, hỗ trợ cờ `isPrinter`)*.
- **`/api/v1/itam/hardware-types` & `/api/v1/itam/hardwares`:** `GET /`, `GET /dropdown?includeId=`, `POST /`, `PUT /:id`, `PATCH /:id/toggle` (`technician`), `DELETE /:id` (`admin`).
- **`/api/v1/itam/hardware-units`:** `GET /`, `GET /dropdown`, `POST /`, `PUT /:id`, `PATCH /:id/toggle` (`technician`), `DELETE /:id` (`admin`); `serialNumber` tùy chọn, `code` tự sinh nếu trống (tối đa 60 ký tự), hỗ trợ `warrantyDate`, trả kèm `assignedDeviceCode`, `assignedDeviceName`, `warrantyStatus`.
- **`/api/v1/itam/device-hardware`:** `GET /`, `GET /devices/ungrouped`, `GET /hardware-units/available`, `GET /:deviceId/assigned`, `PUT /:deviceId` (`technician`, thuật toán diff bảo toàn `attachedDate`), `DELETE /:deviceId/units/:hardwareUnitId` (`technician`, soft-detach, chặn nếu đang sửa mở → `409`).

### 3.3 Thiết bị (`/api/v1/itam/devices/*`) — Quick Config, Clone, Import CSV & Hồ sơ 360°
| Method | Endpoint | Quyền | Request Body / Query | Ghi chú |
|---|---|---|---|---|
| `GET` | `/api/v1/itam/devices` | `viewer` | `?page=&limit=&code=&name=&deviceTypeId=&deptId=&usageStatus=&warrantyStatus=&startDate=&endDate=` | Trả kèm `currentDeptId`, `currentDeptName`, `usageStatus`, `isUnderRepair`, `warrantyDate`, `warrantyStatus`, `hardwareSummary`, `rowVersion` |
| `GET` | `/api/v1/itam/devices/dropdown` | `viewer` | `?availableForAssign=&includeId=` | Danh sách thiết bị cho Select |
| `GET` | `/api/v1/itam/devices/import/template` | `technician` | — | Tải file CSV mẫu UTF-8 BOM |
| `POST` | `/api/v1/itam/devices/import/preview` | `technician` | `{ csvText }` (tối đa 500 dòng/lần) | Dry-run kiểm tra từng dòng: `{ totalRows, validRows, errorRows }` |
| `POST` | `/api/v1/itam/devices/import/commit` | `technician` | `{ rows: [...] }` + Header `Idempotency-Key` | Nhập hàng loạt trong 1 SQL Transaction |
| `GET` | `/api/v1/itam/devices/:id/profile-360` | `viewer` | — | Trả 5 nhóm: `{ device, hardwareUnits, assignments, repairs, printerLogs }` (dùng cho Hồ sơ 360°, quét QR & Clone 1-Click) |
| `POST` | `/api/v1/itam/devices` | `technician` | `{ code, name, deviceTypeId, purchaseDate, warrantyDate?, note, deptId?, hardwareItems?: [{ hardwareId, qty }] }` | Trả `{ id, createdUnits, rowVersion, warnings }` |
| `PUT` | `/api/v1/itam/devices/:id` | `technician` | (như trên + `rowVersion`) | Chỉ bổ sung linh kiện thiếu, không tự gỡ |
| `PATCH` | `/api/v1/itam/devices/:id/toggle` | `technician` | `{ rowVersion }` | Đổi `isInactive` |
| `DELETE` | `/api/v1/itam/devices/:id` | `admin` | — | Xóa an toàn (`409` nếu có ràng buộc) |

### 3.4 Bàn giao (`/api/v1/itam/assignments/*`) — Luân chuyển 1 Bước & Biên bản PDF
| Method | Endpoint | Quyền | Request Body / Query | Ghi chú |
|---|---|---|---|---|
| `GET` | `/api/v1/itam/assignments` | `viewer` | `?page=&limit=&deviceName=&deptId=&status=` | Trả danh sách kèm `rowVersion` |
| `POST` | `/api/v1/itam/assignments` | `technician` | `{ deviceId, deptId, startDate, note }` | Chặn gán trùng active (`409`) |
| `PUT` | `/api/v1/itam/assignments/:id` | `technician` | `{ deptId, startDate, endDate, note, rowVersion }` | Kiểm `rowVersion` |
| `PATCH` | `/api/v1/itam/assignments/:id/revoke` | `technician` | `{ endDate?, note?, rowVersion }` | Thu hồi giữ lịch sử |
| `POST` | `/api/v1/itam/assignments/:id/transfer` | `technician` | `{ newDeptId, transferDate, note, rowVersion }` | Đóng bàn giao cũ & mở bàn giao mới trong 1 Transaction |
| `GET` | `/api/v1/itam/assignments/:id/reports/handover/pdf` | `viewer` | — | Xuất PDF Biên bản Bàn giao qua LibreOffice Queue |
| `GET` | `/api/v1/itam/assignments/:id/reports/revoke/pdf` | `viewer` | — | Xuất PDF Biên bản Thu hồi qua LibreOffice Queue |
| `DELETE` | `/api/v1/itam/assignments/:id` | `admin` | — | Xóa bản ghi nhập sai |

### 3.5 Sửa chữa (`/api/v1/itam/repairs/*`)
- `GET /api/v1/itam/repairs` (`viewer`), `GET /:id` (`viewer`), `POST /` (`technician`, nhận `hardwareUnitIds: number[]` tối đa 20), `PUT /:id` (`technician`, kèm `rowVersion`), `DELETE /:id` (`technician`/`admin`, chỉ xóa phiếu `opened`).
- `GET /api/v1/itam/repairs/:id/report-detail` (`viewer` — tự điền tên người ký mặc định từ `SystemSettings` nếu phiếu mới chưa lưu), `PUT /api/v1/itam/repairs/:id/report-detail` (`technician`).
- `GET /api/v1/itam/repairs/:id/reports/request/pdf` & `.../inspection/pdf` (`viewer` — hàng đợi 2 slot, đầy → `429`, nối nhiều linh kiện bằng `STRING_AGG`).

### 3.6 Máy in, Phiếu nhập Mực & Bơm mực (`/api/v1/itam/printer-ink/*` — Phase 7)
- `GET /printers`, `PUT /printers/:deviceId/profile` (`technician`).
- `GET /logs`, `POST /logs` (`technician`, `Idempotency-Key`, `pageCounter?`, trừ tồn mềm), `PATCH /logs/:id/cancel` (`technician`, `{ reason }` bắt buộc).
- `GET /stats/by-department` (`viewer`).
- `GET /supplies`, `GET /supplies/dropdown`, `POST /supplies`, `PUT /supplies/:id` *(không nhận `stockQuantity`)*, `PATCH /supplies/:id/toggle` (`technician`).
- `GET /receipts`, `POST /receipts` (`technician`, `receiptCode` duy nhất, `Idempotency-Key`), `PATCH /receipts/:id/cancel` (**chỉ `admin`**, `{ reason }` bắt buộc).

---

## 4. Quy chuẩn Mở rộng API cho các WebApp Bệnh viện Tương lai

Khi bổ sung 1 WebApp mới (ví dụ **WebApp Báo cáo CĐHA / Lâm sàng / TCKT** với `appCode = 'reports'`):
1. Đăng ký prefix riêng `/api/v1/reports/*` trong `server/src/modules/reports/`.
2. Tái sử dụng 100% `/api/v1/core/auth/*` (SSO), `/api/v1/core/departments/dropdown`, `/api/v1/core/users/dropdown`, `apiResponse`, `AppError`, `validate (zod)`, `csv.js`, `docxReportService.js` và `auditLogService.log({ appCode: 'reports', ... })`.
3. Tuân thủ đúng Envelope JSON (Mục 1.2), Bảng Mã Lỗi (Mục 1.3) và ghi nhận endpoint vào `server/docs/openapi.yaml`.
