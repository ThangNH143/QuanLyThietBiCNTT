import {
  getRepairs,
  getRepairById,
  createRepair,
  updateRepair,
  deleteRepair,
  getAvailableDevicesForRepair,
  getActiveUsers,
  getHardwareUnitsForCreate,
  getHardwareUnitsForEdit
} from '../services/repairService.js';

export async function getRepairsList(req, res) {
  const result = await getRepairs(req.query);
  res.json(result);
}

export async function getRepairDetail(req, res) {
  const result = await getRepairById(req.params.id);
  res.json(result);
}

export async function createRepairRecord(req, res) {
  await createRepair(req.body);
  res.json({ message: 'Đã tạo phiếu sửa chữa' });
}

export async function updateRepairRecord(req, res) {
  await updateRepair(req.params.id, req.body);
  res.json({ message: 'Đã cập nhật phiếu sửa chữa' });
}

export async function deleteRepairRecord(req, res) {
  const result = await deleteRepair(req.params.id);
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

export async function getAvailableDevices(req, res) {
  const result = await getAvailableDevicesForRepair();
  res.json({ devices: result });
}

export async function getAvailableHardwareUnits(req, res) {
  const deviceId = parseInt(req.query.deviceId);
  const currentRepairIdRaw = req.query.currentRepairId;
  const currentRepairId = currentRepairIdRaw !== undefined ? parseInt(currentRepairIdRaw) : null;

  if (!deviceId) return res.json({ units: [] });

  const result = currentRepairId
    ? await getHardwareUnitsForEdit(deviceId, currentRepairId)
    : await getHardwareUnitsForCreate(deviceId);

  res.json({ units: result });
}

export async function getUsersForRepair(req, res) {
  const result = await getActiveUsers();
  res.json({ users: result });
}
