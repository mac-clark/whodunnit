// src/controllers/sessionController.js

import { gameEngine } from "../engine/GameEngine.js";
import { Player } from "../engine/Player.js";

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

  const me = gs.players?.[viewer.id] || null;

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

    narratorId,
    isNarrator,

    // Private to this viewer
    me,

    // Safe for everyone
    players: safePlayers,
  };

  // Narrator gets the full roster (roles + characters)
  if (isNarrator) {
    payload.fullRoster = Object.values(gs.players || {});
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
 */
export function advancePhase(req, res) {
  const { sessionId } = req.params;
  const { actorId } = req.body;

  const session = gameEngine.getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  // ✅ Correct check for your current architecture
  if (!session.gameState) {
    return res.status(400).json({ error: "Game has not started yet" });
  }

  try {
    const handler = gameEngine.getGameHandler(session.gameType);
    handler.advancePhase(session, actorId);

    // return something consistent (your view endpoint will read this)
    res.json(session.gameState);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}