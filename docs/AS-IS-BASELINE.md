# 7. AS-IS-BASELINE.md — Hiện trạng Thực tế của Hệ thống (DB + Code)

> **Dự án:** Hệ thống Quản lý Thiết bị CNTT (`QuanLyThietBiCNTT`)  
> **Phiên bản:** 1.1 (Số liệu hiện trạng 100% xác minh từ DB/code thật; đồng bộ cột Quyết định chốt G1/G7/G8/G10/G17 theo **Lộ trình B v3.0**: `server/` Modular API + `client/` React/Vite Offline SPA)  
> **Cập nhật lần cuối:** 2026-11-20  
> **Trạng thái:** ☑ Đã hoàn tất khảo sát hiện trạng (Code + Schema + Preflight); chờ hoàn thành T0.1 (tạo DB `_DEV` & tag `pre-v3.0`) trước khi chạy migration Phase 1.

> [!CAUTION]
> **Tài liệu này mô tả cái ĐANG CÓ, không phải cái sẽ làm.**
> - Mọi số liệu, kiểu cột, tên constraint, danh sách route và SP dưới đây đều được xác minh trực tiếp từ source code trong repo và truy vấn chỉ đọc trên SQL Server ngày `2026-11-20`.
> - Không ghi IP, mật khẩu hoặc tên login thật của SQL Server vào tài liệu (`PROJECT-RULES.md` 4.1).

---

## 0. Nguồn dữ liệu & Mức tin cậy

| Ký hiệu | Ý nghĩa |
|---|---|
| ☑ | **Đã xác minh trực tiếp** từ source code trong repo và/hoặc truy vấn chỉ đọc trên SQL Server (2026-11-20) |
| ☐ | **Thao tác triển khai môi trường DEV** cần người dùng thực hiện ở Task T0.1 |

**Thứ tự ưu tiên khi các nguồn mâu thuẫn (về hiện trạng):** code thật > file này > `project_context.md`.

---

## 1. Môi trường & Điều kiện tiên quyết

| Hạng mục | Giá trị đã xác minh | Mức |
|---|---|---|
| Nền tảng ứng dụng | Node.js `v24.21.0`, **Express `^5.1.0`**, ES Modules (`"type": "module"`), `mssql ^11.0.1`, `express-session ^1.18.1`, `connect-mssql ^1.5.0` *(cài trong `package.json` nhưng không import; dùng `utils/sessionStore.js` tự viết)*, `method-override ^3.0.0`, `dotenv ^17.1.0`, `ejs ^3.1.10`, `axios ^1.10.0`, `body-parser ^2.2.0`, `docxtemplater ^3.68.7`, `pizzip ^3.2.0` | ☑ |
| Triển khai hiện tại | IIS Reverse Proxy (`web.config` đang khai báo chồng chéo handler `iisnode` với `maxConcurrentRequests="1"` + URL Rewrite Proxy về `localhost:3000`) và PM2 (`ecosystem.config.cjs`, `exec_mode: "fork"`, `instances: 1`, `App_Base_Path: "/QuanLyThietBiCNTT"`, **hiện đang chứa mật khẩu DB plaintext — phải chuyển sang `.env` ở T2.1/T2.5**) | ☑ |
| Phiên bản SQL Server & compatibility level | **Microsoft SQL Server 2019 (RTM) - 15.0.2000.5 (X64) Developer Edition**, `compatibility_level = 140` (hỗ trợ đầy đủ `CREATE OR ALTER`, `STRING_AGG`, `STRING_SPLIT`, `Filtered Unique Index`, `Table-Valued Parameters`) | ☑ |
| Tên DB Production | `QuanLyThietBiCNTT` | ☑ |
| DB DEV (`QuanLyThietBiCNTT_DEV`) & Restore backup | Chưa khởi tạo — thực hiện ở Task `T0.1` | ☐ |
| Login `qltb_migrator` & `qltb_app` trên DEV | Chưa tạo — thực hiện ở Task `T0.1` | ☐ |
| LibreOffice trên máy phát triển local | Không cài tại đường dẫn mặc định `C:\Program Files\LibreOffice\program\soffice.exe` trên máy dev hiện tại (cài trên máy chủ chạy Node/Production theo `LIBREOFFICE_PATH`) | ☑ |
| Git & Tag `pre-v2.6` | Repo có thư mục `.git`; cần tạo tag `pre-v2.6` & nhánh `feature/v2.6` ở Task `T0.1` | ☐ |

