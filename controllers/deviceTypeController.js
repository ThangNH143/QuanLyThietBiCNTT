import {
  getDeviceTypes,
  createDeviceTypeService,
  updateDeviceTypeService,
  toggleDeviceTypeService,
  deleteDeviceTypeService
} from '../services/deviceTypeService.js';

export async function getAllDeviceTypes(req, res) {
  const filters = {
    name: req.query.name,
    filter: req.query.filter || 'all',
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10
  };
  const { deviceTypes, total } = await getDeviceTypes(filters);
  res.render('deviceTypes/index', { deviceTypes, filters, total, req });
}

export async function getDeviceTypesAjax(req, res) {
  try {
    const filters = {
      ...req.query,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };
    const { deviceTypes, total } = await getDeviceTypes(filters);
    res.json({ deviceTypes, total, currentPage: filters.page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy loại thiết bị' });
  }
}

export async function createDeviceType(req, res) {
  try {
    await createDeviceTypeService(req.body);
    res.json({ message: 'Thêm loại thiết bị thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi thêm loại thiết bị' });
  }
}

export async function updateDeviceType(req, res) {
  try {
    await updateDeviceTypeService(req.params.id, req.body);
    res.json({ message: 'Cập nhật loại thiết bị thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi cập nhật loại thiết bị' });
  }
}

export async function toggleDeviceType(req, res) {
  try {
    await toggleDeviceTypeService(req.params.id);
    res.json({ message: 'Đã thay đổi trạng thái loại thiết bị' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi thay đổi trạng thái' });
  }
}

export async function deleteDeviceType(req, res) {
  try {
    await deleteDeviceTypeService(req.params.id);
    res.json({ message: 'Đã xóa loại thiết bị' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Lỗi khi xóa loại thiết bị' });
  }
}
