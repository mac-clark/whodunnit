import { useEffect, useMemo, useState } from "react";
import { Copy, Play, RefreshCcw, CircleUser, Radio } from "lucide-react";

export default function GameScreen({ sessionId, player }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const playerId = player?.id || player?._id;

  function isHost() {
    const hostId = session?.hostPlayerId;
    if (!hostId || !playerId) return false;
    return playerId === hostId;
  }

  async function fetchSession({ silent = false } = {}) {
    try {
      if (!silent) setLoading(true);
      setError("");

      // NOTE: we don't have GET /sessions/:id yet, so we fetch list + filter.
      const res = await fetch(`/api/sessions`);
      if (!res.ok) throw new Error("Failed to load session");

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.sessions || [];
      const found = list.find(
        (s) => (s.id || s.sessionId || s._id) === sessionId
      );

      if (!found) throw new Error("Session not found (maybe it ended?)");
      setSession(found);
    } catch (e) {
      setError(e.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const players = useMemo(() => {
    const list = session?.players || [];
    const hostId = session?.hostPlayerId;

    return list.map((p) => {
      const id = p.id || p._id;
      return {
        id,
        name: p.name || "Unknown",
        isHost: id === hostId,
      };
    });
  }, [session]);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(sessionId);
    } catch {
      // ignore
    }
  }

  async function handleStart() {
    setError("");
    if (!playerId) {
      setError("Missing player id.");
      return;
    }

    setStarting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to start game");
      }

      await fetchSession({ silent: true });
    } catch (e) {
      setError(e.message || "Failed to start game");
    } finally {
      setStarting(false);
    }
  }

  const host = isHost();

  return (
    <div className="screen game-screen">
      <div className="screen-bg" aria-hidden="true" />

      <div className="home-hero">
        <div className="brand" style={{ marginBottom: 14 }}>
          <h1 className="brand-title" style={{ fontSize: 28, margin: 0 }}>
            Lobby
          </h1>
          <p className="brand-subtitle" style={{ marginTop: 8 }}>
            Waiting for players. Share the code below.
          </p>
        </div>

        <div className="form-stack">
          <div className="lobby-code">
            <div className="lobby-code-left">
              <div className="lobby-code-label">Game code</div>
              <div className="lobby-code-value">{sessionId}</div>
            </div>

            <button
              type="button"
              className="wd-iconbtn"
              onClick={handleCopyCode}
              aria-label="Copy game code"
              title="Copy"
            >
              <Copy size={18} strokeWidth={2} />
            </button>
          </div>

          <div className="join-header-row">
            <div className="join-header-title">
              Players ({players.length})
            </div>

            <button
              type="button"
              className="wd-iconbtn"
              onClick={() => fetchSession()}
              disabled={loading}
              aria-label="Refresh lobby"
              title="Refresh"
            >
              <RefreshCcw size={18} strokeWidth={2} />
            </button>
          </div>

          {error && (
            <div className="home-soon" role="status">
              <span className="home-soon-dot" aria-hidden="true" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="join-empty">Loading lobby…</div>
          ) : (
            <div className="player-list">
              {players.length === 0 ? (
                <div className="join-empty">No players yet.</div>
              ) : (
                players.map((p) => (
                  <div key={p.id} className="player-row">
                    <div className="player-left">
                      <span className="player-icon" aria-hidden="true">
                        {p.isHost ? (
                          <Radio size={18} strokeWidth={2} />
                        ) : (
                          <CircleUser size={18} strokeWidth={2} />
                        )}
                      </span>

                      <div className="player-name">{p.name}</div>
                    </div>

                    {p.isHost && <div className="lobby-pill">Host</div>}
                  </div>
                ))
              )}
            </div>
          )}

          {host ? (
            <button
              className="wd-btn wd-btn--primary"
              onClick={handleStart}
              disabled={starting}
            >
              <span className="wd-btn-icon" aria-hidden="true">
                <Play size={18} strokeWidth={2} />
              </span>
              {starting ? "Starting…" : "Start Game"}
            </button>
          ) : (
            <div className="join-empty">Waiting for the host to start…</div>
          )}
        </div>
      </div>
    </div>
  );
}