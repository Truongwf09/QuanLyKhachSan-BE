exports.checkPermission =
  (...permissions) =>
  (req, res, next) => {
    console.log(req.user);

    // ADMIN bỏ qua
    if (req.user.role === "admin") {
      return next();
    }

    const userPermissions = req.user.permissions || [];

    const ok = permissions.every((p) => userPermissions.includes(p));

    if (!ok) {
      return res.status(403).json({
        message: "Không có quyền",
      });
    }

    next();
  };
