// services/repairReportService.js

import { poolPromise } from '../db/db.js';
import sql from 'mssql';

export async function getRepairReportDetailByRepairId(repairId) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('pRepairId', sql.Int, parseInt(repairId, 10))
    .execute('sp_RepairReportDetails_GetByRepairId');

  return result.recordset?.[0] || null;
}

export async function upsertRepairReportDetail(repairId, data = {}) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('pRepairId', sql.Int, parseInt(repairId, 10))

    .input('pDeviceUseDate', sql.Date, normalizeDate(data.deviceUseDate))

    .input('pDamageDescription', sql.NVarChar(1000), data.damageDescription || null)

    .input('pSurveyResult', sql.NVarChar(1000), data.surveyResult || null)

    .input('pSurveyPerson1Name', sql.NVarChar(100), data.surveyPerson1Name || null)
    .input('pSurveyPerson1Date', sql.Date, normalizeDate(data.surveyPerson1Date))

    .input('pSurveyPerson2Name', sql.NVarChar(100), data.surveyPerson2Name || null)
    .input('pSurveyPerson2Date', sql.Date, normalizeDate(data.surveyPerson2Date))

    .input('pSurveyPerson3Name', sql.NVarChar(100), data.surveyPerson3Name || null)
    .input('pSurveyPerson3Date', sql.Date, normalizeDate(data.surveyPerson3Date))

    .input('pRepairMethod', sql.NVarChar(20), data.repairMethod || null)

    .input('pExpectedRepairHours', sql.Decimal(10, 2), normalizeDecimal(data.expectedRepairHours))
    .input('pExpectedStartTime', sql.NVarChar(50), data.expectedStartTime || null)
    .input('pExpectedEndTime', sql.NVarChar(50), data.expectedEndTime || null)

    .input('pEstimatedCost', sql.Decimal(18, 0), normalizeDecimal(data.estimatedCost))

    .input('pActualRepairHours', sql.Decimal(10, 2), normalizeDecimal(data.actualRepairHours))
    .input('pActualStartTime', sql.NVarChar(50), data.actualStartTime || null)
    .input('pActualEndTime', sql.NVarChar(50), data.actualEndTime || null)

    .input('pRepairResult', sql.NVarChar(20), data.repairResult || null)
    .input('pRepairResultOther', sql.NVarChar(255), data.repairResultOther || null)

    .input('pRepairContent', sql.NVarChar(1000), data.repairContent || null)

    .input('pOperationStatus', sql.NVarChar(20), data.operationStatus || null)
    .input('pAcceptanceResult', sql.NVarChar(20), data.acceptanceResult || null)
    .input('pAcceptanceNote', sql.NVarChar(1000), data.acceptanceNote || null)

    .input('pDepartmentRepresentativeName', sql.NVarChar(100), data.departmentRepresentativeName || null)
    .input('pFinanceDeptHeadName', sql.NVarChar(100), data.financeDeptHeadName || null)
    .input('pAdminDeptHeadName', sql.NVarChar(100), data.adminDeptHeadName || null)
    .input('pDirectorName', sql.NVarChar(100), data.directorName || null)
    .input('pRepairTechnicianName', sql.NVarChar(100), data.repairTechnicianName || null)
    .input('pItRepresentativeName', sql.NVarChar(100), data.itRepresentativeName || null)

    .execute('sp_RepairReportDetails_Upsert');

  return result.recordset?.[0] || {
    success: true,
    message: 'Lưu thông tin biểu mẫu sửa chữa thành công'
  };
}

function normalizeDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function normalizeDecimal(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const number = Number(String(value).replaceAll(',', ''));

  if (Number.isNaN(number)) {
    return null;
  }

  return number;
}

export async function getDefaultDeviceUseDateByRepairId(repairId) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('pRepairId', sql.Int, parseInt(repairId, 10))
    .execute('sp_RepairReportDetails_GetDefaultDeviceUseDate');

  return result.recordset?.[0]?.defaultDeviceUseDate || null;
}

export async function getSurveyUsersByDeptId(deptId = 295) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('pDeptId', sql.Int, parseInt(deptId, 10))
    .execute('sp_RepairReportDetails_GetSurveyUsers');

  return result.recordset || [];
}