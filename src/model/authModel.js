const db = require("../config/db");

exports.findQTVByEmail = (email) => {
    return db.query(
        `SELECT q.*, c.TenCV 
     FROM quantrivien q
     JOIN CHUCVU c ON q.MaCV = c.MaCV
     WHERE q.Email = ?`,
        [email]
    );
};

exports.findKHByEmail = (email) => {
    return db.query(
        `SELECT * FROM khachhang WHERE Email = ?`,
        [email]
    );
};