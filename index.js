import express from 'express';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import 'dotenv/config';
// import ConnectMSSQL from 'connect-mssql';
// Import Session Store tuỳ chỉnh mới
import MSSQLStore from './utils/sessionStore.js'; 

import deviceRoutes from './routes/device.js';
import departmentRoutes from './routes/department.js';
import deviceTypeRoutes from './routes/deviceType.js';
import hardwareTypeRoutes from './routes/hardwareType.js';
import hardwareRoutes from './routes/hardware.js';
import hardwareUnitRoutes from './routes/hardwareUnit.js';
import assignmentRoutes from './routes/assignment.js';
import repairRoutes from './routes/repair.js';
import deviceHardwareRoutes  from './routes/deviceHardwareUnit.js';

const app = express();
const PORT = 3000;

//Đọc biến môi trường cho base path
//Nếu biến môi trường không tồn tại, mặc định chuỗi rỗng (cho môi trường phát triển/gốc)
const App_Base_Path = process.env.App_Base_Path || '';
// Khởi tạo Session Store mới
const sessionStore = new MSSQLStore();

// const MSSQLStore = ConnectMSSQL(session);

// const sessionDbConfig = {
//   user: process.env.DB_USER, 
//   password: process.env.DB_PASSWORD, 
//   server: process.env.DB_HOST, 
//   port: parseInt(process.env.DB_PORT, 10), // <-- THÊM PORT VÀ PARSE INTEGER
//   database: process.env.DB_DATABASE,
//   options: {
//     // Tùy chọn quan trọng nếu bạn đang dùng SQL Server Local hoặc Self-signed Certificate
//     trustServerCertificate: true, 
//     enableArithAbort: true,
//         // Dòng này cần phải khớp với DB_ENCRYPT
//     encrypt: process.env.DB_ENCRYPT === 'true'
//   },
// };

// const sessionStore = new MSSQLStore({
//   config: sessionDbConfig,
//   table: 'Sessions', // Tên bảng sẽ được tạo tự động trong DB của bạn
//   ttl: 60 * 60 * 1000, // Time-to-live: Session tồn tại 1 giờ (60 phút * 60 giây * 1000 ms)
//   autoRemove: true
// });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware & config
// index.js (Khoảng dòng 30)
app.use((req,res,next) => {
  res.locals.basePath = App_Base_Path; //Gán res.locals để có thể truy cập trong EJS

  // THÊM LOGIC XỬ LÝ URL BASE PATH
  if (App_Base_Path && req.url.startsWith(App_Base_Path)) {
      // Loại bỏ tiền tố App_Base_Path khỏi req.url để Express tìm thấy route
      req.url = req.url.substring(App_Base_Path.length);
      // Nếu URL trở thành rỗng (""), đặt lại thành "/"
      if (req.url === "") {
          req.url = "/";
      }
  }
  next();
});

app.use((req, res, next) => {
  console.log('--- Comprehensive Request Log ---');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Method: ${req.method}`);
  console.log(`Original URL (req.originalUrl): ${req.originalUrl}`); // URL gốc trước khi được Express xử lý
  console.log(`Path (req.path): ${req.path}`);                           // Đường dẫn đã được chuẩn hóa bởi Express
  console.log(`URL (req.url): ${req.url}`);                             // Đường dẫn được gửi bởi client (hoặc proxy)
  console.log('Headers:');
  for (const header in req.headers) {
      console.log(`  ${header}: ${req.headers[header]}`);
  }
  console.log('--- End Comprehensive Request Log ---');
  next(); // Chuyển quyền điều khiển sang middleware/route tiếp theo
});
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method')); // đọc từ query hoặc input
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'bv!kCntt13579', // Nên thay thế bằng chuỗi ngẫu nhiên dài và phức tạp hơn
  resave: false, 
  saveUninitialized: true,
  store: sessionStore, // <--- Dùng Session Store mới
  cookie: { 
      secure: 'auto', // Tự động bật Secure Cookie nếu kết nối là HTTPS
      maxAge: 60 * 60 * 1000 // Tương tự ttl (1 giờ)
    }
  }));


// Gắn các route tương ứng
app.use('/devices', deviceRoutes);
app.use('/departments', departmentRoutes);
app.use('/device-types', deviceTypeRoutes);
app.use('/hardware-types', hardwareTypeRoutes);
app.use('/hardwares', hardwareRoutes);
app.use('/hardware-units', hardwareUnitRoutes);
app.use('/assignments', assignmentRoutes);
app.use('/repairs', repairRoutes);
app.use('/device-hardware',deviceHardwareRoutes);

app.get('/', (req, res) => {
  res.render('home'); 
});

app.use((req, res, next) => {
  res.status(404).send('Sorry, that route doesn\'t exist!');
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
  console.log(`Base Path for this environment: ${App_Base_Path}`);
});