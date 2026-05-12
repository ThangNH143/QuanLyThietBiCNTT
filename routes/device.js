import { Router } from 'express';
import {
  getDevicesAjax,
  getAllDevices,
  createDevice,
  updateDevice,
  toggleDevice,
  deleteDevice
} from '../controllers/deviceController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(getAllDevices));
router.get('/ajax', asyncHandler(getDevicesAjax));
router.post('/', asyncHandler(createDevice));
router.put('/:id', asyncHandler(updateDevice));
router.put('/:id/update', asyncHandler(updateDevice));
router.patch('/:id/toggle', asyncHandler(toggleDevice));
router.put('/:id/toggle', asyncHandler(toggleDevice));
router.delete('/:id', asyncHandler(deleteDevice));
router.delete('/:id/delete', asyncHandler(deleteDevice));

export default router;
