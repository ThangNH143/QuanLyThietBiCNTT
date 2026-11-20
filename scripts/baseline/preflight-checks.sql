/*
  scripts/baseline/preflight-checks.sql
  Mục đích: Kiểm tra chất lượng dữ liệu & ràng buộc trước khi chạy migration Phase 1 (chỉ đọc — KHÔNG sửa dữ liệu).
  Cách dùng: Chạy trên DB DEV (QuanLyThietBiCNTT_DEV), lưu kết quả đối chiếu với docs/AS-IS-BASELINE.md mục 2.3.
*/

SET NOCOUNT ON;

-- 01. Phiên bản SQL Server & Compatibility Level (yêu cầu >= 130 cho CREATE OR ALTER, >= 140 cho STRING_AGG)
SELECT
    CAST(SERVERPROPERTY('ProductVersion') AS NVARCHAR(100)) AS productVersion,
    CAST(SERVERPROPERTY('Edition') AS NVARCHAR(100)) AS edition,
    DB_NAME() AS dbName,
    (SELECT compatibility_level FROM sys.databases WHERE name = DB_NAME()) AS compatibilityLevel;

-- 02. Số dòng bảng lõi (đối chiếu NFR-06 trước/sau migration)
SELECT t.name AS tableName, SUM(p.rows) AS rowCountVal
FROM sys.tables t
JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
GROUP BY t.name
ORDER BY t.name;

-- 03. Kiểm tra trùng bàn giao active trên cùng 1 thiết bị (kỳ vọng: 0 dòng)
SELECT deviceId, COUNT(*) AS activeAssignmentCount
FROM dbo.DeviceAssignments
WHERE endDate IS NULL AND isInactive = 0
GROUP BY deviceId
HAVING COUNT(*) > 1;

-- 03b. Kiểm tra bàn giao có ngày thu hồi nhỏ hơn ngày bắt đầu (kỳ vọng: 0 dòng)
SELECT id, deviceId, deptId, startDate, endDate
FROM dbo.DeviceAssignments
WHERE endDate IS NOT NULL AND endDate < startDate;

-- 03c. Kiểm tra tính nhất quán giữa endDate và isInactive trong DeviceAssignments
SELECT
    SUM(CASE WHEN endDate IS NULL AND isInactive = 0 THEN 1 ELSE 0 END) AS activeClean,
    SUM(CASE WHEN endDate IS NULL AND isInactive = 1 THEN 1 ELSE 0 END) AS endNullButInactive,
    SUM(CASE WHEN endDate IS NOT NULL AND isInactive = 0 THEN 1 ELSE 0 END) AS endSetButActive,
    SUM(CASE WHEN endDate IS NOT NULL AND isInactive = 1 THEN 1 ELSE 0 END) AS revokedClean
FROM dbo.DeviceAssignments;

-- 04. Giá trị trạng thái thực tế trong Repairs (chốt CHECK constraint)
SELECT status, isInactive, COUNT(*) AS cnt
FROM dbo.Repairs
GROUP BY status, isInactive;

-- 05. Kiểm tra chất lượng dữ liệu HardwareUnits (Serial, warrantyDate rác 1900-01-01, độ dài mã)
SELECT
    COUNT(*) AS totalUnits,
    SUM(CASE WHEN serialNumber IS NULL OR LTRIM(RTRIM(serialNumber)) = '' THEN 1 ELSE 0 END) AS emptySerial,
    SUM(CASE WHEN code = serialNumber THEN 1 ELSE 0 END) AS codeEqualsSerial,
    SUM(CASE WHEN warrantyDate = '1900-01-01' THEN 1 ELSE 0 END) AS warranty1900Junk,
    SUM(CASE WHEN warrantyDate IS NOT NULL AND warrantyDate <> '1900-01-01' THEN 1 ELSE 0 END) AS warrantyReal,
    MAX(LEN(code)) AS maxUnitCodeLen,
    MAX(LEN(serialNumber)) AS maxSerialLen
FROM dbo.HardwareUnits;

-- 05b. Kiểm tra trùng Serial Number (kỳ vọng: 0 dòng)
SELECT serialNumber, COUNT(*) AS cnt
FROM dbo.HardwareUnits
WHERE serialNumber IS NOT NULL AND LTRIM(RTRIM(serialNumber)) <> ''
GROUP BY serialNumber
HAVING COUNT(*) > 1;

-- 05c. Độ dài lớn nhất của cột code ở các bảng chính
SELECT
    (SELECT MAX(LEN(code)) FROM dbo.Devices) AS maxDeviceCodeLen,
    (SELECT MAX(LEN(code)) FROM dbo.Hardwares) AS maxHardwareCodeLen,
    (SELECT MAX(LEN(code)) FROM dbo.Departments) AS maxDeptCodeLen,
    (SELECT MAX(LEN(code)) FROM dbo.DeviceTypes) AS maxDeviceTypeCodeLen;

