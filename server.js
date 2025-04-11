require("dotenv").config();
const { serveHTTP } = require("stremio-addon-sdk");
const builder = require("./index");

const port = process.env.PORT || 7000;

serveHTTP(builder.getInterface(), { port: port });
