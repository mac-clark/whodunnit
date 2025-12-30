import { useMemo, useState } from "react";
import { getDeviceToken } from "../lib/deviceToken"; // NEW

const THEMES = [
  {
    id: "snowed_in",
    name: "Snowed In",
    blurb: "A cozy lodge. A storm outside. Someone’s lying.",
    badge: "Classic",
  },
  // future: add more here
];

export default function HostScreen({ onSessionCreated, onBack }) {
  const [name, setName] = useState("");
  const [themeId, setThemeId] = useState("snowed_in");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedTheme = useMemo(
    () => THEMES.find((t) => t.id === themeId),
    [themeId]
  );

  async function handleCreate() {
    setError("");
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Pick a name first.");
      return;
    }

    setLoading(true);
    try {
      // 1) create session
      const resSession = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType: "whodunnit", themeId: themeId }),
      });

      if (!resSession.ok) {
        const data = await resSession.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to create session");
      }

      const session = await resSession.json();
      const sessionId = session.id || session.sessionId || session._id;

      if (!sessionId) {
        throw new Error("Session created but no sessionId returned.");
      }

      // 2) join as host player
      const resJoin = await fetch(`/api/sessions/${sessionId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          deviceToken: getDeviceToken(), // NEW
        }),
      });

      if (!resJoin.ok) {
        const data = await resJoin.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to join session as host");
      }

      const data = await resJoin.json();

      // 3) proceed into lobby/game screen
      onSessionCreated(sessionId, data.player);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen host-screen">
      <div className="screen-bg" aria-hidden="true" />
      <div className="home-hero">
        <div className="brand" style={{ marginBottom: 14 }}>
          <h1 className="brand-title" style={{ fontSize: 28, margin: 0 }}>
            Host a Game
          </h1>
          <p className="brand-subtitle" style={{ marginTop: 8 }}>
            Pick your name and a theme. Then share the code.
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

          <div className="theme-pick">
            <div className="theme-pick-title">Theme</div>
            <div className="theme-grid">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-card ${themeId === t.id ? "is-active" : ""}`}
                  onClick={() => setThemeId(t.id)}
                >
                  <div className="theme-card-top">
                    <div className="theme-name">{t.name}</div>
                    <div className="theme-badge">{t.badge}</div>
                  </div>
                  <div className="theme-blurb">{t.blurb}</div>
                </button>
              ))}
            </div>

            {selectedTheme?.id !== "snowed_in" && (
              <div className="home-soon" role="status" style={{ marginTop: 10 }}>
                <span className="home-soon-dot" aria-hidden="true" />
                That theme is coming soon
              </div>
            )}
          </div>

          {error && (
            <div className="home-soon" role="status">
              <span className="home-soon-dot" aria-hidden="true" />
              {error}
            </div>
          )}

          <button
            className="wd-btn wd-btn--primary"
            onClick={handleCreate}
            disabled={loading}
            style={{ opacity: loading ? 0.8 : 1 }}
          >
            {loading ? "Creating..." : "Host Game"}
          </button>

          <button className="wd-btn wd-btn--ghost" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}