// controllers/repairPrintController.js

import {
  generateRepairRequestPdf,
  generateRepairInspectionPdf
} from '../services/repairPrintService.js';

export async function printRepairRequestPdf(req, res) {
  const result = await generateRepairRequestPdf(req.params.id);

  if (!result) {
    return res.status(404).send('Không tìm thấy dữ liệu phiếu sửa chữa');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="phieu-de-nghi-sua-chua-${req.params.id}.pdf"`
  );

  return res.send(result.pdfBuffer);
}

export async function printRepairInspectionPdf(req, res) {
  const result = await generateRepairInspectionPdf(req.params.id);

  if (!result) {
    return res.status(404).send('Không tìm thấy dữ liệu biên bản kiểm tra');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="bien-ban-kiem-tra-${req.params.id}.pdf"`
  );

  return res.send(result.pdfBuffer);
}