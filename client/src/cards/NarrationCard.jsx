// client/src/cards/NarrationCard.jsx

import React from "react";

export default function NarrationCard({
  narrationPayload,
  showNext = false,
  onNext,
  nextDisabled = false,
}) {
  const lines = narrationPayload?.narration?.lines || [];

  // If we haven't fetched yet (because still in setup), keep it quiet
  if (!lines.length && !showNext) return null;

  return (
    <div className="player-list">
      {lines.map((line, idx) => (
        <div
          key={`${narrationPayload?.narration?.id || "n"}_${idx}`}
          className="join-empty"
          style={{ textAlign: "left" }}
        >
          {line}
        </div>
      ))}

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