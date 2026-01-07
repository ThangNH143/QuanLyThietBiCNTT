import { poolPromise } from '../db/db.js';
import sql from 'mssql';
import { canDeleteRecord } from '../utils/deletionGuard.js';
import sanitizeFilters from '../utils/sanitizeFilters.js';

/**
 * Lấy danh sách thiết bị (có phân trang và lọc).
 * Tên SP: sp_Devices_GetPaged
 */
export async function getDevices(filtersRaw) {
    const filters = sanitizeFilters(filtersRaw);
    const page = Number(filters.page) > 0 ? parseInt(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? parseInt(filters.limit) : 10;
    const offset = (page - 1) * limit;

    // Xác định trạng thái lọc (active, inactive, all)
    const filterStatus = filters.filter === 'active' || filters.filter === 'inactive'
        ? filters.filter 
        : 'all';

    const pool = await poolPromise;
    const request = pool.request()
        .input('pOffset', sql.Int, offset)
        .input('pLimit', sql.Int, limit)
        .input('pFilterStatus', sql.VarChar(10), filterStatus)
        // Lọc chuỗi (LIKE): thêm % và truyền vào SP. Nếu không có giá trị, truyền null
        .input('pCode', sql.VarChar(50), filters.code ? `%${filters.code}%` : null)
        .input('pName', sql.NVarChar(100), filters.name ? `%${filters.name}%` : null)
        // Lọc số/ngày: truyền giá trị trực tiếp hoặc null
        .input('pDeviceTypeId', sql.Int, filters.deviceTypeId || null)
        .input('pStartDate', sql.Date, filters.startDate || null)
        .input('pEndDate', sql.Date, filters.endDate || null);

    const result = await request.execute('sp_Devices_GetPaged'); 

    // SP này trả về hai recordset: [0] là total, [1] là data
    const total = result.recordsets[0][0].total;
    const devices = result.recordsets[1];

    return { devices, total };
}

/**
 * Tạo thiết bị mới.
 * Tên SP: sp_Devices_Create
 */
export async function createDeviceService({ code, name, deviceTypeId, purchaseDate, note }) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('pCode', sql.VarChar(50), code)
        .input('pName', sql.NVarChar(100), name)
        .input('pDeviceTypeId', sql.Int, deviceTypeId)
        .input('pPurchaseDate', sql.Date, purchaseDate)
        .input('pNote', sql.NVarChar(sql.MAX), note)
        .execute('sp_Devices_Create');

    return result.recordset[0].newId;
}

/**
 * Cập nhật thiết bị.
 * Tên SP: sp_Devices_Update
 */
export async function updateDeviceService(id, { code, name, deviceTypeId, purchaseDate, note }) {
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .input('pCode', sql.VarChar(50), code)
        .input('pName', sql.NVarChar(100), name)
        .input('pDeviceTypeId', sql.Int, deviceTypeId)
        .input('pPurchaseDate', sql.Date, purchaseDate)
        .input('pNote', sql.NVarChar(sql.MAX), note)
        .execute('sp_Devices_Update');
}

/**
 * Bật/Tắt trạng thái thiết bị.
 * Tên SP: sp_Devices_ToggleInactive
 */
export async function toggleDeviceService(id) {
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .execute('sp_Devices_ToggleInactive');
}

/**
 * Xóa thiết bị.
 * Tên SP: sp_Devices_Delete
 * Lưu ý: Giữ lại logic kiểm tra ràng buộc (canDeleteRecord) ở tầng Service.
 */
export async function deleteDeviceService(id) {
    try {
        const pool = await poolPromise;
        const rules = [
            { table: 'DeviceAssignments', field: 'deviceId', label: 'Lịch sử bàn giao' },
            { table: 'Repairs', field: 'deviceId', label: 'Phiếu sửa chữa' },
            { table: 'DeviceHardwareUnits', field: 'deviceId', label: 'Cấu hình phần cứng' }
        ];
        // Giữ logic kiểm tra ràng buộc ở đây, chỉ gọi SP khi an toàn để xóa
        const canDelete = await canDeleteRecord(id, rules);
        if (canDelete.success === false) {
            return {
                success: false,
                message: canDelete.message
            };
        } 
        
        const result = await pool.request()
                        .input('pId', sql.Int, id)
                        .execute('sp_Devices_Delete');

        if (result.rowsAffected[0] > 0) {
            return { 
                success: true, 
                message: 'Xóa thiết bị thành công.' 
            };
        } else {
            return { 
                success: false, 
                message: 'Không tìm thấy thiết bị để xóa hoặc lỗi thực thi.' 
            };
        }
    } catch (error) {
        console.error('SQL Error:', error);
        return { 
            success: false, 
            message: error.message || 'Có lỗi xảy ra khi xóa dữ liệu' 
        };
    }   
}

/**
 * Lấy danh sách loại thiết bị (Dropdown).
 * Tên SP: sp_DeviceTypes_GetDropdown
 */
export async function getDeviceTypesDropdown() {
    const pool = await poolPromise;
    const result = await pool.request()
        .execute('sp_DeviceTypes_GetDropdown');
    return result.recordset;
}