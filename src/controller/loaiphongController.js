const service = require("../services/loaiphongService");
const db = require("../config/db");

exports.getAll = async (req, res) => {
  try {
    console.log("REQ.USER =", req.user);

    const data = await service.getAll(req.user);

    res.json(data);
  } catch (err) {
    console.error("loaiphong ERROR:");
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getPublic = async (req, res) => {
  exports.getRoomsByType = async (req, res) => {
    try {
      const { maLoai } = req.params;

      const { MaCN, NgayNhan, NgayTra, LoaiDat, SoGio } = req.query;

      const rooms = await service.getRoomsByType(maLoai, {
        MaCN,
        NgayNhan,
        NgayTra,
        LoaiDat,
        SoGio,
      });

      res.json({
        success: true,
        data: rooms,
      });
    } catch (err) {
      console.log(err);

      res.status(err.status || 500).json({
        success: false,
        message: err.message,
      });
    }
  };

  try {
    const { MaCN, MaLoai } = req.query;

    const data = await service.getPublic(MaCN, MaLoai);

    res.json(data);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Lỗi lấy loại phòng",
    });
  }
};

/* GET BY ID */
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM loaiphong WHERE MaLoai = ?",
      [req.params.id],
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Loại phòng không tồn tại",
      });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* CREATE */
exports.create = async (req, res) => {
  try {
    const body = {
      ...req.body,

      HinhAnh: req.file ? `/uploads/loaiphong/${req.file.filename}` : "",
    };
    if (body.MaCNList) {
      body.MaCNList = JSON.parse(body.MaCNList);
    }

    const result = await service.create(
      req.user,

      body,
    );

    res.json(result);
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

/* UPDATE */
exports.update = async (req, res) => {
  try {
    const body = {
      ...req.body,
    };

    if (req.file) {
      body.HinhAnh = `/uploads/loaiphong/${req.file.filename}`;
    }
    if (body.MaCNList) {
      body.MaCNList = JSON.parse(body.MaCNList);
    }

    const result = await service.update(
      req.user,

      req.params.id,

      body,
    );

    res.json(result);
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

/* DELETE */
exports.remove = async (req, res) => {
  try {
    const result = await service.remove(req.user, req.params.id);

    res.json(result);
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

/* PUBLIC FILTER ROOM TYPES */
exports.getByChiNhanh = async (req, res) => {
  try {
    const { MaCN, MaLoai, GiaMax } = req.query;

    let query = `
            SELECT DISTINCT
                lp.*
            FROM loaiphong lp
            JOIN phong p
                ON p.MaLoai = lp.MaLoai
            WHERE lp.TrangThai=1
        `;

    const params = [];

    if (MaCN) {
      query += " AND p.MaCN = ?";
      params.push(MaCN);
    }

    if (MaLoai) {
      query += " AND lp.MaLoai = ?";
      params.push(MaLoai);
    }

    if (GiaMax) {
      query += " AND p.GiaPhong <= ?";
      params.push(GiaMax);
    }

    const [rows] = await db.execute(query, params);

    res.json(rows);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* GET ROOMS BY TYPE */
exports.getRoomsByType = async (req, res) => {
  try {
    const { maLoai } = req.params;

    const { MaCN, NgayNhan, NgayTra, LoaiDat, SoGio } = req.query;

    const rooms = await service.getRoomsByType(maLoai, {
      MaCN,
      NgayNhan,
      NgayTra,
      LoaiDat,
      SoGio,
    });

    res.json({
      success: true,
      data: rooms,
    });
  } catch (err) {
    console.log(err);

    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.hide = async (req, res) => {
  try {
    const result = await service.hide(req.user, req.params.id);

    res.json(result);
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

exports.show = async (req, res) => {
  try {
    const result = await service.show(req.user, req.params.id);

    res.json(result);
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};
