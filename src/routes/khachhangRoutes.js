const express = require("express");
const router = express.Router();

const ctrl = require("../controller/khachhangController");

const { verifyToken } = require("../middleware/authMiddleware");

// ================= AUTH =================

router.post("/register", ctrl.register);

router.post("/verify-otp", ctrl.verifyOTP);

router.post("/resend-otp", ctrl.resendOTP);

router.post("/login", ctrl.login);
router.get("/profile", verifyToken, ctrl.getProfile);

router.put("/profile", verifyToken, ctrl.updateProfile);

// ================= KHÁCH HÀNG =================

// lấy tất cả khách hàng
router.get("/", verifyToken, ctrl.getAll);

// chi tiết khách hàng
router.get("/:id", verifyToken, ctrl.getById);

// ================= PROFILE =================

router.put("/change-password", verifyToken, ctrl.changePassword);

router.post("/forgot-password", ctrl.forgotPassword);

router.post("/reset-password", ctrl.resetPassword);

module.exports = router;
