const modifierData = {
  Mafia: {
    Armed: {
      internal: ["StartWithGun"],
      tags: ["Items", "Killing", "Gun", "Day Killer"],
      description: "Starts with a gun.",
      allowDuplicate: true,
    },
    Rifled: {
      internal: ["StartWithRifle"],
      tags: ["Items", "Killing", "Gun", "Alignments", "Day Killer"],
      description: "Starts with a rifle.",
      allowDuplicate: true,
    },
    Explosive: {
      internal: ["StartWithBomb"],
      tags: ["Items", "Killing"],
      description: "Starts with a bomb.",
      allowDuplicate: true,
    },
    Bulletproof: {
      internal: ["StartWithArmor"],
      tags: ["Items", "Armor"],
      description: "Starts with armor.",
      allowDuplicate: true,
    },
    Churchgoing: {
      internal: ["StartWithTract"],
      tags: ["Items", "Convert Saver", "Tract"],
      description: "Starts with a tract.",
      allowDuplicate: true,
    },
    Steeled: {
      internal: ["StartWithKnife"],
      tags: ["Bleeding", "Items", "Knife", "Killing", "Day Killer"],
      description: "Starts with a knife.",
      allowDuplicate: true,
    },
    Luminous: {
      internal: ["StartWithCandle"],
      tags: ["Information", "Items", "Candle", "Visits"],
      description: "Starts with a candle.",
      allowDuplicate: true,
    },
    Birdbrained: {
      internal: ["StartWithFalcon"],
      tags: ["Information", "Items", "Falcon", "Visits"],
      description: "Starts with a falcon.",
      allowDuplicate: true,
    },
    Crystalline: {
      internal: ["StartWithCrystal"],
      tags: ["Revealing", "Items", "Crystal"],
      description: "Starts with a crystal ball.",
      allowDuplicate: true,
    },
    Macabre: {
      internal: ["StartWithSyringe"],
      tags: ["Revive", "Items", "Syringe", "Graveyard"],
      description: "Starts with a syringe.",
      allowDuplicate: true,
    },
    Prosaic: {
      internal: ["StartWithEnvelope"],
      tags: ["Messages", "Items", "Envelope"],
      description: "Starts with an envelope.",
      allowDuplicate: true,
    },
    Exposed: {
      internal: ["PublicReveal"],
      tags: ["Reveal Self"],
      description: "Starts revealed to everyone.",
      incompatible: ["Humble", "Scatterbrained", "Respected", "Modest"],
    },
    Respected: {
      internal: ["VillagerToInvestigative"],
      tags: ["Villager", "Deception"],
      description: "Appears as a Villager to investigative roles.",
      incompatible: ["Humble", "Scatterbrained", "Exposed"],
    },
    Humble: {
      internal: ["Humble"],
      tags: ["Vanilla"],
      description:
        "Appears as Villager (Village) / Mafioso (Mafia) / Cultist (Cult) / Grouch (Independent) to self with no modifier.",
      incompatible: ["Respected", "Scatterbrained", "Exposed"],
    },
    Scatterbrained: {
      internal: ["Scatterbrained"],
      tags: ["Visitor"],
      description:
        "Appears as Visitor (Village) / Trespasser (Mafia) / Bogeyman (Cult) / Fool (Independent) to self with no modifier.",
      incompatible: ["Humble", "Respected", "Exposed"],
    },
    Modest: {
      internal: ["Modest"],
      tags: ["Modifiers"],
      description: "Appears to self with no modifiers.",
      incompatible: ["Exposed"],
    },
    Lone: {
      internal: ["ModifierLone"],
      tags: ["Lone"],
      description:
        "If this role typically has a group meeting at night, they will not meet with or know the identity of their partner(s). Can join their regular meeting, at the cost of their role.",
    },
    Delayed: {
      internal: ["Delayed"],
      tags: ["Delayed", "Meetings"],
      description:
        "Cannot attend secondary meetings for the first day and night.",
      incompatible: ["Lazy", "Odd", "Even", "Exhausted"],
    },
    Suspended: {
      internal: ["Suspended"],
      tags: ["Suspended", "Meetings"],
      description:
        "Can only attend secondary meetings for the first day and night.",
      allowDuplicate: true,
      incompatible: ["Lazy", "Odd", "One Shot", "Even", "Delayed"],
    },
    Even: {
      internal: ["Even"],
      tags: ["Even", "Meetings"],
      description:
        "Can only attend secondary meetings on even days and nights.",
      incompatible: ["Lazy", "Odd", "Delayed", "Exhausted"],
    },
    Odd: {
      internal: ["Odd"],
      tags: ["Odd", "Meetings"],
      description: "Can only attend secondary meetings on odd days and nights.",
      incompatible: ["Lazy", "Even", "Delayed", "Exhausted"],
    },
    Lazy: {
      internal: ["ModifierLazy"],
      tags: ["Manipulative", "Delayed"],
      description:
        "Actions taken on night will only execute after a full day/night phase.",
      incompatible: ["Delayed", "Odd", "Even", "Exhausted"],
    },
    "One Shot": {
      internal: ["OneShot"],
      tags: ["One Shot", "Dawn", "Dusk", "Pregame Actions"],
      description: "Can only perform actions once.",
      incompatible: ["Exhausted"],
    },
    Bloodthirsty: {
      internal: ["ModifierBloodthirsty"],
      tags: ["Visits", "Killing"],
      description: "When visiting, their target will be killed.",
    },
    Loud: {
      internal: ["ModifierLoud"],
      tags: ["Reflexive", "Information", "Whispers"],
      description:
        "If visited, cries out the identity of players who visited them during the night. All reports received are announced to everyone, with the player's role revealed. All whispers involving a player with this modifier are leaked.",
    },
    Astral: {
      internal: ["Astral"],
      tags: ["Visits", "Astral"],
      description: "All actions done by this player do not appear as visits.",
    },
    Resolute: {
      internal: ["Resolute"],
      tags: ["Unblockable"],
      description:
        "All actions done by this player cannot be roleblocked or controlled.",
    },
    Strong: {
      internal: ["StrongModifier"],
      tags: ["Unblockable", "Strong"],
      description: "All kills performed by this player cannot be saved.",
    },
    Unwavering: {
      internal: ["ConvertImmune"],
      tags: ["Convert Saver"],
      description: "Cannot be converted to another role.",
    },
    Reactionary: {
      internal: ["KillConverters"],
      tags: ["Convert Saver", "Killing", "Reflexive"],
      description:
        "Kills anyone (up to two people) who tries to convert them at night.",
    },
    Frustrated: {
      internal: ["FrustratedCondemnation"],
      tags: ["Voting", "Condemn"],
      description:
        "Cannot be condemned by majority vote. A non-zero minority vote will kill the target.",
      incompatible: ["Diplomatic"],
    },
    Traitorous: {
      internal: ["TurnIntoTraitorOnMafiaKill"],
      tags: ["Sacrificial", "Conversion", "Traitor"],
      description: "If killed by the Mafia, will turn into a Traitor instead.",
    },
    Linchpin: {
      internal: ["KillAlignedOnDeath"],
      tags: ["Essential", "Selective Revealing"],
      description: "If dead, all aligned players will die too.",
    },
    Seductive: {
      internal: ["BlockTargets"],
      tags: ["Visits", "Role Blocker"],
      description: "While visiting a player, that player will be roleblocked.",
    },
    Preoccupied: {
      internal: ["BlockIfVisited"],
      tags: ["Visits", "Block Self"],
      description:
        "If visited during the night, blocks the player's night action.",
    },
    Vain: {
      internal: ["Vain"],
      tags: ["Visits", "Killing", "Alignments", "Self Kill"],
      description:
        "If this player visits a player of the same alignment, they die.",
      incompatible: ["Weak"],
    },
    Weak: {
      internal: ["Weak"],
      tags: ["Visits", "Killing", "Alignments", "Self Kill"],
      description:
        "If this player visits a player of the opposite alignment, they die.",
      incompatible: ["Vain"],
    },
    Disloyal: {
      internal: ["Disloyal"],
      tags: ["Visits", "Block Self", "Alignments"],
      description:
        "If this player visits a player of the same alignment, their secondary actions will be blocked.",
      incompatible: ["Loyal"],
    },
    Loyal: {
      internal: ["Loyal"],
      tags: ["Visits", "Block Self", "Alignments"],
      description:
        "If this player visits a player of the opposite alignment, their secondary actions will be blocked.",
      incompatible: ["Disloyal"],
    },
    Hemophilic: {
      internal: ["ConvertKillToBleed"],
      tags: ["Bleeding"],
      description:
        "If this player is shot or targeted for a kill, will bleed and then die in one day.",
    },
    Shady: {
      internal: ["AppearAsRandomEvil"],
      tags: ["Deception"],
      description:
        "Appears as Mafioso when investigated or condemned. Appears as their real role on death.",
      incompatible: ["Blasphemous", "Faceless", "Unassuming"],
    },
    Faceless: {
      internal: ["AppearAsFliplessOnDeath"],
      tags: ["Clean Night Kill"],
      description:
        "Player's role will be hidden from the town when condemned or on death.",
      incompatible: ["Shady", "Blasphemous", "Unassuming"],
    },
    Unassuming: {
      internal: ["AppearAsVillagerOnDeath"],
      tags: ["Villager", "Deception"],
      description: "Appears as Villager when condemned or on death.",
      incompatible: ["Shady", "Blasphemous", "Faceless"],
    },
    Noisy: {
      internal: ["RevealNameToTarget"],
      tags: ["Information", "Visits"],
      description:
        "Announces the player's name to the targets of their night actions.",
    },
    Clumsy: {
      internal: ["RevealRoleToTarget"],
      tags: ["Information", "Visits", "Roles"],
      description:
        "Announces the player's role to the targets of their night actions.",
    },
    Diplomatic: {
      internal: ["CondemnImmune"],
      tags: ["Condemn", "Condemn Immune"],
      description: "Cannot be condemned.",
      incompatible: ["Frustrated"],
    },
    Macho: {
      internal: ["SaveImmune"],
      tags: ["Macho", "Save Immune"],
      description: "Can not be saved or protected from kills by any means.",
    },
    Clueless: {
      internal: ["Clueless"],
      tags: ["Speech", "Clueless", "Random Messages"],
      description: "Sees all speech as coming from random people.",
    },
    Blind: {
      internal: ["Blind"],
      tags: ["Speech", "Blind"],
      description: "Sees all speech as anonymous.",
    },
    Gunslinging: {
      internal: ["DefendAndSnatchGun"],
      tags: ["Items", "Gun"],
      description: "80% chance of snatching a gun when shot at.",
    },
    Telepathic: {
      internal: ["ModifierTelepathic"],
      tags: ["Speaking"],
      description: "May anonymously contact any player.",
    },
    Simple: {
      internal: ["Simple"],
      tags: ["Visits", "Block Self", "Vanilla"],
      description:
        "If this player visits a player with a power role, all their actions will be blocked.",
      incompatible: ["Complex"],
    },
    Complex: {
      internal: ["Complex"],
      tags: ["Visits", "Block Self", "Vanilla"],
      description:
        "If this player visits a player with a vanilla role, all their actions will be blocked.",
      incompatible: ["Simple"],
    },
    Morbid: {
      internal: ["VisitOnlyDead"],
      tags: ["Visits", "Dead", "Broken"],
      description: "Secondary actions can only be used on dead players.",
    },
    Restless: {
      internal: ["ActWhileDead"],
      tags: ["Dead", "Graveyard"],
      description: "Can only perform secondary actions while dead.",
    },
    Transcendent: {
      internal: ["ActAliveOrDead"],
      tags: ["Dead", "Graveyard"],
      description: "Can perform secondary actions while either alive or dead.",
    },
    Kleptomaniac: {
      internal: ["StealFromTargets"],
      tags: ["Items", "Visits"],
      description:
        "While visiting a player, that player's items will be stolen.",
    },
    Pious: {
      internal: ["ConvertKillersOnDeath"],
      tags: ["Sacrificial", "Conversion"],
      description: "On death, has a chance to redeem their killer.",
    },
    Checking: {
      internal: ["CheckSuccessfulVisit"],
      tags: ["Information", "Visits"],
      description: "Learns if their visit was successful or if it was blocked.",
    },
    Versatile: {
      internal: ["InheritFirstDeadAligned"],
      tags: ["Dead", "Conversion"],
      description:
        "Will passively convert to the role of the first aligned power role.",
    },
    Commuting: {
      internal: ["Commuting"],
      tags: ["Role Blocker", "Reflexive"],
      description: "Is untargetable from all actions.",
    },
    Ascetic: {
      internal: ["Ascetic"],
      tags: ["Role Blocker", "Kills", "Reflexive"],
      description: "Is untargetable from all non-killing actions.",
    },
    Regretful: {
      internal: ["Regretful"],
      tags: ["Killing", "Visits", "Self Kill"],
      description: "Will be killed if their target was killed.",
    },
    Sacrificial: {
      internal: ["Sacrificial"],
      tags: ["Sacrificial", "Killing", "Self Kill"],
      description:
        "Will sacrifice themselves and die, if they ever visit another player.",
    },
    Social: {
      internal: ["MeetWithSocial"],
      tags: ["Meeting"],
      description: "Attends a meeting with all other Social players.",
    },
    Acquainted: {
      internal: ["MeetWithAcquainted"],
      tags: ["Meeting"],
      description:
        "Attends a meeting with and is aware of the roles of all other Acquainted players.",
    },
    Tinkering: {
      internal: ["ForageItem"],
      tags: ["Items"],
      description:
        "Crafts a random item if not visited during the night. If killed, the killer will find a gun that always reveals.",
    },
    Apprehensive: {
      internal: ["LearnVisitorsAndArm"],
      tags: ["Items", "Gun", "Killing", "Reflexive", "Information"],
      description:
        "Will receive a Gun (that will not reveal shooter) with each visit and learn the name of the visitor.",
    },
    Klutzy: {
      internal: ["DropOwnItems"],
      tags: ["Items"],
      description: "Will passively drop any items held or received.",
    },
    Masked: {
      internal: ["DisguiseAsTarget"],
      tags: ["Roles", "Deception", "Suits"],
      description: "Gains a suit of each target's role.",
    },
    Camouflaged: {
      internal: ["AppearAsRandomRole"],
      tags: ["Roles", "Deception"],
      description:
        "Appears as a random role in the game that is not Villager, Impersonator or Impostor.",
    },
    Omniscient: {
      internal: ["Omniscient"],
      tags: ["Roles", "Visits", "Information"],
      description: "Each night see all visits and learn all players roles.",
    },
    Unkillable: {
      internal: ["KillImmune"],
      tags: ["Unkillable"],
      description: "Cannot be killed at night.",
    },
    Bouncy: {
      internal: ["Bouncy"],
      tags: ["Redirection"],
      description:
        "If possible night kills will be redirected to another player of the same alignment.",
    },
    Banished: {
      internal: ["BanishedRole"],
      tags: ["Banished"],
      description:
        "Banished roles will not spawn normally in closed setups or role group setups. Banished roles will only spawn if the banished count is increased or if another roles adds Banished roles to the game.",
      incompatible: ["Inclusive", "Exclusive"],
    },
    Inclusive: {
      internal: ["Add1Banished"],
      tags: ["Banished", "Setup Changes"],
      description: "Adds 1 Banished Role in Closed Setups.",
      allowDuplicate: true,
      incompatible: ["Banished", "Exclusive"],
    },
    Exclusive: {
      internal: ["Remove1Banished"],
      tags: ["Banished", "Setup Changes"],
      description: "Removes 1 Banished Role in Closed Setups.",
      allowDuplicate: true,
      incompatible: ["Banished", "Inclusive"],
    },
    Insightful: {
      internal: ["Learn3ExcessRoles"],
      tags: ["Investigative", "Roles", "Excess Roles"],
      description:
        "Starts knowing 3 Excess Roles. Mafia/Cult roles will Always learn Village-Aligned Excess roles.",
    },
    Verrucose: {
      internal: ["GivePermaMindRot"],
      tags: ["Sacrificial", "Manipulative", "Mind Rot"],
      description:
        "On death a random Village Aligned player will be chosen to be inflicted with Mind Rot for the rest of the game.",
    },
    Rotten: {
      internal: ["Rotten"],
      tags: ["Manipulative", "Mind Rot", "Block Self"],
      description:
        "At the start of the game is inflicted with Mind Rot for the rest of the game.",
      incompatible: ["Infected"],
    },
    Infected: {
      internal: ["MindRot50Percent"],
      tags: ["Manipulative", "Mind Rot", "Block Self"],
      description:
        "Each night has 50% chance to be inflicted with Mind Rot for that night.",
      incompatible: ["Rotten"],
    },
    Narcissistic: {
      internal: ["TargetSelf50Percent"],
      tags: ["Redirection"],
      description:
        "Each night has 50% chance to be redirected onto themselves.",
    },
    Blessed: {
      internal: ["StartWithExtraLife"],
      tags: ["Extra Lives"],
      description: "Starts with an Extra Life",
    },
    Wise: {
      internal: ["MakePlayerLearnOneOfTwoPlayersOnDeath"],
      tags: ["Sacrificial", "Information"],
      description:
        "If killed at night, a player with this modifier learns that 1 of 2 players is evil.",
    },
    Dovish: {
      internal: ["VillageMightSurviveCondemn"],
      tags: ["Condemn", "Condemn Immune", "Alignments", "Protective"],
      description:
        "While a role with this modifier is in play, Village-aligned players might survive being condemned",
    },
    Married: {
      internal: ["LearnAndLifeLinkToPlayer"],
      tags: ["Information", "Linked"],
      description:
        "On Night 1 will learn a player and their role. If that player is killed during the Night at Any Point in the game, You die.",
    },
    Unlucky: {
      internal: ["UnluckyDeath"],
      tags: ["Killing"],
      description: "After Night 1, You can die at any time.",
    },
    Clannish: {
      internal: ["AddRottenCopy"],
      tags: ["Mind Rot", "Setup Changes"],
      description:
        "In closed Setups will add 0 to 2 Copies of This Role, 1 of the added roles is Permanently inflicted with Mind Rot.",
    },
    Chaotic: {
      internal: ["BecomeExcessRole"],
      tags: ["Conversion", "Excess Roles"],
      description:
        "On the first night, a player with this modifier will become a random excess role within their alignment. Independents will become excess roles from any alignment.",
    },
    Retired: {
      internal: ["Retired"],
      tags: ["Information", "Vanilla"],
      description:
        "This will become a Vanilla role at the Start of the game will start knowing any players with the Orignal role.",
    },
    Sensible: {
      internal: ["LearnIfRoleChanged"],
      tags: ["Information"],
      description: "Each night learn what their role is.",
    },
    Neighborly: {
      internal: ["MeetWithNeighbors"],
      tags: ["Meeting"],
      description: "Attends a Night Meeting with their Neighbors.",
    },
    /*
    Red: {
      internal: ["BecomeRedMafia"],
      tags: ["Alignments"],
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
