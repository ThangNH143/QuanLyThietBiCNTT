// ecosystem.config.js

module.exports = {
  apps : [{
    name   : "QuanLyThietBiCNTT",
    script : "./index.js",
    exec_mode: "fork",
    instances: 1,// Chỉ cần 1 instance vì dùng IIS ARR
    watch: false,// Tắt watch trong môi trường production
    
    // Khai báo biến môi trường cho PM2
    env: {
      "NODE_ENV": "production",
      "PORT": 3000,
      "App_Base_Path": "/QuanLyThietBiCNTT",
      
      // CẤU HÌNH DB MỚI (KHÔNG CẦN BACKSLASH)
      "DB_HOST": "localhost",// Tên server (hoặc IP)
      "DB_PORT": "1433",// THAY THẾ bằng port Tĩnh hoặc Động bạn tìm thấy
      "DB_USER": "sa",
      "DB_PASSWORD": "Cntt!p@ss",
      "DB_DATABASE": "QuanLyThietBiCNTT"
    }
  }]
};