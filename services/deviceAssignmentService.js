import { poolPromise } from '../db/db.js';
import sql from 'mssql';

/**
 * Lấy danh sách các lệnh giao thiết bị có lọc.
 * Tên SP: sp_DeviceAssignments_Get
 */
export async function getDeviceAssignments(filters = {}) {
    // 1. Chuẩn bị tham số
    const allowed = ['active', 'revoked', 'all'];
    const status = allowed.includes(filters.status) ? filters.status : 'active';

    const deviceNameSearch = filters.deviceName ? `%${filters.deviceName}%` : null;
    const deptNameSearch = filters.deptName ? `%${filters.deptName}%` : null;

    // 2. Gọi Stored Procedure
    const pool = await poolPromise;
    const result = await pool.request()
        .input('pStatus', sql.VarChar(10), status)
        .input('pDeviceNameSearch', sql.NVarChar(100), deviceNameSearch)
        .input('pDeptNameSearch', sql.NVarChar(100), deptNameSearch)
        .execute('sp_DeviceAssignments_Get');

    // SP này chỉ trả về một recordset duy nhất
    return result.recordset;
}

/**
 * Lấy danh sách thiết bị chưa được giao và không đang sửa chữa.
 * Tên SP: sp_Devices_GetAssignable
 */
export async function getAssignableDevices() {
    const pool = await poolPromise;
    const result = await pool.request()
        .execute('sp_Devices_GetAssignable');
    
    return result.recordset;
}

/**
 * Tạo lệnh giao thiết bị mới.
 * Tên SP: sp_DeviceAssignments_Create
 */
export async function createDeviceAssignment({ deviceId, deptId, startDate, note }) {
    const pool = await poolPromise;
    await pool.request()
        .input('pDeviceId', sql.Int, deviceId)
        .input('pDeptId', sql.Int, deptId)
        .input('pStartDate', sql.DateTime, startDate)
        .input('pNote', sql.NVarChar(200), note || null) // Dùng null thay vì '' nếu không có note
        .execute('sp_DeviceAssignments_Create');
}

/**
 * Cập nhật lệnh giao thiết bị.
 * Tên SP: sp_DeviceAssignments_Update
 */
export async function updateDeviceAssignment(id, { deptId, startDate, endDate, note }) {
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .input('pDeptId', sql.Int, deptId)
        .input('pStartDate', sql.DateTime, startDate)
        .input('pEndDate', sql.DateTime, endDate || null)
        .input('pNote', sql.NVarChar(200), note || null)
        .execute('sp_DeviceAssignments_Update');
}

/**
 * Thu hồi thiết bị (Cập nhật endDate và isInactive).
 * Tên SP: sp_DeviceAssignments_Revoke
 */
export async function revokeDeviceAssignment(id) {
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .execute('sp_DeviceAssignments_Revoke');
}

/**
 * Xóa lệnh giao thiết bị.
 * Tên SP: sp_DeviceAssignments_Delete
 */
export async function deleteDeviceAssignment(id) {
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .execute('sp_DeviceAssignments_Delete');
}