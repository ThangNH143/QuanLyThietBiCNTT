import express from 'express';
import {
  getAllDepartments,
  getDepartmentsAjax,
  createDepartment,
  updateDepartment,
  toggleDepartment,
  deleteDepartment
} from '../controllers/departmentController.js';

const router = express.Router();

router.get('/', getAllDepartments);
router.get('/ajax', getDepartmentsAjax);
router.post('/', createDepartment);
router.put('/:id/update', updateDepartment);
router.put('/:id/toggle', toggleDepartment);
router.delete('/:id/delete', deleteDepartment);

export default router;
