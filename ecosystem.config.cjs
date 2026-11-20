// ecosystem.config.cjs — Cấu hình PM2 (chế độ fork, 1 tiến trình cho IIS ARR)
// Lưu ý bảo mật (PROJECT-RULES.md Mục 4.1):
// TUYỆT ĐỐI KHÔNG ghi IP máy chủ, tên tài khoản hay mật khẩu SQL Server vào file này.
// Toàn bộ thông tin kết nối DB và SESSION_SECRET được đọc tự động từ file .env trên máy chủ.

module.exports = {
  apps: [
    {
      name: "QuanLyThietBiCNTT",
      script: "./index.js", // Khi Cutover sang v3.0 (Phase 8) sẽ đổi thành "./server/src/server.js"
      exec_mode: "fork",
      instances: 1, // Chỉ chạy 1 instance vì dùng IIS ARR & Touch Throttling Session
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        APP_BASE_PATH: "/QuanLyThietBiCNTT",
        App_Base_Path: "/QuanLyThietBiCNTT"
      }
    }
  ]
};
