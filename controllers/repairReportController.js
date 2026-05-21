// controllers/repairReportController.js

import {
  getRepairReportDetailByRepairId,
  upsertRepairReportDetail,
  getDefaultDeviceUseDateByRepairId,
  getSurveyUsersByDeptId
} from '../services/repairReportService.js';

import apiResponse from '../utils/apiResponse.js';

export async function getRepairReportDetail(req, res) {
  const repairId = req.params.id;

  const reportDetail = await getRepairReportDetailByRepairId(repairId);
  const defaultDeviceUseDate = await getDefaultDeviceUseDateByRepairId(repairId);

  const data = {
    ...(reportDetail || {})
  };

  if (!data.deviceUseDate && defaultDeviceUseDate) {
    data.deviceUseDate = defaultDeviceUseDate;
    data.isDefaultDeviceUseDate = true;
  }

  return apiResponse.success(
    res,
    data,
    'Lấy thông tin biểu mẫu sửa chữa thành công'
  );
}

export async function saveRepairReportDetail(req, res) {
  const repairId = req.params.id;

  const result = await upsertRepairReportDetail(repairId, req.body);

  return apiResponse.success(
    res,
    result,
    result?.message || 'Lưu thông tin biểu mẫu sửa chữa thành công'
  );
}

export async function getSurveyUsers(req, res) {
  const deptId = req.query.deptId || 295;

  const users = await getSurveyUsersByDeptId(deptId);

  return apiResponse.success(
    res,
    users,
    'Lấy danh sách nhân viên khảo sát thành công'
  );
}