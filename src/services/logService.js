const db = require("../config/db");

const writeLog = async (MaNV, action) => {
    await db.query(
        "INSERT INTO log_hoatdong (MaNV, HanhDong) VALUES (?, ?)",
        [MaNV, action]
    );
};

const getLogs = async () => {
    const [rows] = await db.query(
        "SELECT * FROM log_hoatdong ORDER BY ThoiGian DESC"
    );
    return rows;
};

module.exports = { writeLog, getLogs };
