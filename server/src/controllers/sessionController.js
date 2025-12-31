// src/controllers/sessionController.js

import { gameEngine } from "../engine/GameEngine.js";
import { Player } from "../engine/Player.js";
import { ROLES } from "../games/whodunnit/config/roles.js";
import { themeConfig as snowedInTheme } from "../games/whodunnit/config/themes/snowed_in/config.js";

function resolveRoleDefById(roleId) {
  if (!roleId) return null;

  // ROLES is keyed by uppercase names (CIVILIAN) but contains id: "civilian"
  const all = Object.values(ROLES);
  return all.find((r) => r?.id === roleId) || null;
}

function resolveThemeConfig(themeId) {
  // wireframe: only snowed_in is supported right now
  if (!themeId || themeId === "snowed_in") return snowedInTheme;
  return snowedInTheme; // fallback for now
}

function enrichPlayerForViewer(playerState, themeId) {
  if (!playerState) return null;

  const roleId = playerState?.role?.id || playerState?.roleId || null;
  const roleDef = resolveRoleDefById(roleId);

  const theme = resolveThemeConfig(themeId);
  const roleBrief = roleId ? theme?.roleBriefs?.[roleId] || null : null;

  // ✅ viewer-safe: player’s own vote weight (mayor = 2, else 1)
  const voteWeight =
    typeof roleDef?.voteWeight === "number" ? roleDef.voteWeight : 1;

  // Do NOT mutate gameState; return an enriched copy
  return {
    ...playerState,
    voteWeight, // ✅ NEW
    role: roleDef
      ? { ...roleDef } // full canonical role (includes icon)
      : playerState.role || { id: roleId || "civilian" },
    roleBrief,
  };
}

/**
 * Create a new game session
 */
