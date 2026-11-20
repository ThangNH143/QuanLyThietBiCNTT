# 5. UI-DESIGN.md — Hệ thống Thiết kế Giao diện Y tế Thống nhất (BVĐKKV Long Khánh UI Kit)

> **Dự án:** Hệ thống Quản lý Thiết bị CNTT (`QuanLyThietBiCNTT`) & **Bộ UI/UX Chuẩn dùng chung cho toàn bộ WebApp nội bộ BVĐKKV Long Khánh**  
> **Stack UI:** React 19 + TypeScript + Vite + Tailwind CSS + `lucide-react` + `qrcode` + Font tiếng Việt WOFF2 nội bộ (**100% Offline LAN, 0 CDN**)  
> **Tham chiếu nhận diện:** Đồng bộ trực tiếp với mẫu **WebApp Báo cáo Bệnh viện ĐKKV Long Khánh** (Sidebar xanh dương y tế `#00548F`, Topbar gạch dọc xanh `#005A9C`, nút chính xanh ngọc `#0B8A5C`, bảng header xanh đậm chữ trắng) kết hợp chuẩn UX hệ thống y tế/ITAM chuyên nghiệp (OpenMRS, Epic density, Snipe-IT, GLPI).  
> **Phiên bản:** 3.0 (**Lộ trình B**)  
> **Cập nhật lần cuối:** 2026-11-20  
> **Xem thay đổi chi tiết tại:** `CHANGELOG.md` mục `[3.0.0-plan]`

---

## 1. Hệ thống Token Nhận diện Y tế (`client/src/design-system/tokens.css`)

Toàn bộ WebApp nội bộ của Bệnh viện (QLTB CNTT hôm nay, và Báo cáo CĐHA/Lâm sàng/TCKT, Helpdesk, Kho... sau này) dùng **duy nhất 1 bộ Design Tokens** để người dùng bệnh viện nhìn là nhận ra ngay, thao tác quen tay không phải học lại:

### 1.1 Bảng màu Chuẩn (Clinical Medical Blue & Emerald)
| Token CSS | Mã màu | Vai trò & Nơi sử dụng |
|---|---|---|
| `--brand-sidebar-bg` | `#00548F` | Nền thanh điều hướng trái (Sidebar cố định) |
| `--brand-sidebar-active` | `rgba(255, 255, 255, 0.16)` | Nền mục menu đang chọn (bo góc `8px`, chữ trắng đậm) |
| `--brand-primary` | `#005A9C` | Header bảng dữ liệu (`thead`), gạch dọc nhấn tiêu đề trang (`4px`), nút phụ `Xuất Excel` / `In` |
| `--brand-primary-hover` | `#004475` | Hover của nút xanh dương & liên kết chính |
| `--action-primary` | `#0B8A5C` | Nút hành động chính (`🔍 Xem báo cáo`, `➕ Thêm mới`, `💾 Lưu`, `⚡ Bơm mực`) |
| `--action-primary-hover` | `#09704A` | Hover nút hành động chính |
| `--action-danger` | `#DC2626` | Nút `Đăng xuất`, `Xóa`, `Hủy phiếu`, tồn kho âm |
| `--surface-canvas` | `#F4F7FA` | Nền không gian làm việc chính (dịu mắt khi làm việc 8 tiếng/ngày) |
| `--surface-card` | `#FFFFFF` | Thẻ Bộ lọc, Thẻ Bảng, Thẻ KPI, Modal (`border: 1px solid #E2E8F0`, `radius: 12px`, shadow nhẹ) |
| `--text-primary` | `#0F172A` | Tiêu đề, nội dung chính |
| `--text-secondary` | `#475569` | Nhãn trường nhập liệu (`label`), phụ đề |
| `--text-muted` | `#64748B` | Chữ gợi ý (placeholder), trạng thái rỗng |

### 1.2 Kiểu chữ, Mật độ & Nhãn Trạng thái (Medical High-Clarity Density)
- **Font chữ (100% nội bộ — CẤM Google Fonts CDN):** `Inter` hoặc `Be Vietnam Pro` (đóng gói WOFF2 qua `@fontsource` vào `client/dist/assets/`), fallback `Segoe UI, sans-serif`. Số liệu/mã thiết bị/ngày tháng/tiền tệ dùng `font-variant-numeric: tabular-nums` để căn thẳng hàng dọc.
- **Mật độ chuẩn màn hình bệnh viện (≥ 1366×768):** ô input cao `36px–38px`, dòng bảng cao `40px–44px` giúp hiển thị gọn **12–18 dòng/màn hình** mà không rối mắt; kích thước chữ gốc `14px`, header bảng `12px` in hoa đậm (`font-weight: 700; letter-spacing: 0.02em`).
- **Chuẩn Nhãn & Màu Trạng thái (Pastel Pill — dịu mắt, độ tương phản ≥ 4.5:1 WCAG AA):**

