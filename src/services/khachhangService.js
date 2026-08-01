const model = require("../model/khachhangModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendOTPEmail } = require("./mailService");
const db = require("../config/db");

const {
  savePendingUser,
  getPendingUser,
  removePendingUser,
} = require("../utils/otpStore");

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// REGISTER → CHỈ GỬI OTP, CHƯA INSERT DB
exports.register = async (data) => {
  console.log("STEP 1");

  const exist = await model.findByEmail(data.Email);

  console.log("STEP 2");

  if (exist) {
    throw {
      status: 400,
      message: "Email đã tồn tại",
    };
  }

  const otp = generateOTP();
  const expire = Date.now() + 5 * 60 * 1000;

  console.log("STEP 3");

  const hash = await bcrypt.hash(data.MatKhau, 10);

  console.log("STEP 4");

  savePendingUser(data.Email, {
    ...data,
    MatKhau: hash,
    OTPCode: otp,
    OTPExpire: expire,
  });

  console.log("STEP 5");

  await sendOTPEmail(data.Email, otp);

  console.log("STEP 6");

  return {
    message: "OTP đã gửi",
  };
};
// VERIFY OTP → ĐÚNG MỚI INSERT DB
exports.verifyOTP = async (Email, OTPCode) => {
  const pendingUser = getPendingUser(Email);

  if (!pendingUser) {
    throw {
      status: 404,
      message: "Không tìm thấy yêu cầu đăng ký hoặc OTP đã hết hạn",
    };
  }

  if (Date.now() > pendingUser.OTPExpire) {
    removePendingUser(Email);

    throw {
      status: 400,
      message: "OTP đã hết hạn",
    };
  }

  if (pendingUser.OTPCode !== OTPCode) {
    throw {
      status: 400,
      message: "OTP không đúng",
    };
  }

  const MaKH = "KH" + Date.now();

  await model.create({
    MaKH,
    HoTenKH: pendingUser.HoTenKH,
    GioiTinh: pendingUser.GioiTinh,
    NgSinh: pendingUser.NgSinh,
    SDT: pendingUser.SDT,
    Email: pendingUser.Email,
    CCCD: pendingUser.CCCD,
    DiaChi: pendingUser.DiaChi,
    MatKhau: pendingUser.MatKhau,
  });

  removePendingUser(Email);

  return {
    message: "Đăng ký thành công",
  };
};

// RESEND OTP
exports.resendOTP = async (Email) => {
  const pendingUser = getPendingUser(Email);

  if (!pendingUser) {
    throw {
      status: 404,
      message: "Không tìm thấy yêu cầu đăng ký",
    };
  }

  const otp = generateOTP();
  const expire = Date.now() + 5 * 60 * 1000;

  pendingUser.OTPCode = otp;
  pendingUser.OTPExpire = expire;

  savePendingUser(Email, pendingUser);

  await sendOTPEmail(Email, otp);

  return {
    message: "OTP mới đã được gửi",
  };
};

// LOGIN
exports.login = async (Email, MatKhau) => {
  const user = await model.findByEmail(Email);

  if (!user) {
    throw {
      status: 404,
      message: "Không tìm thấy tài khoản",
    };
  }

  const ok = await bcrypt.compare(MatKhau, user.MatKhau);

  if (!ok) {
    throw {
      status: 401,
      message: "Sai mật khẩu",
    };
  }

  const token = jwt.sign(
    {
      MaKH: user.MaKH,
      role: "khachhang",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  return {
    token,
    user,
  };
};

// PROFILE
exports.getProfile = async (id) => {
  return await model.findById(id);
};

// UPDATE PROFILE
exports.updateProfile = async (id, data) => {
  await model.update(id, data);

  return {
    message: "Cập nhật thành công",
  };
};
exports.changePassword = async (
  id,
  oldPassword,
  newPassword,
  confirmPassword,
) => {
  const user = await model.findById(id);
  if (!user) {
    throw {
      status: 404,
      message: "Không tìm thấy tài khoản",
    };
  }
  const isMatch = await bcrypt.compare(oldPassword, user.MatKhau);
  if (!isMatch) {
    throw {
      status: 401,
      message: "Mật khẩu cũ không đúng",
    };
  }
  if (newPassword !== confirmPassword) {
    throw {
      status: 400,
      message: "Mật khẩu xác nhận không khớp",
    };
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await model.updatePassword(id, hash);
  return {
    message: "Đổi mật khẩu thành công",
  };
};
exports.forgotPassword = async (Email) => {
  const user = await model.findByEmail(Email);

  if (!user) {
    throw {
      status: 404,
      message: "Email không tồn tại",
    };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const expire = new Date(Date.now() + 5 * 60 * 1000);

  await model.updateOTP(Email, otp, expire);

  await sendOTPEmail(Email, otp);
  return {
    message: "OTP đã được gửi về email",
  };
};
exports.resetPassword = async (
  Email,
  OTPCode,
  newPassword,
  confirmPassword,
) => {
  const user = await model.findByEmail(Email);

  if (!user) {
    throw {
      status: 404,
      message: "Email không tồn tại",
    };
  }

  if (user.OTPCode !== OTPCode) {
    throw {
      status: 400,
      message: "OTP không đúng",
    };
  }

  if (new Date(user.OTPExpire) < new Date()) {
    throw {
      status: 400,
      message: "OTP đã hết hạn",
    };
  }

  if (newPassword !== confirmPassword) {
    throw {
      status: 400,
      message: "Mật khẩu xác nhận không khớp",
    };
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await model.updatePassword(user.MaKH, hash);

  await model.clearOTP(Email);

  return {
    message: "Đặt lại mật khẩu thành công",
  };
};

exports.getAll = async () => {
  const [rows] = await db.query(`
    SELECT
      MaKH,
      HoTenKH,
      Email,
      SDT,
      GioiTinh,
      NgSinh,
      DiaChi,
      NgayDK,
      LoaiKhach
    FROM khachhang
    ORDER BY NgayDK DESC
  `);

  return rows;
};

exports.getById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT *
    FROM khachhang
    WHERE MaKH = ?
    `,
    [id],
  );

  return rows[0];
};
exports.getMyBookings = async (MaKH) => {
  const conn = await model.getConnection();

  try {
    const [rows] = await model.getMyBookings(conn, MaKH);

    return rows;
  } finally {
    conn.release();
  }
};
