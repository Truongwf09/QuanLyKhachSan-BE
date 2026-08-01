const db = require("../config/db");

exports.getConnection = async () => {
    return await db.getConnection();
};

/* =========================
   ROOM / BOOKING CHECK
========================= */

exports.getRoomType = async (conn, MaLoai, MaCN) => {
    return await conn.query(`
        SELECT *
        FROM loaiphong lp
        JOIN chinhanh_loaiphong clp
            ON clp.MaLoai = lp.MaLoai
        WHERE lp.MaLoai = ?
        AND clp.MaCN = ?
    `, [MaLoai, MaCN]);
};

exports.getRoom = async (conn, MaPhong, MaLoai, MaCN) => {
    return await conn.query(`
        SELECT
            p.*,
            lp.TenLoai,
            lp.MoTa,
            lp.SoNguoiToiDa,
            lp.HinhAnh
        FROM phong p
        JOIN loaiphong lp
            ON p.MaLoai = lp.MaLoai
        WHERE p.MaPhong = ?
        AND p.MaLoai = ?
        AND p.MaCN = ?
        AND p.TinhTrangPhong != 'bảo trì'
    `, [MaPhong, MaLoai, MaCN]);
};

exports.checkDuplicateCustomerBooking = async (conn, MaKH, finalNgayNhan, finalNgayTra) => {
    return await conn.query(`
        SELECT ct.MaCTDP
        FROM chitiet_dp ct
        JOIN phieudatphong dp
            ON ct.MaDP = dp.MaDP
        WHERE dp.MaKH = ?
        AND dp.TrangThai NOT IN (
            'đã hủy',
            'trả phòng'
        )
        AND ct.NgayNhanPhong < ?
        AND ct.NgayTraPhong > ?
    `, [MaKH, finalNgayTra, finalNgayNhan]);
};

exports.checkDuplicateRoomBooking = async (conn, MaPhong, finalNgayNhan, finalNgayTra) => {
    return await conn.query(`
        SELECT pp.MaPP
        FROM phanphong pp
        JOIN chitiet_dp ct
            ON pp.MaCTDP = ct.MaCTDP
        WHERE pp.MaPhong = ?
        AND pp.TrangThai NOT IN (
            'đã hủy',
            'trả phòng'
        )
        AND ct.NgayNhanPhong < ?
        AND ct.NgayTraPhong > ?
    `, [MaPhong, finalNgayTra, finalNgayNhan]);
};

/* =========================
   CREATE BOOKING
========================= */

exports.createBooking = async (conn, MaDP, finalLoaiDat, SoGio, MaKH) => {
    return await conn.query(`
        INSERT INTO phieudatphong(
            MaDP,
            TrangThai,
            LoaiDat,
            SoGio,
            GhiChu,
            MaKH,
            MaQTV
        )
        VALUES(
            ?,
            'chưa xác nhận',
            ?,
            ?,
            NULL,
            ?,
            NULL
        )
    `, [MaDP, finalLoaiDat, finalLoaiDat === "theo giờ" ? SoGio : null, MaKH]);
};

exports.createBookingDetail = async (conn, MaCTDP, finalNgayNhan, finalNgayTra, SoNguoi, MaDP, MaLoai) => {
    return await conn.query(`
        INSERT INTO chitiet_dp(
            MaCTDP,
            NgayNhanPhong,
            NgayTraPhong,
            SoNguoi,
            SoPhong,
            TrangThaiPhong,
            MaDP,
            MaLoai
        )
        VALUES(
            ?,
            ?,
            ?,
            ?,
            1,
            'đã đặt',
            ?,
            ?
        )
    `, [MaCTDP, finalNgayNhan, finalNgayTra, SoNguoi, MaDP, MaLoai]);
};

