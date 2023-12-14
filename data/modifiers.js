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
    Bulletproof: {
      internal: ["StartWithArmor"],
      description: "Starts with armor.",
      allowDuplicate: true,
    },
    Churchgoing: {
      internal: ["StartWithTract"],
      description: "Starts with a tract.",
      allowDuplicate: true,
    },
    Steeled: {
      internal: ["StartWithKnife"],
      description: "Starts with a knife.",
      allowDuplicate: true,
    },
    Birdbrained: {
      internal: ["StartWithFalcon"],
      description: "Starts with a falcon.",
      allowDuplicate: true,
    },
    Crystalline: {
      internal: ["StartWithCrystal"],
      description: "Starts with a crystal ball.",
      allowDuplicate: true,
    },
    Exposed: {
      internal: ["PublicReveal"],
      description: "Starts revealed to everyone.",
      incompatible: ["Humble", "Scatterbrained", "Respected", "Modest"],
    },
    Respected: {
      internal: ["VillagerToInvestigative"],
      description: "Appears as a Villager to investigative roles.",
      incompatible: ["Humble", "Scatterbrained", "Exposed"],
    },
    Humble: {
      internal: ["Humble"],
      description:
        "Appears as Villager (Village) / Mafioso (Mafia) / Cultist (Cult) / Grouch (Independent/Hostile) to self with no modifier.",
      incompatible: ["Respected", "Scatterbrained", "Exposed"],
    },
    Scatterbrained: {
      internal: ["Scatterbrained"],
      description:
        "Appears as Visitor (Village) / Trespasser (Mafia) / Bogeyman (Cult) / Fool (Independent/Hostile) to self with no modifier.",
      incompatible: ["Humble", "Respected", "Exposed"],
    },
    Modest: {
      internal: ["Modest"],
      description: "Appears to self with no modifiers",
      incompatible: ["Exposed"],
    },
    Lone: {
      internal: ["Lone"],
      description: "Does not attend the Mafia/Monsters/Cop/Templar meeting.",
    },
    Oblivious: {
      internal: ["Oblivious"],
      description:
        "Does not know the identities of their partners, and does not attend to Mafia/Cult meeting.",
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
      incompatible: ["Lazy", "Odd", "One Shot", "Even"],
    },
    Even: {
      internal: ["Even"],
      description:
        "Can only attend secondary meetings on even days and nights.",
      incompatible: ["Lazy", "Odd", "One Shot", "Delayed"],
    },
    Odd: {
      internal: ["Odd"],
      description: "Can only attend secondary meetings on odd days and nights.",
      incompatible: ["Lazy", "Even", "One Shot", "Delayed"],
    },
    Lazy: {
      internal: ["ModifierLazy"],
      description:
        "Actions taken on night will only execute after a full day/night phase.",
      incompatible: ["Delayed", "Odd", "One Shot", "Even"],
    },
    "One Shot": {
      internal: ["OneShot"],
      description: "Can only perform actions once.",
      incompatible: ["Lazy", "Even", "Odd", "Delayed"],
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
    Reactionary: {
      internal: ["KillConverters"],
      description: "Kills anyone (up to two people) who tries to convert them at night.",
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
    Seductive: {
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
        "If this player visits a player of the same alignment, their secondary actions will be blocked.",
      incompatible: ["Loyal"],
    },
    Loyal: {
      internal: ["Loyal"],
      description:
        "If this player visits a player of the opposite alignment, their secondary actions will be blocked.",
      incompatible: ["Disloyal"],
    },
    Hemophilic: {
      internal: ["ConvertKillToBleed"],
      description:
        "If this player is shot or targeted for a kill, will bleed and then die in one day.",
    },
    Shady: {
      internal: ["AppearAsMafioso"],
      description:
        "Appears as Mafioso when investigated or condemned. Appears as their real role on death.",
      incompatible: ["Blasphemous", "Flipless"],
    },
    Blasphemous: {
      internal: ["AppearAsCultist"],
      description:
        "Appears as Cultist when investigated or condemned. Appears as their real role on death.",
      incompatible: ["Shady", "Flipless"],
    },
    Flipless: {
      internal: ["AppearAsFliplessOnDeath"],
      description:
        "Player's role will be hidden from the town when condemned or on death.",
      incompatible: ["Shady", "Blasphemous"],
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
    Macho: {
      internal: ["SaveImmune"],
      description: "Can not be saved or protected from kills by any means.",
    },
    Clueless: {
      internal: ["Clueless"],
      description: "Sees all speech as coming from random people.",
    },
    Blind: {
      internal: ["Blind"],
      description: "Sees all speech as anonymous.",
    },
    Gunslinging: {
      internal: ["DefendAndSnatchGun"],
      description: "80% chance of snatching a gun when shot at.",
    },
    Telepathic: {
      internal: ["ModifierTelepathic"],
      description: "May anonymously contact any player.",
    },
    Gossipy: {
      internal: ["AllWhispersLeak"],
      description:
        "All whispers involving a player with this modifier are leaked.",
    },
    Simple: {
      internal: ["Simple"],
      description:
        "If this player visits a player with a power role, all their actions will be blocked.",
      incompatible: ["Complex"],
    },
    Complex: {
      internal: ["Complex"],
      description:
        "If this player visits a player with a vanilla role, all their actions will be blocked.",
      incompatible: ["Simple"],
    },
    Morbid: {
      internal: ["VisitOnlyDead"],
      description: "Secondary actions can only visit dead players.",
    },
    Restless: {
      internal: ["ActWhileDead"],
      description: "Can only perform secondary actions while dead.",
    },
    Transcendent: {
      internal: ["ActAliveOrDead"],
      description: "Can perform secondary actions while either alive or dead.",
    },
    Kleptomaniac: {
      internal: ["StealFromTargets"],
      description:
        "While visiting a player, that player's items will be stolen.",
    },
    Pious: {
      internal: ["ConvertKillersOnDeath"],
      description: "On death, has a chance to redeem their killer.",
    },
    Checking: {
      internal: ["CheckSuccessfulVisit"],
      description: "Learns if their visit was successful or if it was blocked.",
    },
    Versatile: {
      internal: ["InheritFirstDeadAligned"],
      description: "Will passively convert to the role of the first aligned power role.",
    },
    Commuting: {
      internal: ["Commuting"],
      description: "Is untargetable from all actions.",
    },
    Ascetic: {
      internal: ["Ascetic"],
      description: "Is untargetable from all non-killing actions.",
    },
    Regretful: {
      internal: ["Regretful"],
      description: "Will be killed if their target was killed.",
    },
    Sacrificial: {
      internal: ["Sacrificial"],
      description: "Will sacrifice themselves and die, if they ever visit another player.",
    },
    Gregarious: {
      internal: ["Gregarious"],
      description: "Will passively invite all targets to a secret hangout.",
    },
    Social: {
      internal: ["MeetWithSocial"],
      description: "Attends a meeting with all other Social players.",
    },
    Acquainted: {
      internal: ["MeetWithAcquainted"],
      description: "Attends a meeting with and is aware of the roles of all other Acquainted players.",
    },
    Tinkering: {
      internal: ["ForageItem"],
      description: "Crafts a random item if not visited during the night. If killed, the killer will find a gun that always reveals.",
    },
  },
  "Split Decision": {},
  Resistance: {},
  "One Night": {},
  Ghost: {},
  Jotto: {},
  Acrotopia: {},
  "Secret Dictator": {},
  "Secret Hitler": {},
  "Wacky Words": {},
};

module.exports = modifierData;
