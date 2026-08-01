const router = require("express").Router();

const controller = require("../controller/dichvuController");

const { verifyToken } = require("../middleware/authMiddleware");

const { checkPermission } = require("../middleware/permissionMiddleware");

// Public - Khách xem dịch vụ theo chi nhánh
router.get("/public", controller.getPublic);
router.get(
  "/active",
  verifyToken,
  checkPermission("DICHVU_VIEW"),
  controller.getActive,
);

// Xem danh sách dịch vụ
router.get("/", verifyToken, checkPermission("DICHVU_VIEW"), controller.getAll);

// Xem chi tiết dịch vụ
router.get(
  "/:id",
  verifyToken,
  checkPermission("DICHVU_VIEW"),
  controller.getById,
);

// Thêm dịch vụ
router.post(
  "/",
  verifyToken,
  checkPermission("DICHVU_CREATE"),
  controller.create,
);

router.put(
  "/:id/hide",
  verifyToken,
  checkPermission("DICHVU_UPDATE"),
  controller.hide,
);

router.put(
  "/:id/show",
  verifyToken,
  checkPermission("DICHVU_UPDATE"),
  controller.show,
);
// Cập nhật dịch vụ
router.put(
  "/:id",
  verifyToken,
  checkPermission("DICHVU_UPDATE"),
  controller.update,
);

// Xóa dịch vụ
router.delete(
  "/:id",
  verifyToken,
  checkPermission("DICHVU_DELETE"),
  controller.remove,
);

module.exports = router;
