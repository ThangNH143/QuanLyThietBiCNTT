import {
  getHardwareUnits,
  createHardwareUnitService,
  updateHardwareUnitService,
  toggleHardwareUnitService,
  deleteHardwareUnitService
} from '../services/hardwareUnitService.js';

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
    currentPage: pagination.page,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalRecords: pagination.totalItems,
      totalPages: pagination.totalPages
    }
  });
}

export async function getAllHardwareUnits(req, res) {
  const filters = {
    code: req.query.code || '',
    serialNumber: req.query.serialNumber || '',
    hardwareName: req.query.hardwareName || '',
    startDate: req.query.startDate || '',
    endDate: req.query.endDate || '',
    filter: req.query.filter || 'all',
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10
  };
  const { units, total } = await getHardwareUnits(filters);
  res.render('hardwareUnits/index', { units, filters, total, req });
}

export async function getHardwareUnitsAjax(req, res) {
  const pagination = normalizePagination(req.query, 10);
  const filters = {
    code: req.query.code || '',
    serialNumber: req.query.serialNumber || '',
    hardwareName: req.query.hardwareName || '',
    startDate: req.query.startDate || null,
    endDate: req.query.endDate || null,
    filter: req.query.filter || 'all',
    page: pagination.page,
    limit: pagination.limit,
    offset: pagination.offset
  };
  const { units, total } = await getHardwareUnits(filters);
  return listResponse(res, units, total, pagination, 'Lấy danh sách thiết bị phần cứng thành công', 'units');
}

export async function createHardwareUnit(req, res) {
  const { code, serialNumber, hardwareId, purchaseDate } = req.body;
  if (!code || !serialNumber || !hardwareId || !purchaseDate) {
    return apiResponse.error(res, 'Mã, serial, phần cứng và ngày mua là bắt buộc', 400);
  }
  await createHardwareUnitService(req.body);
  return apiResponse.success(res, null, 'Thêm thiết bị phần cứng thành công', null, 201);
}

export async function updateHardwareUnit(req, res) {
  const { code, serialNumber, hardwareId, purchaseDate } = req.body;
  if (!code || !serialNumber || !hardwareId || !purchaseDate) {
    return apiResponse.error(res, 'Mã, serial, phần cứng và ngày mua là bắt buộc', 400);
  }
  await updateHardwareUnitService(req.params.id, req.body);
  return apiResponse.success(res, null, 'Cập nhật thiết bị phần cứng thành công');
}

export async function toggleHardwareUnit(req, res) {
  await toggleHardwareUnitService(req.params.id);
  return apiResponse.success(res, null, 'Đã thay đổi trạng thái thiết bị phần cứng');
}

export async function deleteHardwareUnit(req, res) {
  const result = await deleteHardwareUnitService(req.params.id);
  if (!result.success) return apiResponse.error(res, result.message || 'Không thể xóa thiết bị phần cứng', 409);
  return apiResponse.success(res, null, result.message || 'Xóa thiết bị phần cứng thành công');
}
