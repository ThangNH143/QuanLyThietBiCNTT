import { poolPromise } from '../db/db.js';
import sql from 'mssql';
import { canDeleteRecord } from '../utils/deletionGuard.js';
import sanitizeFilters from '../utils/sanitizeFilters.js';

export async function getDevices(filtersRaw) {
  const filters = sanitizeFilters(filtersRaw);
  const page = Number(filters.page) > 0 ? parseInt(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? parseInt(filters.limit) : 10;
  const offset = (page - 1) * limit;

  const pool = await poolPromise;
  const request = pool.request();

  // Gán biến chống SQL injection
  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  if (filters.code) request.input('code', sql.VarChar(50), `%${filters.code}%`);
  if (filters.name) request.input('name', sql.NVarChar(100), `%${filters.name}%`);
  if (filters.deviceTypeId) request.input('deviceTypeId', sql.Int, filters.deviceTypeId);
  if (filters.startDate) request.input('startDate', sql.Date, filters.startDate);
  if (filters.endDate) request.input('endDate', sql.Date, filters.endDate);

  let whereClause = 'WHERE 1=1';
  if (filters.filter === 'active') whereClause += ' AND D.isInactive = 0';
  if (filters.filter === 'inactive') whereClause += ' AND D.isInactive = 1';
  if (filters.code) whereClause += ' AND D.code LIKE @code';
  if (filters.name) whereClause += ' AND D.name LIKE @name';
  if (filters.deviceTypeId) whereClause += ' AND D.deviceTypeId = @deviceTypeId';
  if (filters.startDate) whereClause += ' AND D.purchaseDate >= @startDate';
  if (filters.endDate) whereClause += ' AND D.purchaseDate <= @endDate';

  const totalResult = await request.query(`
    SELECT COUNT(*) AS total
    FROM Devices D ${whereClause}
  `);
  const total = totalResult.recordset[0].total;

  const result = await request.query(`
    SELECT D.*, DT.name AS deviceTypeName
    FROM Devices D
    LEFT JOIN DeviceTypes DT ON D.deviceTypeId = DT.id
    ${whereClause}
    ORDER BY D.id DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `);

  return { devices: result.recordset, total };
}

export async function createDeviceService({ code, name, deviceTypeId, purchaseDate, note }) {
  const pool = await poolPromise;
  await pool.request()
    .input('code', code)
    .input('name', name)
    .input('deviceTypeId', deviceTypeId)
    .input('purchaseDate', purchaseDate)
    .input('note', note)
    .query(`
      INSERT INTO Devices (code, name, deviceTypeId, purchaseDate, note)
      VALUES (@code, @name, @deviceTypeId, @purchaseDate, @note)
    `);
}

export async function updateDeviceService(id, { code, name, deviceTypeId, purchaseDate, note }) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', id)
    .input('code', code)
    .input('name', name)
    .input('deviceTypeId', deviceTypeId)
    .input('purchaseDate', purchaseDate)
    .input('note', note)
    .query(`UPDATE Devices SET 
                code = @code, 
                name = @name, 
                deviceTypeId = @deviceTypeId,
                purchaseDate = @purchaseDate, 
                note = @note 
            WHERE id = @id`);
}

export async function toggleDeviceService(id) {
  const pool = await poolPromise;
  await pool.request()
    .input('id', id)
    .query('UPDATE Devices SET isInactive = IIF(isInactive = 0, 1, 0) WHERE id = @id');
}

export async function deleteDeviceService(id) {
  const pool = await poolPromise;
  const rules = [
    { table: 'DeviceAssignments', field: 'deviceId' },
    { table: 'Repairs', field: 'deviceId' },
    { table: 'Devices_HardwareUnits', field: 'deviceId' }
  ];
  const canDelete = await canDeleteRecord(id, rules);
  if (!canDelete) throw new Error('Không thể xóa – thiết bị đang được sử dụng hoặc đã được gán phần cứng');
  await pool.request().input('id', id).query('DELETE FROM Devices WHERE id = @id');
}

export async function getDeviceTypesDropdown() {
  const pool = await poolPromise;
  const result = await pool.request()
    .query('SELECT id, name FROM DeviceTypes WHERE isInactive = 0');
  return result.recordset;
}