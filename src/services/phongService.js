const db = require("../config/db");
const { resolveBookingTime } = require("../helpers/bookingHelper");

// Tầng phải là một số nguyên dương. Chuẩn hoá ở backend để tránh cùng một
// tầng bị lưu thành các giá trị khác nhau như "01", "Tầng 1" hoặc chuỗi rỗng.
const normalizeFloor = (value) => {
  const floor = typeof value === "number" ? value : Number(String(value).trim());

  if (!Number.isInteger(floor) || floor < 1) {
    throw new Error("Tầng phải là số nguyên dương");
  }

  return floor;
};
/* =========================
   GET ALL
========================= */
exports.getAll = async (user) => {
  const { role, MaCN } = user;

  let query = `
        SELECT
            p.*,
            lp.TenLoai,
            lp.SoNguoiToiDa,
            lp.MoTa,
            lp.HinhAnh
        FROM phong p
        JOIN loaiphong lp
            ON p.MaLoai = lp.MaLoai
    `;

  const params = [];

  if (role === "quanly" || role === "tiep_tan") {
    query += " WHERE p.MaCN = ?";
    params.push(MaCN);
  }

  query += " ORDER BY p.MaCN, p.Tang, CAST(p.SoPhong AS UNSIGNED), p.SoPhong";

  const [rows] = await db.query(query, params);
  return rows;
};

