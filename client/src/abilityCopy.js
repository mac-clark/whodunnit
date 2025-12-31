// client/src/games/whodunnit/abilityCopy.js

export const ABILITY_COPY = {
  mafia_kill: {
    title: "Choose someone to eliminate",
    description:
      "You are the acting Mafia member tonight. Choose the group’s target. Only one Mafia kill happens tonight.",
    confirmLabel: "Confirm Kill",
  },
  
  kill: {
    title: "Choose someone to eliminate",
    description:
      "You and your allies must decide on a single target. Only one kill will occur tonight.",
    confirmLabel: "Confirm Kill",
  },

  protect: {
    title: "Choose someone to protect",
    description:
      "Your target will survive any attack tonight, if one occurs.",
    confirmLabel: "Confirm Protection",
  },

  investigate_alignment: {
    title: "Choose someone to investigate",
    description:
      "You will learn whether this player aligns with the town or its enemies.",
    confirmLabel: "Confirm Investigation",
  },

  block: {
    title: "Choose someone to block",
    description:
      "Your target will be unable to perform their night action tonight.",
    confirmLabel: "Confirm Block",
  },

  silence: {
    title: "Choose someone to silence",
    description:
      "Your target will be unable to speak or vote during the next day.",
    confirmLabel: "Confirm Silence",
  },
};