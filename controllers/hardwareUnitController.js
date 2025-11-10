import {
  getHardwareUnits,
  createHardwareUnitService,
  updateHardwareUnitService,
  toggleHardwareUnitService,
  deleteHardwareUnitService
} from '../services/hardwareUnitService.js';

export async function getAllHardwareUnits(req, res) {
  const filters = {
    code: req.query.code,
    serialNumber: req.query.serialNumber,
    hardwareName: req.query.hardwareName,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    filter: req.query.filter || 'all',
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10
  };
  const { units, total } = await getHardwareUnits(filters);
  res.render('hardwareUnits/index', { units, filters, total, req });
}

export async function getHardwareUnitsAjax(req, res) {
  try {
    const filters = {
      ...req.query,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };
    const { units, total } = await getHardwareUnits(filters);
    res.json({ units, total, currentPage: filters.page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách thiết bị phần cứng' });
  }
}

export async function createHardwareUnit(req, res) {
  try {
    await createHardwareUnitService(req.body);
    res.json({ message: 'Thêm thiết bị phần cứng thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi thêm thiết bị phần cứng' });
  }
}

export async function updateHardwareUnit(req, res) {
  try {
    await updateHardwareUnitService(req.params.id, req.body);
    res.json({ message: 'Cập nhật thiết bị phần cứng thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi cập nhật thiết bị phần cứng' });
  }
}

export async function toggleHardwareUnit(req, res) {
  try {
    await toggleHardwareUnitService(req.params.id);
    res.json({ message: 'Đã thay đổi trạng thái thiết bị phần cứng' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái' });
  }
}

export async function deleteHardwareUnit(req, res) {
  try {
    await deleteHardwareUnitService(req.params.id);
    res.json({ message: 'Đã xóa thiết bị phần cứng' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Lỗi khi xóa thiết bị phần cứng' });
  }
}
