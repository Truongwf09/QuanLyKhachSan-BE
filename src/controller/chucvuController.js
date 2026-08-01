const service = require("../services/chucvuService");
exports.getAll = async (req, res) => {
  try {
    const { role } = req.user;

    let data = await service.getAll();
    if (role === "quanly") {
      data = data.filter((cv) => cv.MaCV === "CV02" || cv.MaCV === "CV04");
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await service.getById(req.params.id);

    res.json(data);
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
exports.getPermissions = async (req, res) => {
  try {
    res.json(await service.getPermissions(req.params.id));
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.assignPermissions = async (req, res) => {
  try {
    res.json(
      await service.assignPermissions(req.params.id, req.body.permissions),
    );
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
exports.changeStatus = async (req, res) => {
  try {
    const data = await service.changeStatus(
      req.params.MaCV,
      req.body.TrangThai,
    );
    res.json(data);
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};
