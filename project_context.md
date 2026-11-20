# PROJECT_CONTEXT.md — QuanLyThietBiCNTT (TÀI LIỆU LỊCH SỬ v1.x — KHÔNG DÙNG LÀM THIẾT KẾ ĐÍCH v3.0)

> [!WARNING]
> **THÔNG BÁO QUAN TRỌNG CHO AI AGENT & LẬP TRÌNH VIÊN (`AS-IS-BASELINE.md` G17 & `PROJECT-RULES.md` Mục 0.3):**
> - File `project_context.md` này là **hồ sơ lịch sử giai đoạn v1.x (EJS/Bootstrap cũ — 2026-05)** và chỉ được giữ lại để tra cứu lịch sử.
> - **TUYỆT ĐỐI KHÔNG** dùng các quy ước cũ trong file này (như route legacy `/ajax`, `/:id/update`, EJS view, jQuery/Select2) để code cho nền tảng **v3.0 (Lộ trình B)**.
> - **Nguồn sự thật bắt buộc cho v3.0:**
>   1. Quy tắc bắt buộc tự động nạp: `AGENTS.md` và `docs/PROJECT-RULES.md` (v3.1).
>   2. Hiện trạng DB & Code thực tế đã xác minh: `docs/AS-IS-BASELINE.md` (v1.2).
>   3. Thiết kế đích & Kế hoạch triển khai v3.0: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATA-SCHEMA.md`, `docs/API-CONTRACTS.md`, `docs/UI-DESIGN.md`, `docs/IMPLEMENTATION-PLAN.md` và `CHANGELOG.md`.

> Tài liệu này mô tả bối cảnh kỹ thuật, domain, kiến trúc, quy ước xử lý và định hướng chuẩn hóa cho dự án **QuanLyThietBiCNTT** (giai đoạn v1.x).


---

## CẬP NHẬT TRẠNG THÁI CHUẨN HÓA — 2026-05-15

Tài liệu này đã được cập nhật sau đợt chuẩn hóa dự án gần nhất. Các thay đổi quan trọng đã thực hiện:

- Đã thêm và đưa vào sử dụng các helper nền tảng chung:
  - `utils/apiResponse.js`
  - `utils/pagination.js`
  - `utils/asyncHandler.js`
  - `middleware/errorHandler.js`
  - `public/js/common/pagination.js`
- Đã xử lý lỗi ES Module import/export:
  - Tất cả import nội bộ phải có đuôi `.js`.
  - Middleware/helper export default phải export trực tiếp function/object đúng kiểu.
- Đã chuẩn hóa phân trang frontend sang component dùng chung `window.AppPagination`.
- Đã refactor/chuẩn hóa các module chính theo hướng tương thích ngược:
  - `hardware-types`
  - `hardwares`
  - `assignments`
  - `repairs`
  - `device-hardware-units`
- Các response API mới ưu tiên format:

```json
{
  "success": true,
  "message": "...",
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 0,
      "totalPages": 1
    }
  }
}
```

- Trong giai đoạn chuyển tiếp, nhiều API vẫn giữ thêm legacy keys như `devices`, `repairs`, `assignments`, `units`, `pagination` để frontend cũ không bị vỡ.
- Lưu ý: một số nghiệp vụ như **gán mới assignment** và **thu hồi assignment** đã được chuẩn hóa code nhưng chưa được test sâu do phụ thuộc dữ liệu thực tế.

---

## 1. Tổng quan dự án

**QuanLyThietBiCNTT** là hệ thống quản lý thiết bị CNTT theo hướng **IT Asset Management / Device Lifecycle Management**.

Hệ thống không chỉ quản lý nghiệp vụ bàn giao thiết bị, mà bao gồm nhiều module liên kết với nhau để quản lý toàn bộ vòng đời thiết bị:

```text
Danh mục nền → Thiết bị/phần cứng → Cấu hình thiết bị → Bàn giao sử dụng → Sửa chữa → Thu hồi/tạm ngưng/xóa an toàn
```

Các nhóm nghiệp vụ chính:

1. Quản lý phòng ban sử dụng thiết bị.
2. Quản lý loại thiết bị.
3. Quản lý thiết bị.
4. Quản lý loại phần cứng.
5. Quản lý danh mục phần cứng.
6. Quản lý đơn vị phần cứng/vật tư phần cứng cụ thể.
7. Gán phần cứng vào thiết bị.
8. Bàn giao thiết bị cho phòng ban.
9. Ghi nhận và xử lý sửa chữa thiết bị/phần cứng.

---

## 2. Tech stack hiện tại

### Backend

- Node.js
- Express 5
- ES Modules (`type: module`)
- `mssql` để kết nối Microsoft SQL Server
- `express-session` với custom MSSQL session store
- `method-override` để hỗ trợ PUT/DELETE từ form/AJAX
- `dotenv` để cấu hình môi trường

### Database

- Microsoft SQL Server
- Kiến trúc xử lý dữ liệu chủ yếu dựa trên **Stored Procedure**
- Phân trang xử lý ở database bằng `OFFSET/FETCH` hoặc logic tương đương trong Stored Procedure

### Frontend

- EJS template engine
- jQuery AJAX
- Bootstrap 5
- Một số màn hình có dùng Select2/SweetAlert2 theo mô tả kỹ thuật, cần kiểm tra đồng bộ import/script ở từng view trước khi mở rộng

---

## 3. Kiến trúc tổng thể

Dự án đang đi theo mô hình:

```text
Route → Controller → Service → Stored Procedure → MSSQL
                              ↓
                         Response JSON
                              ↓
                        jQuery render UI
```

### Vai trò từng layer

#### Route

- Chỉ định nghĩa endpoint.
- Không chứa business logic.
- Import controller tương ứng.

#### Controller

- Nhận `req.params`, `req.query`, `req.body`.
- Validate tối thiểu dữ liệu bắt buộc.
- Gọi service.
- Trả JSON hoặc render EJS view.
- Không nên trực tiếp gọi DB.
- Không nên chứa business logic phức tạp.

#### Service

- Là layer trung gian giữa controller và database.
- Gọi Stored Procedure.
- Mapping `recordset` / `recordsets` thành object chuẩn cho frontend.
- Chuẩn hóa pagination, dropdown data, kết quả create/update/delete.

#### Database / Stored Procedure

- Chứa phần lớn logic truy vấn, lọc, phân trang, kiểm tra ràng buộc dữ liệu.
- Nên là nơi xử lý transaction cho các nghiệp vụ liên quan nhiều bảng.

#### Frontend JS

- Gọi AJAX.
- Lưu state filter/page hiện tại.
- Render table/pagination/modal.
- Không xử lý business logic cốt lõi.

---

## 4. Cấu trúc thư mục chính

```text
QuanLyThietBiCNTT/
├── index.js
├── db/
│   └── db.js
├── routes/
│   ├── device.js
│   ├── department.js
│   ├── deviceType.js
│   ├── hardwareType.js
│   ├── hardware.js
│   ├── hardwareUnit.js
│   ├── deviceHardwareUnit.js
│   ├── assignment.js
│   └── repair.js
├── controllers/
│   ├── deviceController.js
│   ├── departmentController.js
│   ├── deviceTypeController.js
│   ├── hardwareTypeController.js
│   ├── hardwareController.js
│   ├── hardwareUnitController.js
│   ├── deviceHardwareUnitController.js
│   ├── deviceAssignmentController.js
│   └── repairController.js
├── services/
│   ├── deviceService.js
│   ├── departmentService.js
│   ├── deviceTypeService.js
│   ├── hardwareTypeService.js
│   ├── hardwareService.js
│   ├── hardwareUnitService.js
│   ├── deviceHardwareUnitService.js
│   ├── deviceAssignmentService.js
│   └── repairService.js
├── public/
│   ├── js/
│   ├── styles/
│   └── images/
├── views/
│   ├── partials/
│   ├── devices/
│   ├── departments/
│   ├── deviceTypes/
│   ├── hardwareTypes/
│   ├── hardwares/
│   ├── hardwareUnits/
│   ├── device-hardware-units/
│   ├── device-assignments/
│   ├── repairs/
│   └── home.ejs
└── utils/
    ├── deletionGuard.js
    ├── sanitizeFilters.js
    └── sessionStore.js
```

---

## 5. Domain model cốt lõi

### 5.1 Thực thể nghiệp vụ

| Entity | Ý nghĩa |
|---|---|
| `Department` | Phòng ban sử dụng thiết bị |
| `DeviceType` | Loại thiết bị: máy tính, máy in, switch, server... |
| `Device` | Thiết bị chính cần quản lý vòng đời |
| `HardwareType` | Loại phần cứng: RAM, SSD, mainboard, CPU... |
| `Hardware` | Danh mục phần cứng theo loại |
| `HardwareUnit` | Đơn vị phần cứng cụ thể, có mã/serial/ngày mua |
| `DeviceHardwareUnit` | Bảng/nghiệp vụ gán phần cứng cụ thể vào thiết bị |
| `DeviceAssignment` | Lịch sử bàn giao thiết bị cho phòng ban |
| `Repair` | Phiếu/lịch sử sửa chữa thiết bị hoặc phần cứng |

### 5.2 Quan hệ nghiệp vụ nên được AI/dev hiểu đúng

```text
DeviceType 1 ─── N Device

HardwareType 1 ─── N Hardware
Hardware     1 ─── N HardwareUnit

Device       1 ─── N DeviceHardwareUnit
HardwareUnit 1 ─── N DeviceHardwareUnit

Department   1 ─── N DeviceAssignment
Device       1 ─── N DeviceAssignment