export function createSession(req, res) {
  const { gameType } = req.body;

  try {
    const session = gameEngine.createSession(gameType);
    res.status(201).json(session.toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * List all available sessions
 */
export function listSessions(req, res) {
  res.json(gameEngine.listSessions());
}

/**
 * Join a session (or rejoin if device already exists)
 */
export function joinSession(req, res) {
  const { sessionId } = req.params;
  const { name, deviceToken } = req.body;

  const session = gameEngine.getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.state !== "waiting") {
    return res.status(400).json({
      error: "Cannot join a session that has already started",
    });
  }

  // 🔁 Rejoin if this device already has a player in the session
  const existingPlayer =
    typeof session.findPlayerByDeviceToken === "function"
      ? session.findPlayerByDeviceToken(deviceToken)
      : null;

  if (existingPlayer) {
    // Optional: update name on rejoin
    if (typeof name === "string" && name.trim()) {
      existingPlayer.rename(name);
    }

    existingPlayer.setConnected(true);

    return res.status(200).json({
      player: existingPlayer.toJSON(),
      session: session.toJSON(),
    });
  }

  // ➕ New player
  const player = new Player({ name, deviceToken });
  session.addPlayer(player);

  res.status(201).json({
    player: player.toJSON(),
    session: session.toJSON(),
  });
}

/**
 * Reconnect an existing player after refresh
 */
export function reconnectSession(req, res) {
  const { sessionId } = req.params;
  const { deviceToken } = req.body;

  const session = gameEngine.getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const player =
    typeof session.findPlayerByDeviceToken === "function"
      ? session.findPlayerByDeviceToken(deviceToken)
      : null;

  if (!player) {
    return res
      .status(404)
      .json({ error: "Player not found for this device" });
  }

  player.setConnected(true);

  res.status(200).json({
    player: player.toJSON(),
    session: session.toJSON(),
  });
}

function buildNarrationCursor(gs) {
  const evs = Array.isArray(gs?.events) ? gs.events : [];
  const last = evs.length ? evs[evs.length - 1] : null;

  return [
    gs.phase || "setup",
    gs.round || 0,
    gs.storyStep || 0,

    // ✅ the real missing piece (your gating)
    gs.dayStep || "",

    // ✅ vote lifecycle affects bucket
    gs.vote?.open === true ? 1 : 0,
    gs.vote?.resolved === true ? 1 : 0,

    // ✅ night prompt lifecycle affects bucket
    gs.nightPrompt?.ability || "",
    gs.nightPrompt?.done === true ? 1 : 0,
    typeof gs.nightIndex === "number" ? gs.nightIndex : 0,

    // ✅ last event is a great “bucket changed” proxy
    last?.type || "",
  ].join("|");
}

/**
 * View a started game session (player-scoped, no role leaks)
 * POST /sessions/:sessionId/view
 * body: { deviceToken }
 */
export function viewSession(req, res) {
  const { sessionId } = req.params;
  const { deviceToken } = req.body;

  const session = gameEngine.getSession(sessionId);

  if (!session) return res.status(404).json({ error: "Session not found" });
  if (!session.gameState)
    return res.status(400).json({ error: "Game has not started yet" });

  // normal viewer resolution
  let viewer =
    typeof session.findPlayerByDeviceToken === "function"
      ? session.findPlayerByDeviceToken(deviceToken)
      : null;

  // ✅ DEV override (impersonate by playerId header)
  const devToolsOn = process.env.DEV_TOOLS === "1";
  const devPlayerId = req.get("x-dev-player-id");

  if (!viewer && devToolsOn && devPlayerId) {
    viewer = session.players?.get(devPlayerId) || null; // players is a Map
  }

  if (!viewer) {
    return res.status(404).json({ error: "Player not found for this device" });
  }

  const gs = session.gameState;
  const narratorId = gs.narratorId || null;
  const isNarrator = narratorId && viewer.id === narratorId;
  const isGameOver = gs?.gameOver === true || gs?.phase === "ended";


  // Safe roster: never include roles/characters for non-narrators
  const safePlayers = Object.values(gs.players || {}).map((p) => ({
    id: p.id,
    name: p.name,
    alive: Boolean(p.alive),
    isNarrator: narratorId ? p.id === narratorId : false,
  }));

  const rawMe = gs.players?.[viewer.id] || null;
  const me = enrichPlayerForViewer(rawMe, gs.themeId);

  // ─────────────────────────────
  // Ability result exposure (viewer-scoped)
  // ─────────────────────────────

  let investigationResult = null;
  let isSilenced = false;

  // Detective gets private investigation result
  if (
    me?.role?.id === "detective" &&
    gs.investigations &&
    gs.investigations[viewer.id]
  ) {
    investigationResult = gs.investigations[viewer.id];
  }

  // Silenced players are informed (but not why)
  if (gs.silencedPlayers instanceof Set) {
    isSilenced = gs.silencedPlayers.has(viewer.id);
  }

  if (!me) {
    return res.status(500).json({
      error: "Game state missing viewer player record",
    });
  }

  // ─────────────────────────────
  // Vote summary (safe + viewer scoped)
  // ─────────────────────────────
  const silencedSet = gs.silencedPlayers instanceof Set ? gs.silencedPlayers : new Set();

  const eligibleVoters = Object.values(gs.players || {}).filter((p) => {
    if (!p.alive) return false;
    if (p.id === gs.narratorId) return false;
    if (silencedSet.has(p.id)) return false;
    return true;
  });

  const requiredVoteCount = eligibleVoters.length;

  const voteVotes = (gs.vote && gs.vote.votes) ? gs.vote.votes : {};

  // ✅ Only count votes from eligible voters (abstain/null still counts if key exists)
  const votesCount = eligibleVoters.reduce((count, p) => {
    return count + (Object.prototype.hasOwnProperty.call(voteVotes, p.id) ? 1 : 0);
  }, 0);

  const myVote = Object.prototype.hasOwnProperty.call(voteVotes, viewer.id)
    ? (voteVotes[viewer.id] ?? null)
    : null;

  // ─────────────────────────────
  // Night prompt (safe)
  // ─────────────────────────────
  const nightPrompt = gs.nightPrompt
    ? {
        ability: gs.nightPrompt.ability || null,
        actorIds: Array.isArray(gs.nightPrompt.actorIds) ? gs.nightPrompt.actorIds : [],
        round: gs.nightPrompt.round || gs.round || null,
        done: gs.nightPrompt.done === true, // ✅ for UI
      }
    : null;

  const payload = {
    sessionId: session.id,
    state: session.state,
    gameType: session.gameType,

    themeId: gs.themeId,
    phase: gs.phase,
    round: gs.round,
    storyStep: gs.storyStep || 0,

    narratorId,
    isNarrator,

    // ✅ include these always (frontend can rely on them)
    gameOver: gs.gameOver === true,
    gameResult: gs.gameResult || null,

    me,

    effects: {
      investigation: investigationResult,
      silenced: isSilenced === true,
    },

    players: safePlayers,

    nightPrompt,
    vote: {
      open: gs.vote?.open === true,
      resolved: gs.vote?.resolved === true,
      votesCount,
      requiredCount: requiredVoteCount,
      complete: votesCount >= requiredVoteCount,
      myVote,
    },
  };

  // ✅ Reveal roles to everyone only at game over, otherwise narrator only
  if (isNarrator || isGameOver) {
    payload.fullRoster = Object.values(gs.players || {}).map((p) =>
      enrichPlayerForViewer(p, gs.themeId)
    );
  }

  // Narrator-only extras
  if (isNarrator) {
    payload.nightActions = gs.nightActions || {};
    payload.nightQueueMeta = {
      index: typeof gs.nightIndex === "number" ? gs.nightIndex : 0,
      length: Array.isArray(gs.nightQueue) ? gs.nightQueue.length : 0,
    };

    payload.effectsSummary = {
      investigations: gs.investigations || {},
      silencedPlayers: Array.from(gs.silencedPlayers || []),
    };

    payload.narrationCursor = buildNarrationCursor(gs);
  }

  return res.json(payload);
}

/**
 * Start the session (host-only)
 */
export function startSession(req, res) {
  const { sessionId } = req.params;
  const { playerId } = req.body;

  const session = gameEngine.getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  try {
    const handler = gameEngine.getGameHandler(session.gameType);
    session.start(playerId, handler);
    res.json(session.toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * Advance the current game phase (narrator-only)
 * POST /sessions/:sessionId/phase/advance
 * body: { deviceToken }
 * dev: header x-dev-player-id
 */
export function advancePhase(req, res) {
  const { sessionId } = req.params;
  const { deviceToken } = req.body;

  const session = gameEngine.getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (!session.gameState) {
    return res.status(400).json({ error: "Game has not started yet" });
  }

  // ─────────────────────────────
  // Resolve actor (same rules as viewSession)
  // ─────────────────────────────

  let actor =
    typeof session.findPlayerByDeviceToken === "function"
      ? session.findPlayerByDeviceToken(deviceToken)
      : null;

  // ✅ DEV override (impersonate by playerId header)
  const devToolsOn = process.env.DEV_TOOLS === "1";
  const devPlayerId = req.get("x-dev-player-id");

  if (!actor && devToolsOn && devPlayerId) {
    actor = session.players?.get(devPlayerId) || null; // players is a Map
  }

  if (!actor) {
    return res.status(404).json({ error: "Player not found for this device" });
  }

  // ─────────────────────────────
  // Enforce narrator-only (controller-level)
  // ─────────────────────────────

  const gs = session.gameState;
  const narratorId = gs.narratorId || null;

  if (!narratorId || actor.id !== narratorId) {
    return res
      .status(403)
      .json({ error: "Only the narrator can advance the phase" });
  }

  try {
    const handler = gameEngine.getGameHandler(session.gameType);

    // Keep your handler signature stable: pass actor.id
    handler.advancePhase(session, actor.id);

    return res.json(session.gameState);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// ─────────────────────────────
// Shared actor resolver (matches viewSession/advancePhase behavior)
// ─────────────────────────────
function resolveActorFromRequest(session, req, deviceToken) {
  let actor =
    typeof session.findPlayerByDeviceToken === "function"
      ? session.findPlayerByDeviceToken(deviceToken)
      : null;

  // ✅ DEV override (impersonate by playerId header)
  const devToolsOn = process.env.DEV_TOOLS === "1";
  const devPlayerId = req.get("x-dev-player-id");

  if (!actor && devToolsOn && devPlayerId) {
    actor = session.players?.get(devPlayerId) || null; // players is a Map
  }

  return actor;
}

function getActorState(gs, actorId) {
  return gs?.players?.[actorId] || null;
}

function getRoleIdFromActorState(actorState) {
  return actorState?.role?.id || actorState?.roleId || null;
}

function getAbilitiesFromActorState(actorState) {
  return Array.isArray(actorState?.role?.abilities) ? actorState.role.abilities : [];
}

function isAliveNonNarrator(gs, actorState) {
  if (!actorState) return false;
  if (!actorState.alive) return false;
  if (actorState.id === gs.narratorId) return false;
  return true;
}

// ─────────────────────────────
// POST /sessions/:sessionId/vote
// body: { deviceToken, targetId }
// targetId can be a playerId OR null/""/"abstain" to vote for no one
// ─────────────────────────────
export function submitVote(req, res) {
  const { sessionId } = req.params;
  const { deviceToken, targetId } = req.body;

  const session = gameEngine.getSession(sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (!session.gameState) return res.status(400).json({ error: "Game has not started yet" });

  const gs = session.gameState;

  const actor = resolveActorFromRequest(session, req, deviceToken);
  if (!actor) return res.status(404).json({ error: "Player not found for this device" });

  const actorState = getActorState(gs, actor.id);
  if (!actorState) return res.status(400).json({ error: "Player missing from game state" });

  if (!isAliveNonNarrator(gs, actorState)) {
    return res.status(403).json({ error: "Only alive players can vote" });
  }

  // ✅ Silenced players cannot vote
  if (gs.silencedPlayers instanceof Set && gs.silencedPlayers.has(actor.id)) {
    return res.status(403).json({ error: "You are silenced and cannot vote today" });
  }

  if (gs.phase !== "day") {
    return res.status(400).json({ error: "Voting is only allowed during the day" });
  }

  // ✅ Initialize vote state
  if (!gs.vote || typeof gs.vote !== "object") {
    gs.vote = { open: false, votes: {}, resolved: false, result: null };
  }
  if (!gs.vote.votes || typeof gs.vote.votes !== "object") {
    gs.vote.votes = {};
  }

  if (gs.vote.open !== true) {
    return res.status(400).json({ error: "Voting is not open yet" });
  }

  // ✅ Allow abstain / vote for no one
  const isAbstain =
    targetId === null ||
    targetId === "" ||
    targetId === "abstain";

  // Validate target ONLY if not abstaining
  if (!isAbstain) {
    const targetState = getActorState(gs, targetId);
    if (!targetState) {
      return res.status(400).json({ error: "Invalid vote target" });
    }
    if (!targetState.alive) {
      return res.status(400).json({ error: "Cannot vote for a dead player" });
    }
    if (targetId === gs.narratorId) {
      return res.status(400).json({ error: "Cannot vote for the narrator" });
    }
  }

  // Store / update vote (abstain stored as null)
  gs.vote.votes[actor.id] = isAbstain ? null : targetId;

  const silencedSet = gs.silencedPlayers instanceof Set ? gs.silencedPlayers : new Set();

  const eligibleVoters = Object.values(gs.players || {}).filter((p) => {
    if (!p.alive) return false;
    if (p.id === gs.narratorId) return false;
    if (silencedSet.has(p.id)) return false;
    return true;
  });

  const requiredCount = eligibleVoters.length;

  // ✅ Count "submitted votes" including abstains (null still counts)
  const votesCount = eligibleVoters.reduce((count, p) => {
    return count + (Object.prototype.hasOwnProperty.call(gs.vote.votes, p.id) ? 1 : 0);
  }, 0);

  return res.json({
    ok: true,
    phase: gs.phase,
    round: gs.round,
    vote: {
      open: gs.vote.open,
      votesCount,
      requiredCount,
      complete: votesCount === requiredCount,
      myVote: Object.prototype.hasOwnProperty.call(gs.vote.votes, actor.id)
        ? (gs.vote.votes[actor.id] ?? null)
        : null,
    },
  });
}

// ─────────────────────────────
// POST /sessions/:sessionId/night/action
// body: { deviceToken, ability, targetId }
// ─────────────────────────────
export function submitNightAction(req, res) {
  const { sessionId } = req.params;
  const { deviceToken, ability, targetId } = req.body;

  const session = gameEngine.getSession(sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (!session.gameState) return res.status(400).json({ error: "Game has not started yet" });

  const gs = session.gameState;

  const actor = resolveActorFromRequest(session, req, deviceToken);
  if (!actor) return res.status(404).json({ error: "Player not found for this device" });

  const actorState = getActorState(gs, actor.id);
  if (!actorState) return res.status(400).json({ error: "Player missing from game state" });

  if (!isAliveNonNarrator(gs, actorState)) {
    return res.status(403).json({ error: "Only alive players can act at night" });
  }

  if (gs.phase !== "night") {
    return res.status(400).json({ error: "Night actions are only allowed at night" });
  }

  // Must have an active prompt to act (turn-gated game)
  if (!gs.nightPrompt?.ability) {
    return res.status(400).json({ error: "No night action is currently active" });
  }

  // Validate ability
  if (!ability || typeof ability !== "string") {
    return res.status(400).json({ error: "Missing ability" });
  }

  // 🔒 TURN GATE: must match current night prompt exactly
  if (gs.nightPrompt.ability !== ability) {
    return res.status(400).json({ error: "It is not your turn to act" });
  }

  // Validate the actor is one of the allowed actors for this prompt
  const promptActorIds = Array.isArray(gs.nightPrompt.actorIds) ? gs.nightPrompt.actorIds : [];
  if (!promptActorIds.includes(actor.id)) {
    return res.status(403).json({ error: "You are not allowed to act right now" });
  }

  // Ability ownership:
  // - normally: actor must have that exact ability
  // - special case: mafia_kill prompt is powered by the mafia's "kill" role ability
  const roleAbilities = getAbilitiesFromActorState(actorState);
  const roleAlignment = actorState?.role?.alignment || null;

  const isMafiaKill =
    ability === "mafia_kill" && roleAlignment === "mafia" && roleAbilities.includes("kill");

  if (!isMafiaKill && !roleAbilities.includes(ability)) {
    return res.status(403).json({ error: "You do not have that ability" });
  }

  // Validate target
  const targetState = getActorState(gs, targetId);
  if (!targetId || !targetState) {
    return res.status(400).json({ error: "Invalid target" });
  }
  if (!targetState.alive) {
    return res.status(400).json({ error: "Cannot target a dead player" });
  }
  if (targetId === gs.narratorId) {
    return res.status(400).json({ error: "Cannot target the narrator" });
  }

  // ─────────────────────────────
  // Store night action
  // ─────────────────────────────
  if (!gs.nightActions || typeof gs.nightActions !== "object") {
    gs.nightActions = {};
  }
  if (!gs.nightActions[ability] || typeof gs.nightActions[ability] !== "object") {
    gs.nightActions[ability] = {};
  }

  gs.nightActions[ability][actor.id] = targetId;

  if (ability === "investigate_alignment") {
    // ensure investigations container exists
    if (!gs.investigations || typeof gs.investigations !== "object") {
      gs.investigations = {};
    }

    // If roleblocks are already recorded (block step happened earlier),
    // prevent result exposure when blocked.
    const blockedTargets = new Set(Object.values(gs.nightActions?.block || {}));
    const isBlocked = blockedTargets.has(actor.id);

    if (!isBlocked) {
      gs.investigations[actor.id] = {
        targetId,
        alignment: targetState?.role?.alignment || "unknown",
        round: gs.round,
      };
    } else {
      // ensure no stale prior result leaks this round
      delete gs.investigations[actor.id];
    }
  }

  // ─────────────────────────────
  // ✅ MARK PROMPT AS COMPLETE (only when all actors have submitted)
  // ─────────────────────────────
  if (gs.nightPrompt) {
    if (!Array.isArray(gs.nightPrompt.doneActorIds)) gs.nightPrompt.doneActorIds = [];

    if (!gs.nightPrompt.doneActorIds.includes(actor.id)) {
      gs.nightPrompt.doneActorIds.push(actor.id);
    }

    const allDone = promptActorIds.every((id) => !!gs.nightActions?.[ability]?.[id]);
    gs.nightPrompt.done = allDone === true;
  }

  return res.json({
    ok: true,
    phase: gs.phase,
    round: gs.round,
    action: {
      ability,
      actorId: actor.id,
      targetId,
      roleId: getRoleIdFromActorState(actorState),
    },
    prompt: {
      ability: gs.nightPrompt?.ability || null,
      done: gs.nightPrompt?.done === true,
      doneActorIds: gs.nightPrompt?.doneActorIds || [],
    },
  });
}