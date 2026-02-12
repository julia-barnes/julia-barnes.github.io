// ============================================================
// Main Application Logic
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const engine = new RecommendationEngine(DATABASE);
  const profileMgr = new ProfileManager();
  const themeBuilder = new ThemeBuilder();

  // ---- DOM Elements ----
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  const favoritesList = document.getElementById("favorites-list");
  const favoritesEmpty = document.getElementById("favorites-empty");
  const resultsSection = document.getElementById("results-section");
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

  // Profile/Login elements
  const profileBtn = document.getElementById("profile-btn");
  const loginOverlay = document.getElementById("login-overlay");
  const loginClose = document.getElementById("login-close");
  const profileNameInput = document.getElementById("profile-name-input");
  const createProfileBtn = document.getElementById("create-profile-btn");
  const profileListEl = document.getElementById("profile-list");
  const logoutBtn = document.getElementById("logout-btn");
  const welcomeBanner = document.getElementById("welcome-banner");
  const welcomeLoginBtn = document.getElementById("welcome-login-btn");
  const mainContent = document.getElementById("main-content");

  // Favorites Panel
  const favPanelBtn = document.getElementById("fav-panel-btn");
  const favPanelOverlay = document.getElementById("fav-panel-overlay");
  const favPanel = document.getElementById("fav-panel");
  const favPanelClose = document.getElementById("fav-panel-close");
  const favPanelBody = document.getElementById("fav-panel-body");
  const favPanelExport = document.getElementById("fav-panel-export");

  // Custom Theme Modal
  const customThemeBtn = document.getElementById("custom-theme-btn");
  const themeOverlay = document.getElementById("theme-overlay");
  const themeClose = document.getElementById("theme-close");
  const themeInputBg = document.getElementById("theme-bg");
  const themeInputCard = document.getElementById("theme-card");
  const themeInputText = document.getElementById("theme-text");
  const themeInputAccent = document.getElementById("theme-accent");
  const themeInputBorder = document.getElementById("theme-border");
  const themeHexBg = document.getElementById("theme-hex-bg");
  const themeHexCard = document.getElementById("theme-hex-card");
  const themeHexText = document.getElementById("theme-hex-text");
  const themeHexAccent = document.getElementById("theme-hex-accent");
  const themeHexBorder = document.getElementById("theme-hex-border");
  const themePreview = document.getElementById("theme-preview");
  const themeSaveName = document.getElementById("theme-save-name");
  const themeSaveBtn = document.getElementById("theme-save-btn");
  const themeApplyBtn = document.getElementById("theme-apply-btn");
  const savedThemesList = document.getElementById("saved-themes-list");

  // Toast
  const toastContainer = document.getElementById("toast-container");

  let searchDebounce = null;
  let activeCategory = "all";
  let activeRecCategory = "all";
  let selectedAvatar = "😊";

  // ---- Initialize ----
  initApp();

  function initApp() {
    if (profileMgr.isLoggedIn()) {
      showLoggedInState();
      loadSavedFavorites();
    } else {
      showLoggedOutState();
    }
    const theme = profileMgr.loadTheme();
    setTheme(theme);
    renderProfileList();
  }

  // ---- Auth / Profile ----
  function showLoggedInState() {
    const profile = profileMgr.getActive();
    welcomeBanner.classList.add("hidden");
    mainContent.classList.remove("hidden");
    profileBtn.innerHTML = `<span class="profile-avatar">${profile.avatar}</span><span class="profile-name">${escapeHtml(profile.name)}</span>`;
    favPanelBtn.style.display = "";
  }

  function showLoggedOutState() {
    welcomeBanner.classList.remove("hidden");
    mainContent.classList.add("hidden");
    profileBtn.innerHTML = `<span>👤 Log In</span>`;
    favPanelBtn.style.display = "none";
    resultsSection.classList.add("hidden");
  }

  function loadSavedFavorites() {
    const savedTitles = profileMgr.loadFavorites();
    engine.favorites = [];
    for (const title of savedTitles) {
      engine.addFavorite(title);
    }
    renderFavorites();
    updateResults();
  }

  function saveFavorites() {
    profileMgr.saveFavorites(engine.favorites.map((f) => f.title));
  }

  // Profile button
  profileBtn.addEventListener("click", () => {
    renderProfileList();
    loginOverlay.classList.add("open");
  });

  loginClose.addEventListener("click", () => loginOverlay.classList.remove("open"));
  loginOverlay.addEventListener("click", (e) => { if (e.target === loginOverlay) loginOverlay.classList.remove("open"); });

  welcomeLoginBtn.addEventListener("click", () => {
    renderProfileList();
    loginOverlay.classList.add("open");
  });

  // Avatar picker
  document.querySelectorAll(".avatar-option").forEach((el) => {
    el.addEventListener("click", () => {
      document.querySelectorAll(".avatar-option").forEach((a) => a.classList.remove("selected"));
      el.classList.add("selected");
      selectedAvatar = el.dataset.avatar;
    });
  });

  // Create profile
  createProfileBtn.addEventListener("click", () => {
    const name = profileNameInput.value.trim();
    if (!name) { toast("Please enter a name"); return; }
    profileMgr.createProfile(name, selectedAvatar);
    profileNameInput.value = "";
    engine.favorites = [];
    loginOverlay.classList.remove("open");
    showLoggedInState();
    renderFavorites();
    updateResults();
    renderProfileList();
    toast(`Welcome, ${name}! 🎉`);
  });

  // Logout
  logoutBtn.addEventListener("click", () => {
    profileMgr.logout();
    engine.favorites = [];
    loginOverlay.classList.remove("open");
    showLoggedOutState();
    renderFavorites();
    toast("Logged out");
  });

  function renderProfileList() {
    const profiles = profileMgr.getAll();
    const activeId = profileMgr.activeProfileId;
    if (profiles.length === 0) {
      profileListEl.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:0.5rem;">No profiles yet. Create one above!</div>`;
      return;
    }
    profileListEl.innerHTML = profiles
      .map((p) => `
        <div class="profile-item ${p.id === activeId ? 'active' : ''}" data-id="${p.id}">
          <span class="profile-item-avatar">${p.avatar}</span>
          <div class="profile-item-info">
            <div class="profile-item-name">${escapeHtml(p.name)}</div>
            <div class="profile-item-meta">${p.favorites ? p.favorites.length : 0} favorites</div>
          </div>
          <button class="profile-item-delete" data-id="${p.id}" title="Delete profile">&times;</button>
        </div>
      `)
      .join("");

    profileListEl.querySelectorAll(".profile-item").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.classList.contains("profile-item-delete")) return;
        const id = el.dataset.id;
        profileMgr.setActive(id);
        loginOverlay.classList.remove("open");
        showLoggedInState();
        loadSavedFavorites();
        const theme = profileMgr.loadTheme();
        setTheme(theme);
        renderProfileList();
        toast(`Switched to ${profileMgr.getActive().name}`);
      });
    });

    profileListEl.querySelectorAll(".profile-item-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm("Delete this profile and all its data?")) {
          const wasActive = id === profileMgr.activeProfileId;
          profileMgr.deleteProfile(id);
          if (wasActive) {
            engine.favorites = [];
            showLoggedOutState();
            renderFavorites();
          }
          renderProfileList();
          toast("Profile deleted");
        }
      });
    });
  }

  // ---- Theme ----
  function setTheme(theme) {
    themeBuilder.clearCustomTheme();
    // Check if it's a saved custom theme
    const customThemes = profileMgr.getCustomThemes();
    if (customThemes[theme]) {
      themeBuilder.applyCustomTheme(customThemes[theme]);
      themeSelect.value = "custom";
    } else {
      document.documentElement.setAttribute("data-theme", theme);
      themeSelect.value = theme;
    }
    profileMgr.saveTheme(theme);
  }

  themeSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    if (val === "custom") {
      themeOverlay.classList.add("open");
    } else {
      setTheme(val);
    }
  });

  // ---- Custom Theme Modal ----
  customThemeBtn.addEventListener("click", () => themeOverlay.classList.add("open"));
  themeClose.addEventListener("click", () => themeOverlay.classList.remove("open"));
  themeOverlay.addEventListener("click", (e) => { if (e.target === themeOverlay) themeOverlay.classList.remove("open"); });

  function getCustomColors() {
    return {
      bg: themeInputBg.value,
      bgCard: themeInputCard.value,
      text: themeInputText.value,
      accent: themeInputAccent.value,
      border: themeInputBorder.value,
    };
  }

  function updateThemePreview() {
    const c = getCustomColors();
    themeHexBg.textContent = c.bg;
    themeHexCard.textContent = c.bgCard;
    themeHexText.textContent = c.text;
    themeHexAccent.textContent = c.accent;
    themeHexBorder.textContent = c.border;
    themePreview.style.background = c.bg;
    themePreview.style.color = c.text;
    themePreview.style.borderColor = c.border;
    themePreview.querySelector(".theme-preview-title").style.color = c.accent;
    themePreview.querySelector(".theme-preview-bar").style.background = c.accent;
    themePreview.querySelector(".theme-preview-card").style.background = c.bgCard;
    themePreview.querySelector(".theme-preview-card").style.borderColor = c.border;
  }

  [themeInputBg, themeInputCard, themeInputText, themeInputAccent, themeInputBorder].forEach((inp) => {
    inp.addEventListener("input", updateThemePreview);
  });

  themeApplyBtn.addEventListener("click", () => {
    const c = getCustomColors();
    themeBuilder.applyCustomTheme(c);
    themeSelect.value = "custom";
    profileMgr.saveTheme("custom");
    toast("Custom theme applied!");
  });

  themeSaveBtn.addEventListener("click", () => {
    const name = themeSaveName.value.trim();
    if (!name) { toast("Enter a name for your theme"); return; }
    const c = getCustomColors();
    profileMgr.saveCustomTheme(name, c);
    themeSaveName.value = "";
    renderSavedThemes();
    toast(`Theme "${name}" saved!`);
  });

  function renderSavedThemes() {
    const themes = profileMgr.getCustomThemes();
    const entries = Object.entries(themes);
    if (entries.length === 0) {
      savedThemesList.innerHTML = `<div style="color:var(--text-muted);font-size:0.82rem;text-align:center;">No saved themes yet</div>`;
      return;
    }
    savedThemesList.innerHTML = entries.map(([name, colors]) => `
      <div class="saved-theme-item" data-name="${escapeHtml(name)}">
        <div class="saved-theme-colors">
          <div class="saved-theme-swatch" style="background:${colors.bg}"></div>
          <div class="saved-theme-swatch" style="background:${colors.bgCard}"></div>
          <div class="saved-theme-swatch" style="background:${colors.accent}"></div>
          <div class="saved-theme-swatch" style="background:${colors.text}"></div>
        </div>
        <span class="saved-theme-name">${escapeHtml(name)}</span>
        <button class="saved-theme-delete" data-name="${escapeHtml(name)}">&times;</button>
      </div>
    `).join("");

    savedThemesList.querySelectorAll(".saved-theme-item").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.classList.contains("saved-theme-delete")) return;
        const name = el.dataset.name;
        const colors = themes[name];
        themeBuilder.applyCustomTheme(colors);
        themeSelect.value = "custom";
        profileMgr.saveTheme(name);
        toast(`Applied theme "${name}"`);
      });
    });

    savedThemesList.querySelectorAll(".saved-theme-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        profileMgr.deleteCustomTheme(btn.dataset.name);
        renderSavedThemes();
        toast("Theme deleted");
      });
    });
  }

  // Initialize theme preview + saved themes
  updateThemePreview();
  renderSavedThemes();

  // ---- Favorites Panel ----
  favPanelBtn.addEventListener("click", () => {
    renderFavPanel();
    favPanelOverlay.classList.add("open");
    favPanel.classList.add("open");
  });

  favPanelClose.addEventListener("click", closeFavPanel);
  favPanelOverlay.addEventListener("click", closeFavPanel);

  function closeFavPanel() {
    favPanelOverlay.classList.remove("open");
    favPanel.classList.remove("open");
  }

  function renderFavPanel() {
    if (engine.favorites.length === 0) {
      favPanelBody.innerHTML = `<div class="fav-panel-empty">No favorites yet!<br>Search and add titles to get started.</div>`;
      return;
    }

    const grouped = {};
    const order = ["manga", "book", "tv", "movie"];
    for (const fav of engine.favorites) {
      if (!grouped[fav.category]) grouped[fav.category] = [];
      grouped[fav.category].push(fav);
    }

    favPanelBody.innerHTML = order
      .filter((cat) => grouped[cat])
      .map((cat) => `
        <div class="fav-panel-category">
          <div class="fav-panel-cat-title">${getCategoryLabel(cat)} (${grouped[cat].length})</div>
          ${grouped[cat].map((fav) => `
            <div class="fav-panel-item">
              <span class="fav-panel-item-title">${escapeHtml(fav.title)}</span>
              <div class="fav-panel-item-actions">
                ${getMediaLinks(fav).map((l) => `<a href="${l.url}" target="_blank" rel="noopener" class="fav-panel-link">${l.label}</a>`).join("")}
                <button class="fav-panel-remove" data-title="${escapeHtml(fav.title)}">&times;</button>
              </div>
            </div>
          `).join("")}
        </div>
      `)
      .join("");

    favPanelBody.querySelectorAll(".fav-panel-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        removeFavoriteByTitle(btn.dataset.title);
        renderFavPanel();
      });
    });
  }

  favPanelExport.addEventListener("click", () => {
    const data = profileMgr.exportProfile();
    if (!data) return;
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profileMgr.getActive().name}-profile.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Profile exported!");
  });

  // ---- Search ----
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => showSearchResults(e.target.value.trim()), 150);
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim().length > 0) showSearchResults(searchInput.value.trim());
  });

  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.add("hidden");
    }
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { searchResults.classList.add("hidden"); searchInput.blur(); }
    if (e.key === "Enter") {
      const first = searchResults.querySelector(".search-result-item");
      if (first) first.click();
    }
  });

  function showSearchResults(query) {
    if (query.length === 0) { searchResults.classList.add("hidden"); return; }
    const results = engine.search(query);
    if (results.length === 0) {
      searchResults.innerHTML = `<div class="search-no-results">No titles found for "${escapeHtml(query)}"</div>`;
      searchResults.classList.remove("hidden");
      return;
    }
    searchResults.innerHTML = results.map((item) => `
      <div class="search-result-item" data-title="${escapeHtml(item.title)}">
        <span class="search-result-badge badge-${item.category}">${getCategoryLabel(item.category)}</span>
        <span class="search-result-title">${highlightMatch(item.title, query)}</span>
        <span class="search-result-year">${item.year}</span>
      </div>
    `).join("");
    searchResults.classList.remove("hidden");
    searchResults.querySelectorAll(".search-result-item").forEach((el) => {
      el.addEventListener("click", () => {
        addFavorite(el.dataset.title);
        searchInput.value = "";
        searchResults.classList.add("hidden");
      });
    });
  }

  // ---- Favorites ----
  function addFavorite(title) {
    const item = engine.addFavorite(title);
    if (!item) return;
    saveFavorites();
    renderFavorites();
    updateResults();
    toast(`Added "${item.title}" ❤️`);
  }

  function removeFavoriteByTitle(title) {
    engine.removeFavorite(title);
    saveFavorites();
    renderFavorites();
    updateResults();
  }

  function renderFavorites() {
    favCount.textContent = engine.favorites.length;
    if (engine.favorites.length === 0) {
      favoritesList.innerHTML = "";
      favoritesEmpty.classList.remove("hidden");
      resultsSection.classList.add("hidden");
      return;
    }
    favoritesEmpty.classList.add("hidden");
    const favsToShow = activeCategory === "all" ? engine.favorites : engine.favorites.filter((f) => f.category === activeCategory);

    favoritesList.innerHTML = favsToShow.map((fav) => `
      <div class="favorite-card">
        <div class="favorite-card-header">
          <span class="favorite-badge badge-${fav.category}">${getCategoryLabel(fav.category)}</span>
          <button class="favorite-remove" data-title="${escapeHtml(fav.title)}" title="Remove">&times;</button>
        </div>
        <div class="favorite-title">${escapeHtml(fav.title)}</div>
        <div class="favorite-genres">${fav.genres.slice(0, 3).map((g) => `<span class="genre-tag">${g}</span>`).join("")}</div>
        <div class="favorite-links">${getMediaLinks(fav).map((l) => `<a href="${l.url}" target="_blank" rel="noopener" class="fav-link">${l.label}</a>`).join("")}</div>
      </div>
    `).join("");

    favoritesList.querySelectorAll(".favorite-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeFavoriteByTitle(btn.dataset.title);
      });
    });
  }

  // Category Filters
  categoryFilters.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryFilters.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.category;
      renderFavorites();
    });
  });

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
    if (engine.favorites.length === 0) { resultsSection.classList.add("hidden"); return; }
    resultsSection.classList.remove("hidden");
    const analysis = engine.analyzeGenres();
    const topGenre = engine.getTopGenre();
    const profileLabel = engine.getProfileLabel();
    genreProfileLabel.textContent = profileLabel || "";
    topGenreBadge.textContent = topGenre ? `#1 Genre: ${capitalize(topGenre)}` : "";
    renderGenreBreakdown(analysis);
    renderRecommendations();
    renderCrossRecs();
  }

  function renderGenreBreakdown(analysis) {
    const topGenres = analysis.genres.slice(0, 8);
    const maxCount = topGenres.length > 0 ? topGenres[0].count : 1;
    genreBreakdown.innerHTML = topGenres.map((g) => `
      <div class="genre-bar-row">
        <span class="genre-bar-label">${capitalize(g.genre)}</span>
        <div class="genre-bar-track"><div class="genre-bar-fill" style="width:${(g.count / maxCount) * 100}%"></div></div>
        <span class="genre-bar-pct">${g.percentage}%</span>
      </div>
    `).join("");
  }

  function renderRecommendations() {
    const recs = engine.getRecommendations(20);
    const filtered = activeRecCategory === "all" ? recs : recs.filter((r) => r.category === activeRecCategory);
    if (filtered.length === 0) {
      recommendationsList.innerHTML = `<div class="no-recs">Add more favorites to get better recommendations!</div>`;
      return;
    }
    recommendationsList.innerHTML = filtered.slice(0, 12).map((rec) => `
      <div class="rec-card">
        <div class="rec-card-header">
          <span class="rec-badge badge-${rec.category}">${getCategoryLabel(rec.category)}</span>
          <span class="rec-year">${rec.year}</span>
        </div>
        <div class="rec-title">${escapeHtml(rec.title)}</div>
        <div class="rec-desc">${escapeHtml(rec.description)}</div>
        <div class="rec-genres">${rec.matchedGenres.map((g) => `<span class="genre-tag matched">${g}</span>`).join("")}</div>
        <div class="rec-actions">
          <button class="rec-add-btn" data-title="${escapeHtml(rec.title)}">+ Add to Favorites</button>
          ${getMediaLinks(rec).map((l) => `<a href="${l.url}" target="_blank" rel="noopener" class="rec-link">${l.label}</a>`).join("")}
        </div>
      </div>
    `).join("");

    recommendationsList.querySelectorAll(".rec-add-btn").forEach((btn) => {
      btn.addEventListener("click", () => addFavorite(btn.dataset.title));
    });
  }

  function renderCrossRecs() {
    const crossRecs = engine.getCrossRecommendations();
    if (crossRecs.length === 0) { crossRecsSection.classList.add("hidden"); return; }
    crossRecsSection.classList.remove("hidden");
    crossRecsList.innerHTML = crossRecs.map((rec) => `
      <div class="cross-rec-card">
        <div class="cross-rec-reason">Because you like <strong>${escapeHtml(rec.sharedWith.title)}</strong></div>
        <div class="cross-rec-body">
          <span class="rec-badge badge-${rec.category}">${getCategoryLabel(rec.category)}</span>
          <span class="cross-rec-title">${escapeHtml(rec.title)}</span>
        </div>
        <div class="cross-rec-desc">${escapeHtml(rec.description)}</div>
        <div class="rec-genres">${rec.sharedGenres.map((g) => `<span class="genre-tag matched">${g}</span>`).join("")}</div>
        <div class="cross-rec-links">
          ${getMediaLinks(rec).map((l) => `<a href="${l.url}" target="_blank" rel="noopener" class="cross-rec-link">${l.label}</a>`).join("")}
        </div>
      </div>
    `).join("");
  }

  // ---- Media Links (where to watch/read) ----
  function getMediaLinks(item) {
    const q = encodeURIComponent(item.title);
    const links = [];
    switch (item.category) {
      case "manga":
        links.push({ label: "MyAnimeList", url: `https://myanimelist.net/search/all?q=${q}` });
        links.push({ label: "Crunchyroll", url: `https://www.crunchyroll.com/search?q=${q}` });
        links.push({ label: "Amazon", url: `https://www.amazon.com/s?k=${q}+manga` });
        break;
      case "book":
        links.push({ label: "Goodreads", url: `https://www.goodreads.com/search?q=${q}` });
        links.push({ label: "Amazon", url: `https://www.amazon.com/s?k=${q}+book` });
        links.push({ label: "Libby", url: `https://libbyapp.com/search/query-${q}/page-1` });
        break;
      case "tv":
        links.push({ label: "IMDb", url: `https://www.imdb.com/find/?q=${q}&s=tt` });
        links.push({ label: "JustWatch", url: `https://www.justwatch.com/us/search?q=${q}` });
        break;
      case "movie":
        links.push({ label: "IMDb", url: `https://www.imdb.com/find/?q=${q}&s=tt` });
        links.push({ label: "JustWatch", url: `https://www.justwatch.com/us/search?q=${q}` });
        links.push({ label: "Letterboxd", url: `https://letterboxd.com/search/${q}/` });
        break;
    }
    return links;
  }

  // ---- Helpers ----
  function getCategoryLabel(cat) {
    return { manga: "📚 Manga", book: "📖 Book", tv: "📺 TV", movie: "🎬 Movie" }[cat] || cat;
  }
  function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
  function escapeHtml(str) { const d = document.createElement("div"); d.textContent = str; return d.innerHTML; }
  function highlightMatch(title, query) {
    const idx = title.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return escapeHtml(title);
    return `${escapeHtml(title.slice(0, idx))}<mark>${escapeHtml(title.slice(idx, idx + query.length))}</mark>${escapeHtml(title.slice(idx + query.length))}`;
  }
  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
});
