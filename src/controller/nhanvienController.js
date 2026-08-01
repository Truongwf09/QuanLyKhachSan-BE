const bcrypt = require("bcrypt");
const db = require("../config/db");
const service = require("../services/nhanvienService");
// ================= GET ALL =================
exports.getAll = async (req, res) => {
  try {
    const { role, MaCN } = req.user || {};

    let query = `
      SELECT 
        qtv.MaQTV,
        qtv.HoTen,
        qtv.Email,
        qtv.SDT,
        qtv.GioiTinh,
        qtv.NgSinh,
        qtv.DiaChi,
        qtv.MaCN,
        qtv.MaCV,
        qtv.TrangThai,
        cn.TenCN,
        cv.TenCV
      FROM quantrivien qtv
      LEFT JOIN chinhanh cn ON qtv.MaCN = cn.MaCN
      LEFT JOIN chucvu cv ON qtv.MaCV = cv.MaCV
    `;

    let params = [];

    if (role === "quanly") {
      query += ` WHERE qtv.MaCN = ? AND qtv.MaCV IN ('CV02', 'CV04' )`;
      params.push(MaCN);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi getAll nhân viên:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= CREATE =================
exports.create = async (req, res) => {
  try {
    const { role, MaCN } = req.user || {};

    const {
      HoTen,
      Email,
      SDT,
      GioiTinh,
      NgSinh,
      DiaChi,
      MaCN: bodyMaCN,
      MaCV,
    } = req.body;

    if (!HoTen || !Email || !bodyMaCN || !MaCV) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    if (role === "quanly") {
      const allowedRoles = ["CV02", "CV04"];
      if (bodyMaCN !== MaCN || !allowedRoles.includes(MaCV)) {
        return res.status(403).json({
          message: "Chỉ được tạo lễ tân hoặc nhân viên dọn phòng",
        });
      }
    }

    // ✅ FIX: Tự sinh MaQTV dạng QTV01, QTV02, ...
    const [lastRow] = await db.query(
      "SELECT MaQTV FROM quantrivien ORDER BY MaQTV DESC LIMIT 1",
    );

    let newMaQTV = "QTV01";
    if (lastRow.length > 0) {
      const lastMa = lastRow[0].MaQTV; // VD: "QTV06"
      const lastNum = parseInt(lastMa.replace("QTV", ""), 10);
      const nextNum = lastNum + 1;
      newMaQTV = "QTV" + String(nextNum).padStart(2, "0");
    }

    const hashed = await bcrypt.hash("123456", 10);

    await db.query(
      `
      INSERT INTO quantrivien
      (MaQTV, HoTen, Email, SDT, GioiTinh, NgSinh, DiaChi, MatKhau, MaCV, MaCN, TrangThai)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `,
      [
        newMaQTV,
        HoTen,
        Email,
        SDT,
        GioiTinh,
        NgSinh,
        DiaChi,
        hashed,
        MaCV,
        bodyMaCN,
      ],
    );

    res.json({
      message: "Thêm thành công",
      MaQTV: newMaQTV,
      defaultPassword: "123456",
    });
  } catch (err) {
    console.error("❌ Lỗi create nhân viên:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= UPDATE =================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const { HoTen, Email, SDT, GioiTinh, NgSinh, DiaChi, MaCV } = req.body;

    await db.query(
      `
      UPDATE quantrivien 
      SET HoTen=?, Email=?, SDT=?, GioiTinh=?, NgSinh=?, DiaChi=?, MaCV=?
      WHERE MaQTV=?
    `,
      [HoTen, Email, SDT, GioiTinh, NgSinh, DiaChi, MaCV, id],
    );

    res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    console.error("❌ Lỗi update:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= DELETE =================
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "undefined") {
      return res.status(400).json({ message: "MaQTV không hợp lệ" });
    }

    await db.query("UPDATE quantrivien SET TrangThai=0 WHERE MaQTV=?", [id]);

    res.json({ message: "Đã khóa tài khoản" });
  } catch (err) {
    console.error("❌ Lỗi delete:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const newPass = "123456";
    const hashed = await bcrypt.hash(newPass, 10);

    await db.query("UPDATE quantrivien SET MatKhau=? WHERE MaQTV=?", [
      hashed,
      id,
    ]);
    const [rows] = await db.query(
      "SELECT TrangThai FROM quantrivien WHERE MaQTV=?",
      [id],
    );

    if (rows[0].TrangThai == 0) {
      return res.status(400).json({
        message: "Nhân viên đã nghỉ việc.",
      });
    }
    res.json({ message: "Reset thành công", newPassword: newPass });
  } catch (err) {
    console.error("❌ Lỗi reset password:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= TOGGLE STATUS =================
exports.toggleStatus = async (req, res) => {
  try {
    const { role } = req.user;
    const { id } = req.params;

    if (role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const [rows] = await db.query(
      "SELECT TrangThai FROM quantrivien WHERE MaQTV=?",
      [id],
    );
    if (req.user.MaQTV === id) {
      return res
        .status(400)
        .json({ message: "Không thể thay đổi trạng thái của chính mình" });
    }
    const newStatus = rows[0].TrangThai === 1 ? 0 : 1;

    await db.query("UPDATE quantrivien SET TrangThai=? WHERE MaQTV=?", [
      newStatus,
      id,
    ]);

    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= CHANGE PASSWORD =================
exports.changePassword = async (req, res) => {
  try {
    const { MaQTV } = req.user;
    const { oldPassword, newPassword } = req.body;

    const [rows] = await db.query(
      "SELECT MatKhau FROM quantrivien WHERE MaQTV=?",
      [MaQTV],
    );

    const match = await bcrypt.compare(oldPassword, rows[0].MatKhau);

    if (!match) {
      return res.status(400).json({ message: "Sai mật khẩu" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query("UPDATE quantrivien SET MatKhau=? WHERE MaQTV=?", [
      hashed,
      MaQTV,
    ]);

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.changeStatus = async (req, res) => {
  try {
    const data = await service.changeStatus(
      req.params.MaNV,
      req.body.TrangThai,
    );

    res.json(data);
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};
exports.getProfile = async (req, res) => {
  try {
    console.log(req.user);

    const MaQTV = req.user.MaQTV;

    console.log("MaQTV =", MaQTV);

    const data = await service.getProfile(MaQTV);

    res.json(data);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
module.exports = exports;
