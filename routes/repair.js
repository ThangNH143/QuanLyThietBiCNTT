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

import {
  getRepairReportDetail,
  saveRepairReportDetail,
  getSurveyUsers
} from '../controllers/repairReportController.js';

import {
  printRepairRequestPdf,
  printRepairInspectionPdf
} from '../controllers/repairPrintController.js';

import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(getRepairPage));

// Danh sách sửa chữa
router.get('/ajax', asyncHandler(getRepairsList));

// Dropdown hỗ trợ — phải đặt trước /:id
router.get('/dropdown/devices', asyncHandler(getAvailableDevices));
router.get('/dropdown/hardware-units', asyncHandler(getAvailableHardwareUnits));
router.get('/dropdown/users', asyncHandler(getUsersForRepair));

//route in report detail
router.get('/report-detail/survey-users', asyncHandler(getSurveyUsers));

//route in report
router.get('/:id/report-detail', asyncHandler(getRepairReportDetail));
router.post('/:id/report-detail', asyncHandler(saveRepairReportDetail));

//report pdf
router.get('/:id/reports/request/pdf', asyncHandler(printRepairRequestPdf));
router.get('/:id/reports/inspection/pdf', asyncHandler(printRepairInspectionPdf));

// Chi tiết sửa chữa — đặt sau dropdown
router.get('/:id', asyncHandler(getRepairDetail));

// Tạo mới
router.post('/', asyncHandler(createRepairRecord));

// Cập nhật
router.put('/:id', asyncHandler(updateRepairRecord));

// Xóa
router.delete('/:id', asyncHandler(deleteRepairRecord));

export default router;