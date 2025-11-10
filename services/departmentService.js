import { poolPromise } from '../db/db.js';
import sql from 'mssql';
import { canDeleteRecord } from '../utils/deletionGuard.js';

export async function getDepartments(filtersRaw) {
  const page = parseInt(filtersRaw.page) || 1;
  const limit = parseInt(filtersRaw.limit) || 10;
  const offset = (page - 1) * limit;

  const pool = await poolPromise;
  const request = pool.request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit);

  if (filtersRaw.code) request.input('code', sql.VarChar(10), `%${filtersRaw.code}%`);
  if (filtersRaw.name) request.input('name', sql.NVarChar(100), `%${filtersRaw.name}%`);
  if (filtersRaw.note) request.input('note', sql.NVarChar(100), `%${filtersRaw.note}%`);

  let whereClause = 'WHERE 1=1';
  if (filtersRaw.filter === 'active') whereClause += ' AND isInactive = 0';
  if (filtersRaw.filter === 'inactive') whereClause += ' AND isInactive = 1';
  if (filtersRaw.name) whereClause += ' AND name LIKE @name';
  if (filtersRaw.note) whereClause += ' AND note LIKE @note';

  const totalResult = await request.query(`SELECT COUNT(*) AS total FROM Departments ${whereClause}`);
  const total = totalResult.recordset[0].total;

  const result = await request.query(`
    SELECT * FROM Departments
    ${whereClause}
    ORDER BY id DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return { departments: result.recordset, total };
}

export async function createDepartmentService({ code, name, note }) {
  const pool = await poolPromise;
  await pool.request()
    .input('code', sql.VarChar(10), code)
    .input('name', sql.NVarChar(100), name)
    .input('note', sql.NVarChar(sql.MAX), note)
    .query(`INSERT INTO Departments(code, name, note, isInactive) VALUES (@code, @name, @note, 0)`);
}

export async function updateDepartmentService(id, { code, name, note }) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .input('code', sql.VarChar(10), code)
    .input('name', sql.NVarChar(100), name)
    .input('note', sql.NVarChar(sql.MAX), note)
    .query(`UPDATE Departments SET code = @code, name = @name, note = @note WHERE id = @id`);
}

export async function toggleDepartmentService(id) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .query(`UPDATE Departments SET isInactive = CASE WHEN isInactive = 0 THEN 1 ELSE 0 END WHERE id = @id`);
}

export async function deleteDepartmentService(id) {
  const pool = await poolPromise;
  const rules = [
      { table: 'DeviceAssignments', field: 'deptId' }
    ];
  const canDelete = await canDeleteRecord(id, rules);
  if (!canDelete) throw new Error('Không thể xóa phòng ban đang được sử dụng');
  await pool.request()
    .input('id', sql.Int, id)
    .query(`DELETE FROM Departments WHERE id = @id`);
}
