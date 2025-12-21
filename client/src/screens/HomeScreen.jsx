export default function HomeScreen({ onHost, onJoin }) {
  return (
    <div className="screen home-screen">
      <h1>Whodunnit</h1>

      <button onClick={onHost}>
        Host a Game
      </button>

      <button onClick={onJoin}>
        Join a Game
      </button>
    </div>
  );
}
