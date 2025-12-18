// src/games/whodunnit/config/themes/snowed_in/narration.js

export const narration = {
  /**
   * ─────────────────────────────
   * OPENING
   * Sets the scene, explains the situation, establishes tone
   * Fired once at game start
   * ─────────────────────────────
   */
  opening: [
    {
      id: "opening_1",
      intent: "begin_game",
      weight: 1,
      lines: [
        "The retreat was meant to be quiet.",
        "A remote lodge, a few days away from the world.",
        "No one imagined how quickly isolation would turn into something else."
      ]
    },
    {
      id: "opening_2",
      intent: "begin_game",
      weight: 1,
      lines: [
        "Snow began falling before anyone finished unpacking.",
        "By nightfall, the road down the mountain was gone.",
        "Everyone was trapped — whether they realized it yet or not."
      ]
    },
    {
      id: "opening_3",
      intent: "begin_game",
      weight: 1,
      lines: [
        "The storm wasn’t part of the plan.",
        "Neither was being cut off from help.",
        "The lodge became the whole world — and there was no leaving it."
      ]
    }
  ],

  /**
   * ─────────────────────────────
   * BETWEEN PHASES
   * Generic narration used between action phases
   * Low specificity, high reusability
   * ─────────────────────────────
   */
  between_phases: [
    {
      id: "between_1",
      intent: "prepare_actions",
      weight: 1,
      lines: [
        "The hours pass slowly inside the lodge.",
        "Small talk fills the silence, but no one sounds relaxed.",
        "Every interaction feels just a little forced."
      ]
    },
    {
      id: "between_2",
      intent: "prepare_actions",
      weight: 1,
      lines: [
        "People drift into separate rooms, groups forming and dissolving.",
        "Whispers replace normal conversation.",
        "It’s hard to tell who feels nervous — and who feels confident."
      ]
    },
    {
      id: "between_3",
      intent: "prepare_actions",
      weight: 1,
      lines: [
        "The storm outside shows no sign of easing.",
        "Inside, tensions continue to build.",
        "Whatever happens next will happen behind closed doors."
      ]
    }
  ],

  /**
   * ─────────────────────────────
   * ESCALATION
   * Used as the game progresses and paranoia increases
   * Same structure, darker tone
   * ─────────────────────────────
   */
  escalation: [
    {
      id: "escalation_1",
      intent: "prepare_actions",
      weight: 1,
      lines: [
        "Trust is becoming a rare commodity.",
        "Every word feels measured, every silence suspicious.",
        "No one seems entirely comfortable anymore."
      ]
    },
    {
      id: "escalation_2",
      intent: "prepare_actions",
      weight: 1,
      lines: [
        "Eyes linger a moment too long.",
        "Conversations stop abruptly when someone approaches.",
        "The lodge feels smaller with every passing hour."
      ]
    },
    {
      id: "escalation_3",
      intent: "prepare_actions",
      weight: 1,
      lines: [
        "Fear has settled in alongside the cold.",
        "Even familiar faces feel unpredictable now.",
        "Everyone is starting to wonder how this will end."
      ]
    }
  ],

  /**
   * ─────────────────────────────
   * ENDGAME
   * Late-game narration, approaching resolution
   * Still non-specific, but heavy with finality
   * ─────────────────────────────
   */
  endgame: [
    {
      id: "endgame_1",
      intent: "closing",
      weight: 1,
      lines: [
        "The atmosphere inside the lodge has shifted.",
        "Whatever secrets remain won’t stay hidden much longer.",
        "This can’t continue for another night."
      ]
    },
    {
      id: "endgame_2",
      intent: "closing",
      weight: 1,
      lines: [
        "Everyone knows the situation is reaching a breaking point.",
        "There’s a sense that time is running out.",
        "Soon, the truth will be impossible to ignore."
      ]
    },
    {
      id: "endgame_3",
      intent: "closing",
      weight: 1,
      lines: [
        "The storm still rages outside, but no one is paying attention anymore.",
        "All focus has turned inward.",
        "By the end of this, nothing will be the same."
      ]
    }
  ]
};
