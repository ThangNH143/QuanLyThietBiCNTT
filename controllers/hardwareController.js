import {
  getHardwares,
  createHardwareService,
  updateHardwareService,
  toggleHardwareService,
  deleteHardwareService
} from '../services/hardwareService.js';

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

export async function getAllHardwares(req, res) {
  const filters = {
    code: req.query.code || '',
    name: req.query.name || '',
    hardwareTypeId: req.query.hardwareTypeId || '',
    filter: req.query.filter || 'all',
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10
  };
  const { hardwares, total } = await getHardwares(filters);
  res.render('hardwares/index', { hardwares, filters, total, req });
}

export async function getHardwaresAjax(req, res) {
  const pagination = normalizePagination(req.query, 10);
  const filters = {
    code: req.query.code || '',
    name: req.query.name || '',
    hardwareTypeId: req.query.hardwareTypeId || null,
    filter: req.query.filter || 'all',
    page: pagination.page,
    limit: pagination.limit,
    offset: pagination.offset
  };
  const { hardwares, total } = await getHardwares(filters);
  return listResponse(res, hardwares, total, pagination, 'Lấy danh sách phần cứng thành công', 'hardwares');
}

export async function createHardware(req, res) {
  const { code, name, hardwareTypeId } = req.body;
  if (!code || !name || !hardwareTypeId) return apiResponse.error(res, 'Mã, tên và loại phần cứng là bắt buộc', 400);
  await createHardwareService(req.body);
  return apiResponse.success(res, null, 'Thêm phần cứng thành công', null, 201);
}

export async function updateHardware(req, res) {
  const { code, name, hardwareTypeId } = req.body;
  if (!code || !name || !hardwareTypeId) return apiResponse.error(res, 'Mã, tên và loại phần cứng là bắt buộc', 400);
  await updateHardwareService(req.params.id, req.body);
  return apiResponse.success(res, null, 'Cập nhật phần cứng thành công');
}

export async function toggleHardware(req, res) {
  await toggleHardwareService(req.params.id);
  return apiResponse.success(res, null, 'Đã thay đổi trạng thái phần cứng');
}

export async function deleteHardware(req, res) {
  const result = await deleteHardwareService(req.params.id);
  if (!result.success) return apiResponse.error(res, result.message || 'Không thể xóa phần cứng', 409);
  return apiResponse.success(res, null, result.message || 'Xóa phần cứng thành công');
}
