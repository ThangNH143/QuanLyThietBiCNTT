// routes/repair.js

import express from 'express';

import {
  getRepairPage,
  getRepairsList,
  getRepairDetail,
  createRepairRecord,
  updateRepairRecord,
  deleteRepairRecord,
  getAvailableDevices,
  getAvailableHardwareUnits,
  getUsersForRepair
} from '../controllers/repairController.js';

import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(getRepairPage));

// Danh sách sửa chữa
router.get('/ajax', asyncHandler(getRepairsList));

// Dropdown hỗ trợ — phải đặt trước /:id
router.get('/dropdown/devices', asyncHandler(getAvailableDevices));
router.get('/dropdown/hardware-units', asyncHandler(getAvailableHardwareUnits));
router.get('/dropdown/users', asyncHandler(getUsersForRepair));

// Chi tiết sửa chữa — đặt sau dropdown
router.get('/:id', asyncHandler(getRepairDetail));

// Tạo mới
router.post('/', asyncHandler(createRepairRecord));

// Cập nhật
router.put('/:id', asyncHandler(updateRepairRecord));

// Xóa
router.delete('/:id', asyncHandler(deleteRepairRecord));

export default router;