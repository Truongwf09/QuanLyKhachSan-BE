const db = require("../config/db");

exports.getAll = () => {
    return db.query("SELECT * FROM QUANTRIVIEN");
};

exports.getByBranch = (MaCN) => {
    return db.query("SELECT * FROM QUANTRIVIEN WHERE MaCN = ?", [MaCN]);
};

exports.create = (data) => {
    const { MaQTV, HoTen, Email, MatKhau, MaCV, MaCN } = data;

    return db.query(
        "INSERT INTO QUANTRIVIEN VALUES (?, ?, ?, ?, ?, ?)",
        [MaQTV, HoTen, Email, MatKhau, MaCV, MaCN]
    );
};

exports.update = (MaQTV, data) => {
    const { HoTen, Email, MaCV, MaCN } = data;

    return db.query(
        "UPDATE QUANTRIVIEN SET HoTen=?, Email=?, MaCV=?, MaCN=? WHERE MaQTV=?",
        [HoTen, Email, MaCV, MaCN, MaQTV]
    );
};

exports.remove = (MaQTV) => {
    return db.query("DELETE FROM QUANTRIVIEN WHERE MaQTV=?", [MaQTV]);
};
exports.changeStatus = (MaQTV, TrangThai) => {
    return db.query("UPDATE QUANTRIVIEN SET TrangThai=? WHERE MaQTV=?", [TrangThai, MaQTV]);
}
exports.getProfile = async (MaQTV) => {

    const [rows] = await db.query(`
        SELECT
            qtv.MaQTV,
            qtv.HoTen,
            qtv.GioiTinh,
            qtv.NgSinh,
            qtv.SDT,
            qtv.Email,
            qtv.DiaChi,
            qtv.TrangThai,

            cv.MaCV,
            cv.TenCV,

            cn.MaCN,
            cn.TenCN

        FROM quantrivien qtv

        LEFT JOIN chucvu cv
            ON qtv.MaCV = cv.MaCV

        LEFT JOIN chinhanh cn
            ON qtv.MaCN = cn.MaCN

        WHERE qtv.MaQTV = ?
    `, [MaQTV]);

    return rows[0];
};