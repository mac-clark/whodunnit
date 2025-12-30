// client/src/screens/GameScreen.jsx

import { useEffect, useRef, useState } from "react";
import { getDeviceToken } from "../lib/deviceToken";

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

  // Track last narration fetch key so we only fetch when phase/round changes
  const lastNarrationKeyRef = useRef(null);

  const isDev = import.meta.env.VITE_DEV_TOOLS == 1;
  const devPlayerId = player?.id || player?._id;

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

  useEffect(() => {
    if (!sessionId) return;
    fetchView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      fetchView({ silent: true });
    }, 1200);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isDev, devPlayerId]);

  // ─────────────────────────────
  // Fetch narration (NO POLLING)
  // Only fetch when narrator advances phase/round (i.e., view changes)
  // AND never during setup
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
      // Don't brick the screen; just surface message
      setError(e.message || "Failed to load narration");
    }
  }

  useEffect(() => {
    if (!sessionId) return;
    if (!view) return;

    const phase = view.phase;
    const round = view.round;

    // ✅ NO narration requests until narrator advances
    // Treat "setup" as strict no-narration phase.
    if (!phase || phase === "setup") return;

    const key = `${phase}:${round || 0}`;

    // Only fetch when phase/round changes
    if (lastNarrationKeyRef.current === key) return;

    lastNarrationKeyRef.current = key;
    fetchNarrationOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, view?.phase, view?.round]);

  // ─────────────────────────────
  // Role + narrator resolution (from VIEW)
  // ─────────────────────────────

  const isNarrator = !!view?.isNarrator;
  const me = view?.me || null;

  const effectivePlayerName = me?.name || player?.name || "Unknown";

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

  // ─────────────────────────────
  // Render helpers
  // ─────────────────────────────

  function RoleCard() {
    if (!view) {
      return <div className="join-empty">Loading your role…</div>;
    }

    if (!me) {
      return (
        <div className="join-empty">
          Couldn’t find your player in the game view.
        </div>
      );
    }

    const roleObj = me.role?.id ? me.role : { id: "narrator" };

    const roleName =
      (roleObj?.id || "")
        .toString()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (m) => m.toUpperCase()) || "Unknown Role";

    const alignment = me.role?.alignment || (isNarrator ? "narrator" : null);

    // ✅ Theme-driven character (human-readable)
    const character = me.character || null;

    // Narrator doesn’t use roleMap characters (by design)
    const showCharacter = !isNarrator && character;

    return (
      <div className="player-list">
        <div className="player-row" style={{ alignItems: "flex-start" }}>
          <div
            className="player-left"
            style={{ gap: 10, alignItems: "flex-start" }}
          >
            <div className="player-name" style={{ fontSize: 18 }}>
              {roleName}
            </div>
          </div>

          {alignment && <div className="lobby-pill">{alignment}</div>}
        </div>

        {isNarrator ? (
          <div className="join-empty" style={{ textAlign: "left" }}>
            You’re the Narrator. You’ll guide the group, advance phases, and read
            the prompts.
          </div>
        ) : showCharacter ? (
          <>
            <div className="join-empty" style={{ textAlign: "left" }}>
              <strong>{character.name}</strong>
            </div>

            {character.description && (
              <div className="join-empty" style={{ textAlign: "left" }}>
                {character.description}
              </div>
            )}

            {character.objective && (
              <div className="join-empty" style={{ textAlign: "left" }}>
                <strong>Your objective:</strong> {character.objective}
              </div>
            )}
          </>
        ) : (
          <div className="home-soon" role="status">
            <span className="home-soon-dot" aria-hidden="true" />
            Character info missing for your role. (Theme roleMap may not have
            mapped correctly.)
          </div>
        )}
      </div>
    );
  }

  function NarrationCard() {
    // If we haven't fetched yet (because still in setup), keep it quiet
    if (!narrationPayload?.narration?.lines?.length) {
      return null;
    }

    const lines = narrationPayload.narration.lines;

    return (
      <div className="player-list">
        {lines.map((line, idx) => (
          <div
            key={`${narrationPayload?.narration?.id || "n"}_${idx}`}
            className="join-empty"
            style={{ textAlign: "left" }}
          >
            {line}
          </div>
        ))}
      </div>
    );
  }

  // ─────────────────────────────
  // Main render
  // ─────────────────────────────

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
            {stage === "intro" ? "Get Ready" : "Your Role"}
          </h1>
          <p className="brand-subtitle" style={{ marginTop: 8 }}>
            {effectivePlayerName}
          </p>
        </div>

        <div className="form-stack">
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

              <div
                className="lobby-code"
                style={{ justifyContent: "space-between" }}
              >
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
              <RoleCard />

              {isNarrator ? (
                <div className="home-soon" role="status">
                  <span className="home-soon-dot" aria-hidden="true" />
                  You are the Narrator. Give everyone time to read their role,
                  then advance the game.
                </div>
              ) : (
                <div className="join-empty">
                  Waiting for the narrator to continue…
                </div>
              )}

              <NarrationCard />
            </>
          )}

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

                <RoleCard />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
