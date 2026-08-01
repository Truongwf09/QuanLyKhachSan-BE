const service = require("../services/phongService");

const respond = (res, status, work) =>
  work()
    .then((data) => res.status(status).json(data))
    .catch((err) => res.status(err.status || 500).json({ message: err.message }));

exports.getAll = (req, res) => respond(res, 200, () => service.getAll(req.user));

exports.create = (req, res) =>
  respond(res, 200, () => service.create(req.user, req.body));

exports.update = (req, res) =>
  respond(res, 200, () => service.update(req.user, req.params.id, req.body));

exports.remove = (req, res) =>
  respond(res, 200, () => service.remove(req.user, req.params.id));

exports.getPublicRooms = (req, res) =>
  respond(res, 200, () => service.getPublicRooms(req.query.MaLoai));

exports.getPublicRoomDetail = (req, res) =>
  respond(res, 200, () => service.getPublicRoomDetail(req.params.id));

exports.getAvailableRooms = (req, res) =>
  respond(res, 200, () => service.getAvailableRooms(req.query));

exports.getCheckoutPending = (req, res) =>
  respond(res, 200, () => service.getCheckoutPending(req.user.MaCN));

exports.finishCleaning = (req, res) =>
  respond(res, 200, async () => {
    const result = await service.finishCleaning(req.params.id, req.user.MaCN);
    return { message: "Hoàn thành dọn dẹp", result };
  });