---

## 2. Cơ sở dữ liệu hiện trạng (Xác minh trực tiếp từ `sys.tables`, `sys.columns`, `sys.procedures`)

### 2.1 Danh sách 12 Bảng hiện hữu & Số dòng thực tế (Mốc NFR-06)

| STT | Bảng | Số dòng (2026-11-20) | Cột chính & Kiểu dữ liệu thật | Mức |
|---|---|---|---|---|
| 1 | `dbo.Departments` | **41** | `id INT IDENTITY PK`, `code VARCHAR(10) UQ`, `name NVARCHAR(200)`, `note NVARCHAR(200) NULL`, `isInactive BIT DEFAULT(0)` | ☑ |
| 2 | `dbo.DeviceTypes` | **6** | `id INT IDENTITY PK`, `code VARCHAR(10) UQ`, `name NVARCHAR(200)`, `note NVARCHAR(200) NULL`, `isInactive BIT DEFAULT(0)` *(1: `IN` Máy In, 2: `MT` Máy tính, 6: `SCAN` Máy Scan, 9: `MB` Máy bộ, 13: `QR` Máy quét QR, 14: `TB` Máy tính bảng)* | ☑ |
| 3 | `dbo.Devices` | **410** | `id INT IDENTITY PK`, `code VARCHAR(50) NULL UQ`, `name NVARCHAR(200)`, `deviceTypeId INT FK`, `purchaseDate DATETIME`, `note NVARCHAR(200) NULL`, `isInactive BIT DEFAULT(0)` | ☑ |
| 4 | `dbo.HardwareTypes` | **8** | `id INT IDENTITY PK`, `code VARCHAR(10) UQ`, `name NVARCHAR(200)`, `note NVARCHAR(200) NULL`, `isInactive BIT DEFAULT(0)` *(MA, CPU, RAM, HDD, SSD, M2, NGUON, CARD)* | ☑ |
| 5 | `dbo.Hardwares` | **121** | `id INT IDENTITY PK`, `code VARCHAR(10) UQ`, `name NVARCHAR(200)`, `hardwareTypeId INT FK`, `note NVARCHAR(200) NULL`, `isInactive BIT DEFAULT(0)` | ☑ |
| 6 | `dbo.HardwareUnits` | **2.154** | `id INT IDENTITY PK`, `code VARCHAR(30) UQ`, `hardwareId INT FK`, `serialNumber VARCHAR(100) NOT NULL UQ`, `purchaseDate DATETIME`, `note NVARCHAR(200) NULL`, `isInactive BIT DEFAULT(0)`, `warrantyDate DATETIME NULL` | ☑ |
| 7 | `dbo.Devices_HardwareUnits` | **2.123** | `id INT IDENTITY PK`, `deviceId INT FK`, `hardwareUnitId INT FK UQ`, `isInactive BIT DEFAULT(0)` | ☑ |
| 8 | `dbo.DeviceAssignments` | **415** | `id INT IDENTITY PK`, `deviceId INT FK`, `deptId INT FK`, `startDate DATETIME`, `endDate DATETIME NULL`, `note NVARCHAR(200) NULL`, `isInactive BIT DEFAULT(0)` | ☑ |
| 9 | `dbo.Repairs` | **0** | `id INT IDENTITY PK`, `deviceId INT FK`, `hardwareUnitId INT NULL FK`, `brokenDate DATETIME`, `repairDate DATETIME NULL`, `note NVARCHAR(200) NULL`, `isInactive BIT DEFAULT(0)`, `status VARCHAR(11) NULL`, `userCreateName NVARCHAR(100) NULL`, `userResolveId INT NULL` *(chưa có FK cứng tới Users)* | ☑ |
| 10 | `dbo.RepairReportDetails` | **0** | `id INT IDENTITY PK`, `repairId INT UQ FK`, `deviceUseDate DATE`, `damageDescription NVARCHAR(1000)`, `surveyResult NVARCHAR(1000)`, `surveyPerson1..3Name NVARCHAR(100)`, `surveyPerson1..3Date DATE`, `repairMethod NVARCHAR(20)`, `expectedRepairHours DECIMAL(10,2)`, `expectedStartTime/EndTime NVARCHAR(50)`, `estimatedCost DECIMAL(18,0)`, `actualRepairHours DECIMAL(10,2)`, `actualStartTime/EndTime NVARCHAR(50)`, `repairResult NVARCHAR(20)`, `repairResultOther NVARCHAR(255)`, `repairContent NVARCHAR(1000)`, `operationStatus NVARCHAR(20)`, `acceptanceResult NVARCHAR(20)`, `acceptanceNote NVARCHAR(1000)`, `departmentRepresentativeName/financeDeptHeadName/adminDeptHeadName/directorName/repairTechnicianName/itRepresentativeName NVARCHAR(100)`, `createdAt DATETIME`, `updatedAt DATETIME` | ☑ |
| 11 | `dbo.Users` | **11** | `Id INT PK` *(không Identity)*, `code VARCHAR(10)`, `name NVARCHAR(50)`, `deptId INT FK` *(cả 11 nhân sự đều thuộc `deptId = 295`, mã `PCNTT`)*, `IsInactive BIT` | ☑ |
| 12 | `dbo.Sessions` | **4.277** | `sid VARCHAR(255) PK`, `sess NVARCHAR(MAX)`, `expire DATETIME` *(4.277 dòng đều đã hết hạn, 0 phiên active)* | ☑ |

