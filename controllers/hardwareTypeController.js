import {
  getHardwareTypes,
  createHardwareTypeService,
  updateHardwareTypeService,
  toggleHardwareTypeService,
  deleteHardwareTypeService
} from '../services/hardwareTypeService.js';

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

export async function getAllHardwareTypes(req, res) {
  const filters = {
    code: req.query.code || '',
    name: req.query.name || '',
    filter: req.query.filter || 'all',
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10
  };
  const { hardwareTypes, total } = await getHardwareTypes(filters);
  res.render('hardwareTypes/index', { hardwareTypes, filters, total, req });
}

export async function getHardwareTypesAjax(req, res) {
  const pagination = normalizePagination(req.query, 10);
  const filters = {
    code: req.query.code || '',
    name: req.query.name || '',
    filter: req.query.filter || 'all',
    page: pagination.page,
    limit: pagination.limit,
    offset: pagination.offset
  };
  const { hardwareTypes, total } = await getHardwareTypes(filters);
  return listResponse(res, hardwareTypes, total, pagination, 'Lấy danh sách loại phần cứng thành công', 'hardwareTypes');
}

export async function createHardwareType(req, res) {
  const { code, name } = req.body;
  if (!code || !name) return apiResponse.error(res, 'Mã và tên loại phần cứng là bắt buộc', 400);
  await createHardwareTypeService(req.body);
  return apiResponse.success(res, null, 'Thêm loại phần cứng thành công', null, 201);
}

export async function updateHardwareType(req, res) {
  const { code, name } = req.body;
  if (!code || !name) return apiResponse.error(res, 'Mã và tên loại phần cứng là bắt buộc', 400);
  await updateHardwareTypeService(req.params.id, req.body);
  return apiResponse.success(res, null, 'Cập nhật loại phần cứng thành công');
}

export async function toggleHardwareType(req, res) {
  await toggleHardwareTypeService(req.params.id);
  return apiResponse.success(res, null, 'Đã thay đổi trạng thái loại phần cứng');
}

export async function deleteHardwareType(req, res) {
  const result = await deleteHardwareTypeService(req.params.id);
  if (!result.success) return apiResponse.error(res, result.message || 'Không thể xóa loại phần cứng', 409);
  return apiResponse.success(res, null, result.message || 'Xóa loại phần cứng thành công');
}