-- 06a. Kiểm tra trùng hardwareUnitId đang active trong Devices_HardwareUnits (kỳ vọng: 0 dòng)
SELECT hardwareUnitId, COUNT(*) AS cnt
FROM dbo.Devices_HardwareUnits
WHERE isInactive = 0
GROUP BY hardwareUnitId
HAVING COUNT(*) > 1;

-- 06b. Thống kê liên kết active / inactive trong Devices_HardwareUnits
SELECT
    COUNT(*) AS totalLinks,
    SUM(CASE WHEN isInactive = 0 THEN 1 ELSE 0 END) AS activeLinks,
    SUM(CASE WHEN isInactive = 1 THEN 1 ELSE 0 END) AS inactiveLinks
FROM dbo.Devices_HardwareUnits;

-- 06c. Kiểm tra bản ghi mồ côi trong Devices_HardwareUnits (kỳ vọng: 0 dòng)
SELECT dh.id, dh.deviceId, dh.hardwareUnitId
FROM dbo.Devices_HardwareUnits dh
LEFT JOIN dbo.Devices d ON d.id = dh.deviceId
LEFT JOIN dbo.HardwareUnits hu ON hu.id = dh.hardwareUnitId
WHERE d.id IS NULL OR hu.id IS NULL;

-- 07. Số phiếu sửa chữa có hardwareUnitId (phục vụ kiểm tra backfill sang RepairHardwareUnits)
SELECT COUNT(*) AS repairsWithHardwareUnit
FROM dbo.Repairs
WHERE hardwareUnitId IS NOT NULL;

-- 08. Kiểm tra loại thiết bị Máy In (code = 'IN') và phòng CNTT (code = 'PCNTT' / id = 295)
SELECT id, code, name, isInactive FROM dbo.DeviceTypes ORDER BY id;
SELECT id, code, name, isInactive FROM dbo.Departments WHERE id = 295 OR code = 'PCNTT';

-- 09a. Tên chính xác các Unique Constraint hiện hữu (để DROP theo đúng catalog trong migration)
SELECT
    t.name AS tableName,
    kc.name AS constraintName,
    c.name AS columnName
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE kc.type = 'UQ'
ORDER BY t.name, kc.name;

-- 10. Kiểm tra bảng Sessions (số dòng hết hạn đang tích tụ)
SELECT
    COUNT(*) AS totalSessions,
    SUM(CASE WHEN expire > GETDATE() THEN 1 ELSE 0 END) AS activeSessions,
    SUM(CASE WHEN expire <= GETDATE() THEN 1 ELSE 0 END) AS expiredSessions
FROM dbo.Sessions;

-- 11. Đối tượng tham chiếu bảng DeviceHardwareUnits (không tồn tại — tên bảng thật là Devices_HardwareUnits)
SELECT p.name AS brokenProcName
FROM sys.procedures p
JOIN sys.sql_modules m ON p.object_id = m.object_id
WHERE m.definition LIKE '%DeviceHardwareUnits%'
  AND m.definition NOT LIKE '%Devices_HardwareUnits%'
ORDER BY p.name;

-- 12. Ứng viên SP backup / không còn dùng (chỉ để thống kê, KHÔNG tự xóa trước Phase 8)
SELECT p.name AS candidateLegacyProc
FROM sys.procedures p
WHERE p.name LIKE '%2025%' OR p.name LIKE '%2026%' OR p.name LIKE '%BK%'
ORDER BY p.name;

-- 13. Kiểm tra SP có QUOTED_IDENTIFIER OFF hoặc ANSI_NULLS OFF (kỳ vọng: 0 dòng)
SELECT p.name AS procName, m.uses_quoted_identifier, m.uses_ansi_nulls
FROM sys.procedures p
JOIN sys.sql_modules m ON p.object_id = m.object_id
WHERE m.uses_quoted_identifier = 0 OR m.uses_ansi_nulls = 0
ORDER BY p.name;

-- 14. Liệt kê mọi SP/View đọc hoặc ghi bảng Devices_HardwareUnits để xác nhận đã lọc isInactive = 0
SELECT
    OBJECT_NAME(m.object_id) AS objectName,
    o.type_desc AS objectType,
    CASE WHEN m.definition LIKE '%isInactive%' THEN 1 ELSE 0 END AS mentionsIsInactive
FROM sys.sql_modules m
JOIN sys.objects o ON m.object_id = o.object_id
WHERE m.definition LIKE '%Devices_HardwareUnits%'
ORDER BY OBJECT_NAME(m.object_id);
