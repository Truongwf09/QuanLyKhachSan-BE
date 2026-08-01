const logService = require("../services/logService");

exports.getLogs = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Không có quyền" });
  }

  try {
    res.json(await logService.getLogs());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
