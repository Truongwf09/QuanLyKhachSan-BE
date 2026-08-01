const express = require("express");

const router = express.Router();

const controller = require("../controller/cleaningController");

const { verifyToken } = require("../middleware/authMiddleware");

const { checkPermission } = require("../middleware/permissionMiddleware");

/* =========================
PHÒNG CHỜ DỌN
========================= */

router.get(
  "/pending",
  verifyToken,
  checkPermission("PHONG_CLEAN_VIEW"),
  controller.getPendingRooms,
);

router.get(
  "/completed",
  verifyToken,
  checkPermission("PHONG_CLEAN_VIEW"),
  controller.getCompletedRooms,
);

/* =========================
CHI TIẾT
========================= */

router.get(
  "/detail/:MaDD",
  verifyToken,
  checkPermission("PHONG_CLEAN_VIEW"),
  controller.getRoomDetail,
);

/* =========================
CHECKLIST
========================= */

router.get(
  "/checklist/:MaDD",
  verifyToken,
  checkPermission("PHONG_CLEAN_VIEW"),
  controller.getChecklist,
);

router.put(
  "/checklist/:MaCheck",
  verifyToken,
  checkPermission("PHONG_CLEAN_UPDATE"),
  controller.updateChecklist,
);

/* =========================
NHẬN DỌN
========================= */

router.post(
  "/accept/:MaDD",
  verifyToken,
  checkPermission("PHONG_CLEAN_UPDATE"),
  controller.acceptCleaning,
);

/* =========================
BẮT ĐẦU DỌN
========================= */

router.post(
  "/start/:MaDD",
  verifyToken,
  checkPermission("PHONG_CLEAN_UPDATE"),
  controller.startCleaning,
);

/* =========================
HOÀN THÀNH
========================= */

router.post(
  "/finish/:MaDD",
  verifyToken,
  checkPermission("PHONG_CLEAN_UPDATE"),
  controller.finishCleaning,
);

/* =========================
DỊCH VỤ SỬ DỤNG
========================= */

router.get(
  "/services/:MaDD",
  verifyToken,
  checkPermission("PHONG_CLEAN_VIEW"),
  controller.getServices,
);

router.post(
  "/services/:MaDD",
  verifyToken,
  checkPermission("PHONG_CLEAN_UPDATE"),
  controller.saveServices,
);

/* =========================
LỊCH SỬ DỌN PHÒNG
========================= */

router.get(
  "/history",
  verifyToken,
  checkPermission("PHONG_CLEAN_VIEW"),
  controller.getHistory,
);

module.exports = router;
