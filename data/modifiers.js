const modifierData = {
  Mafia: {
    Acquainted: {
      internal: ["MeetWithAcquainted"],
      description:
        "Attends a meeting with and is aware of the roles of all other Acquainted players.",
    },
    Affable: {
      internal: ["Affable"],
      hidden: true,
      description: "Passively adds targets to a separate hangout every night.",
    },
    Astral: {
      internal: ["Astral"],
      description: "All actions done by this player do not appear as visits.",
    },
    Ascetic: {
      internal: ["Ascetic"],
      description: "Is untargetable from all non-killing actions.",
    },
    Armed: {
      internal: ["StartWithGun"],
      description: "Starts with a gun.",
      allowDuplicate: true,
    },
    Apprehensive: {
      internal: ["LearnVisitorsAndArm"],
      description: "Will receive a Gun (that will not reveal shooter) with each visit and learn the name of the visitor.",
    },
    Blind: {
      internal: ["Blind"],
      description: "Sees all speech as anonymous.",
    },
    Bloodthirsty: {
      internal: ["Bloodthirsty"],
      description: "Needs to kill other players to stay alive.",
    },
    Bulletproof: {
      internal: ["StartWithArmor"],
      description: "Starts with armor.",
      allowDuplicate: true,
    },
    Camouflaged: {
      internal: ["AppearAsRandomRole"],
      hidden: false,
      description: "Appears as a random role (that is not Villager, Impersonator or Impostor).",
    },
    Checking: {
      internal: ["CheckSuccessfulVisit"],
      description: "Learns if their visit was successful or if it was blocked.",
    },
    Churchgoing: {
      internal: ["StartWithTract"],
      description: "Starts with a tract.",
      allowDuplicate: true,
    },
    Clueless: {
      internal: ["Clueless"],
      description: "Sees all speech as coming from random people.",
    },
    Clumsy: {
      internal: ["RevealRoleToTarget"],
      description: "Announces the player's role to the targets of their night actions.",
    },
    Commuting: {
      internal: ["Commuting"],
      description: "Is untargetable from all actions.",
    },
    Complex: {
      internal: ["Complex"],
      description:
        "If this player visits a player with a vanilla role, all their actions will be blocked.",
      incompatible: ["Simple"],
    },
    Crystalline: {
      internal: ["StartWithCrystal"],
      description: "Starts with a crystal ball.",
      allowDuplicate: true,
    },
    Delayed: {
      internal: ["Delayed"],
      description:
        "Cannot attend secondary meetings for the first day and night.",
      incompatible: ["Lazy", "Odd", "One Shot", "Even"],
    },
    Diplomatic: {
      internal: ["CondemnImmune"],
      description: "Cannot be condemned.",
      incompatible: ["Frustrated"],
    },
    Disloyal: {
      internal: ["Disloyal"],
      description:
        "If this player visits a player of the same alignment, their secondary actions will be blocked.",
      incompatible: ["Loyal"],
    },
    Explosive: {
      internal: ["StartWithBomb"],
      description: "Starts with a bomb.",
      allowDuplicate: true,
    },
    Exposed: {
      internal: ["PublicReveal"],
      description: "Starts revealed to everyone.",
      incompatible: ["Humble", "Scatterbrained", "Respected", "Modest"],
    },
    Even: {
      internal: ["Even"],
      description:
        "Can only attend secondary meetings on even days and nights.",
      incompatible: ["Lazy", "Odd", "One Shot", "Delayed"],
    },
    Faceless: {
      internal: ["AppearAsFliplessOnDeath"],
      description:
        "Player's role will be hidden from the town when condemned or on death.",
      incompatible: ["Shady", "Blasphemous"],
    },
    Frustrated: {
      internal: ["FrustratedCondemnation"],
      description:
        "Cannot be condemned by majority vote. A non-zero minority vote will kill the target.",
      incompatible: ["Diplomatic"],
    },
    Gossipy: {
      internal: ["AllWhispersLeak"],
      description:
        "All whispers involving a player with this modifier are leaked.",
    },
    Gunslinging: {
      internal: ["DefendAndSnatchGun"],
      description: "80% chance of snatching a gun when shot at.",
    },
    Hemophilic: {
      internal: ["ConvertKillToBleed"],
      description:
        "If this player is shot or targeted for a kill, will bleed and then die in one day.",
    },
    Klutzy: {
      internal: ["DropOwnItems"],
      description: "Will passively drop any items held or received.",
    },
    Kleptomaniac: {
      internal: ["StealFromTargets"],
      description:
        "While visiting a player, that player's items will be stolen.",
    },
    Linchpin: {
      internal: ["KillAlignedOnDeath"],
      description: "If dead, all aligned players will die too.",
    },
    Linchpin: {
      internal: ["KillAlignedOnDeath"],
      description: "If dead, all aligned players will die too.",
    },
    Lone: {
      internal: ["Lone"],
      description: "Does not attend the Mafia/Monsters/Cop/Templar meeting.",
    },
    Loud: {
      internal: ["Loud"],
      description:
        "All reports received are announced to everyone, with the player's role revealed.",
    },
    Loudmouthed: {
      internal: ["CryOutVisitors"],
      description:
        "If visited, cries out the identity of players who visited them during the night.",
    },
    Macho: {
      internal: ["SaveImmune"],
      description: "Can not be saved or protected from kills by any means.",
    },
    Macabre: {
      internal: ["StartWithSyringe"],
      description: "Starts with a syringe.",
      allowDuplicate: true,
    },
    Masked: {
      internal: ["DisguiseAsTarget"],
      description: "Gains a suit of each target's role.",
    },
    Modest: {
      internal: ["Modest"],
      description: "Appears to self with no modifiers",
      incompatible: ["Exposed"],
    },
    Morbid: {
      internal: ["VisitOnlyDead"],
      description: "Secondary actions can only visit dead players.",
    },
    Noisy: {
      internal: ["RevealNameToTarget"],
      description:
        "Announces the player's name to the targets of their night actions.",
    },
    Oblivious: {
      internal: ["Oblivious"],
      description:
        "Does not know the identities of their partners, and does not attend to Mafia/Cult meeting.",
    },
    Odd: {
      internal: ["Odd"],
      description: "Can only attend secondary meetings on odd days and nights.",
      incompatible: ["Lazy", "Even", "One Shot", "Delayed"],
    },
    Preoccupied: {
      internal: ["BlockIfVisited"],
      description:
        "If visited during the night, blocks the player's night action.",
    },
    Prosaic: {
      internal: ["StartWithEnvelope"],
      description: "Starts with an envelope.",
      allowDuplicate: true,
    },
    Reactionary: {
      internal: ["KillConverters"],
      description:
        "Kills anyone (up to two people) who tries to convert them at night.",
    },
    Regretful: {
      internal: ["Regretful"],
      description: "Will be killed if their target was killed.",
    },
    Respected: {
      internal: ["VillagerToInvestigative"],
      description: "Appears as a Villager to investigative roles.",
      incompatible: ["Humble", "Scatterbrained", "Exposed"],
    },
    Resolute: {
      internal: ["Resolute"],
      description:
        "All actions done by this player cannot be roleblocked or controlled.",
    },
    Scatterbrained: {
      internal: ["Scatterbrained"],
      description:
        "Appears as Visitor (Village) / Trespasser (Mafia) / Bogeyman (Cult) / Fool (Independent/Hostile) to self with no modifier.",
      incompatible: ["Humble", "Respected", "Exposed"],
    },
    Sacrificial: {
      internal: ["Sacrificial"],
      description:
        "Will sacrifice themselves and die, if they ever visit another player.",
    },
    Seductive: {
      internal: ["BlockTargets"],
      description: "Blocks a player's target in their night action.",
    },
    Simple: {
      internal: ["Simple"],
      description:
        "If this player visits a player with a power role, all their actions will be blocked.",
      incompatible: ["Complex"],
    },
    Social: {
      internal: ["MeetWithSocial"],
      description: "Attends a meeting with all other Social players.",
    },
    Solitary: {
      internal: ["Lone"],
      hidden: true,
      description: "Backwards compatible for Lone.",
    },
    Steeled: {
      internal: ["StartWithKnife"],
      description: "Starts with a knife.",
      allowDuplicate: true,
    },
    Telepathic: {
      internal: ["ModifierTelepathic"],
      description: "May anonymously contact any player.",
    },
    Tinkering: {
      internal: ["ForageItem"],
      description:
        "Crafts a random item if not visited during the night. If killed, the killer will find a gun that always reveals.",
    },
    Traitorous: {
      internal: ["TurnIntoTraitorOnMafiaKill"],
      description: "If killed by the Mafia, will turn into a Traitor instead.",
    },
    Transcendent: {
      internal: ["ActAliveOrDead"],
      description: "Can perform secondary actions while either alive or dead.",
    },
    Unwavering: {
      internal: ["ConvertImmune"],
      description: "Cannot be converted to another role.",
    },
    Vain: {
      internal: ["Vain"],
      description:
        "If this player visits a player of the same alignment, they die.",
      incompatible: ["Weak"],
    },
    Versatile: {
      internal: ["InheritFirstDeadAligned"],
      description:
        "Will passively convert to the role of the first aligned power role.",
    },
    Weak: {
      internal: ["Weak"],
      description:
        "If this player visits a player of the opposite alignment, they die.",
      incompatible: ["Vain"],
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
