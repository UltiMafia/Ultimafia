const modifierData = {
  Mafia: {
    Armed: {
      internal: ["StartWithGun"],
      description: "Starts with a gun.",
      allowDuplicate: true,
      priority: 0,
    },
    Explosive: {
      internal: ["StartWithBomb"],
      description: "Starts with a bomb.",
      allowDuplicate: true,
      priority: 0,
    },
    Armored: {
      internal: ["StartWithArmor"],
      description: "Starts with armor.",
      allowDuplicate: true,
      priority: 0,
    },
    Exposed: {
      internal: ["PublicReveal"],
      description: "Starts revealed to everyone.",
      incompatible: ["Humble", "Modest", "Scatterbrained", "Chameleon"],
      priority: 0,
    },
    Chameleon: {
      internal: ["VillagerToInvestigative"],
      description: "Appears as a Villager to investigative roles.",
      incompatible: ["Humble", "Modest", "Scatterbrained", "Exposed"],
      priority: 0,
    },
    Humble: {
      internal: ["Humble"],
      description: "Appears as Villager to self with no modifier.",
      incompatible: ["Chameleon", "Modest", "Scatterbrained", "Exposed"],
      priority: 0,
    },
    Modest: {
      internal: ["Modest"],
      description: "Appears as Villager (Village) / Mafioso (Mafia) / Cultist (Cult) / Grouch (Independent) to self with no modifier.",
      incompatible: ["Chameleon", "Humble", "Scatterbrained", "Exposed"],
      priority: 0,
    },
    Scatterbrained: {
      internal: ["Scatterbrained"],
      description: "Appears as Visitor (Village) / Trespasser (Mafia) / Lycan (Cult) / Fool (Independent) to self with no modifier.",
      incompatible: ["Humble", "Modest", "Chameleon", "Exposed"],
      priority: 0,

    },
    Lone: {
      internal: ["Lone"],
      description: "Does not attend the Mafia/Monsters/Cop/Templar meeting.",
      priority: 0,
    },
    Solitary: {
      internal: ["Solitary"],
      hidden: true,
      description: "Same as lone (backwards compatibility).",
      priority: 0,
    },
    Delayed: {
      internal: ["Delayed"],
      description: "Cannot attend secondary meetings for the first day and night.",
      incompatible: ["Odd", "One Shot", "Even"],
      priority: 0,
    },
    Even: {
      internal: ["Even"],
      description: "Can only attend secondary meetings on even days and nights.",
      incompatible: ["Odd", "One Shot", "Delayed"],
      priority: 0,
    },
    Odd: {
      internal: ["Odd"],
      description: "Can only attend secondary meetings on odd days and nights.",
      incompatible: ["Even", "One Shot", "Delayed"],
      priority: 0,
    },
    "One Shot": {
      internal: ["OneShot"],
      description: "Can only perform actions once.",
      incompatible: ["Even", "Odd", "Delayed"],
      priority: 0,
    },
    Bloodthirsty: {
      internal: ["Bloodthirsty"],
      description: "Needs to kill other players to stay alive.",
      priority: 0,
    },
    Loud: {
      internal: ["Loud"],
      description:
        "All reports received are announced to everyone, with the player's role revealed.",
      priority: 0,
    },
    Astral: {
      internal: ["Astral"],
      description: "All actions done by this player do not appear as visits.",
      priority: 0,
    },
    Unblockable: {
      internal: ["Unblockable"],
      description:
        "All actions done by this player cannot be roleblocked or controlled.",
      priority: 0,
    },
    Unwavering: {
      internal: ["ConvertImmune"],
      description: "Cannot be converted to another role.",
      priority: 0,
    },
    Frustrated: {
      internal: ["FrustratedCondemnation"],
      description:
        "Cannot be condemned by majority vote. A non-zero minority vote will kill the target.",
      priority: 0,
    },
    Loudmouthed: {
      internal: ["CryOutVisitors"],
      description:
        "If visited, cries out the identity of players who visited them during the night.",
      priority: 0,
    },
    Traitorous: {
      internal: ["TurnIntoTraitorOnMafiaKill"],
      description: "If killed by the Mafia, will turn into a Traitor instead.",
      priority: 0,
    },
    Linchpin: {
      internal: ["KillAlignedOnDeath"],
      description: "If dead, all aligned players will die too.",
      priority: 0,
    },
    Friendly: {
      internal: ["BlockTargets"],
      description: "Blocks a player's target in their night action.",
      incompatible: ["Loyal", "Disloyal"],
      priority: 0,
    },
    Preoccupied: {
      internal: ["BlockIfVisited"],
      description:
        "If visited during the night, blocks the player's night action.",
      priority: 0,
    },
    Steeled: {
      internal: ["StartWithKnife"],
      description: "Starts with a knife.",
      allowDuplicate: true,
      priority: 0,
    },
    Vain: {
      internal: ["Vain"],
      description:
        "If this player visits a player of the same alignment, they die.",
        incompatible: ["Weak"],
        priority: 0,
    },
    Weak: {
      internal: ["Weak"],
      description:
        "If this player visits a player of the opposite alignment, they die.",
        incompatible: ["Vain"],
        priority: 0,
    },
    Disloyal: {
      internal: ["Disloyal"],
      description: "If this player visits a player of the same alignment, their actions will be blocked.",
      incompatible: ["Friendly", "Loyal"],
      priority: 0,
    },
    Loyal: {
      internal: ["Loyal"],
      description:
        "If this player visits a player of the opposite alignment, their actions will be blocked.",
        incompatible: ["Friendly", "Disloyal"],
        priority: 0,
    },
    Hemophilic: {
      internal: ["ConvertKillToBleed"],
      description:
        "If this player is shot or targeted for a kill, will bleed and then die in one day.",
        priority: 0,
    },
  },
  "Split Decision": {},
  Resistance: {},
  "One Night": {},
  Ghost: {},
  Jotto: {},
  Acrotopia: {},
  "Secret Hitler": {},
};

module.exports = modifierData;
