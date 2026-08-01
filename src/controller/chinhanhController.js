const service = require("../services/chinhanhService");

const respond = (res, work) =>
  work()
    .then((data) => res.json(data))
    .catch((err) => res.status(err.status || 500).json({ message: err.message }));

exports.getAll = (req, res) => respond(res, () => service.getAll());
exports.getAllPublic = (req, res) => respond(res, () => service.getAllPublic());
exports.create = (req, res) => respond(res, () => service.create(req.body));
exports.update = (req, res) => respond(res, () => service.update(req.params.id, req.body));
exports.toggleStatus = (req, res) => respond(res, () => service.toggleStatus(req.params.id));
