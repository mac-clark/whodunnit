// src/controllers/narrationController.js

import { gameEngine } from "../engine/GameEngine.js";

// Wireframe: explicitly import Snowed In narration only.
// Later we can generalize via the themes index once we export narration there.
import { narration as snowedInNarration } from "../games/whodunnit/config/themes/snowed_in/narration.js";

/**
 * Weighted random pick from an array of items with optional `weight` (default 1).
 */
function pickWeighted(options) {
  if (!Array.isArray(options) || options.length === 0) return null;

  const weights = options.map((o) => (typeof o.weight === "number" ? o.weight : 1));
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);

  // If all weights are 0 or invalid, fallback to uniform
  if (total <= 0) {
    return options[Math.floor(Math.random() * options.length)];
  }

  let roll = Math.random() * total;

  for (let i = 0; i < options.length; i++) {
    roll -= Math.max(0, weights[i]);
    if (roll <= 0) return options[i];
  }

  return options[options.length - 1];
}

/**
 * Decide which narration bucket to use (wireframe selection policy).
 * This is intentionally simple and can evolve later.
 */
function resolveBucket(gameState) {
  const phase = gameState?.phase || "setup";
  const round = Number(gameState?.round || 0);

  // Opening is always the setup phase
  if (phase === "setup") return "opening";

  // Very simple progression to reduce staleness over unknown game length:
  if (round >= 5) return "endgame";
  if (round >= 3) return "escalation";

  return "between_phases";
}

/**
 * GET /sessions/:sessionId/narration
 * Returns one narration option for the current state.
 */
export function getNarration(req, res) {
  const { sessionId } = req.params;

  const session = gameEngine.getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (!session.gameState) {
    return res.status(400).json({ error: "Game has not started yet" });
  }

  const gameState = session.gameState;

  // Wireframe: only snowed_in supported for now
  const themeId = gameState.themeId || session.meta?.themeId || "snowed_in";
  if (themeId !== "snowed_in") {
    return res.status(400).json({
      error: `Narration not implemented for theme: ${themeId}`,
    });
  }

  const bucket = resolveBucket(gameState);
  const pool = snowedInNarration?.[bucket];

  if (!Array.isArray(pool) || pool.length === 0) {
    return res.status(500).json({
      error: `Narration bucket missing/empty: ${bucket}`,
      themeId,
    });
  }

  const selected = pickWeighted(pool);

  if (!selected) {
    return res.status(500).json({
      error: "Failed to select narration option",
      themeId,
      bucket,
    });
  }

  return res.json({
    themeId,
    phase: gameState.phase,
    round: gameState.round,
    bucket,
    narration: selected,
  });
}
