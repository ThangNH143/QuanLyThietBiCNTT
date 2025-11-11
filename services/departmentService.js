import { poolPromise } from '../db/db.js';
import sql from 'mssql';
import { canDeleteRecord } from '../utils/deletionGuard.js';

/**
 * Lấy danh sách phòng ban có phân trang và lọc sử dụng Stored Procedure.
 * Tên SP: sp_Departments_GetPaged
 */
export async function getDepartments(filtersRaw) {
    // 1. Chuẩn bị tham số
    const page = parseInt(filtersRaw.page) || 1;
    const limit = parseInt(filtersRaw.limit) || 10;
    const offset = (page - 1) * limit;

    const nameSearch = filtersRaw.name ? `%${filtersRaw.name}%` : null;
    const noteSearch = filtersRaw.note ? `%${filtersRaw.note}%` : null;
    
    // Đảm bảo filter là 'active', 'inactive' hoặc 'all'
    const filterStatus = filtersRaw.filter === 'active' || filtersRaw.filter === 'inactive'
        ? filtersRaw.filter 
        : 'all';

    // 2. Gọi Stored Procedure
    const pool = await poolPromise;
    const result = await pool.request()
        // Tham số phân trang (Bắt buộc)
        .input('pOffset', sql.Int, offset)
        .input('pLimit', sql.Int, limit)
        // Tham số lọc trạng thái (Bắt buộc)
        .input('pFilterStatus', sql.VarChar(10), filterStatus)
        // Tham số tìm kiếm (Chỉ truyền khi có giá trị)
        .input('pNameSearch', sql.NVarChar(100), nameSearch)
        .input('pNoteSearch', sql.NVarChar(100), noteSearch)
        .execute('sp_Departments_GetPaged'); 
    
    // 3. Xử lý kết quả trả về từ SP
    // Khi dùng Dynamic SQL, mssql có thể trả về nhiều recordset:
    // result.recordsets[0] là COUNT(*)
    // result.recordsets[1] là dữ liệu Departments
    
    const total = result.recordsets[0][0].total;
    const departments = result.recordsets[1];

    return { departments, total };
}

/**
 * Tạo mới phòng ban sử dụng Stored Procedure.
 * Tên SP: sp_Departments_Create
 */
export async function createDepartmentService({ code, name, note }) {
    const pool = await poolPromise;
    // Phương thức .execute() gọi SP thay vì .query()
    await pool.request()
        .input('pCode', sql.VarChar(10), code)
        .input('pName', sql.NVarChar(100), name)
        .input('pNote', sql.NVarChar(sql.MAX), note)
        .execute('sp_Departments_Create');
}

/**
 * Cập nhật phòng ban sử dụng Stored Procedure.
 * Tên SP: sp_Departments_Update
 */
export async function updateDepartmentService(id, { code, name, note }) {
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .input('pCode', sql.VarChar(10), code)
        .input('pName', sql.NVarChar(100), name)
        .input('pNote', sql.NVarChar(sql.MAX), note)
        .execute('sp_Departments_Update');
}

/**
 * Bật/tắt trạng thái hoạt động sử dụng Stored Procedure.
 * Tên SP: sp_Departments_ToggleStatus
 */
export async function toggleDepartmentService(id) {
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .execute('sp_Departments_ToggleStatus');
}

/**
 * Xóa phòng ban sử dụng Stored Procedure.
 * Tên SP: sp_Departments_Delete
 */
export async function deleteDepartmentService(id) {
    const rules = [
        { table: 'DeviceAssignments', field: 'deptId' }
    ];
    // Giữ nguyên logic kiểm tra ràng buộc trong Node.js
    const canDelete = await canDeleteRecord(id, rules); 
    if (!canDelete) throw new Error('Không thể xóa phòng ban đang được sử dụng');
    
    const pool = await poolPromise;
    await pool.request()
        .input('pId', sql.Int, id)
        .execute('sp_Departments_Delete');
}