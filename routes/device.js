import { Router } from 'express';
import {
  getDevicesAjax,
  getAllDevices,
  createDevice,
  updateDevice,
  toggleDevice,
  deleteDevice
} from '../controllers/deviceController.js';

const router = Router();

router.get('/', getAllDevices);
router.get('/ajax', getDevicesAjax);
router.post('/', createDevice);
router.put('/:id/update', updateDevice);
router.put('/:id/toggle', toggleDevice);
router.delete('/:id/delete', deleteDevice);

export default router;
