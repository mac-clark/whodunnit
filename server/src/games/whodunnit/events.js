// src/games/whodunnit/events.js

export const WHODUNNIT_EVENTS = {
  // ─────────────────────────────
  // Session / Game lifecycle
  // ─────────────────────────────
  GAME_CREATED: "game.created",
  GAME_STARTED: "game.started",
  GAME_ENDED: "game.ended",

  // ─────────────────────────────
  // Setup
  // ─────────────────────────────
  NARRATOR_ASSIGNED: "narrator.assigned",
  ROLES_ASSIGNED: "roles.assigned",

  // ─────────────────────────────
  // Rounds
  // ─────────────────────────────
  ROUND_STARTED: "round.started",
  ROUND_ENDED: "round.ended",

  // ─────────────────────────────
  // Night phase
  // ─────────────────────────────
  NIGHT_STARTED: "night.started",
  ROLE_ACTION_REQUESTED: "role.action.requested",
  ROLE_ACTION_RESOLVED: "role.action.resolved",
  NIGHT_ENDED: "night.ended",

  // ─────────────────────────────
  // Day phase
  // ─────────────────────────────
  DAY_STARTED: "day.started",
  DISCUSSION_STARTED: "discussion.started",
  ACCUSATION_MADE: "accusation.made",
  VOTE_STARTED: "vote.started",
  VOTE_RESOLVED: "vote.resolved",

  // State vs information separation
  PLAYER_ELIMINATED: "player.eliminated",
  INFORMATION_REVEALED: "information.revealed",

  // ─────────────────────────────
  // Minigames / special moments
  // ─────────────────────────────
  MINIGAME_TRIGGERED: "minigame.triggered",
  MINIGAME_COMPLETED: "minigame.completed",

  // ─────────────────────────────
  // End conditions
  // ─────────────────────────────
  OBJECTIVES_EVALUATED: "objectives.evaluated",
};
