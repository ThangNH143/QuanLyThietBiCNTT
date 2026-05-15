// routes/deviceHardwareUnit.js

import express from 'express';

import {
  getDeviceHardwareIndex,
  getDevicesWithHardwareUnits,
  getUngroupedDevices,
  getHardwareUnitsCreate,
  getHardwareUnitsEdit,
  getAssignedHardwareUnits,
  updateAssignedHardwareUnits,
  detachHardwareUnit
} from '../controllers/deviceHardwareUnitController.js';

import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(getDeviceHardwareIndex));
router.get('/ajax', asyncHandler(getDevicesWithHardwareUnits));

router.get('/devices/ungrouped', asyncHandler(getUngroupedDevices));
router.get('/hardware-units/create', asyncHandler(getHardwareUnitsCreate));
router.get('/hardware-units/edit', asyncHandler(getHardwareUnitsEdit));

router.get('/:deviceId/assigned', asyncHandler(getAssignedHardwareUnits));

router.put('/:deviceId/update', asyncHandler(updateAssignedHardwareUnits));
router.delete('/:deviceId/detach/:hardwareUnitId', asyncHandler(detachHardwareUnit));

export default router;