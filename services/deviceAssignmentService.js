// services/deviceAssignmentService.js
import { poolPromise } from '../db/db.js';
import sql from 'mssql';

export async function getDeviceAssignments(filters = {}) {
  const pool = await poolPromise;
  const request = pool.request();
  const allowed = ['active', 'revoked', 'all'];
  const status = allowed.includes(filters.status) ? filters.status : 'active';
  let inactiveFilter = '';
  let statusFilter = '';
  if (status === 'active') {
    statusFilter = 'AND DA.endDate IS NULL';
    inactiveFilter = 'AND DA.isInactive = 0';
  } else if (status === 'revoked') {
    statusFilter = 'AND DA.endDate IS NOT NULL';
    inactiveFilter = 'AND DA.isInactive = 1';
  } else {
    // status === 'all'
    inactiveFilter = '';
    statusFilter = ''; // không lọc isInactive
  }

  if (filters.deviceName)
    request.input('deviceName', sql.NVarChar(100), `%${filters.deviceName}%`);
  if (filters.deptName)
    request.input('deptName', sql.NVarChar(100), `%${filters.deptName}%`);

  const result = await request.query(`
    SELECT DISTINCT DA.id, D.code as deviceCode, D.name AS deviceName, DT.name as deviceType,
           DP.name AS deptName, DA.startDate, DA.endDate, DA.note,
           CASE WHEN R.status NOT IN ('completed','canceled') THEN 1 ELSE 0 END AS isUnderRepair
    FROM DeviceAssignments DA
    JOIN Devices D ON D.id = DA.deviceId
    LEFT JOIN DeviceTypes DT ON DT.id = D.deviceTypeId
    JOIN Departments DP ON DP.id = DA.deptId
    LEFT JOIN Repairs R ON R.deviceId = D.id AND R.isInactive = 0
    WHERE 1=1
        ${inactiveFilter}
        ${statusFilter}
        ${filters.deviceName ? 'AND D.name LIKE @deviceName' : ''}
        ${filters.deptName ? 'AND DP.name LIKE @deptName' : ''}
  `);
  return result.recordset;
}

export async function getAssignableDevices() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT D.id, D.code as deviceCode, D.name AS deviceName, DT.name as deviceType
    FROM Devices D
    LEFT JOIN DeviceTypes DT ON DT.id = D.deviceTypeId
    WHERE D.isInactive = 0
      AND NOT EXISTS (
        SELECT 1 FROM Repairs R WHERE R.deviceId = D.id AND R.status NOT IN ('completed','canceled')
      )
      AND NOT EXISTS (
        SELECT 1 FROM DeviceAssignments DA
        WHERE DA.deviceId = D.id AND DA.isInactive = 0 AND DA.endDate IS NULL
      )
    ORDER BY D.name
  `);
  return result.recordset;
}

export async function createDeviceAssignment({ deviceId, deptId, startDate, note }) {
  const pool = await poolPromise;
  await pool.request()
    .input('deviceId', sql.Int, deviceId)
    .input('deptId', sql.Int, deptId)
    .input('startDate', sql.DateTime, startDate)
    .input('note', sql.NVarChar(200), note || '')
    .query(`
      INSERT INTO DeviceAssignments(deviceId, deptId, startDate, isInactive, note)
      VALUES (@deviceId, @deptId, @startDate, 0, @note)
    `);
}

export async function updateDeviceAssignment(id, { deptId, startDate, endDate, note }) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .input('deptId', sql.Int, deptId)
    .input('startDate', sql.DateTime, startDate)
    .input('endDate', sql.DateTime, endDate || null)
    .input('note', sql.NVarChar(200), note || '')
    .query(`
      UPDATE DeviceAssignments
      SET deptId = @deptId, startDate = @startDate, endDate = @endDate, note = @note
      WHERE id = @id
    `);
}

export async function revokeDeviceAssignment(id) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .query(`
      UPDATE DeviceAssignments
      SET endDate = GETDATE(), isInactive = 1
      WHERE id = @id
    `);
}

export async function deleteDeviceAssignment(id) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM DeviceAssignments WHERE id = @id
    `);
}
