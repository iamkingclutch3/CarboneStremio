import { addonBuilder } from "stremio-addon-sdk";
import { parseFilename } from "./services/filenameParser.js";
import { getDownloads } from "./clients/realDebridClient.js";
import { searchKitsuId } from "./services/malSearchService.js";
import { perfTracker } from "./services/performanceTracker.js";
import { userRequestCache } from "./services/cacheManager.js";
import fs from "fs";
import path from "path";

const dev = Number.parseInt(process.env.DEV) > "0" ? true : false;

const manifest = {
  id: "io.github.kingclutch23.carbone",
  version: "0.0.3",
  name: dev > 1 ? "Carbone Dev" : "Carbone",
  description: "Streams your RD-downloaded episodes",
  resources: ["stream"],
  types: ["movie", "series", "anime"],
  idPrefixes: ["kitsu", "tt"], // tt for IMDB, mal for MyAnimeList, kitsu for anime

  behaviorHints: {
    configurable: true,
    configurationRequired: true, // show config screen before addon can be used
    cacheMaxAge: 3600, // 1 hour in seconds
    cachePrefetch: true,
  },

  config: [
    {
      key: "rd_api_key",
      type: "text",
      title: "Real-Debrid API Key",
      required: true,
      default: "",
    },
  ],

  catalogs: [
    {
      type: "series",
      id: "rd-cache-loader",
      name: "RD Cache Loader",
      extra: [{ name: "genre", isRequired: false }],
    },
  ],
};

const builder = addonBuilder(manifest);

const malCache = {};
const MAL_CACHE_FILE = path.join(process.cwd(), ".", "data", "malIdCache.json");

if (fs.existsSync(MAL_CACHE_FILE)) {
  Object.assign(malCache, JSON.parse(fs.readFileSync(MAL_CACHE_FILE)));
}

setInterval(() => {
  fs.writeFileSync(MAL_CACHE_FILE, JSON.stringify(malCache));
}, 15 * 60 * 1000); // 15 minutes

async function getMalId(title, season) {
  const cacheKey = `${title}-${season}`;

  // Return cached ID if exists
  if (malCache[cacheKey]) {
    return malCache[cacheKey];
  }

  // Fetch and cache permanently if not found
  const malId = await searchKitsuId(title, season);
  if (malId) {
    malCache[cacheKey] = malId;
    console.log(`Cached MAL ID for "${title}" S${season}: ${malId}`);
  }

  return malId || null;
}

const RD_CACHE_FILE = path.join(process.cwd(), ".", "data", "RDCache.json");

function saveCache() {
  try {
    const cacheData = userRequestCache.toJSON();
    fs.writeFileSync(RD_CACHE_FILE, JSON.stringify(cacheData));
  } catch (err) {
    console.error("Cache save failed:", err);
  }
}

let savePending = false;
function debouncedSaveCache() {
  if (savePending) return;
  savePending = true;

  setTimeout(() => {
    saveCache();
    savePending = false;
  }, 1000);
}

