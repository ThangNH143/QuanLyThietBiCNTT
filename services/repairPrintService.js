// services/repairPrintService.js

import path from 'path';
import { fileURLToPath } from 'url';

import { poolPromise } from '../db/db.js';
import sql from 'mssql';

import { renderDocxTemplateToPdf } from './docxReportService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');

const REPAIR_TEMPLATE_PATH = path.join(
  PROJECT_ROOT,
  'templates',
  'repairs',
  'repair-request-template.docx'
);

const INSPECTION_TEMPLATE_PATH = path.join(
  PROJECT_ROOT,
  'templates',
  'repairs',
  'repair-inspection-template.docx'
);

const OUTPUT_DIR = path.join(
  PROJECT_ROOT,
  'temp',
  'reports'
);

export async function getRepairPrintData(repairId) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('pRepairId', sql.Int, parseInt(repairId, 10))
    .execute('sp_Repairs_GetPrintDataById');

  return result.recordset?.[0] || null;
}

export async function generateRepairRequestPdf(repairId) {
  const rawData = await getRepairPrintData(repairId);

  if (!rawData) {
    return null;
  }

  const data = buildRepairTemplateData(rawData);

  return renderDocxTemplateToPdf({
    templatePath: REPAIR_TEMPLATE_PATH,
    outputDir: OUTPUT_DIR,
    data,
    outputBaseName: `repair-request-${repairId}-${Date.now()}`
  });
}

export async function generateRepairInspectionPdf(repairId) {
  const rawData = await getRepairPrintData(repairId);

  if (!rawData) {
    return null;
  }

  const data = buildRepairTemplateData(rawData);

  return renderDocxTemplateToPdf({
    templatePath: INSPECTION_TEMPLATE_PATH,
    outputDir: OUTPUT_DIR,
    data,
    outputBaseName: `repair-inspection-${repairId}-${Date.now()}`
  });
}

function buildRepairTemplateData(row) {
  const today = new Date();

  const repairMethod = row.repairMethod || '';
  const repairResult = row.repairResult || '';
  const operationStatus = row.operationStatus || '';
  const acceptanceResult = row.acceptanceResult || '';

  const deviceType = clean(row.deviceType);
  const deviceNameOnly = clean(row.deviceName);
  const displayDeviceName = [deviceType, deviceNameOnly]
    .filter(Boolean)
    .join(' ');

  return {
    repairId: row.repairId || '',

    deviceCode: clean(row.deviceCode),
    deviceName: displayDeviceName,
    deviceType,
    serialNumber: clean(row.serialNumber),
    hardwareName: clean(row.hardwareName),
    deptName: clean(row.deptName),

    userCreateName: clean(row.userCreateName),
    userResolveName: clean(row.userResolveName),

    brokenDate: formatDate(row.brokenDate),
    repairDate: formatDate(row.repairDate),
    status: statusText(row.status),
    note: clean(row.note),

    deviceUseDate: formatDate(row.deviceUseDate),

    damageDescription: clean(row.damageDescription),
    surveyResult: clean(row.surveyResult),

    surveyPerson1Name: clean(row.surveyPerson1Name),
    surveyPerson1Date: formatDate(row.surveyPerson1Date),

    surveyPerson2Name: clean(row.surveyPerson2Name),
    surveyPerson2Date: formatDate(row.surveyPerson2Date),

    surveyPerson3Name: clean(row.surveyPerson3Name),
    surveyPerson3Date: formatDate(row.surveyPerson3Date),

    repairMethodInternalChecked: repairMethod === 'internal' ? '☑' : '☐',
    repairMethodExternalChecked: repairMethod === 'external' ? '☑' : '☐',

    expectedRepairHours: clean(row.expectedRepairHours),
    expectedStartTime: clean(row.expectedStartTime),
    expectedEndTime: clean(row.expectedEndTime),
    estimatedCost: formatMoney(row.estimatedCost),

    actualRepairHours: clean(row.actualRepairHours),
    actualStartTime: clean(row.actualStartTime),
    actualEndTime: clean(row.actualEndTime),

    repairResultPassedChecked: repairResult === 'passed' ? '☑' : '☐',
    repairResultFailedChecked: repairResult === 'failed' ? '☑' : '☐',
    repairResultOther: clean(row.repairResultOther),

    repairContent: clean(row.repairContent),

    operationPassedChecked: operationStatus === 'passed' ? '☑' : '☐',
    operationFailedChecked: operationStatus === 'failed' ? '☑' : '☐',

    acceptancePassedChecked: acceptanceResult === 'passed' ? '☑' : '☐',
    acceptanceFailedChecked: acceptanceResult === 'failed' ? '☑' : '☐',

    acceptanceNote: clean(row.acceptanceNote),

    departmentRepresentativeName: clean(row.departmentRepresentativeName),
    financeDeptHeadName: clean(row.financeDeptHeadName),
    adminDeptHeadName: clean(row.adminDeptHeadName),
    directorName: clean(row.directorName),
    repairTechnicianName: clean(row.repairTechnicianName),
    itRepresentativeName: clean(row.itRepresentativeName),

    // Mapping riêng cho Biên bản kiểm tra
    inspectionResult: clean(row.damageDescription),
    repairSuggestion: clean(row.repairContent),

    reportDay: String(today.getDate()),
    reportMonth: String(today.getMonth() + 1),
    reportYear: String(today.getFullYear())
  };
}

function clean(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function formatDate(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return number.toLocaleString('vi-VN') + 'đ';
}

function statusText(status) {
  if (status === 'opened') return 'Mới tiếp nhận';
  if (status === 'in-progress') return 'Đang sửa';
  if (status === 'completed') return 'Hoàn tất';
  if (status === 'canceled') return 'Hủy bỏ';

  return status || '';
}