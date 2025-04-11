const axios = require("axios");
const dotenv = require("dotenv").config();

const RD_API = "https://api.real-debrid.com/rest/1.0";
const RD_TOKEN = process.env.RD_TOKEN;

async function getDownloads() {
  try {
    const response = await axios.get(`${RD_API}/downloads?limit=200`, {
      headers: {
        Authorization: `Bearer ${RD_TOKEN}`,
      },
    });

    // Only return completed files with names and links
    return response.data
      .filter((entry) => entry.filename && entry.download)
      .map((entry) => ({
        filename: entry.filename,
        url: entry.download,
      }));
  } catch (err) {
    console.error("Error fetching from Real-Debrid:", err.message);
    return [];
  }
}

module.exports = {
  getDownloads,
};
