import {
  getDevices,
  createDeviceService,
  updateDeviceService,
  toggleDeviceService,
  deleteDeviceService,
  getDeviceTypesDropdown 
} from '../services/deviceService.js';

export async function getAllDevices(req, res) {
  const filters = {
    code: req.query.code,
    name: req.query.name,
    filter: req.query.filter || 'all',
    deviceTypeId: req.query.deviceTypeId,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10
  };

  const { devices, total } = await getDevices(filters);
  const deviceTypes = await getDeviceTypesDropdown();

  res.render('devices/index', {
    devices,
    deviceTypes,
    filter: filters.filter,
    message:'',
    filters,
    total,
    req
  });
}

export async function getDevicesAjax(req, res) {
  try {
    const filters = {
      ...req.query,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const { devices, total } = await getDevices(filters);

    res.json({
      devices,
      total,
      currentPage: filters.page
    });
  } catch (err) {
    console.error('Lỗi truy vấn thiết bị:', err);
    res.status(500).json({ error: 'Không thể lấy dữ liệu thiết bị' });
  }
};

export async function createDevice(req, res) {
  const { code, name, deviceTypeId, purchaseDate } = req.body;

  if (!code || !name || !deviceTypeId || !purchaseDate) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
  }

  try {
    await createDeviceService(req.body);
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Có lỗi khi tạo thiết bị' });
  }
}

export async function updateDevice(req, res) {
  const { code, name, deviceTypeId, purchaseDate } = req.body;

  if (!code || !name || !deviceTypeId || !purchaseDate) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc khi cập nhật' });
  }
  
  try {
    await updateDeviceService(req.params.id, req.body);
    res.json({ success: true, message: 'Cập nhật thành công' });
  }catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Có lỗi khi thay đổi trạng thái thiết bị' });
  }
}

export async function toggleDevice(req, res) {
  try {
    await toggleDeviceService(req.params.id);
    res.json({ success: true, message: 'Đã thay đổi trạng thái thiết bị' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Có lỗi khi thay đổi trạng thái thiết bị' });
  }
}

export async function deleteDevice(req, res) {
  try {
    const result = await deleteDeviceService(req.params.id);
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
    res.status(500).json({ success: false, message: err.message });
  }
}