Device       1 ─── N Repair
HardwareUnit 0/1 ─ N Repair
```

### 5.3 Diễn giải nghiệp vụ

- `Device` là tài sản/thiết bị chính.
- `HardwareUnit` là phần cứng cụ thể có thể gắn vào thiết bị.
- `DeviceHardwareUnit` mô tả cấu hình phần cứng của một thiết bị.
- `DeviceAssignment` mô tả thiết bị đang/đã bàn giao cho phòng ban nào.
- `Repair` ghi nhận quá trình sửa chữa một thiết bị, có thể gắn với một hoặc nhiều phần cứng tùy thiết kế Stored Procedure hiện tại.

---

## 6. Các module hiện có

## 6.1 Department module

### Route base

```text
/departments
```

### File chính

- `routes/department.js`
- `controllers/departmentController.js`
- `services/departmentService.js`
- `views/departments/index.ejs`
- `public/js/departments.js`

### Endpoint hiện tại

```text
GET    /departments
GET    /departments/ajax
POST   /departments
PUT    /departments/:id/update
PUT    /departments/:id/toggle
DELETE /departments/:id/delete
```

### Stored Procedure chính

- `sp_Departments_GetPaged`
- `sp_Departments_Create`
- `sp_Departments_Update`
- `sp_Departments_ToggleStatus`
- `sp_Departments_Delete`

---

## 6.2 DeviceType module

### Route base

```text
/device-types
```

### File chính

- `routes/deviceType.js`
- `controllers/deviceTypeController.js`
- `services/deviceTypeService.js`
- `views/deviceTypes/index.ejs`
- `public/js/deviceTypes.js`

### Endpoint hiện tại

```text
GET    /device-types
GET    /device-types/ajax
POST   /device-types
PUT    /device-types/:id/update
PUT    /device-types/:id/toggle
DELETE /device-types/:id/delete
```

### Stored Procedure chính

- `sp_DeviceTypes_GetAll`
- `sp_DeviceTypes_Create`
- `sp_DeviceTypes_Update`
- `sp_DeviceTypes_ToggleStatus`
- `sp_DeviceTypes_Delete`
- `sp_DeviceTypes_GetDropdown`

---

## 6.3 Device module

### Route base

```text
/devices
```

### File chính

- `routes/device.js`
- `controllers/deviceController.js`
- `services/deviceService.js`
- `views/devices/index.ejs`
- `public/js/devices.js`

### Endpoint hiện tại

```text
GET    /devices
GET    /devices/ajax
POST   /devices
PUT    /devices/:id/update
PUT    /devices/:id/toggle
DELETE /devices/:id/delete
```

### Stored Procedure chính

- `sp_Devices_GetPaged`
- `sp_Devices_Create`
- `sp_Devices_Update`
- `sp_Devices_ToggleInactive`
- `sp_Devices_Delete`
- `sp_DeviceTypes_GetDropdown`
- `sp_Devices_GetAssignable`

### Ghi chú nghiệp vụ

- Device phụ thuộc `DeviceType`.
- Device có thể được bàn giao qua Assignment.
- Device có thể có cấu hình phần cứng qua DeviceHardwareUnit.
- Device có thể có lịch sử sửa chữa qua Repair.

---

## 6.4 HardwareType module

### Route base

```text
/hardware-types
```

### File chính

- `routes/hardwareType.js`
- `controllers/hardwareTypeController.js`
- `services/hardwareTypeService.js`
- `views/hardwareTypes/index.ejs`
- `public/js/hardwareTypes.js`

### Endpoint hiện tại

```text
GET    /hardware-types
GET    /hardware-types/ajax
POST   /hardware-types
PUT    /hardware-types/:id/update
PUT    /hardware-types/:id/toggle
DELETE /hardware-types/:id/delete
```

### Stored Procedure chính

- `sp_HardwareTypes_GetAll`
- `sp_HardwareTypes_Create`
- `sp_HardwareTypes_Update`
- `sp_HardwareTypes_ToggleStatus`
- `sp_HardwareTypes_Delete`

---

## 6.5 Hardware module

### Route base

```text
/hardwares
```

### File chính

- `routes/hardware.js`
- `controllers/hardwareController.js`
- `services/hardwareService.js`
- `views/hardwares/index.ejs`
- `public/js/hardwares.js`

### Endpoint hiện tại

```text
GET    /hardwares
GET    /hardwares/ajax
POST   /hardwares
PUT    /hardwares/:id/update
PUT    /hardwares/:id/toggle
DELETE /hardwares/:id/delete
```

### Stored Procedure chính

- `sp_Hardwares_GetAll`
- `sp_Hardwares_Create`
- `sp_Hardwares_Update`
- `sp_Hardwares_ToggleStatus`
- `sp_Hardwares_Delete`

### Ghi chú nghiệp vụ

- Hardware phụ thuộc HardwareType.
- Hardware là danh mục, chưa phải đơn vị cụ thể có serial.
- Đơn vị cụ thể nằm ở `HardwareUnit`.

---

## 6.6 HardwareUnit module

### Route base

```text
/hardware-units
```

### File chính

- `routes/hardwareUnit.js`
- `controllers/hardwareUnitController.js`
- `services/hardwareUnitService.js`
- `views/hardwareUnits/index.ejs`
- `public/js/hardwareUnits.js`

### Endpoint hiện tại

```text
GET    /hardware-units
GET    /hardware-units/ajax
POST   /hardware-units
PUT    /hardware-units/:id/update
PUT    /hardware-units/:id/toggle
DELETE /hardware-units/:id/delete
```

### Stored Procedure chính

- `sp_HardwareUnits_GetAll`
- `sp_HardwareUnits_Create`
- `sp_HardwareUnits_Update`
- `sp_HardwareUnits_ToggleStatus`
- `sp_HardwareUnits_Delete`

### Ghi chú nghiệp vụ

- HardwareUnit là phần cứng cụ thể có `code`, `serialNumber`, `purchaseDate`.
- HardwareUnit phụ thuộc Hardware.
- HardwareUnit có thể được gán vào Device thông qua DeviceHardwareUnit.
- HardwareUnit có thể liên quan tới Repair.

---

## 6.7 DeviceHardwareUnit module

### Route base

```text
/device-hardware
```

### File chính

- `routes/deviceHardwareUnit.js`
- `controllers/deviceHardwareUnitController.js`
- `services/deviceHardwareUnitService.js`
- `views/device-hardware-units/index.ejs`
- `public/js/deviceHardwareUnits.js`

### Endpoint hiện tại

```text
GET    /device-hardware
GET    /device-hardware/ajax
GET    /device-hardware/devices/ungrouped
GET    /device-hardware/hardware-units/create
GET    /device-hardware/hardware-units/edit
GET    /device-hardware/:deviceId/assigned
PUT    /device-hardware/:deviceId/update
DELETE /device-hardware/:deviceId/detach/:hardwareUnitId
```

### Stored Procedure chính

- `sp_DeviceHardwareUnits_GetDevicesWithHardware_Paged`
- `sp_DeviceHardwareUnits_GetDevicesWithoutHardware`
- `sp_DeviceHardwareUnits_GetForCreate`
- `sp_DeviceHardwareUnits_GetForEdit`
- `sp_DeviceHardwareUnits_GetAssigned`
- `sp_DeviceHardwareUnits_UpdateAssigned`
- `sp_DeviceHardwareUnits_Detach`

### Ghi chú nghiệp vụ quan trọng

- Module này quản lý cấu hình phần cứng của thiết bị.
- Khi tạo mới, chỉ lấy các Device chưa có phần cứng bằng endpoint `devices/ungrouped`.
- Khi sửa, cần include device hiện tại để không mất dữ liệu đang gán.
- Khi chọn HardwareUnit để sửa, cần include những unit đang gán hiện tại.

---

## 6.8 DeviceAssignment module

### Route base

```text
/assignments
```

### File chính

- `routes/assignment.js`
- `controllers/deviceAssignmentController.js`
- `services/deviceAssignmentService.js`
- `views/device-assignments/index.ejs`
- `public/js/assignments.js`

### Endpoint hiện tại

```text
GET    /assignments
GET    /assignments/ajax
GET    /assignments/departments/ajax
GET    /assignments/available-devices
POST   /assignments
PUT    /assignments/:id
PUT    /assignments/:id/revoke
DELETE /assignments/:id
```

### Stored Procedure chính

- `sp_DeviceAssignments_Get_Paged`
- `sp_GetAllDepartments`
- `sp_Devices_GetAssignable`
- `sp_DeviceAssignments_Create`
- `sp_DeviceAssignments_Update`
- `sp_DeviceAssignments_Revoke`
- `sp_DeviceAssignments_Delete`

### Ghi chú nghiệp vụ quan trọng

- Một thiết bị không nên có nhiều assignment active cùng lúc.
- Thiết bị đã assignment active không nên xuất hiện trong danh sách assignable/available.
- `revoke` là nghiệp vụ thu hồi, không đồng nghĩa với xóa lịch sử.
- `delete` chỉ nên dùng khi bản ghi lịch sử sai hoặc được phép xóa theo rule hệ thống.

---

## 6.9 Repair module

### Route base

```text
/repairs
```

### File chính

- `routes/repair.js`
- `controllers/repairController.js`
- `services/repairService.js`
- `views/repairs/index.ejs`
- `public/js/repairs.js`

### Endpoint hiện tại

```text
GET    /repairs
GET    /repairs/ajax
GET    /repairs/:id
POST   /repairs
PUT    /repairs/:id
DELETE /repairs/:id
GET    /repairs/dropdown/devices
GET    /repairs/dropdown/hardware-units
GET    /repairs/dropdown/users
```

### Stored Procedure chính

- `sp_Repairs_GetAll_Paged`
- `sp_Repairs_GetById`
- `sp_Repairs_Create`
- `sp_Repairs_Update`
- `sp_Repairs_Delete`
- `sp_Repairs_GetAvailableDevices`
- `sp_Repairs_GetActiveUsers`
- `sp_Repairs_GetHardwareUnitsForCreate`
- `sp_Repairs_GetHardwareUnitsForEdit`

### Ghi chú nghiệp vụ quan trọng

- Repair gắn với Device.
- Repair có thể gắn với HardwareUnit.
- Dropdown phần cứng phụ thuộc Device đang chọn.
- Khi edit Repair, cần include phần cứng đang chọn hiện tại để không bị mất dữ liệu.

---

## 7. Cơ chế session và base path

### Session

Dự án có custom `MSSQLStore` tại:

```text
utils/sessionStore.js
```

Store này tự tạo bảng `Sessions` nếu chưa tồn tại và lưu session vào MSSQL.

### Base path

`index.js` có xử lý biến môi trường:

```text
App_Base_Path
```

Biến này dùng để deploy ứng dụng dưới một sub-path, ví dụ IIS/reverse proxy. `res.locals.basePath` được truyền sang EJS.

### Lưu ý chuẩn hóa

Một số file frontend đang gọi URL dạng hard-code như:

```js
'/devices/ajax'
'/hardwares/ajax'
```

Một số file có dùng `Base_Path`.

Quy chuẩn mới nên là:

```js
const API_BASE = window.Base_Path || '';
$.get(`${API_BASE}/devices/ajax`, params)
```

Tất cả file JS cần thống nhất để tránh lỗi khi deploy dưới sub-path.

---

## 8. API contract chuẩn đề xuất

Hiện tại response giữa các module chưa hoàn toàn thống nhất. Có module trả:

```json
{
  "devices": [],
  "total": 100,
  "currentPage": 1
}
```

Có module trả:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "totalItems": 100
  }
}
```

Từ thời điểm chuẩn hóa, nên dùng chung một API contract.

## 8.1 List response chuẩn

Tất cả endpoint dạng `/module/ajax` nên trả:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 0,
    "totalPages": 1
  },
  "filters": {}
}
```

### Ý nghĩa

| Field | Ý nghĩa |
|---|---|
| `success` | Request thành công hay không |
| `data` | Mảng dữ liệu để render table |
| `pagination.page` | Trang hiện tại |
| `pagination.limit` | Số dòng mỗi trang |
| `pagination.totalItems` | Tổng số bản ghi |
| `pagination.totalPages` | Tổng số trang |
| `filters` | Filter đã được sanitize/normalize |

## 8.2 Mutation response chuẩn

Dùng cho create/update/toggle/delete/revoke/detach:

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": null
}
```

Khi lỗi nghiệp vụ:

```json
{
  "success": false,
  "message": "Không thể xóa vì dữ liệu đang được sử dụng",
  "code": "BUSINESS_RULE_VIOLATION",
  "details": null
}
```

