import { useState } from "react";
import { HatGlasses } from "lucide-react";
import { getDeviceToken } from "../lib/deviceToken";

export default function HomeScreen({ onHost, onJoin, onDevStart }) {
  const [showMafiaOptions, setShowMafiaOptions] = useState(false);
  const [showOtherSoon, setShowOtherSoon] = useState(false);

  const isDev = import.meta.env.VITE_DEV_TOOLS == 1;

  
  async function handleDevQuickstart() {
    try {
      const res = await fetch("/api/dev/quickstart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceToken: getDeviceToken(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Dev quickstart failed");
      }

      const data = await res.json();
      onDevStart?.(data); // pass raw payload upward
    } catch (err) {
      console.error("Dev quickstart error:", err);
      alert(err.message);
    }
  }

  return (
    <div className="screen home-screen">
      <div className="screen-bg" aria-hidden="true" />
      <div className="home-hero">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <HatGlasses size={34} strokeWidth={1.8} />
          </div>

          <h1 className="brand-title">WHODUNNIT</h1>
          <p className="brand-subtitle">
            A LAN party of lies, luck, and accusations.
          </p>
        </div>

        <div className="home-actions">
          <button
            className="wd-btn wd-btn--primary"
            onClick={() => {
              setShowMafiaOptions((v) => !v);
              setShowOtherSoon(false);
            }}
          >
            Play Mafia
          </button>

          {showMafiaOptions && (
            <div className="home-panel" role="region" aria-label="Mafia options">
              <button className="wd-btn wd-btn--panel" onClick={onHost}>
                Host a Game
              </button>
              <button className="wd-btn wd-btn--panel" onClick={onJoin}>
                Join a Game
              </button>

              {/* DEV ONLY: Quickstart */}
              {isDev && (
                <button
                  className="wd-btn wd-btn--panel"
                  onClick={handleDevQuickstart}
                  style={{ opacity: 0.85 }}
                >
                  Dev Quickstart
                </button>
              )}
            </div>
          )}

          <button
            className="wd-btn wd-btn--ghost"
            onClick={() => {
              setShowOtherSoon((v) => !v);
              setShowMafiaOptions(false);
            }}
          >
            Other Games
          </button>

          {showOtherSoon && (
            <div className="home-soon" role="status">
              <span className="home-soon-dot" aria-hidden="true" />
              Coming soon
            </div>
          )}
        </div>

        <div className="home-footer">
          <span className="home-footer-pill">
            Version 0.1 • For Charlotte ♥️
          </span>
        </div>
      </div>
    </div>
  );
}