const service = require("../services/cleaningService");

// =========================
// PHÒNG CHỜ DỌN
// =========================
exports.getPendingRooms = async (req, res) => {
  try {
    const data = await service.getPendingRooms(req.user);

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

// =========================
// CHI TIẾT
// =========================
exports.getRoomDetail = async (req, res) => {
  try {
    const data = await service.getRoomDetail(req.params.MaDD, req.user);

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

// =========================
// NHẬN DỌN
// =========================
exports.acceptCleaning = async (req, res) => {
  try {
    const result = await service.acceptCleaning(req.params.MaDD, req.user);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

// =========================
// HOÀN THÀNH
// =========================
exports.finishCleaning = async (req, res) => {
  try {
    const result = await service.finishCleaning(req.params.MaDD, req.user);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

// =========================
// LỊCH SỬ
// =========================
exports.getHistory = async (req, res) => {
  try {
    const data = await service.getHistory(req.user);

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
exports.getServices = async (req, res) => {
  try {
    const data = await service.getServices(req.params.MaDD, req.user);

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
exports.saveServices = async (req, res) => {
  try {
    const result = await service.saveServices(
      req.params.MaDD,
      req.body.services,
      req.user,
    );

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
exports.startCleaning = async (req, res) => {
  try {
    const result = await service.startCleaning(req.params.MaDD, req.user);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

exports.getCompletedRooms = async (req, res) => {
  try {
    const data = await service.getCompletedRooms(req.user);

    res.json(data);
  } catch (err) {
    console.error("===== COMPLETED ERROR =====");
    console.error(err);

    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
exports.getChecklist = async (req, res) => {
  try {
    const data = await service.getChecklist(req.params.MaDD, req.user);

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
exports.updateChecklist = async (req, res) => {
  try {
    const result = await service.updateChecklist(
      req.params.MaCT,
      req.body.DaHoanThanh,
      req.user,
    );

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
exports.getChecklist = async (req, res) => {
  try {
    const data = await service.getChecklist(req.params.MaDD, req.user);

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

exports.updateChecklist = async (req, res) => {
  try {
    const result = await service.updateChecklist(
      req.params.MaCheck,
      req.body.DaHoanThanh,
      req.user,
    );

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
