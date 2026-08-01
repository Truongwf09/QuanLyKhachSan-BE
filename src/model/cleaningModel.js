const db = require("../config/db");

// =========================
// LẤY DANH SÁCH PHÒNG CHỜ DỌN
// =========================
exports.getPendingRooms = async (MaCN = null) => {

    let sql = `
        SELECT
            dd.MaDD,
            dd.TrangThaiDD,
            dd.ThoiGianNhan,
            p.MaPhong,
            p.SoPhong,
            p.Tang,
            p.TinhTrangPhong,
            lp.TenLoai,
            lp.HinhAnh,
            cn.TenCN
        FROM DONDEP dd
        INNER JOIN PHONG p
            ON dd.MaPhong = p.MaPhong
        INNER JOIN LOAIPHONG lp
            ON lp.MaLoai = p.MaLoai
        INNER JOIN CHINHANH cn
            ON cn.MaCN = p.MaCN
        WHERE
            dd.TrangThaiDD IN ('chờ nhận','đang dọn')
    `;

    const params = [];

    if (MaCN) {
        sql += ` AND p.MaCN = ?`;
        params.push(MaCN);
    }

    sql += `
        ORDER BY
            dd.TrangThaiDD ASC,
            p.Tang ASC,
            p.SoPhong ASC
    `;

    const [rows] =
        await db.query(sql, params);

    return rows;

};

exports.getCompletedRooms = async (MaCN = null) => {

    let sql = `
        SELECT
            dd.MaDD,
            dd.TrangThaiDD,
            dd.ThoiGianNhan,
            dd.ThoiGianHoanThanh,

            p.MaPhong,
            p.SoPhong,
            p.Tang,
            p.TinhTrangPhong,

            lp.TenLoai,
            lp.HinhAnh,

            cn.TenCN

        FROM DONDEP dd

        INNER JOIN PHONG p
            ON dd.MaPhong = p.MaPhong

        INNER JOIN LOAIPHONG lp
            ON lp.MaLoai = p.MaLoai

        INNER JOIN CHINHANH cn
            ON cn.MaCN = p.MaCN

        WHERE dd.TrangThaiDD = 'hoàn thành'
        AND DATE(dd.ThoiGianHoanThanh) = CURDATE()
        
    `;

    const params = [];

    if (MaCN) {
        sql += ` AND p.MaCN = ?`;
        params.push(MaCN);
    }

    sql += `
        ORDER BY dd.ThoiGianHoanThanh DESC
    `;
    const [rows] = await db.query(sql, params);
    return rows;
};

// =========================
// CHI TIẾT PHÒNG
// =========================
exports.getRoomDetail = async (MaDD) => {

    const [rows] = await db.query(`
        SELECT
            dd.*,

            p.MaPhong,
            p.SoPhong,
            p.Tang,

            lp.MaLoai,
            lp.TenLoai,
            lp.MoTa,
            lp.HinhAnh,

            cn.TenCN

        FROM DONDEP dd

        JOIN PHONG p
            ON dd.MaPhong = p.MaPhong

        JOIN LOAIPHONG lp
            ON p.MaLoai = lp.MaLoai

        JOIN CHINHANH cn
            ON p.MaCN = cn.MaCN

        WHERE dd.MaDD = ?
    `, [MaDD]);

    return rows[0];
};

// =========================
// NHẬN DỌN
// =========================
exports.acceptCleaning = async (
    MaDD,
    MaQTV
) => {

    await db.query(`
        UPDATE DONDEP
        SET
            MaQTV = ?,
            TrangThaiDD = 'đang dọn',
            ThoiGianNhan = NOW()
        WHERE MaDD = ?
    `, [MaQTV, MaDD]);
};

