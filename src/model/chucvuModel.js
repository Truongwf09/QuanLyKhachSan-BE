const db = require("../config/db");

exports.getAll = async () => {
    const [rows] = await db.query(
        "SELECT * FROM chucvu ORDER BY MaCV"
    );
    return rows;
};

exports.getById = async (id) => {
    const [rows] = await db.query(
        "SELECT * FROM chucvu WHERE MaCV = ?",
        [id]
    );
    return rows;
};

// ✅ Lấy mã chức vụ lớn nhất để sinh mã mới
exports.getLast = async () => {
    const [rows] = await db.query(
        "SELECT MaCV FROM chucvu ORDER BY MaCV DESC LIMIT 1"
    );
    return rows[0] || null;
};

exports.create = async (data) => {
    await db.query(
        `INSERT INTO chucvu(MaCV, TenCV, MoTa) VALUES(?, ?, ?)`,
        [data.MaCV, data.TenCV, data.MoTa]
    );
};

exports.update = async (id, data) => {
    await db.query(
        `UPDATE chucvu SET TenCV=?, MoTa=? WHERE MaCV=?`,
        [data.TenCV, data.MoTa, id]
    );
};

exports.remove = async (id) => {
    await db.query(
        "DELETE FROM chucvu WHERE MaCV=?",
        [id]
    );
};
exports.getPermissions = async (MaCV) => {

    const [rows] = await db.query(`
        SELECT
            q.MaQuyen,
            q.TenQuyen

        FROM quyen q

        INNER JOIN chucvu_quyen cvq

            ON cvq.MaQuyen=q.MaQuyen

        WHERE cvq.MaCV=?

        ORDER BY q.MaQuyen
    `, [MaCV]);

    return rows;

};


/* Gán quyền */

exports.assignPermissions =
    async (
        MaCV,
        permissions
    ) => {

        await db.query(

            "DELETE FROM chucvu_quyen WHERE MaCV=?",

            [MaCV]

        );

        for (const MaQuyen of permissions) {

            await db.query(

                `
            INSERT INTO chucvu_quyen(
                MaCV,
                MaQuyen
            )

            VALUES (?,?)
            `,

                [
                    MaCV,
                    MaQuyen
                ]

            );

        }
    };
exports.changeStatus = async (MaCV, TrangThai) => {

    const [result] = await db.query(
        `
        UPDATE chucvu
        SET TrangThai = ?
        WHERE MaCV = ?
        `,
        [TrangThai, MaCV]
    );

    return result;
};