const modifierData = {
  Mafia: {
    Armed: {
      internal: ["StartWithGun"],
      description: "Starts with a gun.",
      allowDuplicate: true,
    },
    Rifled: {
      internal: ["StartWithRifle"],
      description: "Starts with a rifle.",
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
    Luminous: {
      internal: ["StartWithCandle"],
      description: "Starts with a candle.",
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
    Macabre: {
      internal: ["StartWithSyringe"],
      description: "Starts with a syringe.",
      allowDuplicate: true,
    },
    Prosaic: {
      internal: ["StartWithEnvelope"],
      description: "Starts with an envelope.",
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
        "Appears as Villager (Village) / Mafioso (Mafia) / Cultist (Cult) / Grouch (Independent) to self with no modifier.",
      incompatible: ["Respected", "Scatterbrained", "Exposed"],
    },
    Scatterbrained: {
      internal: ["Scatterbrained"],
      description:
        "Appears as Visitor (Village) / Trespasser (Mafia) / Bogeyman (Cult) / Fool (Independent) to self with no modifier.",
      incompatible: ["Humble", "Respected", "Exposed"],
    },
    Modest: {
      internal: ["Modest"],
      description: "Appears to self with no modifiers.",
      incompatible: ["Exposed"],
    },
    Lone: {
      internal: ["ModifierLone"],
      description:
        "If this role typically has a group meeting at night, they will not meet with or know the identity of their partner(s). Can join their regular meeting, at the cost of their role.",
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
      internal: ["ModifierBloodthirsty"],
      description: "When visiting, their target will be killed.",
    },
    Loud: {
      internal: ["ModifierLoud"],
      description:
        "If visited, cries out the identity of players who visited them during the night. All reports received are announced to everyone, with the player's role revealed. All whispers involving a player with this modifier are leaked.",
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
      description:
        "Kills anyone (up to two people) who tries to convert them at night.",
    },
    Frustrated: {
      internal: ["FrustratedCondemnation"],
      description:
        "Cannot be condemned by majority vote. A non-zero minority vote will kill the target.",
      incompatible: ["Diplomatic"],
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
      description: "While visiting a player, that player will be roleblocked.",
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
      internal: ["AppearAsRandomEvil"],
      description:
        "Appears as Mafioso when investigated or condemned. Appears as their real role on death.",
      incompatible: ["Blasphemous", "Faceless", "Unassuming"],
    },
    Faceless: {
      internal: ["AppearAsFliplessOnDeath"],
      description:
        "Player's role will be hidden from the town when condemned or on death.",
      incompatible: ["Shady", "Blasphemous", "Unassuming"],
    },
    Unassuming: {
      internal: ["AppearAsVillagerOnDeath"],
      description: "Appears as Villager when condemned or on death.",
      incompatible: ["Shady", "Blasphemous", "Faceless"],
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
      description: "Secondary actions can only be used on dead players.",
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
      description:
        "Will passively convert to the role of the first aligned power role.",
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
      description:
        "Will sacrifice themselves and die, if they ever visit another player.",
    },
    Social: {
      internal: ["MeetWithSocial"],
      description: "Attends a meeting with all other Social players.",
    },
    Acquainted: {
      internal: ["MeetWithAcquainted"],
      description:
        "Attends a meeting with and is aware of the roles of all other Acquainted players.",
    },
    Tinkering: {
      internal: ["ForageItem"],
      description:
        "Crafts a random item if not visited during the night. If killed, the killer will find a gun that always reveals.",
    },
    Apprehensive: {
      internal: ["LearnVisitorsAndArm"],
      description:
        "Will receive a Gun (that will not reveal shooter) with each visit and learn the name of the visitor.",
    },
    Klutzy: {
      internal: ["DropOwnItems"],
      description: "Will passively drop any items held or received.",
    },
    Masked: {
      internal: ["DisguiseAsTarget"],
      description: "Gains a suit of each target's role.",
    },
    Camouflaged: {
      internal: ["AppearAsRandomRole"],
      description:
        "Appears as a random role in the game that is not Villager, Impersonator or Impostor.",
    },
    Omniscient: {
      internal: ["Omniscient"],
      description: "Each night see all visits and learn all players roles.",
    },
    Unkillable: {
      internal: ["KillImmune"],
      description: "Cannot be killed at night.",
    },
    Bouncy: {
      internal: ["Bouncy"],
      description:
        "If possible night kills will be redirected to another player of the same alignment.",
    },
    Banished: {
      internal: ["BanishedRole"],
      description:
        "Banished roles will not spawn normally in closed setups or role group setups. Banished roles will only spawn if the banished count is increased or if another roles adds Banished roles to the game.",
      incompatible: ["Inclusive", "Exclusive"],
    },
    Inclusive: {
      internal: ["Add1Banished"],
      description: "Adds 1 Banished Role in Closed Setups.",
      allowDuplicate: true,
      incompatible: ["Banished", "Exclusive"],
    },
    Exclusive: {
      internal: ["Remove1Banished"],
      description: "Removes 1 Banished Role in Closed Setups.",
      allowDuplicate: true,
      incompatible: ["Banished", "Inclusive"],
    },
    Insightful: {
      internal: ["Learn3ExcessRoles"],
      description:
        "On night 1 learn 3 Excess Roles. Mafia/Cult roles will Always learn Village-Aligned Excess roles.",
    },
    Verrucose: {
      internal: ["GivePermaMindRot"],
      description:
        "On death a random Village Aligned player will be chosen to be inflicted with Mind Rot for the rest of the game.",
    },
    Rotten: {
      internal: ["Rotten"],
      description:
        "At the start of the game is inflicted with Mind Rot for the rest of the game.",
      incompatible: ["Infected"],
    },
    Infected: {
      internal: ["MindRot50Percent"],
      description:
        "Each night has 50% chance to be inflicted with Mind Rot for that night.",
      incompatible: ["Rotten"],
    },
    Narcissistic: {
      internal: ["TargetSelf50Percent"],
      description:
        "Each night has 50% chance to be redirected onto themselves.",
    },
    Blessed: {
      internal: ["StartWithExtraLife"],
      description: "Starts with an Extra Life",
    },
    Wise: {
      internal: ["MakePlayerLearnOneOfTwoPlayersOnDeath"],
      description: "On death learn that 1 of 2 players is evil.",
    },
    Dovish: {
      internal: ["VillageMightSurviveCondemn"],
      description:
        "While a role with this modifier is in play, Village-aligned players might survive being condemned",
    },
    Married: {
      internal: ["LearnAndLifeLinkToPlayer"],
      description:
        "On Night 1 will learn a player and their role. If that player is killed during the Night at Any Point in the game, You die.",
    },
    Unlucky: {
      internal: ["UnluckyDeath"],
      description: "After Night 1, You can die at any time.",
    },
    Clannish: {
      internal: ["AddRottenCopy"],
      description:
        "In closed Setups will add 0 to 2 Copies of This Role, 1 of the added roles is Permanently inflicted with Mind Rot.",
    },
    Chaotic: {
      internal: ["BecomeExcessRole"],
      description:
        "On the first night, a player with this modifier will become a random excess role within their alignment. Independents will become excess roles from any alignment.",
    },
    Retired: {
      internal: ["Retired"],
      description:
        "This will become a Vanilla role at the Start of the game will start knowing any players with the Orignal role.",
    },
    Sensible: {
      internal: ["LearnIfRoleChanged"],
      description: "Each night learn what their role is.",
    },
    Neighborly: {
      internal: ["MeetWithNeighbors"],
      description: "Attends a Night Meeting with their Neighbors.",
    },
    /*
    Red: {
      internal: ["BecomeRedMafia"],
      description: "Joins the Red Mafia.",
    },
    */
  },
  "Split Decision": {},
  Resistance: {},
  Ghost: {},
  Jotto: {},
  Acrotopia: {},
  "Secret Dictator": {},
  "Secret Hitler": {},
  "Wacky Words": {},
  "Liars Dice": {},
};

module.exports = modifierData;
