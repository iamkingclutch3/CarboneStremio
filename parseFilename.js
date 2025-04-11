const fetch = (...args) =>
  import("node-fetch").then((mod) => mod.default(...args));

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

async function parseFilename(filename) {
  filename = fixFilename(filename);

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
      episode: cleanEpisode,
      season: data.season || 1,
    };
  } catch (err) {
    console.error("❌ Failed to parse filename via OpenSubtitles:", err);
    return null;
  }
}

const fixFilename = (str) => {
  return str.replace(/(Capitulo_)\d+-\((\d+)\)/, (_, prefix, epReal) => {
    return `${prefix}${epReal}`;
  });
};

module.exports = {
  parseFilename,
};
