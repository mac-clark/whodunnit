import { gameEngine } from "../engine/GameEngine.js";
import { whodunnitGame } from "../games/whodunnit/index.js";

export function registerGames() {
  // Placeholder registrations for now
  gameEngine.registerGame("whodunnit", whodunnitGame);
  gameEngine.registerGame("hub", {});
}
