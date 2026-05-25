// controllers/repairPrintController.js

import fs from 'fs/promises';

import {
  generateRepairRequestPdf,
  generateRepairInspectionPdf
} from '../services/repairPrintService.js';

export async function printRepairRequestPdf(req, res) {
  let result = null;

  try {
    result = await generateRepairRequestPdf(req.params.id);

    if (!result) {
      return res.status(404).send('Không tìm thấy dữ liệu phiếu sửa chữa');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="phieu-de-nghi-sua-chua-${req.params.id}.pdf"`
    );

    return res.send(result.pdfBuffer);
  } finally {
    await cleanupGeneratedReportFiles(result);
  }
}

export async function printRepairInspectionPdf(req, res) {
  let result = null;

  try {
    result = await generateRepairInspectionPdf(req.params.id);

    if (!result) {
      return res.status(404).send('Không tìm thấy dữ liệu biên bản kiểm tra');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="bien-ban-kiem-tra-${req.params.id}.pdf"`
    );

    return res.send(result.pdfBuffer);
  } finally {
    await cleanupGeneratedReportFiles(result);
  }
}

async function cleanupGeneratedReportFiles(result) {
  if (!result) return;

  const files = [
    result.docxOutputPath,
    result.pdfOutputPath
  ].filter(Boolean);

  for (const filePath of files) {
    try {
      await fs.unlink(filePath);
      console.log('[REPORT] Deleted temp file:', filePath);
    } catch (error) {
      // Không throw lỗi cleanup để tránh ảnh hưởng response cho user
      console.warn('[REPORT] Cannot delete temp file:', filePath, error.message);
    }
  }
}