| Nhóm | Giá trị | Nhãn hiển thị | Nền / Chữ / Viền |
|---|---|---|---|
| **Trạng thái thiết bị (`usageStatus`)** | `in_use` | `Đang sử dụng` | `#DCFCE7` / `#166534` / `#BBF7D0` |
| | `in_stock` | `Trong kho` | `#F1F5F9` / `#475569` / `#CBD5E1` |
| | `under_repair` | `Đang sửa chữa` | `#FEF3C7` / `#92400E` / `#FDE68A` |
| | `inactive` | `Tạm ngưng` | `#FEE2E2` / `#991B1B` / `#FECACA` |
| **Tình trạng bảo hành (`warrantyStatus`)** | `valid` | `Còn BH (MM/yyyy)` | `#DCFCE7` / `#166534` |
| | `expiring` | `Sắp hết BH` | `#FEF3C7` / `#92400E` |
| | `expired` | `Hết bảo hành` | `#F1F5F9` / `#64748B` |
| **Kho mực & Cảnh báo bơm mực** | Tồn âm / Vượt Hộp mực | `⚠️ Tồn âm` / `🚨 Thay Hộp mực` | `#FEE2E2` / `#991B1B` (chữ đậm) |
| | ≤ Ngưỡng / Vượt Drum | `⚠️ Sắp hết` / `⚠️ Kiểm tra Drum` | `#FEF3C7` / `#92400E` |

---

## 2. Khung Giao diện Chung Dùng cho Mọi WebApp (`<HospitalShell>`)

Đồng bộ chặt chẽ với mẫu WebApp Báo cáo bệnh viện của bạn (Sidebar trái xanh `#00548F` + Topbar trắng có gạch dọc xanh `#005A9C` + nút Đăng xuất đỏ bên phải):

```text
+--------------------------+-----------------------------------------------------------------------------------+
| [Logo] BỆNH VIỆN ĐKKV    |  ┃ Tiêu đề Trang Hiện Tại (VD: Quản lý Thiết bị CNTT)   [🔑 Đổi MK]  [↪ Đăng xuất] |
|        LONG KHÁNH        |-----------------------------------------------------------------------------------|
|   Quản lý Thiết bị CNTT  |                                                                                   |
|--------------------------|  +-----------------------------------------------------------------------------+  |
| (👤) Nguyễn Hoàng Thắng  |  | CARD 1: BỘ LỌC / THAO TÁC NHANH (Nền trắng, bo 12px, lưới 4 cột gọn)        |  |
|      Phòng CNTT (Admin)  |  | [Từ ngày*] [Đến ngày*] [Khoa/Phòng v] [Trạng thái v]                         |  |
|--------------------------|  |         [ 🔍 Xem báo cáo / Lọc ]  [ 📄 Xuất Excel ]  [ ➕ Thêm mới ]         |  |
| ▾ 📊 Tổng quan & Báo cáo |  +-----------------------------------------------------------------------------+  |
|   [ Tổng quan KPI      ] |                                                                                   |
|     BC Sử dụng Thiết bị  |  +-----------------------------------------------------------------------------+  |
|     BC Sửa chữa          |  | CARD 2: BẢNG DỮ LIỆU (Header xanh #005A9C, chữ trắng IN HOA, sticky cột)    |  |
|     BC Máy in & Mực      |  | STT | MÃ TB | TÊN THIẾT BỊ | LOẠI | KHOA/PHÒNG | CẤU HÌNH | BH | TT | TÁC VỤ |  |
| ▾ 💻 Quản lý Tài sản     |  | --------------------------------------------------------------------------- |  |
|     Danh sách Thiết bị   |  |  1  | CAP-01| Máy tính 01  | PC   | Khoa Nội   | i3·8G×2  | 🟢 | 🟢 | [···] |  |
|     Cụm Linh kiện        |  |  ... (Trạng thái rỗng / loading luôn CĂN GIỮA khung nhìn, không lệch phải!) |  |
| ▾ 🔄 Vận hành & Bảo trì  |  |-----------------------------------------------------------------------------|  |
|     Bàn giao & Chuyển    |  | Hiển thị 1–20 / 410 bản ghi                   [ < ] [ 1 ] [ 2 ] [ 3 ] [ > ] |  |
|     Sửa chữa & PDF       |  +-----------------------------------------------------------------------------+  |
| ▾ 🖨️ Máy in & Kho mực    |                                                                                   |
|     Máy in & Bơm mực     |                                                                                   |
| ▾ 🗂️ Danh mục            |                                                                                   |
|     Khoa / Phòng         |                                                                                   |
|     Loại thiết bị        |                                                                                   |
| ▾ ⚙️ Quản trị (chỉ admin)|                                                                                   |
|     Tài khoản            |                                                                                   |
|     Cấu hình Hệ thống    |                                                                                   |
|     Nhật ký Hệ thống     |                                                                                   |
|--------------------------|                                                                                   |
| PHÒNG CÔNG NGHỆ THÔNG TIN|                                                                                   |
| BVĐKKV Long Khánh © 2026 |                                                                                   |
+--------------------------+-----------------------------------------------------------------------------------+
```

