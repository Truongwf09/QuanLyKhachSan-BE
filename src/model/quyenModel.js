const db = require("../config/db");

exports.getAll = async () => {
    const [rows] = await db.query(
        "SELECT * FROM quyen ORDER BY MaQuyen"
    );
    return rows;
};

exports.create = async (data) => {
    await db.query(
        `INSERT INTO quyen(
            MaQuyen,
            TenQuyen
        ) VALUES(?,?)`,
        [
            data.MaQuyen,
            data.TenQuyen
        ]
    );
};

exports.update = async (id, data) => {
    await db.query(
        `UPDATE quyen
         SET
            TenQuyen=?
         WHERE MaQuyen=?`,
        [
            data.TenQuyen,
            id
        ]
    );
};

exports.remove = async (id) => {
    await db.query(
        "DELETE FROM quyen WHERE MaQuyen=?",
        [id]
    );
};