exports.createPhanPhong = async (conn, MaPP, MaPhong, MaCTDP) => {
    return await conn.query(`
        INSERT INTO phanphong(
            MaPP,
            TrangThai,
            NgayCheckIn,
            NgayCheckOut,
            MaPhong,
            MaCTDP
        )
        VALUES(
            ?,
            'chờ xác nhận',
            NULL,
            NULL,
            ?,
            ?
        )
    `, [MaPP, MaPhong, MaCTDP]);
};

/* =========================
   SERVICES
========================= */

exports.getService = async (conn, MaDV, MaCN) => {
    return await conn.query(`
        SELECT *
        FROM dichvu
        WHERE MaDV = ?
        AND MaCN = ?
    `, [MaDV, MaCN]);
};

exports.createServiceDetail = async (conn, data) => {
    return await conn.query(`
        INSERT INTO chitiet_dv(
            MaCTDV,
            SoLuong,
            DonGia,
            NgaySuDung,
            MaDP,
            MaDV
        )
        VALUES(
            ?,
            ?,
            ?,
            NOW(),
            ?,
            ?
        )
    `, [data.MaCTDV, data.SoLuong, data.DonGia, data.MaDP, data.MaDV]);
};

/* =========================
   INVOICE
========================= */

exports.createInvoice = async (conn, invoice) => {
    return await conn.query(`
        INSERT INTO hoadon(
            MaHD,
            SoDem,
            TongTienPhong,
            TongTienDV,
            ThanhTien,
            TrangThai,
            PhuongThucTT,
            PaymentRef,
            MaDP
        )
        VALUES(
            ?,
            ?,
            ?,
            ?,
            ?,
            'chưa thanh toán',
            ?,
            NULL,
            ?
        )
    `, [invoice.MaHD, invoice.SoDem, invoice.TongTienPhong, invoice.TongTienDV, invoice.ThanhTien, invoice.PhuongThucTT, invoice.MaDP]);
};

exports.markInvoiceExpired = async (conn, MaDP) => {
    return await conn.query(`
        UPDATE hoadon
        SET TrangThai = 'quá hạn'
        WHERE MaDP = ?
        AND TrangThai = 'chưa thanh toán'
    `, [MaDP]);
};

exports.markInvoicePaid = async (conn, MaDP) => {
    return await conn.query(`
        UPDATE hoadon
        SET
            TrangThai = 'đã thanh toán',
            NgayThanhToan = NOW()
        WHERE MaDP = ?
        AND TrangThai = 'chưa thanh toán'
    `, [MaDP]);
};

/* =========================
   GET ALL BOOKINGS
========================= */

exports.getPendingBookings = async (conn, user) => {
    let whereClause = `
        WHERE dp.TrangThai = 'chưa xác nhận'
    `;

    const params = [];

    if (
        user.role !== "admin" &&
        user.MaCN
    ) {
        whereClause += `
            AND p.MaCN = ?
        `;
        params.push(user.MaCN);
    }

    return await conn.query(`
        SELECT
            dp.MaDP,
            dp.NgayDat,
            dp.TrangThai,
            dp.LoaiDat,
            dp.SoGio,
            dp.GhiChu,

            kh.MaKH,
            kh.HoTenKH,
            kh.Email,
            kh.SDT,

            ct.MaCTDP,
            ct.NgayNhanPhong,
            ct.NgayTraPhong,
            ct.SoNguoi,

            p.MaPhong,
            p.SoPhong,
            p.Tang,
            p.MaCN,
            p.GiaPhong,
            p.GiaTheoGio,
            p.GiaQuaDem,

            lp.MaLoai,
            lp.TenLoai,
            lp.SoNguoiToiDa,
            lp.HinhAnh,

            hd.MaHD,
            hd.SoDem,
            hd.TongTienPhong,
            hd.TongTienDV,
            hd.ThanhTien,
            hd.TrangThai AS TrangThaiHoaDon,
            hd.PhuongThucTT

        FROM phieudatphong dp
        JOIN khachhang kh
            ON dp.MaKH = kh.MaKH
        JOIN chitiet_dp ct
            ON dp.MaDP = ct.MaDP
        JOIN phanphong pp
            ON ct.MaCTDP = pp.MaCTDP
        JOIN phong p
            ON pp.MaPhong = p.MaPhong
        JOIN loaiphong lp
            ON ct.MaLoai = lp.MaLoai
        LEFT JOIN hoadon hd
            ON dp.MaDP = hd.MaDP
        ${whereClause}
        ORDER BY dp.NgayDat DESC
    `, params);
};

