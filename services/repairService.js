import { poolPromise } from '../db/db.js';
import sql from 'mssql';

export async function getRepairs(filters = {}) {
  const pool = await poolPromise;
  const request = pool.request();

  const allowedStatus = ['opened', 'in-progress', 'completed', 'canceled'];
  const status = allowedStatus.includes(filters.status) ? filters.status : null;

  if (filters.deviceKeyword)
    request.input('deviceKeyword', sql.NVarChar(100), `%${filters.deviceKeyword}%`);
  if (filters.hardwareKeyword)
    request.input('hardwareKeyword', sql.NVarChar(100), `%${filters.hardwareKeyword}%`);
  if (status)
    request.input('status', sql.VarChar(20), status);

  const result = await request.query(`
    SELECT R.id, R.brokenDate, R.repairDate, R.status, R.note,
           D.id AS deviceId, D.code AS deviceCode, D.name AS deviceName,
           DT.name AS deviceType,
           DA.deptId, DP.name AS deptName,
           HU.id AS hardwareUnitId, HU.code AS hardwareCode, HU.serialNumber,
           H.name AS hardwareName,
           --U1.id AS senderId, U1.name AS senderName,
           R.userCreateName AS senderName,
           U2.id AS receiverId, U2.name AS receiverName
    FROM Repairs R
    JOIN Devices D ON D.id = R.deviceId AND D.isInactive = 0
    LEFT JOIN DeviceTypes DT ON DT.id = D.deviceTypeId
    LEFT JOIN DeviceAssignments DA ON DA.deviceId = D.id AND DA.isInactive = 0 AND DA.endDate IS NULL
    LEFT JOIN Departments DP ON DP.id = DA.deptId
    LEFT JOIN HardwareUnits HU ON HU.id = R.hardwareUnitId
    LEFT JOIN Hardwares H ON H.id = HU.hardwareId
    --LEFT JOIN Users U1 ON U1.id = R.userCreateId AND U1.isInactive = 0
    LEFT JOIN Users U2 ON U2.id = R.userResolveId AND U2.isInactive = 0
    WHERE 1=1
      ${status ? 'AND R.status = @status' : ''}
      ${filters.deviceKeyword ? 'AND (D.name LIKE @deviceKeyword OR D.code LIKE @deviceKeyword)' : ''}
      ${filters.hardwareKeyword ? 'AND (HU.serialNumber LIKE @hardwareKeyword OR HU.code LIKE @hardwareKeyword)' : ''}
    ORDER BY R.brokenDate DESC
  `);

  return result.recordset;
}

export async function getRepairById(id) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`SELECT R.*, D.code AS deviceCode, D.name AS deviceName
            FROM Repairs R
            JOIN Devices D ON D.id = R.deviceId
            WHERE R.id = @id
            `);
  return result.recordset[0];
}

export async function createRepair(data) {
  const pool = await poolPromise;

  for (const hwId of data.hardwareUnitIds || [null]) {
    await pool.request()
      .input('deviceId', sql.Int, data.deviceId)
      .input('hardwareUnitId', sql.Int, hwId || null)
      .input('brokenDate', sql.DateTime, data.brokenDate)
      .input('repairDate', sql.DateTime, data.repairDate || null)
      .input('status', sql.VarChar(20), data.status || 'opened')
      .input('note', sql.NVarChar(200), data.note || '')
      .input('userCreateName', sql.NVarChar(100), data.userCreateName || null)
      .input('userResolveId', sql.Int, data.userResolveId || null)
      .query(`
        INSERT INTO Repairs(deviceId, hardwareUnitId, brokenDate, repairDate, status, note, userCreateName, userResolveId, isInactive)
        VALUES (@deviceId, @hardwareUnitId, @brokenDate, @repairDate, @status, @note, @userCreateName, @userResolveId, 0)
      `);
  }
}

export async function updateRepair(id, data) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .input('deviceId', sql.Int, data.deviceId)
    .input('hardwareUnitId', sql.Int, data.hardwareUnitId || null)
    .input('brokenDate', sql.DateTime, data.brokenDate)
    .input('repairDate', sql.DateTime, data.repairDate || null)
    .input('status', sql.VarChar(20), data.status)
    .input('note', sql.NVarChar(200), data.note || '')
    .input('userCreateName', sql.NVarChar(100), data.userCreateName || null)
    .input('userResolveId', sql.Int, data.userResolveId || null)
    .query(`
      UPDATE Repairs
      SET deviceId = @deviceId,
          hardwareUnitId = @hardwareUnitId,
          brokenDate = @brokenDate,
          repairDate = @repairDate,
          status = @status,
          note = @note,
          userCreateName  = @userCreateName,
          userResolveId = @userResolveId
      WHERE id = @id
    `);
}

