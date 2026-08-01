const db = require("../config/db");
const model = require("../model/loaiphongModel");
const bookingHelper = require("../helpers/bookingHelper");
/* GET ALL */
exports.getAll = async (user) => {
  console.log("USER SERVICE:", user);

  if (!user || user.role === "khachhang") {
    const [rows] = await db.query(`
            SELECT *
            FROM loaiphong
            ORDER BY MaLoai
        `);

    return rows;
  }

  // Admin thấy tất cả
  if (user.role === "admin") {
    const [rows] = await db.query(`
SELECT
    lp.MaLoai,
    lp.TenLoai,
    lp.MoTa,
    lp.TrangThai,
    lp.SoNguoiToiDa,
    lp.HinhAnh,
    clp.MaCN,
    cn.TenCN
FROM loaiphong lp
LEFT JOIN chinhanh_loaiphong clp
    ON lp.MaLoai = clp.MaLoai
LEFT JOIN chinhanh cn
    ON cn.MaCN = clp.MaCN
ORDER BY
    lp.MaLoai,
    clp.MaCN;
        `);

    return rows;
  }

  // Quản lý chỉ thấy loại phòng của chi nhánh mình
  if (user.role === "quanly") {
    const [rows] = await db.query(
      `
            SELECT DISTINCT lp.*
            FROM loaiphong lp
            INNER JOIN chinhanh_loaiphong clp
                ON lp.MaLoai = clp.MaLoai
            WHERE clp.MaCN = ?
            ORDER BY lp.MaLoai
        `,
      [user.MaCN],
    );

    return rows;
  }

  // Lễ tân
  if (user.role === "tiep_tan") {
    const [rows] = await db.query(
      `
            SELECT DISTINCT lp.*
            FROM loaiphong lp
            INNER JOIN chinhanh_loaiphong clp
                ON lp.MaLoai = clp.MaLoai
            WHERE clp.MaCN = ?
            ORDER BY lp.MaLoai
        `,
      [user.MaCN],
    );

    return rows;
  }

  return [];
};

exports.getPublic = async (MaCN, MaLoai) => {
  return await model.getPublic(MaCN, MaLoai);
};
/* CREATE */
exports.create = async (user, data) => {
  const { role } = user;

  if (!["admin", "quanly"].includes(role)) {
    throw new Error("Không có quyền");
  }

  const { TenLoai, MoTa, SoNguoiToiDa, HinhAnh } = data;

  if (!TenLoai || SoNguoiToiDa == null) {
    throw new Error("Thiếu dữ liệu");
  }

  const [[dup]] = await db.query("SELECT * FROM loaiphong WHERE TenLoai = ?", [
    TenLoai,
  ]);

  if (dup) {
    throw new Error("Tên loại phòng đã tồn tại");
  }

  const [rows] = await db.query(`
        SELECT MaLoai
        FROM loaiphong
        ORDER BY MaLoai DESC
        LIMIT 1
    `);

  let MaLoai = "LP01";

  if (rows.length > 0) {
    const lastMa = rows[0].MaLoai;
    const numberPart = parseInt(lastMa.replace("LP", ""));

    const newNumber = numberPart + 1;

    MaLoai = "LP" + String(newNumber).padStart(2, "0");
  }

  await db.query(
    `
INSERT INTO loaiphong(
    MaLoai,
    TenLoai,
    MoTa,
    SoNguoiToiDa,
    HinhAnh,
    TrangThai
)
VALUES(?,?,?,?,?,1)
`,
    [MaLoai, TenLoai.trim(), MoTa || "", Number(SoNguoiToiDa), HinhAnh || ""],
  );
  let danhSachCN = [];

  if (role === "quanly") {
    // Quản lý chỉ được tạo cho chi nhánh mình
    danhSachCN = [user.MaCN];
  } else {
    // Admin gửi lên
    danhSachCN = data.MaCNList || [];
  }

  for (const maCN of danhSachCN) {
    await db.query(
      `
        INSERT INTO CHINHANH_loaiphong(
            MaCN,
            MaLoai
        )
        VALUES(?,?)
        `,
      [maCN, MaLoai],
    );
  }

  return {
    message: "Thêm loại phòng thành công",
  };
};

