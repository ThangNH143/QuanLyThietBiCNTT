import { poolPromise } from '../db/db.js';

export async function canDeleteRecord(id, rules) {
  const pool = await poolPromise;
  for (const { table, field } of rules) {
    const result = await pool.request()
      .input('id', id)
      .query(`SELECT COUNT(*) AS count FROM ${table} WHERE ${field} = @id`);
    if (result.recordset[0].count > 0) return false;
  }
  return true;
}
