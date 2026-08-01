const model = require("../model/datphongModel");
const bookingHelper = require("../helpers/bookingHelper");
const paymentHelper = require("../helpers/paymentHelper");
const mailService = require("./mailService");
const db = require("../config/db");

const calculateLateCheckoutSurcharge = (
  actualTime,
  scheduledTime,
  hourlyRate,
) => {
  const differenceMs = actualTime.getTime() - scheduledTime.getTime();
  const extraHours = Math.max(0, Math.ceil(differenceMs / (60 * 60 * 1000)));

  return {
    extraHours,
    amount: extraHours * Number(hourlyRate || 0),
  };
};
/* =========================
   CREATE BOOKING
========================= */

exports.create = async (MaKH, data) => {
  const {
    MaCN,
    MaLoai,
    MaPhong,
    SoNguoi,
    DichVu = [],
    PhuongThucTT = "bank",
  } = data;

  if (!MaKH || !MaCN || !MaLoai || !MaPhong) {
    throw {
      status: 400,
      message: "Thiếu dữ liệu đặt phòng",
    };
  }

  paymentHelper.validatePaymentMethod(PhuongThucTT);

  const conn = await model.getConnection();

  try {
    await conn.beginTransaction();

    const bookingTime = bookingHelper.resolveBookingTime(data);

    const { finalNgayNhan, finalNgayTra, finalLoaiDat, soDem, SoGio } =
      bookingTime;

    const [[room]] = await model.getRoom(conn, MaPhong, MaLoai, MaCN);

    if (!room) {
      throw {
        status: 400,
        message: "Phòng không hợp lệ",
      };
    }

    if (Number(SoNguoi || 1) > Number(room.SoNguoiToiDa)) {
      throw {
        status: 400,
        message: `Loại phòng chỉ tối đa ${room.SoNguoiToiDa} người`,
      };
    }

    const [dupCustomer] = await model.checkDuplicateCustomerBooking(
      conn,
      MaKH,
      finalNgayNhan,
      finalNgayTra,
    );

    const [dupRoom] = await model.checkDuplicateRoomBooking(
      conn,
      MaPhong,
      finalNgayNhan,
      finalNgayTra,
    );

    if (dupRoom.length > 0) {
      throw {
        status: 400,
        message: "Phòng đã được đặt trong khoảng thời gian này",
      };
    }

    const codes = bookingHelper.generateCodes();

    const { MaDP, MaCTDP, MaPP, MaHD } = codes;

    const tongTienPhong = bookingHelper.calculateRoomPrice(
      room,
      finalLoaiDat,
      soDem,
      SoGio,
    );

    await model.createBooking(conn, MaDP, finalLoaiDat, SoGio, MaKH);

    await model.createBookingDetail(
      conn,
      MaCTDP,
      finalNgayNhan,
      finalNgayTra,
      SoNguoi || 1,
      MaDP,
      MaLoai,
    );

    await model.createPhanPhong(conn, MaPP, MaPhong, MaCTDP);

    let tongTienDV = 0;
    const usedServices = [];

    for (const item of DichVu) {
      const [[dv]] = await model.getService(conn, item.MaDV, MaCN);

      if (!dv) {
        throw {
          status: 400,
          message: `Dịch vụ ${item.MaDV} không thuộc chi nhánh này`,
        };
      }

      const soLuong = Number(item.SoLuong || 1);

      if (soLuong <= 0) {
        throw {
          status: 400,
          message: "Số lượng dịch vụ không hợp lệ",
        };
      }

      const thanhTienDV = Number(dv.GiaDV) * soLuong;

      tongTienDV += thanhTienDV;

      await model.createServiceDetail(conn, {
        MaCTDV: bookingHelper.generateServiceCode(),
        SoLuong: soLuong,
        DonGia: dv.GiaDV,
        MaDP,
        MaDV: dv.MaDV,
      });

      usedServices.push({
        MaDV: dv.MaDV,
        TenDV: dv.TenDV,
        SoLuong: soLuong,
        DonGia: dv.GiaDV,
        ThanhTien: thanhTienDV,
      });
    }
    const thanhTien = tongTienPhong + tongTienDV;
    const tienDatCoc = tongTienPhong * 0.5;

    await model.createInvoice(conn, {
      MaHD,
      SoDem: soDem,
      TongTienPhong: tongTienPhong,
      TongTienDV: tongTienDV,
      ThanhTien: thanhTien,
      PhuongThucTT,
      MaDP,
    });

    await conn.commit();

    const payment = await paymentHelper.buildPaymentResponse(
      PhuongThucTT,
      MaHD,
      tienDatCoc,
    );

    return {
      message: "Gửi yêu cầu đặt phòng thành công",

      booking: {
        MaDP,
        MaCTDP,
        MaPP,
        MaPhong,
        MaLoai,
        MaCN,
        LoaiDat: finalLoaiDat,
        SoGio,
        NgayNhanPhong: finalNgayNhan.toISOString(),
        NgayTraPhong: finalNgayTra.toISOString(),
      },

      invoice: {
        MaHD,
        SoDem: soDem,
        TongTienPhong: tongTienPhong,
        TongTienDV: tongTienDV,
        ThanhTien: thanhTien,
        TienDatCoc: tienDatCoc,
        TongCanThu: thanhTien - tienDatCoc,
        ConLai: thanhTien - tienDatCoc,
        PhuongThucTT,
      },

      services: usedServices,
      payment,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =========================
   GET ALL
========================= */

exports.getAll = async (user) => {
  const conn = await model.getConnection();

  try {
    const [rows] = await model.getPendingBookings(conn, user);

    for (const row of rows) {
      const [services] = await model.getBookingServices(conn, row.MaDP);

      row.DichVu = services;
    }

    return rows;
  } finally {
    conn.release();
  }
};

/* =========================
   GET AVAILABLE ROOMS
========================= */

exports.getAvailableRooms = async (
  MaCN,
  MaLoai,
  NgayNhan,
  NgayTra,
  data = {},
) => {
  if (!MaCN || !MaLoai || !NgayNhan) {
    throw {
      status: 400,
      message: "Thiếu dữ liệu tìm phòng",
    };
  }

  const conn = await model.getConnection();

  try {
    const bookingTime = bookingHelper.resolveBookingTime({
      NgayNhan,
      NgayTra,
      LoaiDat: data.LoaiDat,
      SoGio: data.SoGio,
    });

    const { finalNgayNhan, finalNgayTra, finalLoaiDat, soDem, SoGio } =
      bookingTime;

    const [rooms] = await conn.query(
      `
            SELECT
                p.*,
                lp.*
            FROM phong p
            JOIN loaiphong lp
                ON p.MaLoai = lp.MaLoai
            WHERE p.MaCN = ?
            AND p.MaLoai = ?
            AND p.TinhTrangPhong != 'bảo trì'
            AND p.MaPhong NOT IN (
                SELECT pp.MaPhong
                FROM phanphong pp
                JOIN chitiet_dp ct
                    ON pp.MaCTDP = ct.MaCTDP
                JOIN phieudatphong dp
                    ON ct.MaDP = dp.MaDP
                WHERE pp.TrangThai NOT IN (
                    'đã hủy',
                    'trả phòng'
                )
                AND ct.NgayNhanPhong < ?
                AND ct.NgayTraPhong > ?
            )
        `,
      [MaCN, MaLoai, finalNgayTra, finalNgayNhan],
    );

    return rooms.map((room) => ({
      ...room,
      estimatedPrice: bookingHelper.calculateRoomPrice(
        room,
        finalLoaiDat,
        soDem,
        SoGio,
      ),
      LoaiDat: finalLoaiDat,
      SoGio,
      NgayNhanPhong: finalNgayNhan.toISOString(),
      NgayTraPhong: finalNgayTra.toISOString(),
    }));
  } finally {
    conn.release();
  }
};

/* =========================
   CONFIRM
========================= */

exports.confirmBooking = async (MaCTDP, MaQTV) => {
  const conn = await model.getConnection();

  try {
    await conn.beginTransaction();

    const [[booking]] = await model.getBookingByCTDP(conn, MaCTDP);

    if (!booking) {
      throw {
        status: 404,
        message: "Không tìm thấy booking",
      };
    }

    if (booking.TrangThai !== "chưa xác nhận") {
      throw {
        status: 400,
        message: "Booking không ở trạng thái chờ xác nhận",
      };
    }

    await model.confirmBooking(conn, booking.MaDP, MaQTV);

    await model.confirmPhanPhong(conn, MaCTDP);

    await conn.commit();

    if (mailService?.sendBookingSuccessEmail) {
      await mailService.sendBookingSuccessEmail(booking.Email, {
        HoTenKH: booking.HoTenKH,
        MaDP: booking.MaDP,
        MaCTDP: booking.MaCTDP,
        LoaiDat: booking.LoaiDat,
        NgayNhan: booking.NgayNhanPhong,
        NgayTra: booking.NgayTraPhong,
      });
    }

    return {
      message: "Xác nhận booking thành công",
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =========================
   CANCEL
========================= */

exports.datphongThatBai = async (MaCTDP, reason, MaQTV) => {
  const conn = await model.getConnection();

  try {
    await conn.beginTransaction();

    const [[booking]] = await model.getBookingByCTDP(conn, MaCTDP);

    if (!booking) {
      throw {
        status: 404,
        message: "Không tìm thấy booking",
      };
    }

    await model.cancelBooking(conn, booking.MaDP, reason, MaQTV);

    await model.cancelPhanPhong(conn, MaCTDP);

    await model.markInvoiceExpired(conn, booking.MaDP);

    await conn.commit();
    if (booking.Email && mailService?.sendBookingFailedEmail) {
      await mailService.sendBookingFailedEmail(booking.Email, reason);
    }

    return {
      message: "Hủy booking thành công",
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =========================
   CHECK IN
========================= */

exports.checkIn = async (MaPP) => {
  const conn = await model.getConnection();

  try {
    await conn.beginTransaction();

    const [[booking]] = await model.getBookingByPP(conn, MaPP);

    if (!booking) {
      throw {
        status: 404,
        message: "Không tìm thấy phân phòng",
      };
    }

    if (booking.TrangThai !== "đã xác nhận") {
      throw {
        status: 400,
        message: "Booking chưa được xác nhận",
      };
    }

    if (booking.TrangThaiPhanPhong !== "đã giữ phòng") {
      throw {
        status: 400,
        message: "Phòng chưa sẵn sàng",
      };
    }

    const now = new Date();
    const checkInDate = new Date(booking.NgayNhanPhong);

    if (now < checkInDate) {
      throw {
        status: 400,
        message: "Chưa tới giờ check-in",
      };
    }

    await model.checkIn(
      conn,
      booking.MaPP,
      booking.MaPhong,
      booking.MaDP,
      booking.MaCTDP,
    );

    await conn.commit();

    return {
      message: "Check-in thành công",
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =========================
   CHECK OUT
========================= */

exports.checkOut = async (MaPP) => {
  const conn = await model.getConnection();

  try {
    await conn.beginTransaction();

    const [[booking]] = await model.getBookingByPP(conn, MaPP);

    if (!booking) {
      throw {
        status: 404,
        message: "Không tìm thấy phân phòng",
      };
    }

    if (booking.TrangThaiPhanPhong !== "đang ở") {
      throw {
        status: 400,
        message: "Khách chưa check-in",
      };
    }

    const now = new Date();
    const surcharge = calculateLateCheckoutSurcharge(
      now,
      new Date(booking.NgayTraPhong),
      booking.GiaTheoGio,
    );

    await model.checkOut(
      conn,
      booking.MaPP,
      booking.MaPhong,
      booking.MaDP,
      booking.MaCTDP,
      now,
    );
    await model.syncLateCheckoutSurcharge(conn, booking.MaDP, now);

    const MaDD = "DD" + Date.now();

    console.log("Tạo công việc dọn phòng");

    await model.createCleaningJob(conn, MaDD, booking.MaPhong);
    // Chỉ chốt hóa đơn khi lễ tân thực hiện checkout.
    await model.markInvoicePaid(conn, booking.MaDP);

    await conn.commit();

    return {
      message: "Check-out thành công",
      surcharge,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
exports.syncActiveLateCheckoutSurcharges = async () => {
  const conn = await model.getConnection();

  try {
    await model.syncActiveLateCheckoutSurcharges(conn);
  } finally {
    conn.release();
  }
};

exports.getDetail = async (MaCTDP) => {
  const conn = await model.getConnection();

  try {
    const [[booking]] = await model.getBookingDetail(conn, MaCTDP);

    if (!booking) {
      throw {
        status: 404,
        message: "Không tìm thấy booking",
      };
    }

    const [services] = await model.getBookingServices(conn, booking.MaDP);

    booking.DichVu = services;

    return booking;
  } finally {
    conn.release();
  }
};

exports.getCheckInList = async (user) => {
  const conn = await model.getConnection();

  try {
    const [rows] = await model.getCheckInList(conn, user);
    return rows;
  } finally {
    conn.release();
  }
};

exports.getCheckOutList = async (user) => {
  const conn = await model.getConnection();

  try {
    const [rows] = await model.getCheckOutList(conn, user);
    return rows;
  } finally {
    conn.release();
  }
};
exports.getCalendar = async (user) => {
  const conn = await model.getConnection();
  try {
    const [rows] = await model.getCalendar(conn, user);
    return rows;
  } finally {
    conn.release();
  }
};
/* =========================
   MY BOOKINGS
========================= */

exports.getMyBookings = async (MaKH) => {
  const conn = await model.getConnection();

  try {
    const [rows] = await model.getMyBookings(conn, MaKH);

    return rows;
  } finally {
    conn.release();
  }
};
exports.getBookingDetail = async (MaDP, MaKH) => {
  const conn = await model.getConnection();

  try {
    const rows = await model.getBookingDetailByCustomer(conn, MaDP, MaKH);

    if (!rows || rows.length === 0) {
      throw {
        status: 404,
        message: "Không tìm thấy đơn đặt phòng",
      };
    }

    const booking = rows[0];

    const [services] = await model.getBookingServices(conn, booking.MaDP);

    booking.DichVu = services;

    return booking;
  } finally {
    conn.release();
  }
};
exports.getBookingForCheckin = async (MaDP, MaCN) => {
  const conn = await model.getConnection();

  try {
    const rows = await model.getBookingForCheckin(conn, MaDP, MaCN);

    if (!rows.length) {
      throw {
        status: 404,
        message: "Không tìm thấy đơn đặt phòng",
      };
    }

    return rows[0];
  } finally {
    conn.release();
  }
};
