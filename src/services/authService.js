const jwt = require("jsonwebtoken");
const db = require("../config/db");
const bcrypt = require("bcrypt");

const mapRole = (MaCV) => {
  if (MaCV === "CV01") return "admin";
  if (MaCV === "CV03") return "quanly";
  if (MaCV === "CV04") return "don_dep";
  if (MaCV === "CV05") return "ke_toan";
  return "tiep_tan";
};

exports.login = async ({ email, password }) => {
  console.log("email =", email);
  console.log("password =", password);

  const [rows] = await db.query(
    `
        SELECT
            qtv.*,
            q.MaQuyen
        FROM quantrivien qtv

        LEFT JOIN chucvu_quyen cvq
            ON cvq.MaCV = qtv.MaCV

        LEFT JOIN quyen q
            ON q.MaQuyen = cvq.MaQuyen

        WHERE qtv.Email = ?
    `,
    [email],
  );

  if (rows.length === 0) {
    throw {
      status: 404,
      message: "Không tìm thấy tài khoản",
    };
  }

  const user = rows[0];

  const match = await bcrypt.compare(password, user.MatKhau);

  if (!match) {
    throw {
      status: 401,
      message: "Sai mật khẩu",
    };
  }

  if (user.TrangThai != 1) {
    throw {
      status: 403,
      message: "Nhân viên đã nghỉ việc. Tài khoản đã bị khóa.",
    };
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET chưa được cấu hình");
  }

  const role = mapRole(user.MaCV);

  // Gom tất cả quyền
  const permissions = [
    ...new Set(rows.map((item) => item.MaQuyen).filter(Boolean)),
  ];

  const token = jwt.sign(
    {
      MaQTV: user.MaQTV,
      role,
      MaCN: user.MaCN,
      permissions,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  return {
    token,
    role,
    user: {
      MaQTV: user.MaQTV,
      HoTen: user.HoTen,
      Email: user.Email,
      MaCN: user.MaCN,
      TrangThai: user.TrangThai,
      role,
      permissions,
    },
  };
};
