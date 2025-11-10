// controllers/deviceAssignmentController.js
import {
  getDeviceAssignments,
  getAssignableDevices,
  createDeviceAssignment,
  updateDeviceAssignment,
  revokeDeviceAssignment,
  deleteDeviceAssignment
} from '../services/deviceAssignmentService.js';

export function getDeviceAssignmentPage(req, res) {
  res.render('device-assignments/index');
}

export async function getDeviceAssignmentList(req, res) {
  const result = await getDeviceAssignments(req.query);
  res.json(result);
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
  await deleteDeviceAssignment(req.params.id);
  res.json({ message: 'Đã xóa lịch sử gán thiết bị' });
}
