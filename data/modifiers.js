const modifierData = {
  Mafia: {
    Armed: {
      internal: ["StartWithGun"],
      tags: ["Items", "Killing", "Gun", "Day Killer"],
      description: "Starts with a gun.",
      allowDuplicate: true,
    },
    Apprehensive: {
      internal: ["LearnVisitorsAndArm"],
      tags: ["Items", "Gun", "Killing", "Reflexive", "Information"],
      description:
        "Will receive a Gun (that will not reveal shooter) with each visit and learn the name of the visitor.",
    },
    Ascetic: {
      internal: ["Ascetic"],
      tags: ["Role Blocker", "Kills", "Reflexive"],
      description: "Is untargetable from all killing actions.",
    },
    Astral: {
      internal: ["Astral"],
      tags: ["Visits", "Astral"],
      description: "All actions done by this player are not visits.",
    },
    Backup: {
      internal: ["BackUpModifier"],
      tags: ["Conversion"],
      description:
        "Will convert to Student/Understudy/Devotee/Sidekick with this role as the Target.",
      incompatible: ["Retired"],
    },
    Banished: {
      internal: ["BanishedRole"],
      tags: ["Banished"],
      description:
        "Banished roles have abnormal spawn conditions. Banished roles will only spawn if the Banished count is increased, or if another roles adds Banished roles to the game.",
      incompatible: ["Inclusive", "Exclusive"],
    },
    Birdbrained: {
      internal: ["StartWithFalcon"],
      tags: ["Information", "Items", "Falcon", "Visits"],
      description: "Starts with a falcon.",
      allowDuplicate: true,
    },
    Blessed: {
      internal: ["StartWithExtraLife"],
      tags: ["Extra Lives"],
      description: "Starts with an Extra Life",
    },
    Blind: {
      internal: ["Blind"],
      tags: ["Speech", "Blind"],
      description: "Sees all speech as anonymous.",
    },
    Bloodthirsty: {
      internal: ["ModifierBloodthirsty"],
      tags: ["Visits", "Killing"],
      description: "When visiting, their target will be killed.",
    },
    Bouncy: {
      internal: ["Bouncy"],
      tags: ["Redirection"],
      description:
        "If possible night kills will be redirected to another player of the same alignment.",
    },
    Braggadocious: {
      internal: ["PreventFactionJoints"],
      tags: [],
      description:
        "If a player with this modifier wins, then Village, Mafia, and Cult cannot also win alongside them.",
    },
    Bulletproof: {
      internal: ["StartWithArmor"],
      tags: ["Items", "Armor"],
      description: "Starts with armor.",
      allowDuplicate: true,
    },
    Camouflaged: {
      internal: ["AppearAsRandomRole"],
      tags: ["Roles", "Deception"],
      description:
        "Appears as a random role in the game that is not Villager, Impersonator or Impostor.",
    },
    Chaotic: {
      internal: ["BecomeExcessRole"],
      tags: ["Conversion", "Excess Roles"],
      description:
        "On the first night, a player with this modifier will become a random excess role within their alignment. Independents will become excess roles from any alignment.",
    },
    Checking: {
      internal: ["CheckSuccessfulVisit"],
      tags: ["Information", "Visits"],
      description: "Learns if their visit was successful or if it was blocked.",
    },
    Churchgoing: {
      internal: ["StartWithTract"],
      tags: ["Items", "Convert Saver", "Tract"],
      description: "Starts with a tract.",
      allowDuplicate: true,
    },
    Clannish: {
      internal: ["AddRottenCopy"],
      tags: ["Delirium", "Setup Changes"],
      description:
        "In closed Setups will add 0 to 2 Copies of This Role, 1 of the added roles is Permanently given Delirium.",
    },
    Clueless: {
      internal: ["Clueless"],
      tags: ["Speech", "Clueless", "Random Messages"],
      description: "Sees all speech as coming from random people.",
    },
    Clumsy: {
      internal: ["RevealRoleToTarget"],
      tags: ["Information", "Visits", "Roles"],
      description:
        "Announces the player's role to the targets of their night actions.",
    },
    Complex: {
      internal: ["Complex"],
      tags: ["Visits", "Block Self", "Vanilla"],
      description:
        "If this player visits a player with a vanilla role, all their actions will be blocked.",
      incompatible: ["Simple"],
    },
    Commuting: {
      internal: ["Commuting"],
      tags: ["Role Blocker", "Reflexive"],
      description: "Is untargetable from all actions.",
    },
    Confused: {
      internal: ["ModifierConfused"],
      tags: ["Manipulative", "Delirium", "Block Self"],
      description: "Investigative reports appear incorrect 50% of the time.",
      incompatible: ["Sane", "Insane", "Naive", "Paranoid"],
    },
    Crystalline: {
      internal: ["StartWithCrystal"],
      tags: ["Revealing", "Items", "Crystal"],
      description: "Starts with a crystal ball.",
      allowDuplicate: true,
    },
    Dead: {
      internal: ["Dead"],
      tags: ["Dead"],
      description: "Starts game dead",
    },
    Demonic: {
      internal: ["Demonic"],
      tags: ["Demonic", "Essential"],
      description:
        "Cult will win if a Demonic player is alive in final 2 or only Demonic and Cult players are alive. If all Demonic players are dead, all Cult-aligned players will die.",
    },
    Delayed: {
      internal: ["Delayed"],
      tags: ["Delayed", "Meetings"],
      description:
        "Cannot attend secondary meetings for the first day and night.",
      incompatible: ["Lazy", "Odd", "Even", "Exhausted"],
    },
    Diplomatic: {
      internal: ["CondemnImmune"],
      tags: ["Condemn", "Condemn Immune"],
      description: "Cannot be condemned.",
      incompatible: ["Frustrated"],
    },
    Disloyal: {
      internal: ["Disloyal"],
      tags: ["Visits", "Block Self", "Alignments"],
      description:
        "If this player visits a player of the same alignment, their secondary actions will be blocked.",
      incompatible: ["Loyal"],
    },
    Dovish: {
      internal: ["VillageMightSurviveCondemn"],
      tags: ["Condemn", "Condemn Immune", "Alignments", "Protective"],
      description:
        "While a role with this modifier is in play, Village-aligned players might survive being condemned",
    },
    Even: {
      internal: ["Even"],
      tags: ["Even", "Meetings"],
      description:
        "Can only attend secondary meetings on even days and nights.",
      incompatible: ["Lazy", "Odd", "Delayed", "Exhausted"],
    },
    Exclusive: {
      internal: ["Remove1Banished"],
      tags: ["Banished", "Setup Changes"],
      description: "Removes 1 Banished Role in Closed Setups.",
      allowDuplicate: true,
      incompatible: ["Banished", "Inclusive"],
    },
    Exposed: {
      internal: ["PublicReveal"],
      tags: ["Reveal Self"],
      description: "Starts revealed to everyone.",
      incompatible: ["Humble", "Scatterbrained", "Respected", "Modest"],
    },
    Explosive: {
      internal: ["StartWithBomb"],
      tags: ["Items", "Killing"],
      description: "Starts with a bomb.",
      allowDuplicate: true,
    },
    Faceless: {
      internal: ["AppearAsFliplessOnDeath"],
      tags: ["Clean Night Kill"],
      description:
        "Player's role will be hidden from the town when condemned or on death.",
      incompatible: ["Shady", "Unassuming"],
    },
    Frustrated: {
      internal: ["FrustratedCondemnation"],
      tags: ["Voting", "Condemn"],
      description:
        "Cannot be condemned by majority vote. A non-zero minority vote will kill the target.",
      incompatible: ["Diplomatic"],
    },
    Global: {
      internal: ["GlobalModifier"],
      tags: ["Visits", "Dawn"],
      description: "Will target All players at Night",
    },
    Gunslinging: {
      internal: ["DefendAndSnatchGun"],
      tags: ["Items", "Gun"],
      description: "80% chance of snatching a gun when shot at.",
    },
    Hemophilic: {
      internal: ["ConvertKillToBleed"],
      tags: ["Bleeding"],
      description:
        "If this player is shot or targeted for a kill, will bleed and then die in one day.",
    },
    Humble: {
      internal: ["Humble"],
      tags: ["Vanilla"],
      description:
        "Appears as Villager (Village) / Mafioso (Mafia) / Cultist (Cult) / Grouch (Independent) to self with no modifier.",
      incompatible: ["Respected", "Scatterbrained", "Exposed"],
    },
    Inclusive: {
      internal: ["Add1Banished"],
      tags: ["Banished", "Setup Changes"],
      description: "Adds 1 Banished Role in Closed Setups.",
      allowDuplicate: true,
      incompatible: ["Banished", "Exclusive"],
    },
    Insightful: {
      internal: ["Learn3ExcessRoles"],
      tags: ["Investigative", "Roles", "Excess Roles"],
      description:
        "Learns 3 excess roles upon the game's start. Mafia/Cult roles always learn Village-aligned excess roles.",
    },
    Kleptomaniac: {
      internal: ["StealFromTargets"],
      tags: ["Items", "Visits"],
      description:
        "While visiting a player, that player's items will be stolen.",
    },
    Klutzy: {
      internal: ["DropOwnItems"],
      tags: ["Items"],
      description: "Will passively drop any items held or received.",
    },
    Lazy: {
      internal: ["ModifierLazy"],
      tags: ["Manipulative", "Delayed"],
      description:
        "Actions taken on night will only execute after a full day/night phase.",
      incompatible: ["Delayed", "Odd", "Even", "Exhausted"],
    },
    Linchpin: {
      internal: ["KillAlignedOnDeath"],
      tags: ["Essential", "Selective Revealing", "Linchpin"],
      description: "If dead, all aligned players will die too.",
    },
    Lone: {
      internal: ["ModifierLone"],
      tags: ["Lone"],
      description:
        "If this role typically has a group meeting at night, they will not meet with or know the identity of their partner(s).",
    },
    Loud: {
      internal: ["ModifierLoud"],
      tags: ["Reflexive", "Information", "Whispers"],
      description:
        "If visited, cries out the identity of players who visited them during the night. All reports received are announced to everyone, with the player's role revealed. All whispers involving a player with this modifier are leaked.",
    },
    Loyal: {
      internal: ["Loyal"],
      tags: ["Visits", "Block Self", "Alignments"],
      description:
        "If this player visits a player of the opposite alignment, their secondary actions will be blocked.",
      incompatible: ["Disloyal"],
    },
    Luminous: {
      internal: ["StartWithCandle"],
      tags: ["Information", "Items", "Candle", "Visits"],
      description: "Starts with a candle.",
      allowDuplicate: true,
    },
    Macho: {
      internal: ["SaveImmune"],
      tags: ["Macho", "Save Immune"],
      description: "Can not be saved or protected from kills by any means.",
    },
    Macabre: {
      internal: ["StartWithSyringe"],
      tags: ["Revive", "Items", "Syringe", "Graveyard"],
      description: "Starts with a syringe.",
      allowDuplicate: true,
    },
    Married: {
      internal: ["LearnAndLifeLinkToPlayer"],
      tags: ["Information", "Linked"],
      description:
        "On Night 1 will learn a player and their role. If that player is killed during the Night at Any Point in the game, You die.",
    },
    Masked: {
      internal: ["DisguiseAsTarget"],
      tags: ["Roles", "Deception", "Suits"],
      description: "Gains a suit of each target's role.",
    },
    Modest: {
      internal: ["Modest"],
      tags: ["Modifiers"],
      description: "Appears to self with no modifiers.",
      incompatible: ["Exposed"],
    },
    Morbid: {
      internal: ["VisitOnlyDead"],
      tags: ["Visits", "Dead", "Broken"],
      description: "Secondary actions can only be used on dead players.",
    },
    Narcissistic: {
      internal: ["TargetSelf50Percent"],
      tags: ["Redirection"],
      description:
        "Each night has 50% chance to be redirected onto themselves.",
    },
    Neighborly: {
      internal: ["MeetWithNeighbors"],
      tags: ["Meeting"],
      description: "Attends a Night Meeting with their Neighbors.",
    },
    Noisy: {
      internal: ["RevealNameToTarget"],
      tags: ["Information", "Visits"],
      description:
        "Announces the player's name to the targets of their night actions.",
    },
    Odd: {
      internal: ["Odd"],
      tags: ["Odd", "Meetings"],
      description: "Can only attend secondary meetings on odd days and nights.",
      incompatible: ["Lazy", "Even", "Delayed", "Exhausted"],
    },
    Omniscient: {
      internal: ["Omniscient"],
      tags: ["Roles", "Visits", "Information"],
      description: "Each night see all visits and learn all players roles.",
    },
    "One Shot": {
      internal: ["OneShot"],
      tags: ["One Shot", "Dawn", "Dusk", "Pregame Actions"],
      description: "Can only perform actions once.",
      incompatible: ["Exhausted"],
    },
    Pious: {
      internal: ["ConvertKillersOnDeath"],
      tags: ["Sacrificial", "Conversion"],
      description: "On death, has a chance to redeem their killer.",
    },
    Preoccupied: {
      internal: ["BlockIfVisited"],
      tags: ["Visits", "Block Self"],
      description:
        "If visited during the night, blocks the player's night action.",
    },
    Prosaic: {
      internal: ["StartWithEnvelope"],
      tags: ["Messages", "Items", "Envelope"],
      description: "Starts with an envelope.",
      allowDuplicate: true,
    },
    Provocative: {
      internal: ["Provocative"],
      tags: ["Messages", "Items", "Sockpuppet"],
      description: "Each day, receives a sockpuppet.",
    },
    Reactionary: {
      internal: ["KillConverters"],
      tags: ["Convert Saver", "Killing", "Reflexive"],
      description:
        "Kills anyone (up to two people) who tries to convert them at night.",
    },
    Regretful: {
      internal: ["Regretful"],
      tags: ["Killing", "Visits", "Self Kill"],
      description: "Will be killed if their target was killed.",
    },
    Resolute: {
      internal: ["Resolute"],
      tags: ["Unblockable"],
      description:
        "All actions done by this player cannot be roleblocked or controlled.",
    },
    Respected: {
      internal: ["VillagerToInvestigative"],
      tags: ["Villager", "Deception"],
      description: "Appears as a Villager to investigative roles.",
      incompatible: ["Humble", "Scatterbrained", "Exposed"],
    },
    Restless: {
      internal: ["ActWhileDead"],
      tags: ["Dead", "Graveyard", "Restless"],
      description: "Can only perform secondary actions while dead.",
    },
    Retired: {
      internal: ["Retired"],
      tags: ["Information", "Vanilla"],
      description:
        "This will become a Vanilla role at the Start of the game will start knowing any players with the Orignal role.",
      incompatible: ["Backup"],
    },
    Rifled: {
      internal: ["StartWithRifle"],
      tags: ["Items", "Killing", "Gun", "Alignments", "Day Killer"],
      description: "Starts with a rifle.",
      allowDuplicate: true,
    },
    Sacrificial: {
      internal: ["Sacrificial"],
      tags: ["Sacrificial", "Killing", "Self Kill"],
      description:
        "Will sacrifice themselves and die, if they ever visit another player.",
    },
    Scatterbrained: {
      internal: ["Scatterbrained"],
      tags: ["Visitor"],
      description:
        "Appears as Visitor (Village) / Trespasser (Mafia) / Bogeyman (Cult) / Fool (Independent) to self with no modifier.",
      incompatible: ["Humble", "Respected", "Exposed"],
    },
    Seductive: {
      internal: ["BlockTargets"],
      tags: ["Visits", "Role Blocker"],
      description: "While visiting a player, that player will be roleblocked.",
    },
    Sensible: {
      internal: ["LearnIfRoleChanged"],
      tags: ["Information"],
      description: "Each night learn what their role is.",
    },
    Shady: {
      internal: ["AppearAsRandomEvil"],
      tags: ["Deception"],
      description:
        "Appears as Mafioso when investigated or condemned. Appears as their real role on death.",
      incompatible: ["Faceless", "Unassuming"],
    },
    Simple: {
      internal: ["Simple"],
      tags: ["Visits", "Block Self", "Vanilla"],
      description:
        "If this player visits a player with a power role, all their actions will be blocked.",
      incompatible: ["Complex"],
    },
    Social: {
      internal: ["MeetWithSocial"],
      tags: ["Meeting"],
      description: "Attends a meeting with all other Social players.",
    },
    Steeled: {
      internal: ["StartWithKnife"],
      tags: ["Bleeding", "Items", "Knife", "Killing", "Day Killer"],
      description: "Starts with a knife.",
      allowDuplicate: true,
    },
    Strong: {
      internal: ["StrongModifier"],
      tags: ["Unblockable", "Strong"],
      description: "All kills performed by this player cannot be saved.",
    },
    Suspended: {
      internal: ["Suspended"],
      tags: ["Suspended", "Meetings"],
      description:
        "Can only attend secondary meetings for the first day and night.",
      allowDuplicate: true,
      incompatible: ["Lazy", "Odd", "One Shot", "Even", "Delayed"],
    },
    Telepathic: {
      internal: ["ModifierTelepathic"],
      tags: ["Speaking"],
      description: "May anonymously contact any player.",
    },
    Tinkering: {
      internal: ["ForageItem"],
      tags: ["Items"],
      description:
        "Crafts a random item if not visited during the night. If killed, the killer will find a gun that always reveals.",
    },
    Traitorous: {
      internal: ["TurnIntoTraitorOnMafiaKill"],
      tags: ["Sacrificial", "Conversion", "Traitor"],
      description: "If killed by the Mafia, will turn into a Traitor instead.",
    },
    Transcendent: {
      internal: ["ActAliveOrDead"],
      tags: ["Dead", "Graveyard", "Transcendent"],
      description: "Can perform secondary actions while either alive or dead.",
    },
    Unassuming: {
      internal: ["AppearAsVillagerOnDeath"],
      tags: ["Villager", "Deception"],
      description: "Appears as Villager when condemned or on death.",
      incompatible: ["Shady", "Faceless"],
    },
    Unkillable: {
      internal: ["KillImmune"],
      tags: ["Unkillable"],
      description: "Cannot be killed at night.",
    },
    Unlucky: {
      internal: ["UnluckyDeath"],
      tags: ["Killing"],
      description: "After Night 1, You can die at any time.",
    },
    Unwavering: {
      internal: ["ConvertImmune"],
      tags: ["Convert Saver"],
      description: "Cannot be converted to another role.",
    },
    Vain: {
      internal: ["Vain"],
      tags: ["Visits", "Killing", "Alignments", "Self Kill"],
      description:
        "If this player visits a player of the same alignment, they die.",
      incompatible: ["Weak"],
    },
    Verrucose: {
      internal: ["GivePermaDelirium"],
      tags: ["Sacrificial", "Manipulative", "Delirium"],
      description:
        "On death a random Village Aligned player will be chosen to be made Delirious for the rest of the game.",
    },
    Versatile: {
      internal: ["InheritFirstDeadAligned"],
      tags: ["Dead", "Conversion"],
      description:
        "Will passively convert to the role of the first aligned power role.",
    },
    Weak: {
      internal: ["Weak"],
      tags: ["Visits", "Killing", "Alignments", "Self Kill"],
      description:
        "If this player visits a player of the opposite alignment, they die.",
      incompatible: ["Vain"],
    },
    Wise: {
      internal: ["MakePlayerLearnOneOfTwoPlayersOnDeath"],
      tags: ["Sacrificial", "Information"],
      description:
        "If killed at night, a player with this modifier learns that 1 of 2 players is evil.",
    },

    Insane: {
      internal: ["FalseModifier"],
      tags: ["FalseMode"],
      description: "All Information received by this role is false.",
    },
    Sane: {
      internal: ["TrueModifier"],
      tags: ["FalseMode"],
      description: "All Information received by this role is true.",
    },
    Paranoid: {
      internal: ["UnfavorableModifier"],
      tags: ["FalseMode"],
      description:
        "All Information received by this role will be unfavorable to the player being checked.",
    },
    Naive: {
      internal: ["FavorableModifier"],
      tags: ["FalseMode"],
      description:
        "All Information received by this role will be favorable to the player being checked.",
    },
    /*
    Red: {
      internal: ["BecomeRedMafia"],
      tags: ["Alignments"],
      description: "Joins the Red Mafia.",
    },
    */
  },
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