Khi lỗi validation:

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "code"
  }
}
```

---

## 9. Pagination contract chuẩn

### Query params chuẩn

```text
page=1
limit=10
```

### Service chuẩn

Service phải normalize:

```js
const page = Math.max(parseInt(filters.page, 10) || 1, 1);
const limit = Math.max(parseInt(filters.limit, 10) || 10, 1);
const offset = (page - 1) * limit;
```

### Response chuẩn

```js
return {
  success: true,
  data,
  pagination: {
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit) || 1
  },
  filters: sanitizedFilters
};
```

### Stored Procedure recordset chuẩn đề xuất

Để tránh nhầm lẫn `recordsets[0]` là total hay data, nên thống nhất:

```text
recordsets[0] = data
recordsets[1] = [{ totalItems }]
```

Nếu giữ SP cũ đang trả:

```text
recordsets[0] = [{ total }]
recordsets[1] = data
```

thì service phải mapping rõ ràng và convert về response chuẩn.

---

## 10. Quy chuẩn module frontend đề xuất

Mỗi module nên có cùng cấu trúc xử lý trong file `public/js/<module>.js`:

```text
1. Khai báo state hiện tại
2. Khai báo selector constants
3. Hàm API helper
4. Hàm load list
5. Hàm render table
6. Hàm render pagination
7. Hàm open create/edit modal
8. Hàm submit create/update
9. Hàm toggle/delete/custom action
10. Hàm bind events
11. document.ready/init
```

### State chuẩn

```js
let currentParams = {
  page: 1,
  limit: 10
};
```

Không nên đặt nhiều biến tên khác nhau như `currentAssignmentParams`, `currentRepairParams`, `currentHardwareUnitParams` nếu sau này muốn dùng module factory. Có thể giữ tên riêng tạm thời, nhưng cấu trúc phải giống nhau.

### Load list chuẩn

```js
function loadList(params = {}) {
  currentParams = { ...currentParams, ...params };

  return $.get(`${API_BASE}/<module>/ajax`, currentParams)
    .done(function (res) {
      renderTable(res.data || []);
      renderPagination(res.pagination);
    })
    .fail(function (xhr) {
      showAlert(getErrorMessage(xhr), 'danger');
    });
}
```

### Pagination chuẩn

```js
function changePage(page) {
  if (!page || page < 1) return;
  loadList({ page });
}
```

### Filter submit chuẩn

```js
$('#filterForm').on('submit', function (e) {
  e.preventDefault();
  const filters = Object.fromEntries(new FormData(this).entries());
  loadList({ ...filters, page: 1 });
});
```

### Reset chuẩn

```js
$('#resetBtn').on('click', function () {
  $('#filterForm')[0].reset();
  currentParams = { page: 1, limit: 10 };
  loadList(currentParams);
});
```

---

## 11. Quy chuẩn EJS view đề xuất

Mỗi module list view nên có layout tương tự:

```text
1. Header/title module
2. Alert container
3. Filter form
4. Toolbar actions
5. Table container
6. Pagination container
7. Create modal
8. Edit modal nếu cần
9. Script module riêng
```

### ID naming chuẩn

Với module `devices`, dùng:

```text
devicesAlert
devicesFilterForm
devicesTable
devicesPagination
devicesCreateModal
devicesEditModal
```

Với module `repairs`, dùng:

```text
repairsAlert
repairsFilterForm
repairsTable
repairsPagination
repairsCreateModal
repairsEditModal
```

Không nên trộn lẫn dạng số ít/số nhiều hoặc tên chung như `pagination`, `filterForm` nếu nhiều module có thể share partial/template.

---

## 12. Quy chuẩn route đề xuất

Hiện tại có sự không đồng nhất:

```text
PUT /devices/:id/update
DELETE /devices/:id/delete
PUT /assignments/:id
DELETE /assignments/:id
```

Nên chuẩn hóa theo REST-like route:

```text
GET    /<modules>              Render page
GET    /<modules>/ajax         List JSON
GET    /<modules>/dropdown     Dropdown data nếu cần
GET    /<modules>/:id          Detail JSON nếu cần
POST   /<modules>              Create
PUT    /<modules>/:id          Update
PATCH  /<modules>/:id/status   Toggle status hoặc update trạng thái
DELETE /<modules>/:id          Delete
```

### Lộ trình an toàn

Không đổi route cũ ngay lập tức nếu frontend đang phụ thuộc. Nên:

1. Thêm route mới song song.
2. Update frontend dùng route mới.
3. Giữ route cũ trong giai đoạn tương thích.
4. Sau khi test xong mới remove route cũ.

---

## 13. Quy chuẩn service đề xuất

Mỗi service nên có cùng pattern:

```js
export async function getPaged(filters = {}) {}
export async function getById(id) {}
export async function create(payload) {}
export async function update(id, payload) {}
export async function toggleStatus(id) {}
export async function remove(id) {}
export async function getDropdown(filters = {}) {}
```

### Helper nên tách chung

Nên tạo:

```text
utils/pagination.js
utils/apiResponse.js
utils/asyncHandler.js
utils/normalize.js
```

Ví dụ:

```js
export function normalizePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
```

```js
export function pagedResponse(data, page, limit, totalItems, filters = {}) {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1
    },
    filters
  };
}
```

---

## 14. Quy chuẩn controller đề xuất

Controller không nên lặp lại try/catch quá nhiều. Nên dùng `asyncHandler`:

```js
export const getDevicesAjax = asyncHandler(async (req, res) => {
  const result = await deviceService.getPaged(req.query);
  res.json(result);
});
```

Global error middleware xử lý lỗi:

```js
app.use((err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.publicMessage || 'Có lỗi xảy ra trong hệ thống',
    code: err.code || 'INTERNAL_ERROR'
  });
});
```

---

## 15. Quy chuẩn delete/toggle an toàn

Dự án hiện có `utils/deletionGuard.js`, đây là hướng đúng.

### Nguyên tắc

- Không xóa bản ghi đang được tham chiếu.
- Ưu tiên soft delete/toggle inactive với danh mục nền.
- Hard delete chỉ dùng khi chắc chắn không ảnh hưởng dữ liệu lịch sử.

### Modules nên ưu tiên toggle thay vì delete

- Department
- DeviceType
- HardwareType
- Hardware
- HardwareUnit
- Device

### Modules có tính lịch sử

- Assignment
- Repair

Với dữ liệu lịch sử, cần cân nhắc kỹ trước khi delete. Nên ưu tiên trạng thái hoặc revoke/cancel hơn là xóa.

---

## 16. Các vấn đề kỹ thuật đã phát hiện khi review code

## 16.1 Response API chưa đồng nhất

Một số module trả `{ devices, total, currentPage }`, module khác trả `{ data, pagination }`.

Ảnh hưởng:

- Frontend mỗi module phải xử lý khác nhau.
- AI/dev dễ sửa sai vì tưởng cùng contract.
- Khó viết helper dùng chung.

Hướng xử lý:

- Chuẩn hóa toàn bộ list endpoint về `{ success, data, pagination, filters }`.

## 16.2 Route naming chưa đồng nhất

Có module dùng:

```text
PUT /:id/update
DELETE /:id/delete
```

Có module dùng:

```text
PUT /:id
DELETE /:id
```

Hướng xử lý:

- Thêm REST-like route mới.
- Giữ route cũ tạm thời để không phá frontend.

## 16.3 Base path chưa được áp dụng đồng bộ ở frontend

Một số JS gọi URL absolute `/devices/ajax`, có thể lỗi khi deploy với `App_Base_Path`.

Hướng xử lý:

- Tạo global `window.APP_BASE_PATH` từ partial/header.
- Tất cả AJAX dùng helper build URL.

## 16.4 Pagination frontend chưa dùng chung

Mỗi module tự render pagination.

Hướng xử lý:

- Tạo `public/js/common/pagination.js` hoặc một helper trong `app.js`.
- Các module chỉ truyền `pagination` và callback `changePage`.

## 16.5 Alert/loading/error handling chưa thống nhất

Một số module có alert riêng, một số response lỗi chưa đồng nhất.

Hướng xử lý:

- Tạo common helper:
  - `showAlert(container, message, type)`
  - `setLoading(tableContainer, true/false)`
  - `getErrorMessage(xhr)`

## 16.6 Service mapping recordsets chưa thống nhất

Có Stored Procedure trả `recordsets[0] = total`, `recordsets[1] = data`; có nơi trả `recordsets[0] = data`, `recordsets[1] = total`.

Hướng xử lý:

- Trong ngắn hạn: service mapping rõ từng SP.
- Trong dài hạn: chuẩn hóa Stored Procedure list/paged trả cùng thứ tự.

## 16.7 Validation còn rải rác

Controller hiện validate thủ công ở một số module.

Hướng xử lý:

- Tạo validator/helper theo module.
- Tối thiểu validate required fields, number/date/status.

---

## 17. Quy chuẩn trạng thái đề xuất

### Danh mục/master data

Dùng:

```text
active / inactive
```

hoặc nếu DB đang dùng `isInactive`, service nên convert rõ cho frontend.

### Assignment

Dùng:

```text
active / revoked
```

Không nên nhầm `revoked` với `deleted`.

### Repair

Dùng:

```text
opened / processing / completed / cancelled
```

Cần đồng bộ với giá trị thực tế trong Stored Procedure và frontend.

---

## 18. Quy chuẩn Stored Procedure naming đề xuất

Tên Stored Procedure nên theo pattern:

```text
sp_<Entity>_GetPaged
sp_<Entity>_GetById
sp_<Entity>_GetDropdown
sp_<Entity>_Create
sp_<Entity>_Update
sp_<Entity>_ToggleStatus
sp_<Entity>_Delete
```

Với nghiệp vụ đặc thù:

```text
sp_DeviceAssignments_Revoke
sp_DeviceHardwareUnits_Detach
sp_DeviceHardwareUnits_UpdateAssigned
sp_Repairs_GetHardwareUnitsForCreate
sp_Repairs_GetHardwareUnitsForEdit
```

---

## 19. Quy tắc nghiệp vụ không được phá vỡ

1. Không được gán một thiết bị active cho nhiều phòng ban cùng lúc.
2. Thiết bị đang active assignment không nên xuất hiện trong dropdown thiết bị có thể bàn giao.
3. Không được xóa danh mục nếu đang có dữ liệu phụ thuộc.
4. Không được xóa lịch sử quan trọng nếu nghiệp vụ cần audit.
5. Khi sửa dữ liệu có dropdown phụ thuộc, phải include giá trị hiện tại để tránh mất liên kết.
6. Pagination luôn xử lý server-side/database-side, không tải toàn bộ rồi phân trang ở frontend.
7. Controller không gọi trực tiếp SQL.
8. Frontend không tự quyết định business rule cốt lõi; frontend chỉ hỗ trợ UX, DB/service mới là nơi enforce.

---

## 20. Lộ trình chuẩn hóa toàn bộ dự án

## Phase 1 — Chuẩn hóa nền tảng dùng chung

Tạo các helper:

```text
utils/apiResponse.js
utils/pagination.js
utils/asyncHandler.js
public/js/common/api.js
public/js/common/pagination.js
public/js/common/alerts.js
public/js/common/modal.js
```

Mục tiêu:

- Chuẩn hóa response.
- Chuẩn hóa lỗi.
- Chuẩn hóa pagination.
- Chuẩn hóa gọi API có base path.

## Phase 2 — Chuẩn hóa các module danh mục đơn giản

Làm lần lượt:

1. `hardware-types`
2. `device-types`
3. `departments`
4. `hardwares`
5. `hardware-units`
6. `devices`

Vì các module này có pattern gần giống nhau: list/filter/create/update/toggle/delete.

## Phase 3 — Chuẩn hóa module nghiệp vụ phức tạp

Làm sau:

1. `device-hardware`
2. `assignments`
3. `repairs`

Vì các module này có dropdown phụ thuộc, quan hệ nhiều bảng và rule nghiệp vụ riêng.

## Phase 4 — Chuẩn hóa Stored Procedure

- Đồng bộ tên tham số.
- Đồng bộ thứ tự recordsets.
- Đồng bộ response `success/message` cho mutation SP nếu cần.
- Thêm transaction cho nghiệp vụ nhiều bảng.

## Phase 5 — Hoàn thiện production hardening

- Global error handler.
- Validation tập trung.
- Logging.
- Audit log.
- Authentication/authorization nếu cần.
- Import/export Excel nếu cần.
- Dashboard thống kê.

---

## 21. Mẫu chuẩn module sau khi refactor

Khi thêm module mới hoặc refactor module cũ, phải đi theo checklist này.

### Backend checklist

- [ ] Có route file riêng.
- [ ] Có controller file riêng.
- [ ] Có service file riêng.
- [ ] Controller không gọi DB trực tiếp.
- [ ] Service gọi Stored Procedure.
- [ ] List API trả `{ success, data, pagination, filters }`.
- [ ] Mutation API trả `{ success, message, data }`.
- [ ] Có validation required fields.
- [ ] Có delete guard hoặc business rule tương ứng.

### Frontend checklist

- [ ] Có EJS view riêng.
- [ ] Có JS module riêng.
- [ ] Có alert container.
- [ ] Có filter form.
- [ ] Có table container.
- [ ] Có pagination container.
- [ ] AJAX dùng base path helper.
- [ ] Có loading state.
- [ ] Có reset filter.
- [ ] Có error handling thống nhất.

### Database checklist

- [ ] Có SP GetPaged.
- [ ] Có SP Create.
- [ ] Có SP Update.
- [ ] Có SP ToggleStatus hoặc Delete theo nghiệp vụ.
- [ ] SP phân trang trả đủ totalItems.
- [ ] SP mutation kiểm tra ràng buộc nghiệp vụ quan trọng.

---

## 22. Ghi chú cho AI/developer làm tiếp

Khi nhận task mới trong dự án này, phải làm theo thứ tự:

1. Xác định module liên quan.
2. Đọc route → controller → service → EJS → JS của module đó.
3. Kiểm tra Stored Procedure mà service đang gọi.
4. Không tự ý đổi API contract nếu chưa cập nhật frontend tương ứng.
5. Nếu chuẩn hóa, nên làm theo hướng tương thích ngược trước.
6. Với lỗi pagination, luôn kiểm tra cả 3 nơi:
   - frontend state params
   - controller query parsing
   - service mapping recordsets
7. Với lỗi dropdown, luôn kiểm tra:
   - endpoint dropdown
   - dữ liệu include khi edit
   - dữ liệu bị loại trừ khi create
8. Với lỗi delete, luôn kiểm tra:
   - deletion guard
   - SP delete
   - ràng buộc khóa ngoại/tham chiếu nghiệp vụ

---

## 23. Kết luận kỹ thuật

Dự án hiện đã có nền tảng tốt:

- Tách route/controller/service rõ.
- Dùng Stored Procedure cho xử lý dữ liệu.
- Có nhiều module nghiệp vụ đầy đủ.
- Có custom session store.
- Có bước đầu delete guard và pagination server-side.

Điểm cần làm tiếp không phải viết lại toàn bộ, mà là **chuẩn hóa dần** để tất cả module có cùng pattern:

```text
Cùng API contract
Cùng pagination
Cùng filter state
Cùng error handling
Cùng route naming
Cùng UI behavior
Cùng cách xử lý dropdown/phụ thuộc dữ liệu
```

Sau khi chuẩn hóa, dự án sẽ dễ mở rộng, dễ debug và AI/dev khác có thể tiếp tục phát triển mà ít gây lỗi kỹ thuật hơn.


---

## 24. Các công việc chuẩn hóa đã thực hiện xong

Phần này ghi lại cụ thể các việc đã hoàn thành trong quá trình chuẩn hóa gần nhất để AI/developer sau này không phải suy luận lại từ đầu.

### 24.1 Helper backend đã thêm

Đã tạo và đưa vào sử dụng các file backend dùng chung:

```text
utils/apiResponse.js
utils/pagination.js
utils/asyncHandler.js
middleware/errorHandler.js
```

#### `utils/apiResponse.js`

Dùng để trả response JSON thống nhất:

```js
apiResponse.success(res, data, message, meta, statusCode)
apiResponse.error(res, message, statusCode, errors)
```

Chuẩn thành công:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Chuẩn lỗi:

```json
{
  "success": false,
  "message": "Nội dung lỗi"
}
```

#### `utils/pagination.js`

Dùng để normalize input phân trang và build pagination response:

```js
normalizePagination(req.query, 10)
buildPagination(totalItems, page, limit)
```

Chuẩn pagination:

```json
{
  "page": 1,
  "limit": 10,
  "totalItems": 100,
  "totalPages": 10
}
```

#### `utils/asyncHandler.js`

Dùng để bọc async controller:

```js
router.get('/ajax', asyncHandler(controllerFunction));
```

Mục tiêu là đưa lỗi async về `errorHandler`, tránh lặp `try/catch` trong controller.

#### `middleware/errorHandler.js`

Đã chuẩn hóa import đúng theo ES Module:

```js
import apiResponse from '../utils/apiResponse.js';
```

Và export trực tiếp function:

```js
export default errorHandler;
```

Không export dạng object như:

```js
export default { errorHandler };
```

vì Express cần middleware function trực tiếp.

---

### 24.2 Quy tắc ES Module đã xác nhận

Dự án dùng ES Module (`type: module`), vì vậy:

1. Import nội bộ phải có đuôi `.js`.

Đúng:

```js
import apiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import errorHandler from './middleware/errorHandler.js';
```

Sai:

```js
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';
```

2. Nếu file được import default thì file đó phải có `export default`.

Ví dụ route:

```js
export default router;
```

3. Nếu `index.js` import:

```js
import repairRoutes from './routes/repair.js';
```

thì `routes/repair.js` bắt buộc phải có:

```js
export default router;
```

---

### 24.3 Helper frontend đã thêm

Đã tạo:

```text
public/js/common/pagination.js
```

File này cung cấp global helper:

```js
window.AppPagination.render(...)
window.AppPagination.normalizeFromResponse(...)
```

Mục tiêu:

- Dùng chung giao diện phân trang kiểu:

```text
‹ 1 ... 5 6 7 8 9 10 ... 41 ›
```

- Không để mỗi module tự viết phân trang riêng.
- Đọc được nhiều kiểu response:
  - `res.meta.pagination`
  - `res.pagination`
  - legacy `res.total`, `res.currentPage`

Mỗi view dùng pagination chung phải load script theo thứ tự:

```html
<script src="/js/common/pagination.js"></script>
<script src="/js/<module>.js"></script>
```

Nếu Bootstrap JS chưa được include trong partial header thì load Bootstrap trước:

```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="/js/common/pagination.js"></script>
<script src="/js/<module>.js"></script>
```

---

## 25. Trạng thái chuẩn hóa từng module

### 25.1 `hardware-types`

Trạng thái:

```text
✅ Đã chuẩn hóa controller/service/route/frontend theo pattern mới.
✅ Đã dùng apiResponse, pagination helper, asyncHandler.
✅ Đã xử lý lỗi import/export ES Module.
✅ Đã chạy thành công.
```

Ghi chú quan trọng:

- Đây là module mẫu đầu tiên dùng để nhân rộng sang các module khác.
- API `/hardware-types/ajax` nên trả format mới nhưng vẫn có thể giữ legacy keys trong giai đoạn chuyển tiếp.
- Route có thể hỗ trợ song song REST mới và route cũ nếu frontend chưa đổi hết.

---

### 25.2 `hardwares`

Trạng thái:

```text
✅ Đã sửa lỗi không hiển thị dữ liệu.
✅ Đã xử lý mismatch response giữa /hardware-types/ajax và hardwares.js.
✅ Đã thêm logic đọc được cả response mới và cũ:
   - res.data
   - res.hardwares
   - res.hardwareTypes
