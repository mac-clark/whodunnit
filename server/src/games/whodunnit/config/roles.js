// src/games/whodunnit/config/roles.js

export const ROLES = {
  // ─────────────────────────────
  // Meta
  // ─────────────────────────────

  NARRATOR: {
    id: "narrator",
    alignment: "neutral",
    objective: "facilitate",

    countsAsPlayer: false,
    actsDuring: null,
    abilities: [],

    canBeTargeted: false,
    required: true,
    category: "meta",
  },

  // ─────────────────────────────
  // Core Town (always present)
  // ─────────────────────────────

  CIVILIAN: {
    id: "civilian",
    alignment: "town",
    objective: "eliminate_threats",

    countsAsPlayer: true,
    actsDuring: null,
    abilities: [],

    canBeTargeted: true,
    required: true,
    category: "core",
  },

  DETECTIVE: {
    id: "detective",
    alignment: "town",
    objective: "eliminate_threats",

    countsAsPlayer: true,
    actsDuring: "night",
    abilities: ["investigate_alignment"],

    canBeTargeted: true,
    required: true,          // 🔒 always present
    category: "core",
    maxPerGame: 1,
  },

  DOCTOR: {
    id: "doctor",
    alignment: "town",
    objective: "eliminate_threats",

    countsAsPlayer: true,
    actsDuring: "night",
    abilities: ["protect"],

    canBeTargeted: true,
    required: true,          // 🔒 always present
    category: "core",
    maxPerGame: 1,
  },

  // ─────────────────────────────
  // Town Support / Spice
  // ─────────────────────────────

  MAYOR: {
    id: "mayor",
    alignment: "town",
    objective: "eliminate_threats",

    countsAsPlayer: true,
    actsDuring: "day",
    abilities: ["double_vote"],

    canBeTargeted: true,
    required: false,
    category: "support",
  },

  VIGILANTE: {
    id: "vigilante",
    alignment: "town",
    objective: "eliminate_threats",

    countsAsPlayer: true,
    actsDuring: "night",
    abilities: ["single_kill"],

    canBeTargeted: true,
    required: false,
    category: "support",
    maxPerGame: 1,
  },

  // ─────────────────────────────
  // Mafia Core
  // ─────────────────────────────

  MAFIA: {
    id: "mafia",
    alignment: "mafia",
    objective: "reach_parity",

    countsAsPlayer: true,
    actsDuring: "night",
    abilities: ["kill"],

    canBeTargeted: true,
    required: true,          // 🔒 at least one mafia
    category: "core",
  },

  GODFATHER: {
    id: "godfather",
    alignment: "mafia",
    objective: "reach_parity",

    countsAsPlayer: true,
    actsDuring: "night",
    abilities: ["kill", "appear_innocent"],

    canBeTargeted: true,
    required: false,
    category: "deception",
    maxPerGame: 1,
  },

  CONSIGLIERE: {
    id: "consigliere",
    alignment: "mafia",
    objective: "reach_parity",

    countsAsPlayer: true,
    actsDuring: "night",
    abilities: ["investigate_alignment"],

    canBeTargeted: true,
    required: false,
    category: "deception",
    maxPerGame: 1,
  },

  BLACKMAILER: {
    id: "blackmailer",
    alignment: "mafia",
    objective: "reach_parity",

    countsAsPlayer: true,
    actsDuring: "night",
    abilities: ["silence"],

    canBeTargeted: true,
    required: false,
    category: "deception",
  },

  // ─────────────────────────────
  // Independent / Third-Party
  // ─────────────────────────────

  SERIAL_KILLER: {
    id: "serial_killer",
    alignment: "independent",
    objective: "last_player_standing",

    countsAsPlayer: true,
    actsDuring: "night",
    abilities: ["kill"],

    canBeTargeted: true,
    required: false,
    category: "chaos",
    maxPerGame: 1,
  },

  ROLEBLOCKER: {
    id: "roleblocker",
    alignment: "independent",
    objective: "survive_to_end",

    countsAsPlayer: true,
    actsDuring: "night",
    abilities: ["block"],

    canBeTargeted: true,
    required: false,
    category: "deception",
    maxPerGame: 1,
  },
};
