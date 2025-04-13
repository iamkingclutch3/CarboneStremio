import "dotenv/config";
import express from "express";
import stremioAddonSDK from "stremio-addon-sdk";
import builder from "./index.js";
import { perfTracker } from "./services/performanceTracker.js";
import fs from "fs";
import path from "path";

const app = express();
const { serveHTTP } = stremioAddonSDK;

const port = process.env.PORT || 80;
const stremio_port = process.env.STREMIO_PORT || 7000;
const ip = process.env.IP || "0.0.0.0";

app.use(express.static("public"));

// Landing page
app.get("/", (req, res) => {
  const baseUrl = `http://${req.hostname}${
    ["localhost", "127.0.0.1", "0.0.0.0"].includes(req.hostname)
      ? `:${port}`
      : ""
  }`;

  const manifestUrl = `${baseUrl}/manifest.json`;
  const stremioInstallUrl = `stremio://${req.hostname}${
    ["localhost", "127.0.0.1", "0.0.0.0"].includes(req.hostname)
      ? `:${stremio_port}`
      : ""
  }/manifest.json`;

  // Read and render the HTML template

  fs.readFile(
    path.join(process.cwd(), ".", "public", "landing.html"),
    "utf8",
    (err, data) => {
      if (err) {
        return res.status(500).send("Error loading landing page");
      }

      const renderedHtml = data
        .replace("{{STREMIO_INSTALL_URL}}", stremioInstallUrl)
        .replace("{{MANIFEST_URL}}", manifestUrl);

      res.send(renderedHtml);
    }
  );
});

app.get("/metrics", (req, res) => {
  res.json({
    status: "healthy",
    metrics: perfTracker.getMetrics(),
    uptime: process.uptime(),
  });
});

serveHTTP(builder.getInterface(), { port: stremio_port });

app.listen(port, ip, () => {
  console.log(`🚀 Stremio addon running at http://${ip}:${port}`);
});