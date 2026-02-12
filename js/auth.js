// ============================================================
// Profile / Auth System (localStorage-based)
// ============================================================

class ProfileManager {
  constructor() {
    this.storageKey = "rec-profiles";
    this.activeKey = "rec-active-profile";
    this.profiles = this.loadProfiles();
    this.activeProfileId = localStorage.getItem(this.activeKey) || null;
  }

  loadProfiles() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  saveProfiles() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.profiles));
  }

  createProfile(name, avatar, profilePic) {
    const id = "profile_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
    this.profiles[id] = {
      id,
      name: name.trim(),
      avatar: avatar || "😊",
      profilePic: profilePic || null,
      favorites: [],
      theme: "light",
      customThemes: {},
      createdAt: new Date().toISOString(),
    };
    this.saveProfiles();
    this.setActive(id);
    return this.profiles[id];
  }

  deleteProfile(id) {
    delete this.profiles[id];
    if (this.activeProfileId === id) {
      this.activeProfileId = null;
      localStorage.removeItem(this.activeKey);
    }
    this.saveProfiles();
  }

  setActive(id) {
    if (this.profiles[id]) {
      this.activeProfileId = id;
      localStorage.setItem(this.activeKey, id);
    }
  }

  getActive() {
    if (this.activeProfileId && this.profiles[this.activeProfileId]) {
      return this.profiles[this.activeProfileId];
    }
    return null;
  }

  getAll() {
    return Object.values(this.profiles).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  isLoggedIn() {
    return this.getActive() !== null;
  }

  logout() {
    this.activeProfileId = null;
    localStorage.removeItem(this.activeKey);
  }

  // ---- Favorites persistence ----
  saveFavorites(favoriteTitles) {
    const profile = this.getActive();
    if (!profile) return;
    profile.favorites = favoriteTitles;
    this.saveProfiles();
  }

  loadFavorites() {
    const profile = this.getActive();
    return profile ? profile.favorites || [] : [];
  }

  // ---- Theme persistence ----
  saveTheme(themeName) {
    const profile = this.getActive();
    if (!profile) return;
    profile.theme = themeName;
    this.saveProfiles();
  }

  loadTheme() {
    const profile = this.getActive();
    return profile ? profile.theme || "light" : localStorage.getItem("rec-theme") || "light";
  }

  // ---- Custom themes ----
  saveCustomTheme(name, colors) {
    const profile = this.getActive();
    if (!profile) return;
    if (!profile.customThemes) profile.customThemes = {};
    profile.customThemes[name] = colors;
    this.saveProfiles();
  }

  deleteCustomTheme(name) {
    const profile = this.getActive();
    if (!profile || !profile.customThemes) return;
    delete profile.customThemes[name];
    this.saveProfiles();
  }

  getCustomThemes() {
    const profile = this.getActive();
    return profile && profile.customThemes ? profile.customThemes : {};
  }

  // ---- Profile Picture ----
  updateProfilePic(dataUrl) {
    const profile = this.getActive();
    if (!profile) return;
    profile.profilePic = dataUrl;
    this.saveProfiles();
  }

  updateAvatar(emoji) {
    const profile = this.getActive();
    if (!profile) return;
    profile.avatar = emoji;
    profile.profilePic = null;
    this.saveProfiles();
  }

  clearProfilePic() {
    const profile = this.getActive();
    if (!profile) return;
    profile.profilePic = null;
    this.saveProfiles();
  }

  // ---- Export / Import ----
  exportProfile() {
    const profile = this.getActive();
    if (!profile) return null;
    return JSON.stringify(profile, null, 2);
  }

  importProfile(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.name) throw new Error("Invalid profile data");
      const id = "profile_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
      data.id = id;
      data.createdAt = new Date().toISOString();
      this.profiles[id] = data;
      this.saveProfiles();
      this.setActive(id);
      return data;
    } catch (e) {
      console.error("Import failed:", e);
      return null;
    }
  }
}
