// routes/deviceAssignmentRoutes.js
import express from 'express';
import {
  getDeviceAssignmentPage,
  getDeviceAssignmentList,
  getAvailableDevices,
  createAssignment,
  updateAssignment,
  revokeAssignment,
  deleteAssignment,
  getAllDepartments
} from '../controllers/deviceAssignmentController.js';

const router = express.Router();

router.get('/', getDeviceAssignmentPage);
router.get('/ajax', getDeviceAssignmentList);
router.get('/departments/ajax', getAllDepartments);
router.get('/available-devices', getAvailableDevices);
router.post('/', createAssignment);
router.put('/:id', updateAssignment);
router.put('/:id/revoke', revokeAssignment);
router.delete('/:id', deleteAssignment);

export default router;
