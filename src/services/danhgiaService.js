const model = require("../model/danhgiaModel");

const db = require("../config/db");

exports.getAll = async () => {
  return await model.getAll();
};

exports.getByLoaiPhong = async (MaLoai) => {
  return await model.getByLoaiPhong(MaLoai);
};

exports.create = async (user, data) => {
  const { MaDP, SoSao: rating, NoiDung } = data;

  // ========= Validate =========

  if (!MaDP) {
    throw new Error("Thiếu mã đặt phòng");
  }

  if (!NoiDung || NoiDung.trim() === "") {
    throw new Error("Vui lòng nhập nội dung đánh giá");
  }

  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    throw new Error("Số sao phải từ 1 đến 5");
  }

  // ========= Đã đánh giá chưa =========

  const exists = await model.checkExists(user.MaKH, MaDP);

  if (exists) {
    throw new Error("Bạn đã đánh giá đơn đặt phòng này rồi");
  }

  // ========= Kiểm tra booking =========

  const [[booking]] = await db.query(
    `
SELECT
    ct.MaLoai,
    ct.TrangThaiPhong,
    pdp.MaKH
FROM chitiet_dp ct
JOIN phieudatphong pdp
    ON pdp.MaDP = ct.MaDP
WHERE
    ct.MaDP = ?
    AND pdp.MaKH = ?
`,
    [MaDP, user.MaKH],
  );

  if (!booking) {
    throw new Error("Không tìm thấy đơn đặt phòng");
  }

  // ========= Chỉ cho đánh giá khi hoàn thành =========

  if (
    booking.TrangThaiPhong !== "trả phòng" &&
    booking.TrangThaiPhong !== "hoàn thành"
  ) {
    throw new Error("Bạn chỉ có thể đánh giá sau khi đã trả phòng.");
  }

  // ========= Sinh mã =========

  const last = await model.getLast();

  let MaDG = "DG000001";

  if (last) {
    const number = parseInt(last.MaDG.replace("DG", "")) + 1;

    MaDG = "DG" + String(number).padStart(6, "0");
  }

  // ========= Lưu =========

  await model.create({
    MaDG,

    MaKH: user.MaKH,

    MaDP,

    MaLoai: booking.MaLoai,

    SoSao: rating,

    NoiDung,
  });

  return {
    message: "Đánh giá thành công",
  };
};

exports.remove = async (id) => {
  await model.remove(id);

  return {
    message: "Xóa thành công",
  };
};

exports.getReviewableBookings = async (user) => {
  return await model.getReviewableBookings(user.MaKH);
};
exports.getSummary = async (MaLoai) => {
  return await model.getSummary(MaLoai);
};

exports.hasReviewed = async (user, MaDP) => {
  return {
    reviewed: await model.hasReviewed(
      user.MaKH,

      MaDP,
    ),
  };
};

exports.getMyReviews = async (user) => {
  return await model.getMyReviews(user.MaKH);
};
/* =========================
   ADMIN - DANH SÁCH ĐÁNH GIÁ
========================= */

exports.getAllReviews = async (filters, user) => {
  return await model.getAllReviews(filters);
};

/* =========================
   CHI TIẾT
========================= */

exports.getDetail = async (MaDG) => {
  const review = await model.getDetail(MaDG);

  if (!review) {
    throw {
      status: 404,
      message: "Không tìm thấy đánh giá",
    };
  }

  return review;
};

/* =========================
   ẨN ĐÁNH GIÁ
========================= */

exports.hideReview = async (MaDG) => {
  const status = await model.toggleReview(MaDG);

  return {
    message: status === 1 ? "Đã hiển thị đánh giá" : "Đã ẩn đánh giá",

    TrangThai: status,
  };
};

/* =========================
   THỐNG KÊ
========================= */

exports.getStatistic = async () => {
  return await model.getStatistic();
};
