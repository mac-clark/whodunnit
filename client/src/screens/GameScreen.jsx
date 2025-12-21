export default function GameScreen({ sessionId, player }) {
  return (
    <div className="screen game-screen">
      <h2>Game</h2>

      <p>Session: {sessionId}</p>

      <div className="narration">
        <p>The storm arrived faster than anyone expected.</p>
        <p>No one would be leaving the lodge anytime soon.</p>
      </div>

      <button>
        Continue
      </button>
    </div>
  );
}
