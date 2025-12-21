import { useState } from "react";
import "./index.css";

import HomeScreen from "./screens/HomeScreen";
import HostScreen from "./screens/HostScreen";
import JoinScreen from "./screens/JoinScreen";
import GameScreen from "./screens/GameScreen";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [sessionId, setSessionId] = useState(null);
  const [player, setPlayer] = useState(null);

  return (
    <div className="app-root">
      {screen === "home" && (
        <HomeScreen
          onHost={() => setScreen("host")}
          onJoin={() => setScreen("join")}
        />
      )}

      {screen === "host" && (
        <HostScreen
          onSessionCreated={(id) => {
            setSessionId(id);
            setScreen("game");
          }}
          onBack={() => setScreen("home")}
        />
      )}

      {screen === "join" && (
        <JoinScreen
          onJoined={(player, id) => {
            setPlayer(player);
            setSessionId(id);
            setScreen("game");
          }}
          onBack={() => setScreen("home")}
        />
      )}

      {screen === "game" && (
        <GameScreen
          sessionId={sessionId}
          player={player}
        />
      )}
    </div>
  );
}