// =========================
// HOÀN THÀNH
// =========================
exports.finishCleaning = async (MaDD) => {

    const [[job]] = await db.query(`
        SELECT *
        FROM DONDEP
        WHERE MaDD = ?
    `, [MaDD]);

    if (!job) {
        throw new Error("Không tìm thấy công việc.");
    }

    await db.query(`
        UPDATE DONDEP
        SET
            TrangThaiDD='hoàn thành',
            ThoiGianHoanThanh=NOW()
        WHERE MaDD=?
    `, [MaDD]);

    await db.query(`
        UPDATE PHONG
        SET
            TinhTrangPhong='có sẵn'
        WHERE MaPhong=?
    `, [job.MaPhong]);

};

// =========================
// LỊCH SỬ
// =========================
exports.getHistory = async (MaQTV) => {

    const [rows] = await db.query(`
        SELECT

            dd.MaDD,
            dd.TrangThaiDD,
            dd.ThoiGianNhan,
            dd.ThoiGianHoanThanh,

            p.SoPhong,
            p.Tang,

            lp.TenLoai

        FROM DONDEP dd

        JOIN PHONG p
            ON dd.MaPhong=p.MaPhong

        JOIN LOAIPHONG lp
            ON p.MaLoai=lp.MaLoai

        WHERE dd.MaQTV=?

        ORDER BY
            dd.ThoiGianHoanThanh DESC
    `, [MaQTV]);

    return rows;

};
exports.getServicesByCleaning = async (MaDD) => {

    const [rows] = await db.query(`
        SELECT
            dv.MaDV,
            dv.TenDV,
            dv.GiaDV,
            dv.MaCN
        FROM DONDEP dd

        JOIN PHONG p
            ON dd.MaPhong = p.MaPhong

        JOIN DICHVU dv
            ON dv.MaCN = p.MaCN

        WHERE dd.MaDD = ?

        ORDER BY dv.TenDV
    `, [MaDD]);

    return rows;
};
exports.getBookingByCleaning = async (MaDD) => {

    const [[row]] = await db.query(`
        SELECT
            pp.MaDP
        FROM DONDEP dd

        JOIN PHANPHONG pp
            ON dd.MaPhong = pp.MaPhong

        WHERE dd.MaDD = ?
        ORDER BY pp.NgayNhanPhong DESC
        LIMIT 1
    `, [MaDD]);

    return row;
};
exports.insertService = async (MaDP, MaDV, SoLuong, DonGia) => {
    await db.query(`
        INSERT INTO CHITIET_DV
        (
            MaDP,
            MaDV,
            SoLuong,
            DonGia,
            NgaySuDung
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            NOW()
        )
    `,
        [MaDP, MaDV, SoLuong, DonGia]);
};
exports.getServiceTotal = async (MaDP) => {

    const [[row]] = await db.query(`
        SELECT
            IFNULL(
                SUM(SoLuong * DonGia),
                0
            ) TongTienDV
        FROM CHITIET_DV
        WHERE MaDP=?
    `,
        [MaDP]);

    return row.TongTienDV;
};
exports.updateInvoice = async (
    MaDP,
    TongTienDV
) => {

    await db.query(`
        UPDATE HOADON
        SET
            TongTienDV=?,
            ThanhTien=TienPhong+?
        WHERE MaDP=?
    `,
        [TongTienDV, TongTienDV, MaDP]);
};
exports.saveServices = async (MaDD, services) => {
    const [[booking]] = await db.query(`
        SELECT
            ct.MaDP
        FROM DONDEP dd
        JOIN PHANPHONG pp
            ON pp.MaPhong = dd.MaPhong
        JOIN CHITIET_DP ct
            ON ct.MaCTDP = pp.MaCTDP
        WHERE dd.MaDD = ?
        ORDER BY pp.NgayCheckOut DESC
        LIMIT 1
    `, [MaDD]);
    if (!booking) {
        throw new Error("Không tìm thấy phiếu đặt phòng.");
    }
    const MaDP = booking.MaDP;
    let tongTienDV = 0;
    for (const item of services) {
        const [[dv]] = await db.query(`
            SELECT *
            FROM DICHVU
            WHERE MaDV = ?
        `, [item.MaDV]);
        if (!dv) continue;
        const maCTDV =
            "DV" + Date.now() + Math.floor(Math.random() * 100);
        await db.query(`
            INSERT INTO CHITIET_DV
            (
                MaCTDV,
                SoLuong,
                DonGia,
                MaDP,
                MaDV
            )
            VALUES (?,?,?,?,?)
        `, [maCTDV, item.SoLuong, dv.GiaDV, MaDP, item.MaDV]);
        tongTienDV += dv.GiaDV * item.SoLuong;
    }
    await db.query(`
    UPDATE HOADON
    SET TongTienDV = IFNULL(TongTienDV,0) + ?
    WHERE MaDP = ?
`, [tongTienDV, MaDP]);
    await db.query(`
    UPDATE HOADON
    SET ThanhTien = TongTienPhong + TongTienDV
    WHERE MaDP = ?
    `, [MaDP]);
};
exports.startCleaning = async (MaDD) => {

    const [[job]] = await db.query(`
        SELECT *
        FROM DONDEP
        WHERE MaDD = ?
    `, [MaDD]);

    if (!job) {
        throw new Error("Không tìm thấy đơn dọn.");
    }

    await db.query(`
        UPDATE DONDEP
        SET TrangThaiDD='đang dọn'
        WHERE MaDD=?
    `, [MaDD]);

    await db.query(`
        UPDATE PHONG
        SET TinhTrangPhong='đang dọn dẹp'
        WHERE MaPhong=?
    `, [job.MaPhong]);

};

