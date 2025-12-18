// src/controllers/sessionController.js

import { gameEngine } from "../engine/GameEngine.js";
import { Player } from "../engine/Player.js";

export function createSession(req, res) {
  const { gameType } = req.body;

  try {
    const session = gameEngine.createSession(gameType);
    res.status(201).json(session.toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export function listSessions(req, res) {
  res.json(gameEngine.listSessions());
}

export function joinSession(req, res) {
  const { sessionId } = req.params;
  const { name } = req.body;

  const session = gameEngine.getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.state !== "waiting") {
    return res.status(400).json({
      error: "Cannot join a session that has already started",
    });
  }

  const player = new Player({ name });
  session.addPlayer(player);

  res.status(201).json({
    player: player.toJSON(),
    session: session.toJSON(),
  });
}

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

  if (!session.game) {
    return res.status(400).json({ error: "Game has not started yet" });
  }

  try {
    session.game.advancePhase(session, actorId);
    res.json(session.gameState);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
