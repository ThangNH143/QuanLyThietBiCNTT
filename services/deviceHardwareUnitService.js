import { poolPromise } from '../db/db.js';
import sql from 'mssql';

export async function getDevicesWithHardware(filters = {}) {
  const pool = await poolPromise;
  const request = pool.request();

  if (filters.deviceName)
    request.input('deviceName', sql.NVarChar(100), `%${filters.deviceName}%`);
  if (filters.hardwareKeyword)
    request.input('hardwareKeyword', sql.NVarChar(100), `%${filters.hardwareKeyword}%`);

  let where = '';
  if (filters.deviceName) where += ' AND D.name LIKE @deviceName';
  if (filters.hardwareKeyword)
    where += ' AND (H.name LIKE @hardwareKeyword OR HU.serialNumber LIKE @hardwareKeyword)';

  const result = await request.query(`
    SELECT 
      D.id AS deviceId, 
      D.code as deviceCode, 
      D.name AS deviceName, 
      DT.name as deviceType,
      HU.id AS hwId, 
      H.name AS hardwareName, 
      HU.serialNumber, 
      CASE WHEN R.status NOT IN ('completed', 'canceled') THEN 1 ELSE 0 END AS isUnderRepair
    FROM Devices D
    LEFT JOIN DeviceTypes DT ON DT.id = D.deviceTypeId
    JOIN Devices_HardwareUnits DH ON DH.deviceId = D.id AND DH.isInactive = 0
    LEFT JOIN HardwareUnits HU ON HU.id = DH.hardwareUnitId
    LEFT JOIN Hardwares H ON H.id = HU.hardwareId
    LEFT JOIN Repairs R ON R.hardwareUnitId = HU.id
    WHERE 1=1 ${where}
    ORDER BY D.id, HU.id
  `);

  const grouped = [];

  for (const row of result.recordset) {
    let group = grouped.find(g => g.deviceId === row.deviceId);
    if (!group) {
      group = {
        deviceId: row.deviceId,
        deviceCode: row.deviceCode,
        deviceName: row.deviceName,
        deviceType: row.deviceType,
        hardwareUnits: []
      };
      grouped.push(group);
    }
    if (row.hwId) {
      group.hardwareUnits.push({
        id: row.hwId,
        hardwareName: row.hardwareName,
        serialNumber: row.serialNumber,
        isUnderRepair: row.isUnderRepair === 1
      });
    }
  }

  return grouped;
}

export async function getDevicesWithoutHardware(includeId = null) {
  const pool = await poolPromise;
  const request = pool.request();

  // Nếu có includeId thì truyền, nếu không thì gán NULL rõ ràng
  request.input('includeId', sql.Int, includeId || null);

  const result = await request.query(`
    SELECT D.id, D.code, D.name, DT.name as deviceType
    FROM Devices D
    LEFT JOIN DeviceTypes DT ON DT.id = D.deviceTypeId
    WHERE D.isInactive = 0
      AND (
        (
          NOT EXISTS (
            SELECT 1 FROM Devices_HardwareUnits DH
            WHERE DH.deviceId = D.id AND DH.isInactive = 0
          )
          AND NOT EXISTS (
            SELECT 1 FROM Repairs R
            WHERE R.deviceId = D.id AND R.status NOT IN ('completed', 'canceled')
          )
        )
        OR (@includeId IS NOT NULL AND D.id = @includeId)
      )
    ORDER BY D.name
  `);
  return result.recordset;
}

export async function getHardwareUnitsForCreate() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT HU.id, H.name AS hardwareName, HU.serialNumber,
      CASE WHEN R.status NOT IN ('completed', 'canceled') THEN 1 ELSE 0 END AS isUnderRepair
    FROM HardwareUnits HU
    JOIN Hardwares H ON H.id = HU.hardwareId
    LEFT JOIN Repairs R ON R.hardwareUnitId = HU.id
    WHERE HU.isInactive = 0
      AND HU.id NOT IN (
        SELECT hardwareUnitId FROM Devices_HardwareUnits WHERE isInactive = 0
      )
    ORDER BY HU.id DESC
  `);
  return result.recordset;
}

export async function getHardwareUnitsForEdit(deviceId, includeIds = []) {
  const pool = await poolPromise;
  const request = pool.request();
  request.input('deviceId', sql.Int, deviceId);
  if (includeIds.length > 0)
    request.input('includeIds', sql.VarChar(200), includeIds.join(','));

  const result = await request.query(`
    SELECT HU.id, H.name AS hardwareName, HU.serialNumber,
      CASE WHEN R.status NOT IN ('completed', 'canceled') THEN 1 ELSE 0 END AS isUnderRepair
    FROM HardwareUnits HU
    JOIN Hardwares H ON H.id = HU.hardwareId
    LEFT JOIN Repairs R ON R.hardwareUnitId = HU.id
    WHERE HU.isInactive = 0
      AND (
        HU.id NOT IN (
          SELECT hardwareUnitId FROM Devices_HardwareUnits 
          WHERE isInactive = 0 AND deviceId != @deviceId
        )
        OR HU.id IN (SELECT value FROM STRING_SPLIT(@includeIds, ','))
      )
    ORDER BY HU.id DESC
  `);

  return result.recordset;
}

export async function getDeviceHardwareAssigned(deviceId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('deviceId', sql.Int, deviceId)
    .query(`
      SELECT HU.id, H.name AS hardwareName, HU.serialNumber
      FROM Devices_HardwareUnits DH
      JOIN HardwareUnits HU ON HU.id = DH.hardwareUnitId
      JOIN Hardwares H ON H.id = HU.hardwareId
      WHERE DH.deviceId = @deviceId AND DH.isInactive = 0
    `);
  return { assigned: result.recordset };
}

export async function updateDeviceHardwareAssigned(deviceId, hardwareUnitIds = []) {
  const pool = await poolPromise;
  await pool.request().input('deviceId', sql.Int, deviceId).query(`
    DELETE FROM Devices_HardwareUnits WHERE deviceId = @deviceId
  `);
  for (const id of hardwareUnitIds) {
    await pool.request()
      .input('deviceId', sql.Int, deviceId)
      .input('hardwareUnitId', sql.Int, parseInt(id))
      .query(`
        INSERT INTO Devices_HardwareUnits(deviceId, hardwareUnitId, isInactive)
        VALUES (@deviceId, @hardwareUnitId, 0)
      `);
  }
}

export async function detachDeviceHardwareUnit(deviceId, hardwareUnitId) {
  const pool = await poolPromise;
  await pool.request()
    .input('deviceId', sql.Int, deviceId)
    .input('hardwareUnitId', sql.Int, hardwareUnitId)
    .query(`
      DELETE FROM Devices_HardwareUnits
      WHERE deviceId = @deviceId AND hardwareUnitId = @hardwareUnitId
    `);
}
