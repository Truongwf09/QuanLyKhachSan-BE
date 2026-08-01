const model = require("../model/nhanvienModel");
const db = require("../config/db");
exports.getAll = async (user) => {
  const { role, MaCN } = user;
  if (role === "admin") {
    const [rows] = await db.query(`
      SELECT * FROM quantrivien
    `);
    return rows;
  }
  if (role === "quanly") {
    const [rows] = await db.query(
      `
      SELECT * FROM quantrivien 
      WHERE MaCV = 'CV02' AND MaCN = ?
    `,
      [MaCN],
    );
    return rows;
  }
  throw new Error("Không có quyền");
};
exports.create = async (data) => {
  if (data.role === "tiep_tan") {
    throw { status: 400, message: "Không thể tạo tài khoản tiếp tân" };
  }
  await model.create(data);
  return { message: "Thêm nhân viên thành công" };
};

exports.update = async (MaQTV, data, user) => {
  if (user.role !== "admin" && user.MaCN !== data.MaCN) {
    throw { status: 403, message: "Sai chi nhánh" };
  }
  if (user.role === "tiep_tan") {
    throw { status: 403, message: "Không có quyền" };
  }

  await model.update(MaQTV, data);
  return { message: "Cập nhật nhân viên thành công" };
};

exports.remove = async (MaQTV, user) => {
  if (user.role === "tiep_tan") {
    throw { status: 403, message: "Không có quyền" };
  }

  await model.remove(MaQTV);
  return { message: "Xóa nhân viên thành công" };
};
exports.changeStatus = async (MaNV, TrangThai) => {
  if (![0, 1].includes(Number(TrangThai))) {
    throw new Error("Trạng thái không hợp lệ");
  }

  const result = await model.changeStatus(MaNV, TrangThai);

  if (result.affectedRows === 0) {
    throw new Error("Không tìm thấy nhân viên");
  }

  return {
    message: "Cập nhật trạng thái thành công",
  };
};
exports.getProfile = async (MaQTV) => {
  const data = await model.getProfile(MaQTV);

  if (!data) {
    throw new Error("Không tìm thấy nhân viên");
  }

  return data;
};