*(Lưu ý: Toàn bộ 11 Foreign Keys hiện có đều đặt `ON DELETE NO ACTION / ON UPDATE NO ACTION`, không dùng CASCADE. Hiện chưa có Non-Clustered Index nào ngoài PK và Unique Constraints.)*

### 2.2 Giải đáp toàn bộ Câu hỏi Kỹ thuật từ Dữ liệu thật

| Câu hỏi | Trả lời đã xác minh | Mức |
|---|---|---|
| `RepairReportDetails` có đủ cột cho báo cáo không? | **Có:** `actualRepairHours DECIMAL(10,2)`, `expectedRepairHours DECIMAL(10,2)`, `estimatedCost DECIMAL(18,0)`. Không có `repairHours`. FK `FK_RepairReportDetails_Repairs` dùng `NO_ACTION` (không CASCADE). | ☑ |
| `Repairs.status` dùng bộ giá trị nào? | Cả SP (`sp_Repairs_Create`, `sp_Repairs_Update`) và JS (`repairs.js`) thống nhất **4 giá trị:** `'opened'`, `'in-progress'`, `'completed'`, `'canceled'`. Hiện bảng `Repairs` có **0 dòng** → thêm `CHECK` an toàn 100%. | ☑ |
| `sp_DeviceHardwareUnits_Detach` & `UpdateAssigned` hiện xóa cứng hay mềm? | Hiện đang **xóa cứng** (`DELETE FROM Devices_HardwareUnits ...`). Tất cả SP đang chạy đọc `Devices_HardwareUnits` đều **đã lọc `isInactive = 0`** (riêng `sp_HardwareUnits_Delete` kiểm tra tồn tại bất kể `isInactive`, phù hợp quy tắc không xóa linh kiện có lịch sử). | ☑ |
| Tên chính xác Unique Constraints cần DROP trong Migration? | `HardwareUnits.serialNumber`: **`UQ__Hardware__3304A095C8A5BB0D`**; `Devices_HardwareUnits.hardwareUnitId`: **`UQ_Devices_Hardware_Unit`** (migration vẫn tra động theo catalog để an toàn trên mọi bản restore). | ☑ |
| Dữ liệu `warrantyDate` & `serialNumber` trong `HardwareUnits`? | **`2.154 / 2.154` (100%)** có `code = serialNumber`; **`2.153 / 2.154`** có `warrantyDate = '1900-01-01'` (chỉ 1 dòng có ngày bảo hành thật) → **bắt buộc làm sạch `'1900-01-01'` → `NULL`** ở migration `V003`. | ☑ |
| Phòng CNTT trong `Departments`? | `id = 295`, `code = 'PCNTT'`, `name = N'Phòng Công Nghệ Thông Tin'`. | ☑ |

