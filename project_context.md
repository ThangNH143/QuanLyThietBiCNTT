# PROJECT_CONTEXT.md — QuanLyThietBiCNTT

> Tài liệu này mô tả bối cảnh kỹ thuật, domain, kiến trúc, quy ước xử lý và định hướng chuẩn hóa cho dự án **QuanLyThietBiCNTT**. Mục tiêu là giúp developer hoặc mô hình AI tiếp tục phát triển dự án mà không hiểu sai nghiệp vụ, không phá vỡ cấu trúc hiện có và từng bước chuẩn hóa toàn bộ module theo cùng một mô hình xử lý/hiển thị.

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
