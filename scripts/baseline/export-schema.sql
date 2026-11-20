/*
  scripts/baseline/export-schema.sql
  Mục đích: Xuất toàn bộ cấu trúc CSDL hiện hành (chỉ đọc — KHÔNG sửa dữ liệu/DDL).
  Cách dùng: Chạy trên DB DEV (QuanLyThietBiCNTT_DEV) bằng SSMS / sqlcmd và lưu từng resultset vào db/sql/baseline/.
*/

SET NOCOUNT ON;

-- 01. Phiên bản SQL Server & Compatibility Level
SELECT
    @@VERSION AS fullVersion,
    CAST(SERVERPROPERTY('ProductVersion') AS NVARCHAR(100)) AS productVersion,
    CAST(SERVERPROPERTY('ProductMajorVersion') AS NVARCHAR(50)) AS majorVersion,
    CAST(SERVERPROPERTY('Edition') AS NVARCHAR(100)) AS edition,
    DB_NAME() AS dbName,
    d.compatibility_level AS compatibilityLevel,
    d.collation_name AS collationName
FROM sys.databases d
WHERE d.name = DB_NAME();

-- 02. Danh sách bảng & cột chi tiết
SELECT
    t.name AS tableName,
    c.column_id AS columnId,
    c.name AS columnName,
    ty.name AS dataType,
    c.max_length AS maxLengthBytes,
    c.precision,
    c.scale,
    c.is_nullable AS isNullable,
    c.is_identity AS isIdentity,
    dc.name AS defaultConstraintName,
    dc.definition AS defaultDefinition
FROM sys.tables t
JOIN sys.columns c ON t.object_id = c.object_id
JOIN sys.types ty ON c.user_type_id = ty.user_type_id
LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
ORDER BY t.name, c.column_id;

-- 03. Khóa chính (Primary Keys) & Ràng buộc duy nhất (Unique Constraints)
SELECT
    t.name AS tableName,
    kc.name AS constraintName,
    kc.type_desc AS constraintType,
    STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS columns
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
GROUP BY t.name, kc.name, kc.type_desc
ORDER BY t.name, kc.type_desc, kc.name;

-- 04. Khóa ngoại (Foreign Keys)
SELECT
    fk.name AS fkName,
    tp.name AS parentTable,
    cp.name AS parentColumn,
    tr.name AS refTable,
    cr.name AS refColumn,
    fk.delete_referential_action_desc AS onDelete,
    fk.update_referential_action_desc AS onUpdate
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
ORDER BY tp.name, fk.name;

-- 05. Toàn bộ Indexes (kèm filter_definition nếu là Filtered Index)
SELECT
    t.name AS tableName,
    i.name AS indexName,
    i.type_desc AS indexType,
    i.is_primary_key AS isPrimaryKey,
    i.is_unique AS isUnique,
    i.has_filter AS hasFilter,
    i.filter_definition AS filterDefinition,
    STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS columns
FROM sys.indexes i
JOIN sys.tables t ON i.object_id = t.object_id
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.name IS NOT NULL
GROUP BY t.name, i.name, i.type_desc, i.is_primary_key, i.is_unique, i.has_filter, i.filter_definition
ORDER BY t.name, i.name;

-- 06. Số dòng từng bảng (mốc đối chiếu NFR-06)
SELECT
    t.name AS tableName,
    SUM(p.rows) AS rowCountVal
FROM sys.tables t
JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
GROUP BY t.name
ORDER BY t.name;

-- 07. Danh sách Stored Procedures & tùy chọn SET (ANSI_NULLS / QUOTED_IDENTIFIER)
SELECT
    SCHEMA_NAME(p.schema_id) AS schemaName,
    p.name AS procName,
    p.create_date AS createdAt,
    p.modify_date AS modifiedAt,
    m.uses_ansi_nulls AS usesAnsiNulls,
    m.uses_quoted_identifier AS usesQuotedIdentifier
FROM sys.procedures p
JOIN sys.sql_modules m ON p.object_id = m.object_id
ORDER BY p.name;

-- 08. Định nghĩa chi tiết toàn bộ Stored Procedures (lưu xuất ra db/sql/baseline/procedures/)
SELECT
    p.name AS procName,
    m.definition AS procDefinition
FROM sys.procedures p
JOIN sys.sql_modules m ON p.object_id = m.object_id
ORDER BY p.name;

-- 09. Danh sách Views, Triggers, User-Defined Table Types (nếu có)
SELECT 'VIEW' AS objType, name FROM sys.views
UNION ALL
SELECT 'TRIGGER' AS objType, name FROM sys.triggers
UNION ALL
SELECT 'TABLE_TYPE' AS objType, name FROM sys.table_types
ORDER BY objType, name;