✅ Đã chuẩn hóa phân trang sang AppPagination.
✅ Đã chạy và hiển thị dữ liệu ổn.
```

Lỗi đã gặp:

```text
getListFromResponse is not defined
```

Nguyên nhân:

- `hardwares.js` gọi helper `getListFromResponse()` nhưng hàm chưa được khai báo hoặc chưa được load từ common.

Cách xử lý đã áp dụng:

- Thêm local helper `getListFromResponse(res, legacyKey)` vào `hardwares.js`.
- Hoặc load helper từ common nếu đã gom chung.

Ghi chú:

- Khi module hardwares cần dropdown loại phần cứng, phải đảm bảo `/hardware-types/ajax` trả data đọc được bằng `res.data` hoặc `res.hardwareTypes`.

---

### 25.3 `assignments`

Trạng thái:

```text
✅ Đã hiển thị lại danh sách.
✅ Đã thêm /js/common/pagination.js vào EJS.
✅ Đã phân trang bằng AppPagination.
✅ Đã chuẩn hóa frontend để đọc response mới/cũ.
✅ Đã chuẩn hóa controller/service/route theo apiResponse + asyncHandler.
✅ Các chức năng hiển thị, lọc, phân trang, sửa, xóa cơ bản đã ổn.
⏳ Gán mới chưa test sâu.
⏳ Thu hồi chưa test sâu.
```

Các file liên quan:

```text
routes/assignment.js
controllers/deviceAssignmentController.js
services/deviceAssignmentService.js
views/device-assignments/index.ejs
public/js/assignments.js
```

Các endpoint chính:

```text
GET    /assignments
GET    /assignments/ajax
GET    /assignments/departments/ajax
GET    /assignments/available-devices
POST   /assignments
PUT    /assignments/:id
PUT    /assignments/:id/revoke
DELETE /assignments/:id
```

Các điểm đã xử lý:

1. `index.ejs` cần load:

```html
<script src="/js/common/pagination.js"></script>
<script src="/js/assignments.js"></script>
```

2. Bảng HTML cần đúng cấu trúc, không đặt `<div>` bên trong `<table>`.

3. Frontend cần đọc được:

```js
res.data
res.assignments
res.meta.pagination
res.pagination
```

4. Nút sửa assignment trước đó truyền object nhưng function nhận tham số kiểu cũ. Đã chuyển sang cách truyền object an toàn bằng `encodeURIComponent(JSON.stringify(item))`.

5. Dropdown departments cần đọc được cả:

```js
res.data
res.departments
res // array trực tiếp
```

Business rules cần test lại khi có dữ liệu phù hợp:

- Thiết bị đang assignment active không được xuất hiện trong `/assignments/available-devices`.
- `POST /assignments` không cho gán trùng thiết bị đang active.
- `PUT /assignments/:id/revoke` phải:
  - Không thu hồi lại nếu đã revoked.
  - Set `endDate` đúng.
  - Sau khi thu hồi, thiết bị có thể quay lại danh sách available nếu rule cho phép.

---

### 25.4 `repairs`

Trạng thái:

```text
✅ Đã chuẩn hóa route/controller/service/frontend.
✅ Đã đưa dropdown routes lên trước /:id để tránh Express match nhầm.
✅ Đã chuẩn hóa response format mới + legacy compatibility.
✅ Đã load common pagination trong view.
✅ Đã xử lý lỗi export default route.
✅ Server đã chạy ổn sau khi sửa route file.
```

Các file liên quan:

```text
routes/repair.js
controllers/repairController.js
services/repairService.js
views/repairs/index.ejs
public/js/repairs.js
```

Lỗi đã gặp:

```text
SyntaxError: The requested module './routes/repair.js' does not provide an export named 'default'
```

Nguyên nhân:

- `index.js` import default:

```js
import repairRoutes from './routes/repair.js';
```

nhưng `routes/repair.js` không có `export default router;`.

Cách xử lý:

- Đảm bảo cuối `routes/repair.js` có:

```js
export default router;
```

Điểm quan trọng của route repairs:

```js
router.get('/dropdown/devices', ...)
router.get('/dropdown/hardware-units', ...)
router.get('/dropdown/users', ...)
router.get('/:id', ...)
```

Các route `/dropdown/...` phải đặt trước `/:id`.

Business rules cần test tiếp:

- Tạo phiếu sửa.
- Sửa phiếu sửa.
- Xóa phiếu chỉ khi trạng thái `opened`.
- Khi chọn thiết bị trong modal tạo, dropdown phần cứng phải loại trừ các hardware unit đang có repair `opened` hoặc `in-progress`.
- Khi edit, phải include hardware unit hiện tại để không mất liên kết.

---

### 25.5 `device-hardware-units`

Trạng thái:

```text
✅ Đã chuẩn hóa controller/service/route/frontend theo pattern mới.
✅ Đã chuyển phân trang riêng sang AppPagination.
✅ Đã chuẩn hóa response mới + legacy compatibility.
✅ Đã xử lý update assigned hardware units.
✅ Đã xử lý detach hardware unit.
✅ Tạm thời người dùng kiểm tra thấy ổn.
```

Các file liên quan:

```text
routes/deviceHardwareUnit.js
controllers/deviceHardwareUnitController.js
services/deviceHardwareUnitService.js
views/device-hardware-units/index.ejs
public/js/deviceHardwareUnits.js
```

Các endpoint chính:

```text
GET    /device-hardware
GET    /device-hardware/ajax
GET    /device-hardware/devices/ungrouped
GET    /device-hardware/hardware-units/create
GET    /device-hardware/hardware-units/edit
GET    /device-hardware/:deviceId/assigned
PUT    /device-hardware/:deviceId/update
DELETE /device-hardware/:deviceId/detach/:hardwareUnitId
```

Các điểm đã xử lý:

1. Service đổi từ `{ data, pagination: { totalRecords } }` sang controller build chuẩn:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 0,
      "totalPages": 1
    }
  }
}
```

