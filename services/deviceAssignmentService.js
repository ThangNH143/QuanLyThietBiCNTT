// services/deviceAssignmentService.js

import { poolPromise } from '../db/db.js';
import sql from 'mssql';

/**
 * Lấy danh sách các lệnh giao thiết bị có lọc + phân trang.
 * Stored Procedure: sp_DeviceAssignments_Get_Paged
 *
 * SP expected recordsets:
 * - recordsets[0]: data rows
 * - recordsets[1]: [{ total }]
 */
export async function getDeviceAssignments(filters = {}) {
  const offset = parseInt(filters.offset, 10) || 0;
  const limit = parseInt(filters.limit, 10) || 10;

  const allowedStatuses = ['active', 'revoked', 'all'];
  const status = allowedStatuses.includes(filters.status)
    ? filters.status
    : 'active';

  const deviceNameSearch = filters.deviceName
    ? `%${filters.deviceName}%`
    : null;

  const deptNameSearch = filters.deptName
    ? `%${filters.deptName}%`
    : null;

  const pool = await poolPromise;

  const result = await pool.request()
    .input('pStatus', sql.VarChar(10), status)
    .input('pDeviceNameSearch', sql.NVarChar(100), deviceNameSearch)
    .input('pDeptNameSearch', sql.NVarChar(100), deptNameSearch)
    .input('pOffset', sql.Int, offset)
    .input('pLimit', sql.Int, limit)
    .execute('sp_DeviceAssignments_Get_Paged');

  if (!result.recordsets || result.recordsets.length < 2) {
    throw new Error(
      'Stored Procedure sp_DeviceAssignments_Get_Paged không trả về đủ dữ liệu phân trang.'
    );
  }

  const assignments = result.recordsets[0] || [];
  const totalItems = result.recordsets[1]?.[0]?.total || 0;

  return {
    assignments,
    totalItems
  };
}

/**
 * Lấy tất cả phòng ban cho dropdown.
 * Stored Procedure: sp_GetAllDepartments
 */
export async function getAllDepartmentsForDropdown() {
  const pool = await poolPromise;

  const result = await pool.request()
    .execute('sp_GetAllDepartments');

  return result.recordset || [];
}

/**
 * Lấy danh sách thiết bị có thể gán.
 * Stored Procedure: sp_Devices_GetAssignable
 *
 * Business rule nên nằm trong SP:
 * - Thiết bị chưa được gán active
 * - Thiết bị không inactive
 * - Thiết bị không đang sửa chữa active, nếu dự án yêu cầu rule này
 */
export async function getAssignableDevices() {
  const pool = await poolPromise;

  const result = await pool.request()
    .execute('sp_Devices_GetAssignable');

  return result.recordset || [];
}

/**
 * Tạo lệnh giao thiết bị mới.
 * Stored Procedure: sp_DeviceAssignments_Create
 */
export async function createDeviceAssignment({ deviceId, deptId, startDate, note }) {
  const pool = await poolPromise;

  await pool.request()
    .input('pDeviceId', sql.Int, parseInt(deviceId, 10))
    .input('pDeptId', sql.Int, parseInt(deptId, 10))
    .input('pStartDate', sql.DateTime, startDate)
    .input('pNote', sql.NVarChar(200), note || null)
    .execute('sp_DeviceAssignments_Create');
}

/**
 * Cập nhật lịch sử giao thiết bị.
 * Stored Procedure: sp_DeviceAssignments_Update
 */
export async function updateDeviceAssignment(id, { deptId, startDate, endDate, note }) {
  const pool = await poolPromise;

  await pool.request()
    .input('pId', sql.Int, parseInt(id, 10))
    .input('pDeptId', sql.Int, parseInt(deptId, 10))
    .input('pStartDate', sql.DateTime, startDate)
    .input('pEndDate', sql.DateTime, endDate || null)
    .input('pNote', sql.NVarChar(200), note || null)
    .execute('sp_DeviceAssignments_Update');
}

/**
 * Thu hồi thiết bị.
 * Stored Procedure: sp_DeviceAssignments_Revoke
 */
export async function revokeDeviceAssignment(id) {
  const pool = await poolPromise;

  await pool.request()
    .input('pId', sql.Int, parseInt(id, 10))
    .execute('sp_DeviceAssignments_Revoke');
}

/**
 * Xóa bản ghi gán thiết bị.
 * Stored Procedure: sp_DeviceAssignments_Delete
 */
export async function deleteDeviceAssignment(id) {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input('pId', sql.Int, parseInt(id, 10))
      .execute('sp_DeviceAssignments_Delete');

    return {
      success: true,
      message: 'Xóa thành công'
    };
  } catch (error) {
    console.error('SQL Error:', error);

    return {
      success: false,
      message: error.message || 'Có lỗi xảy ra khi xóa dữ liệu'
    };
  }
}