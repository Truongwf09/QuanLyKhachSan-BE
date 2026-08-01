const model = require("../model/chinhanhModel");

exports.getAll = async () => (await model.getAll())[0];

exports.getAllPublic = async () => (await model.getAllPublic())[0];

exports.create = async (data) => {
  const last = await model.getLastCode();
  const nextNumber = last ? Number(last.MaCN.replace("CN", "")) + 1 : 1;
  const MaCN = `CN${String(nextNumber).padStart(2, "0")}`;

  await model.create({ ...data, MaCN });
  return { message: "Thêm thành công", MaCN };
};

exports.update = async (MaCN, data) => {
  await model.update(MaCN, data);
  return { message: "Cập nhật thành công" };
};

exports.remove = async (MaCN) => {
  await model.remove(MaCN);
  return { message: "Xóa chi nhánh thành công" };
};

exports.toggleStatus = async (MaCN) => {
  const branch = await model.getStatus(MaCN);
  if (!branch) {
    const error = new Error("Không tìm thấy chi nhánh");
    error.status = 404;
    throw error;
  }

  const TrangThai = branch.TrangThai === "hoạt động"
    ? "không hoạt động"
    : "hoạt động";
  await model.updateStatus(MaCN, TrangThai);
  return { message: "Đổi trạng thái thành công", TrangThai };
};
