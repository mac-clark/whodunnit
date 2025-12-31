// client/src/cards/GameOverCard.jsx
import React from "react";
import { Skull } from "lucide-react";

export default function GameOverCard({ gameResult, fullRoster, onExit }) {
  const winner = gameResult?.winner || "unknown";
  const reason = gameResult?.reason || "";
  const counts = gameResult?.counts || null;
  const endedAtRound = gameResult?.endedAtRound ?? null;

  const winnerLabel =
    winner === "mafia" ? "Mafia Wins" : winner === "town" ? "Town Wins" : "Game Over";

  function formatReason(w, r) {
    if (w === "mafia" && r === "mafia_majority") return "by majority";
    if (w === "town" && r === "mafia_eliminated") return "all mafia eliminated";
    return r ? r.replaceAll("_", " ") : "";
  }

  const reasonText = formatReason(winner, reason);

  const roster = Array.isArray(fullRoster) ? fullRoster : [];

  // Put narrator at bottom (optional), otherwise stable alpha sort
  const sortedRoster = [...roster].sort((a, b) => {
    const aNar = a?.isNarrator ? 1 : 0;
    const bNar = b?.isNarrator ? 1 : 0;
    if (aNar !== bNar) return aNar - bNar; // narrator last
    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });

  return (
    <div className="form-stack">
      <div className="join-empty" style={{ textAlign: "left" }}>
        <strong style={{ fontSize: 18 }}>{winnerLabel}</strong>

        <div style={{ marginTop: 8, opacity: 0.9 }}>
          {winner === "mafia" && reasonText
            ? `Mafia wins ${reasonText}.`
            : winner === "town" && reasonText
              ? `Town wins — ${reasonText}.`
              : "The game has ended."}
        </div>

        {endedAtRound != null && (
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
            Ended at round {endedAtRound}
          </div>
        )}

        {counts && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.75, letterSpacing: 0.2 }}>
              Final Count
            </div>
            <div>
              Mafia: <strong>{counts.mafia ?? "—"}</strong>
              {" · "}
              Non-mafia: <strong>{counts.nonMafia ?? "—"}</strong>
            </div>
          </div>
        )}

        {sortedRoster.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, opacity: 0.75, letterSpacing: 0.2 }}>
              Full Roster
            </div>

            <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
              {sortedRoster.map((p) => {
                const isDead = p?.alive === false;
                const roleId = p?.role?.id || "unknown";
                const alignment = p?.role?.alignment || null;

                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(0,0,0,0.18)",
                      opacity: isDead ? 0.75 : 1,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          minWidth: 0,
                        }}
                      >
                        <strong
                          style={{
                            fontSize: 14,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {p?.name || "Unknown"}
                        </strong>

                        {p?.isNarrator && (
                          <span style={{ fontSize: 11, opacity: 0.75 }}>(Narrator)</span>
                        )}

                        {isDead && (
                            <span
                                style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                opacity: 0.75,
                                }}
                            >
                                <Skull size={14} strokeWidth={1.8} />
                                Dead
                            </span>
                        )}
                      </div>

                      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>
                        Role: <strong>{roleId}</strong>
                        {alignment ? <span style={{ opacity: 0.8 }}> · {alignment}</span> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!!onExit && (
        <button className="wd-btn wd-btn--ghost" onClick={onExit} style={{ width: "100%" }}>
          Exit
        </button>
      )}
    </div>
  );
}