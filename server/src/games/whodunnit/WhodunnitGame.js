// src/games/whodunnit/WhodunnitGame.js

export class WhodunnitGame {
  onStart(session) {
    // This will eventually:
    // - assign roles
    // - initialize story state
    // - lock player list
    // - prepare first phase
    console.log("[WhodunnitGame] onStart fired for session", session.id);

    // For now: just mark that the game has initialized
    session.meta = {
      game: "whodunnit",
      initializedAt: Date.now(),
    };
  }
}
