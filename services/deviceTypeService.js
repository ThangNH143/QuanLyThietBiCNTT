import { poolPromise } from '../db/db.js';
import sql from 'mssql';
// Giữ nguyên import cho hàm kiểm tra xóa
import { canDeleteRecord } from '../utils/deletionGuard.js';

/**
 * Lấy danh sách loại thiết bị với phân trang và lọc.
 * Sử dụng SP: sp_DeviceTypes_GetAll
 */
export async function getDeviceTypes(filters) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    const pool = await poolPromise;
    const request = pool.request();

    // Chuẩn bị tham số cho SP
    const codeParam = filters.code ? filters.code : null;
    const nameParam = filters.name ? filters.name : null;

    const result = await request
        .input('pOffset', sql.Int, offset)
        .input('pLimit', sql.Int, limit)
        .input('pCode', sql.NVarChar(100), codeParam)
        .input('pName', sql.NVarChar(100), nameParam)
        .input('pFilter', sql.VarChar(20), filters.filter || null)
        .execute('sp_DeviceTypes_GetAll');

    /* * SP sp_DeviceTypes_GetAll trả về 2 result sets:
     * Result 1: Tổng số lượng (total)
     * Result 2: Dữ liệu (deviceTypes)
     */
    
    // Kiểm tra kết quả
    if (!result.recordsets || result.recordsets.length < 2) {
        throw new Error("Lỗi truy vấn: SP không trả về đủ 2 tập hợp kết quả.");
    }
    
    const totalCount = result.recordsets[0][0].total || 0;
    const deviceTypesData = result.recordsets[1];

    return { 
        deviceTypes: deviceTypesData, 
        total: totalCount 
    };
}

/**
 * Tạo mới loại thiết bị.
 * Sử dụng SP: sp_DeviceTypes_Create
 */
export async function createDeviceTypeService({ code, name, note }) {
    const pool = await poolPromise;
    await pool.request()
        .input('pCode', sql.VarChar(10), code)
        .input('pName', sql.NVarChar(100), name)
        .input('pNote', sql.NVarChar(200), note)
        .execute('sp_DeviceTypes_Create');
}

/**
 * Cập nhật loại thiết bị.
 * Sử dụng SP: sp_DeviceTypes_Update
 */
export async function updateDeviceTypeService(id, { code, name, note }) {
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .input('pCode', sql.VarChar(10), code)
        .input('pName', sql.NVarChar(100), name)
        .input('pNote', sql.NVarChar(200), note)
        .execute('sp_DeviceTypes_Update');
}

/**
 * Chuyển đổi trạng thái hoạt động/ngừng hoạt động của loại thiết bị.
 * Sử dụng SP: sp_DeviceTypes_ToggleStatus
 */
export async function toggleDeviceTypeService(id) {
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .execute('sp_DeviceTypes_ToggleStatus');
}

/**
 * Xóa loại thiết bị (có kiểm tra khóa ngoại).
 * Sử dụng SP: sp_DeviceTypes_Delete
 */
export async function deleteDeviceTypeService(id) {
    try {
        // 1. Kiểm tra khóa ngoại ở tầng Node.js
        const rules = [
            { table: 'Devices', field: 'deviceTypeId' }
        ];
        const canDelete = await canDeleteRecord(id, rules);
        
        if (!canDelete.success) {
            return canDelete;
        } 
        
        // 2. Nếu OK, gọi SP để xóa
        const pool = await poolPromise;
        await pool.request()
            .input('pId', sql.Int, id)
            .execute('sp_DeviceTypes_Delete');

            return { success: true, message: 'Xóa thành công' };
    } catch (error) {
        // CHỈNH SỬA TẠI ĐÂY:
        // Nếu lỗi đến từ lệnh THROW trong SP, message sẽ nằm trong error.message
        console.error('SQL Error:', error);
        return { 
            success: false, 
            message: error.message || 'Có lỗi xảy ra khi xóa dữ liệu' 
        };
    }
}