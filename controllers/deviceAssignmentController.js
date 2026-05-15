// controllers/deviceAssignmentController.js

import {
  getDeviceAssignments,
  getAssignableDevices,
  createDeviceAssignment,
  updateDeviceAssignment,
  revokeDeviceAssignment,
  deleteDeviceAssignment,
  getAllDepartmentsForDropdown
} from '../services/deviceAssignmentService.js';

import apiResponse from '../utils/apiResponse.js';
import { normalizePagination, buildPagination } from '../utils/pagination.js';

export function getDeviceAssignmentPage(req, res) {
  res.render('device-assignments/index');
}

export async function getAllDepartments(req, res) {
  const departments = await getAllDepartmentsForDropdown();

  return res.json({
    success: true,
    message: 'Lấy danh sách phòng ban thành công',
    data: departments,

    // Legacy compatibility
    departments
  });
}

export async function getDeviceAssignmentList(req, res) {
  const paginationInput = normalizePagination(req.query, 10);

  const filters = {
    status: req.query.status || 'active',
    deviceName: req.query.deviceName || '',
    deptName: req.query.deptName || '',
    page: paginationInput.page,
    limit: paginationInput.limit,
    offset: paginationInput.offset
  };

  const { assignments, totalItems } = await getDeviceAssignments(filters);

  const pagination = buildPagination(
    totalItems,
    paginationInput.page,
    paginationInput.limit
  );

  return res.json({
    success: true,
    message: 'Lấy danh sách gán thiết bị thành công',
    data: assignments,
    meta: {
      pagination
    },

    // Legacy compatibility
    assignments,
    pagination
  });
}

export async function getAvailableDevices(req, res) {
  const devices = await getAssignableDevices();

  return res.json({
    success: true,
    message: 'Lấy danh sách thiết bị có thể gán thành công',
    data: devices,

    // Legacy compatibility
    devices
  });
}

export async function createAssignment(req, res) {
  const { deviceId, deptId, startDate } = req.body;

  if (!deviceId || !deptId || !startDate) {
    return apiResponse.error(
      res,
      'Vui lòng chọn thiết bị, phòng ban và ngày bắt đầu',
      400
    );
  }

  await createDeviceAssignment(req.body);

  return apiResponse.success(
    res,
    null,
    'Đã gán thiết bị cho phòng ban',
    null,
    201
  );
}

export async function updateAssignment(req, res) {
  const { deptId, startDate } = req.body;

  if (!deptId || !startDate) {
    return apiResponse.error(
      res,
      'Vui lòng chọn phòng ban và ngày bắt đầu',
      400
    );
  }

  await updateDeviceAssignment(req.params.id, req.body);

  return apiResponse.success(
    res,
    null,
    'Đã cập nhật lịch sử gán'
  );
}

export async function revokeAssignment(req, res) {
  await revokeDeviceAssignment(req.params.id);

  return apiResponse.success(
    res,
    null,
    'Đã thu hồi thiết bị khỏi phòng ban'
  );
}

export async function deleteAssignment(req, res) {
  const result = await deleteDeviceAssignment(req.params.id);

  if (!result.success) {
    return apiResponse.error(
      res,
      result.message || 'Không thể xóa bản ghi gán thiết bị',
      409
    );
  }

  return apiResponse.success(
    res,
    null,
    result.message || 'Xóa bản ghi gán thiết bị thành công'
  );
}