2. Vẫn giữ legacy keys:

```json
{
  "devices": [],
  "pagination": {}
}
```

3. Frontend đọc được cả:

```js
res.data
res.devices
res.meta.pagination
res.pagination
```

4. View cần load:

```html
<script src="/js/common/pagination.js"></script>
<script src="/js/deviceHardwareUnits.js"></script>
```

Business rules cần test tiếp:

- Khi gán phần cứng mới, chỉ hiển thị thiết bị chưa có phần cứng nếu rule vẫn như hiện tại.
- Khi sửa, dropdown thiết bị phải include device hiện tại.
- Khi sửa, hardware units phải include các unit đang gán hiện tại.
- Không gán trùng hardwareUnit cho nhiều device.
- Không detach hardware unit nếu đang có repair active, nếu SP có rule này.

---

### 25.6 Các module danh mục còn lại

Các module sau đã từng được tạo patch chuẩn hóa phase 2 và cần kiểm tra lại theo thực tế code hiện tại nếu chỉnh tiếp:

```text
departments
device-types
devices
hardware-units
```

Trạng thái theo hướng chuẩn hóa:

```text
✅ Đã có hướng chuẩn hóa tương tự hardware-types.
✅ Đã có patch/logic dùng response mới + legacy compatibility.
✅ Đã có AppPagination cho frontend nếu view load common pagination đúng thứ tự.
⚠️ Cần test thực tế từng chức năng create/update/toggle/delete nếu chưa test đủ.
```

---

## 26. Quy chuẩn response thực tế đang dùng sau đợt chuẩn hóa

Hiện tại dự án đang ở giai đoạn **transition**, nên response nên hỗ trợ cả chuẩn mới và legacy.

### 26.1 List endpoint chuẩn mới

Áp dụng cho:

```text
/<module>/ajax
```

Response chính:

```json
{
  "success": true,
  "message": "Lấy danh sách thành công",
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 0,
      "totalPages": 1
    }
  }
}
```

Response tương thích tạm thời:

```json
{
  "success": true,
  "message": "Lấy danh sách thành công",
  "data": [],
  "meta": {
    "pagination": {}
  },

  "devices": [],
  "repairs": [],
  "assignments": [],
  "units": [],
  "departments": [],
  "pagination": {}
}
```

Lưu ý:

- Không phải endpoint nào cũng có tất cả legacy key.
- Chỉ giữ legacy key tương ứng module để frontend cũ không vỡ.
- Khi toàn bộ frontend đã đọc `res.data` và `res.meta.pagination`, có thể xóa legacy keys.

### 26.2 Dropdown endpoint chuẩn mới

Response chính:

```json
{
  "success": true,
  "message": "Lấy dữ liệu dropdown thành công",
  "data": []
}
```

Response tương thích:

```json
{
  "success": true,
  "data": [],
  "devices": [],
  "units": [],
  "users": [],
  "departments": []
}
```

Frontend nên dùng helper:

```js
function getListFromResponse(res, legacyKey) {
  if (Array.isArray(res?.[legacyKey])) return res[legacyKey];
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
}
```

### 26.3 Detail endpoint chuẩn mới

Response chính:

```json
{
  "success": true,
  "message": "Lấy chi tiết thành công",
  "data": {}
}
```

Trong giai đoạn tương thích, có thể spread object detail ra root response nếu frontend cũ đang đọc trực tiếp field:

```js
return res.json({
  success: true,
  message: '...',
  data: repair,
  ...repair
});
```

### 26.4 Mutation endpoint chuẩn mới

Áp dụng cho create/update/delete/toggle/revoke/detach:

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": null
}
```

Lỗi validation:

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ"
}
```

Lỗi business rule:

```json
{
  "success": false,
  "message": "Không thể thực hiện do vi phạm ràng buộc nghiệp vụ"
}
```

HTTP status đề xuất:

```text
400 Validation error
404 Not found
409 Business rule / conflict
500 System error
```

---

## 27. Quy chuẩn frontend helper thực tế đang dùng

Nhiều module hiện đang khai báo local helper giống nhau. Có thể gom dần về common sau.

### 27.1 `getListFromResponse`

Dùng cho list/dropdown:

```js
function getListFromResponse(res, legacyKey) {
  if (Array.isArray(res?.[legacyKey])) return res[legacyKey];
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
}
```

### 27.2 `getPaginationFromResponse`

Dùng cho pagination:

```js
function getPaginationFromResponse(res, fallbackParams = {}) {
  if (window.AppPagination?.normalizeFromResponse) {
    return window.AppPagination.normalizeFromResponse(res, fallbackParams);
  }

  if (res?.meta?.pagination) return res.meta.pagination;
  if (res?.pagination) return res.pagination;

  const page = Number(res?.currentPage) || Number(fallbackParams.page) || 1;
  const limit = Number(fallbackParams.limit) || 10;
  const totalItems =
    Number(res?.totalItems) ||
    Number(res?.totalRecords) ||
    Number(res?.total) ||
    0;

  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

  return { page, limit, totalItems, totalPages };
}
```

### 27.3 `escapeHtml`

Dùng để tránh HTML injection khi render dữ liệu DB vào table:

```js
function escapeHtml(value) {
  if (value === null || value === undefined) return '';

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
```

### 27.4 `toggleModal`

Dùng để đóng/mở modal Bootstrap 5 an toàn, tránh còn backdrop/focus:

```js
function toggleModal(modalSelector, action = 'open') {
  document.activeElement?.blur();

  const modalEl = document.querySelector(modalSelector);
  if (!modalEl) return;

  let modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(modalEl);
  }

  if (action === 'open') {
    modalInstance.show();
  } else {
    modalInstance.hide();
    setTimeout(() => {
      $('body').css('overflow', 'auto').removeClass('modal-open');
      $('.modal-backdrop').remove();
    }, 300);
  }
}
```

---

## 28. Các lỗi đã gặp và cách xử lý

### 28.1 Lỗi import thiếu `.js`

Lỗi:

```text
ERR_MODULE_NOT_FOUND: Cannot find module .../utils/apiResponse
```

Nguyên nhân:

- Project dùng ES Module nên import nội bộ không được bỏ `.js`.

Cách xử lý:

```js
import apiResponse from '../utils/apiResponse.js';
```

---

### 28.2 Lỗi export default middleware/helper

Lỗi có thể gặp:

```text
TypeError: asyncHandler is not a function
```

hoặc Express không nhận middleware.

Nguyên nhân:

```js
export default { asyncHandler };
export default { errorHandler };
```

Cách xử lý:

```js
export default asyncHandler;
export default errorHandler;
```

---

### 28.3 Lỗi route không provide default export

Lỗi:

```text
SyntaxError: The requested module './routes/repair.js' does not provide an export named 'default'
```

Nguyên nhân:

- `index.js` import default nhưng route file không `export default router`.

Cách xử lý:

```js
export default router;
```

---

### 28.4 Lỗi dropdown route bị match nhầm bởi `/:id`

Ngữ cảnh:

- Module `repairs`.

Nguyên nhân:

```js
router.get('/:id', getRepairDetail);
router.get('/dropdown/devices', getAvailableDevices);
```

Express có thể match `/dropdown/devices` vào `/:id`.

Cách xử lý:

```js
router.get('/dropdown/devices', ...);
router.get('/dropdown/hardware-units', ...);
router.get('/dropdown/users', ...);
router.get('/:id', ...);
```

---

### 28.5 Lỗi helper frontend chưa tồn tại

Lỗi:

```text
Uncaught ReferenceError: getListFromResponse is not defined
```

Nguyên nhân:

- File module JS gọi helper nhưng helper chưa khai báo hoặc common script chưa load.

Cách xử lý:

- Khai báo local helper trong file module.
- Hoặc load common helper trước module JS.

---

### 28.6 Lỗi `window.AppPagination` undefined

Nguyên nhân:

- View chưa load:

```html
<script src="/js/common/pagination.js"></script>
```

trước module JS.

Cách xử lý:

```html
<script src="/js/common/pagination.js"></script>
<script src="/js/assignments.js"></script>
```

---

### 28.7 Lỗi HTML table render sai

Ngữ cảnh:

- Module `assignments`.

Nguyên nhân:

- Có `<div>` đặt bên trong `<table>`.

Cách xử lý:

- Chỉ để `thead`, `tbody`, `tfoot` trực tiếp trong `table`.
- Pagination container đặt ngoài `table`, ví dụ trong `card-footer`.

---

## 29. Việc còn lại nên làm tiếp

### 29.1 Test sâu các nghiệp vụ chưa test đầy đủ

Cần test lại khi có dữ liệu phù hợp:

```text
Assignments:
- Gán thiết bị mới
- Thu hồi thiết bị
- Thiết bị sau thu hồi có quay lại available hay không
- Không cho gán trùng thiết bị active

Repairs:
- Tạo phiếu sửa
- Sửa phiếu sửa
- Xóa phiếu theo trạng thái
- Hardware đang repair có bị khóa đúng không

DeviceHardwareUnits:
- Gán phần cứng mới
- Sửa phần cứng đã gán
- Detach phần cứng
- Không cho detach/gán nếu đang repair active theo rule DB
```

### 29.2 Gom frontend helper về common

Hiện nhiều module đang có helper local giống nhau:

```text
getListFromResponse
getPaginationFromResponse
getErrorMessage
escapeHtml
toggleModal
showSuccess
showError
```

Nên tạo dần:

```text
public/js/common/api.js
public/js/common/dom.js
public/js/common/alerts.js
public/js/common/modal.js
```

