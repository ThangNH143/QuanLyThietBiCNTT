// controllers/deviceAssignmentController.js
import {
  getDeviceAssignments,
  getAssignableDevices,
  createDeviceAssignment,
  updateDeviceAssignment,
  revokeDeviceAssignment,
  deleteDeviceAssignment,
  getAllDepartmentsForDropdown
} from '../services/deviceAssignmentService.js';

export function getDeviceAssignmentPage(req, res) {
  res.render('device-assignments/index');
}

export async function getAllDepartments(req,res) {
  const result = await getAllDepartmentsForDropdown();
  res.json(result);
}

export async function getDeviceAssignmentList(req, res) {
  try {
    const result = await getDeviceAssignments(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getAvailableDevices(req, res) {
  const result = await getAssignableDevices();
  res.json({ devices: result });
}

export async function createAssignment(req, res) {
  await createDeviceAssignment(req.body);
  res.json({ message: 'Đã gán thiết bị cho phòng ban' });
}

export async function updateAssignment(req, res) {
  await updateDeviceAssignment(req.params.id, req.body);
  res.json({ message: 'Đã cập nhật lịch sử gán' });
}

export async function revokeAssignment(req, res) {
  await revokeDeviceAssignment(req.params.id);
  res.json({ message: 'Đã thu hồi thiết bị khỏi phòng ban' });
}

export async function deleteAssignment(req, res) {
  const result = await deleteDeviceAssignment(req.params.id);
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
