function resolveBookingTime(data) {
  const { NgayNhan, NgayTra, LoaiDat = "theo ngày", SoGio = null } = data;

  let finalNgayNhan;
  let finalNgayTra;
  let finalLoaiDat = LoaiDat;
  let soDem = null;

  if (LoaiDat === "theo ngày") {
    if (!NgayTra) {
      throw {
        status: 400,
        message: "Thiếu ngày trả",
      };
    }

    finalNgayNhan = new Date(`${NgayNhan}T14:00:00`);
    finalNgayTra = new Date(`${NgayTra}T12:00:00`);

    if (isNaN(finalNgayNhan.getTime()) || isNaN(finalNgayTra.getTime())) {
      throw {
        status: 400,
        message: "Ngày đặt không hợp lệ",
      };
    }

    if (finalNgayTra <= finalNgayNhan) {
      throw {
        status: 400,
        message: "Ngày trả phải sau ngày nhận",
      };
    }

    soDem = Math.ceil((finalNgayTra - finalNgayNhan) / (1000 * 60 * 60 * 24));
  } else if (LoaiDat === "qua đêm") {
    finalNgayNhan = new Date(NgayNhan);

    if (isNaN(finalNgayNhan.getTime())) {
      throw {
        status: 400,
        message: "Ngày đặt không hợp lệ",
      };
    }

    // Ép giờ nhận về 22:00
    finalNgayNhan.setHours(22, 0, 0, 0);

    finalNgayTra = new Date(finalNgayNhan);

    finalNgayTra.setDate(finalNgayTra.getDate() + 1);

    // Trả phòng 12h hôm sau
    finalNgayTra.setHours(12, 0, 0, 0);

    soDem = 1;
  } else if (LoaiDat === "theo giờ") {
    if (![2, 4, 6, 12].includes(Number(SoGio))) {
      throw {
        status: 400,
        message: "Chỉ hỗ trợ 2 / 4 / 6 / 12 giờ",
      };
    }

    finalNgayNhan = new Date(NgayNhan);

    if (isNaN(finalNgayNhan.getTime())) {
      throw {
        status: 400,
        message: "Ngày giờ đặt không hợp lệ",
      };
    }

    finalNgayTra = new Date(finalNgayNhan);

    finalNgayTra.setHours(finalNgayTra.getHours() + Number(SoGio));

    const gio22 = new Date(finalNgayNhan);

    gio22.setHours(22, 0, 0, 0);

    if (finalNgayTra >= gio22) {
      finalLoaiDat = "qua đêm";

      finalNgayNhan = new Date(finalNgayNhan);

      finalNgayNhan.setHours(22, 0, 0, 0);

      finalNgayTra = new Date(finalNgayNhan);

      finalNgayTra.setDate(finalNgayTra.getDate() + 1);

      finalNgayTra.setHours(12, 0, 0, 0);

      soDem = 1;
    }
  } else {
    throw {
      status: 400,
      message: "Loại đặt không hợp lệ",
    };
  }

  if (finalNgayNhan < new Date()) {
    throw {
      status: 400,
      message: "Không thể đặt trong quá khứ",
    };
  }

  return {
    finalNgayNhan,
    finalNgayTra,
    finalLoaiDat,
    soDem,
    SoGio: finalLoaiDat === "theo giờ" ? SoGio : null,
  };
}

function calculateRoomPrice(roomType, finalLoaiDat, soDem, SoGio) {
  if (finalLoaiDat === "theo ngày") {
    return Number(roomType.GiaPhong) * soDem;
  }

  if (finalLoaiDat === "qua đêm") {
    return Number(roomType.GiaQuaDem);
  }

  return Number(roomType.GiaTheoGio) * Number(SoGio);
}

function generateCodes() {
  const timePart = Date.now().toString().slice(-6);

  const rand = Math.floor(100 + Math.random() * 900);

  return {
    MaDP: `DP${timePart}${rand}`,
    MaCTDP: `CT${timePart}${rand + 1}`,
    MaPP: `PP${timePart}${rand + 2}`,
    MaHD: `HD${timePart}${rand + 3}`,
  };
}

function generateServiceCode() {
  const timePart = Date.now().toString().slice(-6);

  const rand = Math.floor(100 + Math.random() * 900);

  return `DV${timePart}${rand}`;
}

module.exports = {
  resolveBookingTime,
  calculateRoomPrice,
  generateCodes,
  generateServiceCode,
};
