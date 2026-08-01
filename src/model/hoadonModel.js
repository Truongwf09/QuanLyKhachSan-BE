const db = require('../config/db');
exports.getById = async (MaHD) => {

    const [rows] = await db.query(
        `
        SELECT
            hd.MaHD,
            hd.TongTienPhong,
            hd.TongTienDV,
            hd.ThanhTien,
            hd.TrangThai,
            hd.SoTienDaThu,
            ct.NgayNhanPhong,
            ct.NgayTraPhong,
            pp.NgayCheckIn,
            pp.NgayCheckOut,
            p.GiaTheoGio
        FROM hoadon hd
        JOIN chitiet_dp ct ON ct.MaDP = hd.MaDP
        JOIN phanphong pp ON pp.MaCTDP = ct.MaCTDP
        JOIN phong p ON p.MaPhong = pp.MaPhong
        WHERE hd.MaHD = ?
        `,
        [MaHD]
    );

    return rows[0];
};
exports.updateSoTienDaThu = async (MaHD, SoTienDaThu) => {
    await db.query(
        `
        UPDATE hoadon
        SET SoTienDaThu = ?
        WHERE MaHD = ?
        `,
        [SoTienDaThu, MaHD]
    );
};
