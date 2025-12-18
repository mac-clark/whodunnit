// src/games/whodunnit/config/themes/snowed_in/config.js

export const themeConfig = {
  id: "snowed_in",
  name: "Snowed In",

  atmosphere: {
    tone: "cold",
    pacing: "slow",
    mood: ["isolation", "paranoia", "unease"],
  },

  visuals: {
    background: "snowed_in_lodge",
  },

  // ─────────────────────────────
  // Character Variants by Role
  // ─────────────────────────────

  roleMap: {
    civilian: [
      {
        name: "The Husband",
        description:
          "Here on a last-ditch marriage counseling retreat. He insists everything is fine.",
        objective:
          "Make it through the trip without anyone learning why he's really here.",
      },
      {
        name: "The Wife",
        description:
          "Agreed to the trip for appearances. Knows more than she lets on.",
        objective:
          "Identify who is lying before deciding who to trust.",
      },
      {
        name: "The Influencer",
        description:
          "Documenting the retreat for followers, even as the power goes out.",
        objective:
          "Survive long enough to uncover something worth posting.",
      },
    ],

    detective: [
      {
        name: "The Investigator",
        description:
          "Invited under vague circumstances. Not officially working this case.",
        objective:
          "Quietly determine who doesn’t belong here.",
      },
    ],

    doctor: [
      {
        name: "The Medic",
        description:
          "Volunteered to attend in case the altitude caused complications.",
        objective:
          "Keep everyone alive — especially yourself.",
      },
    ],

    mafia: [
      {
        name: "The Saboteur",
        description:
          "Knows exactly when the power went out — and why.",
        objective:
          "Ensure the lodge never returns to normal operation.",
      },
    ],

    godfather: [
      {
        name: "The Organizer",
        description:
          "The retreat wasn’t their idea — but the chaos was.",
        objective:
          "Maintain control without ever appearing involved.",
      },
    ],

    serial_killer: [
      {
        name: "The Stranger",
        description:
          "No one remembers inviting them. Somehow, they’re still here.",
        objective:
          "Leave the lodge as the only one still breathing.",
      },
    ],
  },

  // ─────────────────────────────
  // Minigames (declared only)
  // ─────────────────────────────

  minigames: {
    firestarting: {
      enabled: true,
      description:
        "A desperate attempt to keep the lodge warm as the storm worsens.",
    },
  },
};
