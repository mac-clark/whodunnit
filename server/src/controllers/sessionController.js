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
  const { name } = req.body; // may be undefined — Player handles it

  const session = gameEngine.getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  // Enforce lifecycle: only allow joins while waiting
  if (session.state !== "waiting") {
    return res.status(400).json({
      error: "Cannot join a session that has already started",
    });
  }

  // Player owns normalization + defaults
  const player = new Player({ name });

  session.addPlayer(player);

  res.status(201).json({
    player: player.toJSON(),
    session: session.toJSON(),
  });
}