const db = require("../config/db");

exports.getAll = () => db.query("SELECT * FROM chinhanh");

exports.getAllPublic = () =>
  db.query("SELECT * FROM chinhanh WHERE TrangThai = 'hoạt động'");

exports.create = ({ MaCN, TenCN, DiaChi, MoTa, TrangThai }) =>
  db.query(
    "INSERT INTO chinhanh (MaCN, TenCN, DiaChi, MoTa, TrangThai) VALUES (?, ?, ?, ?, ?)",
    [MaCN, TenCN, DiaChi, MoTa, TrangThai],
  );

exports.update = (MaCN, { TenCN, DiaChi, MoTa, TrangThai }) =>
  db.query(
    "UPDATE chinhanh SET TenCN = ?, DiaChi = ?, MoTa = ?, TrangThai = ? WHERE MaCN = ?",
    [TenCN, DiaChi, MoTa, TrangThai, MaCN],
  );

exports.remove = (MaCN) => db.query("DELETE FROM chinhanh WHERE MaCN = ?", [MaCN]);

exports.getLastCode = async () => {
  const [rows] = await db.query(`
    SELECT MaCN FROM chinhanh
    ORDER BY CAST(SUBSTRING(MaCN, 3) AS UNSIGNED) DESC
    LIMIT 1
  `);
  return rows[0] || null;
};

exports.getStatus = async (MaCN) => {
  const [rows] = await db.query(
    "SELECT TrangThai FROM chinhanh WHERE MaCN = ?",
    [MaCN],
  );
  return rows[0] || null;
};

exports.updateStatus = (MaCN, TrangThai) =>
  db.query("UPDATE chinhanh SET TrangThai = ? WHERE MaCN = ?", [TrangThai, MaCN]);
