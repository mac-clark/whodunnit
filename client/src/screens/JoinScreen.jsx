import { useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";

const THEME_LABELS = {
  snowed_in: "Snowed In",
};

export default function JoinScreen({ onJoined, onBack }) {
  const [name, setName] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [error, setError] = useState("");

  async function fetchSessions({ silent = false } = {}) {
    try {
      if (!silent) setLoadingList(true);
      setError("");

      const res = await fetch("/api/sessions");
      if (!res.ok) throw new Error("Failed to load sessions");

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.sessions || [];
      setSessions(list);
    } catch (e) {
      setError(e.message || "Failed to load sessions");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  const sortedSessions = useMemo(() => {
    return [...sessions].reverse();
  }, [sessions]);

  function getSessionId(s) {
    return s.id || s.sessionId || s._id;
  }

  // Prefer themeId now that you've fixed nomenclature
  function getThemeId(s) {
    return s.themeId || "snowed_in";
  }

  function getThemeLabel(s) {
    const themeId = getThemeId(s);
    return THEME_LABELS[themeId] || themeId;
  }

  function getHostName(s) {
    if (s.host?.name) return s.host.name;
    if (s.hostName) return s.hostName;

    if (Array.isArray(s.players) && s.players.length > 0) {
      const host = s.players.find((p) => p.isHost) || s.players[0];
      return host?.name || "Unknown";
    }

    return "Unknown";
  }

  async function handleJoin(session) {
    setError("");
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Pick a name first.");
      return;
    }

    const sessionId = getSessionId(session);
    if (!sessionId) {
      setError("That session is missing an id.");
      return;
    }

    setJoiningId(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to join session");
      }

      const data = await res.json();
      // backend returns { player, session }
      onJoined(data.player, sessionId);
    } catch (e) {
      setError(e.message || "Failed to join session");
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <div className="screen join-screen">
      <div className="screen-bg" aria-hidden="true" />

      <div className="home-hero">
        <div className="brand" style={{ marginBottom: 14 }}>
          <h1 className="brand-title" style={{ fontSize: 28, margin: 0 }}>
            Join a Game
          </h1>
          <p className="brand-subtitle" style={{ marginTop: 8 }}>
            Pick a name, then join an active lobby.
          </p>
        </div>

        <div className="form-stack">
          <label className="wd-label">
            Your name
            <input
              className="wd-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Big Zaddy, Chungus, Char-t"
              autoCapitalize="words"
              autoCorrect="off"
              maxLength={24}
            />
          </label>

          <div className="join-header-row">
            <div className="join-header-title">Active lobbies</div>

            <button
              type="button"
              className="wd-iconbtn"
              onClick={() => fetchSessions()}
              disabled={loadingList}
              aria-label="Refresh lobbies"
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

          {loadingList ? (
            <div className="join-empty">Loading lobbies…</div>
          ) : sortedSessions.length === 0 ? (
            <div className="join-empty">
              No active games yet. Ask someone to host one.
            </div>
          ) : (
            <div className="join-list">
              {sortedSessions.map((s) => {
                const id = getSessionId(s);
                const hostName = getHostName(s);
                const themeLabel = getThemeLabel(s);

                return (
                  <button
                    key={id}
                    type="button"
                    className="lobby-card lobby-card--cta"
                    onClick={() => handleJoin(s)}
                    disabled={joiningId === id}
                  >
                    <div className="lobby-row">
                      <div className="lobby-line">
                        Mafia hosted by <span className="lobby-host">{hostName}</span>
                      </div>

                      <div className="lobby-pill">{themeLabel}</div>
                    </div>

                    <div className="lobby-sub">
                      {joiningId === id ? "Joining…" : "Tap to join"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <button className="wd-btn wd-btn--ghost" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
