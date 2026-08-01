const QRCode = require("qrcode");

/* =========================
   THÔNG TIN TÀI KHOẢN KHÁCH SẠN
========================= */

const BANK_ID = "970436"; // Vietcombank
const BANK_NAME = "Vietcombank";

const ACCOUNT_NO = "1040049413";
const ACCOUNT_NAME = "VO PHUONG ANH";

/* =========================
   VALIDATE
========================= */

function validatePaymentMethod(method) {
  if (!["bank", "cash", "momo", "vnpay"].includes(method)) {
    throw {
      status: 400,
      message: "Phương thức thanh toán không hợp lệ",
    };
  }
}

/* =========================
   BUILD PAYMENT RESPONSE
========================= */

async function buildPaymentResponse(method, MaHD, amount) {
  // ================= BANK =================

  if (method === "bank") {
    const transferContent = MaHD;

    const qrUrl =
      `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png` +
      `?amount=${amount}` +
      `&addInfo=${encodeURIComponent(transferContent)}` +
      `&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

    // QR dự phòng nếu VietQR lỗi
    const qrImage = await QRCode.toDataURL(qrUrl);

    return {
      type: "bank",

      bankName: BANK_NAME,

      accountNumber: ACCOUNT_NO,

      accountName: ACCOUNT_NAME,

      amount,

      content: transferContent,

      qrUrl,

      qrImage,
    };
  }

  // ================= CASH =================

  if (method === "cash") {
    return {
      type: "cash",

      amount,
    };
  }

  // ================= MOMO =================

  if (method === "momo") {
    return {
      type: "momo",

      paymentUrl: `https://test-payment.momo.vn/${MaHD}`,
    };
  }

  // ================= VNPAY =================

  if (method === "vnpay") {
    return {
      type: "vnpay",

      paymentUrl: `https://sandbox.vnpayment.vn/${MaHD}`,
    };
  }

  return null;
}

module.exports = {
  validatePaymentMethod,

  buildPaymentResponse,
};
