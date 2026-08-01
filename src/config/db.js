const mysql = require("mysql2/promise");
require("dotenv").config();

console.log("CONNECT DB =", process.env.DB_NAME);

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: "+07:00",
    dateStrings: true,
    charset: "utf8mb4"
});

module.exports = pool;