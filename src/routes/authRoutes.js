const express = require("express");
const router = express.Router();
const controller = require("../controller/authController");

router.post(
  "/login",
  (req, res, next) => {
    console.log("===> Flutter gọi API login");
    next();
  },
  controller.login,
);

module.exports = router;
