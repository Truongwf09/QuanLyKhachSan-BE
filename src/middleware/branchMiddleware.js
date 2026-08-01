exports.checkBranchPermission = (req, res, next) => {
  const user = req.user;

  // admin full quyền
  if (user.role === "admin") return next();

  // chỉ quản lý mới được tiếp tục
  if (user.role !== "quanly") {
    return res.status(403).json({
      message: "Bạn không có quyền",
    });
  }

  const targetMaCN = req.body.MaCN || req.params.MaCN;

  // nếu không gửi MaCN → reject
  if (!targetMaCN) {
    return res.status(400).json({
      message: "Thiếu MaCN",
    });
  }

  // kiểm tra chi nhánh
  if (user.MaCN !== targetMaCN) {
    return res.status(403).json({
      message: "Chỉ được thao tác trong chi nhánh của bạn",
    });
  }

  next();
};
