// src/games/whodunnit/WhodunnitGame.js

import { ROLES } from "./config/roles.js";
import { getThemeById } from "./config/themes/index.js";
import { WHODUNNIT_EVENTS } from "./events.js";

export class WhodunnitGame {
  onStart(session) {
    console.log("[WhodunnitGame] onStart fired for session", session.id);

    const players = Array.from(session.players.values());

    if (players.length < 3) {
      throw new Error("Not enough players to start Whodunnit");
    }

    // ─────────────────────────────
    // Resolve theme
    // ─────────────────────────────

    const themeId = session.meta?.themeId || "snowed_in";
    const theme = getThemeById(themeId);

    if (!theme) {
      throw new Error(`Unknown theme: ${themeId}`);
    }

    // ─────────────────────────────
    // Initialize game state
    // ─────────────────────────────

    session.gameState = {
      phase: "setup",
      round: 0,
      themeId: theme.id,
      players: {},
      narratorId: null,
      events: [],
    };

    // ─────────────────────────────
    // Assign narrator
    // ─────────────────────────────

    const narrator =
      players[Math.floor(Math.random() * players.length)];

    session.gameState.narratorId = narrator.id;

    // ─────────────────────────────
    // Assign roles (mechanical)
    // Required: mafia, detective, doctor
    // ─────────────────────────────

    const nonNarratorPlayers = players.filter(
      (p) => p.id !== narrator.id
    );

    const shuffled = shuffle(nonNarratorPlayers);

    const assignedRoles = [];

    // Required roles
    assignedRoles.push(ROLES.MAFIA.id);
    assignedRoles.push(ROLES.DETECTIVE.id);
    assignedRoles.push(ROLES.DOCTOR.id);

    // Fill remaining with civilians for now
    while (assignedRoles.length < shuffled.length) {
      assignedRoles.push(ROLES.CIVILIAN.id);
    }

    shuffle(assignedRoles);

    // ─────────────────────────────
    // Assign players + characters
    // ─────────────────────────────

    shuffled.forEach((player, index) => {
      const roleId = assignedRoles[index];
      const role = ROLES[roleId.toUpperCase()];

      const characterPool = theme.roleMap[roleId] || [];
      const character =
        characterPool.length > 0
          ? characterPool[Math.floor(Math.random() * characterPool.length)]
          : null;

      session.gameState.players[player.id] = {
        id: player.id,
        name: player.name,
        alive: true,

        role: {
          id: role.id,
          alignment: role.alignment,
          objective: role.objective,
          abilities: role.abilities,
        },

        character,
      };
    });

    // Narrator entry (not a gameplay player)
    session.gameState.players[narrator.id] = {
      id: narrator.id,
      name: narrator.name,
      alive: true,
      role: ROLES.NARRATOR,
      character: null,
    };

    // ─────────────────────────────
    // Emit setup events (record-only for now)
    // ─────────────────────────────

    this.emit(session, WHODUNNIT_EVENTS.NARRATOR_ASSIGNED, {
      narratorId: narrator.id,
    });

    this.emit(session, WHODUNNIT_EVENTS.ROLES_ASSIGNED, {
      players: session.gameState.players,
    });

    this.emit(session, WHODUNNIT_EVENTS.GAME_STARTED, {
      themeId: theme.id,
    });
  }

  emit(session, type, payload = {}) {
    session.gameState.events.push({
      type,
      payload,
      timestamp: Date.now(),
    });
  }
}

// ─────────────────────────────
// Utilities (local for now)
// ─────────────────────────────

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}
