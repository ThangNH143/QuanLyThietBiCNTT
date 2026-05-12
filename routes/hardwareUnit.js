import express from 'express';
import {
  getAllHardwareUnits,
  getHardwareUnitsAjax,
  createHardwareUnit,
  updateHardwareUnit,
  toggleHardwareUnit,
  deleteHardwareUnit
} from '../controllers/hardwareUnitController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(getAllHardwareUnits));
router.get('/ajax', asyncHandler(getHardwareUnitsAjax));
router.post('/', asyncHandler(createHardwareUnit));
router.put('/:id', asyncHandler(updateHardwareUnit));
router.put('/:id/update', asyncHandler(updateHardwareUnit));
router.patch('/:id/toggle', asyncHandler(toggleHardwareUnit));
router.put('/:id/toggle', asyncHandler(toggleHardwareUnit));
router.delete('/:id', asyncHandler(deleteHardwareUnit));
router.delete('/:id/delete', asyncHandler(deleteHardwareUnit));

export default router;