### Quy chuẩn Cải tiến UX so với bản mẫu tham chiếu (từ trải nghiệm hệ thống Y tế)
1. **Khắc phục lỗi Empty State bị đẩy lệch phải khi bảng nhiều cột:** Trong `<DataTable>`, khối "Vui lòng chọn khoảng thời gian..." / "Không có dữ liệu phù hợp" / Skeleton loading đặt trong overlay/sticky container **luôn căn giữa đúng viewport** dù bảng có 15–20 cột cuộn ngang!
2. **Sticky Header & Sticky Columns:** Khi bảng nhiều cột (như Sổ CĐHA hoặc Danh sách Thiết bị), hàng tiêu đề xanh `#005A9C` dính cố định khi cuộn dọc (`sticky top-0`), cột `STT`/`Mã` dính trái và cột `Thao tác` dính phải khi cuộn ngang.
3. **Thu gọn Sidebar linh hoạt:** Có nút thu gọn Sidebar về dạng thanh icon (`68px`) cho màn hình laptop 1366px khi cần xem bảng báo cáo rất rộng, và tự chuyển sang ngăn kéo (Drawer) khi mở trên điện thoại quét QR!
4. **Sẵn sàng App Switcher cho Đa-WebApp:** Khi Bệnh viện gắn thêm WebApp thứ 2 (vd: Báo cáo CĐHA/Lâm sàng/TCKT), góc trên Sidebar/Topbar mở rộng thêm nút chuyển nhanh giữa các ứng dụng trong cùng phiên đăng nhập SSO mà không phải đăng nhập lại.

---

## 3. Bộ Component Dùng Chung Tái sử dụng (`client/src/design-system/components/`)

| Component | Mô tả chuẩn hành vi (dùng chung cho QLTB CNTT & mọi WebApp sau) |
|---|---|
| `<HospitalShell>` | Khung Sidebar xanh `#00548F` + Accordion Menu cấu hình bằng JSON `navigation.ts` + User Card + Topbar gạch dọc `#005A9C` + nút Đổi mật khẩu & Đăng xuất đỏ + Footer PCNTT. |
| `<FilterCard>` | Thẻ bộ lọc nền trắng bo `12px`, lưới responsive 3–5 cột, tự debounce `300 ms` cho ô tìm kiếm chữ, hàng nút thao tác (xanh ngọc `#0B8A5C` cho Xem/Lọc/Thêm, xanh dương `#005A9C` cho Xuất Excel/In, xám viền cho Xóa lọc). |
| `<DataTable>` | Header xanh `#005A9C` chữ trắng IN HOA, đường kẻ chia cột mảnh `rgba(255,255,255,0.2)`, zebra hover `#F8FAFC`, sticky header + sticky action column, **Empty/Loading căn giữa viewport**, hỗ trợ chọn checkbox nhiều dòng (cho In tem QR) và `<Pagination>` chân bảng. |
| `<Modal>` & `<Drawer>` | Hỗ trợ 3 kích thước (`md`, `lg`, `xl`), đóng bằng `Esc`/nút `X` (trừ Modal ép đổi mật khẩu khóa cứng), tự reset form + xóa lỗi validation khi đóng/mở, footer nút `Lưu` tự khóa (`disabled` + spinner) chống bấm đúp. |
| `<SearchableSelect>` | Component chọn có ô gõ tìm tiếng Việt không dấu/có dấu (thay thế Select2, chạy mượt 100% bên trong Modal không bao giờ bị kẹt focus hay vỡ z-index!). |
| `<StatusBadge>` | Hiển thị đúng bảng màu pastel chuẩn mục 1.2 cho `usageStatus`, `warrantyStatus`, trạng thái sửa chữa, tồn kho mực. |
| `<ConfirmDialog>` & `<Toast>` | Hộp thoại xác nhận xóa/thu hồi/hủy mềm có ô nhập lý do bắt buộc (khi hủy phiếu/nhật ký mực) và thông báo góc trên phải tự tắt sau 3.5 giây. |
| `<RequireRole>` | Ẩn hoàn toàn nút/tab/menu khi vai trò hiện tại không nằm trong `allowedRoles` (server vẫn kiểm tra độc lập). |
| `<PrintHeader>` | Header chuẩn in khổ A4 ngang (Tên BV ĐKKV Long Khánh, Phòng CNTT, Tiêu đề báo cáo, Bộ lọc đang áp dụng, Thời điểm in, Người in) tự ẩn trên màn hình và tự hiện khi `@media print`. |

