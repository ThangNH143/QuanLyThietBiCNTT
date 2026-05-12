import express from 'express';
import {
  getAllHardwares,
  getHardwaresAjax,
  createHardware,
  updateHardware,
  toggleHardware,
  deleteHardware
} from '../controllers/hardwareController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(getAllHardwares));
router.get('/ajax', asyncHandler(getHardwaresAjax));
router.post('/', asyncHandler(createHardware));
router.put('/:id', asyncHandler(updateHardware));
router.put('/:id/update', asyncHandler(updateHardware));
router.patch('/:id/toggle', asyncHandler(toggleHardware));
router.put('/:id/toggle', asyncHandler(toggleHardware));
router.delete('/:id', asyncHandler(deleteHardware));
router.delete('/:id/delete', asyncHandler(deleteHardware));

export default router;
