const axios = require("axios");

async function searchKitsuId(title, season = null) {
  try {
    // If season is given, try with season-specific title
    const searchQueries = season
      ? [`${title} Season ${season}`, `${title} ${season}`, title]
      : [title];

    for (const query of searchQueries) {
      const response = await axios.get("https://kitsu.io/api/edge/anime", {
        params: {
          "filter[text]": query,
          "page[limit]": 3, // Try a few for fuzzy matching
        },
        headers: {
          Accept: "application/vnd.api+json",
        },
      });

      const results = response.data.data;

      if (results && results.length > 0) {
        // Prefer exact or fuzzy match
        const match = results.find((anime) => {
          const canonical =
            anime.attributes?.canonicalTitle?.toLowerCase() || "";
          return (
            canonical.includes(title.toLowerCase()) &&
            (!season || canonical.includes(season.toString()))
          );
        });

        return match?.id || results[0].id; // fallback to first result if no strong match
      }
    }

    return null;
  } catch (err) {
    console.error("❌ Kitsu search failed for:", title, err.message);
    return null;
  }
}

module.exports = {
  searchKitsuId,
};
