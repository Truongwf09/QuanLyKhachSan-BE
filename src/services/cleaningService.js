const model = require("../model/cleaningModel");

// =========================
// DANH SÁCH PHÒNG CHỜ DỌN
// =========================
exports.getPendingRooms = async (user) => {
  if (!["don_dep", "quanly", "admin"].includes(user.role)) {
    throw {
      status: 403,
      message: "Không có quyền truy cập",
    };
  }
  console.log(user);
  console.log("MaCN =", user.MaCN);

  return await model.getPendingRooms(user.MaCN);
};

// =========================
// CHI TIẾT
// =========================
exports.getRoomDetail = async (MaDD, user) => {
  if (!["don_dep", "quanly", "admin"].includes(user.role)) {
    throw {
      status: 403,
      message: "Không có quyền truy cập",
    };
  }

  const room = await model.getRoomDetail(MaDD);

  if (!room) {
    throw {
      status: 404,
      message: "Không tìm thấy phòng",
    };
  }

  return room;
};

// =========================
// NHẬN DỌN
// =========================
exports.acceptCleaning = async (MaDD, user) => {
  if (user.role !== "don_dep") {
    throw {
      status: 403,
      message: "Chỉ nhân viên dọn phòng mới được nhận việc",
    };
  }

  const room = await model.getRoomDetail(MaDD);

  if (!room) {
    throw {
      status: 404,
      message: "Không tồn tại",
    };
  }

  if (room.TrangThaiDD !== "chờ nhận") {
    throw {
      status: 400,
      message: "Phòng đã được nhận.",
    };
  }

  await model.acceptCleaning(MaDD, user.MaQTV);

  return {
    message: "Đã nhận phòng cần dọn.",
  };
};

// =========================
// HOÀN THÀNH
// =========================
exports.finishCleaning = async (MaDD, user) => {
  if (user.role !== "don_dep") {
    throw {
      status: 403,
      message: "Không có quyền.",
    };
  }

  const room = await model.getRoomDetail(MaDD);

  if (!room) {
    throw {
      status: 404,
      message: "Không tồn tại.",
    };
  }

  if (room.MaQTV !== user.MaQTV) {
    throw {
      status: 403,
      message: "Bạn không nhận phòng này.",
    };
  }

  if (room.TrangThaiDD === "hoàn thành") {
    throw {
      status: 400,
      message: "Phòng đã hoàn thành.",
    };
  }

  const total = await model.countUnfinishedChecklist(MaDD);

  if (total > 0) {
    throw {
      status: 400,
      message: `Còn ${total} mục checklist chưa hoàn thành.`,
    };
  }

  await model.finishCleaning(MaDD);

  return {
    message: "Hoàn thành dọn phòng.",
  };
};

// =========================
// LỊCH SỬ
// =========================
exports.getHistory = async (user) => {
  if (user.role !== "don_dep") {
    throw {
      status: 403,
      message: "Không có quyền.",
    };
  }

  return await model.getHistory(user.MaQTV);
};
exports.getServices = async (MaDD, user) => {
  if (!["don_dep", "quanly", "admin"].includes(user.role)) {
    throw {
      status: 403,
      message: "Không có quyền.",
    };
  }

  const room = await model.getRoomDetail(MaDD);

  if (!room) {
    throw {
      status: 404,
      message: "Không tìm thấy đơn dọn.",
    };
  }

  return await model.getServicesByCleaning(MaDD);
};
exports.saveServices = async (MaDD, services, user) => {
  if (user.role != "don_dep") {
    throw {
      status: 403,
      message: "Không có quyền.",
    };
  }

  await model.saveServices(MaDD, services);

  return {
    message: "Đã lưu dịch vụ.",
  };
};
exports.startCleaning = async (MaDD, user) => {
  if (user.role !== "don_dep") {
    throw {
      status: 403,
      message: "Không có quyền.",
    };
  }

  const room = await model.getRoomDetail(MaDD);

  if (!room) {
    throw {
      status: 404,
      message: "Không tìm thấy đơn dọn.",
    };
  }

  if (room.MaQTV !== user.MaQTV) {
    throw {
      status: 403,
      message: "Bạn chưa nhận phòng này.",
    };
  }

  if (room.TrangThaiDD !== "kiểm tra phòng") {
    throw {
      status: 400,
      message: "Phòng chưa ở bước kiểm tra.",
    };
  }

  await model.startCleaning(MaDD);

  return {
    message: "Đã bắt đầu dọn phòng.",
  };
};

exports.getCompletedRooms = async (user) => {
  console.log("===== GET COMPLETED =====");
  console.log(user);

  if (!["don_dep", "quanly", "admin"].includes(user.role)) {
    throw {
      status: 403,
      message: "Không có quyền truy cập",
    };
  }

  return await model.getCompletedRooms(user.MaCN);
};
exports.getChecklist = async (MaDD, user) => {
  if (!["don_dep", "quanly", "admin"].includes(user.role)) {
    throw {
      status: 403,
      message: "Không có quyền.",
    };
  }

  const room = await model.getRoomDetail(MaDD);

  if (!room) {
    throw {
      status: 404,
      message: "Không tìm thấy phòng.",
    };
  }

  return await model.getChecklist(MaDD);
};
exports.updateChecklist = async (MaCT, DaHoanThanh, user) => {
  if (user.role !== "don_dep") {
    throw {
      status: 403,
      message: "Không có quyền.",
    };
  }

  await model.updateChecklist(MaCT, DaHoanThanh);

  return {
    message: "Cập nhật checklist thành công.",
  };
};
exports.getChecklist = async (MaDD, user) => {
  if (!["don_dep", "admin", "quanly"].includes(user.role)) {
    throw {
      status: 403,
      message: "Không có quyền",
    };
  }

  return await model.getChecklist(MaDD);
};
exports.updateChecklist = async (MaCheck, DaHoanThanh, user) => {
  if (user.role != "don_dep") {
    throw {
      status: 403,
      message: "Không có quyền",
    };
  }

  await model.updateChecklist(MaCheck, DaHoanThanh);

  return {
    message: "Đã cập nhật checklist",
  };
};
