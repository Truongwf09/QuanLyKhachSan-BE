const service = require("../services/khachhangService");

// REGISTER → gửi OTP
exports.register = async (req, res) => {
  try {
    const result = await service.register(req.body);

    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

// VERIFY OTP → tạo tài khoản thật
exports.verifyOTP = async (req, res) => {
  try {
    const { Email, OTPCode } = req.body;

    const result = await service.verifyOTP(Email, OTPCode);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

// RESEND OTP
exports.resendOTP = async (req, res) => {
  try {
    const { Email } = req.body;

    const result = await service.resendOTP(Email);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { Email, MatKhau } = req.body;

    const result = await service.login(Email, MatKhau);

    res.json({
      token: result.token,
      user: {
        MaKH: result.user.MaKH,
        HoTenKH: result.user.HoTenKH,
        Email: result.user.Email,
        role: "khachhang",
      },
    });
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

// PROFILE
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.MaKH || req.user.id;

    if (!userId) {
      return res.status(401).json({
        message: "Token lỗi",
      });
    }

    const data = await service.getProfile(userId);

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.MaKH || req.user.id;

    if (!userId) {
      return res.status(401).json({
        message: "Token lỗi",
      });
    }

    const result = await service.updateProfile(userId, req.body);

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.MaKH || req.user.id;

    if (!userId) {
      return res.status(401).json({
        message: "Token lỗi",
      });
    }

    const { oldPassword, newPassword, confirmPassword } = req.body;

    const result = await service.changePassword(
      userId,
      oldPassword,
      newPassword,
      confirmPassword,
    );

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const result = await service.forgotPassword(req.body.Email);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const result = await service.resetPassword(
      req.body.Email,
      req.body.OTPCode,
      req.body.newPassword,
      req.body.confirmPassword,
    );

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const data = await service.getAll();

    res.json(data);
  } catch (err) {
    console.log(err);

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
