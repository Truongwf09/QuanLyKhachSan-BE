const service = require("../services/hoadonService");

exports.getAll = async (req, res) => {
  try {
    if (!["admin", "quanly", "tiep_tan"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Không có quyền",
      });
    }

    const data = await service.getAll(req.user);

    res.json(data);
  } catch (err) {
    console.error("HOADON ERROR:", err);
    res.status(500).json({
      message: err.message,
    });
  }
};
exports.thongKeTongDoanhThu = async (req, res) => {
  try {
    const data = await service.thongKeTongDoanhThu();

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.thongKeTheoChiNhanh = async (req, res) => {
  try {
    const data = await service.thongKeTheoChiNhanh();

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.thongKeNgay = async (req, res) => {
  try {
    const data = await service.thongKeNgay(req.query.date);

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.thongKeThang = async (req, res) => {
  try {
    const data = await service.thongKeThang(req.query.month, req.query.year);

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.thongKeNam = async (req, res) => {
  try {
    const data = await service.thongKeNam(req.query.year);

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
exports.getById = async (req, res) => {
  try {
    const data = await service.getById(req.user, req.params.id);

    res.json(data);
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};
exports.addService = async (req, res) => {
  try {
    const data = await service.addService(req.user, req.params.id, req.body);

    res.json(data);
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};
exports.collectMoney = async (req, res) => {
  try {
    const result = await service.collectMoney(
      req.params.MaHD,
      req.body.soTienNhan,
    );

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