### 2.3 Kết quả Preflight thực tế (2026-11-20)

| Mục | Kỳ vọng | Kết quả thực tế | Cần làm sạch? | Mức |
|---|---|---|---|---|
| 02 Số dòng bảng lõi | Ghi mốc NFR-06 | `Devices=410`, `HardwareUnits=2154`, `Devices_HardwareUnits=2123`, `DeviceAssignments=415`, `Departments=41`, `Users=11`, `Repairs=0` | — | ☑ |
| 03 Bàn giao active trùng | 0 dòng | **0 dòng** (`410` active sạch, `5` revoked sạch, `0` sai trạng thái) | Không | ☑ |
| 03b Bàn giao `endDate < startDate` | 0 dòng | **0 dòng** | Không | ☑ |
| 04 Giá trị `Repairs.status` | 4 giá trị chuẩn | `0` dòng (SP kiểm `opened / in-progress / completed / canceled`) | Không | ☑ |
| 05/05b Serial & `warrantyDate` | 05b: 0 trùng | `0` trùng Serial; **`2.153` dòng `warrantyDate = '1900-01-01'`** | **Có** (làm sạch `1900-01-01` → `NULL` ở `V003`) | ☑ |
| 05c Độ dài mã lớn nhất | Device ≤ 50, HW ≤ 10 | Device = `22`, Hardware = `10`, HardwareUnit = `23`, Dept = `10` | Không | ☑ |
| 06a/06b/06c `Devices_HardwareUnits` | 0 trùng / 0 mồ côi | `2.123` active, `0` inactive, `0` trùng | Không | ☑ |
| 07 Số phiếu sửa chữa backfill | Ghi mốc | **0 dòng** | Không | ☑ |
| 08 Loại thiết bị `code = 'IN'` | 1 dòng | **1 dòng** (`id = 1, code = 'IN', name = N'Máy In'`; hiện `0` thiết bị máy in) | Không | ☑ |
| 10 Bảng `Sessions` | Ít rác | **`4.277` dòng hết hạn, `0` active** | **Có** (dọn phiên hết hạn & tắt `saveUninitialized`) | ☑ |
| 11 SP tham chiếu bảng không tồn tại | Ghi nhận | **5 SP chết** tham chiếu bảng `DeviceHardwareUnits` (không có `_`): `sp_DeviceHardwareUnits_Create`, `_Update`, `_Delete`, `_GetAll`, `_GetByDevice` | Đưa vào danh sách dọn Phase 8 (`T8.5`) | ☑ |
| 12 Ứng viên SP backup / legacy | Ghi nhận | **10 SP backup** (`sp_*_Delete_20251226`, `sp_Devices_Delete@20251226`, `sp_DeviceAssignments_Get_BK20260107`) + **6 SP cũ không phân trang/không dùng** (`sp_Departments_GetAll`, `sp_DeviceAssignments_Get`, `sp_DeviceHardwareUnits_GetDevicesWithHardware`, `sp_Devices_HardwareUnits_Attach`, `sp_Devices_HardwareUnits_Detach`, `sp_Repairs_GetAll`) + `sp_CheckRecordReference` | Chỉ dọn ở Phase 8 (`T8.5`) sau khi grep xác nhận | ☑ |
| 13 SP có `QUOTED_IDENTIFIER OFF` | 0 dòng | **0 dòng** | Không | ☑ |
| 14 Mọi SP đọc `Devices_HardwareUnits` | Lọc `isInactive = 0` | Tất cả 7 SP active `sp_DeviceHardwareUnits_*` và 3 SP `sp_Repairs_*` đều đã lọc `isInactive = 0` | Không | ☑ |

---

## 3. Mã nguồn hiện trạng (Xác minh 100% từ source code thật)

