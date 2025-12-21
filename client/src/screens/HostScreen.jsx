export default function HostScreen({ onSessionCreated, onBack }) {
  return (
    <div className="screen host-screen">
      <h2>Host a Game</h2>

      <button
        onClick={() => {
          // TEMP: fake session id
          onSessionCreated("SESSION123");
        }}
      >
        Create Session
      </button>

      <button onClick={onBack}>
        Back
      </button>
    </div>
  );
}
