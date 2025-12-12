// src/engine/GameEngine.js

import { sessionStore } from "./SessionStore.js";
import { GameSession } from "./GameSession.js";
import { randomUUID } from "crypto";

class GameEngine {
  constructor() {
    this.registeredGames = new Map();
  }

  registerGame(gameType, handler) {
    this.registeredGames.set(gameType, handler);
  }

  createSession(gameType) {
    if (!this.registeredGames.has(gameType)) {
      throw new Error(`Unknown game type: ${gameType}`);
    }

    const session = new GameSession({
      id: randomUUID(),
      gameType,
    });

    sessionStore.create(session);
    return session;
  }

  getSession(sessionId) {
    return sessionStore.get(sessionId);
  }

  listSessions() {
    return sessionStore.list().map((s) => s.toJSON());
  }
}

export const gameEngine = new GameEngine();
