const PQueue = require("p-queue");
const fetch = (...args) =>
  import("node-fetch").then((mod) => mod.default(...args));
const cache = new Map();

const queue = new PQueue({
  intervalCap: 5, // 5 requests per interval
  interval: 1000, // 1 second
  carryoverConcurrencyCount: true, // Carry over unfinished requests
});

const OPEN_SUBTITLES_API_KEY = process.env.OPEN_SUBTITLES_TOKEN;

// Helper to get a clean episode number
function extractSingleEpisode(episodes) {
  if (Array.isArray(episodes)) {
    return episodes.length > 0 ? Math.min(...episodes) : null;
  } else if (typeof episodes === "number") {
    return episodes;
  }
  return null;
}

const fixFilename = (str) => {
  return str.replace(/(Capitulo_)\d+-\((\d+)\)/, (_, prefix, epReal) => {
    return `${prefix}${epReal}`;
  });
};

async function parseFilename(filename) {
  filename = fixFilename(filename);

  if (cache.has(filename)) {
    return cache.get(filename);
  }

  return queue.add(async () => {
    try {
      const url = `https://api.opensubtitles.com/api/v1/utilities/guessit?filename=${encodeURIComponent(
        filename
      )}`;

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Api-Key": OPEN_SUBTITLES_API_KEY,
          "User-Agent": "CarboneStremio/1.0",
        },
      });

      if (!res.ok) {
        console.error("❌ OpenSubtitles API error:", res.status);
        return null;
      }

      const data = await res.json();

      // Ensure we only take ONE episode number
      const cleanEpisode = extractSingleEpisode(data.episode);
      return {
        title: data.title || null,
        filename: filename,
        episode: cleanEpisode,
        season: data.season || 1,
        subtitle_language: data.subtitle_language || "",
      };
    } catch (err) {
      console.error("❌ Failed to parse filename via OpenSubtitles:", err);
      return null;
    }
  });
}

module.exports = {
  parseFilename,
};
