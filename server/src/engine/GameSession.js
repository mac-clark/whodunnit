// src/engine/GameSession.js

export class GameSession {
  constructor({ id, gameType }) {
    this.id = id;
    this.gameType = gameType;

    this.players = new Map();

    this.hostPlayerId = null;

    this.state = "waiting"; // waiting | active | finished
    this.createdAt = Date.now();
    this.startedAt = null;
  }

  addPlayer(player) {
    if (this.state !== "waiting") {
      throw new Error("Cannot join a session that has already started");
    }

    this.players.set(player.id, player);

    // First player becomes host
    if (!this.hostPlayerId) {
      this.hostPlayerId = player.id;
    }
  }

  removePlayer(playerId) {
    this.players.delete(playerId);

    if (this.hostPlayerId === playerId) {
      const next = this.players.keys().next().value || null;
      this.hostPlayerId = next;
    }
  }

  start(playerId, gameHandler = null) {
    if (this.state !== "waiting") {
      throw new Error("Session has already started");
    }

    if (playerId !== this.hostPlayerId) {
      throw new Error("Only the host can start the session");
    }

    this.state = "active";
    this.startedAt = Date.now();
    this.game = gameHandler;

    // 🔌 Let the game initialize itself
    if (this.game?.onStart) {
      this.game.onStart(this);
    }
  }

  findPlayerByDeviceToken(deviceToken) {
    if (!deviceToken) return null;

    for (const p of this.players.values()) {
      if (p.deviceToken && p.deviceToken === deviceToken) return p;
    }

    return null;
  }

  toJSON() {
    return {
      id: this.id,
      gameType: this.gameType,
      state: this.state,
      hostPlayerId: this.hostPlayerId,
      playerCount: this.players.size,
      players: Array.from(this.players.values()).map((p) => p.toJSON()),
      createdAt: this.createdAt,
      startedAt: this.startedAt,
    };
  }
}