import express from 'express';
import {
  getAllDepartments,
  getDepartmentsAjax,
  createDepartment,
  updateDepartment,
  toggleDepartment,
  deleteDepartment
} from '../controllers/departmentController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(getAllDepartments));
router.get('/ajax', asyncHandler(getDepartmentsAjax));
router.post('/', asyncHandler(createDepartment));
router.put('/:id', asyncHandler(updateDepartment));
router.put('/:id/update', asyncHandler(updateDepartment));
router.patch('/:id/toggle', asyncHandler(toggleDepartment));
router.put('/:id/toggle', asyncHandler(toggleDepartment));
router.delete('/:id', asyncHandler(deleteDepartment));
router.delete('/:id/delete', asyncHandler(deleteDepartment));

export default router;
