import { poolPromise, sql } from '../db/db.js';

/**
 * Hàm kiểm tra an toàn trước khi xóa.
 * Sử dụng Stored Procedure để kiểm tra nhanh các bảng liên quan.
 */
export async function canDeleteRecord(id, rules) {
    try {
        const pool = await poolPromise;
        
        for (const rule of rules) {
            const { table, field, label } = rule;
            
            // Gọi Store tập trung để check nhanh
            const result = await pool.request()
                .input('pTableName', sql.NVarChar(128), table)
                .input('pFieldName', sql.NVarChar(128), field)
                .input('pId', sql.Int, id)
                .execute('sp_CheckRecordReference');

            const record = result.recordset && result.recordset[0];
            const count = record ? record.count : 0;
            console.log(`Kiểm tra bảng ${table}: tìm thấy ${count} bản ghi.`);

            if (count > 0) {
                // Trả về thông báo rõ ràng cho người dùng
                return { 
                    success: false, 
                    message: `Không thể xóa vì dữ liệu đang được sử dụng tại: ${label || table}` 
                };
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Guard Error:', error);
        // Nếu lỗi kỹ thuật, ta trả về false để ngăn chặn việc xóa nhầm
        return { success: false, message: 'Lỗi kiểm tra an toàn dữ liệu.' };
    }
}