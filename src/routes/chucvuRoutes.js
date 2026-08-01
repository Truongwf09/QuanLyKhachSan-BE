const router = require("express").Router();

const c = require("../controller/chucvuController");

const { verifyToken } = require("../middleware/authMiddleware");

const { checkPermission } = require("../middleware/permissionMiddleware");

router.get(
  "/",
  verifyToken,
  // checkPermission(
  //     "CHUCVU_VIEW"
  // ),
  c.getAll,
);
router.get(
  "/:id/permissions",

  verifyToken,

  checkPermission("CHUCVU_VIEW"),

  c.getPermissions,
);

router.post(
  "/:id/permissions",

  verifyToken,

  checkPermission("CHUCVU_UPDATE"),

  c.assignPermissions,
);
router.get(
  "/:id",
  verifyToken,
  // checkPermission(
  //     "CHUCVU_VIEW"
  // ),
  c.getById,
);

router.post("/", verifyToken, checkPermission("CHUCVU_CREATE"), c.create);

router.put("/:id", verifyToken, checkPermission("CHUCVU_UPDATE"), c.update);

router.delete("/:id", verifyToken, checkPermission("CHUCVU_DELETE"), c.remove);
router.put(
  "/:MaCV/status",
  verifyToken,
  checkPermission("CHUCVU_UPDATE"),
  c.changeStatus,
);
module.exports = router;
