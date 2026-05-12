import express from 'express';
import {
  getAllDeviceTypes,
  getDeviceTypesAjax,
  createDeviceType,
  updateDeviceType,
  toggleDeviceType,
  deleteDeviceType
} from '../controllers/deviceTypeController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(getAllDeviceTypes));
router.get('/ajax', asyncHandler(getDeviceTypesAjax));
router.post('/', asyncHandler(createDeviceType));
router.put('/:id', asyncHandler(updateDeviceType));
router.put('/:id/update', asyncHandler(updateDeviceType));
router.patch('/:id/toggle', asyncHandler(toggleDeviceType));
router.put('/:id/toggle', asyncHandler(toggleDeviceType));
router.delete('/:id', asyncHandler(deleteDeviceType));
router.delete('/:id/delete', asyncHandler(deleteDeviceType));

export default router;
