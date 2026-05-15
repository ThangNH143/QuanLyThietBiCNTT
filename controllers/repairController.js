// controllers/repairController.js

import {
  getRepairs,
  getRepairById,
  createRepair,
  updateRepair,
  deleteRepair,
  getAvailableDevicesForRepair,
  getActiveUsers,
  getHardwareUnitsForCreate,
  getHardwareUnitsForEdit
} from '../services/repairService.js';

import apiResponse from '../utils/apiResponse.js';
import { normalizePagination, buildPagination } from '../utils/pagination.js';

export function getRepairPage(req, res) {
  res.render('repairs/index');
}

export async function getRepairsList(req, res) {
  const paginationInput = normalizePagination(req.query, 10);

  const filters = {
    deviceKeyword: req.query.deviceKeyword || '',
    hardwareKeyword: req.query.hardwareKeyword || '',
    status: req.query.status || '',
    page: paginationInput.page,
    limit: paginationInput.limit,
    offset: paginationInput.offset
  };

  const { repairs, totalItems } = await getRepairs(filters);

  const pagination = buildPagination(
    totalItems,
    paginationInput.page,
    paginationInput.limit
  );

  return res.json({
    success: true,
    message: 'Lấy danh sách phiếu sửa chữa thành công',
    data: repairs,
    meta: {
      pagination
    },

    // Legacy compatibility
    repairs,
    pagination
  });
}

export async function getRepairDetail(req, res) {
  const repair = await getRepairById(req.params.id);

  if (!repair) {
    return apiResponse.error(res, 'Không tìm thấy phiếu sửa chữa', 404);
  }

  return res.json({
    success: true,
    message: 'Lấy chi tiết phiếu sửa chữa thành công',
    data: repair,

    // Legacy compatibility
    ...repair
  });
}

export async function createRepairRecord(req, res) {
  const { deviceId, brokenDate, status } = req.body;

  if (!deviceId || !brokenDate || !status) {
    return apiResponse.error(
      res,
      'Vui lòng chọn thiết bị, ngày hư hỏng và trạng thái',
      400
    );
  }

  if (['completed', 'canceled'].includes(status) && !req.body.repairDate) {
    return apiResponse.error(
      res,
      'Trạng thái hoàn tất hoặc hủy bỏ cần có ngày sửa chữa',
      400
    );
  }

  await createRepair(req.body);

  return apiResponse.success(
    res,
    null,
    'Đã tạo phiếu sửa chữa',
    null,
    201
  );
}

export async function updateRepairRecord(req, res) {
  const { brokenDate, status } = req.body;

  if (!brokenDate || !status) {
    return apiResponse.error(
      res,
      'Vui lòng nhập ngày hư hỏng và trạng thái',
      400
    );
  }

  if (['completed', 'canceled'].includes(status) && !req.body.repairDate) {
    return apiResponse.error(
      res,
      'Trạng thái hoàn tất hoặc hủy bỏ cần có ngày sửa chữa',
      400
    );
  }

  await updateRepair(req.params.id, req.body);

  return apiResponse.success(
    res,
    null,
    'Đã cập nhật phiếu sửa chữa'
  );
}

export async function deleteRepairRecord(req, res) {
  const result = await deleteRepair(req.params.id);

  if (!result?.success) {
    return apiResponse.error(
      res,
      result?.message || 'Không thể xóa phiếu sửa chữa ở trạng thái hiện tại',
      409
    );
  }

  return apiResponse.success(
    res,
    null,
    result.message || 'Đã xóa phiếu sửa chữa'
  );
}

export async function getAvailableDevices(req, res) {
  const devices = await getAvailableDevicesForRepair();

  return res.json({
    success: true,
    message: 'Lấy danh sách thiết bị có thể sửa chữa thành công',
    data: devices,

    // Legacy compatibility
    devices
  });
}

export async function getAvailableHardwareUnits(req, res) {
  const deviceId = parseInt(req.query.deviceId, 10);
  const currentRepairIdRaw = req.query.currentRepairId;
  const currentRepairId =
    currentRepairIdRaw !== undefined
      ? parseInt(currentRepairIdRaw, 10)
      : null;

  if (!deviceId) {
    return res.json({
      success: true,
      message: 'Chưa chọn thiết bị',
      data: [],

      // Legacy compatibility
      units: []
    });
  }

  const units = currentRepairId
    ? await getHardwareUnitsForEdit(deviceId, currentRepairId)
    : await getHardwareUnitsForCreate(deviceId);

  return res.json({
    success: true,
    message: 'Lấy danh sách linh kiện thành công',
    data: units,

    // Legacy compatibility
    units
  });
}

export async function getUsersForRepair(req, res) {
  const users = await getActiveUsers();

  return res.json({
    success: true,
    message: 'Lấy danh sách người dùng thành công',
    data: users,

    // Legacy compatibility
    users
  });
}