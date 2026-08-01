const service = require("../services/quyenService");

exports.getAll = async (req, res) => {
  try {
    res.json(await service.getAll());
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
exports.getById = async (req, res) => {
  try {
    res.json(await service.getById(req.params.id));
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.create = async (req, res) => {
  try {
    res.json(await service.create(req.body));
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    res.json(await service.update(req.params.id, req.body));
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.remove = async (req, res) => {
  try {
    res.json(await service.remove(req.params.id));
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
