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

import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(getDeviceAssignmentPage));
router.get('/ajax', asyncHandler(getDeviceAssignmentList));
router.get('/departments/ajax', asyncHandler(getAllDepartments));
router.get('/available-devices', asyncHandler(getAvailableDevices));

router.post('/', asyncHandler(createAssignment));
router.put('/:id', asyncHandler(updateAssignment));
router.put('/:id/revoke', asyncHandler(revokeAssignment));
router.delete('/:id', asyncHandler(deleteAssignment));

export default router;