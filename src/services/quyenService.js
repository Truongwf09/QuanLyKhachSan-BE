const model = require("../model/quyenModel");

exports.getAll = async () => {
  return await model.getAll();
};

exports.create = async (data) => {
  await model.create(data);

  return {
    message: "Thêm quyền thành công",
  };
};

exports.update = async (id, data) => {
  await model.update(id, data);

  return {
    message: "Cập nhật quyền thành công",
  };
};
const db = require("../config/db");

exports.getById = async (id) => {
  const [rows] = await db.query(
    `
        SELECT *
        FROM quyen
        WHERE MaQuyen = ?
        `,

    [id],
  );

  if (!rows.length) {
    throw new Error("Quyền không tồn tại");
  }

  return rows[0];
};
exports.remove = async (id) => {
  await model.remove(id);

  return {
    message: "Xóa quyền thành công",
  };
};
