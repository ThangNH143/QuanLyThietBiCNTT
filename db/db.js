import sql from 'mssql';
import 'dotenv/config'; 

// Lấy biến môi trường và đảm bảo không có khoảng trắng thừa (.trim())
// Cần sử dụng DB_HOST thay vì DB_SERVER
const DB_HOST = process.env.DB_HOST ;
const DB_PORT = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;
const DB_ENCRYPT = process.env.DB_ENCRYPT; // Lấy giá trị chuỗi 'true' hoặc 'false'

const config = {
 user: DB_USER,
 password: DB_PASSWORD,
 server: DB_HOST, // Đã sửa: dùng DB_HOST
 port: parseInt(DB_PORT, 10), // Đã thêm: dùng DB_PORT và chuyển sang kiểu số
 database: DB_DATABASE,
 options: {
   trustServerCertificate: true,
   enableArithAbort: true,
   encrypt: DB_ENCRYPT === 'true' // Đảm bảo chuyển đổi boolean chính xác
  },
 pool: {
   max: 10,
   min: 0,
   idleTimeoutMillis: 30000
 }
};

const poolPromise = new sql.ConnectionPool(config)
 .connect()
 .then(pool => {
   console.log('✅ Kết nối SQL Server thành công');
   return pool;
  })
 .catch(error => {
   console.error('❌ Lỗi kết nối SQL Server:', error);
   // Sau khi log lỗi, cần ném (throw) lỗi ra để đảm bảo promise bị reject
   throw error; 
 });

export { sql, poolPromise };
