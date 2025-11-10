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

const router = express.Router();

router.get('/', getDeviceHardwareIndex);
router.get('/ajax', getDevicesWithHardwareUnits);
router.get('/devices/ungrouped', getUngroupedDevices); // ✅ Tạo mới
router.get('/hardware-units/create', getHardwareUnitsCreate); // ✅ Tạo mới
router.get('/hardware-units/edit', getHardwareUnitsEdit); // ✅ Sửa thiết bị
router.get('/:deviceId/assigned', getAssignedHardwareUnits);
router.put('/:deviceId/update', updateAssignedHardwareUnits);
router.delete('/:deviceId/detach/:hardwareUnitId', detachHardwareUnit);

export default router;
