// ============================================================
// Custom Theme Builder
// ============================================================

class ThemeBuilder {
  constructor() {
    // Default base colors for new custom themes
    this.defaults = {
      bg: "#f8f9fa",
      bgCard: "#ffffff",
      text: "#1a1a2e",
      accent: "#6366f1",
      border: "#e5e7eb",
    };
  }

  // Given 5 base colors, derive the full set of CSS variables
  deriveTheme(base) {
    const bg = base.bg || this.defaults.bg;
    const bgCard = base.bgCard || this.defaults.bgCard;
    const text = base.text || this.defaults.text;
    const accent = base.accent || this.defaults.accent;
    const border = base.border || this.defaults.border;

    const isDark = this.luminance(bg) < 0.5;

    return {
      "--bg": bg,
      "--bg-card": bgCard,
      "--bg-input": bgCard,
      "--bg-hover": this.adjustBrightness(bgCard, isDark ? 15 : -5),
      "--text": text,
      "--text-muted": this.mixColors(text, bg, 0.45),
      "--border": border,
      "--accent": accent,
      "--accent-hover": this.adjustBrightness(accent, -15),
      "--accent-light": this.mixColors(accent, bg, 0.85),
      "--badge-manga": "#ec4899",
      "--badge-book": "#8b5cf6",
      "--badge-tv": "#3b82f6",
      "--badge-movie": "#f59e0b",
      "--bar-fill": accent,
      "--shadow": isDark
        ? "0 1px 3px rgba(0,0,0,0.3)"
        : "0 1px 3px rgba(0,0,0,0.08)",
      "--shadow-lg": isDark
        ? "0 4px 12px rgba(0,0,0,0.4)"
        : "0 4px 12px rgba(0,0,0,0.1)",
      "--genre-tag-bg": this.mixColors(border, bg, 0.5),
      "--genre-tag-text": this.mixColors(text, bg, 0.3),
      "--genre-matched-bg": this.mixColors(accent, bg, 0.85),
      "--genre-matched-text": this.adjustBrightness(accent, isDark ? 20 : -20),
      "--mark-bg": isDark
        ? this.mixColors(accent, bg, 0.7)
        : "#fef08a",
    };
  }

  // Apply a custom theme to the document
  applyCustomTheme(base) {
    const vars = this.deriveTheme(base);
    const root = document.documentElement;
    root.setAttribute("data-theme", "custom");
    for (const [prop, value] of Object.entries(vars)) {
      root.style.setProperty(prop, value);
    }
  }

  // Remove inline custom properties (revert to stylesheet themes)
  clearCustomTheme() {
    const root = document.documentElement;
    const props = Object.keys(this.deriveTheme(this.defaults));
    for (const prop of props) {
      root.style.removeProperty(prop);
    }
  }

  // ---- Color utilities ----

  hexToRgb(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const h = Math.round(Math.max(0, Math.min(255, x))).toString(16);
          return h.length === 1 ? "0" + h : h;
        })
        .join("")
    );
  }

  luminance(hex) {
    const { r, g, b } = this.hexToRgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  adjustBrightness(hex, amount) {
    const { r, g, b } = this.hexToRgb(hex);
    return this.rgbToHex(r + amount, g + amount, b + amount);
  }

  mixColors(hex1, hex2, weight) {
    const c1 = this.hexToRgb(hex1);
    const c2 = this.hexToRgb(hex2);
    return this.rgbToHex(
      c1.r * (1 - weight) + c2.r * weight,
      c1.g * (1 - weight) + c2.g * weight,
      c1.b * (1 - weight) + c2.b * weight
    );
  }
}