exports.getChecklist = async (MaDD) => {

    const [rows] = await db.query(`
        SELECT
            cd.MaCheck,
            cm.STT,
            cm.NoiDung,
            cd.DaHoanThanh
        FROM CHECKLIST_DONDEP cd

        INNER JOIN CHECKLIST_MAU cm
            ON cd.MaMau = cm.MaMau

        WHERE cd.MaDD = ?

        ORDER BY cm.STT
    `, [MaDD]);

    return rows;
};
exports.updateChecklist = async (MaCheck, DaHoanThanh) => {
    const value = DaHoanThanh ? 1 : 0;
    await db.query(`
        UPDATE CHECKLIST_DONDEP
        SET
            DaHoanThanh = ?,
            ThoiGianHThanh =
                CASE
                    WHEN ? = 1 THEN NOW()
                    ELSE NULL
                END
        WHERE MaCheck = ?
    `, [DaHoanThanh, DaHoanThanh, MaCheck]);

};
exports.countUnfinishedChecklist = async (MaDD) => {
    const [[row]] = await db.query(`
        SELECT
            COUNT(*) AS Total
        FROM CHECKLIST_DONDEP
        WHERE MaDD=?
        AND DaHoanThanh=0
    `, [MaDD]);
    return row.Total;
};
exports.createDefaultChecklist = async (MaDD) => {

    const [items] = await db.query(`
        SELECT
            MaMau
        FROM CHECKLIST_MAU
        WHERE
            LoaiChecklist='DON_PHONG'
        AND TrangThai=1
        ORDER BY STT
    `);
    for (const item of items) {
        const maCheck = "CK" + Date.now() + Math.floor(Math.random() * 1000);
        await db.query(`
            INSERT INTO CHECKLIST_DONDEP
            (
                MaCheck,
                MaDD,
                MaMau,
                DaHoanThanh
            )
            VALUES
            (
                ?,?,?,0
            )
        `,
            [
                maCheck,
                MaDD,
                item.MaMau
            ]);
    }
};
exports.getChecklist = async (MaDD) => {

    const [rows] = await db.query(`
        SELECT
            cd.MaCheck,
            cm.STT,
            cm.NoiDung,
            cd.DaHoanThanh
        FROM CHECKLIST_DONDEP cd
        JOIN CHECKLIST_MAU cm
            ON cm.MaMau = cd.MaMau
        WHERE cd.MaDD=?
        ORDER BY cm.STT
    `,
        [MaDD]);
    return rows;
};
