const modifierData = {
  Mafia: {
    Armed: {
      internal: ["StartWithGun"],
      description: "Starts with a gun.",
    },
    Explosive: {
      internal: ["StartWithBomb"],
      description: "Starts with a bomb.",
    },
    Armored: {
      internal: ["StartWithArmor"],
      description: "Starts with armor.",
    },
    Exposed: {
      internal: ["PublicReveal"],
      description: "Starts revealed to everyone.",
    },
    Chameleon: {
      internal: ["VillagerToInvestigative"],
      description: "Appears as a Villager to investigative roles.",
    },
    Humble: {
      internal: ["Humble"],
      description: "Appears as Villager to self with no modifier.",
    },
    Modest: {
      internal: ["Modest"],
      description:
        "Appears as Villager (Village) / Mafioso (Mafia) / Cultist (Cult) / Grouch (Independent) to self with no modifier.",
    },
    Scatterbrained: {
      internal: ["Scatterbrained"],
      description:
        "Appears as Visitor (Village) / Trespasser (Mafia) / Lycan (Cult) / Fool (Independent) to self with no modifier.",
    },
    Lone: {
      internal: ["Lone"],
      description: "Does not attend the Mafia/Monsters/Cop/Templar meeting.",
    },
    Solitary: {
      internal: ["Solitary"],
      description: "Same as lone (backwards compatibility).",
    },
    Delayed: {
      internal: ["Delayed"],
      description:
        "Cannot attend secondary meetings for the first day and night.",
    },
    Even: {
      internal: ["Even"],
      description:
        "Can only attend secondary meetings on even days and nights.",
    },
    Odd: {
      internal: ["Odd"],
      description: "Can only attend secondary meetings on odd days and nights.",
    },
    "One Shot": {
      internal: ["OneShot"],
      description: "Can only perform actions once.",
    },
    Bloodthirsty: {
      internal: ["Bloodthirsty"],
      description: "Needs to kill other players to stay alive.",
    },
    Loud: {
      internal: ["Loud"],
      description:
        "All reports received are announced to everyone, with the player's role revealed.",
    },
    Astral: {
      internal: ["Astral"],
      description: "All actions done by this player do not appear as visits.",
    },
    Unblockable: {
      internal: ["Unblockable"],
      description:
        "All actions done by this player cannot be roleblocked or controlled.",
    },
    Unwavering: {
      internal: ["ConvertImmune"],
      description: "Cannot be converted to another role.",
    },
    Frustrated: {
      internal: ["FrustratedCondemnation"],
      description:
        "Cannot be condemned by majority vote. A non-zero minority vote will kill the target.",
    },
    Loudmouthed: {
      internal: ["CryOutVisitors"],
      description:
        "If visited, cries out the identity of players who visited them during the night.",
      Traitorous: {
        internal: ["TurnIntoTraitorOnMafiaKill"],
        description:
          "If killed by the Mafia, will turn into a Traitor instead.",
      },
      Linchpin: {
        internal: ["KillAlignedOnDeath"],
        description: "If dead, all aligned players will die too.",
      },
      Friendly: {
        internal: ["BlockTargets"],
        description: "Blocks a player's target in their night action.",
      },
      Preoccupied: {
        internal: ["BlockIfVisited"],
        description:
          "If visited during the night, blocks the player's night action.",
      },
      Steeled: {
        internal: ["StartWithKnife"],
        description: "Starts with a knife.",
      },
      Vain: {
        internal: ["Vain"],
        description:
          "If this player visits a player of the same alignment, they die.",
      },
      Weak: {
        internal: ["Weak"],
        description:
          "If this player visits a player of the opposite alignment, they die.",
      },
      Disloyal: {
        internal: ["Disloyal"],
        description:
          "If this player visits a player of the same alignment, their actions will be blocked.",
      },
      Loyal: {
        internal: ["Loyal"],
        description:
          "If this player visits a player of the opposite alignment, their actions will be blocked.",
      },
    },
    "Split Decision": {},
    Resistance: {},
    "One Night": {},
    Ghost: {},
    Jotto: {},
    Acrotopia: {},
    "Secret Hitler": {},
  },
};

module.exports = modifierData;