/* =========================
   CREATE
========================= */
exports.create = async (user, data) => {
  const { role, MaCN } = user;

  if (!["admin", "quanly"].includes(role)) {
    throw new Error("Không có quyền thêm phòng");
  }

  let {
    MaPhong,
    SoPhong,
    Tang: rawTang,
    MaCN: bodyCN,
    MaLoai,
    GiaPhong,
    GiaTheoGio,
    GiaQuaDem,
  } = data;

  if (
    !MaPhong ||
    !SoPhong ||
    rawTang == null ||
    !MaLoai ||
    GiaPhong == null ||
    GiaTheoGio == null ||
    GiaQuaDem == null
  ) {
    throw new Error("Thiếu dữ liệu");
  }

  if (role === "quanly") {
    bodyCN = MaCN;
  }

  if (!bodyCN) {
    throw new Error("Thiếu mã chi nhánh");
  }

  const Tang = normalizeFloor(rawTang);
  const [[roomType]] = await db.query(
    `
    SELECT *
    FROM LOAIPHONG
    WHERE MaLoai = ?
    `,
    [MaLoai],
  );

  if (!roomType) {
    throw new Error("Loại phòng không tồn tại");
  }

  if (roomType.TrangThai == 0) {
    throw new Error("Loại phòng đã bị ẩn");
  }

  const [[exist]] = await db.query("SELECT * FROM phong WHERE MaPhong = ?", [
    MaPhong,
  ]);

  if (exist) {
    throw new Error("Mã phòng đã tồn tại");
  }

  const [[dupRoomNumber]] = await db.query(
    `
        SELECT *
        FROM phong
        WHERE SoPhong = ?
        AND MaCN = ?
        `,
    [SoPhong, bodyCN],
  );

  if (dupRoomNumber) {
    throw new Error("Số phòng đã tồn tại trong chi nhánh");
  }

  await db.query(
    `
        INSERT INTO phong (
            MaPhong,
            SoPhong,
            Tang,
            TinhTrangPhong,
            MaLoai,
            MaCN,
            GiaPhong,
            GiaTheoGio,
            GiaQuaDem
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
    [
      MaPhong,
      SoPhong,
      Tang,
      "có sẵn",
      MaLoai,
      bodyCN,
      GiaPhong,
      GiaTheoGio,
      GiaQuaDem,
    ],
  );

  return {
    message: "Thêm phòng thành công",
  };
};

/* =========================
   UPDATE
========================= */
exports.update = async (user, id, data) => {
  if (data.TinhTrangPhong && Object.keys(data).length === 1) {
    console.log("STATUS UPDATE");
    console.log("ID:", id);
    console.log("STATUS:", data.TinhTrangPhong);

    const [result] = await db.query(
      `
            UPDATE phong
            SET TinhTrangPhong = ?
            WHERE MaPhong = ?
            `,
      [data.TinhTrangPhong, id],
    );

    console.log(result);

    return {
      message: "Cập nhật tình trạng thành công",
    };
  }

  const { role, MaCN } = user;

  if (!["admin", "quanly"].includes(role)) {
    throw new Error("Không có quyền cập nhật");
  }

  const [[room]] = await db.query("SELECT * FROM phong WHERE MaPhong = ?", [
    id,
  ]);

  if (!room) {
    throw new Error("Phòng không tồn tại");
  }

  if (role === "quanly" && room.MaCN !== MaCN) {
    throw new Error("Không đúng chi nhánh");
  }

  const {
    SoPhong,
    Tang: rawTang,
    MaLoai,
    TinhTrangPhong,
    GiaPhong,
    GiaTheoGio,
    GiaQuaDem,
  } = data;

  if (
    SoPhong == null ||
    rawTang == null ||
    !MaLoai ||
    !TinhTrangPhong ||
    GiaPhong == null ||
    GiaTheoGio == null ||
    GiaQuaDem == null
  ) {
    throw new Error("Thiếu dữ liệu cập nhật");
  }

  const Tang = normalizeFloor(rawTang);

  const [[dupRoomNumber]] = await db.query(
    `
        SELECT *
        FROM phong
        WHERE SoPhong = ?
        AND MaCN = ?
        AND MaPhong != ?
        `,
    [SoPhong, room.MaCN, id],
  );

  if (dupRoomNumber) {
    throw new Error("Số phòng đã tồn tại trong chi nhánh");
  }

  await db.query(
    `
        UPDATE phong
        SET
            SoPhong = ?,
            Tang = ?,
            MaLoai = ?,
            TinhTrangPhong = ?,
            GiaPhong = ?,
            GiaTheoGio = ?,
            GiaQuaDem = ?
        WHERE MaPhong = ?
        `,
    [
      SoPhong,
      Tang,
      MaLoai,
      TinhTrangPhong,
      GiaPhong,
      GiaTheoGio,
      GiaQuaDem,
      id,
    ],
  );

  return {
    message: "Cập nhật phòng thành công",
  };
};

/* =========================
   DELETE
========================= */
exports.remove = async (user, id) => {
  const { role, MaCN } = user;

  if (!["admin", "quanly"].includes(role)) {
    throw new Error("Không có quyền xoá");
  }

  const [[room]] = await db.query("SELECT * FROM phong WHERE MaPhong = ?", [
    id,
  ]);

  if (!room) {
    throw new Error("Phòng không tồn tại");
  }

  if (role === "quanly" && room.MaCN !== MaCN) {
    throw new Error("Không đúng chi nhánh");
  }

  await db.query("DELETE FROM phong WHERE MaPhong = ?", [id]);

  return {
    message: "Xoá phòng thành công",
  };
};

exports.getAvailableRooms = async (query) => {
  const { MaCN, MaLoai, SoNguoi = 1 } = query;

  if (!MaCN || !MaLoai) {
    throw new Error("Thiếu chi nhánh hoặc loại phòng");
  }

  const { finalNgayNhan, finalNgayTra } = resolveBookingTime(query);

  const [rows] = await db.query(
    `
SELECT
    p.*,
    lp.*
FROM phong p
JOIN loaiphong lp
    ON p.MaLoai = lp.MaLoai
WHERE
    p.MaCN = ?
    AND p.MaLoai = ?
    AND lp.SoNguoiToiDa >= ?
    AND p.TinhTrangPhong NOT IN ('bảo trì','ngưng hoạt động')

    AND p.MaPhong NOT IN (

        SELECT pp.MaPhong

        FROM phanphong pp
        JOIN chitiet_dp ct
            ON ct.MaCTDP = pp.MaCTDP

        WHERE
            pp.TrangThai IN (
                'chờ xác nhận',
                'đã giữ phòng',
                'đã nhận phòng'
            )

            AND ct.NgayNhanPhong < ?
            AND ct.NgayTraPhong > ?

    )
        `,
    [MaCN, MaLoai, SoNguoi, finalNgayTra, finalNgayNhan],
  );

  return rows;
};

exports.getPublicRooms = async (MaLoai) => {
  let query = `
    SELECT p.*, lp.TenLoai,
           lp.SoNguoiToiDa, lp.MoTa, lp.HinhAnh
    FROM phong p
    JOIN loaiphong lp ON lp.MaLoai = p.MaLoai
    WHERE 1 = 1
  `;
  const params = [];

  if (MaLoai) {
    query += " AND p.MaLoai = ?";
    params.push(MaLoai);
  }

  const [rows] = await db.execute(query, params);
  return rows;
};

exports.getPublicRoomDetail = async (MaPhong) => {
  const [rows] = await db.execute(
    `
      SELECT p.*, lp.TenLoai, lp.SoNguoiToiDa, lp.MoTa, lp.HinhAnh
      FROM phong p
      JOIN loaiphong lp ON lp.MaLoai = p.MaLoai
      WHERE p.MaPhong = ?
    `,
    [MaPhong],
  );
  return rows[0];
};
exports.getCheckoutPending = async (MaCN) => {
  const [rows] = await db.query(
    `

        SELECT

            MaPhong,

            SoPhong,

            Tang,

            GiaPhong,

            TinhTrangPhong,

            MaCN

        FROM PHONG

        WHERE

            TinhTrangPhong = 'đang dọn dẹp'

            AND

            MaCN = ?

        ORDER BY

            SoPhong

        `,

    [MaCN],
  );

  return rows;
};

exports.finishCleaning = async (MaPhong, MaCN) => {
  const [result] = await db.query(
    `

        UPDATE PHONG

        SET

            TinhTrangPhong='có sẵn'

        WHERE

            MaPhong=?

            AND

            MaCN=?

            AND

            TinhTrangPhong='đang dọn dẹp'

        `,

    [MaPhong, MaCN],
  );

  return result;
};
exports.finishCleaning = async (
  MaPhong,

  MaCN,
) => {
  const [result] = await db.query(
    `

        UPDATE PHONG

        SET

            TinhTrangPhong='có sẵn'

        WHERE

            MaPhong=?

            AND

            MaCN=?

            AND

            TinhTrangPhong='đang dọn dẹp'

        `,

    [MaPhong, MaCN],
  );

  return result;
};
