import { useState } from "react";
import { HatGlasses } from "lucide-react";

export default function HomeScreen({ onHost, onJoin }) {
  const [showMafiaOptions, setShowMafiaOptions] = useState(false);
  const [showOtherSoon, setShowOtherSoon] = useState(false);

  return (
    <div className="screen home-screen">
      <div className="screen-bg" aria-hidden="true" />
      <div className="home-hero">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <HatGlasses size={34} strokeWidth={1.8} />
          </div>

          <h1 className="brand-title">WHODUNNIT</h1>
          <p className="brand-subtitle">A LAN party of lies, luck, and accusations.</p>
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
          <span className="home-footer-pill">Version 0.1 • For Charlotte ♥️</span>
        </div>
      </div>
    </div>
  );
}