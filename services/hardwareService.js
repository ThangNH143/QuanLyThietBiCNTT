import { poolPromise } from '../db/db.js';
import sql from 'mssql';
import { canDeleteRecord } from '../utils/deletionGuard.js';

export async function getHardwares(filters) {
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;

  const pool = await poolPromise;
  const request = pool.request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit);

  if (filters.code) request.input('code', sql.VarChar(50), `%${filters.code}%`);
  if (filters.name) request.input('name', sql.NVarChar(100), `%${filters.name}%`);
  if (filters.hardwareTypeId) request.input('hardwareTypeId', sql.Int, filters.hardwareTypeId);

  let where = 'WHERE 1=1';
  if (filters.code) where += ' AND code LIKE @code';
  if (filters.name) where += ' AND name LIKE @name';
  if (filters.hardwareTypeId) where += ' AND hardwareTypeId = @hardwareTypeId';
  if (filters.filter === 'active') where += ' AND isInactive = 0';
  if (filters.filter === 'inactive') where += ' AND isInactive = 1';

  const totalResult = await request.query(`SELECT COUNT(*) AS total FROM Hardwares ${where}`);
  const result = await request.query(`
    SELECT * FROM Hardwares
    ${where}
    ORDER BY id DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return { hardwares: result.recordset, total: totalResult.recordset[0].total };
}

export async function createHardwareService({ code, name, hardwareTypeId, note }) {
  const pool = await poolPromise;
  await pool.request()
    .input('code', sql.VarChar(50), code)
    .input('name', sql.NVarChar(100), name)
    .input('hardwareTypeId', sql.Int, hardwareTypeId)
    .input('note', sql.NVarChar(sql.MAX), note)
    .query(`
      INSERT INTO Hardwares(code, name, hardwareTypeId, note, isInactive)
      VALUES (@code, @name, @hardwareTypeId, @note, 0)
    `);
}

export async function updateHardwareService(id, { code, name, hardwareTypeId, note }) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .input('code', sql.VarChar(50), code)
    .input('name', sql.NVarChar(100), name)
    .input('hardwareTypeId', sql.Int, hardwareTypeId)
    .input('note', sql.NVarChar(sql.MAX), note)
    .query(`
      UPDATE Hardwares SET
        code = @code,
        name = @name,
        hardwareTypeId = @hardwareTypeId,
        note = @note
      WHERE id = @id
    `);
}

export async function toggleHardwareService(id) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .query(`UPDATE Hardwares SET isInactive = CASE WHEN isInactive = 1 THEN 0 ELSE 1 END WHERE id = @id`);
}

export async function deleteHardwareService(id) {
  const pool = await poolPromise;
    const rules = [
        { table: 'HardwareUnits', field: 'hardwareId' }
      ];
    const canDelete = await canDeleteRecord(id, rules);
    if (!canDelete) throw new Error('Không thể xóa - phần cứng đang được sử dụng');
  await pool.request()
    .input('id', sql.Int, id)
    .query(`DELETE FROM Hardwares WHERE id = @id`);
}
