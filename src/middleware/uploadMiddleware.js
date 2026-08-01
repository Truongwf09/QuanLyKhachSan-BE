const multer = require("multer");
const path = require("path");

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(
//             null,
//             "uploads/loaiphong"
//         );
//     },

//     filename: (req,file,cb)=>{
//         let tenLoai =
//             req.body.TenLoai || "loaiphong";
//         tenLoai = tenLoai
//             .normalize("NFD")
//             .replace(
//                 /[\u0300-\u036f]/g,
//                 ""
//             )
//             .replace(/đ/g,"d")
//             .replace(/Đ/g,"D")
//             .toLowerCase()
//             .trim()
//             .replace(/\s+/g,"_");
//         cb(
//             null,
//             tenLoai +
//             path.extname(
//                 file.originalname
//             )
//         );
//     }

// });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(
      null,

      "uploads/loaiphong",
    );
  },

  filename: (req, file, cb) => {
    cb(
      null,

      Date.now() + "-" + file.originalname,
    );
  },
});

module.exports = multer({ storage });
