const db = require("../config/db");

exports.findQTVByEmail = (email) => {
    return db.query(
        `SELECT q.*, c.TenCV 
     FROM QUANTRIVIEN q
     JOIN CHUCVU c ON q.MaCV = c.MaCV
     WHERE q.Email = ?`,
        [email]
    );
};

exports.findKHByEmail = (email) => {
    return db.query(
        `SELECT * FROM KHACHHANG WHERE Email = ?`,
        [email]
    );
};