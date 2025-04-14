import { RateLimiter } from "limiter";
import { LRUCache } from "lru-cache";
import { getKitsuSeasons } from "../services/malSearchService.js";
import fetch from "node-fetch";

// More efficient cache with TTL
const cache = new LRUCache({
  max: 1000,
  ttl: 60 * 60 * 1000, // 1 hour cache
});

// More accurate rate limiter
const limiter = new RateLimiter({
  tokensPerInterval: 5,
  interval: 1000,
  fireImmediately: true,
});

const OPEN_SUBTITLES_API_KEY = process.env.OPEN_SUBTITLES_TOKEN;

// Pre-compiled regex for common patterns
const COMMON_PATTERNS = {
  episode: /(?:ep|episode|cap|ch|第)\s*(\d+)/i,
  season: /(?:s|season|シーズン)\s*(\d+)/i,
  title: /^(.*?)(?:\s*[-.]\s*[Ss]\d|$)/,
  cleanSpecial: /[_\-.]/g,
  spanish: /(?:capitulo|episodio)\s*(\d+)/i,
  anime: /(?: - )(\d+)(?:v\d+)?(?: END)?\./i,
};

const PATTERN_VALIDATORS = {
  english: (match, filename) =>
    match && match[1] && filename.includes(`Ep${match[1]}`),

  spanish: (match, filename) => {
    // First check if there's a number in parentheses
    const parenMatch = filename.match(/\((\d+)\)/);
    if (parenMatch) return true; // Prefer parenthesized numbers

    // Fall back to capitulo number if no parentheses
    return (
      match &&
      match[1] &&
      filename.toLowerCase().includes(`capitulo ${match[1]}`)
    );
  },

  anime: (match, filename) =>
    match && match[1] && filename.includes(` - ${match[1]}`),

  parentheses: (match) => match && match[1],
};

function extractEpisode(episodes) {
  return Array.isArray(episodes)
    ? Math.min(...episodes)
    : typeof episodes === "number"
    ? episodes
    : null;
}

function fastGuess(filename) {
  // Try patterns in order of likelihood
  const attempts = [
    { type: "anime", regex: COMMON_PATTERNS.anime },
    { type: "spanish", regex: COMMON_PATTERNS.spanish },
    { type: "english", regex: COMMON_PATTERNS.episode },
    { type: "parentheses", regex: /\((\d+)\)/ },
  ];

  for (const { type, regex } of attempts) {
    const match = filename.match(regex);
    if (match && PATTERN_VALIDATORS[type](match, filename)) {
      const seasonMatch = filename.match(COMMON_PATTERNS.season);
      return {
        episode: parseInt(match[1]),
        season: seasonMatch ? parseInt(seasonMatch[1]) : 1,
        title: filename
          .match(COMMON_PATTERNS.title)[1]
          .replace(COMMON_PATTERNS.cleanSpecial, " ")
          .trim(),
        _matchedBy: type, // For debugging
      };
    }
  }
  return null;
}

function extractYear(filename) {
  const match = filename.match(/\((19|20)\d{2}\)/);
  return match ? parseInt(match[0].slice(1, 5)) : null;
}

async function parseFilename(filename) {
  // 1. Check cache first
  if (cache.has(filename)) {
    return cache.get(filename);
  }

  // 2. Try fast local parsing
  const quickResult = fastGuess(filename);
  const year = null //extractYear(filename);
  /* console.log("Search for", filename, await getKitsuSeasons(quickResult.title))
  const seasonByYear =
    (await getKitsuSeasons(quickResult.title)).findIndex((season) =>
      season.title.includes(year)
    ) + 1;*/

  if (quickResult) {
    year
      ? (quickResult.season = seasonByYear)
      : (quickResult.season = quickResult.season);
    cache.set(filename, quickResult);
    //if (Number.parseInt(process.env.DEV) > 0) console.log("Quick guess:", quickResult);
    return quickResult;
  }

  // 3. Fallback to API with rate limiting
  await limiter.removeTokens(1);

  try {
    const url = new URL(
      "https://api.opensubtitles.com/api/v1/utilities/guessit"
    );
    url.searchParams.set("filename", filename);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Api-Key": OPEN_SUBTITLES_API_KEY,
        "User-Agent": "CarboneStremio/1.0",
        "Accept-Encoding": "gzip", // Reduce bandwidth
      },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const result = {
      title: data.title || null,
      filename,
      episode: extractEpisode(data.episode),
      season: year ? seasonByYear : data.season || 1,
      subtitle_language: data.subtitle_language || "",
    };

    cache.set(filename, result);
    return result;
  } catch (err) {
    console.error("Parse failed for:", filename, err.message);
    // Cache failures briefly to avoid hammering API
    cache.set(filename, null, 60 * 1000);
    return null;
  }
}

export { parseFilename };
