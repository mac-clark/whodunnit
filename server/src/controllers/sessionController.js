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

  // Do NOT mutate gameState; return an enriched copy
  return {
    ...playerState,
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
  if (!session.gameState) return res.status(400).json({ error: "Game has not started yet" });

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

  // Safe roster: never include roles/characters for non-narrators
  const safePlayers = Object.values(gs.players || {}).map((p) => ({
    id: p.id,
    name: p.name,
    alive: Boolean(p.alive),
    isNarrator: narratorId ? p.id === narratorId : false,
  }));

  const rawMe = gs.players?.[viewer.id] || null;
  const me = enrichPlayerForViewer(rawMe, gs.themeId);


  if (!me) {
    return res.status(500).json({
      error: "Game state missing viewer player record",
    });
  }

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

    // Private to this viewer
    me,

    // Safe for everyone
    players: safePlayers,
  };

  // Narrator gets the full roster (roles + characters)
  if (isNarrator) {
    payload.fullRoster = Object.values(gs.players || {}).map((p) =>
      enrichPlayerForViewer(p, gs.themeId)
    );
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