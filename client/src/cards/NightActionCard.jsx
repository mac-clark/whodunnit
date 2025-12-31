import { useEffect, useMemo, useState } from "react";
import { ABILITY_COPY } from "../abilityCopy";

export default function NightActionCard({
  me,
  players,
  nightPrompt,
  effects,
  onSubmit,
  submitting = false,
}) {
  const [targetId, setTargetId] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const ability = nightPrompt?.ability;
  const copy = ABILITY_COPY[ability] || {};
  const investigation = effects?.investigation;

  const showInvestigation =
    ability === "investigate_alignment" &&
    investigation &&
    investigation.round === nightPrompt?.round &&
    investigation.targetId === targetId;

  const options = useMemo(() => {
    const allowSelf = ability === "protect"; // ✅ doctor can self-protect

    return (players || []).filter((p) => {
      if (!p.alive) return false;
      if (p.isNarrator) return false;

      // most abilities can't target self, but protect can
      if (!allowSelf && p.id === me?.id) return false;

      return true;
    });
  }, [players, me?.id, ability]);

  function handleSubmit() {
    if (!ability || !targetId || confirmed) return;
    setConfirmed(true);
    onSubmit?.(ability, targetId);
  }

  useEffect(() => {
    setTargetId("");
    setConfirmed(false);
  }, [nightPrompt?.ability, nightPrompt?.round]);

  // ─────────────────────────────
  // CONFIRMED STATE
  // ─────────────────────────────
  if (confirmed) {
    return (
      <div className="form-stack">
        <div className="join-empty" style={{ textAlign: "left" }}>
          <strong>Action Confirmed</strong>
          <br />
          Your choice has been recorded.
        </div>

        <button
          className="wd-btn wd-btn--ghost"
          disabled
          style={{ width: "100%", opacity: 0.7 }}
        >
          ✓ Confirmed
        </button>

        {showInvestigation && (
          <div className="join-empty" style={{ textAlign: "left" }}>
            <strong>Result</strong>
            <br />
            That player is aligned with: <strong>{investigation.alignment}</strong>
          </div>
        )}

        <div className="home-soon" role="status" style={{ opacity: 0.9 }}>
          <span className="home-soon-dot" aria-hidden="true" />
          Keep your screen hidden and wait…
        </div>
      </div>
    );
  }

  // ─────────────────────────────
  // ACTIVE STATE
  // ─────────────────────────────
  return (
    <div className="form-stack">
      <div className="join-empty" style={{ textAlign: "left" }}>
        <strong>{copy.title || "Night Action"}</strong>
        <br />
        {copy.description || "Choose a target carefully."}
      </div>

      <div className="lobby-code" style={{ justifyContent: "space-between" }}>
        <div className="lobby-code-left" style={{ width: "100%" }}>
          <div className="lobby-code-label">Choose a target</div>

          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            disabled={submitting}
            style={{
              width: "100%",
              marginTop: 8,
              padding: "12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              outline: "none",
            }}
          >
            <option className="option-drop" value="">Select…</option>
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
        disabled={submitting || !targetId}
        style={{ width: "100%" }}
      >
        {submitting
          ? "Submitting…"
          : copy.confirmLabel || "Confirm"}
      </button>

      <div className="home-soon" role="status" style={{ opacity: 0.9 }}>
        <span className="home-soon-dot" aria-hidden="true" />
        Don’t show anyone your screen.
      </div>
    </div>
  );
}