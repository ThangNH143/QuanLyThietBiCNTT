---
name: qltb-mssql-sp-migration
description: >-
  Use when creating, modifying, or debugging SQL Server 2019 migrations
  (db/sql/migrations/Vnnn__*.sql), Stored Procedures or Views (db/sql/procedures/*.sql),
  SQL tests (db/tests/*.test.sql), or inspecting DEV database schema/SP definitions
  for QuanLyThietBiCNTT v3.0 (Core Platform + ITAM + Future Hospital WebApps).
---

# QLTB SQL Server 2019 & Stored Procedure Guide (v3.0)

> **Reference:** [DATA-SCHEMA.md](../../../docs/DATA-SCHEMA.md), [AS-IS-BASELINE.md](../../../docs/AS-IS-BASELINE.md), and [PROJECT-RULES.md](../../../docs/PROJECT-RULES.md) (Mục 0, 3, 12.3).

## Hard Safety Rules (NEVER Violate)
1. **DEV ONLY:** NEVER run DDL or DML on Production `QuanLyThietBiCNTT`. Every migration and test runs ONLY on `QuanLyThietBiCNTT_DEV` via `scripts/migrate.js` (guard rejects non-`_DEV` targets without `--prod --backup-confirmed`).
2. **Zero Guessing on Schema/SP:** Before writing or changing ANY SQL or calling ANY SP from `server/`, verify exact table columns, constraints, indexes, and SP body by reading `db/sql/` or running read-only `SELECT` on DEV (`sys.columns`, `sys.procedures`, `sys.sql_modules`, `sys.indexes`, `sys.foreign_keys`, `sys.check_constraints`).
3. **Immutable Migrations:** NEVER edit a `Vnnn__*.sql` file already recorded in `dbo.SchemaVersions` (SHA-256 mismatch). Create `V(n+1)__*.sql` instead.
4. **No Hardcoded IDs/Thresholds:** Use `DeviceTypes.isPrinter` (NEVER hardcode `deviceTypeId = 1`) and `dbo.SystemSettings` (`it_department_code = 'PCNTT'`, default signers, warranty/refill thresholds — NEVER hardcode `deptId = 295`).
5. **Multi-WebApp Platform Discipline:**
   - Core shared tables (`Departments`, `Users`, `Sessions`, `Accounts`, `AuditLogs` with `appCode`, `SystemSettings` with `appCode`, `SchemaVersions`) serve all Hospital WebApps.
   - Future WebApps MUST use a dedicated SQL schema (e.g., `CREATE SCHEMA helpdesk;`) or separate database — NEVER mix unrelated app tables into ITAM tables in `dbo`.

## Migration Rules (`db/sql/migrations/Vnnn__<snake_case>.sql`)
- Every DDL block must be **idempotent** (`IF OBJECT_ID(...) IS NULL`, `IF COL_LENGTH(...) IS NULL`, `IF NOT EXISTS (SELECT 1 FROM sys.indexes ...)`).
- Look up existing unnamed/system constraint names dynamically from `sys.key_constraints` / `sys.indexes` before dropping.
- Follow **Expand → Migrate → Verify → Contract**: never drop/rename live columns in a single step while code still uses them.
- **No `ON DELETE CASCADE`** on any foreign key. Child cleanup must happen explicitly inside the deleting SP transaction.

## Stored Procedure Rules (`db/sql/procedures/<2-digit>_sp_<group>.sql`)
1. **Mandatory Header & Body Wrapper:**
   ```sql
   SET ANSI_NULLS ON;
   SET QUOTED_IDENTIFIER ON;
   GO
   CREATE OR ALTER PROCEDURE dbo.sp_<Entity>_<Action>
       -- New optional params ALWAYS at the end with defaults (= NULL / = 0)
   AS
   BEGIN
       SET NOCOUNT ON;
       SET XACT_ABORT ON;
       ...
   END
   GO
   ```
2. **Compatibility & Naming:**
   - New SPs: `sp_<Entity>_GetPaged / _GetById / _GetDropdown / _Create / _Update / _ToggleStatus / _Delete / _Cancel / _Transfer`.
   - Keep Phase 1 backward-compatible with legacy EJS code (`pre-v3.0`): keep existing SP names, param positions, and recordset order; append new `SELECT` columns at the end; skip `rowVersion` check when `@pRowVersion IS NULL`.
   - Paginated new/standardized SPs return `recordsets[0] = data`, `recordsets[1] = [{ totalItems }]`.
3. **Transactions, Errors & Concurrency:**
   - Multi-table writes: `BEGIN TRY ... BEGIN TRANSACTION ... COMMIT ... END TRY BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK; THROW; END CATCH`.
   - Standard `THROW` codes: `50001` (400 Validation), `50004` (404 Not Found), `50009` (409 Business Rule), `50010` (409 Concurrent Modification).
   - List parameters: use TVPs (`tt_IdList`, `tt_HardwareItem`, `tt_SupplyQty`) — **NEVER Dynamic SQL**.
   - Date ranges: `col >= @pStart AND col < DATEADD(DAY, 1, @pEnd)`.
   - Printer stock: relative update `stockQuantity = stockQuantity + @delta` + 1 ledger row in `PrinterStockMovements` inside the same transaction; soft-cancel via `*_Cancel`.
   - Sequence/code generation: guard with `WITH (UPDLOCK, HOLDLOCK)`.
   - `qltb_app` login permissions: only `EXECUTE` on `dbo` + CRUD on `dbo.Sessions` (no DDL at runtime).

## Mandatory Verification Checklist
1. Run `node scripts/migrate.js` **twice in a row** on `QuanLyThietBiCNTT_DEV` — second run must skip already-applied migrations cleanly.
2. Run `db/tests/<group>.test.sql` wrapped in `BEGIN TRANSACTION ... ROLLBACK` testing both happy paths and error paths (`50001`, `50004`, `50009`, `50010`).
3. Verify `rowCounts` before/after on existing tables (zero unexpected data loss — `NFR-06`).
4. Paste verbatim stdout/exit code into the Task Acceptance Evidence report.