async function getRealDebridStreams(id, rdApiKey) {
  const timer = perfTracker.startTimer();

  const cacheKey = `${id}:${rdApiKey}`;
  let streams = [];

  try {
    const cached = userRequestCache.get(cacheKey);
    if (cached?.expires > Date.now()) {
      perfTracker.record("cache", 0, { hits: 1 });
      return cached.streams;
    }

    perfTracker.record("cache", 0, { misses: 1 });

    // Extract info from ID (e.g., "kitsu:8203:2" -> malId=8203, episode=2)
    const [prefix, malId, episode] = id.split(":");

    const rdApiTimer = perfTracker.startTimer();
    const downloads = await getDownloads(rdApiKey);
    perfTracker.record("rdApi", rdApiTimer.end(), {
      items: downloads?.length || 0,
    });

    if (!downloads?.length) return [];

    const seenFilenames = new Set();

    const batchSize = 10;
    let filesProcessed = 0;
    let filesMatched = 0;

    for (let i = 0; i < downloads.length; i += batchSize) {
      const batchTimer = perfTracker.startTimer();
      const batch = downloads.slice(i, i + batchSize);
      filesProcessed += batch.length;

      const batchResults = await Promise.all(
        batch.map(async (file) => {
          try {
            if (seenFilenames.has(file.filename)) {
              if (dev > 0) console.log("Skipping duplicated:", file.filename);
              perfTracker.record("duplicates", 0, { count: 1 });
              return null;
            }

            seenFilenames.add(file.filename);

            const parseTimer = perfTracker.startTimer();
            const parsed = await parseFilename(file.filename);
            perfTracker.record("parse", parseTimer.end());
            if (!parsed?.episode) return null;

            // Skip if episode doesn't match
            if (parsed.episode != episode) return null;

            // Check MAL ID (cached)
            const malTimer = perfTracker.startTimer();
            const fileMalId = await getMalId(
              parsed.title?.trim(),
              parsed.season
            );
            perfTracker.record("malLookup", malTimer.end(), {
              cached: malCache[`${parsed.title}-${parsed.season}`] ? 1 : 0,
            });

            if (dev > 0)
              console.log(
                "Comparing: ",
                fileMalId,
                malId + " AND ",
                episode,
                parsed.episode
              );

            if (fileMalId != malId) return null;

            filesMatched++;
            return {
              title:
                `${parsed.filename}\n  ${parsed.subtitle_language}` ||
                `${parsed.title} Ep${parsed.episode}\n  ${parsed.subtitle_language}`,
              url: file.url,
            };
          } catch (err) {
            perfTracker.record("errors", 0, { parseErrors: 1 });
            return null;
          }
        })
      );

      // Add valid streams
      streams = [...streams, ...batchResults.filter(Boolean)];
      perfTracker.record("batch", batchTimer.end(), {
        batchSize: batch.length,
        batchMatches: batchResults.filter(Boolean).length,
      });

      // Early exit if we found matches (adjust threshold as needed)
      if (streams.length >= 3) break;
    }

    // Update cache
    userRequestCache.set(cacheKey, {
      streams,
      expires: Date.now() + 5 * 60 * 1000, // 5 min cache
    });
    debouncedSaveCache();

    perfTracker.record("matching", 0, {
      filesProcessed,
      filesMatched,
      matchRatio: filesProcessed ? filesMatched / filesProcessed : 0,
    });

    return streams;
  } catch (err) {
    perfTracker.record("errors", 0, {
      rdErrors: 1,
      errorMessage: err.message,
    });
    return [];
  } finally {
    perfTracker.record("request", timer.end(), {
      streamsFound: streams?.length || 0,
    });
  }
}

builder.defineStreamHandler(async ({ id, config }) => {
  if (!config?.rd_api_key) {
    return { streams: [], error: "Real-Debrid API key required" };
  }

  console.log("Dealing with a stream request");

  const cached = userRequestCache.get(`${id}:${config.rd_api_key}`);
  if (cached) {
    const cachedStreams = cached.streams;
    if (dev > 0) console.log("Cache hit for", id, cachedStreams);
    return { cachedStreams };
  }

  const streams = await getRealDebridStreams(id, config.rd_api_key);

  if (dev > 0) console.log("Streams found:", streams);

  return { streams };
});

async function preloadPopularContent(rdApiKey) {
  try {
    console.log("Starting background caching...");
    const downloads = await getDownloads(rdApiKey);

    // Process most recent 50 items
    const recentItems = downloads
      .sort((a, b) => new Date(b.added) - new Date(a.added))
      .slice(0, 50);

    for (const item of recentItems) {
      try {
        const parsed = await parseFilename(item.filename);
        if (!parsed?.title) continue;

        const malId = await getMalId(parsed.title.trim(), parsed.season || 1);
        if (!malId) continue;

        const cacheKey = `kitsu:${malId}:${parsed.episode || 1}`;
        if (!userRequestCache.get(cacheKey)) {
          userRequestCache.set(
            cacheKey,
            {
              url: item.url,
              title: parsed.filename,
              subtitle_language: parsed.subtitle_language || "",
            },
            60 * 60 * 1000
          ); // Cache for 1 hour
        }
      } catch (err) {
        console.error("Preload error for", item.filename, err);
      }
    }
    console.log(`Pre-cached ${recentItems.length} items`);
  } catch (err) {
    console.error("Background caching failed:", err);
  }
}

builder.defineCatalogHandler(async (args) => {
  const { config, extra } = args;

  if (!config?.rd_api_key) {
    return { metas: [], cacheMaxAge: 60 };
  }

  // Start background caching
  preloadPopularContent(config.rd_api_key);

  // Return empty catalog (this is just for triggering cache)
  return {
    metas: [],
    cacheMaxAge: 3600, // 1 hour
  };
});

export default builder;
