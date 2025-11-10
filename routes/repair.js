// routes/repairRoutes.js
import express from 'express';
import {
  getRepairsList,
  getRepairDetail,
  createRepairRecord,
  updateRepairRecord,
  deleteRepairRecord,
  getAvailableDevices,
  getAvailableHardwareUnits,
  getUsersForRepair
} from '../controllers/repairController.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('repairs/index'); // ✅ render đúng file views/repairs/index.ejs
});

// 📋 Danh sách sửa chữa
router.get('/ajax', getRepairsList);

// 🔍 Chi tiết sửa chữa
router.get('/:id', getRepairDetail);

// ➕ Tạo mới
router.post('/', createRepairRecord);

// ✏️ Cập nhật
router.put('/:id', updateRepairRecord);

// ❌ Xóa
router.delete('/:id', deleteRepairRecord);

// 🔄 Dropdown hỗ trợ
router.get('/dropdown/devices', getAvailableDevices); // Thiết bị chưa bị sửa
router.get('/dropdown/hardware-units', getAvailableHardwareUnits); // Phần cứng theo thiết bị
router.get('/dropdown/users', getUsersForRepair); // Người gửi / người thực hiện

export default router;
