// src/controllers/narrationController.js

import { gameEngine } from "../engine/GameEngine.js";
import { WHODUNNIT_EVENTS as E } from "../games/whodunnit/events.js";
import { narration as snowedInNarration } from "../games/whodunnit/config/themes/snowed_in/narration.js";

/**
 * Weighted random pick from an array of items with optional `weight` (default 1).
 */
function pickWeighted(options) {
  if (!Array.isArray(options) || options.length === 0) return null;

  const weights = options.map((o) => (typeof o.weight === "number" ? o.weight : 1));
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);

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

function bucketExists(narrationObj, key) {
  return Array.isArray(narrationObj?.[key]) && narrationObj[key].length > 0;
}

function getLastEventType(gameState) {
  const evs = Array.isArray(gameState?.events) ? gameState.events : [];
  const last = evs.length ? evs[evs.length - 1] : null;
  return last?.type || null;
}

function getLastEventTypes(gameState, n = 3) {
  const evs = Array.isArray(gameState?.events) ? gameState.events : [];
  if (!evs.length) return [];
  return evs.slice(-n).map((e) => e?.type || null);
}

/**
 * ✅ Get the eliminatedId from the most recent night.ended event.
 * This is the source of truth for whether night_result should be death vs no_death.
 */
function getLastNightEliminatedId(gameState) {
  const evs = Array.isArray(gameState?.events) ? gameState.events : [];
  for (let i = evs.length - 1; i >= 0; i--) {
    const ev = evs[i];
    if (ev?.type === E.NIGHT_ENDED) {
      return ev?.payload?.eliminatedId ?? null;
    }
  }
  return null;
}

/**
 * ✅ Get the eliminatedId from the most recent day vote.
 * Source of truth for whether day_result should include an elimination.
 */
function getLastDayVoteEliminatedId(gameState) {
  const evs = Array.isArray(gameState?.events) ? gameState.events : [];
  for (let i = evs.length - 1; i >= 0; i--) {
    const ev = evs[i];
    if (ev?.type === E.VOTE_RESOLVED) {
      return ev?.payload?.eliminatedId ?? null;
    }
  }
  return null;
}

/**
 * Decide which narration bucket to use (snowed_in).
 */
function resolveBucket(gameState, narrationObj) {
  const phase = gameState?.phase || "setup";
  const round = Number(gameState?.round || 0);
  const storyStep = Number(gameState?.storyStep || 0);

  // Intro beats
  if (storyStep === 1 && bucketExists(narrationObj, "prologue")) return "prologue";
  if (storyStep === 2 && bucketExists(narrationObj, "rules")) return "rules";
  if (storyStep === 3 && bucketExists(narrationObj, "night_1")) return "night_1";
  if (storyStep === 4 && bucketExists(narrationObj, "day_1")) return "day_1";

  // Back-compat
  if (round === 1 && phase === "night" && bucketExists(narrationObj, "night_1")) return "night_1";
  if (round === 1 && phase === "day" && bucketExists(narrationObj, "day_1")) return "day_1";

  if (phase === "setup") {
    if (bucketExists(narrationObj, "prologue")) return "prologue";
    if (bucketExists(narrationObj, "rules")) return "rules";
  }

  const lastType = getLastEventType(gameState);

  // NIGHT phase
  if (phase === "night") {
    if (lastType === E.NIGHT_ENDED && bucketExists(narrationObj, "night_result")) {
      return "night_result";
    }

    if (
      lastType === E.NIGHT_STARTED ||
      lastType === E.ROLE_ACTION_REQUESTED ||
      lastType === E.ROLE_ACTION_RESOLVED ||
      lastType === E.INFORMATION_REVEALED
    ) {
      if (bucketExists(narrationObj, "night_prompt")) return "night_prompt";
    }

    if (bucketExists(narrationObj, "night_prompt")) return "night_prompt";
    if (bucketExists(narrationObj, "night_1")) return "night_1";
  }

  // DAY phase
  if (phase === "day") {
    const [prevType, lastType2] = getLastEventTypes(gameState, 2);

    // night.ended -> day.started => show night_result first
    if (
      lastType2 === E.DAY_STARTED &&
      prevType === E.NIGHT_ENDED &&
      bucketExists(narrationObj, "night_result")
    ) {
      return "night_result";
    }

    if (
      (lastType2 === E.VOTE_RESOLVED || lastType2 === E.PLAYER_ELIMINATED) &&
      bucketExists(narrationObj, "day_result")
    ) {
      return "day_result";
    }

    if (
      lastType2 === E.VOTE_STARTED ||
      lastType2 === E.INFORMATION_REVEALED ||
      lastType2 === E.DAY_STARTED
    ) {
      if (bucketExists(narrationObj, "day_prompt")) return "day_prompt";
    }

    if (bucketExists(narrationObj, "day_prompt")) return "day_prompt";
    if (bucketExists(narrationObj, "day_1")) return "day_1";
  }

  // Last resort
  if (bucketExists(narrationObj, "day_prompt")) return "day_prompt";
  if (bucketExists(narrationObj, "night_prompt")) return "night_prompt";
  if (bucketExists(narrationObj, "day_1")) return "day_1";
  if (bucketExists(narrationObj, "night_1")) return "night_1";
  if (bucketExists(narrationObj, "prologue")) return "prologue";
  if (bucketExists(narrationObj, "rules")) return "rules";

  return null;
}

