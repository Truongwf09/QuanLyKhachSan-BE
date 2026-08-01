const service = require("../services/dichvuService");

/* =========================
   GET ALL
========================= */

exports.getAll = async (req, res) => {
  try {
    const data = await service.getAll(req.user, req.query.MaCN);

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
/* =========================
   GET DETAIL
========================= */

exports.getById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Không có quyền truy cập",
      });
    }

    const data = await service.getById(req.params.id, req.user);

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

exports.getPublic = async (req, res) => {
  try {
    const data = await service.getPublic(req.query.MaCN);
    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================
   CREATE
========================= */

exports.create = async (req, res) => {
  try {
    const result = await service.create(req.body, req.user);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* =========================
   UPDATE
========================= */

exports.update = async (req, res) => {
  try {
    const result = await service.update(req.params.id, req.body, req.user);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

/* =========================
   DELETE
========================= */

exports.remove = async (req, res) => {
  try {
    const result = await service.remove(req.params.id, req.user);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
exports.hide = async (req, res) => {
  try {
    const result = await service.hide(req.params.id, req.user);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
exports.show = async (req, res) => {
  try {
    const result = await service.show(req.params.id, req.user);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
exports.getActive = async (req, res) => {
  try {
    const data = await service.getActive(req.user);

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
