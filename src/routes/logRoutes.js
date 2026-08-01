const express = require("express");
const router = express.Router();
const logController = require("../controller/logController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", verifyToken, logController.getLogs);

module.exports = router;