exports.getBookingServices = async (conn, MaDP) => {
    return await conn.query(`
        SELECT
            dv.MaDV,
            dv.TenDV,
            ctdv.SoLuong,
            ctdv.DonGia
        FROM chitiet_dv ctdv
        JOIN dichvu dv
            ON ctdv.MaDV = dv.MaDV
        WHERE ctdv.MaDP = ?
    `, [MaDP]);
};

/* =========================
   BOOKING DETAIL
========================= */

exports.getBookingByCTDP = async (conn, MaCTDP) => {
    return await conn.query(`
        SELECT
            ct.MaCTDP,
            ct.MaDP,
            ct.NgayNhanPhong,
            ct.NgayTraPhong,

            dp.TrangThai,
            dp.LoaiDat,
            dp.SoGio,

            kh.HoTenKH,
            kh.Email,

            pp.MaPP,
            pp.TrangThai AS TrangThaiPhanPhong

        FROM chitiet_dp ct
        JOIN phieudatphong dp
            ON ct.MaDP = dp.MaDP
        JOIN khachhang kh
            ON dp.MaKH = kh.MaKH
        JOIN phanphong pp
            ON ct.MaCTDP = pp.MaCTDP
        WHERE ct.MaCTDP = ?
    `, [MaCTDP]);
};

exports.getBookingByPP = async (conn, MaPP) => {
    return await conn.query(`
        SELECT
            pp.MaPP,
            pp.MaPhong,
            pp.TrangThai AS TrangThaiPhanPhong,

            ct.MaCTDP,
            ct.NgayNhanPhong,
            ct.NgayTraPhong,

            dp.MaDP,
            dp.TrangThai,

            p.GiaTheoGio

        FROM phanphong pp
        JOIN chitiet_dp ct
            ON pp.MaCTDP = ct.MaCTDP
        JOIN phieudatphong dp
            ON ct.MaDP = dp.MaDP
        JOIN phong p
            ON pp.MaPhong = p.MaPhong
        WHERE pp.MaPP = ?
    `, [MaPP]);
};

/* =========================
   STATUS UPDATE
========================= */

exports.confirmBooking = async (conn, MaDP, MaQTV) => {
    return await conn.query(`
        UPDATE phieudatphong
        SET
            TrangThai = 'đã xác nhận',
            MaQTV = ?
        WHERE MaDP = ?
    `, [
        MaQTV,
        MaDP
    ]);
};

exports.confirmPhanPhong = async (conn, MaCTDP) => {
    return await conn.query(`
        UPDATE phanphong
        SET TrangThai = 'đã giữ phòng'
        WHERE MaCTDP = ?
    `, [MaCTDP]);
};

exports.cancelBooking = async (conn, MaDP, reason, MaQTV) => {
    return await conn.query(`
        UPDATE phieudatphong
        SET
            TrangThai = 'đã hủy',
            GhiChu = ?,
            MaQTV = ?
        WHERE MaDP = ?
    `, [reason, MaQTV, MaDP]);
};

exports.cancelPhanPhong = async (conn, MaCTDP) => {
    return await conn.query(`
        UPDATE phanphong
        SET TrangThai = 'đã hủy'
        WHERE MaCTDP = ?
    `, [MaCTDP]);
};

