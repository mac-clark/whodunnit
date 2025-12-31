import { useEffect, useMemo, useState } from "react";

const ABSTAIN_VALUE = "abstain";

export default function VoteCard({
  me,
  players,
  vote,
  onSubmit,
  submitting = false,
}) {
  const [targetId, setTargetId] = useState("");

  // ✅ keep local selection in sync with server-provided myVote (polling)
  // Server sends null for abstain, so map it back to "abstain" ONLY if we've actually voted.
  useEffect(() => {
    const hasVoted = Object.prototype.hasOwnProperty.call(vote || {}, "myVote");

    // If server says myVote is null and we have voted, that means "abstain"
    if (hasVoted && vote?.myVote === null) {
      setTargetId(ABSTAIN_VALUE);
      return;
    }

    setTargetId(vote?.myVote || "");
  }, [vote?.myVote]);

  const options = useMemo(() => {
    return (players || []).filter(
      (p) => p.alive && !p.isNarrator && p.id !== me?.id
    );
  }, [players, me?.id]);

  const voteOpen = vote?.open === true;
  const myWeight = Number(me?.voteWeight || 1);

  function handleSubmit() {
    if (!voteOpen) return;
    if (!targetId) return;

    // ✅ submit abstain sentinel (backend already supports "abstain")
    onSubmit?.(targetId);
  }

  return (
    <div className="form-stack">
      <div className="join-empty" style={{ textAlign: "left" }}>
        <strong>Vote</strong>
        <br />
        Choose who to eliminate.
        {myWeight > 1 && (
          <>
            <br />
            <span style={{ opacity: 0.9 }}>
              Your vote counts as <strong>{myWeight}</strong>.
            </span>
          </>
        )}
      </div>

      <div className="lobby-code" style={{ justifyContent: "space-between" }}>
        <div className="lobby-code-left" style={{ width: "100%" }}>
          <div className="lobby-code-label">
            {`Ballots: ${vote?.votesCount ?? 0}/${vote?.requiredCount ?? 0}`}
          </div>

          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            disabled={submitting || !voteOpen}
            style={{
              width: "100%",
              marginTop: 8,
              padding: "12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              outline: "none",
              opacity: voteOpen ? 1 : 0.7,
            }}
          >
            <option className="option-drop" value="">Select…</option>

            {/* ✅ NEW: abstain */}
            <option className="option-drop" value={ABSTAIN_VALUE}>
              No one (abstain)
            </option>

            {options.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        className="wd-btn wd-btn--primary"
        onClick={handleSubmit}
        disabled={submitting || !targetId || !voteOpen}
        style={{ width: "100%" }}
      >
        {submitting ? "Submitting…" : (Object.prototype.hasOwnProperty.call(vote || {}, "myVote")) ? "Update Vote" : "Submit Vote"}
      </button>

      {voteOpen ? (
        vote?.myVote !== undefined ? ( // ✅ treat null as "has voted"
          <div className="home-soon" role="status" style={{ opacity: 0.9 }}>
            <span className="home-soon-dot" aria-hidden="true" />
            Vote recorded. You can change it until voting closes.
          </div>
        ) : (
          <div className="home-soon" role="status" style={{ opacity: 0.85 }}>
            <span className="home-soon-dot" aria-hidden="true" />
            Make your choice and submit when ready.
          </div>
        )
      ) : (
        <div className="home-soon" role="status" style={{ opacity: 0.85 }}>
          <span className="home-soon-dot" aria-hidden="true" />
          Voting is not open yet.
        </div>
      )}
    </div>
  );
}
