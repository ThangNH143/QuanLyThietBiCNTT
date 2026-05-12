import express from 'express';
import {
  getAllHardwareTypes,
  getHardwareTypesAjax,
  createHardwareType,
  updateHardwareType,
  toggleHardwareType,
  deleteHardwareType
} from '../controllers/hardwareTypeController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(getAllHardwareTypes));
router.get('/ajax', asyncHandler(getHardwareTypesAjax));
router.post('/', asyncHandler(createHardwareType));
router.put('/:id', asyncHandler(updateHardwareType));
router.put('/:id/update', asyncHandler(updateHardwareType));
router.patch('/:id/toggle', asyncHandler(toggleHardwareType));
router.put('/:id/toggle', asyncHandler(toggleHardwareType));
router.delete('/:id', asyncHandler(deleteHardwareType));
router.delete('/:id/delete', asyncHandler(deleteHardwareType));

export default router;
