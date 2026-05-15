// controllers/deviceHardwareUnitController.js

import {
  getDevicesWithHardware,
  getDevicesWithoutHardware,
  getHardwareUnitsForCreate,
  getHardwareUnitsForEdit,
  getDeviceHardwareAssigned,
  updateDeviceHardwareAssigned,
  detachDeviceHardwareUnit
} from '../services/deviceHardwareUnitService.js';

import apiResponse from '../utils/apiResponse.js';
import { normalizePagination, buildPagination } from '../utils/pagination.js';

export function getDeviceHardwareIndex(req, res) {
  res.render('device-hardware-units/index');
}

export async function getDevicesWithHardwareUnits(req, res) {
  const paginationInput = normalizePagination(req.query, 10);

  const filters = {
    deviceName: req.query.deviceName || '',
    hardwareKeyword: req.query.hardwareKeyword || '',
    page: paginationInput.page,
    limit: paginationInput.limit
  };

  const { devices, totalItems } = await getDevicesWithHardware(filters);

  const pagination = buildPagination(
    totalItems,
    paginationInput.page,
    paginationInput.limit
  );

  return res.json({
    success: true,
    message: 'Lấy danh sách thiết bị và phần cứng thành công',
    data: devices,
    meta: {
      pagination
    },

    // Legacy compatibility
    devices,
    pagination
  });
}

export async function getUngroupedDevices(req, res) {
  const includeId = req.query.includeId
    ? parseInt(req.query.includeId, 10)
    : null;

  const devices = await getDevicesWithoutHardware(includeId);

  return res.json({
    success: true,
    message: 'Lấy danh sách thiết bị chưa gán phần cứng thành công',
    data: devices,

    // Legacy compatibility
    devices
  });
}

export async function getHardwareUnitsCreate(req, res) {
  const units = await getHardwareUnitsForCreate();

  return res.json({
    success: true,
    message: 'Lấy danh sách phần cứng có thể gán thành công',
    data: units,

    // Legacy compatibility
    units
  });
}

export async function getHardwareUnitsEdit(req, res) {
  const rawDeviceId = parseInt(req.query.deviceId, 10);
  const deviceId = Number.isNaN(rawDeviceId) || rawDeviceId === 0
    ? null
    : rawDeviceId;

  const includeIds = req.query.includeIds
    ? req.query.includeIds
        .split(',')
        .map((x) => parseInt(x, 10))
        .filter((x) => !Number.isNaN(x))
    : [];

  const units = await getHardwareUnitsForEdit(deviceId, includeIds);

  return res.json({
    success: true,
    message: 'Lấy danh sách phần cứng cho chỉnh sửa thành công',
    data: units,

    // Legacy compatibility
    units
  });
}

export async function getAssignedHardwareUnits(req, res) {
  const assigned = await getDeviceHardwareAssigned(req.params.deviceId);

  return res.json({
    success: true,
    message: 'Lấy danh sách phần cứng đã gán thành công',
    data: assigned,

    // Legacy compatibility
    assigned
  });
}

export async function updateAssignedHardwareUnits(req, res) {
  const { hardwareUnitIds } = req.body;

  await updateDeviceHardwareAssigned(
    req.params.deviceId,
    normalizeHardwareUnitIds(hardwareUnitIds)
  );

  return apiResponse.success(
    res,
    null,
    'Đã cập nhật phần cứng cho thiết bị'
  );
}

export async function detachHardwareUnit(req, res) {
  const result = await detachDeviceHardwareUnit(
    req.params.deviceId,
    req.params.hardwareUnitId
  );

  if (!result.success) {
    return apiResponse.error(
      res,
      result.message || 'Không thể gỡ phần cứng khỏi thiết bị',
      409
    );
  }

  return apiResponse.success(
    res,
    null,
    result.message || 'Đã gỡ phần cứng khỏi thiết bị'
  );
}

function normalizeHardwareUnitIds(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((x) => parseInt(x, 10))
      .filter((x) => !Number.isNaN(x));
  }

  return [parseInt(value, 10)].filter((x) => !Number.isNaN(x));
}