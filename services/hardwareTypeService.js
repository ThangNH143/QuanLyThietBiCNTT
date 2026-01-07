import { poolPromise } from '../db/db.js';
import sql from 'mssql';
import { canDeleteRecord } from '../utils/deletionGuard.js';

/**
 * Lấy danh sách loại phần cứng với phân trang và lọc.
 * Sử dụng SP: sp_HardwareTypes_GetAll
 */
export async function getHardwareTypes(filters) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    const pool = await poolPromise;
    const request = pool.request();

    // Chuẩn bị tham số cho SP (sử dụng LIKE %...% hoặc NULL)
    const codeParam = filters.code ? `%${filters.code}%` : null;
    const nameParam = filters.name ? `%${filters.name}%` : null;

    const result = await request
        .input('pOffset', sql.Int, offset)
        .input('pLimit', sql.Int, limit)
        .input('pCode', sql.VarChar(50), codeParam)
        .input('pName', sql.NVarChar(100), nameParam)
        .input('pFilter', sql.VarChar(20), filters.filter || null)
        .execute('sp_HardwareTypes_GetAll');

    /* * SP sp_HardwareTypes_GetAll trả về 2 result sets:
     * Result 1: Tổng số lượng (total)
     * Result 2: Dữ liệu (hardwareTypes)
     */
    
    // Kiểm tra kết quả
    if (!result.recordsets || result.recordsets.length < 2) {
        throw new Error("Lỗi truy vấn: SP không trả về đủ 2 tập hợp kết quả.");
    }
    
    const totalCount = result.recordsets[0][0].total || 0;
    const hardwareTypesData = result.recordsets[1];

    return { 
        hardwareTypes: hardwareTypesData, 
        total: totalCount 
    };
}

/**
 * Tạo mới loại phần cứng.
 * Sử dụng SP: sp_HardwareTypes_Create
 */
export async function createHardwareTypeService({ code, name, note }) {
    const pool = await poolPromise;
    await pool.request()
        .input('pCode', sql.VarChar(10), code)
        .input('pName', sql.NVarChar(100), name)
        .input('pNote', sql.NVarChar(200), note)
        .execute('sp_HardwareTypes_Create');
}

/**
 * Cập nhật loại phần cứng.
 * Sử dụng SP: sp_HardwareTypes_Update
 */
export async function updateHardwareTypeService(id, { code, name ,note}) {
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .input('pCode', sql.VarChar(10), code)
        .input('pName', sql.NVarChar(100), name)
        .input('pNote', sql.NVarChar(200), note)
        .execute('sp_HardwareTypes_Update');
}

/**
 * Chuyển đổi trạng thái hoạt động/ngừng hoạt động của loại phần cứng.
 * Sử dụng SP: sp_HardwareTypes_ToggleStatus
 */
export async function toggleHardwareTypeService(id) {
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .execute('sp_HardwareTypes_ToggleStatus');
}

/**
 * Xóa loại phần cứng (có kiểm tra khóa ngoại).
 * Sử dụng SP: sp_HardwareTypes_Delete
 */
export async function deleteHardwareTypeService(id) {
        try {
        // 1. Kiểm tra khóa ngoại ở tầng Node.js
        const rules = [
            { table: 'Hardwares', field: 'hardwareTypeId' }
        ];
        const canDelete = await canDeleteRecord(id, rules);
        
        if (!canDelete.success) {
            return canDelete;
        } 
        
        // 2. Nếu OK, gọi SP để xóa
        const pool = await poolPromise;
        await pool.request()
            .input('pId', sql.Int, id)
            .execute('sp_HardwareTypes_Delete');

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