### 3.1 Cây thư mục thực tế — ☑
```text
.env, .gitignore, README.md, CHANGELOG.md, index.js, package.json, package-lock.json, project_context.md, web.config, ecosystem.config.cjs
docs/         PRD, ARCHITECTURE, DATA-SCHEMA, API-CONTRACTS, PROJECT-RULES, UI-DESIGN, IMPLEMENTATION-PLAN, AS-IS-BASELINE (.md)
scripts/baseline/  export-schema.sql, preflight-checks.sql
controllers/  departmentController, deviceAssignmentController, deviceController, deviceHardwareUnitController,
              deviceTypeController, hardwareController, hardwareTypeController, hardwareUnitController,
              repairController, repairPrintController, repairReportController (.js)
db/           db.js
middleware/   errorHandler.js
routes/       assignment, department, device, deviceHardwareUnit, deviceType, hardware, hardwareType, hardwareUnit, repair (.js)
services/     departmentService, deviceAssignmentService, deviceHardwareUnitService, deviceService,
              deviceTypeService, docxReportService, hardwareService, hardwareTypeService, hardwareUnitService,
              repairPrintService, repairReportService, repairService (.js)
templates/repairs/  repair-inspection-template.docx, repair-request-template.docx
utils/        apiResponse, asyncHandler, cleanupTempReports, deletionGuard, pagination, sanitizeFilters, sessionStore (.js)
views/        home.ejs; partials/header.ejs; departments, device-assignments, device-hardware-units, deviceTypes,
              devices, hardwareTypes, hardwareUnits, hardwares, repairs (mỗi thư mục: index.ejs)
public/js/    assignments, departments, deviceHardwareUnits, deviceTypes, devices, hardwareTypes,
              hardwareUnits, hardwares, repairs, common/pagination (.js)
public/styles/main.css ; public/images/ (logo, nền bệnh viện, các icon PNG)
```

### 3.2 Bản đồ Module ↔ Route thật ↔ Frontend JS ↔ Stored Procedure — ☑

