import { poolPromise } from '../db/db.js';
import sql from 'mssql';
import { canDeleteRecord } from '../utils/deletionGuard.js';

export async function getDeviceTypes(filters) {
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;

  const pool = await poolPromise;
  const request = pool.request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit);

  if (filters.code) request.input('code', sql.NVarChar(100), `%${filters.code}%`);
  if (filters.name) request.input('name', sql.NVarChar(100), `%${filters.name}%`);

  let where = 'WHERE 1=1';
  if (filters.filter === 'active') where += ' AND isInactive = 0';
  if (filters.filter === 'inactive') where += ' AND isInactive = 1';
  if (filters.name) where += ' AND code LIKE @code';
  if (filters.name) where += ' AND name LIKE @name';

  const total = await request.query(`SELECT COUNT(*) as total FROM DeviceTypes ${where}`);
  const data = await request.query(`
    SELECT * FROM DeviceTypes
    ${where}
    ORDER BY id DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return { deviceTypes: data.recordset, total: total.recordset[0].total };
}

export async function createDeviceTypeService({ code, name, note }) {
  const pool = await poolPromise;
  await pool.request()
    .input('code', sql.VarChar(10), code)
    .input('name', sql.NVarChar(100), name)
    .input('note', sql.NVarChar(200), note)
    .query(`INSERT INTO DeviceTypes(code, name, note, isInactive) VALUES (@code, @name, @note, 0)`);
}

export async function updateDeviceTypeService(id, {code, name, note }) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .input('code', sql.VarChar(10), code)
    .input('name', sql.NVarChar(100), name)
    .input('note', sql.NVarChar(200), note)
    .query(`UPDATE DeviceTypes 
            SET code = @code, 
                name = @name, 
                note = COALESCE(NULLIF(@note, ''), note) 
                WHERE id = @id`);
}

export async function toggleDeviceTypeService(id) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .query(`UPDATE DeviceTypes SET isInactive = CASE WHEN isInactive = 1 THEN 0 ELSE 1 END WHERE id = @id`);
}

export async function deleteDeviceTypeService(id) {
   const pool = await poolPromise;
    const rules = [
        { table: 'Devices', field: 'deviceTypeId' }
      ];
    const canDelete = await canDeleteRecord(id, rules);
    if (!canDelete) throw new Error('Không thể xóa - loại thiết bị đang được sử dụng');
  await pool.request()
    .input('id', sql.Int, id)
    .query(`DELETE FROM DeviceTypes WHERE id = @id`);
}
