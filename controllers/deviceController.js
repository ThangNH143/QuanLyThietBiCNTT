import {
  getDevices,
  createDeviceService,
  updateDeviceService,
  toggleDeviceService,
  deleteDeviceService,
  getDeviceTypesDropdown
} from '../services/deviceService.js';

import apiResponse from '../utils/apiResponse.js';
import { normalizePagination, buildPagination } from '../utils/pagination.js';

function listResponse(res, items, total, paginationInput, message, legacyKey) {
  const pagination = buildPagination(total, paginationInput.page, paginationInput.limit);
  return res.json({
    success: true,
    message,
    data: items,
    meta: { pagination },
    [legacyKey]: items,
    total: pagination.totalItems,
    currentPage: pagination.page
  });
}

export async function getAllDevices(req, res) {
  const filters = {
    code: req.query.code || '',
    name: req.query.name || '',
    filter: req.query.filter || 'all',
    deviceTypeId: req.query.deviceTypeId || '',
    startDate: req.query.startDate || '',
    endDate: req.query.endDate || '',
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10
  };
  const { devices, total } = await getDevices(filters);
  const deviceTypes = await getDeviceTypesDropdown();
  res.render('devices/index', { devices, deviceTypes, filter: filters.filter, message: '', filters, total, req });
}

export async function getDevicesAjax(req, res) {
  const pagination = normalizePagination(req.query, 10);
  const filters = {
    code: req.query.code || '',
    name: req.query.name || '',
    filter: req.query.filter || 'all',
    deviceTypeId: req.query.deviceTypeId || null,
    startDate: req.query.startDate || null,
    endDate: req.query.endDate || null,
    page: pagination.page,
    limit: pagination.limit,
    offset: pagination.offset
  };
  const { devices, total } = await getDevices(filters);
  return listResponse(res, devices, total, pagination, 'Lấy danh sách thiết bị thành công', 'devices');
}

export async function createDevice(req, res) {
  const { code, name, deviceTypeId, purchaseDate } = req.body;
  if (!code || !name || !deviceTypeId || !purchaseDate) return apiResponse.error(res, 'Thiếu thông tin bắt buộc', 400);
  await createDeviceService(req.body);
  return apiResponse.success(res, null, 'Thêm thiết bị thành công', null, 201);
}

export async function updateDevice(req, res) {
  const { code, name, deviceTypeId, purchaseDate } = req.body;
  if (!code || !name || !deviceTypeId || !purchaseDate) return apiResponse.error(res, 'Thiếu thông tin bắt buộc khi cập nhật', 400);
  await updateDeviceService(req.params.id, req.body);
  return apiResponse.success(res, null, 'Cập nhật thiết bị thành công');
}

export async function toggleDevice(req, res) {
  await toggleDeviceService(req.params.id);
  return apiResponse.success(res, null, 'Đã thay đổi trạng thái thiết bị');
}

export async function deleteDevice(req, res) {
  const result = await deleteDeviceService(req.params.id);
  if (!result.success) return apiResponse.error(res, result.message || 'Không thể xóa thiết bị', 409);
  return apiResponse.success(res, null, result.message || 'Xóa thiết bị thành công');
}
