const modifierData = {
  Mafia: {
    Armed: {
      internal: ["StartWithGun"],
      description: "Starts with a gun.",
      allowDuplicate: true,
    },
    Explosive: {
      internal: ["StartWithBomb"],
      description: "Starts with a bomb.",
      allowDuplicate: true,
    },
    Armored: {
      internal: ["StartWithArmor"],
      description: "Starts with armor.",
      allowDuplicate: true,
    },
    Steeled: {
      internal: ["StartWithKnife"],
      description: "Starts with a knife.",
      allowDuplicate: true,
    },
    Exposed: {
      internal: ["PublicReveal"],
      description: "Starts revealed to everyone.",
      incompatible: ["Humble", "Modest", "Scatterbrained", "Respected"],
    },
    Respected: {
      internal: ["VillagerToInvestigative"],
      description: "Appears as a Villager to investigative roles.",
      incompatible: ["Humble", "Modest", "Scatterbrained", "Exposed"],
    },
    Humble: {
      internal: ["Humble"],
      description:
        "Appears as Villager (Village) / Mafioso (Mafia) / Cultist (Cult) / Grouch (Independent/Hostile) to self with no modifier.",
      incompatible: ["Respected", "Modest", "Scatterbrained", "Exposed"],
    },
    Modest: {
      internal: ["Humble"],
      hidden: true,
      description: "Backwards compatible for Humble.",
      incompatible: ["Respected", "Scatterbrained", "Exposed"],
    },
    Scatterbrained: {
      internal: ["Scatterbrained"],
      description:
        "Appears as Visitor (Village) / Trespasser (Mafia) / Lycan (Cult) / Fool (Independent/Hostile) to self with no modifier.",
      incompatible: ["Humble", "Modest", "Respected", "Exposed"],
    },
    Lone: {
      internal: ["Lone"],
      description: "Does not attend the Mafia/Monsters/Cop/Templar meeting.",
    },
    Oblivious: {
      internal: ["Oblivious"],
      description: "Does not know the identities of their partners.",
    },
    Solitary: {
      internal: ["Lone"],
      hidden: true,
      description: "Backwards compatible for Lone.",
    },
    Delayed: {
      internal: ["Delayed"],
      description:
        "Cannot attend secondary meetings for the first day and night.",
      incompatible: ["Odd", "One Shot", "Even"],
    },
    Even: {
      internal: ["Even"],
      description:
        "Can only attend secondary meetings on even days and nights.",
      incompatible: ["Odd", "One Shot", "Delayed"],
    },
    Odd: {
      internal: ["Odd"],
      description: "Can only attend secondary meetings on odd days and nights.",
      incompatible: ["Even", "One Shot", "Delayed"],
    },
    "One Shot": {
      internal: ["OneShot"],
      description: "Can only perform actions once.",
      incompatible: ["Even", "Odd", "Delayed"],
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
    Resolute: {
      internal: ["Resolute"],
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
      incompatible: ["Diplomatic"],
    },
    Loudmouthed: {
      internal: ["CryOutVisitors"],
      description:
        "If visited, cries out the identity of players who visited them during the night.",
    },
    Traitorous: {
      internal: ["TurnIntoTraitorOnMafiaKill"],
      description: "If killed by the Mafia, will turn into a Traitor instead.",
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
    Vain: {
      internal: ["Vain"],
      description:
        "If this player visits a player of the same alignment, they die.",
      incompatible: ["Weak"],
    },
    Weak: {
      internal: ["Weak"],
      description:
        "If this player visits a player of the opposite alignment, they die.",
      incompatible: ["Vain"],
    },
    Disloyal: {
      internal: ["Disloyal"],
      description:
        "If this player visits a player of the same alignment, their actions will be blocked.",
      incompatible: ["Loyal"],
    },
    Loyal: {
      internal: ["Loyal"],
      description:
        "If this player visits a player of the opposite alignment, their actions will be blocked.",
      incompatible: ["Disloyal"],
    },
    Hemophilic: {
      internal: ["ConvertKillToBleed"],
      description:
        "If this player is shot or targeted for a kill, will bleed and then die in one day.",
    },
    Shady: {
      internal: ["GuiltyAppearance"],
      description:
        "Appears as Mafioso when investigated or condemned. Appears as their real role on death.",
    },
    Noisy: {
      internal: ["RevealNameToTarget"],
      description:
        "Announces the player's name to the targets of their night actions.",
    },
    Clumsy: {
      internal: ["RevealRoleToTarget"],
      description:
        "Announces the player's role to the targets of their night actions.",
    },
    Diplomatic: {
      internal: ["CondemnImmune"],
      description: "Cannot be condemned.",
      incompatible: ["Frustrated"],
    },
    Clueless: {
      internal: ["Clueless"],
      description: "Sees all speech as coming from random people.",
    },
    Blind: {
      internal: ["Blind"],
      description: "Sees all speech as anonymous.",
    },
  },
  "Split Decision": {},
  Resistance: {},
  "One Night": {},
  Ghost: {},
  Jotto: {},
  Acrotopia: {},
  "Secret Hitler": {},
  Ashbrook: {},
};

module.exports = modifierData;