exports.checkIn = async (conn, MaPP, MaPhong, MaDP, MaCTDP) => {
    await conn.query(`
        UPDATE phanphong
        SET
            TrangThai = 'đang ở',
            NgayCheckIn = NOW()
        WHERE MaPP = ?
    `, [MaPP]);

    await conn.query(`
        UPDATE phong
        SET TinhTrangPhong = 'đang sử dụng'
        WHERE MaPhong = ?
    `, [MaPhong]);

    await conn.query(`
        UPDATE phieudatphong
        SET TrangThai = 'đã nhận phòng'
        WHERE MaDP = ?
    `, [MaDP]);

    await conn.query(`
        UPDATE chitiet_dp
        SET TrangThaiPhong = 'đã nhận phòng'
        WHERE MaCTDP = ?
    `, [MaCTDP]);
};

exports.checkOut = async (conn, MaPP, MaPhong, MaDP, MaCTDP, checkOutAt) => {
    await conn.query(`
        UPDATE phanphong
        SET
            TrangThai = 'trả phòng',
            NgayCheckOut = ?
        WHERE MaPP = ?
    `, [checkOutAt, MaPP]);

    await conn.query(`
        UPDATE phong
        SET TinhTrangPhong = 'đang dọn dẹp'
        WHERE MaPhong = ?
    `, [MaPhong]);

    await conn.query(`
        UPDATE phieudatphong
        SET TrangThai = 'trả phòng'
        WHERE MaDP = ?
    `, [MaDP]);

    await conn.query(`
        UPDATE chitiet_dp
        SET TrangThaiPhong = 'trả phòng'
        WHERE MaCTDP = ?
    `, [MaCTDP]);
};
exports.createCleaningJob = async (conn, MaDD, MaPhong) => {

    // Kiểm tra phòng đã có công việc dọn chưa
    const [[exists]] = await conn.query(`
        SELECT MaDD
        FROM DONDEP
        WHERE MaPhong = ?
          AND TrangThaiDD IN ('chờ nhận', 'đang dọn')
        LIMIT 1
    `, [MaPhong]);

    if (exists) {
        return;
    }

    // Tạo đơn dọn phòng
    await conn.query(`
        INSERT INTO DONDEP (
            MaDD,
            MaPhong,
            MaQTV,
            TrangThaiDD,
            ThoiGianNhan,
            ThoiGianHoanThanh,
            GhiChu
        )
        VALUES (
            ?,
            ?,
            NULL,
            'chờ nhận',
            NULL,
            NULL,
            NULL
        )
    `, [MaDD, MaPhong]);

    // Lấy checklist mẫu
    const [rows] = await conn.query(`
        SELECT
            MaMau
        FROM CHECKLIST_MAU
        WHERE
            TrangThai = 1
            AND LoaiChecklist = 'DON_PHONG'
        ORDER BY STT
    `);

    // Sinh checklist cho đơn dọn
    for (const row of rows) {

        const maCheck = "CK" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);

        await conn.query(`
            INSERT INTO CHECKLIST_DONDEP
            (
                MaCheck,
                MaDD,
                MaMau,
                DaHoanThanh
            )
            VALUES
            (
                ?,
                ?,
                ?,
                0
            )
        `, [maCheck, MaDD, row.MaMau]);
    }
};

