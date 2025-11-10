import { poolPromise } from '../db/db.js';
import sql from 'mssql';
import { canDeleteRecord } from '../utils/deletionGuard.js';

export async function getHardwareUnits(filters) {
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;

  const pool = await poolPromise;
  const request = pool.request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit);

  if (filters.code) request.input('code', sql.VarChar(10), `%${filters.code}%`);
  if (filters.serialNumber) request.input('serialNumber', sql.VarChar(100), `%${filters.serialNumber}%`);
  if (filters.hardwareName) request.input('hardwareName', sql.NVarChar(100), `%${filters.hardwareName}%`);
  if (filters.startDate) request.input('startDate', sql.DateTime, filters.startDate);
  if (filters.endDate) request.input('endDate', sql.DateTime, filters.endDate);

  let where = 'WHERE 1=1';
  if (filters.code) where += ' AND HU.code LIKE @code';
  if (filters.serialNumber) where += ' AND HU.serialNumber LIKE @serialNumber';
  if (filters.hardwareName) where += ' AND H.name LIKE @hardwareName';
  if (filters.startDate) where += ' AND HU.purchaseDate >= @startDate';
  if (filters.endDate) where += ' AND HU.purchaseDate <= @endDate';
  if (filters.filter === 'active') where += ' AND HU.isInactive = 0';
  if (filters.filter === 'inactive') where += ' AND HU.isInactive = 1';

  const totalQuery = await request.query(`
    SELECT COUNT(*) as total
    FROM HardwareUnits HU
    JOIN Hardwares H ON HU.hardwareId = H.id
    ${where}
  `);

  const result = await request.query(`
    SELECT HU.*, H.name AS hardwareName
    FROM HardwareUnits HU
    JOIN Hardwares H ON HU.hardwareId = H.id
    ${where}
    ORDER BY HU.id DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return { units: result.recordset, total: totalQuery.recordset[0].total };
}

export async function createHardwareUnitService({ code, serialNumber, hardwareId, purchaseDate, note }) {
  const pool = await poolPromise;
  await pool.request()
    .input('code', sql.VarChar(10), code)
    .input('serialNumber', sql.VarChar(100), serialNumber)
    .input('hardwareId', sql.Int, hardwareId)
    .input('purchaseDate', sql.DateTime, purchaseDate)
    .input('note', sql.NVarChar(200), note)
    .query(`
      INSERT INTO HardwareUnits(code, serialNumber, hardwareId, purchaseDate, note, isInactive)
      VALUES (@code, @serialNumber, @hardwareId, @purchaseDate, @note, 0)
    `);
}

export async function updateHardwareUnitService(id, { code, serialNumber, hardwareId, purchaseDate, note }) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .input('code', sql.VarChar(10), code)
    .input('serialNumber', sql.VarChar(100), serialNumber)
    .input('hardwareId', sql.Int, hardwareId)
    .input('purchaseDate', sql.DateTime, purchaseDate)
    .input('note', sql.NVarChar(200), note)
    .query(`
      UPDATE HardwareUnits SET
        code = @code,
        serialNumber = @serialNumber,
        hardwareId = @hardwareId,
        purchaseDate = @purchaseDate,
        note = @note
      WHERE id = @id
    `);
}

export async function toggleHardwareUnitService(id) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .query(`UPDATE HardwareUnits SET isInactive = CASE WHEN isInactive = 1 THEN 0 ELSE 1 END WHERE id = @id`);
}

export async function deleteHardwareUnitService(id) {
    const pool = await poolPromise;
    const rules = [
        { table: 'Devices_HardwareUnits', field: 'hardwareUnitId' },
        { table: 'Repairs', field: 'hardwareUnitId' },
      ];
    const canDelete = await canDeleteRecord(id, rules);
    if (!canDelete) throw new Error('Không thể xóa - phần cứng chi tiết đang được sử dụng');
    await pool.request()
        .input('id', sql.Int, id)
        .query(`DELETE FROM HardwareUnits WHERE id = @id`);
}
