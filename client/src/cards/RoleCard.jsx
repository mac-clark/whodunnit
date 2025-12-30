// client/src/cards/RoleCard.jsx

import React from "react";
import * as LucideIcons from "lucide-react";

/**
 * Resolve a Lucide icon component by key.
 * Falls back safely to User.
 */
function getLucideIcon(iconKey) {
  if (!iconKey) return LucideIcons.User;
  const Icon = LucideIcons[iconKey];
  return Icon || LucideIcons.User;
}

/**
 * Pure UI card — no fetches, no timers.
 * Displays role, character flavor, icon, and role brief.
 */
export default function RoleCard({ view, me, isNarrator }) {
  if (!view) {
    return <div className="join-empty">Loading your role…</div>;
  }

  if (!me) {
    return (
      <div className="join-empty">
        Couldn’t find your player in the game view.
      </div>
    );
  }

  const roleObj = me.role?.id ? me.role : { id: "narrator" };
  const roleId = roleObj?.id || "narrator";

  const roleName =
    roleId
      .toString()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase()) || "Unknown Role";

  const alignment = me.role?.alignment || (isNarrator ? "narrator" : null);

  const Icon = getLucideIcon(roleObj?.icon);

  // Theme-driven character (human-readable)
  const character = me.character || null;
  const showCharacter = !isNarrator && character;

  // Role brief (prefer server-attached per-player brief)
  const brief =
    me?.roleBrief ||
    view?.roleBriefs?.[roleId] ||
    null;

  return (
    <div className="player-list">
      {/* ───────── Role header ───────── */}
      <div className="player-row" style={{ alignItems: "flex-start" }}>
        <div
          className="player-left"
          style={{ gap: 10, alignItems: "flex-start" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.20)",
              }}
              aria-hidden="true"
            >
              <Icon size={18} />
            </div>

            <div className="player-name" style={{ fontSize: 18 }}>
              {roleName}
            </div>
          </div>
        </div>

        {alignment && <div className="lobby-pill">{alignment}</div>}
      </div>

      {/* ───────── Narrator special case ───────── */}
      {isNarrator ? (
        <div className="join-empty" style={{ textAlign: "left" }}>
          You’re the Narrator. You’ll guide the group, advance phases, and read
          the prompts.
        </div>
      ) : showCharacter ? (
        <>
          {/* ───────── Character flavor ───────── */}
          <div className="join-empty" style={{ textAlign: "left" }}>
            <strong>{character.name}</strong>
          </div>

          {character.description && (
            <div className="join-empty" style={{ textAlign: "left" }}>
              {character.description}
            </div>
          )}

          {character.objective && (
            <div className="join-empty" style={{ textAlign: "left" }}>
              <strong>Your objective:</strong> {character.objective}
            </div>
          )}

          {/* ───────── Role brief (ability + timing) ───────── */}
          {brief && (brief.ability || brief.when) && (
            <div style={{ marginTop: 10 }}>
              {brief.ability && (
                <div className="join-empty" style={{ textAlign: "left" }}>
                  <strong>Ability:</strong> {brief.ability}
                </div>
              )}

              {brief.when && (
                <div className="join-empty" style={{ textAlign: "left" }}>
                  <strong>When:</strong> {brief.when}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="home-soon" role="status">
          <span className="home-soon-dot" aria-hidden="true" />
          Character info missing for your role. (Theme roleMap may not have
          mapped correctly.)
        </div>
      )}
    </div>
  );
}