// services/repairService.js

import { poolPromise } from '../db/db.js';
import sql from 'mssql';

/**
 * Lấy danh sách phiếu sửa chữa có lọc + phân trang.
 * Stored Procedure: sp_Repairs_GetAll_Paged
 *
 * SP expected recordsets:
 * - recordsets[0]: data rows
 * - recordsets[1]: [{ total }]
 */
export async function getRepairs(filters = {}) {
  const pool = await poolPromise;
  const request = pool.request();

  const offset = parseInt(filters.offset, 10) || 0;
  const limit = parseInt(filters.limit, 10) || 10;

  const allowedStatus = ['opened', 'in-progress', 'completed', 'canceled', 'all'];
  const status =
    allowedStatus.includes(filters.status) && filters.status !== 'all'
      ? filters.status
      : null;

  const deviceKeyword = filters.deviceKeyword
    ? `%${filters.deviceKeyword}%`
    : null;

  const hardwareKeyword = filters.hardwareKeyword
    ? `%${filters.hardwareKeyword}%`
    : null;

  const result = await request
    .input('pDeviceKeyword', sql.NVarChar(100), deviceKeyword)
    .input('pHardwareKeyword', sql.NVarChar(100), hardwareKeyword)
    .input('pStatus', sql.VarChar(20), status)
    .input('pOffset', sql.Int, offset)
    .input('pLimit', sql.Int, limit)
    .execute('sp_Repairs_GetAll_Paged');

  if (!result.recordsets || result.recordsets.length < 2) {
    throw new Error(
      'Stored Procedure sp_Repairs_GetAll_Paged không trả về đủ dữ liệu phân trang.'
    );
  }

  const repairs = result.recordsets[0] || [];
  const totalItems = result.recordsets[1]?.[0]?.total || 0;

  return {
    repairs,
    totalItems
  };
}

/**
 * Lấy chi tiết phiếu sửa chữa theo ID.
 * Stored Procedure: sp_Repairs_GetById
 */
export async function getRepairById(id) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('pId', sql.Int, parseInt(id, 10))
    .execute('sp_Repairs_GetById');

  return result.recordset?.[0] || null;
}

/**
 * Tạo mới phiếu sửa chữa.
 * Stored Procedure: sp_Repairs_Create
 *
 * Lưu ý:
 * - Cho phép chọn nhiều hardwareUnitIds.
 * - Nếu không chọn linh kiện cụ thể thì tạo repair với pHardwareUnitId = null.
 */
export async function createRepair(data) {
  const pool = await poolPromise;

  let hardwareUnitIds = data.hardwareUnitIds;

  if (!Array.isArray(hardwareUnitIds)) {
    hardwareUnitIds = hardwareUnitIds ? [hardwareUnitIds] : [null];
  }

  if (hardwareUnitIds.length === 0) {
    hardwareUnitIds = [null];
  }

  for (const hwId of hardwareUnitIds) {
    await pool.request()
      .input('pDeviceId', sql.Int, parseInt(data.deviceId, 10))
      .input('pHardwareUnitId', sql.Int, hwId ? parseInt(hwId, 10) : null)
      .input('pBrokenDate', sql.DateTime, data.brokenDate ? new Date(data.brokenDate) : null)
      .input('pRepairDate', sql.DateTime, data.repairDate ? new Date(data.repairDate) : null)
      .input('pStatus', sql.VarChar(20), data.status || 'opened')
      .input('pNote', sql.NVarChar(200), data.note || '')
      .input('pUserCreateName', sql.NVarChar(100), data.userCreateName || null)
      .input('pUserResolveId', sql.Int, data.userResolveId ? parseInt(data.userResolveId, 10) : null)
      .execute('sp_Repairs_Create');
  }
}

/**
 * Cập nhật phiếu sửa chữa.
 * Stored Procedure: sp_Repairs_Update
 */
export async function updateRepair(id, data) {
  const pool = await poolPromise;

  await pool.request()
    .input('pId', sql.Int, parseInt(id, 10))
    .input('pDeviceId', sql.Int, parseInt(data.deviceId, 10))
    .input('pHardwareUnitId', sql.Int, data.hardwareUnitId ? parseInt(data.hardwareUnitId, 10) : null)
    .input('pBrokenDate', sql.DateTime, data.brokenDate ? new Date(data.brokenDate) : null)
    .input('pRepairDate', sql.DateTime, data.repairDate ? new Date(data.repairDate) : null)
    .input('pStatus', sql.VarChar(20), data.status)
    .input('pNote', sql.NVarChar(200), data.note || '')
    .input('pUserCreateName', sql.NVarChar(100), data.userCreateName || null)
    .input('pUserResolveId', sql.Int, data.userResolveId ? parseInt(data.userResolveId, 10) : null)
    .execute('sp_Repairs_Update');
}

/**
 * Xóa phiếu sửa chữa.
 * Stored Procedure: sp_Repairs_Delete
 */
export async function deleteRepair(id) {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('pId', sql.Int, parseInt(id, 10))
      .execute('sp_Repairs_Delete');

    const row = result?.recordset?.[0];

    if (row && (row.success !== undefined || row.message !== undefined)) {
      return {
        success: !!row.success,
        message: row.message
      };
    }

    return {
      success: true,
      message: 'Đã xóa phiếu sửa chữa'
    };
  } catch (error) {
    console.error('SQL Error:', error);

    return {
      success: false,
      message: error.message || 'Có lỗi xảy ra khi xóa phiếu sửa chữa'
    };
  }
}

/**
 * Lấy danh sách thiết bị có thể sửa chữa.
 * Stored Procedure: sp_Repairs_GetAvailableDevices
 */
export async function getAvailableDevicesForRepair() {
  const pool = await poolPromise;

  const result = await pool.request()
    .execute('sp_Repairs_GetAvailableDevices');

  return result.recordset || [];
}

/**
 * Lấy danh sách người dùng hoạt động.
 * Stored Procedure: sp_Repairs_GetActiveUsers
 */
export async function getActiveUsers() {
  const pool = await poolPromise;

  const result = await pool.request()
    .execute('sp_Repairs_GetActiveUsers');

  return result.recordset || [];
}

/**
 * Lấy danh sách linh kiện của thiết bị khi TẠO phiếu sửa chữa.
 * Stored Procedure: sp_Repairs_GetHardwareUnitsForCreate
 */
export async function getHardwareUnitsForCreate(deviceId) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('pDeviceId', sql.Int, parseInt(deviceId, 10))
    .execute('sp_Repairs_GetHardwareUnitsForCreate');

  return result.recordset || [];
}

/**
 * Lấy danh sách linh kiện của thiết bị khi CHỈNH SỬA phiếu sửa chữa.
 * Stored Procedure: sp_Repairs_GetHardwareUnitsForEdit
 */
export async function getHardwareUnitsForEdit(deviceId, currentRepairId) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('pDeviceId', sql.Int, parseInt(deviceId, 10))
    .input('pCurrentRepairId', sql.Int, parseInt(currentRepairId, 10))
    .execute('sp_Repairs_GetHardwareUnitsForEdit');

  return result.recordset || [];
}

/**
 * Deprecated compatibility function.
 */
export async function getAvailableHardwareUnitsForRepair(deviceId, currentRepairId = null) {
  console.warn(
    'Function getAvailableHardwareUnitsForRepair is deprecated. Use getHardwareUnitsForEdit instead.'
  );

  return getHardwareUnitsForEdit(deviceId, currentRepairId);
}