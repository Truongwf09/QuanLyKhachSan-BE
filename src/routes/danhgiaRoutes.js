const router = require("express").Router();

const controller = require("../controller/danhgiaController");

const { verifyToken } = require("../middleware/authMiddleware");

const { checkPermission } = require("../middleware/permissionMiddleware");

/* =========================
PUBLIC
========================= */

// Xem đánh giá theo loại phòng
router.get("/loaiphong/:maLoai", controller.getByLoaiPhong);

// Thống kê đánh giá theo loại phòng
router.get("/summary/:maLoai", controller.getSummary);

/* =========================
KHÁCH HÀNG
========================= */

// Gửi đánh giá
router.post("/", verifyToken, controller.create);

// Danh sách đơn được phép đánh giá
router.get(
  "/my-reviewable",
  verifyToken,
  checkPermission("DANHGIA_CREATE"),
  controller.getReviewableBookings,
);

// Kiểm tra đã đánh giá chưa
router.get("/check/:maDP", verifyToken, controller.hasReviewed);

/* =========================
ADMIN / QUẢN LÝ
========================= */

// Danh sách đánh giá
router.get(
  "/",
  verifyToken,
  checkPermission("DANHGIA_VIEW"),
  controller.getAllReviews,
);

// Thống kê đánh giá toàn hệ thống
router.get(
  "/statistic",
  verifyToken,
  checkPermission("DANHGIA_VIEW"),
  controller.getStatistic,
);

// Chi tiết đánh giá
router.get(
  "/detail/:MaDG",
  verifyToken,
  checkPermission("DANHGIA_VIEW"),
  controller.getDetail,
);

// Ẩn đánh giá
router.put(
  "/:MaDG/hide",
  verifyToken,
  checkPermission("DANHGIA_UPDATE"),
  controller.hideReview,
);

// Xóa đánh giá (nếu vẫn muốn giữ)
router.delete(
  "/:id",
  verifyToken,
  checkPermission("DANHGIA_DELETE"),
  controller.remove,
);

module.exports = router;