/**
 * GET /sessions/:sessionId/narration
 */
export function getNarration(req, res) {
  const { sessionId } = req.params;

  const session = gameEngine.getSession(sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (!session.gameState) return res.status(400).json({ error: "Game has not started yet" });

  const gameState = session.gameState;

  const themeId = gameState.themeId || session.meta?.themeId || "snowed_in";
  if (themeId !== "snowed_in") {
    return res.status(400).json({ error: `Narration not implemented for theme: ${themeId}` });
  }

  const narrationObj = snowedInNarration;

  const bucket = resolveBucket(gameState, narrationObj);
  if (!bucket) {
    return res.status(500).json({
      error: "Failed to resolve narration bucket",
      themeId,
      phase: gameState.phase,
      round: gameState.round,
      storyStep: gameState.storyStep || 0,
      lastEventType: getLastEventType(gameState),
    });
  }

  // ✅ pool selection
  let pool = narrationObj?.[bucket];
  if (!Array.isArray(pool) || pool.length === 0) {
    return res.status(500).json({ error: `Narration bucket missing/empty: ${bucket}`, themeId });
  }

  // ✅ CRITICAL FIX: night_result must match whether someone actually died
  if (bucket === "night_result") {
    const eliminatedId = getLastNightEliminatedId(gameState);
    const wantsDeath = Boolean(eliminatedId);

    const filtered = pool.filter((n) => {
      if (wantsDeath) return n.intent === "reveal_death";
      return n.intent === "reveal_no_death";
    });

    // if authoring mistake leaves it empty, fallback to original pool
    if (filtered.length) pool = filtered;
  }

  // ✅ NEW: day_result must match whether someone was eliminated by the vote
  if (bucket === "day_result") {
    const eliminatedId = getLastDayVoteEliminatedId(gameState);
    const wantsElimination = Boolean(eliminatedId);

    const filtered = pool.filter((n) => {
      if (wantsElimination) return n.intent === "reveal_vote_elimination";
      return n.intent === "reveal_vote_no_elimination";
    });

    // if authoring mistake leaves it empty, fallback to original pool
    if (filtered.length) pool = filtered;
  }

  const selected = pickWeighted(pool);
  if (!selected) {
    return res.status(500).json({ error: "Failed to select narration option", themeId, bucket });
  }

  return res.json({
    themeId,
    phase: gameState.phase,
    round: gameState.round,
    storyStep: gameState.storyStep || 0,
    bucket,
    narration: selected,
  });
}