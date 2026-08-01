const db = require("../config/db");
exports.getConnection = async () => {

    return await db.getConnection();

}
exports.getPublic = async (MaCN, MaLoai) => {

    let sql = `
        SELECT DISTINCT lp.*
FROM loaiphong lp
INNER JOIN chinhanh_loaiphong clp
ON lp.MaLoai=clp.MaLoai
WHERE lp.TrangThai = 1
    `;

    const params = [];

    if (MaCN) {
        sql += " AND clp.MaCN = ?";
        params.push(MaCN);
    }

    if (MaLoai) {
        sql += " AND lp.MaLoai = ?";
        params.push(MaLoai);
    }

    sql += " ORDER BY lp.MaLoai";

    const [rows] = await db.query(sql, params);

    return rows;
};
exports.getRoomsByType = async (

    conn,

    maLoai,

    MaCN,

    NgayNhan,

    NgayTra

) => {

    let sql = `

        SELECT

            p.MaPhong,
            p.SoPhong,
            p.Tang,
            p.TinhTrangPhong,
            p.MaLoai,
            p.MaCN,
            p.GiaPhong,
            p.GiaTheoGio,
            p.GiaQuaDem,

            lp.TenLoai,
            lp.MoTa,
            lp.SoNguoiToiDa,
            lp.HinhAnh

        FROM PHONG p

        INNER JOIN loaiphong lp
            ON lp.MaLoai = p.MaLoai

        WHERE p.MaLoai = ?

    `;

    const params = [maLoai];

    // lọc theo chi nhánh

    if (MaCN) {

        sql += `
            AND p.MaCN = ?
        `;

        params.push(MaCN);

    }

    // lọc phòng trống theo thời gian

    if (NgayNhan && NgayTra) {

        sql += `

            AND NOT EXISTS (

                SELECT 1

                FROM PHANPHONG pp

                INNER JOIN CHITIET_DP ct

                    ON ct.MaCTDP = pp.MaCTDP

                WHERE

                    pp.MaPhong = p.MaPhong

                    AND pp.TrangThai IN (

                        'đã giữ phòng',

                        'đã check in'

                    )

                    AND (

                        ? < ct.NgayTraPhong

                        AND

                        ? > ct.NgayNhanPhong

                    )

            )

        `;

        params.push(

            NgayNhan,

            NgayTra

        );

    }

    sql += `
        ORDER BY
            p.SoPhong
    `;

    const [rows] =
        await conn.query(
            sql,
            params
        );

    return rows;

};
exports.hide = async (id) => {

    await db.query(
        `
        UPDATE loaiphong
        SET TrangThai = 0
        WHERE MaLoai = ?
        `,
        [id]
    );

};

exports.show = async (id) => {

    await db.query(
        `
        UPDATE loaiphong
        SET TrangThai = 1
        WHERE MaLoai = ?
        `,
        [id]
    );

};