exports.getBookingDetail = async (conn, MaCTDP) => {
    return await conn.query(`
        SELECT
            dp.*,

            kh.MaKH,
            kh.HoTenKH,
            kh.Email,
            kh.SDT,

            ct.MaCTDP,
            ct.NgayNhanPhong,
            ct.NgayTraPhong,
            ct.SoNguoi,
            ct.SoPhong,
            ct.TrangThaiPhong,

            pp.MaPP,
            pp.TrangThai AS TrangThaiPhanPhong,
            pp.NgayCheckIn,
            pp.NgayCheckOut,

            p.MaPhong,
            p.SoPhong,
            p.Tang,
            p.TinhTrangPhong,
            p.MaCN,

            lp.MaLoai,
            lp.TenLoai,
            lp.MoTa,
            lp.GiaPhong,
            lp.GiaTheoGio,
            lp.GiaQuaDem,
            lp.SoNguoiToiDa,
            lp.HinhAnh,

            hd.MaHD,
            hd.SoDem,
            hd.TongTienPhong,
            hd.TongTienDV,
            hd.ThanhTien,
            hd.TrangThai AS TrangThaiHoaDon,
            hd.PhuongThucTT,
            hd.NgayThanhToan

        FROM chitiet_dp ct
        JOIN phieudatphong dp
            ON ct.MaDP = dp.MaDP
        JOIN khachhang kh
            ON dp.MaKH = kh.MaKH
        JOIN phanphong pp
            ON ct.MaCTDP = pp.MaCTDP
        JOIN phong p
            ON pp.MaPhong = p.MaPhong
        JOIN loaiphong lp
            ON ct.MaLoai = lp.MaLoai
        LEFT JOIN hoadon hd
            ON dp.MaDP = hd.MaDP

        WHERE ct.MaCTDP = ?
    `, [MaCTDP]);
};

exports.getCheckInList = async (conn, user) => {

    let whereClause = `
        WHERE dp.TrangThai = 'đã xác nhận'
    `;

    const params = [];

    if (user.role !== "admin" && user.MaCN) {
        whereClause += `
            AND p.MaCN = ?
        `;
        params.push(user.MaCN);
    }

    return await conn.query(`
        SELECT
            dp.MaDP,
            dp.TrangThai,
            dp.LoaiDat,
            kh.HoTenKH,

            pp.MaPP,
            pp.TrangThai AS TrangThaiPP,

            p.MaPhong,
            p.SoPhong,

            ct.MaCTDP,
            ct.NgayNhanPhong

        FROM phieudatphong dp

        JOIN khachhang kh
            ON dp.MaKH = kh.MaKH

        JOIN chitiet_dp ct
            ON dp.MaDP = ct.MaDP

        JOIN phanphong pp
            ON ct.MaCTDP = pp.MaCTDP

        JOIN phong p
            ON pp.MaPhong = p.MaPhong

        ${whereClause}

        ORDER BY ct.NgayNhanPhong ASC
    `, params);
};

exports.getCheckOutList = async (conn, user) => {

    let whereClause = `
        WHERE pp.TrangThai = 'đang ở'
    `;

    const params = [];

    if (
        user.role !== "admin" &&
        user.MaCN
    ) {
        whereClause += `
            AND p.MaCN = ?
        `;
        params.push(user.MaCN);
    }

    return await conn.query(`
        SELECT
            dp.MaDP,

            kh.HoTenKH,

            pp.MaPP,
            pp.NgayCheckIn,

            p.MaPhong,
            p.SoPhong,
            p.GiaTheoGio,

            ct.NgayTraPhong

        FROM phieudatphong dp

        JOIN khachhang kh
            ON dp.MaKH = kh.MaKH

        JOIN chitiet_dp ct
            ON dp.MaDP = ct.MaDP

        JOIN phanphong pp
            ON ct.MaCTDP = pp.MaCTDP

        JOIN phong p
            ON pp.MaPhong = p.MaPhong

        ${whereClause}

        ORDER BY pp.NgayCheckIn
    `, params);
};

