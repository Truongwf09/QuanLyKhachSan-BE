const router = require("express").Router();

const c = require("../controller/quyenController");

const { verifyToken } = require("../middleware/authMiddleware");

const { checkPermission } = require("../middleware/permissionMiddleware");
router.get("/", verifyToken, checkPermission("QUYEN_VIEW"), c.getAll);

router.get("/:id", verifyToken, checkPermission("QUYEN_VIEW"), c.getById);

router.post("/", verifyToken, checkPermission("QUYEN_CREATE"), c.create);

router.put("/:id", verifyToken, checkPermission("QUYEN_UPDATE"), c.update);

router.delete("/:id", verifyToken, checkPermission("QUYEN_DELETE"), c.remove);

module.exports = router;
