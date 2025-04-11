require("dotenv").config();
const builder = require("./index");

const port = process.env.PORT || 7000;
const ip = process.env.IP || localhost;

require("http")
  .createServer(builder.getInterface())
  .listen(port, ip, () => {
    console.log(`✅ Addon running on ${ip}:${port}`);
  });
