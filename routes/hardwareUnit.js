import express from 'express';
import {
  getAllHardwareUnits,
  getHardwareUnitsAjax,
  createHardwareUnit,
  updateHardwareUnit,
  toggleHardwareUnit,
  deleteHardwareUnit
} from '../controllers/hardwareUnitController.js';

const router = express.Router();

router.get('/', getAllHardwareUnits);
router.get('/ajax', getHardwareUnitsAjax);
router.post('/', createHardwareUnit);
router.put('/:id/update', updateHardwareUnit);
router.put('/:id/toggle', toggleHardwareUnit);
router.delete('/:id/delete', deleteHardwareUnit);

export default router;
