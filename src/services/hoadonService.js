const db = require("../config/db");
const model = require("../model/hoadonModel");

const getTimeSurcharge = (invoice) => {
  const hourlyRate = Number(invoice.GiaTheoGio || 0);
  const checkOut = invoice.NgayCheckOut && new Date(invoice.NgayCheckOut);
  const scheduledCheckOut =
    invoice.NgayTraPhong && new Date(invoice.NgayTraPhong);
  const hours = (from, to) =>
    Math.max(0, Math.ceil((to.getTime() - from.getTime()) / 3600000));
  const lateHours =
    checkOut && scheduledCheckOut ? hours(scheduledCheckOut, checkOut) : 0;
  const activeLateHours =
    !checkOut && invoice.TrangThaiPhanPhong === "đang ở" && scheduledCheckOut
      ? hours(scheduledCheckOut, new Date())
      : 0;
  const totalLateHours = lateHours || activeLateHours;

  return {
    SoGioTre: totalLateHours,
    PhuThuTraMuon: totalLateHours * hourlyRate,
  };
};

const withPaymentAmounts = (invoice) => {
  const tongTienPhong = Number(invoice.TongTienPhong || 0);
  const thanhTien = Number(invoice.ThanhTien || 0);
  const soTienDaThu = Number(invoice.SoTienDaThu || 0);
  const surcharge = getTimeSurcharge(invoice);
  const tienDatCoc = Math.max(0, tongTienPhong - surcharge.PhuThuTraMuon) * 0.5;
  const tongCanThu = Math.max(0, thanhTien - tienDatCoc);

  return {
    ...invoice,
    ...surcharge,
    TienDatCoc: tienDatCoc,
    TongCanThu: tongCanThu,
    ConLai:
      invoice.TrangThai === "đã thanh toán"
        ? 0
        : Math.max(0, tongCanThu - soTienDaThu),
  };
};
exports.getAll = async (user) => {
  const { role, MaCN } = user;

  let query = `
        SELECT
            hd.*,

            kh.HoTenKH,

            cn.MaCN,
            cn.TenCN,

            p.MaPhong,
            p.SoPhong,
            p.GiaTheoGio,

            lp.TenLoai,

            ct.NgayNhanPhong,
            ct.NgayTraPhong,

            pp.NgayCheckIn,
            pp.NgayCheckOut,
            pp.TrangThai AS TrangThaiPhanPhong,

            dp.LoaiDat

        FROM hoadon hd

        JOIN phieudatphong dp
            ON dp.MaDP = hd.MaDP

        JOIN khachhang kh
            ON kh.MaKH = dp.MaKH

        JOIN chitiet_dp ct
            ON ct.MaDP = dp.MaDP

        JOIN phanphong pp
            ON pp.MaCTDP = ct.MaCTDP

        JOIN phong p
            ON p.MaPhong = pp.MaPhong

        JOIN loaiphong lp
            ON lp.MaLoai = p.MaLoai

        JOIN chinhanh cn
            ON cn.MaCN = p.MaCN
        `;

  const params = [];

  if (role === "quanly" || role === "tiep_tan") {
    query += `
            WHERE p.MaCN = ?
        `;

    params.push(MaCN);
  }

  query += `ORDER BY hd.NgayXuat DESC`;

  const [rows] = await db.query(query, params);

  return rows.map(withPaymentAmounts);
};
exports.thongKeTongDoanhThu = async () => {
  const [[result]] = await db.query(`
        SELECT
            COUNT(*) AS TongHoaDon,
            COALESCE(
                SUM(ThanhTien),
                0
            ) AS TongDoanhThu
        FROM hoadon
        WHERE TrangThai = 'đã thanh toán'
    `);

  return result;
};
exports.thongKeTheoChiNhanh = async () => {
  const [rows] = await db.query(`
        SELECT
            cn.MaCN,
            cn.TenCN,

            COUNT(hd.MaHD) AS TongHoaDon,

            COALESCE(
                SUM(hd.ThanhTien),
                0
            ) AS TongDoanhThu

        FROM chinhanh cn

        LEFT JOIN phong p
            ON p.MaCN = cn.MaCN

        LEFT JOIN phanphong pp
            ON pp.MaPhong = p.MaPhong

        LEFT JOIN chitiet_dp ct
            ON ct.MaCTDP = pp.MaCTDP

        LEFT JOIN phieudatphong dp
            ON dp.MaDP = ct.MaDP

        LEFT JOIN hoadon hd
            ON hd.MaDP = dp.MaDP
            AND hd.TrangThai='đã thanh toán'

        GROUP BY
            cn.MaCN,
            cn.TenCN

        ORDER BY
            TongDoanhThu DESC
    `);

  return rows;
};
exports.thongKeNgay = async (date) => {
  const [[result]] = await db.query(
    `
            SELECT
                COUNT(*) AS TongHoaDon,

                COALESCE(
                    SUM(ThanhTien),
                    0
                ) AS TongDoanhThu

            FROM hoadon

            WHERE TrangThai='đã thanh toán'
            AND DATE(NgayThanhToan)=?
        `,
    [date],
  );

  return result;
};
exports.thongKeThang = async (month, year) => {
  const [[result]] = await db.query(
    `
            SELECT
                COUNT(*) AS TongHoaDon,

                COALESCE(
                    SUM(ThanhTien),
                    0
                ) AS TongDoanhThu

            FROM hoadon

            WHERE TrangThai='đã thanh toán'
            AND MONTH(NgayThanhToan)=?
            AND YEAR(NgayThanhToan)=?
        `,
    [month, year],
  );

  return result;
};
exports.thongKeNam = async (year) => {
  const [[result]] = await db.query(
    `
            SELECT
                COUNT(*) AS TongHoaDon,

                COALESCE(
                    SUM(ThanhTien),
                    0
                ) AS TongDoanhThu

            FROM hoadon

            WHERE TrangThai='đã thanh toán'
            AND YEAR(NgayThanhToan)=?
        `,
    [year],
  );

  return result;
};
exports.getById = async (user, id) => {
  const { role, MaCN } = user;

  let query = `
    SELECT

        hd.*,

        kh.HoTenKH,
        kh.CCCD,
        kh.SDT,

        cn.TenCN,
        cn.DiaChi,

        p.SoPhong,
        p.GiaTheoGio,

        lp.TenLoai,

        ct.NgayNhanPhong,
        ct.NgayTraPhong,

        pp.NgayCheckIn,
        pp.NgayCheckOut,
        pp.TrangThai AS TrangThaiPhanPhong,

        dp.LoaiDat,
        dp.SoGio

    FROM hoadon hd

    JOIN phieudatphong dp
    ON dp.MaDP = hd.MaDP

    JOIN khachhang kh
    ON kh.MaKH = dp.MaKH

    JOIN chitiet_dp ct
    ON ct.MaDP = dp.MaDP

    JOIN phanphong pp
    ON pp.MaCTDP = ct.MaCTDP

    JOIN phong p
    ON p.MaPhong = pp.MaPhong

    JOIN loaiphong lp
    ON lp.MaLoai = p.MaLoai

    JOIN chinhanh cn
    ON cn.MaCN = p.MaCN

    WHERE hd.MaHD = ?
    `;

  const params = [id];

  if (role === "quanly" || role === "tiep_tan") {
    query += `
            AND p.MaCN = ?
        `;

    params.push(MaCN);
  }

  const [rows] = await db.query(query, params);

  if (!rows.length) {
    throw new Error("Không tìm thấy hóa đơn");
  }

  const invoice = rows[0];

  // Lấy danh sách dịch vụ
  const [services] = await db.query(
    `
    SELECT

        dv.MaDV,

        dv.TenDV,

        dv.GiaDV,

        ctdv.SoLuong,

        ctdv.NgaySuDung,

        (ctdv.SoLuong * ctdv.DonGia) AS ThanhTien

    FROM chitiet_dv ctdv

    JOIN dichvu dv
    ON dv.MaDV = ctdv.MaDV

    WHERE ctdv.MaDP = ?

    ORDER BY ctdv.NgaySuDung
    `,
    [invoice.MaDP],
  );

  invoice.DichVu = services;

  return withPaymentAmounts(invoice);
};
exports.addService = async (user, maHD, body) => {
  const { MaDV, SoLuong } = body;

  // Lấy hóa đơn
  const [[invoice]] = await db.query(
    `
        SELECT *
        FROM HOADON
        WHERE MaHD = ?
        `,
    [maHD],
  );

  if (!invoice) {
    throw new Error("Không tìm thấy hóa đơn");
  }

  if (invoice.TrangThai === "đã thanh toán") {
    throw {
      status: 400,
      message: "Hóa đơn đã thanh toán, không thể chỉnh sửa",
    };
  }

  // Lấy dịch vụ
  const [[service]] = await db.query(
    `
        SELECT *
        FROM DICHVU
        WHERE MaDV = ?
        `,
    [MaDV],
  );

  if (!service) {
    throw new Error("Dịch vụ không tồn tại");
  }

  // Sinh mã CTDV
  const maCTDV = "DV" + Date.now().toString().slice(-8);

  // Insert
  await db.query(
    `
        INSERT INTO CHITIET_DV
        (
            MaCTDV,
            SoLuong,
            DonGia,
            MaDP,
            MaDV
        )
        VALUES(?,?,?,?,?)
        `,
    [maCTDV, SoLuong, service.GiaDV, invoice.MaDP, MaDV],
  );

  // Tính lại tổng dịch vụ
  const [[tongDV]] = await db.query(
    `
        SELECT
            COALESCE(
                SUM(SoLuong * DonGia),
                0
            ) TongTienDV
        FROM CHITIET_DV
        WHERE MaDP = ?
        `,
    [invoice.MaDP],
  );

  // Update hóa đơn
  await db.query(
    `
        UPDATE HOADON
        SET
            TongTienDV = ?,
            ThanhTien = TongTienPhong + ?
        WHERE MaHD = ?
        `,
    [tongDV.TongTienDV, tongDV.TongTienDV, maHD],
  );

  return {
    message: "Thêm dịch vụ thành công",
  };
};
exports.collectMoney = async (MaHD, soTienNhan) => {
  const invoice = await model.getById(MaHD);

  if (!invoice) {
    throw {
      status: 404,
      message: "Không tìm thấy hóa đơn",
    };
  }

  if (invoice.TrangThai === "đã thanh toán") {
    throw {
      status: 400,
      message: "Hóa đơn đã thanh toán, không thể chỉnh sửa",
    };
  }

  const tamTinh = Number(invoice.ThanhTien);
  const tienCoc = withPaymentAmounts(invoice).TienDatCoc;

  // Tổng cần thanh toán sau khi trừ tiền cọc
  const tongCanThu = tamTinh - tienCoc;

  // Đã thu trước đó
  const daThu = Number(invoice.SoTienDaThu || 0);

  // Lần này khách đưa
  const tienNhan = Number(soTienNhan);

  if (tienNhan <= 0) {
    throw {
      status: 400,
      message: "Số tiền không hợp lệ",
    };
  }

  // Tổng đã thu sau lần này
  const tongDaThu = daThu + tienNhan;

  // Lưu DB
  const conLai = Math.max(0, tongCanThu - tongDaThu);

  const tienThua = tongDaThu > tongCanThu ? tongDaThu - tongCanThu : 0;

  await model.updateSoTienDaThu(MaHD, tongDaThu);

  return {
    success: conLai === 0,

    tongCanThu,

    daThu: tongDaThu,

    conLai,

    tienThua,
  };
};
