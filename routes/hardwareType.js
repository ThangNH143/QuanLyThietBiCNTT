import express from 'express';
import {
  getAllHardwareTypes,
  getHardwareTypesAjax,
  createHardwareType,
  updateHardwareType,
  toggleHardwareType,
  deleteHardwareType
} from '../controllers/hardwareTypeController.js';

const router = express.Router();

router.get('/', getAllHardwareTypes);
router.get('/ajax', getHardwareTypesAjax);
router.post('/', createHardwareType);
router.put('/:id/update', updateHardwareType);
router.put('/:id/toggle', toggleHardwareType);
router.delete('/:id/delete', deleteHardwareType);

export default router;
