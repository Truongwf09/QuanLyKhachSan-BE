const router = require("express").Router();

const controller = require("../controller/datphongController");

const { verifyToken } = require("../middleware/authMiddleware");

const { checkPermission } = require("../middleware/permissionMiddleware");

/* =========================
PUBLIC
========================= */

// Chi tiết đơn đặt phòng
router.get("/detail/:id", controller.getDetail);

// Xem phòng trống
router.get("/rooms/available", controller.getAvailableRooms);

/* =========================
KHÁCH HÀNG
========================= */

// Tạo đơn đặt phòng
router.post("/", verifyToken, controller.create);
router.get("/my-bookings", verifyToken, controller.getMyBookings);
router.get("/detailBooking/:MaDP", verifyToken, controller.getBookingDetail);

/* =========================
NHÂN VIÊN
========================= */

// Xem danh sách đặt phòng
router.get(
  "/",
  verifyToken,
  checkPermission("DATPHONG_VIEW"),
  controller.getAll,
);

// Xác nhận đặt phòng
router.put(
  "/:id/confirm",
  verifyToken,
  checkPermission("DATPHONG_UPDATE"),
  controller.confirmBooking,
);

// Hủy / đặt thất bại
router.put(
  "/:id/cancel",
  verifyToken,
  checkPermission("DATPHONG_UPDATE"),
  controller.datphongThatBai,
);

// Danh sách checkin
router.get(
  "/checkin-list",
  verifyToken,
  checkPermission("DATPHONG_VIEW"),
  controller.getCheckInList,
);

// Danh sách checkout
router.get(
  "/checkout-list",
  verifyToken,
  checkPermission("DATPHONG_VIEW"),
  controller.getCheckOutList,
);

// Check in
router.put(
  "/:id/check-in",
  verifyToken,
  checkPermission("DATPHONG_UPDATE"),
  controller.checkIn,
);
router.get(
  "/checkin/:MaDP",
  verifyToken,
  checkPermission("DATPHONG_VIEW"),
  controller.getBookingForCheckin,
);
// Check out
router.put(
  "/:id/check-out",
  verifyToken,
  checkPermission("DATPHONG_UPDATE"),
  controller.checkOut,
);

// Lịch đặt phòng
router.get(
  "/calendar",
  verifyToken,
  checkPermission("DATPHONG_VIEW"),
  controller.getCalendar,
);
router.get("/customer/detail/:MaDP", verifyToken, controller.getBookingDetail);
module.exports = router;