---

## 4. Wireframe Các Màn hình Trọng tâm của `QuanLyThietBiCNTT`

### 4.1 Màn hình Đăng nhập (`/login`) & Ép Đổi Mật khẩu
- Giao diện tối giản, trang trọng: nền `#F4F7FA` với dải nhấn xanh `#00548F`, thẻ đăng nhập trắng chính giữa (`420px`) có Logo + tên **BỆNH VIỆN ĐA KHOA KHU VỰC LONG KHÁNH — HỆ THỐNG NỘI BỘ**, ô `Tên đăng nhập`, `Mật khẩu` (nút hiện/ẩn), nút xanh ngọc `Đăng nhập`.
- Thông báo lỗi đăng nhập luôn chung, rõ ràng; nếu `mustChangePassword = 1` tự mở Modal bắt buộc đổi mật khẩu mới (`≥ 8` ký tự) không có nút bỏ qua.

### 4.2 Trang chủ Dashboard & 3 Màn hình Báo cáo Đa chiều (`/`, `/reports/*`)
- **Trang chủ `/` (Tổng quan KPI & Cảnh báo):**
  - Hàng 5 thẻ KPI có dải màu nhấn cạnh trái: `Tổng TB hoạt động` (xanh dương), `Đang sử dụng` (xanh ngọc), `Trong kho` (xám), `Đang sửa chữa` (cam), `Sắp hết bảo hành` (vàng) + phụ đề `Tạm ngưng: N thiết bị`.
  - 2 cột bên dưới: trái là bảng gọn **Phiếu sửa chữa tồn đọng** (`opened` / `in-progress`) + **Cảnh báo Máy in cần chú ý** (Phase 7); phải là **Phân bố theo Loại thiết bị** & **Lối tắt nhanh**.
- **3 Màn hình / Tab Báo cáo Đa chiều (Theo đúng chuẩn mẫu `Sổ CĐHA` của bạn):**
  - `Báo cáo Sử dụng Thiết bị`, `Báo cáo Sửa chữa`, `Báo cáo Máy in & Mực`: cùng bố cục `<FilterCard>` (Từ ngày*, Đến ngày*, Khoa/Phòng, Loại máy, Trạng thái + nút xanh ngọc `🔍 Xem báo cáo`, nút xanh dương `📄 Xuất Excel`, nút `🖨️ In báo cáo`) → Ma trận tổng hợp Khoa/Phòng × Loại máy (dòng "Chưa bàn giao (Kho)", cột "Đang sửa" không cộng tổng) → `<DataTable>` chi tiết (cảnh báo vàng nếu > 5.000 dòng).