/* UPDATE */
exports.update = async (user, id, data) => {
  const { role } = user;

  if (!["admin", "quanly"].includes(role)) {
    throw new Error("Không có quyền");
  }

  const { TenLoai, MoTa, SoNguoiToiDa, HinhAnh } = data;

  if (!TenLoai || SoNguoiToiDa == null) {
    throw new Error("Thiếu dữ liệu cập nhật");
  }

  const [[roomType]] = await db.query(
    "SELECT * FROM loaiphong WHERE MaLoai = ?",
    [id],
  );
  if (role === "quanly") {
    const [[exist]] = await db.query(
      `
        SELECT *
        FROM CHINHANH_loaiphong
        WHERE MaLoai = ?
        AND MaCN = ?
        `,
      [id, user.MaCN],
    );

    if (!exist) {
      throw new Error("Bạn không có quyền sửa loại phòng này");
    }
  }

  if (!roomType) {
    throw new Error("Loại phòng không tồn tại");
  }

  const [[dup]] = await db.query(
    `
        SELECT *
        FROM loaiphong
        WHERE TenLoai = ?
        AND MaLoai != ?
    `,
    [TenLoai, id],
  );

  if (dup) {
    throw new Error("Tên loại phòng đã tồn tại");
  }

  await db.query(
    `
        UPDATE loaiphong
        SET
            TenLoai = ?,
            MoTa = ?,
            SoNguoiToiDa = ?,
            HinhAnh = ?
        WHERE MaLoai = ?
    `,
    [TenLoai.trim(), MoTa || "", Number(SoNguoiToiDa), HinhAnh || "", id],
  );
  if (role === "admin" && data.MaCNList) {
    await db.query(
      `
        DELETE FROM CHINHANH_loaiphong
        WHERE MaLoai = ?
        `,
      [id],
    );

    for (const maCN of data.MaCNList) {
      await db.query(
        `
            INSERT INTO CHINHANH_loaiphong (
                MaCN,
                MaLoai
            )
            VALUES (?, ?)
            `,
        [maCN, id],
      );
    }
  }

  return {
    message: "Cập nhật loại phòng thành công",
  };
};

/* DELETE */
exports.remove = async (user, id) => {
  const { role } = user;

  if (!["admin", "quanly"].includes(role)) {
    throw new Error("Không có quyền");
  }

  const [[roomType]] = await db.query(
    "SELECT * FROM loaiphong WHERE MaLoai = ?",
    [id],
  );

  if (!roomType) {
    throw new Error("Loại phòng không tồn tại");
  }

  const [[used]] = await db.query(
    "SELECT * FROM phong WHERE MaLoai = ? LIMIT 1",
    [id],
  );

  if (used) {
    throw new Error("Loại phòng đang được sử dụng, không thể xoá");
  }

  await db.query("DELETE FROM loaiphong WHERE MaLoai = ?", [id]);

  return {
    message: "Xoá loại phòng thành công",
  };
};
exports.getRoomsByType = async (maLoai, filter) => {
  const conn = await model.getConnection();

  try {
    let finalNgayNhan = null;
    let finalNgayTra = null;

    if (filter.NgayNhan && filter.NgayTra) {
      const result = bookingHelper.resolveBookingTime({
        NgayNhan: filter.NgayNhan,
        NgayTra: filter.NgayTra,
        LoaiDat: filter.LoaiDat || "theo ngày",

        SoGio: filter.SoGio,
      });

      finalNgayNhan = result.finalNgayNhan;

      finalNgayTra = result.finalNgayTra;
    }

    return await model.getRoomsByType(
      conn,

      maLoai,

      filter.MaCN,

      finalNgayNhan,

      finalNgayTra,
    );
  } finally {
    conn.release();
  }
};
/* =====================
        HIDE
===================== */

exports.hide = async (user, id) => {
  const { role, MaCN } = user;

  if (!["admin", "quanly"].includes(role)) {
    throw new Error("Không có quyền");
  }

  const [rows] = await db.query(
    `
    SELECT MaCN
    FROM CHINHANH_loaiphong
    WHERE MaLoai = ?
    `,
    [id],
  );

  if (rows.length === 0) {
    throw new Error("Loại phòng không tồn tại");
  }

  if (role === "quanly" && !rows.some((r) => r.MaCN === MaCN)) {
    throw new Error("Không đúng chi nhánh");
  }

  await db.query(
    `
        UPDATE loaiphong
        SET TrangThai = 0
        WHERE MaLoai = ?
        `,
    [id],
  );

  return {
    message: "Ẩn loại phòng thành công",
  };
};

/* =====================
        SHOW
===================== */

exports.show = async (user, id) => {
  const { role, MaCN } = user;

  if (!["admin", "quanly"].includes(role)) {
    throw new Error("Không có quyền");
  }

  const [rows] = await db.query(
    `
    SELECT MaCN
    FROM CHINHANH_loaiphong
    WHERE MaLoai = ?
    `,
    [id],
  );

  if (rows.length === 0) {
    throw new Error("Loại phòng không tồn tại");
  }

  if (role === "quanly" && !rows.some((r) => r.MaCN === MaCN)) {
    throw new Error("Không đúng chi nhánh");
  }

  await db.query(
    `
        UPDATE loaiphong
        SET TrangThai = 1
        WHERE MaLoai = ?
        `,
    [id],
  );

  return {
    message: "Hiển thị loại phòng thành công",
  };
};
