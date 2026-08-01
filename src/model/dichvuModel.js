const db = require("../config/db");

exports.getConnection = async () => {
    return await db.getConnection();
};

exports.getAll = async (conn, user, MaCN) => {
    let sql = `
        SELECT *
        FROM dichvu
    `;
    const params = [];
    if (["quanly", "tiep_tan"].includes(user.role)) {
        sql += ` WHERE MaCN = ?`;
        params.push(user.MaCN);
    }

    else if (user.role === "khachhang" && MaCN) {
        sql += ` WHERE MaCN = ?`;
        params.push(MaCN);
    }

    sql += ` ORDER BY MaDV DESC`;

    return await conn.query(sql, params);
};

exports.getById = async (conn, MaDV) => {
    return await conn.query(`
        SELECT *
        FROM dichvu
        WHERE MaDV = ?
    `, [MaDV]);
};

exports.getByIdWithPermission = async (conn, MaDV, user) => {
    let sql = `
        SELECT *
        FROM dichvu
        WHERE MaDV = ?
    `;

    const params = [MaDV];

    if (user.role !== "admin") {
        sql += `
            AND MaCN = ?
        `;
        params.push(user.MaCN);
    }

    return await conn.query(sql, params);
};

exports.create = async (
    conn,
    data
) => {
    return await conn.query(`
        INSERT INTO dichvu(
            MaDV,
            TenDV,
            GiaDV,
            MoTa,
            MaCN
        )
        VALUES (?, ?, ?, ?, ?)
    `, [
        data.MaDV,
        data.TenDV,
        data.GiaDV,
        data.MoTa,
        data.MaCN
    ]);
};

exports.update = async (
    conn,
    MaDV,
    data
) => {
    return await conn.query(`
        UPDATE dichvu
        SET
            TenDV = ?,
            GiaDV = ?,
            MoTa = ?
        WHERE MaDV = ?
    `, [
        data.TenDV,
        data.GiaDV,
        data.MoTa,
        MaDV
    ]);
};

exports.remove = async (
    conn,
    MaDV
) => {
    return await conn.query(`
        DELETE FROM dichvu
        WHERE MaDV = ?
    `, [MaDV]);
};
exports.hide = async (
    conn,
    MaDV
) => {

    return await conn.query(
        `
        UPDATE dichvu
        SET TrangThai = 0
        WHERE MaDV = ?
        `,
        [MaDV]
    );

};
exports.show = async (
    conn,
    MaDV
) => {

    return await conn.query(
        `
        UPDATE dichvu
        SET TrangThai = 1
        WHERE MaDV = ?
        `,
        [MaDV]
    );

};
exports.getActive = async (
    conn,
    user
) => {

    return await conn.query(`
        SELECT *
        FROM dichvu
        WHERE MaCN = ?
        AND TrangThai = 1
        ORDER BY TenDV
    `, [
        user.MaCN
    ]);

};