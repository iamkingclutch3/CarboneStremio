require("dotenv").config();
const builder = require("./index");

const port = process.env.PORT || 7000;

require("http")
  .createServer(builder.getInterface())
  .listen(port, "0.0.0.0", () => {
    console.log(`✅ Addon running on 0.0.0.0:${port}`);
  });
