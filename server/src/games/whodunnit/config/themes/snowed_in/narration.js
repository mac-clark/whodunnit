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
  /**
   * ─────────────────────────────
   * NIGHT 1
   * Establishes the rhythm. Uneventful by design.
   * No actions. No consequences. Just the lodge tightening.
   * ─────────────────────────────
   */
  night_1: [
    {
      id: "night_1_canon",
      intent: "transition_to_night_reveal",
      weight: 1,
      lines: [
        "Night comes slow — like the lodge is holding its breath.",
        "The fire shrinks to embers. The storm keeps working at the walls.",
        "Floorboards settle. Pipes tick. Every little sound feels like it means something.",
        "Everyone closes their eyes.",

        "Mafia, wake up.",
        "Quietly look around and learn who is with you.",
        "Take a moment. Remember faces.",
        "Mafia, go back to sleep.",

        "The lodge goes still again.",
        "Nothing happens tonight.",
        "But now you know: some people aren’t here to keep everyone safe."
      ],
    },
  ],

  /**
   * ─────────────────────────────
   * DAY 1
   * First daylight. No vote. No elimination.
   * Just talk, pressure, and the feeling that it has begun.
   * ─────────────────────────────
   */
  day_1: [
    {
      id: "day_1_canon",
      intent: "open_discussion_intros",
      weight: 1,
      lines: [
        "Morning arrives like a compromise.",
        "Gray light leaks through iced windows. The storm hasn’t moved an inch.",
        "Everyone is still here.",
        "Which should feel like relief.",
        "Instead, it feels like the first warning.",

        "Before accusations start, introduce yourselves by your player names.",
        "Go around the room — say your name clearly so people can remember it.",
        "Talk, socialize.",
        "You’re not voting today.",
        "But you are collecting tells."
      ],
    },
  ],

   /**
   * ─────────────────────────────
   * GENERIC NIGHT PROMPTS (Night 2+)
   * Used at the start of each night phase.
   * Engine should pick ONE of these each night.
   * ─────────────────────────────
   */
  night_prompt: [
    {
      id: "night_prompt_1",
      intent: "night_actions",
      weight: 1,
      lines: [
        "Night settles over the lodge like a heavy blanket.",
        "The storm covers every sound that shouldn’t exist.",
        "Everyone closes their eyes.",

        "Narrator: Press Next to begin the night actions.",
        "Narrator: Follow each on-screen prompt that starts with “Wake: …”.",
        "Narrator: Do NOT continue reading this card until the “Wake” prompts are finished.",

        "The lodge is quiet again.",
        "If someone moves now… they do it without witnesses."
      ],
    },
    {
      id: "night_prompt_2",
      intent: "night_actions",
      weight: 1,
      lines: [
        "The lights dim. The hallways stretch longer.",
        "Even the fire feels like it’s watching.",
        "Eyes closed. No talking.",

        "Narrator: Press Next to begin the night actions.",
        "Narrator: Follow each on-screen prompt that starts with “Wake: …”.",
        "Narrator: Do NOT continue reading this card until the “Wake” prompts are finished.",

        "And just like that—",
        "the lodge goes still."
      ],
    },
    {
      id: "night_prompt_3",
      intent: "night_actions",
      weight: 1,
      lines: [
        "Night makes liars brave.",
        "The storm outside gives cover to choices made inside.",
        "Everyone closes their eyes and waits.",

        "Narrator: Press Next to begin the night actions.",
        "Narrator: Follow each on-screen prompt that starts with “Wake: …”.",
        "Narrator: Do NOT continue reading this card until the “Wake” prompts are finished.",

        "Nobody opens their eyes yet.",
        "Not until the lodge is done with you."
      ],
    },
  ],

  /**
   * ─────────────────────────────
   * NIGHT RESULTS (start of day)
   * Played when night ends -> day starts.
   * Engine fills in tokens like {victimName}.
   * If nobody died, use the “no_death” variants.
   * ─────────────────────────────
   */
  night_result: [
    {
      id: "night_result_death_1",
      intent: "reveal_death",
      weight: 1,
      lines: [
        "Morning comes, and the lodge feels different.",
        "Like it’s already counted the cost.",
        "{victimName} is gone.",
        "No speech. No struggle anyone admits to hearing.",
        "Just an absence where a person used to be."
      ],
    },
    {
      id: "night_result_death_2",
      intent: "reveal_death",
      weight: 1,
      lines: [
        "The storm eases just enough to let you hear the silence.",
        "Someone didn’t make it through the night.",
        "{victimName} is dead.",
        "And now the lodge knows it can take one of you whenever it wants."
      ],
    },
    {
      id: "night_result_no_death_1",
      intent: "reveal_no_death",
      weight: 1,
      lines: [
        "Morning breaks, slow and gray.",
        "Everyone is still here.",
        "No one died last night.",
        "Relief should feel warmer than this.",
        "Instead it feels like someone missed… or someone was saved."
      ],
    },
    {
      id: "night_result_no_death_2",
      intent: "reveal_no_death",
      weight: 1,
      lines: [
        "The lodge wakes up with all the same faces.",
        "No one is missing.",
        "No one is dead.",
        "That doesn’t mean no one tried."
      ],
    },
  ],

  /**
   * ─────────────────────────────
   * GENERIC DAY PROMPTS (Day 2+)
   * Used at the start of each day AFTER night results.
   * Engine should pick ONE.
   * ─────────────────────────────
   */
  day_prompt: [
    {
      id: "day_prompt_1",
      intent: "day_discussion_vote",
      weight: 1,
      lines: [
        "Daylight returns, and with it… permission to accuse.",
        "Talk. Compare stories. Watch reactions.",
        "Then make a decision.",

        "Narrator: Discuss, then vote.",
        "Choose carefully — you don’t get unlimited mistakes."
      ],
    },
    {
      id: "day_prompt_2",
      intent: "day_discussion_vote",
      weight: 1,
      lines: [
        "Everyone looks a little more awake now.",
        "Not because they slept — because they’re scared.",
        "This is where you decide what you believe.",

        "Narrator: You may discuss.",
        "When you’re ready, cast your vote."
      ],
    },
    {
      id: "day_prompt_3",
      intent: "day_discussion_vote",
      weight: 1,
      lines: [
        "The lodge is bright enough to see faces clearly.",
        "It’s still dark enough to hide intent.",
        "Find a pattern. Find a lie.",

        "Narrator: Debate, then vote.",
        "You’re choosing who doesn’t get another night."
      ],
    },
  ],

  /**
   * ─────────────────────────────
   * DAY RESULTS (after vote resolves)
   * Engine fills {eliminatedName} and optionally {wasAlignmentHint}.
   * Keep it ambiguous unless you want explicit alignment reveals.
   * ─────────────────────────────
   */
  day_result: [
    {
      id: "day_result_1",
      intent: "reveal_vote_elimination",
      weight: 1,
      lines: [
        "The room reaches a decision.",
        "It’s not unanimous — it never is.",
        "{eliminatedName} is removed from the lodge.",
        "Some people look satisfied.",
        "Some people look relieved.",
        "And at least one person looks like they just got away with something."
      ],
    },
    {
      id: "day_result_2",
      intent: "reveal_vote_elimination",
      weight: 1,
      lines: [
        "The talking stops when the choice becomes real.",
        "Votes are cast. Eyes avoid meeting other eyes.",
        "{eliminatedName} is gone by the end of it.",
        "Now you live with what you decided."
      ],
    },
    {
      id: "day_result_no_elimination_1",
      intent: "reveal_no_elimination",
      weight: 1,
      lines: [
        "You argue in circles until the daylight starts to fade.",
        "No decision holds.",
        "No one is removed today.",
        "Night comes anyway — and it doesn’t care that you hesitated."
      ],
    },
  ],
};
