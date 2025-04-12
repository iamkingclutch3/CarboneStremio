require("dotenv").config();
const express = require("express");
const { getRouter } = require("stremio-addon-sdk");
const builder = require("./index");

const app = express();

const port = process.env.PORT || 7000;
const ip = process.env.IP || "0.0.0.0";

// Mount the addon router
app.use("/", getRouter(builder.getInterface()));

// Landing page
app.get("/", (req, res) => {
  const manifestUrl = `http://${req.hostname}/manifest.json`;
  const stremioInstallUrl = `stremio://${req.hostname}/manifest.json`;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Carbone Stremio Addon</title>
      <style>
        body {
          font-family: sans-serif;
          text-align: center;
          padding: 50px;
          background-color: #1e1e1e;
          color: white;
        }
        .btn {
          padding: 12px 24px;
          background-color: #9147ff;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          text-decoration: none;
          margin-top: 20px;
          display: inline-block;
        }
        .btn:hover {
          background-color: #7e30ff;
        }
      </style>
    </head>
    <body>
      <h1>📺 Carbone Addon for Stremio</h1>
      <p>This addon lets you stream your Real-Debrid downloaded anime via Stremio.</p>
      <a href="${stremioInstallUrl}" class="btn">Install in Stremio</a>
      <p style="margin-top: 40px; font-size: 14px; color: #aaa;">Manifest URL: <br>${manifestUrl}</p>
    </body>
    </html>
  `);
});

// Optional: log that it's running
app.listen(port, ip, () => {
  console.log(`🚀 Stremio addon running at http://${ip}:${port}`);
});
