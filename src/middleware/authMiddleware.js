const jwt = require("jsonwebtoken");
exports.verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token");

    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
};

exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.log("ROLE BACKEND:", req.user.role);
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
exports.authorize =
  (roles = []) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Không có quyền",
      });
    }

    next();
  };