### 4.3 Màn hình Thiết bị (`/devices`) — Quick Config, Clone, Import CSV, Hồ sơ 360° & Tem QR
- **Thanh hành động đầu trang (theo RBAC):** `[ 🏷️ In tem QR đã chọn ]` (mọi quyền), `[ 📥 Nhập Excel/CSV ]` (`technician`/`admin`), `[ ➕ Thêm thiết bị ]` (`technician`/`admin`).
- **Bảng `<DataTable>`:** `[☐] | Mã | Tên | Loại | Khoa/Phòng | Cấu hình tóm tắt | Bảo hành | Trạng thái | Thao tác ([360°] [📋 Clone] [🏷️ QR] [✏️ Sửa] [⏸ Tạm ngưng] [🗑️ Xóa])`.
- **Modal Thêm/Sửa tích hợp Quick Config 1 Bước (`DeviceModal`):** Phần 1 thông tin cơ bản + `Hạn bảo hành` + `Bàn giao ngay cho Khoa/Phòng`; Phần 2 danh sách động `Mẫu linh kiện + Số lượng` (`[+ Thêm dòng]`, `[+ Thêm nhanh mẫu mới]`); ở chế độ Sửa có khối chỉ đọc "Linh kiện đang gắn" phía trên và chỉ bổ sung linh kiện mới.
- **Modal Nhập CSV Hàng loạt (`BulkImportModal`):** Bước 1 Tải file mẫu UTF-8 → Bước 2 Chọn file & bấm `🔍 Kiểm tra trước (Dry-run Preview)` hiển thị bảng kết quả `✅ Hợp lệ` / `❌ Lỗi từng dòng` → Bước 3 `💾 Xác nhận nhập N dòng hợp lệ`.
- **Modal Xem trước In Tem QR (`QrPrintModal`):** Chọn khổ `Tờ A4 nhiều tem (3×8)` hoặc `Tem nhiệt đơn (50×30mm)`, sinh QR 100% offline trỏ về `/devices?profileId=<id>`, bấm `🖨️ In Tem Ngay`.
- **Modal Hồ sơ 360° (`Profile360Modal`):** 4 Tabs không gọi lại API (`Cấu hình linh kiện`, `Lịch sử bàn giao + In Biên bản PDF`, `Lịch sử sửa chữa + 2 mẫu PDF`, `Nhật ký bơm mực` nếu là máy in). Khi mở `/devices?profileId=<id>` trên màn hình di động (`< 768px`), hiển thị dạng thẻ dọc gọn dễ đọc khi đứng cạnh máy ở khoa/phòng!

### 4.4 Cụm Linh kiện (`/hardware`), Bàn giao (`/assignments`), Sửa chữa (`/repairs`), Máy in & Mực (`/printer-ink`), Quản trị (`/admin/*`)
- **Cụm Linh kiện (`/hardware`):** 4 Tabs nội bộ (`Cá thể linh kiện`, `Mẫu phần cứng`, `Loại phần cứng`, `Gán / Gỡ linh kiện`), chuẩn Read-only `<DataTable>` + Modal, hiển thị Bảo hành sạch & Thiết bị đang gắn.
- **Bàn giao (`/assignments`):** Bổ sung nút `[🔄 Luân chuyển]` (Modal chọn Khoa đích + Ngày chuyển + Ghi chú) và `[📄 Biên bản]` (xuất PDF Bàn giao/Thu hồi trực tiếp trong tab mới).
- **Sửa chữa (`/repairs`):** Modal Tạo/Sửa chọn **nhiều linh kiện (tối đa 20)** có hiển thị badge Bảo hành ngay bên cạnh; Modal Biểu mẫu sửa chữa tự điền sẵn tên Lãnh đạo ký mặc định từ `SystemSettings`.
- **Máy in & Kho mực (`/printer-ink` — Phase 7):** 4 Tabs (`Danh sách Máy in & Cảnh báo + Bơm mực 1-Click`, `Nhật ký Dịch vụ & Hủy mềm`, `Kho Vật tư tô đỏ tồn âm`, `Phiếu nhập kho đơn giản theo Mã phiếu nhập`).
- **Quản trị (`/admin/*` — chỉ `admin`):**
  - `/admin/accounts`: Quản lý tài khoản, khóa/mở khóa, reset mật khẩu hiện 1 lần.
  - `/admin/settings`: 2 khối rõ ràng (*Người ký mặc định biểu mẫu in* & *Tổ chức / Ngưỡng cảnh báo bảo hành, Drum, Hộp mực*).
  - `/admin/audit-logs`: Lọc theo Ứng dụng (`appCode`), Tài khoản, Hành động, Khoảng thời gian.

---

## 5. Hướng dẫn Tái sử dụng Bộ UI/UX cho Các WebApp Bệnh viện Tương lai

Khi xây dựng WebApp tiếp theo (ví dụ tích hợp lại **WebApp Báo cáo CĐHA / Lâm sàng / Tài chính Kế toán** trên nền mới):
1. Dùng nguyên `<HospitalShell>` và chỉ truyền cấu hình menu mới (`Khoa CĐHA`, `Lâm Sàng`, `Tài Chính Kế Toán`...) vào prop `navigation`.
2. Dùng nguyên `<FilterCard>` + `<DataTable>` + `<PrintHeader>` từ `client/src/design-system/` — tự động kế thừa bảng màu `#00548F`/`#005A9C`/`#0B8A5C`, sticky header, empty state căn giữa, xuất Excel và in A4.
3. Gọi chung `apiClient.ts` tới `/api/v1/core/auth/*` để hưởng ngay SSO nội bộ cùng với `QuanLyThietBiCNTT`.