| Module | Route thật trong `routes/*.js` | Frontend JS hiện gọi | SP đang gọi trong `services/*.js` (và thứ tự recordset hiện tại) | Lỗi thật phát hiện trong code |
|---|---|---|---|---|
| `/departments` | `GET /`, `/ajax`; `POST /`; `PUT /:id` & `/:id/update`; `PATCH /:id/toggle` & `PUT /:id/toggle`; `DELETE /:id` & `/:id/delete` | Gọi legacy (`/:id/update`, `PUT /:id/toggle`, `/:id/delete`) | `sp_Departments_GetPaged` (`[0]=total, [1]=data`), `_Create`, `_Update`, `_ToggleStatus`, `_Delete` | Filter `code` gửi lên nhưng bị `departmentService` bỏ qua; `sp_Departments_GetPaged` thiếu `@pCodeSearch`; không escape HTML input |
| `/device-types` | Như `/departments` (cả REST + legacy) | Gọi legacy | `sp_DeviceTypes_GetAll` (`[0]=total, [1]=data`), `_Create`, `_Update`, `_ToggleStatus`, `_Delete` | Không escape HTML; nạp trùng Bootstrap 5.3.0 |
| `/devices` | Như `/departments` (cả REST + legacy) | Gọi legacy | `sp_Devices_GetPaged` (`[0]=total, [1]=data`), `_Create`, `_Update`, `_ToggleInactive`, `_Delete`, `sp_DeviceTypes_GetDropdown` | **Lỗi nghiêm trọng:** `deleteDeviceService` gọi `canDeleteRecord` với tên bảng sai `'DeviceHardwareUnits'` (thiếu `_`) → **chặn xóa mọi thiết bị**! Không escape HTML |
| `/hardware-types` | Như `/departments` (cả REST + legacy) | **ĐÃ gọi REST** (`PUT /:id`, `PATCH /:id/toggle`, `DELETE /:id`) | `sp_HardwareTypes_GetAll` (`[0]=total, [1]=data`), `_Create`, `_Update`, `_ToggleStatus`, `_Delete` | Nạp trùng Bootstrap 5.3.0 |
| `/hardwares` | Như `/departments` (cả REST + legacy) | **ĐÃ gọi REST** (`PUT /:id`, `PATCH /:id/toggle`, `DELETE /:id`) | `sp_Hardwares_GetAll` (`[0]=total, [1]=data`), `_Create`, `_Update`, `_ToggleStatus`, `_Delete` | **Lỗi nghiêm trọng:** `updateHardware(id)` không gửi `hardwareTypeId` trong khi controller bắt buộc → **cập nhật phần cứng luôn lỗi 400**! |
| `/hardware-units` | Như `/departments` (cả REST + legacy) | Gọi legacy | `sp_HardwareUnits_GetAll` (`[0]=total, [1]=data`), `_Create`, `_Update`, `_ToggleStatus`, `_Delete` | **`sp_HardwareUnits_Create`/`GetAll` khai báo `@pCode VARCHAR(10)`** làm cắt cụt mã >10 ký tự (cột là `VARCHAR(30)`); khởi tạo 10 Select2 trên dòng bảng gây lag |
| `/device-hardware` | `GET /`, `/ajax`, `/devices/ungrouped`, `/hardware-units/create`, `/hardware-units/edit`, `/:deviceId/assigned`; `PUT /:deviceId/update`; `DELETE /:deviceId/detach/:hardwareUnitId` | Khớp 100% | 7 SP active `sp_DeviceHardwareUnits_*` (`GetDevicesWithHardware_Paged` nhận `@pPage/@pLimit`, trả `[0]=count, [1]=data`) | `Detach`/`UpdateAssigned` đang xóa cứng, chưa chặn gỡ linh kiện đang sửa chữa mở |
| `/assignments` | `GET /`, `/ajax`, `/departments/ajax`, `/available-devices`; `POST /`; `PUT /:id`; `PUT /:id/revoke`; `DELETE /:id` | Khớp 100% | `sp_DeviceAssignments_Get_Paged` (`[0]=data, [1]=total`), `_Create`, `_Update`, `_Revoke`, `_Delete`, `sp_GetAllDepartments`, `sp_Devices_GetAssignable` | `sp_DeviceAssignments_Create` chưa chặn gán trùng active; chưa có nút Luân chuyển 1 bước |
| `/repairs` | `GET /`, `/ajax`, `/dropdown/{devices,hardware-units,users}`, `/report-detail/survey-users`, `/:id/report-detail`, `/:id/reports/{request,inspection}/pdf`, `/:id`; `POST /`, `/:id/report-detail`; `PUT /:id`; `DELETE /:id` | Khớp 100% | `sp_Repairs_GetAll_Paged` (`[0]=data, [1]=total`), `_GetById`, `_Create`, `_Update`, `_Delete`, `_GetAvailableDevices`, `_GetActiveUsers`, `_GetHardwareUnitsForCreate`, `_GetHardwareUnitsForEdit`, `_GetPrintDataById`, 4 SP `sp_RepairReportDetails_*` | `createRepair` gọi vòng lặp không transaction; **`sp_Repairs_GetPrintDataById` JOIN `DeviceAssignments` không lọc active → sai Khoa/Phòng khi in PDF**; hardcode `deptId = 295` |
| `/` (`home.ejs`) | `GET /` trong `index.js` | Không có JS | Không gọi SP | Chỉ có 1 dòng `<h2>🎉 Chào mừng đến Hệ thống Quản lý Thiết bị</h2>` |

### 3.3 Hạ tầng hiện trạng đã xác minh trong `index.js`, `db/db.js`, `web.config`, `ecosystem.config.cjs` — ☑
- **`index.js`:** Thiếu `express.json()`; `saveUninitialized: true`; hardcode `session secret` ngay trong code (cần chuyển sang `.env`); đặt `app.use(errorHandler)` ở dòng 90 **trước** `app.get('/')` và có error handler thứ 2 trùng lặp ở dòng 99; chưa có auth/CSRF/helmet/rate-limit/`trust proxy`.
- **`db/db.js`:** `pool.max = 10, min = 0`; đọc biến môi trường không kiểm tra thiếu.
- **`views/partials/header.ejs`:** Nạp toàn bộ Bootstrap 5.3.3, jQuery 3.6.0, Select2, SweetAlert2 từ CDN Internet; hardcode URL `/` không có `<%= basePath %>`; 6 view con nạp trùng thêm Bootstrap 5.3.0.
- **`web.config`:** Có `<add name="iisnode" .../>` với `maxConcurrentRequests="1"` chồng chéo với URL Rewrite Proxy `http://localhost:3000/{R:1}`.
- **`ecosystem.config.cjs`:** Chứa thông tin kết nối DB và mật khẩu plaintext.

