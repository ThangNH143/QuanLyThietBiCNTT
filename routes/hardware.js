import express from 'express';
import {
  getAllHardwares,
  getHardwaresAjax,
  createHardware,
  updateHardware,
  toggleHardware,
  deleteHardware
} from '../controllers/hardwareController.js';

const router = express.Router();

router.get('/', getAllHardwares);
router.get('/ajax', getHardwaresAjax);
router.post('/', createHardware);
router.put('/:id/update', updateHardware);
router.put('/:id/toggle', toggleHardware);
router.delete('/:id/delete', deleteHardware);

export default router;
