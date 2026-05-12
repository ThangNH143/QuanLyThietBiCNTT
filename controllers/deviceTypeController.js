import {
  getDeviceTypes,
  createDeviceTypeService,
  updateDeviceTypeService,
  toggleDeviceTypeService,
  deleteDeviceTypeService
} from '../services/deviceTypeService.js';

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

export async function getAllDeviceTypes(req, res) {
  const filters = {
    code: req.query.code || '',
    name: req.query.name || '',
    filter: req.query.filter || 'all',
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10
  };
  const { deviceTypes, total } = await getDeviceTypes(filters);
  res.render('deviceTypes/index', { deviceTypes, filters, total, req });
}

export async function getDeviceTypesAjax(req, res) {
  const pagination = normalizePagination(req.query, 10);
  const filters = {
    code: req.query.code || '',
    name: req.query.name || '',
    filter: req.query.filter || 'all',
    page: pagination.page,
    limit: pagination.limit,
    offset: pagination.offset
  };
  const { deviceTypes, total } = await getDeviceTypes(filters);
  return listResponse(res, deviceTypes, total, pagination, 'Lấy danh sách loại thiết bị thành công', 'deviceTypes');
}

export async function createDeviceType(req, res) {
  const { code, name } = req.body;
  if (!code || !name) return apiResponse.error(res, 'Mã và tên loại thiết bị là bắt buộc', 400);
  await createDeviceTypeService(req.body);
  return apiResponse.success(res, null, 'Thêm loại thiết bị thành công', null, 201);
}

export async function updateDeviceType(req, res) {
  const { code, name } = req.body;
  if (!code || !name) return apiResponse.error(res, 'Mã và tên loại thiết bị là bắt buộc', 400);
  await updateDeviceTypeService(req.params.id, req.body);
  return apiResponse.success(res, null, 'Cập nhật loại thiết bị thành công');
}

export async function toggleDeviceType(req, res) {
  await toggleDeviceTypeService(req.params.id);
  return apiResponse.success(res, null, 'Đã thay đổi trạng thái loại thiết bị');
}

export async function deleteDeviceType(req, res) {
  const result = await deleteDeviceTypeService(req.params.id);
  if (!result.success) return apiResponse.error(res, result.message || 'Không thể xóa loại thiết bị', 409);
  return apiResponse.success(res, null, result.message || 'Xóa loại thiết bị thành công');
}