Sau đó module JS chỉ gọi common helper, tránh copy/paste.

### 29.3 Chuẩn hóa Base Path cho AJAX

Hiện nhiều file JS gọi API bằng path tuyệt đối:

```js
'/devices/ajax'
'/repairs/ajax'
'/assignments/ajax'
```

Nếu deploy app dưới sub-path bằng `App_Base_Path`, các URL này có thể lỗi.

Nên tạo helper:

```js
window.APP_BASE_PATH = window.APP_BASE_PATH || '';

function apiUrl(path) {
  const base = window.APP_BASE_PATH || '';
  return `${base}${path}`;
}
```

Và dùng:

```js
$.get(apiUrl('/repairs/ajax'), params)
```

### 29.4 Dọn route legacy sau khi test xong

Các module danh mục có thể đang hỗ trợ đồng thời:

```text
PUT /:id
PUT /:id/update

DELETE /:id
DELETE /:id/delete

PATCH /:id/toggle
PUT /:id/toggle
```

Sau khi toàn bộ frontend dùng route mới, có thể xóa route cũ để code gọn hơn.

### 29.5 Chuẩn hóa Stored Procedure recordsets

Nên thống nhất mọi SP phân trang trả:

```text
recordsets[0] = data
recordsets[1] = [{ totalItems }]
```

Hiện tại một số SP trả count-first hoặc field `totalRecords`, service đang phải hỗ trợ nhiều kiểu.

### 29.6 Thêm validation tập trung

Hiện validation còn rải trong controller/frontend.

Nên tạo:

```text
validators/
├── assignmentValidator.js
├── repairValidator.js
├── deviceHardwareValidator.js
└── commonValidator.js
```

### 29.7 Audit log / lịch sử thao tác

Với hệ thống quản lý tài sản, nên cân nhắc thêm audit log cho:

```text
Create/update/delete thiết bị
Gán/thu hồi thiết bị
Gán/gỡ phần cứng
Tạo/sửa/xóa phiếu sửa chữa
```

---

## 30. Trạng thái hiện tại tổng quát

```text
Nền tảng dùng chung:
✅ apiResponse
✅ pagination helper backend
✅ asyncHandler
✅ errorHandler
✅ AppPagination frontend

Module danh mục:
✅ hardware-types
✅ hardwares
✅ các module phase 2 đã có patch chuẩn hóa, cần test lại từng chức năng nếu chỉnh tiếp

Module nghiệp vụ:
✅ assignments hiển thị/lọc/phân trang/sửa/xóa cơ bản ổn
⏳ assignments gán mới/thu hồi cần test sâu
✅ repairs route/controller/service/frontend đã chuẩn hóa, route chạy ổn
⏳ repairs create/edit/delete cần test sâu
✅ device-hardware-units đã chuẩn hóa và tạm thời thấy ổn
⏳ device-hardware-units create/edit/detach cần test sâu với dữ liệu thực

Việc nên làm tiếp:
1. Test sâu các nghiệp vụ chưa test.
2. Gom frontend helper về common.
3. Chuẩn hóa base path cho AJAX.
4. Dọn route legacy.
5. Chuẩn hóa Stored Procedure recordsets.
6. Cập nhật project_context.md sau mỗi phase lớn.
```

---

## 31. Ghi chú cho lần xử lý tiếp theo

Khi tiếp tục dự án, AI/developer nên bắt đầu bằng checklist này:

1. Mở `project_context.md` trước.
2. Xác định module đang xử lý thuộc nhóm:
   - danh mục
   - nghiệp vụ assignment
   - nghiệp vụ repair
   - nghiệp vụ device-hardware
3. Kiểm tra view có load đúng common script không:
   - `/js/common/pagination.js`
   - module JS riêng
4. Kiểm tra route có `export default router` không.
5. Kiểm tra route có dùng `asyncHandler` không.
6. Kiểm tra controller có dùng `apiResponse` không.
7. Kiểm tra frontend có đọc được response mới/cũ không.
8. Kiểm tra endpoint dropdown có đặt trước route `/:id` không.
9. Kiểm tra pagination:
   - backend có `meta.pagination`
   - frontend có `AppPagination`
10. Nếu lỗi không hiển thị dữ liệu:
   - xem Console
   - xem Network response
   - kiểm tra `getListFromResponse`
   - kiểm tra `res.data` và legacy key
11. Nếu lỗi server startup:
   - kiểm tra import path có `.js`
   - kiểm tra default export
   - kiểm tra route file đúng tên với `index.js`


---

## 32. CẬP NHẬT MODULE REPAIRS REPORT — DOCX TEMPLATE → PDF PREVIEW/PRINT

Phần này ghi lại toàn bộ các xử lý mới nhất liên quan tới **báo cáo/in biểu mẫu cho module `repairs`**.

Mục tiêu đã thống nhất:

```text
Không in HTML/EJS trực tiếp vì trình duyệt có thể tự thêm header/footer/URL.
Không dùng PDFKit thủ công vì khó sửa mẫu hành chính.
Sử dụng Word DOCX template để dễ chỉnh mẫu.
Backend đổ dữ liệu vào DOCX.
LibreOffice convert DOCX → PDF.
Browser mở PDF để xem trước và in.
```

Hai mẫu in của module sửa chữa:

```text
1. Phiếu đề nghị sửa chữa thiết bị công nghệ thông tin
2. Biên bản kiểm tra tình trạng hư hỏng của trang thiết bị công nghệ thông tin
```

Quy ước mapping quan trọng đã chốt:

```text
Biên bản kiểm tra - Kết quả kiểm tra
= Phiếu đề nghị - Mô tả tình trạng hư hỏng
= RepairReportDetails.damageDescription

Biên bản kiểm tra - Hướng khắc phục
= Phiếu đề nghị - Nội dung sửa chữa cụ thể
= RepairReportDetails.repairContent
```

---

## 33. Database bổ sung cho Repairs Report

### 33.1 Bảng mới: `RepairReportDetails`

Đã tạo bảng riêng để lưu dữ liệu biểu mẫu, không nhồi thêm nhiều cột vào bảng `Repairs`.

Quan hệ:

```text
Repairs 1 ─── 0/1 RepairReportDetails
```

Khóa ngoại:

```text
RepairReportDetails.repairId → Repairs.id
```

Các trường lưu trong bảng này chỉ phục vụ đúng nội dung 2 mẫu in, không thêm dữ liệu ngoài mẫu.

Nhóm dữ liệu chính:

```text
deviceUseDate

damageDescription

surveyResult
surveyPerson1Name
surveyPerson1Date
surveyPerson2Name
surveyPerson2Date
surveyPerson3Name
surveyPerson3Date

repairMethod

expectedRepairHours
expectedStartTime
expectedEndTime
estimatedCost

actualRepairHours
actualStartTime
actualEndTime

repairResult
repairResultOther
repairContent

operationStatus
acceptanceResult
acceptanceNote

departmentRepresentativeName
financeDeptHeadName
adminDeptHeadName
directorName
repairTechnicianName
itRepresentativeName
```

### 33.2 Stored Procedure đã thêm

Đã tạo các Stored Procedure sau:

```text
sp_RepairReportDetails_GetByRepairId
sp_RepairReportDetails_Upsert
sp_Repairs_GetPrintDataById
sp_RepairReportDetails_GetDefaultDeviceUseDate
sp_RepairReportDetails_GetSurveyUsers
```

#### `sp_RepairReportDetails_GetByRepairId`

Dùng để load dữ liệu biểu mẫu khi mở modal “Thông tin biểu mẫu sửa chữa”.

Endpoint sử dụng:

```text
GET /repairs/:id/report-detail
```

#### `sp_RepairReportDetails_Upsert`

Dùng để lưu dữ liệu biểu mẫu.

Endpoint sử dụng:

```text
POST /repairs/:id/report-detail
```

Nếu đã có dữ liệu report thì update, chưa có thì insert.

#### `sp_Repairs_GetPrintDataById`

Dùng để lấy dữ liệu đầy đủ khi render DOCX/PDF.

SP này join dữ liệu từ:

```text
Repairs
Devices
DeviceTypes
Departments
HardwareUnits
Hardwares
Users
RepairReportDetails
```

SP này phải trả đủ dữ liệu cho template Word, bao gồm cả dữ liệu nghiệp vụ và dữ liệu biểu mẫu.

#### `sp_RepairReportDetails_GetDefaultDeviceUseDate`

Dùng để lấy mặc định `deviceUseDate` theo ngày bắt đầu sử dụng của thiết bị trong module **Thiết bị - Nơi sử dụng**.

Rule đã thống nhất:

```text
Ưu tiên assignment đang active: endDate IS NULL.
Nếu không có active assignment thì lấy assignment gần nhất theo startDate DESC.
```

#### `sp_RepairReportDetails_GetSurveyUsers`

Dùng để lấy danh sách gợi ý “Người khảo sát” từ DM Users.

Rule đã thống nhất:

```text
Lấy Users có deptId = 295.
Vẫn cho phép nhập tên khác ngoài danh sách.
```

---

## 34. Backend bổ sung cho Repairs Report

### 34.1 File mới: `services/repairReportService.js`

Dùng cho phần lưu/lấy dữ liệu biểu mẫu.

Các function chính:

```js
getRepairReportDetailByRepairId(repairId)
upsertRepairReportDetail(repairId, data)
getDefaultDeviceUseDateByRepairId(repairId)
getSurveyUsersByDeptId(deptId = 295)
```

Ghi chú:

- `normalizeDate()` dùng để convert input date từ form.
- `normalizeDecimal()` dùng để xử lý số tiền/giờ.
- Các field rỗng được truyền `null` xuống SQL.

### 34.2 File mới: `controllers/repairReportController.js`

Các controller chính:

```js
getRepairReportDetail(req, res)
saveRepairReportDetail(req, res)
getSurveyUsers(req, res)
```

Endpoint:

```text
GET  /repairs/:id/report-detail
POST /repairs/:id/report-detail
GET  /repairs/report-detail/survey-users?deptId=295
```

Quy tắc `getRepairReportDetail`:

```text
Nếu RepairReportDetails đã có deviceUseDate → dùng giá trị đã lưu.
Nếu chưa có deviceUseDate → lấy mặc định từ sp_RepairReportDetails_GetDefaultDeviceUseDate.
```

### 34.3 File mới: `services/docxReportService.js`

Dùng để render DOCX template rồi convert sang PDF bằng LibreOffice CLI.

File này đã chuyển từ cách dùng `libreoffice-convert` sang gọi trực tiếp `soffice.exe` bằng `child_process.execFile`.

Lý do:

```text
libreoffice-convert có thể báo lỗi "Could not find soffice binary" trên Windows.
Dùng trực tiếp đường dẫn soffice.exe ổn định hơn.
```

File này xử lý:

```text
1. Đọc DOCX template.
2. Render bằng docxtemplater + pizzip.
3. Ghi file DOCX tạm vào temp/reports.
4. Gọi LibreOffice headless convert sang PDF.
5. Đọc PDF buffer trả về controller.
```

Cấu hình `docxtemplater` quan trọng:

```js
const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
  delimiters: {
    start: '{{',
    end: '}}'
  }
});
```

Lý do:

```text
Template Word đang dùng placeholder dạng {{deviceName}}.
Docxtemplater mặc định dùng {deviceName}.
Nếu không set delimiters sẽ báo lỗi duplicate_open_tag / duplicate_close_tag.
```

### 34.4 File mới: `services/repairPrintService.js`

