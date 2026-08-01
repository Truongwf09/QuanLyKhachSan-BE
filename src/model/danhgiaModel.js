const db = require("../config/db");

/* Lấy tất cả đánh giá */

exports.getAll = async () => {
  const [rows] = await db.query(`

        SELECT

            dg.*,

            kh.HoTenKH, 

            lp.TenLoai

        FROM danhgia dg

        LEFT JOIN khachhang kh

            ON kh.MaKH = dg.MaKH

        LEFT JOIN loaiphong lp

            ON lp.MaLoai = dg.MaLoai

        ORDER BY dg.NgayDG DESC

    `);

  return rows;
};

/* Đánh giá theo loại phòng */

exports.getByLoaiPhong = async (MaLoai) => {
  const [rows] = await db.query(
    `
        SELECT
            dg.MaDG,
            dg.SoSao,
            dg.NoiDung,
            dg.NgayDG,
            kh.HoTenKH
        FROM danhgia dg
        LEFT JOIN khachhang kh
            ON kh.MaKH = dg.MaKH
        WHERE dg.MaLoai = ?
        AND dg.TrangThai = 1
        ORDER BY dg.NgayDG DESC
    `,
    [MaLoai],
  );

  return rows;
};

/* ===============================
   Thống kê đánh giá theo loại phòng
================================ */

exports.getSummary = async (MaLoai) => {
  const [[row]] = await db.query(
    `
        SELECT

            COUNT(dg.MaDG) AS TongDanhGia,

            ROUND(AVG(dg.SoSao),1) AS DiemTB,

            lp.TenLoai

        FROM LOAIPHONG lp

        LEFT JOIN DANHGIA dg
            ON lp.MaLoai = dg.MaLoai
            AND dg.TrangThai = 1

        WHERE lp.MaLoai = ?

        GROUP BY lp.MaLoai
    `,
    [MaLoai],
  );

  return {
    TongDanhGia: row?.TongDanhGia || 0,

    DiemTB: row?.DiemTB || 0,

    TenLoai: row?.TenLoai || "",
  };
};

/* Đã đánh giá chưa */

exports.checkExists = async (MaKH, MaDP) => {
  const [rows] = await db.query(
    `
        SELECT *
        FROM danhgia
        WHERE
        MaKH=?
        AND
        MaDP=?
        `,
    [MaKH, MaDP],
  );
  return rows[0];
};

/* Sinh mã DG */

exports.getLast = async () => {
  const [rows] = await db.query(
    `
        SELECT MaDG

        FROM danhgia

        ORDER BY MaDG DESC

        LIMIT 1
        `,
  );

  return rows[0];
};

/* Thêm đánh giá */

exports.create = async (data) => {
  await db.query(
    `
        INSERT INTO danhgia(
            MaDG,
            MaKH,
            MaDP,
            MaLoai,
            SoSao,
            NoiDung
        )

        VALUES(
            ?,?,?,?,?,?
        )`,
    [data.MaDG, data.MaKH, data.MaDP, data.MaLoai, data.SoSao, data.NoiDung],
  );
};

exports.remove = async (id) => {
  await db.query(
    "DELETE FROM danhgia WHERE MaDG=?",

    [id],
  );
};

exports.getReviewableBookings = async (MaKH) => {
  const [rows] = await db.query(
    `

        SELECT

        ct.MaDP,

        lp.TenLoai,

        ct.TrangThai

        FROM chitiet_dp ct

        JOIN loaiphong lp

        ON lp.MaLoai=ct.MaLoai

        LEFT JOIN danhgia dg

        ON dg.MaDP=ct.MaDP

        AND dg.MaKH=?

        WHERE

        ct.MaKH=?

        AND

        (
        ct.TrangThai='đã trả phòng'
        OR
        ct.TrangThai='hoàn thành'
        )

        AND dg.MaDG IS NULL

        ORDER BY ct.NgayTraPhong DESC`,
    [MaKH, MaKH],
  );

  return rows;
};

/* Kiểm tra đã đánh giá chưa */

