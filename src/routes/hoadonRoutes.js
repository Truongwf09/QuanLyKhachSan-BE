const router = require("express").Router();
const c = require("../controller/hoadonController");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/permissionMiddleware");
router.get("/", verifyToken, c.getAll);

router.get("/thongke/tong", verifyToken, c.thongKeTongDoanhThu);
router.get("/thongke/chinhanh", verifyToken, c.thongKeTheoChiNhanh);
router.get("/thongke/ngay", verifyToken, c.thongKeNgay);
router.get("/thongke/thang", verifyToken, c.thongKeThang);
router.get("/thongke/nam", verifyToken, c.thongKeNam);
router.post(
  "/:MaHD/collect",
  verifyToken,
  checkPermission("HOADON_UPDATE"),
  c.collectMoney,
);
router.get("/:id", verifyToken, c.getById);
router.post("/:id/service", verifyToken, c.addService);
module.exports = router;