---

## 4. Danh sách Chênh lệch (Gap List) — ĐÃ ĐỐI CHIẾU & CHỐT QUYẾT ĐỊNH (2026-11-20)

| # | Chênh lệch / Phát hiện thật | Quyết định chốt (v3.0 — Lộ trình B) | Task liên quan | Trạng thái |
|---|---|---|---|---|
| G1 | Bản EJS cũ có song song route REST và legacy trên 6 module | **v3.0:** API Server mới (`server/`) thống nhất 100% chuẩn REST `/api/v1/core/*` & `/api/v1/itam/*`; bản EJS cũ giữ nguyên tại tag `pre-v3.0` để rollback tức thì nếu cần | `API-CONTRACTS` v3.0; Phase 2A–7 | ☑ Đã chốt |
| G2 | Tên SP & thứ tự recordset hiện hữu không đồng nhất | Giữ tên/tham số/cột SP hiện hữu ở Phase 1 (tương thích ngược tuyệt đối với `pre-v3.0`); SP mới theo chuẩn `recordsets[0]=data, [1]=totalItems` | `DATA-SCHEMA` v3.0; T1.8–T1.14 | ☑ Đã chốt |
| G3 | Trong DB có 7 SP `sp_DeviceHardwareUnits_*` đang dùng VÀ 5 SP `sp_DeviceHardwareUnits_Create/Update/Delete/GetAll/GetByDevice` đã chết (gọi bảng không tồn tại) | Giữ & chuẩn hóa 7 SP đang dùng; chỉ đưa **đúng 5 SP chết + 10 SP backup `*_20251226`/`*_BK*` + 6 SP cũ không gọi** vào danh sách xem xét dọn ở Phase 8 (sau ≥ 2 tuần go-live) | T1.11, Gate 8 | ☑ Đã chốt |
| G4 | `sp_DeviceHardwareUnits_Detach`/`UpdateAssigned` hiện xóa cứng; mọi SP active đọc bảng này đều đã lọc `isInactive = 0` | Chuyển sang cơ chế lịch sử (`attachedDate`, `detachedDate`, `isInactive = 1`); `UpdateAssigned` dùng thuật toán **diff** (giữ nguyên dòng không đổi để không mất `attachedDate` cũ) | `DATA-SCHEMA` 2.2 #13; T1.4, T1.11 | ☑ Đã chốt |
| G5 | `RepairReportDetails` có `actualRepairHours`, `expectedRepairHours`, `estimatedCost` | Báo cáo sửa chữa dùng `COALESCE(actualRepairHours, expectedRepairHours)` và `estimatedCost`; không thêm cột mới | `DATA-SCHEMA` 2.3 #17; T1.14 | ☑ Đã chốt |
| G6 | Dự án không dùng `ON DELETE CASCADE` | Giữ nguyên nguyên tắc xóa con tường minh trong SP (`RepairHardwareUnits` → `RepairReportDetails` → `Repairs`) | `DATA-SCHEMA` 0.1 #9; T1.13 | ☑ Đã chốt |
| G7 | 6 view EJS cũ nạp trùng Bootstrap 5.3.0; `header.ejs` dùng CDN & hardcode đường dẫn không có `basePath` | **v3.0:** Thay toàn bộ bằng **`client/` React + Vite + TypeScript + Tailwind** đóng gói **100% offline** (Font WOFF2, `lucide-react`, `qrcode` trong `client/dist/`, 0 CDN) với `VITE_BASE_PATH` | T2.6–T2.8 | ☑ Đã chốt |
| G8 | Khóa legacy trong API response cũ | **v3.0:** API Server mới trả duy nhất 1 Envelope JSON chuẩn `{ success, message, data, meta, error }` | `API-CONTRACTS` 1.2; T2.3 | ☑ Đã chốt |
| G9 | `apiResponse.error` bản cũ chưa có tham số `code` | Xây dựng chuẩn hóa tại `server/src/shared/apiResponse.js` (`error: { code, message, details }`) | T2.3 | ☑ Đã chốt |
| G10 | Helper lõi ở bản cũ phân tán | Tổ chức tập trung sạch tại `server/src/shared/` và `client/src/shared/` + `client/src/design-system/` | Phase 2A–2B | ☑ Đã chốt |
| G11 | `Repairs.status` | Đã xác minh: `('opened', 'in-progress', 'completed', 'canceled')`, hiện 0 dòng | T1.5 | ☑ Đã chốt |
| G12 | Gán mới & thu hồi assignment chưa test sâu | Viết test tích hợp trước và sau sửa ở T6.2 | T6.2, T6.3 | ☑ Đã chốt |
| G13 | `MSSQLStore.initialize()` tự chạy `CREATE TABLE Sessions` gây lỗi với `qltb_app` | Đưa tạo bảng `Sessions` vào migration `V001`; `MSSQLStore` chỉ chạy CRUD không chạy DDL; dọn 4.277 phiên hết hạn | T1.1, T2.2 | ☑ Đã chốt |
| G14 | Chưa có auth; `ecosystem.config.cjs` lộ mật khẩu; `index.js` sai thứ tự `errorHandler` | Xây mới chuẩn bảo mật tại `server/` (SSO Cookie `bv_lk.sid` + CSRF + RBAC + RateLimit) & dọn sạch `ecosystem.config.cjs` | Phase 2A, T3.1–T3.2 | ☑ Đã chốt |
| G15 | `devices/ungrouped` chỉ liệt kê máy chưa có phần cứng | Chấp nhận; cấu hình thêm/bớt dùng Quick Config hoặc Tab Gán/Gỡ trong `/hardware` | `API-CONTRACTS` 3.2 | ☑ Đã chốt |
| G16 | `views/home.ejs` chỉ có 1 dòng tiêu đề chào mừng | Thay bằng Trang chủ Dashboard KPI + Trung tâm Báo cáo 4 Tab chuẩn BVĐKKV Long Khánh | T3.3 | ☑ Đã chốt |
| G17 | `project_context.md` là tài liệu lịch sử (3.715 dòng) | Giữ làm lịch sử tham khảo; bộ `docs/` v3.0 là nguồn sự thật cho thiết kế đích | — | ☑ Đã chốt |
| **G18 (Mới)** | **`2.153 / 2.154` dòng `HardwareUnits.warrantyDate` chứa rác `'1900-01-01'`** | Migration `V003` tự động chuyển `warrantyDate = '1900-01-01'` thành `NULL` + bổ sung `Devices.warrantyDate DATETIME NULL` | T1.3, T4.2, T5.1–T5.2 | ☑ Đã chốt |
| **G19 (Mới)** | Hardcode `deptId = 295` (Phòng CNTT) và phải gõ lại tên Lãnh đạo ký mỗi lần in phiếu sửa chữa | Tạo bảng `dbo.SystemSettings` (có `appCode`) cho Admin cấu hình tên người ký mặc định, mã Phòng CNTT (`PCNTT`) và ngưỡng cảnh báo bảo hành/bơm mực | T1.2, T3.2, T6.3, T7.3 | ☑ Đã chốt |

---

## 5. Phê duyệt Baseline (Điều kiện mở Phase 1)
- ☑ Đã hoàn thành khảo sát 100% số liệu, schema, SP và source code thật (0 ô `CHƯA XÁC MINH`).
- ☑ Chủ dự án đã duyệt toàn bộ quyết định bổ sung & xử lý Gap List `G1–G19` trong phiên 2026-11-20.
- ☐ Chủ dự án hoàn thành **Task T0.1** (backup Production → restore ra `QuanLyThietBiCNTT_DEV` → tạo login `qltb_migrator` & `qltb_app` → tạo tag Git `pre-v2.6`) và xác nhận bắt đầu **Phase 1**.
