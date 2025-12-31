import React, { useMemo } from "react";
import { ABILITY_COPY } from "../abilityCopy";

const ROLE_LABEL = {
  detective: "Detective",
  doctor: "Doctor",
  vigilante: "Vigilante",
  serial_killer: "Serial Killer",
  roleblocker: "Roleblocker",
  // civilians + narrator shouldn’t ever be in night actorIds
};

function humanizeRoleId(roleId) {
  return String(roleId || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function findInRoster(fullRoster, id) {
  return (fullRoster || []).find((p) => p.id === id) || null;
}

function computeWakeLabel({ fullRoster, actorIds }) {
  const actors = (actorIds || [])
    .map((id) => findInRoster(fullRoster, id))
    .filter(Boolean);

  if (!actors.length) return "—";

  // ✅ rule 1: any mafia alignment => wake Mafia (plural group)
  const anyMafia = actors.some((a) => a?.role?.alignment === "mafia");
  if (anyMafia) return "Mafia";

  // ✅ otherwise: usually single-actor step; use role id
  const roleIds = actors.map((a) => a?.role?.id).filter(Boolean);
  const unique = [...new Set(roleIds)];

  if (unique.length === 1) {
    const r = unique[0];
    return ROLE_LABEL[r] || humanizeRoleId(r);
  }

  // rare: multiple different non-mafia roles in one step
  return unique.map((r) => ROLE_LABEL[r] || humanizeRoleId(r)).join(" & ");
}

export default function NarratorNightCard({
  me,
  players,
  nightQueue,
  nightIndex,
  nightPrompt,
  fullRoster,
  onNext,
  nextDisabled = false,
  showNext = false,
}) {
  const idx = Number(nightIndex || 0);
  const queue = Array.isArray(nightQueue) ? nightQueue : [];
  const step = nightPrompt || queue[idx] || null;

  const ability = step?.ability || null;
  const actorIds = Array.isArray(step?.actorIds) ? step.actorIds : [];

  const copy = (ability && ABILITY_COPY?.[ability]) || {};
  const title = copy?.narratorTitle || copy?.title || "Night Step";
  const narratorLines = copy?.narratorLines || copy?.narratorPrompt || null;

  const wakeLabel = useMemo(() => {
    // if backend ever adds step.group, prefer it — but we don’t rely on it
    if (step?.group) return step.group;
    return computeWakeLabel({ fullRoster, actorIds });
  }, [step?.group, fullRoster, actorIds]);

  if (!ability) return null;

  return (
    <div className="player-list">
      <div className="join-empty" style={{ textAlign: "left" }}>
        <strong>
          Night — Step {Math.min(idx + 1, queue.length || idx + 1)}
          {queue.length ? ` of ${queue.length}` : ""}
        </strong>
        <br />
        <span style={{ opacity: 0.9 }}>
          Wake: <strong>{wakeLabel}</strong>
        </span>
      </div>

      <div className="join-empty" style={{ textAlign: "left" }}>
        <strong>{title}</strong>
        <br />
        {copy?.description || "Follow the instructions for this ability."}
      </div>

      {narratorLines ? (
        Array.isArray(narratorLines) ? (
          narratorLines.map((l, i) => (
            <div
              key={`nightline_${ability}_${i}`}
              className="join-empty"
              style={{ textAlign: "left" }}
            >
              {l}
            </div>
          ))
        ) : (
          <div className="join-empty" style={{ textAlign: "left" }}>
            {narratorLines}
          </div>
        )
      ) : null}

      <div className="home-soon" role="status" style={{ opacity: 0.9 }}>
        <span className="home-soon-dot" aria-hidden="true" />
        After they act, press <strong>Next</strong>.
      </div>
      
      {showNext && (
        <button
          className="wd-btn wd-btn--primary"
          onClick={onNext}
          disabled={nextDisabled}
          style={{ width: "100%", marginTop: 10 }}
        >
          Next
        </button>
      )}
    </div>
  );
}