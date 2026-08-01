const db = require("../config/db");

// tìm email
exports.findByEmail = async (Email) => {
    const [rows] = await db.query(
        "SELECT * FROM khachhang WHERE Email = ?",
        [Email]
    );

    return rows[0];
};

// tạo khách hàng thật
exports.create = async (data) => {
    const {
        MaKH,
        HoTenKH,
        GioiTinh,
        NgSinh,
        SDT,
        Email,
        CCCD,
        DiaChi,
        MatKhau
    } = data;

    await db.query(`
        INSERT INTO khachhang (
            MaKH,
            HoTenKH,
            GioiTinh,
            NgSinh,
            SDT,
            Email,
            CCCD,
            DiaChi,
            NgayDK,
            LoaiKhach,
            MatKhau
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'Thường', ?)
    `, [
        MaKH,
        HoTenKH,
        GioiTinh,
        NgSinh,
        SDT,
        Email,
        CCCD,
        DiaChi,
        MatKhau
    ]);
};

// tìm theo id
exports.findById = async (id) => {
    const [rows] = await db.query(
        "SELECT * FROM khachhang WHERE MaKH = ?",
        [id]
    );

    return rows[0];
};

// update profile
exports.update = async (id, data) => {
    const {
        HoTenKH,
        SDT,
        DiaChi,
        GioiTinh,
        NgSinh
    } = data;

    await db.query(`
        UPDATE khachhang
        SET
            HoTenKH = ?,
            SDT = ?,
            DiaChi = ?,
            GioiTinh = ?,
            NgSinh = ?
        WHERE MaKH = ?
    `, [
        HoTenKH,
        SDT,
        DiaChi,
        GioiTinh,
        NgSinh,
        id
    ]);
};
exports.updatePassword = async (id, MatKhau) => {
    await db.query(`
        UPDATE khachhang
        SET MatKhau = ?
        WHERE MaKH = ?
    `, [
        MatKhau,
        id
    ]);
};
exports.updateOTP = async (
    Email,
    OTPCode,
    OTPExpire
) => {

    await db.query(`
        UPDATE khachhang
        SET
            OTPCode = ?,
            OTPExpire = ?
        WHERE Email = ?
    `, [
        OTPCode,
        OTPExpire,
        Email
    ]);
};
exports.clearOTP = async (
    Email
) => {

    await db.query(`
        UPDATE khachhang
        SET
            OTPCode = NULL,
            OTPExpire = NULL
        WHERE Email = ?
    `, [
        Email
    ]);
};
