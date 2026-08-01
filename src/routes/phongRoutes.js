const router = require("express").Router();

const c = require("../controller/phongController");

const { verifyToken, authorize } = require("../middleware/authMiddleware");

const { checkPermission } = require("../middleware/permissionMiddleware");

const upload = require("../middleware/uploadMiddleware");

// ==================== PUBLIC ====================

router.get("/public", c.getPublicRooms);

router.get("/public/:id", c.getPublicRoomDetail);

router.get("/trong", c.getAvailableRooms);

// ==================== ADMIN / STAFF ====================

router.get("/", verifyToken, checkPermission("PHONG_VIEW"), c.getAll);

router.post("/", verifyToken, checkPermission("PHONG_CREATE"), c.create);

router.put("/:id", verifyToken, checkPermission("PHONG_UPDATE"), c.update);

router.delete("/:id", verifyToken, checkPermission("PHONG_DELETE"), c.remove);
router.get(
  "/cleaning",

  verifyToken,

  checkPermission("PHONG_CLEAN_VIEW"),

  c.getCheckoutPending,
);

router.put(
  "/:id/finish-cleaning",

  verifyToken,

  checkPermission("PHONG_CLEAN_UPDATE"),

  c.finishCleaning,
);

router.put(
  "/:id/finish-cleaning",

  verifyToken,

  checkPermission("PHONG_CLEAN_UPDATE"),

  upload.single("image"),

  c.finishCleaning,
);
module.exports = router;
