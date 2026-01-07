import {
  getHardwareTypes,
  createHardwareTypeService,
  updateHardwareTypeService,
  toggleHardwareTypeService,
  deleteHardwareTypeService
} from '../services/hardwareTypeService.js';

export async function getAllHardwareTypes(req, res) {
  const filters = {
    code: req.query.code,
    name: req.query.name,
    filter: req.query.filter || 'all',
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10
  };
  const { hardwareTypes, total } = await getHardwareTypes(filters);
  res.render('hardwareTypes/index', { hardwareTypes, filters, total, req });
}

export async function getHardwareTypesAjax(req, res) {
  try {
    const filters = {
      ...req.query,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };
    const { hardwareTypes, total } = await getHardwareTypes(filters);
    res.json({ hardwareTypes, total, currentPage: filters.page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy loại phần cứng' });
  }
}

export async function createHardwareType(req, res) {
  try {
    await createHardwareTypeService(req.body);
    res.json({ message: 'Thêm loại phần cứng thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi thêm loại phần cứng' });
  }
}

export async function updateHardwareType(req, res) {
  try {
    await updateHardwareTypeService(req.params.id, req.body);
    res.json({ message: 'Cập nhật loại phần cứng thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi cập nhật loại phần cứng' });
  }
}

export async function toggleHardwareType(req, res) {
  try {
    await toggleHardwareTypeService(req.params.id);
    res.json({ message: 'Đã thay đổi trạng thái loại phần cứng' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi thay đổi trạng thái' });
  }
}

export async function deleteHardwareType(req, res) {
  try {
    const result = await deleteHardwareTypeService(req.params.id);
    if (result.success) {
      // Nếu thành công, trả về 200 kèm message
      return res.json({ 
      success: true, 
      message: result.message 
      });
    } else {
      // QUAN TRỌNG: Nếu thất bại do ràng buộc dữ liệu, phải trả về status lỗi (400 hoặc 409)
      // Điều này giúp AJAX nhảy vào block .error() thay vì .success()
      return res.status(400).json({ 
        success: false, 
        message: result.message 
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Lỗi khi xóa loại phần cứng' });
  }
}
