export default function JoinScreen({ onJoined, onBack }) {
  return (
    <div className="screen join-screen">
      <h2>Join a Game</h2>

      <input placeholder="Your name" />
      <input placeholder="Session ID" />

      <button
        onClick={() => {
          // TEMP: fake join
          onJoined({ id: "p1", name: "Player" }, "SESSION123");
        }}
      >
        Join
      </button>

      <button onClick={onBack}>
        Back
      </button>
    </div>
  );
}
