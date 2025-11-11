import { poolPromise } from '../db/db.js';
import sql from 'mssql';

/**
 * Lấy danh sách phiếu sửa chữa có lọc.
 * Sử dụng SP: sp_Repairs_GetAll
 */
export async function getRepairs(filters = {}) {
    const pool = await poolPromise;
    const request = pool.request();

    const allowedStatus = ['opened', 'in-progress', 'completed', 'canceled'];
    const status = allowedStatus.includes(filters.status) ? filters.status : null;

    const deviceKeyword = filters.deviceKeyword ? filters.deviceKeyword : null;
    const hardwareKeyword = filters.hardwareKeyword ? filters.hardwareKeyword : null;

    const result = await request
        .input('pDeviceKeyword', sql.NVarChar(100), deviceKeyword ? `%${deviceKeyword}%` : null)
        .input('pHardwareKeyword', sql.NVarChar(100), hardwareKeyword ? `%${hardwareKeyword}%` : null)
        .input('pStatus', sql.VarChar(20), status)
        .execute('sp_Repairs_GetAll');

    // SP này chỉ trả về 1 tập hợp kết quả
    return result.recordset;
}

/**
 * Lấy chi tiết phiếu sửa chữa theo ID.
 * Sử dụng SP: sp_Repairs_GetById
 */
export async function getRepairById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('pId', sql.Int, id)
        .execute('sp_Repairs_GetById');
        
    return result.recordset[0];
}

/**
 * Tạo mới phiếu sửa chữa.
 * Duy trì logic lặp qua mảng hardwareUnitIds ở tầng Service.
 * Sử dụng SP: sp_Repairs_Create
 */
export async function createRepair(data) {
    const pool = await poolPromise;

    for (const hwId of data.hardwareUnitIds || [null]) {
        await pool.request()
            .input('pDeviceId', sql.Int, data.deviceId)
            .input('pHardwareUnitId', sql.Int, hwId || null)
            .input('pBrokenDate', sql.DateTime, data.brokenDate ? new Date(data.brokenDate) : null)
            .input('pRepairDate', sql.DateTime, data.repairDate ? new Date(data.repairDate) : null)
            .input('pStatus', sql.VarChar(20), data.status || 'opened')
            .input('pNote', sql.NVarChar(200), data.note || '')
            .input('pUserCreateName', sql.NVarChar(100), data.userCreateName || null)
            .input('pUserResolveId', sql.Int, data.userResolveId || null)
            .execute('sp_Repairs_Create');
    }
}

/**
 * Cập nhật phiếu sửa chữa.
 * Sử dụng SP: sp_Repairs_Update
 */
export async function updateRepair(id, data) {
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .input('pDeviceId', sql.Int, data.deviceId)
        .input('pHardwareUnitId', sql.Int, data.hardwareUnitId || null)
        .input('pBrokenDate', sql.DateTime, data.brokenDate ? new Date(data.brokenDate) : null)
        .input('pRepairDate', sql.DateTime, data.repairDate ? new Date(data.repairDate) : null)
        .input('pStatus', sql.VarChar(20), data.status)
        .input('pNote', sql.NVarChar(200), data.note || '')
        .input('pUserCreateName', sql.NVarChar(100), data.userCreateName || null)
        .input('pUserResolveId', sql.Int, data.userResolveId || null)
        .execute('sp_Repairs_Update');
}

/**
 * Xóa phiếu sửa chữa.
 * Sử dụng SP: sp_Repairs_Delete
 */
export async function deleteRepair(id) {
    const pool = await poolPromise;
    await pool.request().input('pId', sql.Int, id).execute('sp_Repairs_Delete');
}

/**
 * Lấy danh sách thiết bị có thể sửa chữa.
 * Sử dụng SP: sp_Repairs_GetAvailableDevices
 */
export async function getAvailableDevicesForRepair() {
    const pool = await poolPromise;
    const result = await pool.request().execute('sp_Repairs_GetAvailableDevices');
    return result.recordset;
}

/**
 * Lấy danh sách người dùng hoạt động (Users).
 * Sử dụng SP: sp_Repairs_GetActiveUsers
 */
export async function getActiveUsers() {
    const pool = await poolPromise;
    const result = await pool.request().execute('sp_Repairs_GetActiveUsers');
    return result.recordset;
}

/**
 * Lấy danh sách linh kiện của thiết bị (khi TẠO phiếu sửa chữa).
 * Loại trừ các linh kiện đang có phiếu 'opened' hoặc 'in-progress'.
 * Sử dụng SP: sp_Repairs_GetHardwareUnitsForCreate
 */
export async function getHardwareUnitsForCreate(deviceId) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('pDeviceId', sql.Int, deviceId)
        .execute('sp_Repairs_GetHardwareUnitsForCreate');
    return result.recordset;
}

/**
 * Lấy danh sách linh kiện của thiết bị (khi CHỈNH SỬA phiếu sửa chữa).
 * Xác định linh kiện nào bị khóa bởi phiếu khác.
 * Sử dụng SP: sp_Repairs_GetHardwareUnitsForEdit
 */
export async function getHardwareUnitsForEdit(deviceId, currentRepairId) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('pDeviceId', sql.Int, deviceId)
        .input('pCurrentRepairId', sql.Int, currentRepairId)
        .execute('sp_Repairs_GetHardwareUnitsForEdit');
    return result.recordset;
}

/**
 * Loại bỏ hàm getAvailableHardwareUnitsForRepair cũ do đã được thay thế bằng getHardwareUnitsForCreate/getHardwareUnitsForEdit
 * Export hàm placeholder để tránh lỗi nếu có nơi gọi đến.
 */
export async function getAvailableHardwareUnitsForRepair(deviceId, currentRepairId = null) {
    console.warn("Function getAvailableHardwareUnitsForRepair is deprecated. Use getHardwareUnitsForEdit instead.");
    return getHardwareUnitsForEdit(deviceId, currentRepairId);
}