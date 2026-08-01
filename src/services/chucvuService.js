const model = require("../model/chucvuModel");

exports.getAll = async () => {
  return await model.getAll();
};

exports.getById = async (id) => {
  const rows = await model.getById(id);

  if (!rows.length) {
    throw new Error("Chức vụ không tồn tại");
  }

  return rows[0];
};

exports.create = async (data) => {
  // ✅ Tự sinh MaCV dạng CV01, CV02, ...
  const lastRow = await model.getLast();

  let newMaCV = "CV01";
  if (lastRow) {
    const lastNum = parseInt(lastRow.MaCV.replace("CV", ""), 10);
    newMaCV = "CV" + String(lastNum + 1).padStart(2, "0");
  }

  await model.create({ ...data, MaCV: newMaCV });

  return { message: "Thêm chức vụ thành công", MaCV: newMaCV };
};

exports.update = async (id, data) => {
  await model.update(id, data);
  return { message: "Cập nhật thành công" };
};

exports.remove = async (id) => {
  await model.remove(id);
  return { message: "Xóa thành công" };
};
exports.getPermissions = async (MaCV) => {
  return await model.getPermissions(MaCV);
};

exports.assignPermissions = async (MaCV, permissions) => {
  await model.assignPermissions(
    MaCV,

    permissions,
  );

  return {
    message: "Phân quyền thành công",
  };
};
exports.changeStatus = async (MaCV, TrangThai) => {
  if (!["hoạt động", "ngừng hoạt động"].includes(TrangThai)) {
    throw new Error("Trạng thái không hợp lệ");
  }

  const result = await model.changeStatus(MaCV, TrangThai);

  if (result.affectedRows === 0) {
    throw new Error("Không tìm thấy chức vụ");
  }

  return {
    message: "Cập nhật trạng thái thành công",
  };
};
