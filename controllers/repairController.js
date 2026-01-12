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
  try {
    const result = await getRepairs(req.query);
    res.json(result);
  } catch (err) {
    console.error('getRepairsList error:', err);
    res.status(500).json({ message: 'Failed to load repairs', error: err.message });
  }
}

export async function getRepairDetail(req, res) {
  try {
    const result = await getRepairById(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('getRepairDetail error:', err);
    res.status(500).json({ message: 'Failed to load repair detail', error: err.message });
  }
}

export async function createRepairRecord(req, res) {
  try {
    await createRepair(req.body);
    res.json({ message: 'Đã tạo phiếu sửa chữa' });
  } catch (err) {
    console.error('createRepairRecord error:', err);
    res.status(500).json({ message: 'Failed to create repair', error: err.message });
  }
}

export async function updateRepairRecord(req, res) {
  try {
    await updateRepair(req.params.id, req.body);
    res.json({ message: 'Đã cập nhật phiếu sửa chữa' });
  } catch (err) {
    console.error('updateRepairRecord error:', err);
    res.status(500).json({ message: 'Failed to update repair', error: err.message });
  }
}

export async function deleteRepairRecord(req, res) {
  try {
    const result = await deleteRepair(req.params.id);

    if (result?.success) {
      return res.json({ success: true, message: result.message || 'Đã xóa phiếu sửa chữa' });
    }

    // Nếu store chủ động trả về thất bại (ràng buộc business)
    return res.status(400).json({
      success: false,
      message: result?.message || 'Không thể xóa phiếu sửa chữa ở trạng thái hiện tại'
    });
  } catch (err) {
    console.error('deleteRepairRecord error:', err);
    // Lỗi hệ thống / store THROW
    res.status(500).json({ message: 'Failed to delete repair', error: err.message });
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
