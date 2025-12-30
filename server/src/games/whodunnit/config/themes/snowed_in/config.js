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
  // (Theme flavor only — abilities live in roles.js)
  // ─────────────────────────────

  roleMap: {
    // Town
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
      // ✅ fallback civilian (generic)
      {
        name: "The Guest",
        description:
          "Just another attendee trying to ride out the storm. No one knows what you’ll do when things turn.",
        objective:
          "Survive, observe, and help the group uncover who’s causing the lodge to fall apart.",
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

    mayor: [
      {
        name: "The Lodge Manager",
        description:
          "Used to being listened to — and used to getting their way — even when the lodge is collapsing.",
        objective:
          "Guide the group’s decisions without revealing how much influence you have.",
      },
    ],

    vigilante: [
      {
        name: "The Armed Guest",
        description:
          "Came prepared. You didn’t expect to need it here — but the storm changes everything.",
        objective:
          "Remove a threat before they remove you — without becoming the villain.",
      },
    ],

    // Mafia
    mafia: [
      {
        name: "The Saboteur",
        description: "Knows exactly when the power went out — and why.",
        objective: "Ensure the lodge never returns to normal operation.",
      },
    ],

    godfather: [
      {
        name: "The Organizer",
        description: "The retreat wasn’t their idea — but the chaos was.",
        objective: "Maintain control without ever appearing involved.",
      },
    ],

    consigliere: [
      {
        name: "The Quiet Advisor",
        description:
          "Soft-spoken and observant — always asking the right question at the right time.",
        objective:
          "Identify threats to your side before daylight makes it messy.",
      },
    ],

    blackmailer: [
      {
        name: "The Eavesdropper",
        description:
          "Somehow always nearby when secrets slip. Knows what to keep — and what to leverage.",
        objective:
          "Control the conversation by silencing the most dangerous voice.",
      },
    ],

    // Independent
    serial_killer: [
      {
        name: "The Stranger",
        description:
          "No one remembers inviting them. Somehow, they’re still here.",
        objective: "Leave the lodge as the only one still breathing.",
      },
    ],

    roleblocker: [
      {
        name: "The Distraction",
        description:
          "Always needs something. Always pulls someone away at the worst moment.",
        objective:
          "Stop the night from going as planned — and keep yourself alive.",
      },
    ],
  },

  // ─────────────────────────────
  // Player-facing Role Briefs
  // (Theme wording for abilities + when they matter)
  // ─────────────────────────────

  roleBriefs: {
    narrator: {
      ability: "You guide the group, reveal prompts, and advance phases.",
      when: "Always. You never vote as a normal player, and you can’t be targeted.",
    },

    civilian: {
      ability: null,
      when:
        "No special abilities. Focus on reading people, sharing info, and voting wisely.",
    },

    detective: {
      ability:
        "Each night, you may investigate one player to learn their alignment.",
      when: "You’ll be prompted during the night phase.",
    },

    doctor: {
      ability:
        "Each night, you may protect one player from being eliminated.",
      when: "You’ll be prompted during the night phase.",
    },

    mayor: {
      ability: "Your vote counts twice during the daytime vote.",
      when: "Applies automatically during the day vote (no night prompt).",
    },

    vigilante: {
      ability: "You may eliminate a player at night (limited uses).",
      when: "You’ll be prompted during the night phase if you have charges remaining.",
    },

    mafia: {
      ability: "Each night, your team chooses one player to eliminate.",
      when: "You’ll coordinate during the night phase. Blend in during the day.",
    },

    godfather: {
      ability:
        "You lead the Mafia. Investigations may see you as innocent.",
      when: "Night phase for actions. Day phase for deception and steering suspicion.",
    },

    consigliere: {
      ability:
        "Each night, you may investigate one player to learn their alignment.",
      when: "You’ll be prompted during the night phase.",
    },

    blackmailer: {
      ability:
        "Each night, choose a player to silence during the next day.",
      when: "You’ll be prompted during the night phase.",
    },

    serial_killer: {
      ability:
        "Each night, you may eliminate a player. You win by being the last alive.",
      when: "You act during the night phase. You work alone.",
    },

    roleblocker: {
      ability:
        "Each night, choose a player to block — their ability won’t work tonight.",
      when: "You’ll be prompted during the night phase.",
    },
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
