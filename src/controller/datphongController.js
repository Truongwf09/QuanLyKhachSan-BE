const service = require("../services/datphongService");

// KHÁCH ĐẶT
exports.create = async (req, res) => {
  try {
    if (!req.user?.MaKH) {
      return res.status(401).json({
        message: "Vui lòng đăng nhập khách hàng để đặt phòng",
      });
    }

    const result = await service.create(req.user.MaKH, req.body);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

// DANH SÁCH BOOKING
exports.getAll = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Không có quyền truy cập",
      });
    }

    const data = await service.getAll(req.user);

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

// PHÒNG TRỐNG
exports.getAvailableRooms = async (req, res) => {
  try {
    const data = await service.getAvailableRooms(
      req.query.MaCN,
      req.query.MaLoai,
      req.query.NgayNhan,
      req.query.NgayTra,
      {
        LoaiDat: req.query.LoaiDat,
        SoGio: req.query.SoGio,
      },
    );

    res.json(data);
  } catch (err) {
    res.status(err.status || 400).json({
      message: err.message,
    });
  }
};

// XÁC NHẬN BOOKING
exports.confirmBooking = async (req, res) => {
  try {
    if (!req.user?.MaQTV) {
      return res.status(401).json({
        message: "Không có quyền xác nhận booking",
      });
    }

    const result = await service.confirmBooking(req.params.id, req.user.MaQTV);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

// HỦY BOOKING
exports.datphongThatBai = async (req, res) => {
  try {
    if (!req.user?.MaQTV) {
      return res.status(401).json({
        message: "Không có quyền hủy booking",
      });
    }

    const { reason } = req.body;

    const result = await service.datphongThatBai(
      req.params.id,
      reason,
      req.user.MaQTV,
    );

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

// CHECK IN
exports.checkIn = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Không có quyền check-in",
      });
    }

    const result = await service.checkIn(req.params.id);

    res.json(result);
  } catch (err) {
    res.status(err.status || 400).json({
      message: err.message,
    });
  }
};

// CHECK OUT
exports.checkOut = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Không có quyền check-out",
      });
    }

    const result = await service.checkOut(req.params.id);

    res.json(result);
  } catch (err) {
    res.status(err.status || 400).json({
      message: err.message,
    });
  }
};
exports.getDetail = async (req, res) => {
  try {
    const data = await service.getDetail(req.params.id);

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

exports.getCheckInList = async (req, res) => {
  try {
    const data = await service.getCheckInList(req.user);

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getCheckOutList = async (req, res) => {
  try {
    const data = await service.getCheckOutList(req.user);

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
exports.getCalendar = async (req, res) => {
  try {
    const data = await service.getCalendar(req.user);

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
exports.getMyBookings = async (req, res) => {
  try {
    if (!req.user?.MaKH) {
      return res.status(401).json({
        message: "Vui lòng đăng nhập",
      });
    }

    const data = await service.getMyBookings(req.user.MaKH);

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};
exports.getBookingDetail = async (req, res) => {
  try {
    const data = await service.getBookingDetail(req.params.MaDP, req.user.MaKH);

    res.json(data);
  } catch (err) {
    console.error(err);

    res.status(err.status || 500).json(err);
  }
};
exports.getBookingForCheckin = async (req, res) => {
  console.log("==== CHECKIN ====");
  console.log("MaDP:", req.params.MaDP);
  console.log("MaCN:", req.user.MaCN);

  try {
    const data = await service.getBookingForCheckin(
      req.params.MaDP,
      req.user.MaCN,
    );

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json(err);
  }
};
