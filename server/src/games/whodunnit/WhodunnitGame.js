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

    const playerCount = nonNarratorPlayers.length;
    const rolesPool = [];

    // --- REQUIRED ROLES ---
    rolesPool.push(ROLES.DETECTIVE.id);
    rolesPool.push(ROLES.DOCTOR.id);

    // --- OPTIONAL ROLE CANDIDATES ---
    const optionalRoles = Object.values(ROLES).filter((role) => {
      if (!role.countsAsPlayer) return false;
      if (role.required) return false;
      if (role.id === "civilian") return false;
      if (role.maxPerGame === 0) return false;
      return true;
    });

    // Track maxPerGame
    const roleCounts = {};
    rolesPool.forEach((r) => {
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    });

    // --- Required mafia ---
    rolesPool.push(ROLES.MAFIA.id);
    roleCounts[ROLES.MAFIA.id] = 1;

    // --- Mafia scaling ---
    const mafiaCount = Math.max(1, Math.floor(playerCount / 4));

    for (let i = 1; i < mafiaCount; i++) {
      rolesPool.push(ROLES.MAFIA.id);
      roleCounts[ROLES.MAFIA.id]++;
    }

    // --- Fill remaining slots ---
    while (rolesPool.length < playerCount) {
      const roll = Math.random();

      // 70% chance civilian
      if (roll < 0.7) {
        rolesPool.push(ROLES.CIVILIAN.id);
        roleCounts[ROLES.CIVILIAN.id] = (roleCounts[ROLES.CIVILIAN.id] || 0) + 1;
        continue;
      }

      // 30% chance specialty
      const candidates = optionalRoles.filter((role) => {
        if (role.maxPerGame) {
          return (roleCounts[role.id] || 0) < role.maxPerGame;
        }
        return true;
      });

      if (candidates.length === 0) {
        rolesPool.push(ROLES.CIVILIAN.id);
        roleCounts[ROLES.CIVILIAN.id] =
          (roleCounts[ROLES.CIVILIAN.id] || 0) + 1;
        continue;
      }

      const selected =
        candidates[Math.floor(Math.random() * candidates.length)];

      rolesPool.push(selected.id);
      roleCounts[selected.id] = (roleCounts[selected.id] || 0) + 1;
    }

    // Shuffle final role list
    shuffle(rolesPool);

    // ─────────────────────────────
    // Assign players + characters
    // ─────────────────────────────

    nonNarratorPlayers.forEach((player, index) => {
      const roleId = rolesPool[index];
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

  advancePhase(session, actorId) {
    const { gameState } = session;

    if (actorId !== gameState.narratorId) {
      throw new Error("Only the narrator can advance the phase");
    }

    const currentPhase = gameState.phase;

    switch (currentPhase) {
      case "setup":
        gameState.phase = "day";
        gameState.round = 1;

        this.emit(session, WHODUNNIT_EVENTS.ROUND_STARTED, {
          round: gameState.round,
        });

        this.emit(session, WHODUNNIT_EVENTS.DAY_STARTED, {
          round: gameState.round,
        });
        break;

      case "day":
        gameState.phase = "night";

        this.emit(session, WHODUNNIT_EVENTS.NIGHT_STARTED, {
          round: gameState.round,
        });
        break;

      case "night":
        this.emit(session, WHODUNNIT_EVENTS.NIGHT_ENDED, {
          round: gameState.round,
        });

        gameState.round += 1;
        gameState.phase = "day";

        this.emit(session, WHODUNNIT_EVENTS.ROUND_STARTED, {
          round: gameState.round,
        });

        this.emit(session, WHODUNNIT_EVENTS.DAY_STARTED, {
          round: gameState.round,
        });
        break;

      default:
        throw new Error(`Unknown phase: ${currentPhase}`);
    }
  }
}

// ─────────────────────────────
// Utilities (local for now)
// ─────────────────────────────

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function getPlayableRoles() {
  return Object.values(ROLES).filter(
    (role) => role.countsAsPlayer && role.id != "narrator"
  );
}