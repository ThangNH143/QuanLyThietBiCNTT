// services/deviceHardwareUnitService.js

import { poolPromise } from '../db/db.js';
import sql from 'mssql';

/**
 * Lấy danh sách thiết bị cùng phần cứng đã gán.
 * Stored Procedure: sp_DeviceHardwareUnits_GetDevicesWithHardware_Paged
 *
 * SP hiện dùng tham số:
 * - pDeviceName
 * - pHardwareKeyword
 * - pPage
 * - pLimit
 */
export async function getDevicesWithHardware(filters = {}) {
  const pool = await poolPromise;
  const request = pool.request();

  const page = Math.max(parseInt(filters.page || 1, 10), 1);
  const limit = Math.max(parseInt(filters.limit || 10, 10), 1);

  const deviceNameParam = filters.deviceName
    ? `%${filters.deviceName}%`
    : null;

  const hardwareKeywordParam = filters.hardwareKeyword
    ? `%${filters.hardwareKeyword}%`
    : null;

  const result = await request
    .input('pDeviceName', sql.NVarChar(100), deviceNameParam)
    .input('pHardwareKeyword', sql.NVarChar(100), hardwareKeywordParam)
    .input('pPage', sql.Int, page)
    .input('pLimit', sql.Int, limit)
    .execute('sp_DeviceHardwareUnits_GetDevicesWithHardware_Paged');

  const rs0 = result.recordsets?.[0] || [];
  const rs1 = result.recordsets?.[1] || [];

  let rows = [];
  let totalItems = 0;

  /**
   * Hỗ trợ cả 2 kiểu SP:
   * 1. recordsets[0] = count, recordsets[1] = data
   * 2. recordsets[0] = data, recordsets[1] = count
   */
  if (rs0.length > 0 && rs0[0]?.totalRecords !== undefined) {
    totalItems = Number(rs0[0].totalRecords) || 0;
    rows = rs1;
  } else {
    rows = rs0;
    totalItems =
      Number(rs1?.[0]?.totalRecords) ||
      Number(rs1?.[0]?.totalItems) ||
      Number(rs1?.[0]?.total) ||
      0;
  }

  const groupedDevices = groupDeviceHardwareRows(rows);

  return {
    devices: groupedDevices,
    totalItems
  };
}

function groupDeviceHardwareRows(rows = []) {
  const map = new Map();

  for (const row of rows) {
    let group = map.get(row.deviceId);

    if (!group) {
      group = {
        deviceId: row.deviceId,
        deviceCode: row.deviceCode,
        deviceName: row.deviceName,
        deviceType: row.deviceType,
        hardwareUnits: []
      };

      map.set(row.deviceId, group);
    }

    if (row.hwId) {
      group.hardwareUnits.push({
        id: row.hwId,
        hardwareName: row.hardwareName,
        serialNumber: row.serialNumber,
        isUnderRepair: row.isUnderRepair === 1 || row.isUnderRepair === true
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Lấy danh sách thiết bị chưa được gán phần cứng.
 * Stored Procedure: sp_DeviceHardwareUnits_GetDevicesWithoutHardware
 */
export async function getDevicesWithoutHardware(includeId = null) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('pIncludeId', sql.Int, includeId || null)
    .execute('sp_DeviceHardwareUnits_GetDevicesWithoutHardware');

  return result.recordset || [];
}

/**
 * Lấy danh sách đơn vị phần cứng có thể gán khi tạo mới.
 * Stored Procedure: sp_DeviceHardwareUnits_GetForCreate
 */
export async function getHardwareUnitsForCreate() {
  const pool = await poolPromise;

  const result = await pool.request()
    .execute('sp_DeviceHardwareUnits_GetForCreate');

  return result.recordset || [];
}

/**
 * Lấy danh sách đơn vị phần cứng khi chỉnh sửa.
 * Stored Procedure: sp_DeviceHardwareUnits_GetForEdit
 */
export async function getHardwareUnitsForEdit(deviceId, includeIds = []) {
  const pool = await poolPromise;

  const includeIdsString = includeIds.length > 0
    ? includeIds.join(',')
    : null;

  const result = await pool.request()
    .input('pDeviceId', sql.Int, deviceId)
    .input('pIncludeIds', sql.VarChar(sql.MAX), includeIdsString)
    .execute('sp_DeviceHardwareUnits_GetForEdit');

  return result.recordset || [];
}

/**
 * Lấy danh sách phần cứng đã gán cho thiết bị.
 * Stored Procedure: sp_DeviceHardwareUnits_GetAssigned
 */
export async function getDeviceHardwareAssigned(deviceId) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('pDeviceId', sql.Int, parseInt(deviceId, 10))
    .execute('sp_DeviceHardwareUnits_GetAssigned');

  return result.recordset || [];
}

/**
 * Cập nhật danh sách phần cứng được gán cho thiết bị.
 * Stored Procedure: sp_DeviceHardwareUnits_UpdateAssigned
 */
export async function updateDeviceHardwareAssigned(deviceId, hardwareUnitIds = []) {
  const pool = await poolPromise;

  const normalizedIds = Array.isArray(hardwareUnitIds)
    ? hardwareUnitIds
        .map((x) => parseInt(x, 10))
        .filter((x) => !Number.isNaN(x))
    : [];

  const hardwareUnitIdsString = normalizedIds.length > 0
    ? normalizedIds.join(',')
    : null;

  await pool.request()
    .input('pDeviceId', sql.Int, parseInt(deviceId, 10))
    .input('pHardwareUnitIds', sql.VarChar(sql.MAX), hardwareUnitIdsString)
    .execute('sp_DeviceHardwareUnits_UpdateAssigned');
}

/**
 * Gỡ liên kết một phần cứng khỏi thiết bị.
 * Stored Procedure: sp_DeviceHardwareUnits_Detach
 */
export async function detachDeviceHardwareUnit(deviceId, hardwareUnitId) {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input('pDeviceId', sql.Int, parseInt(deviceId, 10))
      .input('pHardwareUnitId', sql.Int, parseInt(hardwareUnitId, 10))
      .execute('sp_DeviceHardwareUnits_Detach');

    return {
      success: true,
      message: 'Đã gỡ phần cứng khỏi thiết bị'
    };
  } catch (error) {
    console.error('SQL Error:', error);

    return {
      success: false,
      message: error.message || 'Có lỗi xảy ra khi gỡ phần cứng'
    };
  }
}