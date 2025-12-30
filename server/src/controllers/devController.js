// src/controllers/devController.js

import { randomUUID } from "crypto";
import { gameEngine } from "../engine/GameEngine.js";
import { Player } from "../engine/Player.js";

// local-only guard
function assertDev(res) {
  if (process.env.DEV_TOOLS !== "1") {
    res.status(404).json({ error: "Not found" });
    return false;
  }
  return true;
}

/**
 * POST /dev/quickstart
 * Body: { gameType="whodunnit", themeId="snowed_in", count=8, names?=[] }
 *
 * Creates session -> seeds players -> starts game
 * Returns: { sessionId, players: [{id,name,deviceToken,isHost}], narratorId }
 */
export function devQuickstart(req, res) {
  if (!assertDev(res)) return;

  const {
    gameType = "whodunnit",
    themeId = "snowed_in",
    count = 8,
    names = [],
  } = req.body || {};

  try {
    const session = gameEngine.createSession(gameType);

    // attach meta for theme selection
    session.meta = session.meta || {};
    session.meta.themeId = themeId;

    // seed players
    const total = Math.max(3, Math.min(24, Number(count) || 8));

    const seeded = [];
    for (let i = 0; i < total; i++) {
      const name =
        typeof names[i] === "string" && names[i].trim()
          ? names[i].trim()
          : `Player ${i + 1}`;

      const deviceToken = `dev_${randomUUID()}`;

      const p = new Player({ name, deviceToken });
      session.addPlayer(p);

      seeded.push({
        id: p.id,
        name: p.name,
        deviceToken,
        isHost: p.id === session.hostPlayerId,
      });
    }

    // start game using host
    const handler = gameEngine.getGameHandler(session.gameType);
    session.start(session.hostPlayerId, handler);

    // narratorId is stored in gameState by WhodunnitGame.onStart()
    const narratorId = session.gameState?.narratorId || null;

    return res.status(201).json({
      sessionId: session.id,
      players: seeded,
      narratorId,
      themeId: session.gameState?.themeId || themeId,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
