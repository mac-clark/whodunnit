// src/engine/GameSession.js

export class GameSession {
  constructor({ id, gameType }) {
    this.id = id;
    this.gameType = gameType;

    this.players = new Map();
    this.state = "waiting"; // waiting | active | finished

    this.createdAt = Date.now();
  }

  addPlayer(player) {
    this.players.set(player.id, player);
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  toJSON() {
    return {
      id: this.id,
      gameType: this.gameType,
      state: this.state,
      playerCount: this.players.size,
      createdAt: this.createdAt,
    };
  }
}
