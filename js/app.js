// ============================================================
// Main Application Logic
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const engine = new RecommendationEngine(DATABASE);

  // ---- DOM Elements ----
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  const favoritesList = document.getElementById("favorites-list");
  const favoritesEmpty = document.getElementById("favorites-empty");
  const resultsSection = document.getElementById("results-section");
  const genreProfile = document.getElementById("genre-profile");
  const genreProfileLabel = document.getElementById("genre-profile-label");
  const genreBreakdown = document.getElementById("genre-breakdown");
  const topGenreBadge = document.getElementById("top-genre-badge");
  const recommendationsList = document.getElementById("recommendations-list");
  const crossRecsList = document.getElementById("cross-recs-list");
  const crossRecsSection = document.getElementById("cross-recs-section");
  const themeSelect = document.getElementById("theme-select");
  const categoryFilters = document.querySelectorAll(".cat-filter");
  const recCategoryFilters = document.querySelectorAll(".rec-cat-filter");
  const favCount = document.getElementById("fav-count");

  let searchDebounce = null;
  let activeCategory = "all";
  let activeRecCategory = "all";

  // ---- Theme ----
  const savedTheme = localStorage.getItem("rec-theme") || "light";
  setTheme(savedTheme);

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeSelect.value = theme;
    localStorage.setItem("rec-theme", theme);
  }

  themeSelect.addEventListener("change", (e) => setTheme(e.target.value));

  // ---- Search ----
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      const query = e.target.value.trim();
      showSearchResults(query);
    }, 150);
  });

  searchInput.addEventListener("focus", () => {
    const query = searchInput.value.trim();
    if (query.length > 0) showSearchResults(query);
  });

  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.add("hidden");
    }
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchResults.classList.add("hidden");
      searchInput.blur();
    }
    if (e.key === "Enter") {
      const firstResult = searchResults.querySelector(".search-result-item");
      if (firstResult) firstResult.click();
    }
  });

  function showSearchResults(query) {
    if (query.length === 0) {
      searchResults.classList.add("hidden");
      return;
    }

    const results = engine.search(query);

    if (results.length === 0) {
      searchResults.innerHTML = `<div class="search-no-results">No titles found for "${escapeHtml(query)}"</div>`;
      searchResults.classList.remove("hidden");
      return;
    }

    searchResults.innerHTML = results
      .map(
        (item) => `
      <div class="search-result-item" data-title="${escapeHtml(item.title)}">
        <span class="search-result-badge badge-${item.category}">${getCategoryLabel(item.category)}</span>
        <span class="search-result-title">${highlightMatch(item.title, query)}</span>
        <span class="search-result-year">${item.year}</span>
      </div>
    `
      )
      .join("");

    searchResults.classList.remove("hidden");

    // Click handlers
    searchResults.querySelectorAll(".search-result-item").forEach((el) => {
      el.addEventListener("click", () => {
        const title = el.dataset.title;
        addFavorite(title);
        searchInput.value = "";
        searchResults.classList.add("hidden");
      });
    });
  }

  // ---- Favorites ----
  function addFavorite(title) {
    const item = engine.addFavorite(title);
    if (!item) return;
    renderFavorites();
    updateResults();
  }

  function removeFavoriteByTitle(title) {
    engine.removeFavorite(title);
    renderFavorites();
    updateResults();
  }

  function renderFavorites() {
    const grouped = {};
    for (const fav of engine.favorites) {
      if (!grouped[fav.category]) grouped[fav.category] = [];
      grouped[fav.category].push(fav);
    }

    favCount.textContent = engine.favorites.length;

    if (engine.favorites.length === 0) {
      favoritesList.innerHTML = "";
      favoritesEmpty.classList.remove("hidden");
      resultsSection.classList.add("hidden");
      return;
    }

    favoritesEmpty.classList.add("hidden");

    // Filter by active category
    const favsToShow =
      activeCategory === "all"
        ? engine.favorites
        : engine.favorites.filter((f) => f.category === activeCategory);

    favoritesList.innerHTML = favsToShow
      .map(
        (fav) => `
      <div class="favorite-card" data-title="${escapeHtml(fav.title)}">
        <div class="favorite-card-header">
          <span class="favorite-badge badge-${fav.category}">${getCategoryLabel(fav.category)}</span>
          <button class="favorite-remove" data-title="${escapeHtml(fav.title)}" title="Remove">&times;</button>
        </div>
        <div class="favorite-title">${escapeHtml(fav.title)}</div>
        <div class="favorite-genres">${fav.genres.slice(0, 3).map((g) => `<span class="genre-tag">${g}</span>`).join("")}</div>
      </div>
    `
      )
      .join("");

    favoritesList.querySelectorAll(".favorite-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeFavoriteByTitle(btn.dataset.title);
      });
    });
  }

  // ---- Category Filters for Favorites ----
  categoryFilters.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryFilters.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.category;
      renderFavorites();
    });
  });

  // ---- Category Filters for Recommendations ----
  recCategoryFilters.forEach((btn) => {
    btn.addEventListener("click", () => {
      recCategoryFilters.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeRecCategory = btn.dataset.category;
      renderRecommendations();
    });
  });

  // ---- Results ----
  function updateResults() {
    if (engine.favorites.length === 0) {
      resultsSection.classList.add("hidden");
      return;
    }

    resultsSection.classList.remove("hidden");

    // Genre analysis
    const analysis = engine.analyzeGenres();
    const topGenre = engine.getTopGenre();
    const profileLabel = engine.getProfileLabel();

    genreProfileLabel.textContent = profileLabel || "";
    topGenreBadge.textContent = topGenre
      ? `#1 Genre: ${capitalize(topGenre)}`
      : "";

    renderGenreBreakdown(analysis);
    renderRecommendations();
    renderCrossRecs();
  }

  function renderGenreBreakdown(analysis) {
    const topGenres = analysis.genres.slice(0, 8);
    const maxCount = topGenres.length > 0 ? topGenres[0].count : 1;

    genreBreakdown.innerHTML = topGenres
      .map(
        (g) => `
      <div class="genre-bar-row">
        <span class="genre-bar-label">${capitalize(g.genre)}</span>
        <div class="genre-bar-track">
          <div class="genre-bar-fill" style="width: ${(g.count / maxCount) * 100}%"></div>
        </div>
        <span class="genre-bar-pct">${g.percentage}%</span>
      </div>
    `
      )
      .join("");
  }

  function renderRecommendations() {
    const recs = engine.getRecommendations(20);
    const filtered =
      activeRecCategory === "all"
        ? recs
        : recs.filter((r) => r.category === activeRecCategory);

    if (filtered.length === 0) {
      recommendationsList.innerHTML = `<div class="no-recs">Add more favorites to get better recommendations!</div>`;
      return;
    }

    recommendationsList.innerHTML = filtered
      .slice(0, 12)
      .map(
        (rec) => `
      <div class="rec-card">
        <div class="rec-card-header">
          <span class="rec-badge badge-${rec.category}">${getCategoryLabel(rec.category)}</span>
          <span class="rec-year">${rec.year}</span>
        </div>
        <div class="rec-title">${escapeHtml(rec.title)}</div>
        <div class="rec-desc">${escapeHtml(rec.description)}</div>
        <div class="rec-genres">${rec.matchedGenres.map((g) => `<span class="genre-tag matched">${g}</span>`).join("")}</div>
        <button class="rec-add-btn" data-title="${escapeHtml(rec.title)}">+ Add to Favorites</button>
      </div>
    `
      )
      .join("");

    recommendationsList.querySelectorAll(".rec-add-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        addFavorite(btn.dataset.title);
      });
    });
  }

  function renderCrossRecs() {
    const crossRecs = engine.getCrossRecommendations();

    if (crossRecs.length === 0) {
      crossRecsSection.classList.add("hidden");
      return;
    }

    crossRecsSection.classList.remove("hidden");

    crossRecsList.innerHTML = crossRecs
      .map(
        (rec) => `
      <div class="cross-rec-card">
        <div class="cross-rec-reason">Because you like <strong>${escapeHtml(rec.sharedWith.title)}</strong></div>
        <div class="cross-rec-body">
          <span class="rec-badge badge-${rec.category}">${getCategoryLabel(rec.category)}</span>
          <span class="cross-rec-title">${escapeHtml(rec.title)}</span>
        </div>
        <div class="cross-rec-desc">${escapeHtml(rec.description)}</div>
        <div class="rec-genres">${rec.sharedGenres.map((g) => `<span class="genre-tag matched">${g}</span>`).join("")}</div>
      </div>
    `
      )
      .join("");
  }

  // ---- Helpers ----
  function getCategoryLabel(cat) {
    const labels = { manga: "📚 Manga", book: "📖 Book", tv: "📺 TV", movie: "🎬 Movie" };
    return labels[cat] || cat;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function highlightMatch(title, query) {
    const idx = title.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return escapeHtml(title);
    const before = title.slice(0, idx);
    const match = title.slice(idx, idx + query.length);
    const after = title.slice(idx + query.length);
    return `${escapeHtml(before)}<mark>${escapeHtml(match)}</mark>${escapeHtml(after)}`;
  }
});
