const { addonBuilder } = require("stremio-addon-sdk");
const { parseFilename } = require("./parseFilename");
const { getDownloads } = require("./rdClient");
const { searchKitsuId } = require("./malSearch");
const fs = require("fs");
const path = require("path");

const manifest = {
  id: "io.github.kingclutch23.carbone",
  version: "1.0.0",
  name: "Carbone",
  description: "Streams your RD-downloaded episodes",
  resources: ["stream"],
  types: ["movie", "series", "anime"],
  idPrefixes: ["kitsu"], // tt for IMDB, mal for MyAnimeList, kitsu for anime
  catalogs: [], // optional
};

const builder = addonBuilder(manifest);

// In-memory caches
const episodeMap = {}; // Store episode data (cached)
const malCache = {}; // Cache MAL ID lookups
const episodeMapCacheTTL = 15 * 60 * 1000; // Cache the episode map for 15 minutes
let lastCacheUpdate = 0; // Timestamp for the last cache update

// Function to refresh the episode map
async function refreshEpisodeMap() {
  const currentTime = Date.now();
  if (currentTime - lastCacheUpdate < episodeMapCacheTTL) {
    console.log("✅ Episode map is still fresh, skipping refresh.");
    return; // Skip refresh if cache is still valid
  }

  console.log("🔄 Refreshing episode map from Real-Debrid...");

  const downloads = await getDownloads();
  const newEpisodeMap = {};

  for (const file of downloads) {
    try {
      const parsed = await parseFilename(file.filename);

      if (!parsed || typeof parsed !== "object") {
        console.warn("⚠️ Parsed result invalid for:", file.filename);
        continue;
      }

      const { title, season, episode, subtitle_language } = parsed;

      if (!title || !episode) continue;

      const malId = await getMalId(title.trim(), season);
      if (!malId) {
        console.warn(`❓ No MAL ID found for "${title}"`);
        continue;
      }

      const streamId = `kitsu:${malId}:${episode}`;
      newEpisodeMap[streamId] = {
        title: `${title} Ep${episode}`,
        url: file.url,
        lang: subtitle_language,
      };
    } catch (err) {
      console.error("Failed to parse filename:", file.filename, err.message);
    }
  }

  // Cache the new episode map and update the last cache timestamp
  Object.assign(episodeMap, newEpisodeMap);
  lastCacheUpdate = currentTime;

  const jsonFilePath = path.join(__dirname, "episodeMap.json");

  fs.writeFileSync(
    jsonFilePath,
    JSON.stringify(newEpisodeMap, null, 2),
    "utf-8"
  );
  console.log(`💾 Episode map saved to ${jsonFilePath}`);

  console.log(
    "✅ Episode map updated:",
    Object.keys(newEpisodeMap).length,
    "episodes loaded."
  );
}

// Cache the MAL ID lookup results
async function getMalId(title, season) {
  const cacheKey = `${title}-${season}`; // Cache key based on title and season

  if (malCache[cacheKey]) {
    console.log(`🔑 Using cached MAL ID for "${title}" season ${season}`);
    return malCache[cacheKey];
  }

  const malId = await searchKitsuId(title, season);
  if (malId) {
    malCache[cacheKey] = malId; // Cache the MAL ID result
    return malId;
  }

  return null;
}

// Refresh the map on boot + every 15 minutes
refreshEpisodeMap();
setInterval(refreshEpisodeMap, 15 * 60 * 1000); // Optional: Refresh every 15 minutes

// 📦 Define stream handler
builder.defineStreamHandler(({ type, id }) => {
  console.log(`Incoming stream request for ${id}`);

  const streamData = episodeMap[id];
  if (streamData) {
    return Promise.resolve({
      streams: [
        {
          title: streamData.title,
          url: streamData.url,
          language: streamData.lang,
        },
      ],
    });
  }

  return Promise.resolve({ streams: [] });
});

module.exports = builder;
