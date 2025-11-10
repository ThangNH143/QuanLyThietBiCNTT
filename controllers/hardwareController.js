import {
  getHardwares,
  createHardwareService,
  updateHardwareService,
  toggleHardwareService,
  deleteHardwareService
} from '../services/hardwareService.js';

export async function getAllHardwares(req, res) {
  const filters = {
    code: req.query.code,
    name: req.query.name,
    hardwareTypeId: req.query.hardwareTypeId,
    filter: req.query.filter || 'all',
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10
  };
  const { hardwares, total } = await getHardwares(filters);
  res.render('hardwares/index', { hardwares, filters, total, req });
}

export async function getHardwaresAjax(req, res) {
  try {
    const filters = {
      ...req.query,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };
    const { hardwares, total } = await getHardwares(filters);
    res.json({ hardwares, total, currentPage: filters.page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách phần cứng' });
  }
}

export async function createHardware(req, res) {
  try {
    await createHardwareService(req.body);
    res.json({ message: 'Thêm phần cứng thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi thêm phần cứng' });
  }
}

export async function updateHardware(req, res) {
  try {
    await updateHardwareService(req.params.id, req.body);
    res.json({ message: 'Cập nhật phần cứng thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi cập nhật phần cứng' });
  }
}

export async function toggleHardware(req, res) {
  try {
    await toggleHardwareService(req.params.id);
    res.json({ message: 'Đã thay đổi trạng thái phần cứng' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái' });
  }
}

export async function deleteHardware(req, res) {
  try {
    await deleteHardwareService(req.params.id);
    res.json({ message: 'Đã xóa phần cứng' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Lỗi khi xóa phần cứng' });
  }
}
