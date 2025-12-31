export default function NarrationCard({
  narrationPayload,
  showNext = false,
  onNext,
  nextDisabled = false,
  tokens = {},
}) {
  const rawLines = narrationPayload?.narration?.lines || [];

  // If we haven't fetched yet (because still in setup), keep it quiet
  if (!rawLines.length && !showNext) return null;

  const lines = rawLines.map((line) => {
    let out = line;

    // simple token replacement (add more tokens as needed)
    if (tokens.victimName) out = out.replaceAll("{victimName}", tokens.victimName);
    if (tokens.eliminatedName) out = out.replaceAll("{eliminatedName}", tokens.eliminatedName);

    return out;
  });

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
