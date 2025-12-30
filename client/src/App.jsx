// client/src/App.jsx

import { useEffect, useState } from "react";
import "./index.css";

import HomeScreen from "./screens/HomeScreen";
import HostScreen from "./screens/HostScreen";
import JoinScreen from "./screens/JoinScreen";
import LobbyScreen from "./screens/LobbyScreen";
import GameScreen from "./screens/GameScreen";

import { getDeviceToken } from "./lib/deviceToken";

const LS_SESSION = "whodunnit_sessionId";
const LS_SCREEN = "whodunnit_screen"; // "lobby" | "game"

export default function App() {
  const [screen, setScreen] = useState("home");
  const [sessionId, setSessionId] = useState(null);
  const [player, setPlayer] = useState(null);
  const [rehydrating, setRehydrating] = useState(false);

  // DEV quickstart payload bits
  const [devPlayers, setDevPlayers] = useState(null);
  const [devNarratorId, setDevNarratorId] = useState(null);
  const [devThemeId, setDevThemeId] = useState(null);

  function clearRun() {
    setPlayer(null);
    setSessionId(null);
    setScreen("home");

    // clear dev state too
    setDevPlayers(null);
    setDevNarratorId(null);
    setDevThemeId(null);

    localStorage.removeItem(LS_SESSION);
    localStorage.removeItem(LS_SCREEN);
  }

  // Persist when we enter lobby/game
  useEffect(() => {
    if (sessionId && (screen === "lobby" || screen === "game")) {
      localStorage.setItem(LS_SESSION, sessionId);
      localStorage.setItem(LS_SCREEN, screen);
    }
  }, [screen, sessionId]);

  // Rehydrate on hard refresh
  useEffect(() => {
    const savedSessionId = localStorage.getItem(LS_SESSION);
    const savedScreen = localStorage.getItem(LS_SCREEN);

    if (
      !savedSessionId ||
      (savedScreen !== "lobby" && savedScreen !== "game")
    ) {
      return;
    }

    (async () => {
      setRehydrating(true);
      try {
        const res = await fetch(`/api/sessions/${savedSessionId}/reconnect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceToken: getDeviceToken() }),
        });

        if (!res.ok) {
          clearRun();
          return;
        }

        const data = await res.json();
        setSessionId(savedSessionId);
        setPlayer(data.player);
        setScreen(savedScreen);
      } catch {
        clearRun();
      } finally {
        setRehydrating(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (rehydrating) {
    return (
      <div className="app-root">
        <div className="screen">
          <div className="screen-bg" aria-hidden="true" />
          <div className="home-hero">
            <div className="brand" style={{ marginBottom: 14 }}>
              <h1 className="brand-title" style={{ fontSize: 28, margin: 0 }}>
                Reconnecting…
              </h1>
              <p className="brand-subtitle" style={{ marginTop: 8 }}>
                Restoring your player.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      {screen === "home" && (
        <HomeScreen
          onHost={() => setScreen("host")}
          onJoin={() => setScreen("join")}
          onDevStart={(payload) => {
            // payload from /dev/quickstart
            // expected: { sessionId, players, narratorId, themeId, ... }

            setSessionId(payload.sessionId);

            // pick a default “me” for dev (narrator or first player)
            const defaultPlayer = payload.players?.find(p => p.id === payload.narratorId) || payload.players?.[0];
            setPlayer(defaultPlayer || null);

            setDevPlayers(payload.players || []);
            setDevNarratorId(payload.narratorId || null);
            setDevThemeId(payload.themeId || null);

            // OPTIONAL: store dev roster somewhere global if GameScreen needs it
            // simplest: stash on window for now (dev-only), or localStorage
            window.__WD_DEV__ = {
              sessionId: payload.sessionId,
              players: payload.players || [],
              narratorId: payload.narratorId || null,
              themeId: payload.themeId || null,
            };

            setScreen("game");
          }}
        />
      )}

      {screen === "host" && (
        <HostScreen
          onSessionCreated={(id, hostPlayer) => {
            setSessionId(id);
            setPlayer(hostPlayer);

            // clear dev state
            setDevPlayers(null);
            setDevNarratorId(null);
            setDevThemeId(null);

            setScreen("lobby");
          }}
          onBack={() => setScreen("home")}
        />
      )}

      {screen === "join" && (
        <JoinScreen
          onJoined={(joinedPlayer, id) => {
            setPlayer(joinedPlayer);
            setSessionId(id);

            // clear dev state
            setDevPlayers(null);
            setDevNarratorId(null);
            setDevThemeId(null);

            setScreen("lobby");
          }}
          onBack={() => setScreen("home")}
        />
      )}

      {screen === "lobby" && (
        <LobbyScreen
          sessionId={sessionId}
          player={player}
          onStarted={() => setScreen("game")}
          onExit={clearRun}
        />
      )}

      {screen === "game" && (
        <GameScreen
          sessionId={sessionId}
          player={player}
          onExit={clearRun}
          devPlayers={devPlayers}
          devNarratorId={devNarratorId}
          devThemeId={devThemeId}
          onDevSwitchPlayer={(p) => setPlayer(p)}
        />
      )}
    </div>
  );
}