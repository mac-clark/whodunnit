// src/games/whodunnit/config/abilities.js

export const ABILITIES = {
  // ─────────────────────────────
  // NIGHT — active prompts
  // ─────────────────────────────

  mafia_kill: {
    id: "mafia_kill",
    phase: "night",
    target: "player",
    resolves: "end_of_night",
    description:
      "Mafia chooses one player to be killed overnight (one shared kill per night).",
  },

  kill: {
    id: "kill",
    phase: "night",
    target: "player",
    resolves: "end_of_night",
    description: "Select one player to be killed overnight.",
  },

  single_kill: {
    id: "single_kill",
    phase: "night",
    target: "player",
    resolves: "end_of_night",
    description: "Select one player to be killed overnight (solo action).",
  },

  protect: {
    id: "protect",
    phase: "night",
    target: "player",
    resolves: "end_of_night",
    description: "Prevent one player from being killed tonight.",
  },

  investigate_alignment: {
    id: "investigate_alignment",
    phase: "night",
    target: "player",
    resolves: "immediate",
    description: "Learn whether a player is aligned with the town or not.",
    privateResult: true,
  },

  block: {
    id: "block",
    phase: "night",
    target: "player",
    resolves: "pre_night",
    description: "Prevent a player from using their ability tonight.",
  },

  silence: {
    id: "silence",
    phase: "night",
    target: "player",
    resolves: "next_day",
    description: "Prevent a player from speaking/voting during the next day.",
  },

  // ─────────────────────────────
  // DAY — not a night prompt, but exists for rules/UI
  // ─────────────────────────────

  double_vote: {
    id: "double_vote",
    phase: "day",
    target: "none",
    resolves: "immediate",
    description: "Your vote counts as two votes.",
    passive: true,
  },
};