exports.getCalendar = async (conn, user) => {
    let sql = `
        SELECT
            dp.MaDP,
            dp.TrangThai,

            kh.HoTenKH,

            p.MaPhong,
            p.SoPhong,
            p.MaCN,

            ct.NgayNhanPhong,
            ct.NgayTraPhong,

            pp.TrangThai AS TrangThaiPP

        FROM phanphong pp

        JOIN phong p
            ON pp.MaPhong = p.MaPhong

        JOIN chitiet_dp ct
            ON pp.MaCTDP = ct.MaCTDP

        JOIN phieudatphong dp
            ON ct.MaDP = dp.MaDP

        JOIN khachhang kh
            ON dp.MaKH = kh.MaKH

        WHERE dp.TrangThai != 'đã hủy'
    `;

    const params = [];

    if (["quanly", "tiep_tan"].includes(user.role)) {
        sql += `AND p.MaCN = ?`;
        params.push(user.MaCN);
    }
    sql += `ORDER BY
            p.SoPhong,
            ct.NgayNhanPhong`;
    return await conn.query(sql, params);
};
exports.getMyBookings = async (conn, MaKH) => {

    return await conn.query(`
        SELECT

            dp.MaDP,
            dp.NgayDat,
            dp.TrangThai,
            dp.LoaiDat,
            dp.SoGio,

            ct.MaCTDP,
            ct.NgayNhanPhong,
            ct.NgayTraPhong,
            ct.SoNguoi,
            ct.TrangThaiPhong,

            pp.MaPP,
            pp.TrangThai AS TrangThaiPP,

            p.MaPhong,
            p.SoPhong,
            p.Tang,
            p.GiaPhong,
            p.GiaTheoGio,
            p.GiaQuaDem,

            lp.MaLoai,
            lp.TenLoai,
            lp.HinhAnh,

            hd.MaHD,
            hd.ThanhTien,
            hd.TrangThai AS TrangThaiHoaDon,
            hd.PhuongThucTT

        FROM phieudatphong dp

        INNER JOIN chitiet_dp ct
            ON dp.MaDP = ct.MaDP

        LEFT JOIN phanphong pp
            ON ct.MaCTDP = pp.MaCTDP

        LEFT JOIN phong p
            ON pp.MaPhong = p.MaPhong

        INNER JOIN loaiphong lp
            ON ct.MaLoai = lp.MaLoai

        LEFT JOIN hoadon hd
            ON dp.MaDP = hd.MaDP

        WHERE dp.MaKH = ?

        ORDER BY dp.NgayDat DESC

    `, [MaKH]);

};

exports.getBookingDetailByCustomer = async (conn, MaDP, MaKH) => {

    const result = await conn.query(`
        SELECT
            dp.MaDP,
            dp.NgayDat,
            dp.TrangThai,
            dp.LoaiDat,
            dp.SoGio,
            dp.GhiChu,

            ct.MaCTDP,
            ct.NgayNhanPhong,
            ct.NgayTraPhong,
            ct.SoNguoi,
            ct.TrangThaiPhong,

            pp.MaPP,
            pp.TrangThai AS TrangThaiPhanPhong,
            pp.NgayCheckIn,
            pp.NgayCheckOut,

            p.MaPhong,
            p.SoPhong,
            p.Tang,

            lp.MaLoai,
            lp.TenLoai,
            lp.HinhAnh,
            lp.SoNguoiToiDa,

            cn.MaCN,
            cn.TenCN,
            cn.DiaChi,

            hd.MaHD,
            hd.ThanhTien,
            hd.TrangThai AS TrangThaiHoaDon,
            hd.PhuongThucTT

        FROM PHIEUDATPHONG dp
        LEFT JOIN CHITIET_DP ct ON ct.MaDP = dp.MaDP
        LEFT JOIN PHANPHONG pp ON pp.MaCTDP = ct.MaCTDP
        LEFT JOIN PHONG p ON p.MaPhong = pp.MaPhong
        LEFT JOIN LOAIPHONG lp ON lp.MaLoai = ct.MaLoai
        LEFT JOIN CHINHANH cn ON cn.MaCN = p.MaCN
        LEFT JOIN HOADON hd ON hd.MaDP = dp.MaDP
        WHERE dp.MaDP = ?
        AND dp.MaKH = ?
    `, [MaDP, MaKH]);

    console.log(result);

    return result[0];
}
exports.getBookingForCheckin = async (conn, MaDP, MaCN) => {

    const [rows] = await conn.query(
        `
        SELECT
            dp.MaDP,
            dp.NgayDat,
            dp.TrangThai,
            dp.LoaiDat,
            dp.SoGio,
            dp.GhiChu,

            ct.MaCTDP,
            ct.NgayNhanPhong,
            ct.NgayTraPhong,
            ct.SoNguoi,
            ct.TrangThaiPhong,

            pp.MaPP,
            pp.TrangThai AS TrangThaiPhanPhong,
            pp.NgayCheckIn,
            pp.NgayCheckOut,

            p.MaPhong,
            p.SoPhong,
            p.Tang,

            lp.MaLoai,
            lp.TenLoai,
            lp.HinhAnh,
            lp.SoNguoiToiDa,

            cn.MaCN,
            cn.TenCN,
            cn.DiaChi,

            hd.MaHD,
            hd.ThanhTien,
            hd.TrangThai AS TrangThaiHoaDon,
            hd.PhuongThucTT

        FROM PHIEUDATPHONG dp
        LEFT JOIN CHITIET_DP ct ON ct.MaDP = dp.MaDP
        LEFT JOIN PHANPHONG pp ON pp.MaCTDP = ct.MaCTDP
        LEFT JOIN PHONG p ON p.MaPhong = pp.MaPhong
        LEFT JOIN LOAIPHONG lp ON lp.MaLoai = ct.MaLoai
        LEFT JOIN CHINHANH cn ON cn.MaCN = p.MaCN
        LEFT JOIN HOADON hd ON hd.MaDP = dp.MaDP

        WHERE dp.MaDP = ?
          AND p.MaCN = ?
        `,
        [MaDP, MaCN]
    );

    console.log("Model:", { MaDP, MaCN });
    console.log(rows);

    return rows;
};

