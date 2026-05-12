import {
  getDepartments,
  createDepartmentService,
  updateDepartmentService,
  toggleDepartmentService,
  deleteDepartmentService
} from '../services/departmentService.js';

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

export async function getAllDepartments(req, res) {
  const filters = {
    code: req.query.code || '',
    name: req.query.name || '',
    note: req.query.note || '',
    filter: req.query.filter || 'all',
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10
  };
  const { departments, total } = await getDepartments(filters);
  res.render('departments/index', { departments, filters, total, req });
}

export async function getDepartmentsAjax(req, res) {
  const pagination = normalizePagination(req.query, 10);
  const filters = {
    code: req.query.code || '',
    name: req.query.name || '',
    note: req.query.note || '',
    filter: req.query.filter || 'all',
    page: pagination.page,
    limit: pagination.limit,
    offset: pagination.offset
  };
  const { departments, total } = await getDepartments(filters);
  return listResponse(res, departments, total, pagination, 'Lấy danh sách phòng ban thành công', 'departments');
}

export async function createDepartment(req, res) {
  const { code, name } = req.body;
  if (!code || !name) return apiResponse.error(res, 'Mã và tên phòng ban là bắt buộc', 400);
  await createDepartmentService(req.body);
  return apiResponse.success(res, null, 'Thêm phòng ban thành công', null, 201);
}

export async function updateDepartment(req, res) {
  const { code, name } = req.body;
  if (!code || !name) return apiResponse.error(res, 'Mã và tên phòng ban là bắt buộc', 400);
  await updateDepartmentService(req.params.id, req.body);
  return apiResponse.success(res, null, 'Cập nhật phòng ban thành công');
}

export async function toggleDepartment(req, res) {
  await toggleDepartmentService(req.params.id);
  return apiResponse.success(res, null, 'Đã thay đổi trạng thái phòng ban');
}

export async function deleteDepartment(req, res) {
  const result = await deleteDepartmentService(req.params.id);
  if (!result.success) return apiResponse.error(res, result.message || 'Không thể xóa phòng ban', 409);
  return apiResponse.success(res, null, result.message || 'Xóa phòng ban thành công');
}
