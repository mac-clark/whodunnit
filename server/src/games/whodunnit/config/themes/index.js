// src/games/whodunnit/themes/index.js

import { themeConfig as snowedIn } from "./snowed_in/config.js";

const THEMES = {
  [snowedIn.id]: snowedIn,
};

export function getThemeById(themeId) {
  return THEMES[themeId] || null;
}

export function listThemes() {
  return Object.keys(THEMES);
}
