const nodemailer = require("nodemailer");
const QRCode = require("qrcode");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: "Xác thực tài khoản khách sạn",
    html: `
            <div style="font-family: Arial; padding:20px;">
                <h2>Xác thực email</h2>
                <p>Mã OTP của bạn là:</p>
                <h1 style="color:blue;">${otp}</h1>
                <p>Mã có hiệu lực trong 5 phút.</p>
            </div>
        `,
  });
};

exports.sendBookingSuccessEmail = async (email, bookingInfo) => {
  const bookingUrl = `http://localhost:5173/khachhang/booking/${bookingInfo.MaDP}`;

  const qrBuffer = await QRCode.toBuffer(bookingUrl, {
    width: 220,
    margin: 2,
  });

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: "Xác nhận đặt phòng thành công",
    html: `
            <div style="font-family: Arial; padding:20px;">
                <h2>Đặt phòng thành công 🎉</h2>

                <p>Xin chào <b>${bookingInfo.HoTenKH || ""}</b></p>

                <p><b>Mã đặt phòng:</b> ${bookingInfo.MaDP}</p>
                <p><b>Mã chi tiết:</b> ${bookingInfo.MaCTDP}</p>
                <p><b>Loại đặt:</b> ${bookingInfo.LoaiDat}</p>
                <p><b>Ngày nhận:</b> ${bookingInfo.NgayNhan}</p>
                <p><b>Ngày trả:</b> ${bookingInfo.NgayTra}</p>

                <hr/>

                <p>Quét QR để xem chi tiết booking:</p>

                <img
                    src="cid:bookingqr"
                    width="220"
                    height="220"
                />

                <p style="margin-top:20px;">
                    Hoặc mở trực tiếp:
                    <br/>
                    <a href="${bookingUrl}">
                        ${bookingUrl}
                    </a>
                </p>
            </div>
        `,
    attachments: [
      {
        filename: "booking-qr.png",
        content: qrBuffer,
        cid: "bookingqr",
      },
    ],
  });
};

exports.sendBookingFailedEmail = async (email, reason = "") => {
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: "Đặt phòng thất bại",
    html: `
            <div style="font-family: Arial; padding:20px;">
                <h2>Đặt phòng thất bại</h2>
                <p>
                    Rất tiếc, yêu cầu đặt phòng của bạn không thành công.
                </p>
                ${reason ? `<p>Lý do: <b>${reason}</b></p>` : ""}
            </div>
        `,
  });
};