const roomPriceSql = `
    CASE dp.LoaiDat
        WHEN 'theo ngày' THEN p.GiaPhong * hd.SoDem
        WHEN 'qua đêm' THEN p.GiaQuaDem
        ELSE p.GiaTheoGio * dp.SoGio
    END
`;

const lateSurchargeSql = (timeValue) => `
    CEIL(GREATEST(0, TIMESTAMPDIFF(MINUTE, ct.NgayTraPhong, ${timeValue})) / 60.0)
    * p.GiaTheoGio
`;

exports.syncLateCheckoutSurcharge = async (conn, MaDP, checkoutAt) => {
    const roomPrice = roomPriceSql;
    const lateSurcharge = lateSurchargeSql("?");

    await conn.query(`
        UPDATE hoadon hd
        JOIN phieudatphong dp ON dp.MaDP = hd.MaDP
        JOIN chitiet_dp ct ON ct.MaDP = dp.MaDP
        JOIN phanphong pp ON pp.MaCTDP = ct.MaCTDP
        JOIN phong p ON p.MaPhong = pp.MaPhong
        SET
            hd.TongTienPhong = (${roomPrice}) + (${lateSurcharge}),
            hd.ThanhTien = (${roomPrice}) + (${lateSurcharge}) + hd.TongTienDV
        WHERE hd.MaDP = ?
    `, [checkoutAt, checkoutAt, MaDP]);
};

exports.syncActiveLateCheckoutSurcharges = async (conn) => {
    const roomPrice = roomPriceSql;
    const lateSurcharge = lateSurchargeSql("NOW()");

    await conn.query(`
        UPDATE hoadon hd
        JOIN phieudatphong dp ON dp.MaDP = hd.MaDP
        JOIN chitiet_dp ct ON ct.MaDP = dp.MaDP
        JOIN phanphong pp ON pp.MaCTDP = ct.MaCTDP
        JOIN phong p ON p.MaPhong = pp.MaPhong
        SET
            hd.TongTienPhong = (${roomPrice}) + (${lateSurcharge}),
            hd.ThanhTien = (${roomPrice}) + (${lateSurcharge}) + hd.TongTienDV
        WHERE pp.TrangThai = 'đang ở'
          AND ct.NgayTraPhong < NOW()
          AND hd.TrangThai = 'chưa thanh toán'
    `);
};
