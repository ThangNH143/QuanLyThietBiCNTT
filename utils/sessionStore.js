import { Store } from 'express-session';
// Đảm bảo đường dẫn này đúng với vị trí file db.js của bạn
import { poolPromise, sql } from '../db/db.js'; 

class MSSQLStore extends Store {
    constructor() {
        super();
        this.pool = poolPromise;
        this.sql = sql;
        this.tableName = 'Sessions';
        this.initialize();
    }

    // 1. Khởi tạo và tạo bảng Sessions nếu chưa có
    async initialize() {
        try {
            const pool = await this.pool;
            // Dùng pool.request().query() để chạy lệnh tạo bảng
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${this.tableName}' and xtype='U')
                CREATE TABLE ${this.tableName} (
                    sid VARCHAR(255) NOT NULL PRIMARY KEY,
                    sess NVARCHAR(MAX) NOT NULL,
                    expire DATETIME NOT NULL
                );
            `);
            console.log(`[Session Store] Bảng '${this.tableName}' đã sẵn sàng.`);
        } catch (err) {
            console.error('[Session Store] Lỗi khởi tạo bảng Sessions:', err);
            // Quan trọng: Ném lỗi nếu không thể khởi tạo DB
            throw err;
        }
    }

    // 2. Lấy Session theo sid (GET)
    async get(sid, callback) {
        try {
            const pool = await this.pool;
            // Sử dụng input() để tham số hóa (chống SQL Injection)
            const result = await pool.request()
                .input('sid', this.sql.VarChar(255), sid)
                .query(`SELECT sess FROM ${this.tableName} WHERE sid = @sid AND expire > GETDATE()`);
            
            if (result.recordset.length) {
                // Parse session data từ NVARCHAR(MAX)
                const sessionData = JSON.parse(result.recordset[0].sess);
                callback(null, sessionData);
            } else {
                callback(null, null);
            }
        } catch (err) {
            callback(err);
        }
    }

    // 3. Lưu hoặc Cập nhật Session (SET)
    async set(sid, session, callback) {
        try {
            const pool = await this.pool;
            const sessString = JSON.stringify(session);
            
            // Tính thời gian hết hạn dựa trên cookie maxAge (hoặc 1 giờ nếu thiếu)
            const maxAgeMs = session.cookie.maxAge || 60 * 60 * 1000; 
            const expireDate = new Date(Date.now() + maxAgeMs);

            // Sử dụng MERGE để INSERT hoặc UPDATE
            await pool.request()
                .input('sid', this.sql.VarChar(255), sid)
                .input('sess', this.sql.NVarChar(this.sql.MAX), sessString) // Lưu ý: dùng NVarChar(MAX)
                .input('expire', this.sql.DateTime, expireDate)
                .query(`
                    MERGE ${this.tableName} AS Target
                    USING (VALUES (@sid)) AS Source (sid)
                    ON (Target.sid = Source.sid)
                    WHEN MATCHED THEN 
                        UPDATE SET Target.sess = @sess, Target.expire = @expire
                    WHEN NOT MATCHED THEN 
                        INSERT (sid, sess, expire) VALUES (@sid, @sess, @expire);
                `);
            callback(null);
        } catch (err) {
            callback(err);
        }
    }

    // 4. Hủy Session (DESTROY)
    async destroy(sid, callback) {
        try {
            const pool = await this.pool;
            await pool.request()
                .input('sid', this.sql.VarChar(255), sid)
                .query(`DELETE FROM ${this.tableName} WHERE sid = @sid`);
            callback(null);
        } catch (err) {
            callback(err);
        }
    }
    
    // 5. Cập nhật thời gian hết hạn (TOUCH)
    async touch(sid, session, callback) {
        try {
            const pool = await this.pool;
            const maxAgeMs = session.cookie.maxAge || 60 * 60 * 1000;
            const expireDate = new Date(Date.now() + maxAgeMs);
            
            await pool.request()
                .input('sid', this.sql.VarChar(255), sid)
                .input('expire', this.sql.DateTime, expireDate)
                .query(`UPDATE ${this.tableName} SET expire = @expire WHERE sid = @sid`);
            callback(null);
        } catch (err) {
            callback(err);
        }
    }
}

export default MSSQLStore;