const express = require("express");
const router = express.Router();

const controller = require("../controller/chinhanhController");

const { verifyToken } = require("../middleware/authMiddleware");

const { checkPermission } = require("../middleware/permissionMiddleware");

// PUBLIC
router.get("/", controller.getAll);
router.get("/public", controller.getAllPublic);

// CREATE
router.post(
  "/",
  verifyToken,
  checkPermission("CHINHANH_CREATE"),
  controller.create,
);

// UPDATE
router.put(
  "/:id",
  verifyToken,
  checkPermission("CHINHANH_UPDATE"),
  controller.update,
);

// DELETE
// router.delete(
//     "/:id",
//     verifyToken,
//     checkPermission("CHINHANH_DELETE"),
//     controller.remove
// );
router.put("/:id/status", controller.toggleStatus);
// router.put("/:id/hide", controller.hide);

module.exports = router;