exports.hasReviewed = async (MaKH, MaDP) => {
  const [rows] = await db.query(
    `
        SELECT MaDG
        FROM DANHGIA
        WHERE MaKH = ?
        AND MaDP = ?
        LIMIT 1
        `,

    [MaKH, MaDP],
  );

  return rows.length > 0;
};
exports.getAllReviews = async (filters = {}) => {
  let sql = `
        SELECT
            dg.MaDG,
            dg.NgayDG,
            dg.NoiDung,
            dg.SoSao,
            dg.TrangThai,

            kh.MaKH,
            kh.HoTenKH,

            dp.MaDP,

            lp.MaLoai,
            lp.TenLoai

        FROM DANHGIA dg

        JOIN KHACHHANG kh
            ON dg.MaKH = kh.MaKH

        JOIN PHIEUDATPHONG dp
            ON dg.MaDP = dp.MaDP

        LEFT JOIN LOAIPHONG lp
            ON dg.MaLoai = lp.MaLoai

        WHERE 1 = 1
    `;

  const params = [];

  if (filters.SoSao) {
    sql += ` AND dg.SoSao = ?`;
    params.push(filters.SoSao);
  }

  if (filters.MaLoai) {
    sql += ` AND dg.MaLoai = ?`;
    params.push(filters.MaLoai);
  }

  sql += `ORDER BY dg.NgayDG DESC`;

  const [rows] = await db.query(sql, params);

  return rows;
};
exports.getDetail = async (MaDG) => {
  const [rows] = await db.query(
    `
        SELECT

            dg.*,

            kh.HoTenKH,
            kh.Email,
            kh.SDT,

            lp.TenLoai

        FROM DANHGIA dg

        JOIN KHACHHANG kh
            ON dg.MaKH = kh.MaKH

        LEFT JOIN LOAIPHONG lp
            ON dg.MaLoai = lp.MaLoai

        WHERE dg.MaDG = ?
    `,
    [MaDG],
  );

  return rows[0];
};
exports.hideReview = async (MaDG) => {
  await db.query(
    `
        UPDATE DANHGIA
        SET TrangThai = 0
        WHERE MaDG = ?
    `,
    [MaDG],
  );
};
exports.getStatistic = async () => {
  const [[row]] = await db.query(`
        SELECT

            COUNT(*) AS Tong,

            SUM(CASE WHEN TrangThai = 1 THEN 1 ELSE 0 END) AS DangHien,

            SUM(CASE WHEN TrangThai = 0 THEN 1 ELSE 0 END) AS DaAn,

            ROUND(AVG(SoSao),1) AS DiemTB,

            SUM(CASE WHEN SoSao = 5 THEN 1 ELSE 0 END) AS Sao5,
            SUM(CASE WHEN SoSao = 4 THEN 1 ELSE 0 END) AS Sao4,
            SUM(CASE WHEN SoSao = 3 THEN 1 ELSE 0 END) AS Sao3,
            SUM(CASE WHEN SoSao = 2 THEN 1 ELSE 0 END) AS Sao2,
            SUM(CASE WHEN SoSao = 1 THEN 1 ELSE 0 END) AS Sao1

        FROM DANHGIA
    `);

  return {
    Tong: Number(row.Tong || 0),

    DangHien: Number(row.DangHien || 0),

    DaAn: Number(row.DaAn || 0),

    DiemTB: Number(row.DiemTB || 0),

    Sao5: Number(row.Sao5 || 0),

    Sao4: Number(row.Sao4 || 0),

    Sao3: Number(row.Sao3 || 0),

    Sao2: Number(row.Sao2 || 0),

    Sao1: Number(row.Sao1 || 0),
  };
};

exports.toggleReview = async (MaDG) => {
  const [[review]] = await db.query(
    `
        SELECT TrangThai
        FROM danhgia
        WHERE MaDG = ?
        `,
    [MaDG],
  );

  if (!review) {
    throw new Error("Không tìm thấy đánh giá");
  }

  const newStatus = review.TrangThai === 1 ? 0 : 1;

  await db.query(
    `
        UPDATE danhgia
        SET TrangThai = ?
        WHERE MaDG = ?
        `,
    [newStatus, MaDG],
  );

  return newStatus;
};
