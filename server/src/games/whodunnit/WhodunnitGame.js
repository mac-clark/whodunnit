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
      nightPrompt: null,        // { ability, actorIds, round, doneActorIds? }
      nightActions: {},         // populated by controller
      vote: { open: false, votes: {}, resolved: false, result: null },
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

  evaluateEndConditions(gs) {
    const alive = Object.values(gs.players || {}).filter(
      (p) => p.alive && p.id !== gs.narratorId
    );

    const mafiaAlive = alive.filter((p) => p.role?.alignment === "mafia");
    const nonMafiaAlive = alive.filter((p) => p.role?.alignment !== "mafia"); // town + neutrals for now

    // Mafia win: mafia >= non-mafia (and at least 1 mafia exists)
    if (mafiaAlive.length > 0 && mafiaAlive.length >= nonMafiaAlive.length) {
      return {
        winner: "mafia",
        reason: "mafia_majority",
        counts: { mafia: mafiaAlive.length, nonMafia: nonMafiaAlive.length },
      };
    }

    // Town win: no mafia remaining
    if (mafiaAlive.length === 0) {
      return {
        winner: "town",
        reason: "mafia_eliminated",
        counts: { mafia: 0, nonMafia: nonMafiaAlive.length },
      };
    }

    return null;
  }

  endGame(session, result) {
    const { gameState: gs } = session;

    // Lock state
    gs.phase = "ended";
    gs.gameOver = true;

    gs.gameResult = {
      winner: result.winner,
      reason: result.reason,
      counts: result.counts || null,
      endedAtRound: gs.round,
    };

    // Close interactive state
    if (gs.vote) {
      gs.vote.open = false;
      gs.vote.resolved = true; // safe default
    }

    gs.nightPrompt = null;
    gs.nightQueue = null;
    gs.nightIndex = 0;

    // Session lifecycle (optional but usually helpful)
    session.state = "ended";

    // Emit events for narration/logging later
    this.emit(session, WHODUNNIT_EVENTS.OBJECTIVES_EVALUATED, gs.gameResult);
    this.emit(session, WHODUNNIT_EVENTS.GAME_ENDED, gs.gameResult);
  }

  resolveDayVote(session) {
    const gs = session.gameState;

    // ensure vote shape
    if (!gs.vote || typeof gs.vote !== "object") {
      gs.vote = { open: false, votes: {}, resolved: false, result: null };
    }
    if (!gs.vote.votes || typeof gs.vote.votes !== "object") gs.vote.votes = {};

    // Eligible voters: alive, non-narrator, AND not silenced
    const silenced = gs.silencedPlayers instanceof Set ? gs.silencedPlayers : new Set();

    const eligible = Object.values(gs.players || {}).filter((p) => {
      if (!p?.alive) return false;
      if (p.id === gs.narratorId) return false;
      if (silenced.has(p.id)) return false;
      return true;
    });

    // Only resolve if voting is open
    if (gs.vote.open !== true) {
      throw new Error("Voting is not open");
    }

    // Require all eligible voters to have submitted (including abstain/null)
    const complete = eligible.every((p) =>
      Object.prototype.hasOwnProperty.call(gs.vote.votes, p.id)
    );

    if (!complete) {
      throw new Error("Waiting for votes");
    }

    // tally with weights
    const tally = {}; // { targetId: weightSum }
    let abstainWeight = 0;

    for (const voter of eligible) {
      const choice = gs.vote.votes[voter.id]; // targetId or null
      const weight =
        Number(voter.voteWeight) ||
        (voter.role?.id === "mayor" ? 2 : 1);

      if (!choice) {
        abstainWeight += weight;
        continue;
      }

      // ignore invalid choices defensively
      const target = gs.players?.[choice];
      if (!target || !target.alive || choice === gs.narratorId) {
        abstainWeight += weight;
        continue;
      }

      tally[choice] = (tally[choice] || 0) + weight;
    }

    // Determine winner
    const entries = Object.entries(tally); // [[targetId, weight]]
    entries.sort((a, b) => b[1] - a[1]);

    let eliminatedId = null;

    if (entries.length === 0) {
      eliminatedId = null; // everyone abstained / invalid
    } else {
      const [topId, topVotes] = entries[0];
      const secondVotes = entries[1]?.[1] ?? null;

      // tie check
      const isTie = secondVotes !== null && secondVotes === topVotes;

      // optional: if abstainWeight >= topVotes, treat as "no elimination"
      const abstainBeats = abstainWeight >= topVotes;

      if (!isTie && !abstainBeats) {
        eliminatedId = topId;
      }
    }

    // mark resolved + close
    gs.vote.open = false;
    gs.vote.resolved = true;
    gs.vote.result = {
      eliminatedId,
      tally,
      abstainWeight,
    };

    this.emit(session, WHODUNNIT_EVENTS.VOTE_RESOLVED, {
      round: gs.round,
      eliminatedId,
    });

    // apply elimination if any
    if (eliminatedId && gs.players?.[eliminatedId]?.alive) {
      gs.players[eliminatedId].alive = false;

      this.emit(session, WHODUNNIT_EVENTS.PLAYER_ELIMINATED, {
        round: gs.round,
        phase: "day",
        playerId: eliminatedId,
        cause: "vote",
      });
    }

    return eliminatedId;
  }

  advancePhase(session, actorId) {
    const { gameState: gs } = session;

    // ✅ hard stop: game ended
    if (gs?.gameOver === true || gs?.phase === "ended") {
      return; // no-op; prevents "Unknown phase: ended"
    }

    if (actorId !== gs.narratorId) {
      throw new Error("Only the narrator can advance the phase");
    }

    if (typeof gs.storyStep !== "number") gs.storyStep = 0;

    // ─────────────────────────────
    // Story beats before gameplay
    // ─────────────────────────────
    if (gs.phase === "setup" && gs.storyStep < 2) {
      gs.storyStep += 1;

      this.emit(session, WHODUNNIT_EVENTS.INFORMATION_REVEALED, {
        kind: "narration.beat",
        storyStep: gs.storyStep,
      });
      return;
    }

    if (gs.phase === "setup" && gs.storyStep >= 2) {
      gs.phase = "night";
      gs.round = 1;
      gs.storyStep = 3;

      // reset loop-y state
      gs.dayStep = null;
      gs.vote = { open: false, votes: {}, resolved: false, result: null };

      this.emit(session, WHODUNNIT_EVENTS.ROUND_STARTED, { round: gs.round });
      this.emit(session, WHODUNNIT_EVENTS.NIGHT_STARTED, { round: gs.round });
      return;
    }

    if (gs.phase === "night" && gs.round === 1 && gs.storyStep === 3) {
      this.emit(session, WHODUNNIT_EVENTS.NIGHT_ENDED, { round: gs.round });

      gs.phase = "day";
      gs.storyStep = 4;

      gs.vote = { open: false, votes: {}, resolved: false, result: null };
      gs.dayStep = "night_result"; // ✅ gate day so we don't skip it

      this.emit(session, WHODUNNIT_EVENTS.DAY_STARTED, { round: gs.round });
      return;
    }

    if (gs.phase === "day" && gs.round === 1 && gs.storyStep === 4) {
      gs.phase = "night";
      gs.round = 2;
      gs.storyStep = 0;

      // reset day state
      gs.dayStep = null;
      gs.vote = { open: false, votes: {}, resolved: false, result: null };

      gs.nightQueue = buildNightQueue(gs);
      gs.nightIndex = 0;
      gs.nightPrompt = null;
      gs.nightActions = {};

      this.emit(session, WHODUNNIT_EVENTS.ROUND_STARTED, { round: gs.round });
      this.emit(session, WHODUNNIT_EVENTS.NIGHT_STARTED, { round: gs.round });
      return;
    }

    // ─────────────────────────────
    // Main loop
    // ─────────────────────────────
    switch (gs.phase) {
      case "day": {
        // ✅ Day is now gated so we don't jump straight back to night

        // ensure vote shape
        if (!gs.vote || typeof gs.vote !== "object") {
          gs.vote = { open: false, votes: {}, resolved: false, result: null };
        }
        if (!gs.vote.votes || typeof gs.vote.votes !== "object") {
          gs.vote.votes = {};
        }

        // default if missing
        if (!gs.dayStep) gs.dayStep = "day_prompt";

        // 1) After night ends, we show night_result narration while phase=day
        if (gs.dayStep === "night_result") {
          gs.dayStep = "day_prompt";
          this.emit(session, WHODUNNIT_EVENTS.INFORMATION_REVEALED, {
            kind: "day.prompt",
            round: gs.round,
          });
          return;
        }

        // 2) After day_prompt narration, next click opens voting
        if (gs.dayStep === "day_prompt") {
          gs.vote.open = true;
          gs.vote.resolved = false;
          gs.vote.result = null;

          this.emit(session, WHODUNNIT_EVENTS.VOTE_STARTED, { round: gs.round });

          gs.dayStep = "voting";
          return;
        }

        // 3) While voting is open, narrator cannot advance until resolved
        if (gs.dayStep === "voting") {
          if (gs.vote?.resolved !== true) {
            // ✅ resolve now (will throw if not complete)
            const eliminatedId = this.resolveDayVote(session);

            // ✅ after vote elimination, check win conditions
            const endResult = this.evaluateEndConditions(gs);
            if (endResult) {
              this.endGame(session, endResult);
              return;
            }
          }

          gs.dayStep = "day_result";
          return;
        }

        // 4) Day result narration moment has occurred; next click starts next night
        if (gs.dayStep === "day_result") {
          gs.round += 1;
          gs.phase = "night";

          // reset day state
          gs.dayStep = null;
          gs.vote = { open: false, votes: {}, resolved: false, result: null };

          // prep night
          gs.nightQueue = buildNightQueue(gs);
          gs.nightIndex = 0;
          gs.nightPrompt = null;
          gs.nightActions = {};

          this.emit(session, WHODUNNIT_EVENTS.ROUND_STARTED, { round: gs.round });
          this.emit(session, WHODUNNIT_EVENTS.NIGHT_STARTED, { round: gs.round });
          return;
        }

        throw new Error(`Unknown dayStep: ${gs.dayStep}`);
      }

      case "night": {
        if (!Array.isArray(gs.nightQueue)) gs.nightQueue = buildNightQueue(gs);
        if (typeof gs.nightIndex !== "number") gs.nightIndex = 0;
        if (!gs.nightActions) gs.nightActions = {};

        // ── END NIGHT: RESOLVE ALL ABILITIES ──
        if (gs.nightIndex >= gs.nightQueue.length) {
          // ✅ separate mafia shared kill vs independent kill
          const mafiaKills = gs.nightActions.mafia_kill || {}; // ONE decider submits
          const kills = gs.nightActions.kill || {};            // independents (serial killer etc)

          const protects = new Set(Object.values(gs.nightActions.protect || {}));
          const blocks = new Set(Object.values(gs.nightActions.block || {}));
          const silences = new Set(Object.values(gs.nightActions.silence || {}));
          const investigations = gs.nightActions.investigate_alignment || {};
          const vigilanteKills = gs.nightActions.single_kill || {};

          // Store meta effects for next day
          gs.silencedPlayers = silences;
          gs.investigations = gs.investigations || {};

          // Investigations (private info only)
          for (const [actorId, targetId] of Object.entries(investigations)) {
            if (blocks.has(actorId)) continue;
            const target = gs.players[targetId];
            if (!target) continue;

            gs.investigations[actorId] = {
              targetId,
              alignment: target.role.alignment,
              round: gs.round,
            };
          }

          let eliminatedId = null;

          // ✅ Mafia shared kill (single target)
          const mafiaKillTarget = Object.values(mafiaKills)[0] || null;
          if (
            mafiaKillTarget &&
            !protects.has(mafiaKillTarget) &&
            gs.players[mafiaKillTarget]?.alive
          ) {
            gs.players[mafiaKillTarget].alive = false;
            eliminatedId = mafiaKillTarget;

            this.emit(session, WHODUNNIT_EVENTS.PLAYER_ELIMINATED, {
              round: gs.round,
              phase: "night",
              playerId: mafiaKillTarget,
              cause: "mafia_kill",
            });
          }

          // ✅ Independent kills (serial killer etc)
          for (const [actorId, targetId] of Object.entries(kills)) {
            if (blocks.has(actorId)) continue;
            if (!targetId) continue;
            if (protects.has(targetId)) continue;

            const target = gs.players[targetId];
            if (target && target.alive) {
              target.alive = false;
              eliminatedId = targetId;

              this.emit(session, WHODUNNIT_EVENTS.PLAYER_ELIMINATED, {
                round: gs.round,
                phase: "night",
                playerId: targetId,
                cause: "kill",
              });
            }
          }

          // Vigilante kills
          for (const [actorId, targetId] of Object.entries(vigilanteKills)) {
            if (blocks.has(actorId)) continue;
            if (!targetId) continue;
            if (protects.has(targetId)) continue;

            const target = gs.players[targetId];
            if (target && target.alive) {
              target.alive = false;
              eliminatedId = targetId;

              this.emit(session, WHODUNNIT_EVENTS.PLAYER_ELIMINATED, {
                round: gs.round,
                phase: "night",
                playerId: targetId,
                cause: "single_kill",
              });
            }
          }

          const endResult = this.evaluateEndConditions(gs);
          if (endResult) {
            this.endGame(session, endResult);
            return;
          }

          this.emit(session, WHODUNNIT_EVENTS.NIGHT_ENDED, {
            round: gs.round,
            eliminatedId,
          });

          // Transition to day
          gs.phase = "day";
          gs.dayStep = "night_result"; // ✅ THIS is the important bit

          gs.nightPrompt = null;
          gs.nightQueue = null;
          gs.nightIndex = 0;
          gs.nightActions = {};

          gs.vote = { open: false, votes: {}, resolved: false, result: null };

          this.emit(session, WHODUNNIT_EVENTS.DAY_STARTED, { round: gs.round });
          return;
        }

        // ── CREATE NEXT NIGHT PROMPT ──
        if (!gs.nightPrompt) {
          const step = gs.nightQueue[gs.nightIndex];

          gs.nightPrompt = {
            ability: step.ability,
            actorIds: step.actorIds,
            round: gs.round,
            done: false,
            doneActorIds: [],
          };

          this.emit(session, WHODUNNIT_EVENTS.ROLE_ACTION_REQUESTED, {
            round: gs.round,
            ability: step.ability,
            actorIds: step.actorIds,
          });
          return;
        }

        if (gs.nightPrompt.done !== true) {
          throw new Error("Waiting for night action submission");
        }

        const { ability, actorIds } = gs.nightPrompt;
        const submittedMap = gs.nightActions?.[ability] || {};

        this.emit(session, WHODUNNIT_EVENTS.ROLE_ACTION_RESOLVED, {
          round: gs.round,
          ability,
          submissions: actorIds.map((id) => ({
            actorId: id,
            targetId: submittedMap[id] || null,
          })),
        });

        gs.nightPrompt = null;
        gs.nightIndex += 1;
        return;
      }

      default:
        throw new Error(`Unknown phase: ${gs.phase}`);
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

function getAlivePlayers(gs) {
  return Object.values(gs.players || {}).filter(
    (p) => p.alive && p.id !== gs.narratorId
  );
}

function rotatePick(ids, round) {
  const list = [...ids].sort(); // stable
  if (list.length === 0) return null;
  const r = Number(round || 0);
  return list[r % list.length];
}

function buildNightQueue(gs) {
  const alive = getAlivePlayers(gs);
  const round = Number(gs?.round || 0);

  const byAbility = {};

  // Special handling buckets
  const mafiaKillers = [];
  const otherKillers = []; // serial killer etc (role ability "kill" but not mafia)

  for (const p of alive) {
    const abilities = p?.role?.abilities || [];
    const alignment = p?.role?.alignment || null;

    for (const ab of abilities) {
      // Split "kill" into mafia_kill vs independent kill
      if (ab === "kill") {
        if (alignment === "mafia") mafiaKillers.push(p.id);
        else otherKillers.push(p.id);
        continue;
      }

      if (!byAbility[ab]) byAbility[ab] = [];
      byAbility[ab].push(p.id);
    }
  }

  // MVP ordering: mafia -> defense -> control -> info -> other killers
  // (You can tweak later, but this is sane.)
  const order = [
    "mafia_kill",            // derived from mafia killers
    "protect",
    "block",
    "silence",
    "investigate_alignment",
    "kill",                  // independent kill (serial killer etc)
    "single_kill",            // vigilante, etc
  ];

  const queue = [];

  for (const ab of order) {
    if (ab === "mafia_kill") {
      // Mafia shared kill — ONE decider only
      if (mafiaKillers.length) {
        const deciderId = rotatePick(mafiaKillers, round);
        if (deciderId) {
          queue.push({
            ability: "mafia_kill",
            actorIds: [deciderId],
            group: "mafia", // optional
          });
        }
      }
      continue;
    }

    if (ab === "kill") {
      // Independent killers (serial killer etc) — each acts alone
      for (const id of otherKillers) {
        queue.push({
          ability: "kill",
          actorIds: [id],
          group: "independent", // optional
        });
      }
      continue;
    }

    const actors = byAbility[ab];
    if (actors && actors.length) {
      queue.push({ ability: ab, actorIds: actors });
    }
  }

  return queue;
}