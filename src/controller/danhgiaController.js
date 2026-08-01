const service = require("../services/danhgiaService");

exports.getAll = async (req, res) => {
  try {
    res.json(await service.getAll());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getByLoaiPhong = async (req, res) => {
  try {
    res.json(await service.getByLoaiPhong(req.params.maLoai));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.create = async (req, res) => {
  try {
    res.json(await service.create(req.user, req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    res.json(await service.remove(req.params.id));
  } catch (err) {
    res
      .status(500)

      .json({
        message: err.message,
      });
  }
};

exports.getReviewableBookings = async (req, res) => {
  try {
    res.json(await service.getReviewableBookings(req.user));
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const data = await service.getSummary(req.params.maLoai);

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.hasReviewed = async (req, res) => {
  try {
    const result = await service.hasReviewed(req.user, req.params.maDP);

    res.json(result);
  } catch (err) {
    console.error("HAS REVIEW ERROR:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};
exports.getAllReviews = async (req, res) => {
  try {
    const data = await service.getAllReviews(req.query, req.user);

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

// =========================
// CHI TIẾT ĐÁNH GIÁ
// =========================
exports.getDetail = async (req, res) => {
  try {
    const data = await service.getDetail(req.params.MaDG, req.user);

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

// =========================
// ẨN ĐÁNH GIÁ
// =========================
exports.hideReview = async (req, res) => {
  try {
    const result = await service.hideReview(req.params.MaDG, req.user);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

// =========================
// THỐNG KÊ
// =========================
exports.getStatistic = async (req, res) => {
  try {
    const data = await service.getStatistic(req.user);

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
