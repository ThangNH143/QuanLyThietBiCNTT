import {
  getDepartments,
  createDepartmentService,
  updateDepartmentService,
  toggleDepartmentService,
  deleteDepartmentService
} from '../services/departmentService.js';

export async function getDepartmentsAjax(req, res) {
  try {
    const filters = {
      ...req.query,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };
    const { departments, total } = await getDepartments(filters);
    res.json({ departments, total, currentPage: filters.page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu phòng ban' });
  }
}

export async function getAllDepartments(req, res) {
  const filters = {
    code: req.query.code,
    name: req.query.name,
    note: req.query.note,
    filter: req.query.filter || 'all',
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10
  };

  const { departments, total } = await getDepartments(filters);

  res.render('departments/index', {
    departments,
    filters,
    total,
    req
  });
}

export async function createDepartment(req, res) {
  const { code, name } = req.body;
  if (!code || !name) return res.status(400).json({ success: false, message: 'Mã và Tên phòng ban là bắt buộc' });

  try {
    await createDepartmentService(req.body);
    res.json({ success: true, message: 'Thêm phòng ban thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi khi thêm phòng ban' });
  }
}

export async function updateDepartment(req, res) {
  const { code, name } = req.body;
  if (!code || !name) return res.status(400).json({ success: false, message: 'Dữ liệu không được trống' });

  try {
    await updateDepartmentService(req.params.id, req.body);
    res.json({ success: true, message: 'Cập nhật phòng ban thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật phòng ban' });
  }
}

export async function toggleDepartment(req, res) {
  try {
    await toggleDepartmentService(req.params.id);
    res.json({ success: true, message: 'Đã thay đổi trạng thái phòng ban' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái' });
  }
}

export async function deleteDepartment(req, res) {
  try {
    await deleteDepartmentService(req.params.id);
    res.json({ success: true, message: 'Đã xóa phòng ban' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}
