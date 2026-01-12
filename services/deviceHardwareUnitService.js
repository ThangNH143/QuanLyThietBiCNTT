import { poolPromise } from '../db/db.js';
import sql from 'mssql';

/**
 * Lấy danh sách các thiết bị cùng với phần cứng đã gán (bao gồm lọc và nhóm dữ liệu).
 * Sử dụng SP: sp_DeviceHardwareUnits_GetDevicesWithHardware
 */
export async function getDevicesWithHardware(filters = {}) {
    const pool = await poolPromise;
    const request = pool.request();

    // Pagination (default giống assignments)
    const page = Math.max(parseInt(filters.page || 1, 10), 1);
    const limit = Math.max(parseInt(filters.limit || 10, 10), 1);

    // Chuẩn bị tham số cho SP (sử dụng LIKE %...% hoặc NULL)
    const deviceNameParam = filters.deviceName ? `%${filters.deviceName}%` : null;
    const hardwareKeywordParam = filters.hardwareKeyword ? `%${filters.hardwareKeyword}%` : null;

    const result = await request
        .input('pDeviceName', sql.NVarChar(100), deviceNameParam)
        .input('pHardwareKeyword', sql.NVarChar(100), hardwareKeywordParam)
        .input('pPage', sql.Int, page)
        .input('pLimit', sql.Int, limit)
        .execute('sp_DeviceHardwareUnits_GetDevicesWithHardware_Paged'); // ✅ đúng tên SP

    // ✅ Hỗ trợ cả 2 kiểu: data-first hoặc count-first
    const rs0 = result.recordsets?.[0] || [];
    const rs1 = result.recordsets?.[1] || [];

    let rows = [];
    let totalRecords = 0;

    // Nếu rs0 là COUNT (có cột totalRecords) => count-first
    if (rs0.length > 0 && rs0[0]?.totalRecords !== undefined) {
    totalRecords = Number(rs0[0].totalRecords) || 0;
    rows = rs1;
    } else {
    // data-first
    rows = rs0;
    totalRecords = Number(rs1?.[0]?.totalRecords) || 0;
    }

    const totalPages = Math.ceil(totalRecords / limit) || 1;

    // Grouping ở tầng Node.js (theo device)
    const map = new Map();
    for (const row of rows) {
        let group = map.get(row.deviceId);
        if (!group) {
            group = {
                deviceId: row.deviceId,
                deviceCode: row.deviceCode,
                deviceName: row.deviceName,
                deviceType: row.deviceType,
                hardwareUnits: []
            };
            map.set(row.deviceId, group);
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

    return {
        data: Array.from(map.values()),
        pagination: {
            page,
            limit,
            totalRecords,
            totalPages
        }
    };
}

/**
 * Lấy danh sách thiết bị chưa được gán phần cứng (cho chức năng Create).
 * Sử dụng SP: sp_DeviceHardwareUnits_GetDevicesWithoutHardware
 */
export async function getDevicesWithoutHardware(includeId = null) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('pIncludeId', sql.Int, includeId || null)
        .execute('sp_DeviceHardwareUnits_GetDevicesWithoutHardware');

    return result.recordset;
}

/**
 * Lấy danh sách các đơn vị phần cứng có thể gán (chưa được gán cho thiết bị nào).
 * Sử dụng SP: sp_DeviceHardwareUnits_GetForCreate
 */
export async function getHardwareUnitsForCreate() {
    const pool = await poolPromise;
    const result = await pool.request()
        .execute('sp_DeviceHardwareUnits_GetForCreate');
    
    return result.recordset;
}

/**
 * Lấy danh sách các đơn vị phần cứng cho chức năng Edit (cho phép bao gồm các ID đã gán cho thiết bị hiện tại).
 * Sử dụng SP: sp_DeviceHardwareUnits_GetForEdit
 */
export async function getHardwareUnitsForEdit(deviceId, includeIds = []) {
    const pool = await poolPromise;
    
    // Chuyển mảng ID thành chuỗi '1,5,10' để truyền vào SP
    // Nếu mảng rỗng, truyền NULL
    const includeIdsString = includeIds.length > 0 ? includeIds.join(',') : null;
    
    const result = await pool.request()
        .input('pDeviceId', sql.Int, deviceId)
        .input('pIncludeIds', sql.VarChar(sql.MAX), includeIdsString)
        .execute('sp_DeviceHardwareUnits_GetForEdit');

    return result.recordset;
}

/**
 * Lấy danh sách các đơn vị phần cứng ĐÃ GÁN cho một thiết bị cụ thể.
 * Sử dụng SP: sp_DeviceHardwareUnits_GetAssigned
 */
export async function getDeviceHardwareAssigned(deviceId) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('pDeviceId', sql.Int, deviceId)
        .execute('sp_DeviceHardwareUnits_GetAssigned');
        
    // Trả về { assigned: [...] } để giữ nguyên cấu trúc cũ của hàm này
    return { assigned: result.recordset };
}

/**
 * Cập nhật danh sách các đơn vị phần cứng được gán cho một thiết bị (DELETE cũ, INSERT mới - trong Transaction).
 * Sử dụng SP: sp_DeviceHardwareUnits_UpdateAssigned
 */
export async function updateDeviceHardwareAssigned(deviceId, hardwareUnitIds = []) {
    const pool = await poolPromise;
    
    // Chuyển mảng ID thành chuỗi '1,5,10' để truyền vào SP
    // Nếu mảng rỗng, truyền NULL để SP chỉ thực hiện DELETE
    const hardwareUnitIdsString = hardwareUnitIds.length > 0 ? hardwareUnitIds.join(',') : null;

    await pool.request()
        .input('pDeviceId', sql.Int, deviceId)
        .input('pHardwareUnitIds', sql.VarChar(sql.MAX), hardwareUnitIdsString)
        .execute('sp_DeviceHardwareUnits_UpdateAssigned');
}

/**
 * Gỡ bỏ liên kết một đơn vị phần cứng cụ thể khỏi một thiết bị.
 * Sử dụng SP: sp_DeviceHardwareUnits_Detach
 */
export async function detachDeviceHardwareUnit(deviceId, hardwareUnitId) {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('pDeviceId', sql.Int, deviceId)
            .input('pHardwareUnitId', sql.Int, hardwareUnitId)
            .execute('sp_DeviceHardwareUnits_Detach');

        return { success: true, message: 'Xóa thành công' };
    } catch (error) {
        // CHỈNH SỬA TẠI ĐÂY:
        // Nếu lỗi đến từ lệnh THROW trong SP, message sẽ nằm trong error.message
        console.error('SQL Error:', error);
        return { 
            success: false, 
            message: error.message || 'Có lỗi xảy ra khi xóa dữ liệu' 
        };
    }
}