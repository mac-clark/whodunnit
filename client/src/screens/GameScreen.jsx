// client/src/screens/GameScreen.jsx

import { useEffect, useRef, useState } from "react";
import { getDeviceToken } from "../lib/deviceToken";
import RoleCard from "../cards/RoleCard";
import NarrationCard from "../cards/NarrationCard";
import NightActionCard from "../cards/NightActionCard";
import VoteCard from "../cards/VoteCard";
import NarratorNightCard from "../cards/NarratorNightCard";
import DeadCard from "../cards/DeadCard";
import GameOverCard from "../cards/GameOverCard";

const REVEAL_KEY_PREFIX = "whodunnit_reveal_done_";

export default function GameScreen({
  sessionId,
  player,
  onExit,

  // ✅ dev quickstart support (passed from App.jsx)
  devPlayers,
  devNarratorId,
  devThemeId,
  onDevSwitchPlayer,
}) {
  const [view, setView] = useState(null);
  const [narrationPayload, setNarrationPayload] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Local UX stage
  const [stage, setStage] = useState("intro"); // intro | reveal
  const [countdown, setCountdown] = useState(5);

  // “Role tab” toggle (always available)
  const [roleOpen, setRoleOpen] = useState(false);

  const prevAliveRef = useRef(new Map()); // id -> alive
  const [justDied, setJustDied] = useState(null); // {id, name} | null

  // Track last narration fetch key so we only fetch when phase/round changes
  const lastNarrationKeyRef = useRef(null);

  const[advancing, setAdvancing] = useState(false);
  const[submitting, setSubmitting] = useState(false);

  const isDev = import.meta.env.VITE_DEV_TOOLS == 1;
  const devPlayerId = player?.id || player?._id;

  const [pageVisible, setPageVisible] = useState(
    typeof document === "undefined" ? true : document.visibilityState === "visible"
  );

  useEffect(() => {
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // ─────────────────────────────
  // DEV: cycle player
  // ─────────────────────────────

  function handleCyclePlayer() {
    if (!isDev) return;

    const roster = Array.isArray(devPlayers) ? devPlayers : [];
    if (roster.length === 0) return;

    const currentId = player?.id || player?._id;
    const idx = roster.findIndex((p) => (p.id || p._id) === currentId);
    const next = roster[(idx + 1) % roster.length] || roster[0];

    const nextPlayer = {
      id: next.id || next._id,
      name: next.name,
    };

    // swap impersonation (App owns `player`)
    onDevSwitchPlayer?.(nextPlayer);

    // ensure we refresh immediately w/ new header
    setTimeout(() => {
      fetchView({ silent: true });
    }, 0);
  }

  async function submitVote(targetId) {
    if (!sessionId) return;

    try {
      setSubmitting(true);
      setError("");

      const headers = { "Content-Type": "application/json" };
      if (isDev && devPlayerId) headers["x-dev-player-id"] = devPlayerId;

      const res = await fetch(`/api/sessions/${sessionId}/vote`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          deviceToken: getDeviceToken(),
          targetId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to submit vote");
      }

      fetchView({ silent: true });
    } catch (e) {
      setError(e.message || "Failed to submit vote");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNightAction(ability, targetId) {
    if (!sessionId) return;

    try {
      setSubmitting(true);
      setError("");

      const headers = { "Content-Type": "application/json" };
      if (isDev && devPlayerId) headers["x-dev-player-id"] = devPlayerId;

      const res = await fetch(`/api/sessions/${sessionId}/night/action`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          deviceToken: getDeviceToken(),
          ability,
          targetId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to submit night action");
      }

      fetchView({ silent: true });
    } catch (e) {
      setError(e.message || "Failed to submit night action");
    } finally {
      setSubmitting(false);
    }
  }

  // ─────────────────────────────
  // Fetch VIEW (poll) — /view + deviceToken
  // ─────────────────────────────

  async function fetchView({ silent = false } = {}) {
    try {
      if (!silent) setLoading(true);
      setError("");

      // If we're in dev quickstart mode, we "impersonate" whoever `player` is
      const devPlayerId = player?.id || player?._id;

      const headers = { "Content-Type": "application/json" };

      // Only add this header in dev tools mode (and only if we have an id)
      if (isDev && devPlayerId) {
        headers["x-dev-player-id"] = devPlayerId;
      }

      const res = await fetch(`/api/sessions/${sessionId}/view`, {
        method: "POST",
        headers,
        body: JSON.stringify({ deviceToken: getDeviceToken() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to load game view");
      }

      const data = await res.json();
      setView(data);
    } catch (e) {
      setError(e.message || "Failed to load game view");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // Advance the narration
  async function advancePhase() {
    if (!sessionId) return;

    if (view?.gameOver === true || view?.phase === "ended") return;

    try {
      setAdvancing(true);
      setError("");

      const headers = { "Content-Type": "application/json" };

      // dev impersonation (same as view)
      if (isDev && devPlayerId) {
        headers["x-dev-player-id"] = devPlayerId;
      }

      const res = await fetch(`/api/sessions/${sessionId}/phase/advance`, {
        method: "POST",
        headers,
        body: JSON.stringify({ deviceToken: getDeviceToken() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to advance phase");
      }

      // refresh immediately so storyStep/phase/round changes trigger narration
      fetchView({ silent: true });
    } catch (e) {
      setError(e.message || "Failed to advance phase");
    } finally {
      setAdvancing(false);
    }
  }

  useEffect(() => {
    if (!sessionId) return;
    fetchView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (!pageVisible) return;
    if (!sessionId) return;
    fetchView({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageVisible, sessionId, isDev, devPlayerId]);

  useEffect(() => {
    if (!sessionId) return;
    if (view?.gameOver === true || view?.phase === "ended") return;

    const hasView = !!view;

    const myId = view?.me?.id;

    const urgent =
      // narrator should feel snappy
      !!view?.isNarrator ||
      // vote open (and I'm not silenced)
      (view?.vote?.open === true && view?.effects?.silenced !== true) ||
      // my night action turn
      (view?.phase === "night" &&
        !!view?.nightPrompt?.ability &&
        Array.isArray(view?.nightPrompt?.actorIds) &&
        view?.nightPrompt.actorIds.includes(myId)) ||
      // dev tools: keep it snappy when you're impersonating
      isDev === true;

    let baseMs;
    if (!pageVisible) baseMs = 8000;
    else if (!hasView) baseMs = 1200;
    else if (urgent) baseMs = 1200;
    else baseMs = 3000;

    const jitter = Math.floor(Math.random() * 250);
    const pollMs = baseMs + jitter;

    const id = setInterval(() => {
      fetchView({ silent: true });
    }, pollMs);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sessionId,
    pageVisible,
    isDev,
    devPlayerId,
    view?.gameOver,
    view?.phase,
    view?.isNarrator,
    view?.vote?.open,
    view?.effects?.silenced,
    view?.nightPrompt?.ability,
    view?.nightPrompt?.actorIds,
    view?.me?.id,
  ]);

  // ─────────────────────────────
  // Fetch narration (NO POLLING)
  // Fetch when phase/round/storyStep changes
  // Allow narration during setup IF storyStep has begun (prologue/rules)
  // ─────────────────────────────

  async function fetchNarrationOnce() {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/narration`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to load narration");
      }

      const data = await res.json();
      setNarrationPayload(data);
    } catch (e) {
      setError(e.message || "Failed to load narration");
    }
  }

  useEffect(() => {
    if (!sessionId) return;
    if (!view) return;

    if (view?.gameOver === true || view?.phase === "ended") return;

    const phase = view.phase;
    const round = Number(view.round || 0);
    const storyStep = Number(view.storyStep || 0);

    // ✅ Allow narration during setup if storyStep > 0 (prologue/rules)
    const canNarrate = phase && (phase !== "setup" || storyStep > 0);
    if (!canNarrate) return;

    // ✅ Include storyStep so setup->setup changes still trigger narration fetch
    const key = view?.narrationCursor || `${phase}:${round}:${storyStep}`;

    if (lastNarrationKeyRef.current === key) return;

    lastNarrationKeyRef.current = key;
    fetchNarrationOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, view?.narrationCursor, view?.phase, view?.round, view?.storyStep]);

  // ─────────────────────────────
  // Role + narrator resolution (from VIEW)
  // ─────────────────────────────

  const isNarrator = !!view?.isNarrator;
  const me = view?.me || null;

  const effectivePlayerName = me?.name || player?.name || "Unknown";

  const storyStep = Number(view?.storyStep || 0);
  const storyActive = view?.phase !== "setup" || storyStep > 0;

  const phase = view?.phase || "setup";
  const gameOver = view?.gameOver === true || phase === "ended";
  const gameResult = view?.gameResult || null;
  const players = view?.players || [];
  const vote = view?.vote || null;
  const nightPrompt = view?.nightPrompt || null;

  const myId = me?.id;
  const amAlive = me?.alive !== false;
  const isNight = phase === "night";
  const isDay = phase === "day";
  const silenced = view?.effects?.silenced === true;

  const promptAbility = nightPrompt?.ability || null;
  const promptActorIds = Array.isArray(nightPrompt?.actorIds) ? nightPrompt.actorIds : [];
  const isMyTurnAtNight = !!promptAbility && promptActorIds.includes(myId);

  const nightQueue = view?.nightQueue || [];
  const nightIndex = view?.nightIndex ?? 0;

  const nightMeta = view?.nightQueueMeta || null;
  const nightIdx = nightMeta?.index ?? nightIndex ?? 0;
  const nightLen = nightMeta?.length ?? (Array.isArray(nightQueue) ? nightQueue.length : 0);

  const voteEliminatedId = view?.vote?.result?.eliminatedId ?? null;

  const eliminatedName =
    voteEliminatedId
      ? (players.find(p => p.id === voteEliminatedId)?.name || "No one")
      : "No one";

  // ✅ narrator is actively stepping through night queue
  const nightActionsActive =
    isNarrator &&
    isNight &&
    !!nightPrompt &&
    nightPrompt?.done === false &&
    nightLen > 0;

  // ─────────────────────────────
  // One-time intro countdown (client-only)
  // ─────────────────────────────

  useEffect(() => {
    if (!sessionId) return;

    const key = `${REVEAL_KEY_PREFIX}${sessionId}`;
    const alreadyDone = sessionStorage.getItem(key) === "1";

    if (alreadyDone) {
      setStage("reveal");
      return;
    }

    setStage("intro");
    setCountdown(5);

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          sessionStorage.setItem(key, "1");
          setStage("reveal");
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId]);

  useEffect(() => {
    const roster = Array.isArray(view?.players) ? view.players : [];
    if (!roster.length) return;

    const prev = prevAliveRef.current;

    // find anyone who flipped alive:true -> alive:false
    const newlyDead = roster.find((p) => {
      const wasAlive = prev.get(p.id);
      return wasAlive === true && p.alive === false;
    });

    if (newlyDead) {
      setJustDied({ id: newlyDead.id, name: newlyDead.name });
    } else {
      // if nobody newly died this tick, leave as-is or clear it
      // I'd clear when the phase changes away from the result moment (optional)
      // setJustDied(null);
    }

    // update prev map
    const next = new Map();
    for (const p of roster) next.set(p.id, !!p.alive);
    prevAliveRef.current = next;
  }, [view?.players]);

  // ─────────────────────────────
  // Main render
  // ─────────────────────────────

  if (!isNarrator && !amAlive) {
    return (
      <div className="screen game-screen">
        <DeadCard me={me} />
        <button className="wd-btn wd-btn--ghost" onClick={onExit} style={{ width: "100%", marginTop: 10 }}>
          Exit
        </button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="screen game-screen">
        <div className="screen-bg" aria-hidden="true" />
        <div className="home-hero">
          <div className="brand" style={{ marginBottom: 14 }}>
            <h1 className="brand-title" style={{ fontSize: 28, margin: 0 }}>
              Game Over
            </h1>
          </div>

          <GameOverCard gameResult={gameResult} fullRoster={view?.fullRoster} onExit={onExit} />
        </div>
      </div>
    );
  }

  return (
    <div className="screen game-screen">
      <div className="screen-bg" aria-hidden="true" />

      <div
        className="lobby-pill"
        style={{
          alignSelf: "center",
          marginBottom: 10,
          opacity: 0.9,
          fontSize: 12,
          letterSpacing: 0.3,
          position: "absolute",
          top: "3rem",
        }}
      >
        {`wd_${sessionId}_0.1`}
      </div>

      <div className="home-hero">
        <div className="brand" style={{ marginBottom: 14 }}>
          <h1 className="brand-title" style={{ fontSize: 28, margin: 0 }}>
            {stage === "intro"
              ? "Get Ready"
              : storyActive
                ? effectivePlayerName
                : "Your Role"}
          </h1>

          {/* only show the subtitle when we’re in “Your Role” reveal mode */}
          {!storyActive && stage !== "intro" && (
            <p className="brand-subtitle" style={{ marginTop: 8 }}>
              {effectivePlayerName}
            </p>
          )}
        </div>

        <div
          className="form-stack"
          // ✅ prevents overlap with fixed “View My Role” button
          style={{ paddingBottom: stage === "reveal" ? 50 : 0 }}
        >
          {/* ✅ DEV ONLY: Cycle player */}
          {isDev && (
            <button
              className="wd-btn wd-btn--ghost"
              onClick={handleCyclePlayer}
              style={{ opacity: 0.85 }}
            >
              Dev: Cycle Player
            </button>
          )}

          {error && (
            <div className="home-soon" role="status">
              <span className="home-soon-dot" aria-hidden="true" />
              {error}
            </div>
          )}

          {loading && !view ? (
            <div className="join-empty">Loading game…</div>
          ) : stage === "intro" ? (
            <>
              <div className="join-empty" style={{ textAlign: "left" }}>
                <strong>Don’t show anyone your screen.</strong>
                <br />
                You’ll see private instructions in a moment.
              </div>

              <div className="lobby-code" style={{ justifyContent: "space-between" }}>
                <div className="lobby-code-left">
                  <div className="lobby-code-label">Revealing role in</div>
                  <div className="lobby-code-value" style={{ fontSize: 28 }}>
                    {countdown}s
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ✅ MAIN CARD AREA (decluttered once story starts) */}
              {isNarrator ? (
                <>
                  {!storyActive && (
                    <>
                      <RoleCard view={view} me={me} isNarrator={isNarrator} />
                      <div className="home-soon" role="status">
                        <span className="home-soon-dot" aria-hidden="true" />
                        You are the Narrator. Give everyone time to read their role, then
                        advance the game.
                      </div>
                    </>
                  )}

                  {/* ✅ Night-specific narrator instructions driven by queue */}
                  {isNight && (
                    <NarratorNightCard
                      me={me}
                      players={players}
                      nightQueue={nightQueue}
                      nightIndex={nightIndex}
                      nightPrompt={nightPrompt}
                      fullRoster={view?.fullRoster}
                      onNext={advancePhase}
                      nextDisabled={advancing || gameOver}
                      showNext={stage === "reveal" && isNarrator && nightActionsActive}
                    />
                  )}

                  <NarrationCard
                    narrationPayload={narrationPayload}
                    showNext={stage === "reveal" && isNarrator && !nightActionsActive && !gameOver}
                    onNext={advancePhase}
                    nextDisabled={advancing || gameOver}
                    tokens={{
                      victimName: justDied?.name || "No one",
                      eliminatedName,
                    }}
                  />
                </>
              ) : storyActive ? (
                  <>
                    {/* Non-narrator loop UI */}
                    {isNight ? (
                      <>
                        {amAlive && isMyTurnAtNight ? (
                          <NightActionCard
                            me={me}
                            players={players}
                            nightPrompt={nightPrompt}
                            effects={view?.effects}
                            onSubmit={submitNightAction}
                            submitting={submitting}
                          />
                        ) : (
                          <div className="player-list">
                            <div className="join-empty" style={{ textAlign: "left" }}>
                              It’s night. Keep your screen hidden and wait…
                            </div>
                          </div>
                        )}
                      </>
                    ) : isDay ? (
                      <>
                        {amAlive && vote?.open ? (
                          silenced ? (
                            <div className="player-list">
                              <div className="join-empty" style={{ textAlign: "left" }}>
                                <strong>You are silenced today.</strong>
                                <br />
                                You cannot speak or vote. Wait for the narrator…
                              </div>
                            </div>
                          ) : (
                            <VoteCard
                              me={me}
                              players={players}
                              vote={vote}
                              onSubmit={submitVote}
                              submitting={submitting}
                            />
                          )
                        ) : (
                          <div className="player-list">
                            <div className="join-empty" style={{ textAlign: "left" }}>
                              Listen to the narrator…
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="player-list">
                        <div className="join-empty" style={{ textAlign: "left" }}>
                          Listen to the narrator…
                        </div>
                      </div>
                    )}
                  </>
              ) : (
                <>
                  {/* Before story starts, show full role reveal */}
                  <RoleCard view={view} me={me} isNarrator={isNarrator} />

                  <div className="join-empty">Waiting for the narrator to continue…</div>
                </>
              )}
            </>
          )}

          {/* 🔒 Exit should later become host-only.
              Leaving as-is per your current wiring. */}
          {!!onExit && (
            <button className="wd-btn wd-btn--ghost" onClick={onExit}>
              Exit
            </button>
          )}
        </div>
      </div>

      {/* Always-available role tab */}
      {stage === "reveal" && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 14,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          <div style={{ width: "min(520px, 92vw)", pointerEvents: "auto" }}>
            {!roleOpen ? (
              <button
                className="wd-btn wd-btn--primary"
                onClick={() => setRoleOpen(true)}
                style={{ width: "100%" }}
              >
                View My Role
              </button>
            ) : (
              <div
                className="form-stack"
                style={{
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14,
                  padding: 12,
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="join-header-row">
                  <div className="join-header-title">My Role</div>
                  <button
                    type="button"
                    className="wd-iconbtn"
                    onClick={() => setRoleOpen(false)}
                    aria-label="Close role panel"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>

                <RoleCard view={view} me={me} isNarrator={isNarrator} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}