export async function deleteRepair(id) {
  const pool = await poolPromise;
  await pool.request().input('id', sql.Int, id).query(`
    DELETE FROM Repairs WHERE id = @id
  `);
}

export async function getAvailableDevicesForRepair() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT D.id, D.code, D.name, DT.name AS deviceType
    FROM Devices D
    JOIN DeviceTypes DT ON DT.id = D.deviceTypeId
    WHERE D.isInactive = 0
    AND (
        NOT EXISTS (
        SELECT 1
        FROM Devices_HardwareUnits DH
        WHERE DH.deviceId = D.id AND DH.isInactive = 0
        )
        OR EXISTS (
        SELECT 1
        FROM Devices_HardwareUnits DH
        LEFT JOIN Repairs R ON R.hardwareUnitId = DH.hardwareUnitId AND R.status IN ('opened', 'in-progress')
        WHERE DH.deviceId = D.id AND DH.isInactive = 0
            AND R.id IS NULL
        )
    )
    ORDER BY D.name
  `);
  return result.recordset;
}

export async function getAvailableHardwareUnitsForRepair(deviceId, currentRepairId = null) {
  const pool = await poolPromise;
  const request = pool.request()
    .input('deviceId', sql.Int, deviceId)
    .input('currentRepairId', sql.Int, currentRepairId || 0);

  const result = await request.query(`
    SELECT HU.id, HU.code, HU.serialNumber, H.name AS hardwareName,
           CASE
             WHEN R.id IS NOT NULL AND R.id != @currentRepairId THEN 1
             ELSE 0
           END AS isLocked
    FROM Devices_HardwareUnits DH
    JOIN HardwareUnits HU ON HU.id = DH.hardwareUnitId
    JOIN Hardwares H ON H.id = HU.hardwareId
    LEFT JOIN Repairs R ON R.hardwareUnitId = HU.id AND R.status IN ('opened', 'in-progress')
    WHERE DH.deviceId = @deviceId AND DH.isInactive = 0
    ORDER BY HU.id DESC
  `);

  return result.recordset;
}

export async function getActiveUsers() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT U.id, U.code, U.name, DP.name AS deptName
    FROM Users U
    LEFT JOIN Departments DP ON DP.id = U.deptId
    WHERE U.isInactive = 0
    ORDER BY U.name
  `);
  return result.recordset;
}

export async function getHardwareUnitsForCreate(deviceId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('deviceId', sql.Int, deviceId)
    .query(`
      SELECT HU.id, HU.code, HU.serialNumber, H.name AS hardwareName
      FROM Devices_HardwareUnits DH
      JOIN HardwareUnits HU ON HU.id = DH.hardwareUnitId
      JOIN Hardwares H ON H.id = HU.hardwareId
      WHERE DH.deviceId = @deviceId AND DH.isInactive = 0
        AND HU.id NOT IN (
          SELECT hardwareUnitId FROM Repairs
          WHERE status IN ('opened', 'in-progress') AND hardwareUnitId IS NOT NULL
        )
      ORDER BY HU.id DESC
    `);
  return result.recordset;
}

export async function getHardwareUnitsForEdit(deviceId, currentRepairId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('deviceId', sql.Int, deviceId)
    .input('currentRepairId', sql.Int, currentRepairId)
    .query(`
      SELECT HU.id, HU.code, HU.serialNumber, H.name AS hardwareName,
             CASE
               WHEN EXISTS (
                 SELECT 1 FROM Repairs R
                 WHERE R.hardwareUnitId = HU.id AND R.status IN ('opened', 'in-progress') AND R.id != @currentRepairId
               )
               THEN 1 ELSE 0
             END AS isLocked
      FROM Devices_HardwareUnits DH
      JOIN HardwareUnits HU ON HU.id = DH.hardwareUnitId
      JOIN Hardwares H ON H.id = HU.hardwareId
      WHERE DH.deviceId = @deviceId AND DH.isInactive = 0
      ORDER BY HU.id DESC
    `);
  return result.recordset;
}
