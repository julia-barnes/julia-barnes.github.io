// ============================================================
// Recommendation Engine
// ============================================================

class RecommendationEngine {
  constructor(database) {
    this.database = database;
    this.favorites = [];
  }

  addFavorite(title) {
    const item = this.database.find(
      (entry) => entry.title.toLowerCase() === title.toLowerCase()
    );
    if (item && !this.favorites.some((f) => f.title === item.title)) {
      this.favorites.push(item);
      return item;
    }
    return null;
  }

  removeFavorite(title) {
    const idx = this.favorites.findIndex(
      (f) => f.title.toLowerCase() === title.toLowerCase()
    );
    if (idx !== -1) {
      this.favorites.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Search database for titles matching a query
  search(query, limit = 8) {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    const results = this.database
      .filter((entry) => entry.title.toLowerCase().includes(q))
      .filter((entry) => !this.favorites.some((f) => f.title === entry.title));
    // Sort: starts-with first, then includes
    results.sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.title.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts || a.title.localeCompare(b.title);
    });
    return results.slice(0, limit);
  }

  // Analyze genre frequencies from favorites
  analyzeGenres() {
    const genreCount = {};
    let total = 0;
    for (const fav of this.favorites) {
      for (const genre of fav.genres) {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
        total++;
      }
    }
    // Sort by frequency
    const sorted = Object.entries(genreCount)
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return { genres: sorted, total };
  }

  // Get the user's top genre
  getTopGenre() {
    const analysis = this.analyzeGenres();
    if (analysis.genres.length === 0) return null;
    return analysis.genres[0].genre;
  }

  // Get a genre profile label based on top genres
  getProfileLabel() {
    const analysis = this.analyzeGenres();
    if (analysis.genres.length === 0) return null;

    const top = analysis.genres.slice(0, 3).map((g) => g.genre);

    // Fun profile labels based on genre combos
    const has = (...genres) => genres.every((g) => top.includes(g));

    if (has("action", "fantasy")) return "⚔️ Epic Adventurer";
    if (has("horror", "thriller")) return "🎃 Thrill Seeker";
    if (has("romance", "drama")) return "💕 Hopeless Romantic";
    if (has("comedy", "slice of life")) return "☀️ Feel-Good Fan";
    if (has("sci-fi", "thriller")) return "🚀 Mind-Bender Enthusiast";
    if (has("mystery", "thriller")) return "🔍 Mystery Maven";
    if (has("action", "superhero")) return "🦸 Hero at Heart";
    if (has("dark fantasy", "action")) return "🌑 Dark Fantasy Devotee";
    if (has("drama", "historical")) return "📜 History Buff";
    if (has("comedy", "romance")) return "😂 Rom-Com Lover";
    if (has("sci-fi", "dystopian")) return "🌆 Dystopia Explorer";
    if (has("fantasy")) return "✨ Fantasy Dreamer";
    if (has("action")) return "💥 Action Junkie";
    if (has("drama")) return "🎭 Drama Devotee";
    if (has("comedy")) return "😄 Comedy Connoisseur";
    if (has("horror")) return "👻 Horror Fanatic";
    if (has("sci-fi")) return "🛸 Sci-Fi Explorer";
    if (has("romance")) return "💗 Romance Reader";
    if (has("mystery")) return "🕵️ Detective at Heart";
    if (has("thriller")) return "⚡ Tension Junkie";
    if (has("sports")) return "🏆 Sports Fanatic";

    return "🌟 Eclectic Enthusiast";
  }

  // Generate recommendations
  getRecommendations(limit = 12) {
    if (this.favorites.length === 0) return [];

    const analysis = this.analyzeGenres();
    const genreWeights = {};
    for (const g of analysis.genres) {
      genreWeights[g.genre] = g.count;
    }

    // Category preference
    const catCount = {};
    for (const fav of this.favorites) {
      catCount[fav.category] = (catCount[fav.category] || 0) + 1;
    }

    // Score each non-favorite item
    const favTitles = new Set(this.favorites.map((f) => f.title));
    const scored = this.database
      .filter((item) => !favTitles.has(item.title))
      .map((item) => {
        let score = 0;

        // Genre match scoring
        for (const genre of item.genres) {
          if (genreWeights[genre]) {
            score += genreWeights[genre] * 2;
          }
        }

        // Bonus for matching genres with multiple favorites
        const matchedGenres = item.genres.filter((g) => genreWeights[g]);
        if (matchedGenres.length >= 3) score += 5;
        if (matchedGenres.length >= 4) score += 8;

        // Small bonus for category diversity (recommend across media types)
        if (!catCount[item.category]) {
          score += 3; // Encourage exploring new categories
        }

        // Normalize by number of genres (don't overly favor items with many tags)
        score = score / Math.sqrt(item.genres.length);

        return { ...item, score, matchedGenres };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit);
  }

  // Get cross-category recommendations (e.g., "Because you like manga X, try movie Y")
  getCrossRecommendations() {
    if (this.favorites.length === 0) return [];

    const favTitles = new Set(this.favorites.map((f) => f.title));
    const connections = [];

    for (const fav of this.favorites) {
      const recs = this.database
        .filter(
          (item) =>
            !favTitles.has(item.title) && item.category !== fav.category
        )
        .map((item) => {
          const shared = item.genres.filter((g) => fav.genres.includes(g));
          return { ...item, sharedWith: fav, sharedGenres: shared, overlap: shared.length };
        })
        .filter((item) => item.overlap >= 2)
        .sort((a, b) => b.overlap - a.overlap)
        .slice(0, 1);

      connections.push(...recs);
    }

    // Deduplicate
    const seen = new Set();
    return connections.filter((c) => {
      if (seen.has(c.title)) return false;
      seen.add(c.title);
      return true;
    }).slice(0, 6);
  }
}