Dùng để lấy dữ liệu in và gọi render PDF.

Các function chính:

```js
getRepairPrintData(repairId)
generateRepairRequestPdf(repairId)
generateRepairInspectionPdf(repairId)
```

Template path:

```text
templates/repairs/repair-request-template.docx
templates/repairs/repair-inspection-template.docx
```

Output tạm:

```text
temp/reports/
```

Function `buildRepairTemplateData(row)` chịu trách nhiệm mapping dữ liệu từ DB sang placeholder của Word.

Quy tắc hiển thị tên thiết bị đã điều chỉnh:

```text
{{deviceName}} = Loại thiết bị + Tên thiết bị
```

Ví dụ:

```text
deviceType = Máy tính
deviceName = CAP01
→ template nhận deviceName = Máy tính CAP01
```

Mục tiêu là trong cả 2 mẫu in, phần “Tên thiết bị/Tên trang thiết bị” dễ hiểu hơn.

### 34.5 File mới: `controllers/repairPrintController.js`

Các controller chính:

```js
printRepairRequestPdf(req, res)
printRepairInspectionPdf(req, res)
```

Endpoint:

```text
GET /repairs/:id/reports/request/pdf
GET /repairs/:id/reports/inspection/pdf
```

Response:

```text
Content-Type: application/pdf
Content-Disposition: inline
```

Nghĩa là trình duyệt mở PDF để xem trước/in, không tự tải về bắt buộc.

---

## 35. Route bổ sung trong `routes/repair.js`

Các import mới đã thêm:

```js
import {
  getRepairReportDetail,
  saveRepairReportDetail,
  getSurveyUsers
} from '../controllers/repairReportController.js';

import {
  printRepairRequestPdf,
  printRepairInspectionPdf
} from '../controllers/repairPrintController.js';
```

Các route mới phải đặt trước route `/:id`:

```js
router.get('/report-detail/survey-users', asyncHandler(getSurveyUsers));

router.get('/:id/report-detail', asyncHandler(getRepairReportDetail));
router.post('/:id/report-detail', asyncHandler(saveRepairReportDetail));

router.get('/:id/reports/request/pdf', asyncHandler(printRepairRequestPdf));
router.get('/:id/reports/inspection/pdf', asyncHandler(printRepairInspectionPdf));

router.get('/:id', asyncHandler(getRepairDetail));
```

Lưu ý rất quan trọng:

```text
Mọi route cụ thể như /report-detail/survey-users, /:id/report-detail, /:id/reports/... phải đặt trước /:id.
Nếu đặt sau /:id, Express sẽ match nhầm và gây lỗi detail.
```

---

## 36. Frontend cập nhật cho `views/repairs/index.ejs`

Đã thêm modal:

```text
#repairReportDetailModal
```

Form:

```text
#repairReportDetailForm
```

Hidden input:

```text
#reportRepairId
```

Datalist người khảo sát:

```html
<datalist id="reportSurveyUserList"></datalist>
```

Các trường chính trong modal:

```text
reportDeviceUseDate
reportDamageDescription
reportSurveyResult
reportSurveyPerson1Name
reportSurveyPerson1Date
reportSurveyPerson2Name
reportSurveyPerson2Date
reportSurveyPerson3Name
reportSurveyPerson3Date

reportRepairMethod
reportExpectedRepairHours
reportExpectedStartTime
reportExpectedEndTime
reportEstimatedCost

reportActualRepairHours
reportActualStartTime
reportActualEndTime

reportRepairResult
reportRepairResultOther
reportRepairContent

reportOperationStatus
reportAcceptanceResult
reportAcceptanceNote

reportDepartmentRepresentativeName
reportFinanceDeptHeadName
reportAdminDeptHeadName
reportDirectorName
reportRepairTechnicianName
reportItRepresentativeName
```

Ghi chú UX:

```text
Người khảo sát 1/2/3 dùng input + datalist.
Datalist gợi ý nhân viên Users deptId = 295.
User vẫn nhập tay tên khác được.
```

---

## 37. Frontend cập nhật cho `public/js/repairs.js`

### 37.1 State mới

Đã thêm:

```js
let currentRepairRows = {};
let surveyUsersLoaded = false;
```

`currentRepairRows` dùng để giữ dữ liệu dòng hiện tại nếu cần thao tác theo dòng.

### 37.2 Event mới

Trong `bindRepairEvents()` đã thêm:

```js
$('#repairReportDetailForm')
  .off('submit')
  .on('submit', submitRepairReportDetail);
```

### 37.3 Nút mới ở cột thao tác

Cột thao tác của từng phiếu sửa chữa hiện nên có các nút:

```text
📝 Thông tin biểu mẫu
📄 Phiếu đề nghị sửa chữa
📋 Biên bản kiểm tra thiết bị
✏️ Sửa
❌ Xóa
```

Các function liên quan:

```js
openRepairReportDetailModal(id)
openRepairRequestPdf(id)
openRepairInspectionPdf(id)
```

### 37.4 Function report detail

Đã thêm các function:

```js
loadSurveyUsersForReport()
openRepairReportDetailModal(repairId)
fillRepairReportDetailForm(data)
submitRepairReportDetail(e)
formatDateInput(value)
```

Quy trình mở modal:

```text
1. Reset form.
2. Set reportRepairId.
3. Load survey users nếu chưa load.
4. GET /repairs/:id/report-detail.
5. Fill form.
6. Mở modal.
```

Quy trình lưu:

```text
1. Lấy payload từ FormData.
2. POST /repairs/:id/report-detail.
3. Hiển thị thông báo thành công.
4. Đóng modal.
```

### 37.5 Function mở PDF

Đã thêm:

```js
function openRepairRequestPdf(id) {
  window.open(`/repairs/${id}/reports/request/pdf`, '_blank');
}

function openRepairInspectionPdf(id) {
  window.open(`/repairs/${id}/reports/inspection/pdf`, '_blank');
}
```

Nếu sau này chuẩn hóa base path, cần đổi sang:

```js
window.open(apiUrl(`/repairs/${id}/reports/request/pdf`), '_blank');
```

---

## 38. DOCX Template

### 38.1 Thư mục template

Đã thống nhất thư mục:

```text
templates/
└── repairs/
    ├── repair-request-template.docx
    └── repair-inspection-template.docx
```

File `.doc` cũ phải được convert/sửa thành `.docx` hợp lệ. Không dùng `.doc` trực tiếp với `docxtemplater`.

### 38.2 Placeholder chuẩn

Tất cả placeholder dùng dạng double braces:

```text
{{deviceName}}
{{deviceCode}}
{{deptName}}
{{damageDescription}}
```

Vì vậy `docxReportService.js` bắt buộc phải có config:

```js
delimiters: {
  start: '{{',
  end: '}}'
}
```

### 38.3 Placeholder cho Phiếu đề nghị sửa chữa

Các placeholder quan trọng:

```text
{{deviceName}}
{{deviceCode}}
{{deviceUseDate}}
{{deptName}}

{{damageDescription}}

{{surveyResult}}
{{surveyPerson1Name}}
{{surveyPerson1Date}}
{{surveyPerson2Name}}
{{surveyPerson2Date}}
{{surveyPerson3Name}}
{{surveyPerson3Date}}

{{repairMethodInternalChecked}}
{{repairMethodExternalChecked}}

{{expectedRepairHours}}
{{expectedStartTime}}
{{expectedEndTime}}
{{estimatedCost}}

{{actualRepairHours}}
{{actualStartTime}}
{{actualEndTime}}

{{repairResultPassedChecked}}
{{repairResultFailedChecked}}
{{repairResultOther}}

{{repairContent}}

{{operationPassedChecked}}
{{operationFailedChecked}}

{{acceptancePassedChecked}}
{{acceptanceFailedChecked}}

{{acceptanceNote}}

{{departmentRepresentativeName}}
{{financeDeptHeadName}}
{{adminDeptHeadName}}
{{directorName}}
{{repairTechnicianName}}
{{itRepresentativeName}}

{{reportDay}}
{{reportMonth}}
{{reportYear}}
```

### 38.4 Placeholder cho Biên bản kiểm tra thiết bị

Các placeholder quan trọng:

```text
{{deviceName}}
{{deptName}}
{{inspectionResult}}
{{repairSuggestion}}

{{reportDay}}
{{reportMonth}}
{{reportYear}}

{{surveyPerson1Name}}
{{departmentRepresentativeName}}
{{itRepresentativeName}}
```

Mapping:

```js
inspectionResult = damageDescription
repairSuggestion = repairContent
```

### 38.5 Lỗi template đã gặp

Lỗi:

```text
The filetype for this file could not be identified, is this file corrupted ? Empty zip file
```

Nguyên nhân:

```text
File .docx không hợp lệ, rỗng, hoặc chỉ là file .doc đổi đuôi.
```

Cách xử lý:

```text
Tạo lại template DOCX hợp lệ bằng Word hoặc python-docx.
Không rename .doc thành .docx.
```

Lỗi:

```text
Multi error
duplicate_open_tag
duplicate_close_tag
```

Nguyên nhân:

```text
Template dùng {{...}} nhưng docxtemplater mặc định hiểu {...}.
```

Cách xử lý:

```js
delimiters: {
  start: '{{',
  end: '}}'
}
```

---

## 39. LibreOffice trên môi trường chạy Node.js

### 39.1 Nguyên tắc

Máy nào chạy Node.js server thì máy đó phải cài LibreOffice.

Ví dụ:

```text
Code ở máy local → Node chạy local → LibreOffice phải cài ở máy local.
Deploy lên server thật → Node chạy server → LibreOffice phải cài ở server.
```

Không cần cài LibreOffice trên máy client chỉ mở trình duyệt.

### 39.2 Kiểm tra LibreOffice

Trên máy chạy Node server:

```cmd
where soffice
```

Kết quả mong muốn:

```text
C:\Program Files\LibreOffice\program\soffice.com
C:\Program Files\LibreOffice\program\soffice.exe
```

Kiểm tra version:

```cmd
"C:\Program Files\LibreOffice\program\soffice.exe" --version
```

### 39.3 Biến môi trường

Nên cấu hình trong `.env`:

```env
LIBREOFFICE_PATH=C:\Program Files\LibreOffice\program\soffice.exe
```

Trong code:

```js
const sofficePath = process.env.LIBREOFFICE_PATH || DEFAULT_SOFFICE_PATH;
```

### 39.4 Lỗi đã gặp

Lỗi:

```text
Could not find soffice binary
```

Nguyên nhân phổ biến:

```text
1. Máy đang chạy Node.js chưa cài LibreOffice.
2. LibreOffice đã cài nhưng Node không thấy PATH.
3. Server đang chạy code cũ còn dùng libreoffice-convert.
4. Sửa file ở máy code nhưng Node thật chạy ở máy khác/thư mục khác.
```

Cách xử lý đã áp dụng:

```text
1. Cài LibreOffice trên đúng máy chạy Node.
2. Chuyển docxReportService sang gọi trực tiếp soffice.exe bằng execFile.
3. Thêm LIBREOFFICE_PATH vào .env.
4. Restart terminal/VS Code/server sau khi cài hoặc sửa PATH.
```

Dấu hiệu chạy đúng code mới:

```text
Terminal có log [REPORT] LibreOffice path: ...
Terminal có log [REPORT] DOCX input: ...
Terminal có log [REPORT] PDF output dir: ...
```

---

## 40. Xóa phiếu sửa chữa khi có RepairReportDetails

