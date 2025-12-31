// client/src/cards/DeadCard.jsx
export default function DeadCard({ me }) {
  return (
    <div className="player-list">
      <div className="join-empty" style={{ textAlign: "left" }}>
        <strong>You have been eliminated.</strong>
        <br />
        Stay quiet. You can keep watching, but you can’t vote or act.
      </div>

      {/* optional: let them re-open role tab / see their role */}
      {me?.role?.name && (
        <div className="join-empty" style={{ textAlign: "left" }}>
          <strong>Your role:</strong> {me.role.name}
        </div>
      )}
    </div>
  );
}
