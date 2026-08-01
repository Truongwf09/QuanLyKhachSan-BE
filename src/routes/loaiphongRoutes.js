const upload = require("../middleware/uploadMiddleware");

const router = require("express").Router();

const c = require("../controller/loaiphongController");

const { verifyToken } = require("../middleware/authMiddleware");

const { checkPermission } = require("../middleware/permissionMiddleware");

router.get("/public", c.getPublic);

router.get("/filter", c.getByChiNhanh);
router.get("/public/:id", c.getById);

router.get("/:maLoai/phongs", c.getRoomsByType);

// ==================== ADMIN / STAFF ====================

// Xem loại phòng
router.get("/", verifyToken, checkPermission("LOAIPHONG_VIEW"), c.getAll);

// Thêm loại phòng
router.post(
  "/",
  verifyToken,
  checkPermission("LOAIPHONG_CREATE"),
  upload.single("HinhAnh"),
  c.create,
);

router.put(
  "/:id/hide",
  verifyToken,
  checkPermission("LOAIPHONG_UPDATE"),
  c.hide,
);

router.put(
  "/:id/show",
  verifyToken,
  checkPermission("LOAIPHONG_UPDATE"),
  c.show,
);
// Sửa loại phòng
router.put(
  "/:id",
  verifyToken,
  checkPermission("LOAIPHONG_UPDATE"),
  upload.single("HinhAnh"),
  c.update,
);

// Xóa loại phòng
router.delete(
  "/:id",
  verifyToken,
  checkPermission("LOAIPHONG_DELETE"),
  c.remove,
);

module.exports = router;
