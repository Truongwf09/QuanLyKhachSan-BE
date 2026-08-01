const model = require("../model/dichvuModel");
const db = require("../config/db");

function generateMaDV() {
  const timePart = Date.now().toString().slice(-6);

  const rand = Math.floor(100 + Math.random() * 900);

  return `DV${timePart}${rand}`;
}

/* =========================
   GET ALL
========================= */

exports.getAll = async (user, MaCN) => {
  const conn = await model.getConnection();

  try {
    const [rows] = await model.getAll(conn, user, MaCN);

    return rows;
  } finally {
    conn.release();
  }
};

/* =========================
   GET DETAIL
========================= */

exports.getById = async (MaDV, user) => {
  const conn = await model.getConnection();

  try {
    const [[service]] = await model.getByIdWithPermission(conn, MaDV, user);

    if (!service) {
      throw {
        status: 404,
        message: "Không tìm thấy dịch vụ",
      };
    }

    return service;
  } finally {
    conn.release();
  }
};
exports.getPublic = async (MaCN) => {
  let sql = `
    SELECT *
    FROM dichvu
    WHERE TrangThai=1
  `;

  const params = [];

  if (MaCN) {
    sql += " AND MaCN = ?";
    params.push(MaCN);
  }

  sql += " ORDER BY TenDV";

  const [rows] = await db.query(sql, params);

  return rows;
};

/* =========================
   CREATE
========================= */

exports.create = async (data, user) => {
  if (!["admin", "quanly"].includes(user.role)) {
    throw {
      status: 403,
      message: "Không có quyền thêm dịch vụ",
    };
  }

  const { TenDV, GiaDV, MoTa, MaCN } = data;

  if (!TenDV || !GiaDV || !MoTa) {
    throw {
      status: 400,
      message: "Thiếu dữ liệu",
    };
  }

  const conn = await model.getConnection();

  try {
    await conn.beginTransaction();

    const finalMaCN = user.role === "admin" ? MaCN : user.MaCN;

    if (!finalMaCN) {
      throw {
        status: 400,
        message: "Thiếu mã chi nhánh",
      };
    }

    await model.create(conn, {
      MaDV: generateMaDV(),
      TenDV,
      GiaDV,
      MoTa: MoTa || null,
      MaCN: finalMaCN,
    });

    await conn.commit();

    return {
      message: "Thêm dịch vụ thành công",
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =========================
   UPDATE
========================= */

exports.update = async (MaDV, data, user) => {
  if (!["admin", "quanly"].includes(user.role)) {
    throw {
      status: 403,
      message: "Không có quyền sửa dịch vụ",
    };
  }

  const conn = await model.getConnection();

  try {
    await conn.beginTransaction();

    const [[service]] = await model.getByIdWithPermission(conn, MaDV, user);

    if (!service) {
      throw {
        status: 404,
        message: "Không tìm thấy dịch vụ",
      };
    }

    await model.update(conn, MaDV, {
      TenDV: data.TenDV || service.TenDV,
      GiaDV: data.GiaDV || service.GiaDV,
      MoTa: data.MoTa || service.MoTa,
    });

    await conn.commit();

    return {
      message: "Cập nhật dịch vụ thành công",
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =========================
   DELETE
========================= */

exports.remove = async (MaDV, user) => {
  if (!["admin", "quanly"].includes(user.role)) {
    throw {
      status: 403,
      message: "Không có quyền xoá dịch vụ",
    };
  }

  const conn = await model.getConnection();

  try {
    await conn.beginTransaction();

    const [[service]] = await model.getByIdWithPermission(conn, MaDV, user);

    if (!service) {
      throw {
        status: 404,
        message: "Không tìm thấy dịch vụ",
      };
    }

    await model.remove(conn, MaDV);

    await conn.commit();

    return {
      message: "Xoá dịch vụ thành công",
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
exports.hide = async (MaDV, user) => {
  if (!["admin", "quanly"].includes(user.role)) {
    throw {
      status: 403,
      message: "Không có quyền",
    };
  }

  const conn = await model.getConnection();

  try {
    await conn.beginTransaction();

    const [[service]] = await model.getByIdWithPermission(conn, MaDV, user);

    if (!service) {
      throw {
        status: 404,
        message: "Không tìm thấy dịch vụ",
      };
    }

    await model.hide(conn, MaDV);

    await conn.commit();

    return {
      message: "Ẩn dịch vụ thành công",
    };
  } catch (err) {
    await conn.rollback();

    throw err;
  } finally {
    conn.release();
  }
};
exports.show = async (MaDV, user) => {
  if (!["admin", "quanly"].includes(user.role)) {
    throw {
      status: 403,
      message: "Không có quyền",
    };
  }

  const conn = await model.getConnection();

  try {
    await conn.beginTransaction();

    const [[service]] = await model.getByIdWithPermission(conn, MaDV, user);

    if (!service) {
      throw {
        status: 404,
        message: "Không tìm thấy dịch vụ",
      };
    }

    await model.show(conn, MaDV);

    await conn.commit();

    return {
      message: "Hiện dịch vụ thành công",
    };
  } catch (err) {
    await conn.rollback();

    throw err;
  } finally {
    conn.release();
  }
};
exports.getActive = async (user) => {
  const conn = await model.getConnection();

  try {
    const [rows] = await model.getActive(conn, user);

    return rows;
  } finally {
    conn.release();
  }
};