Sau khi thêm bảng `RepairReportDetails`, khi xóa phiếu `Repairs` có dữ liệu report liên quan có thể bị lỗi khóa ngoại.

Nguyên nhân:

```text
RepairReportDetails.repairId FK tới Repairs.id.
Nếu xóa Repairs trước, SQL Server không cho xóa vì còn record con.
```

Cách xử lý đã thống nhất:

```text
Sửa Stored Procedure sp_Repairs_Delete để xóa RepairReportDetails trước, sau đó xóa Repairs.
```

Không khuyến khích dùng `ON DELETE CASCADE` ngay vì hệ thống quản lý tài sản cần xóa rõ ràng, dễ kiểm soát.

Logic SP đề xuất:

```sql
BEGIN TRANSACTION;

DELETE FROM dbo.RepairReportDetails
WHERE repairId = @pId;

DELETE FROM dbo.Repairs
WHERE id = @pId;

COMMIT TRANSACTION;
```

Nếu có rule chỉ cho xóa phiếu ở trạng thái `opened`, rule này vẫn giữ trước khi delete.

Trạng thái hiện tại:

```text
✅ Đã phát hiện lỗi.
✅ Đã sửa SP delete theo hướng xóa RepairReportDetails trước.
✅ Người dùng test lại đã ổn.
```

---

## 41. Trạng thái hiện tại của Repairs Report

```text
✅ Đã tạo bảng RepairReportDetails.
✅ Đã tạo Stored Procedure Get/Upsert/PrintData/DefaultDeviceUseDate/SurveyUsers.
✅ Đã thêm service/controller/route để GET/POST report detail.
✅ Đã thêm modal nhập thông tin biểu mẫu trên màn hình repairs.
✅ Đã tự động lấy ngày đưa vào sử dụng mặc định từ DeviceAssignments.
✅ Đã gợi ý người khảo sát từ Users deptId = 295 bằng datalist.
✅ Vẫn cho phép nhập người khảo sát khác thủ công.
✅ Đã tạo hệ thống DOCX template → PDF bằng docxtemplater + LibreOffice.
✅ Đã thêm 2 route xuất PDF:
   - /repairs/:id/reports/request/pdf
   - /repairs/:id/reports/inspection/pdf
✅ Đã test cơ bản chức năng xuất PDF ổn.
✅ Đã chỉnh tên thiết bị trên mẫu in thành: Loại thiết bị + Tên thiết bị.
✅ Đã xử lý xóa Repairs khi có RepairReportDetails.
```

---

## 42. Việc còn cần kiểm tra/hoàn thiện cho Repairs Report

### 42.1 Cần kiểm tra kỹ layout 2 template

Cần mở PDF thực tế và kiểm tra:

```text
Phiếu đề nghị sửa chữa:
- Căn lề đúng mẫu.
- Các dòng dài có xuống dòng đẹp không.
- Checkbox ☑/☐ hiển thị đúng font.
- Chữ ký và ngày tháng đúng vị trí.
- Không tràn trang.

Biên bản kiểm tra:
- Tiêu đề, quốc hiệu, đơn vị đúng.
- Dòng tên thiết bị có loại thiết bị + tên thiết bị.
- Kết quả kiểm tra lấy đúng damageDescription.
- Hướng khắc phục lấy đúng repairContent.
- Chữ ký đúng vị trí.
```

### 42.2 Cần kiểm tra dữ liệu rỗng

Khi một số field chưa nhập, template không nên hiển thị `undefined`, `null` hoặc lỗi.

Service hiện có `clean(value)` để trả chuỗi rỗng, nhưng vẫn cần test bằng phiếu chưa nhập report detail.

### 42.3 Cần kiểm tra production deployment

Khi deploy lên server thật, cần đảm bảo:

```text
1. Server đã cài LibreOffice.
2. .env có LIBREOFFICE_PATH đúng.
3. Thư mục temp/reports tồn tại hoặc app có quyền tạo.
4. App pool/service user có quyền chạy soffice.exe.
5. App pool/service user có quyền ghi temp/reports.
6. 2 template DOCX nằm đúng templates/repairs.
```

### 42.4 Quản lý file tạm

Hệ thống tạo DOCX/PDF tạm trong:

```text
temp/reports/
```

Đã bổ sung cơ chế xóa file tạm sau khi gửi PDF và cleanup dự phòng theo thời gian. Xem chi tiết tại mục 45.

### 42.5 Cần bổ sung log thân thiện hơn

Khi lỗi render DOCX/PDF, nên trả message rõ hơn:

```text
Không tìm thấy template.
Template có placeholder lỗi.
LibreOffice không convert được.
Không tìm thấy dữ liệu in.
```

Hiện lỗi có thể bị global error handler trả chung chung.

---

## 43. File mới/thay đổi sau phần Repairs Report

### 43.1 File mới

```text
services/repairReportService.js
controllers/repairReportController.js

services/docxReportService.js
services/repairPrintService.js
controllers/repairPrintController.js

templates/repairs/repair-request-template.docx
templates/repairs/repair-inspection-template.docx

temp/reports/
```

### 43.2 File đã chỉnh

```text
routes/repair.js
views/repairs/index.ejs
public/js/repairs.js
services/repairPrintService.js
services/docxReportService.js
```

### 43.3 Database đã chỉnh

```text
Bảng:
- RepairReportDetails

Stored Procedures:
- sp_RepairReportDetails_GetByRepairId
- sp_RepairReportDetails_Upsert
- sp_Repairs_GetPrintDataById
- sp_RepairReportDetails_GetDefaultDeviceUseDate
- sp_RepairReportDetails_GetSurveyUsers
- sp_Repairs_Delete
```

---

## 44. Ghi chú cho AI/developer xử lý tiếp phần report

Khi tiếp tục sửa phần report, nên kiểm tra theo thứ tự:

```text
1. Kiểm tra dữ liệu DB:
   EXEC sp_Repairs_GetPrintDataById @pRepairId = <id>

2. Kiểm tra route:
   /repairs/:id/reports/request/pdf
   /repairs/:id/reports/inspection/pdf

3. Kiểm tra template có đúng tên placeholder không.

4. Kiểm tra docxReportService có delimiters {{ }} không.

5. Kiểm tra LibreOffice:
   where soffice
   "C:\Program Files\LibreOffice\program\soffice.exe" --version

6. Kiểm tra .env:
   LIBREOFFICE_PATH=C:\Program Files\LibreOffice\program\soffice.exe

7. Kiểm tra quyền ghi:
   temp/reports/

8. Nếu lỗi xóa phiếu sửa chữa:
   kiểm tra sp_Repairs_Delete có xóa RepairReportDetails trước không.
```

Không nên quay lại hướng in HTML/EJS trực tiếp cho biểu mẫu hành chính, vì có thể gặp lại vấn đề footer URL của trình duyệt và layout khó ổn định.


---

## 45. Cập nhật quản lý file tạm report — temp/reports

Sau khi hoàn thiện chức năng xuất report từ DOCX template sang PDF, đã bổ sung cơ chế quản lý file tạm để tránh thư mục `temp/reports` phình to theo thời gian.

### 45.1 Vấn đề đã phát hiện

Mỗi lần user bấm in báo cáo sửa chữa, hệ thống tạo ra file tạm trong:

```text
temp/reports/
```

Thông thường mỗi lần in có thể sinh ra:

```text
repair-request-<repairId>-<timestamp>.docx
repair-request-<repairId>-<timestamp>.pdf
repair-inspection-<repairId>-<timestamp>.docx
repair-inspection-<repairId>-<timestamp>.pdf
```

Nếu không dọn, server sẽ tích lũy nhiều file rác, làm nặng ổ đĩa và khó bảo trì.

### 45.2 Cách xử lý đã áp dụng

Đã xử lý theo 2 lớp:

```text
1. Xóa ngay file tạm sau khi PDF đã được đọc vào buffer và gửi cho user.
2. Thêm cleanup dự phòng để quét file cũ trong temp/reports theo thời gian.
```

### 45.3 Xóa file ngay sau khi gửi PDF

File đã cập nhật:

```text
controllers/repairPrintController.js
```

Controller hiện dùng `try/finally` để đảm bảo sau khi tạo và gửi PDF, hệ thống gọi cleanup file tạm:

```js
finally {
  await cleanupGeneratedReportFiles(result);
}
```

Các file được xóa gồm:

```text
result.docxOutputPath
result.pdfOutputPath
```

Vì controller đang gửi PDF bằng:

```js
res.send(result.pdfBuffer)
```

PDF đã được đọc vào RAM trước khi response gửi đi, nên có thể xóa file `.pdf` vật lý trong `temp/reports` ngay sau đó mà không ảnh hưởng việc user xem/in PDF.

Log khi xóa thành công:

```text
[REPORT] Deleted temp file: ...
```

Nếu không xóa được, chỉ log warning, không throw lỗi để tránh ảnh hưởng response cho user:

```text
[REPORT] Cannot delete temp file: ...
```

### 45.4 Cleanup dự phòng

Đã đề xuất/thêm utility:

```text
utils/cleanupTempReports.js
```

Utility này có 2 hàm:

```js
cleanupTempReports({ reportsDir, maxAgeMinutes })
startTempReportsCleanup({ reportsDir, maxAgeMinutes, intervalMinutes })
```

Mục tiêu:

```text
- Khi server khởi động: quét và xóa file tạm cũ.
- Khi server đang chạy: định kỳ quét lại để dọn file còn sót.
```

Cấu hình khuyến nghị:

```js
startTempReportsCleanup({
  reportsDir: REPORTS_TEMP_DIR,
  maxAgeMinutes: 60,
  intervalMinutes: 30
});
```

Ý nghĩa:

```text
- Xóa file cũ hơn 60 phút.
- Mỗi 30 phút quét lại một lần.
```

### 45.5 Cấu hình trong index.js

Trong `index.js`, cần import utility cleanup:

```js
import path from 'path';
import { fileURLToPath } from 'url';
import { startTempReportsCleanup } from './utils/cleanupTempReports.js';
```

Nếu `index.js` đã có `path` hoặc `fileURLToPath` thì không import trùng.

Cấu hình thư mục temp report:

```js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_TEMP_DIR = path.join(__dirname, 'temp', 'reports');

startTempReportsCleanup({
  reportsDir: REPORTS_TEMP_DIR,
  maxAgeMinutes: 60,
  intervalMinutes: 30
});
```

### 45.6 Lưu ý khi deploy server thật

Khi deploy lên server production, cần đảm bảo user chạy Node.js có quyền:

```text
- Tạo thư mục temp/reports nếu chưa tồn tại.
- Ghi file .docx/.pdf tạm.
- Đọc file PDF tạm.
- Xóa file tạm sau khi gửi response.
```

Nếu chạy bằng IIS/PM2/Windows Service, cần kiểm tra quyền của account chạy process.

### 45.7 Trạng thái đã test

Người dùng đã test thực tế:

```text
✅ PDF vẫn mở được để xem/in.
✅ File DOCX/PDF tạm được xóa sau khi user nhận PDF.
✅ Không còn giữ file report tạm sau mỗi lần in thành công.
```

### 45.8 Quy tắc sau này

`temp/reports` chỉ dùng cho file tạm. Không dùng thư mục này để lưu lịch sử file đã in.

Nếu sau này cần lưu lịch sử report đã xuất, nên tạo cơ chế riêng:

```text
reports/archive/
hoặc bảng RepairReportFiles
```

Không nên trộn file tạm và file lưu trữ lâu dài trong cùng `temp/reports`.
