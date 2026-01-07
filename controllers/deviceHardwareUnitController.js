import {
  getDevicesWithHardware,
  getDevicesWithoutHardware,
  getHardwareUnitsForCreate,
  getHardwareUnitsForEdit,
  getDeviceHardwareAssigned,
  updateDeviceHardwareAssigned,
  detachDeviceHardwareUnit
} from '../services/deviceHardwareUnitService.js';

export function getDeviceHardwareIndex(req, res) {
  res.render('device-hardware-units/index');
}

export async function getDevicesWithHardwareUnits(req, res) {
  const result = await getDevicesWithHardware(req.query);
  res.json(result);
}


export async function getUngroupedDevices(req, res) {
  const includeId = req.query.includeId ? parseInt(req.query.includeId) : null;
  const result = await getDevicesWithoutHardware(includeId);
  res.json({ devices: result });
}

export async function getHardwareUnitsCreate(req, res) {
  const result = await getHardwareUnitsForCreate();
  res.json({ units: result });
}

export async function getHardwareUnitsEdit(req, res) {
  const rawDeviceId = parseInt(req.query.deviceId);
  const deviceId = isNaN(rawDeviceId) || rawDeviceId === 0 ? null : rawDeviceId;
  const includeIds = req.query.includeIds ? req.query.includeIds.split(',').map(x => parseInt(x)) : [];

  const units = await getHardwareUnitsForEdit(deviceId, includeIds);
  res.json({ units });
}

export async function getAssignedHardwareUnits(req, res) {
  const result = await getDeviceHardwareAssigned(req.params.deviceId);
  res.json(result);
}

export async function updateAssignedHardwareUnits(req, res) {
  await updateDeviceHardwareAssigned(req.params.deviceId, req.body.hardwareUnitIds);
  res.json({ message: 'Đã cập nhật phần cứng cho thiết bị' });
}

export async function detachHardwareUnit(req, res) {
  const result = await detachDeviceHardwareUnit(req.params.deviceId, req.params.hardwareUnitId);
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
}
