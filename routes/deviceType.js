import express from 'express';
import {
  getAllDeviceTypes,
  getDeviceTypesAjax,
  createDeviceType,
  updateDeviceType,
  toggleDeviceType,
  deleteDeviceType
} from '../controllers/deviceTypeController.js';

const router = express.Router();

router.get('/', getAllDeviceTypes);
router.get('/ajax', getDeviceTypesAjax);
router.post('/', createDeviceType);
router.put('/:id/update', updateDeviceType);
router.put('/:id/toggle', toggleDeviceType);
router.delete('/:id/delete', deleteDeviceType);

export default router;
