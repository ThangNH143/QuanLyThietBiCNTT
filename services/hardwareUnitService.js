import { poolPromise } from '../db/db.js';
import sql from 'mssql';
import { canDeleteRecord } from '../utils/deletionGuard.js';

/**
 * Lấy danh sách đơn vị phần cứng với phân trang và lọc phức tạp.
 * Sử dụng SP: sp_HardwareUnits_GetAll
 */
export async function getHardwareUnits(filters) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    const pool = await poolPromise;
    const request = pool.request();

    // Chuẩn bị tham số cho SP
    const codeParam = filters.code ? `%${filters.code}%` : null;
    const serialNumberParam = filters.serialNumber ? `%${filters.serialNumber}%` : null;
    const hardwareNameParam = filters.hardwareName ? `%${filters.hardwareName}%` : null;
    
    // Đảm bảo startDate và endDate là đối tượng Date hoặc NULL
    const startDateParam = filters.startDate ? new Date(filters.startDate) : null;
    const endDateParam = filters.endDate ? new Date(filters.endDate) : null;

    const result = await request
        .input('pOffset', sql.Int, offset)
        .input('pLimit', sql.Int, limit)
        .input('pCode', sql.VarChar(10), codeParam)
        .input('pSerialNumber', sql.VarChar(100), serialNumberParam)
        .input('pHardwareName', sql.NVarChar(100), hardwareNameParam)
        .input('pStartDate', sql.DateTime, startDateParam)
        .input('pEndDate', sql.DateTime, endDateParam)
        .input('pFilter', sql.VarChar(20), filters.filter || null)
        .execute('sp_HardwareUnits_GetAll');

    /* * SP sp_HardwareUnits_GetAll trả về 2 result sets:
     * Result 1: Tổng số lượng (total)
     * Result 2: Dữ liệu (units)
     */
    
    // Kiểm tra kết quả
    if (!result.recordsets || result.recordsets.length < 2) {
        throw new Error("Lỗi truy vấn: SP không trả về đủ 2 tập hợp kết quả.");
    }
    
    const totalCount = result.recordsets[0][0].total || 0;
    const hardwareUnitsData = result.recordsets[1];

    // Đổi tên biến units thành hardwareUnits để nhất quán (nếu cần thiết), hoặc giữ lại units
    return { 
        units: hardwareUnitsData, // Giữ lại tên units theo code gốc của bạn
        total: totalCount 
    };
}

/**
 * Tạo mới đơn vị phần cứng.
 * Sử dụng SP: sp_HardwareUnits_Create
 */
export async function createHardwareUnitService({ code, serialNumber, hardwareId, purchaseDate, note }) {
    const pool = await poolPromise;
    await pool.request()
        .input('pCode', sql.VarChar(10), code)
        .input('pSerialNumber', sql.VarChar(100), serialNumber)
        .input('pHardwareId', sql.Int, hardwareId)
        .input('pPurchaseDate', sql.DateTime, purchaseDate ? new Date(purchaseDate) : null)
        .input('pNote', sql.NVarChar(200), note)
        .execute('sp_HardwareUnits_Create');
}

/**
 * Cập nhật đơn vị phần cứng.
 * Sử dụng SP: sp_HardwareUnits_Update
 */
export async function updateHardwareUnitService(id, { code, serialNumber, hardwareId, purchaseDate, note }) {
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .input('pCode', sql.VarChar(10), code)
        .input('pSerialNumber', sql.VarChar(100), serialNumber)
        .input('pHardwareId', sql.Int, hardwareId)
        .input('pPurchaseDate', sql.DateTime, purchaseDate ? new Date(purchaseDate) : null)
        .input('pNote', sql.NVarChar(200), note)
        .execute('sp_HardwareUnits_Update');
}

/**
 * Chuyển đổi trạng thái hoạt động/ngừng hoạt động của đơn vị phần cứng.
 * Sử dụng SP: sp_HardwareUnits_ToggleStatus
 */
export async function toggleHardwareUnitService(id) {
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .execute('sp_HardwareUnits_ToggleStatus');
}

/**
 * Xóa đơn vị phần cứng (có kiểm tra khóa ngoại).
 * Sử dụng SP: sp_HardwareUnits_Delete
 */
export async function deleteHardwareUnitService(id) {
    // 1. Kiểm tra khóa ngoại ở tầng Node.js
    const rules = [
        { table: 'Devices_HardwareUnits', field: 'hardwareUnitId' },
        { table: 'Repairs', field: 'hardwareUnitId' },
    ];
    const canDelete = await canDeleteRecord(id, rules);
    
    if (!canDelete) {
        throw new Error('Không thể xóa - phần cứng chi tiết đang được sử dụng');
    }
    
    // 2. Nếu OK, gọi SP để xóa
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .execute('sp_HardwareUnits_Delete');
}