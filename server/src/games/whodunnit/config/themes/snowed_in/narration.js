// src/games/whodunnit/config/themes/snowed_in/narration.js

export const narration = {
  /**
   * ─────────────────────────────
   * PROLOGUE
   * Sets the scene + mood. No rules.
   * Fired before the "game" begins.
   * ─────────────────────────────
   */
  prologue: [
    {
      id: "prologue_1",
      intent: "set_scene",
      weight: 1,
      lines: [
        "The lodge was supposed to be a reset — three days of quiet, heat, and polite small talk.",
        "A place so far from the world that even your phone gives up trying.",
        "By the time the snow starts to fall in earnest, everyone is already inside.",
        "At first it’s beautiful. Peaceful. The kind of silence people pay for.",
        "Then the wind changes.",
        "And the mountain reminds you that it doesn’t care what you planned."
      ],
    },
    {
      id: "prologue_2",
      intent: "set_scene",
      weight: 1,
      lines: [
        "You arrive in daylight, laughing at the signs warning about sudden storms.",
        "The staff smiles like they’ve heard it all before — like the mountain always gets the last word.",
        "By dusk, the road is gone. Not blocked — erased.",
        "Snow presses against the windows as if it’s trying to get in.",
        "The lodge creaks and settles, old wood complaining in the cold.",
        "And for the first time, you understand something simple:",
        "There is no leaving until the mountain decides you can."
      ],
    },
    {
      id: "prologue_3",
      intent: "set_scene",
      weight: 1,
      lines: [
        "The fire is warm. The drinks are strong. The atmosphere is almost convincing.",
        "Everyone plays their part: friendly, tired, harmless.",
        "But isolation does strange things to people.",
        "It makes every glance feel like a message.",
        "Every laugh feel a little too loud.",
        "Every silence feel like it’s hiding something.",
        "Outside, the storm grows heavier.",
        "Inside, the lodge grows smaller."
      ],
    },
  ],

  /**
   * ─────────────────────────────
   * RULES (IN-WORLD)
   * Explains how the game will flow, without using "mafia" vocabulary.
   * Establishes day vs night, secrecy, and deduction.
   * ─────────────────────────────
   */
  rules: [
    {
      id: "rules_1",
      intent: "explain_flow",
      weight: 1,
      lines: [
        "Here’s what matters now.",
        "In the daylight, you’ll talk. Watch. Ask questions. Decide who feels safe — and who doesn’t.",
        "But when night comes, the lodge changes.",
        "Doors close. Voices lower. People move with purpose.",
        "Some of you will do nothing but listen and try to survive until morning.",
        "Some of you will take actions in secret.",
        "And some of you will lie as easily as breathing.",
        "You won’t win by guessing. You’ll win by noticing."
      ],
    },
    {
      id: "rules_2",
      intent: "explain_secrecy",
      weight: 1,
      lines: [
        "No one in this lodge is here by accident.",
        "You each have a part to play — and you’re the only one who knows what it is.",
        "During the day, you’ll have only your words and instincts.",
        "During the night, certain people will be called to act while everyone else waits in the dark.",
        "If you reveal what you are, you become predictable.",
        "If you stay silent, you become suspicious.",
        "Every choice you make will cost you something.",
        "So be careful what you share — and be even more careful what you believe."
      ],
    },
    {
      id: "rules_3",
      intent: "explain_objectives",
      weight: 1,
      lines: [
        "There are different reasons people want control of this lodge.",
        "Some of you are trying to protect the group — to keep everyone alive.",
        "Some of you are trying to bend the night to your advantage.",
        "And at least one of you is here for a reason that doesn’t require anyone else to survive.",
        "You’ll have moments to act, and long stretches where all you can do is talk.",
        "That’s the point.",
        "The lodge doesn’t reward strength. It rewards patience.",
        "And it punishes certainty."
      ],
    },
  ],
};
