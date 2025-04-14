import axios from "axios";

const RD_API = "https://api.real-debrid.com/rest/1.0";

async function getDownloads(RD_TOKEN) {
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

export { getDownloads };
