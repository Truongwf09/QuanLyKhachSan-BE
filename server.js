// require("dotenv").config();
// const express = require("express");
// const app = require("./src/app");

// app.listen(process.env.PORT, () => {
//     console.log("Server running" + (process.env.PORT));
// });

// app.use(

//     "/uploads",

//     express.static(
//         "uploads"
//     )

// );

require("dotenv").config();

const express = require("express");
const path = require("path");

const app = require("./src/app");
const bookingService = require("./src/services/datphongService");

const syncLateCheckoutSurcharges = async () => {
  try {
    await bookingService.syncActiveLateCheckoutSurcharges();
  } catch (err) {
    console.error("Late checkout surcharge sync failed:", err.message);
  }
};

// Sync immediately, then every minute; it is independent of checkout clicks.
syncLateCheckoutSurcharges();
setInterval(syncLateCheckoutSurcharges, 60 * 1000);

// Public thư mục uploads
app.listen(process.env.PORT, () => {

  console.log(
    "Server running at port " +
    process.env.PORT
  );

});
