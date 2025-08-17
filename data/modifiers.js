const modifierData = {
  Mafia: {
    Armed: {
      category: "Items",
      internal: ["StartWithGun"],
      tags: ["Items", "Killing", "Gun", "Day Killer"],
      description: "Starts with a gun.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Austere: {
      category: "Other",
      internal: ["OnlyUseInPlayRoles"],
      tags: ["Austere"],
      description: "This role can only referance roles currently in the game.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Excessive"],
    },
    Backup: {
      category: "Other",
      internal: ["BackUpModifier"],
      tags: ["Conversion"],
      description:
        "Independents will become a Sidekick with this role as the Target. Other roles will have no abilites until a player with their role dies.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Retired"],
    },
    Birdbrained: {
      category: "Items",
      internal: ["StartWithFalcon"],
      tags: ["Information", "Items", "Falcon", "Visits"],
      description: "Starts with a falcon.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Blessed: {
      category: "Other",
      internal: ["StartWithExtraLife"],
      tags: ["Extra Lives"],
      description: "Starts with an Extra Life",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Bloodthirsty: {
      category: "Other",
      internal: ["ModifierBloodthirsty"],
      tags: ["Visits", "Killing"],
      description: "When visiting, their target will be killed.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Boastful: {
      category: "Other",
      internal: ["ModifierBoastful"],
      tags: ["Information", "Reports"],
      description:
        "All reports received are announced to everyone, with the player's role revealed.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Bulletproof: {
      category: "Items",
      internal: ["StartWithArmor"],
      tags: ["Items", "Armor"],
      description: "Starts with armor.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Caffeinated: {
      category: "Items",
      internal: ["StartWithCoffee"],
      tags: ["Items", "Coffee"],
      description: "Starts with a Coffee.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Chaotic: {
      category: "Other",
      internal: ["BecomeExcessRole"],
      tags: ["Conversion", "Excess Roles"],
      description:
        "On the first night, a player with this modifier will become a random excess role within their alignment. Independents will become excess roles from any alignment.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Churchgoing: {
      category: "Items",
      internal: ["StartWithTract"],
      tags: ["Items", "Convert Saver", "Tract"],
      description: "Starts with a tract.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Clannish: {
      category: "Other",
      internal: ["AddRottenCopy"],
      tags: ["Delirium", "Setup Changes"],
      description:
        "In closed Setups will add 0 to 2 Copies of This Role, 1 of the added roles is Permanently given Delirium.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Creamed: {
      category: "Items",
      internal: ["StartWithIceCream"],
      tags: ["Items", "Ice Cream"],
      description:
        "Starts with a Ice Cream. Ice Cream can be used to become a Vanilla role",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Crystalline: {
      category: "Items",
      internal: ["StartWithCrystal"],
      tags: ["Revealing", "Items", "Crystal"],
      description: "Starts with a crystal ball.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Dead: {
      category: "Other",
      internal: ["Dead"],
      tags: ["Dead"],
      description: "Starts game dead",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Excessive: {
      category: "Other",
      internal: ["ExcessiveRole"],
      tags: ["Excessive"],
      description:
        "This role can treats every role on the site as an Excess Role.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Austere"],
    },
    Explosive: {
      category: "Items",
      internal: ["StartWithBomb"],
      tags: ["Items", "Killing"],
      description: "Starts with a bomb.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Gunslinging: {
      category: "Items",
      internal: ["DefendAndSnatchGun"],
      tags: ["Items", "Gun"],
      description: "80% chance of snatching a gun when shot at.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Hemophilic: {
      category: "Other",
      internal: ["ConvertKillToBleed"],
      tags: ["Bleeding"],
      description:
        "If this player is shot or targeted for a kill, will bleed and then die in one day.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Insightful: {
      category: "Other",
      internal: ["Learn3ExcessRoles"],
      tags: ["Investigative", "Roles", "Excess Roles"],
      description:
        "Learns 3 excess roles upon the game's start. Mafia/Cult roles always learn Village-aligned excess roles.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Luminous: {
      category: "Items",
      internal: ["StartWithCandle"],
      tags: ["Information", "Items", "Candle", "Visits"],
      description: "Starts with a candle.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Macho: {
      category: "Other",
      internal: ["SaveImmune"],
      tags: ["Macho", "Save Immune"],
      description: "Can not be saved or protected from kills by any means.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Macabre: {
      category: "Items",
      internal: ["StartWithSyringe"],
      tags: ["Revive", "Items", "Syringe", "Graveyard"],
      description: "Starts with a syringe.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Married: {
      category: "Other",
      internal: ["LearnAndLifeLinkToPlayer"],
      tags: ["Information", "Linked"],
      description:
        "On Night 1 will learn a Village-aligned player and their role. If that player is killed by the Mafia or a Demonic role, the Married player dies.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Omniscient: {
      category: "Other",
      internal: ["Omniscient"],
      tags: ["Roles", "Visits", "Information"],
      description: "Each night see all visits and learn all players roles.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Pious: {
      category: "Other",
      internal: ["ConvertKillersOnDeath"],
      tags: ["Sacrificial", "Conversion"],
      description: "On death, has a chance to redeem their killer.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Prosaic: {
      category: "Items",
      internal: ["StartWithEnvelope"],
      tags: ["Messages", "Items", "Envelope"],
      description: "Starts with an envelope.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Reactionary: {
      category: "Other",
      internal: ["KillConverters"],
      tags: ["Convert Saver", "Killing", "Reflexive"],
      description:
        "Kills anyone (up to two people) who tries to convert them at night.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Retired: {
      category: "Other",
      internal: ["Retired"],
      tags: ["Information", "Retired"],
      description:
        "Starts knowing anyone who has the same role. Has all other abilites disabled",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Backup"],
    },
    Rifled: {
      category: "Items",
      internal: ["StartWithRifle"],
      tags: ["Items", "Killing", "Gun", "Alignments", "Day Killer"],
      description: "Starts with a rifle.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Sensible: {
      category: "Other",
      internal: ["LearnIfRoleChanged"],
      tags: ["Information"],
      description: "Each night learn what their role is.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Shielded: {
      category: "Items",
      internal: ["StartWithShield"],
      tags: ["Items"],
      description: "Starts with a Shield.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Steeled: {
      category: "Items",
      internal: ["StartWithKnife"],
      tags: ["Bleeding", "Items", "Knife", "Killing", "Day Killer"],
      description: "Starts with a knife.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Strong: {
      category: "Other",
      internal: ["StrongModifier"],
      tags: ["Unblockable", "Strong"],
      description: "All kills performed by this player cannot be saved.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Temporary: {
      category: "Other",
      internal: ["LoseModifiers"],
      tags: ["Temporary", "Modifiers"],
      description: "Loses their Modifiers at the end of the Night.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Traitorous: {
      category: "Other",
      internal: ["TurnIntoTraitorOnMafiaKill"],
      tags: ["Sacrificial", "Conversion", "Traitor"],
      description: "If killed by the Mafia, will turn into a Traitor instead.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Unkillable: {
      category: "Other",
      internal: ["KillImmune"],
      tags: ["Unkillable"],
      description: "Can only be killed by condemn.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Unlucky: {
      category: "Other",
      internal: ["UnluckyDeath"],
      tags: ["Killing"],
      description: "After Night 1, You can die at any time.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Unwavering: {
      category: "Other",
      internal: ["ConvertImmune"],
      tags: ["Convert Saver"],
      description: "Cannot be converted to another role.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Verrucose: {
      category: "Other",
      internal: ["GivePermaDelirium"],
      tags: ["Sacrificial", "Manipulative", "Delirium"],
      description:
        "On death a random Village Aligned player will be chosen to be made Delirious for the rest of the game.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Versatile: {
      category: "Other",
      internal: ["InheritFirstDeadAligned"],
      tags: ["Dead", "Conversion"],
      description:
        "Will passively convert to the role of the first aligned power role.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Wise: {
      category: "Other",
      internal: ["MakePlayerLearnOneOfTwoPlayersOnDeath"],
      tags: ["Sacrificial", "Information", "Graveyard Participation"],
      description:
        "If killed at night, a player with this modifier learns that 1 of 2 players is evil.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    //Speaking Mods
    Blind: {
      category: "Other",
      internal: ["Blind"],
      tags: ["Speech", "Blind"],
      description: "Sees all speech as anonymous.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Clueless: {
      category: "Other",
      internal: ["Clueless"],
      tags: ["Speech", "Clueless", "Random Messages"],
      description: "Sees all speech as coming from random people.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Leaky: {
      category: "Other",
      internal: ["ModifierLeaky"],
      tags: ["Whispers"],
      description:
        "All whispers involving a player with this modifier are leaked.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Telepathic: {
      category: "Other",
      internal: ["ModifierTelepathic"],
      tags: ["Speaking"],
      description: "May anonymously contact any player.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Neighborly: {
      category: "Other",
      internal: ["MeetWithNeighbors"],
      tags: ["Meeting"],
      description: "Attends a Night Meeting with their Neighbors.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Social: {
      category: "Other",
      internal: ["MeetWithSocial"],
      tags: ["Meeting"],
      description: "Attends a meeting with all other Social players.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Lone: {
      category: "Other",
      internal: ["ModifierLone"],
      tags: ["Lone"],
      description:
        "If this role typically has a group meeting at night, they will not meet with or know the identity of their partner(s).",
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Voting
    Trustworthy: {
      category: "Other",
      internal: ["VotingPowerIncrease"],
      tags: ["Voting"],
      description: "Player's vote is worth 1 more.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Felonious"],
      allowDuplicate: true,
    },
    Inverse: {
      category: "Other",
      internal: ["VotingNegative"],
      tags: ["Voting"],
      description: "Player's vote is Negative.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Felonious"],
    },
    Felonious: {
      category: "Other",
      internal: ["VotingPowerZero"],
      tags: ["Voting"],
      description: "Player's vote is worth 0.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Trustworthy", "Inverse"],
    },
    Frustrated: {
      category: "Other",
      internal: ["FrustratedCondemnation"],
      tags: ["Voting", "Condemn"],
      description:
        "Cannot be condemned by majority vote. A non-zero minority vote will kill the target.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Diplomatic"],
    },
    Diplomatic: {
      category: "Other",
      internal: ["CondemnImmune"],
      tags: ["Condemn", "Condemn Immune"],
      description: "Cannot be condemned.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Frustrated"],
    },
    Dovish: {
      category: "Other",
      internal: ["VillageMightSurviveCondemn"],
      tags: ["Condemn", "Condemn Immune", "Alignments", "Protective"],
      description:
        "While a role with this modifier is in play, Village-aligned players might survive being condemned",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    //Banished
    Banished: {
      category: "Other",
      internal: ["BanishedRole"],
      tags: ["Banished"],
      description:
        "Banished roles will only spawn if the Banished count is increased, or if another roles adds Banished roles to the game.",
      eventDescription: "This Event will not occur normally.",
      incompatible: ["Inclusive", "Exclusive"],
    },
    Inclusive: {
      category: "Other",
      internal: ["Add1Banished"],
      tags: ["Setup Changes", "Banished Interaction"],
      description: "Adds 1 Banished Role in Closed Setups.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
      incompatible: ["Banished", "Exclusive"],
    },
    Exclusive: {
      category: "Other",
      internal: ["Remove1Banished"],
      tags: ["Setup Changes", "Banished Interaction"],
      description: "Removes 1 Banished Role in Closed Setups.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
      incompatible: ["Banished", "Inclusive"],
    },

    //Win-Con
    Braggadocious: {
      category: "Other",
      internal: ["PreventFactionJoints"],
      tags: [],
      description:
        "If a player with this modifier wins, then Village, Mafia, and Cult cannot also win alongside them.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Demonic: {
      category: "Other",
      internal: ["Demonic"],
      tags: ["Demonic", "Essential"],
      description:
        "Cult will win if a Demonic player is alive in final 2 or only Demonic and Cult players are alive. If all Demonic players are dead, all Cult-aligned players will die.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Linchpin: {
      category: "Other",
      internal: ["KillAlignedOnDeath"],
      tags: ["Essential", "Selective Revealing", "Linchpin"],
      description: "If dead, all aligned players will die too.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    //Role Share
    Brutish: {
      category: "Other",
      internal: ["MakeSkittishOnRoleShare"],
      tags: ["Role Share"],
      description:
        "Players who role-share with a Brutish player become skittish. Skittish players must accept all incoming role-shares.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Reclusive: {
      category: "Other",
      internal: ["MakeShyOnRoleShare"],
      tags: ["Role Share"],
      description:
        "Players who role-share with a Reclusive player become shy. Shy players cannot accept incoming role-shares and cannot Private/Public Reveal.",
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Non-Starting Item
    Apprehensive: {
      category: "Items",
      internal: ["LearnVisitorsAndArm"],
      tags: ["Items", "Gun", "Killing", "Reflexive", "Information"],
      description:
        "Will receive a Gun (that will not reveal shooter) with each visit and learn the name of the visitor.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Provocative: {
      category: "Items",
      internal: ["Provocative"],
      tags: ["Messages", "Items", "Sockpuppet"],
      description: "Each day, receives a sockpuppet.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Tinkering: {
      category: "Items",
      internal: ["ForageItem"],
      tags: ["Items"],
      description:
        "Crafts a random item if not visited during the night. If killed, the killer will find a gun that always reveals.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    //Item Interaction
    Kleptomaniac: {
      category: "Items",
      internal: ["StealFromTargets"],
      tags: ["Items", "Visits"],
      description:
        "While visiting a player, that player's items will be stolen.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Klutzy: {
      category: "Items",
      internal: ["DropOwnItems"],
      tags: ["Items"],
      description: "Will passively drop any items held or received.",
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Visit Immunies
    Ascetic: {
      category: "Visits",
      internal: ["Ascetic"],
      tags: ["Role Blocker", "Kill Interaction", "Reflexive"],
      description: "Is untargetable from all non-killing actions.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Commuting: {
      category: "Visits",
      internal: ["Commuting"],
      tags: ["Role Blocker", "Reflexive"],
      description: "Is untargetable from all actions.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Astral: {
      category: "Visits",
      internal: ["Astral"],
      tags: ["Visits", "Astral"],
      description: "All actions done by this player are not visits.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Resolute: {
      category: "Visits",
      internal: ["Resolute"],
      tags: ["Unblockable"],
      description:
        "All actions done by this player cannot be roleblocked or controlled.",
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Proactive+Global+Lazy+Sudective
    Proactive: {
      category: "Visits",
      internal: ["MustAct"],
      tags: ["Action"],
      description: "Must take actions.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Global: {
      category: "Visits",
      internal: ["GlobalModifier"],
      tags: ["Visits", "Dawn"],
      description: "Will target All players at Night",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Lazy: {
      category: "Visits",
      internal: ["ModifierLazy"],
      tags: ["Manipulative", "Delayed"],
      description:
        "Actions taken on night will only execute after a full day/night phase.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Seductive: {
      category: "Visits",
      internal: ["BlockTargets"],
      tags: ["Visits", "Role Blocker"],
      description: "While visiting a player, that player will be roleblocked.",
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Visiting Info
    Loud: {
      category: "Visits",
      internal: ["ModifierLoud"],
      tags: ["Reflexive", "Information"],
      description:
        "If visited, cries out the identity of players who visited them during the night.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Checking: {
      category: "Visits",
      internal: ["CheckSuccessfulVisit"],
      tags: ["Information", "Visits"],
      description: "Learns if their visit was successful or if it was blocked.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Clumsy: {
      category: "Visits",
      internal: ["RevealRoleToTarget"],
      tags: ["Information", "Visits", "Roles"],
      description:
        "Announces the player's role to the targets of their night actions.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Noisy: {
      category: "Visits",
      internal: ["RevealNameToTarget"],
      tags: ["Information", "Visits"],
      description:
        "Announces the player's name to the targets of their night actions.",
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Redirection
    Bouncy: {
      category: "Visits",
      internal: ["Bouncy"],
      tags: ["Redirection"],
      description:
        "If possible, night kills will be redirected to another player of the same alignment.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Magnetic: {
      category: "Visits",
      internal: ["Magnetic"],
      tags: ["Redirection"],
      description:
        "If possible, night kills will be redirected onto this player if someone with the same alignment as them is targeted.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Random: {
      category: "Visits",
      internal: ["TargetRandom"],
      tags: ["Redirection", "RNG"],
      description: "Each night is redirected onto a random player.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Narcissistic: {
      category: "Visits",
      internal: ["TargetSelf50Percent"],
      tags: ["Redirection", "RNG"],
      description:
        "Each night has 50% chance to be redirected onto themselves.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    //Meeting Mods
    "X-Shot": {
      category: "Visits",
      internal: ["OneShot"],
      tags: ["X-Shot"],
      description:
        "Can only perform actions X times. X is equal the number of times this modifier is added.",
      eventDescription: "This Event will only occur once.",
      allowDuplicate: true,
    },
    Even: {
      category: "Visits",
      internal: ["Even"],
      tags: ["Even", "Meetings"],
      description:
        "Can only attend secondary meetings on even days and nights.",
      eventDescription: "This Event will only occur on Even nights.",
      incompatible: ["Odd", "Delayed"],
    },
    Odd: {
      category: "Visits",
      internal: ["Odd"],
      tags: ["Odd", "Meetings"],
      description: "Can only attend secondary meetings on odd days and nights.",
      eventDescription: "This Event will only occur on Odd nights.",
      incompatible: ["Even"],
    },
    Delayed: {
      category: "Visits",
      internal: ["Delayed"],
      tags: ["Delayed", "Meetings"],
      description:
        "Cannot attend secondary meetings for the first day and night.",
      eventDescription: "This Event will not occur on the first night.",
      incompatible: ["Suspended"],
      allowDuplicate: true,
    },
    Suspended: {
      category: "Visits",
      internal: ["Suspended"],
      tags: ["Suspended", "Meetings"],
      description:
        "Can only attend secondary meetings for the first day and night.",
      eventDescription: "This Event can only occur on the first night.",
      allowDuplicate: true,
      incompatible: ["Delayed"],
    },

    //Targeting Mods
    Fair: {
      category: "Visits",
      internal: ["FairModifier"],
      tags: ["Fair", "Visits"],
      description: "Cannot target a previously targeted player.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Nonconsecutive", "Consecutive"],
    },
    Consecutive: {
      category: "Visits",
      internal: ["Consecutive"],
      tags: ["Visits", "Consecutive"],
      description: "Can only target players they targeted previously.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Fair", "Nonconsecutive"],
    },
    Nonconsecutive: {
      category: "Visits",
      internal: ["Nonconsecutive"],
      tags: ["Visits", "Nonconsecutive"],
      description: "Cannot target a player they targeted the previous night",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Fair", "Consecutive"],
    },
    Selfish: {
      category: "Visits",
      internal: ["CanVisitSelf"],
      tags: ["Visits", "Role Blocker", "Selfish"],
      description: "Can target themselves.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Liminal: {
      category: "Visits",
      internal: ["VisitDeadOrAlive"],
      tags: ["Visits", "Dead", "Liminal"],
      description: "Secondary actions can be used on dead or living players.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Morbid"],
    },
    Morbid: {
      category: "Visits",
      internal: ["VisitOnlyDead"],
      tags: ["Visits", "Dead", "Morbid"],
      description: "Secondary actions can only be used on dead players.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Liminal"],
    },
    //Death Meeting Mods
    Transcendent: {
      category: "Visits",
      internal: ["ActAliveOrDead"],
      tags: ["Dead", "Graveyard", "Transcendent", "Graveyard Participation"],
      description: "Can perform secondary actions while either alive or dead.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Restless", "Vengeful"],
    },
    Restless: {
      category: "Visits",
      internal: ["ActWhileDead"],
      tags: ["Dead", "Graveyard", "Restless", "Graveyard Participation"],
      description: "Can only perform secondary actions while dead.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Transcendent", "Vengeful"],
    },
    Vengeful: {
      category: "Visits",
      internal: ["ActAfterNightKilled"],
      tags: ["Graveyard", "Vengeful", "Graveyard Participation"],
      description: "Can perform secondary actions after being killed at night",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Transcendent", "Restless"],
    },
    //Death Visit
    Vain: {
      category: "Visits",
      internal: ["Vain"],
      tags: ["Visits", "Killing", "Alignments", "Self Kill"],
      description:
        "If this player visits a player of the same alignment, they die.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Weak"],
    },
    Weak: {
      category: "Visits",
      internal: ["Weak"],
      tags: ["Visits", "Killing", "Alignments", "Self Kill"],
      description:
        "If this player visits a player of the opposite alignment, they die.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Vain"],
    },
    Regretful: {
      category: "Visits",
      internal: ["Regretful"],
      tags: ["Killing", "Visits", "Self Kill"],
      description: "Will be killed if their target was killed.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Sacrificial: {
      category: "Visits",
      internal: ["Sacrificial"],
      tags: ["Sacrificial", "Killing", "Self Kill"],
      description:
        "Will sacrifice themselves and die, if they ever visit another player.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Fragile: {
      category: "Visits",
      internal: ["DieIfVisited"],
      tags: ["Killing", "Visits", "Self Kill"],
      description: "Will be killed if visited.",
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Death to self block
    Fatal: {
      category: "Visits",
      internal: ["BlockedIfKilled"],
      tags: ["Block Self", "Death"],
      description:
        "If killed at night, their secondary actions will be blocked.",
      eventDescription: "This Event will not apply to Non-Evil players.",
      incompatible: ["Sorrowful"],
    },
    Sorrowful: {
      category: "Visits",
      internal: ["BlockedUnlessKilled"],
      tags: ["Block Self", "Death"],
      description:
        "Unless killed at night, their secondary actions will be blocked.",
      eventDescription: "This Event will not apply to Non-Evil players.",
      incompatible: ["Fatal"],
    },

    //Self Block
    Loyal: {
      category: "Visits",
      internal: ["Loyal"],
      tags: ["Visits", "Block Self", "Alignments", "Loyal"],
      description:
        "If this player visits a player of the opposite alignment, their secondary actions will be blocked.",
      eventDescription: "This Event will not apply to Evil players.",
      incompatible: ["Disloyal"],
    },
    Disloyal: {
      category: "Visits",
      internal: ["Disloyal"],
      tags: ["Visits", "Block Self", "Alignments", "Disloyal"],
      description:
        "If this player visits a player of the same alignment, their secondary actions will be blocked.",
      eventDescription: "This Event will not apply to Non-Evil players.",
      incompatible: ["Loyal"],
    },
    Complex: {
      category: "Visits",
      internal: ["Complex"],
      tags: ["Visits", "Block Self", "Vanilla", "Complex"],
      description:
        "If this player visits a player with a vanilla role, all their actions will be blocked.",
      eventDescription:
        "This Event will not apply to players with Vanilla roles.",
      incompatible: ["Simple"],
    },
    Simple: {
      category: "Visits",
      internal: ["Simple"],
      tags: ["Visits", "Block Self", "Vanilla", "Simple"],
      description:
        "If this player visits a player with a power role, all their actions will be blocked.",
      eventDescription: "This Event will not apply to non-Vanilla players.",
      incompatible: ["Complex"],
    },
    Holy: {
      category: "Visits",
      internal: ["Holy"],
      tags: ["Visits", "Block Self", "Modifiers", "Holy"],
      description:
        "If this player visits a player with a Demonic role, their secondary actions will be blocked.",
      eventDescription: "This Event will not apply to Demonic players.",
      incompatible: ["Unholy"],
    },
    Unholy: {
      category: "Visits",
      internal: ["Unholy"],
      tags: ["Visits", "Block Self", "Modifiers", "Unholy"],
      description:
        "If this player visits a player with a non-Demonic role, their secondary actions will be blocked.",
      eventDescription: "This Event will not apply to non-Demonic players.",
      incompatible: ["Holy"],
    },
    Refined: {
      category: "Visits",
      internal: ["Refined"],
      tags: [
        "Visits",
        "Block Self",
        "Modifiers",
        "Refined",
        "Banished Interaction",
      ],
      description:
        "If this player visits a player with a Banished role, their secondary actions will be blocked.",
      eventDescription: "This Event will not apply to Banished players.",
      incompatible: ["Unrefined"],
    },
    Unrefined: {
      category: "Visits",
      internal: ["Unrefined"],
      tags: [
        "Visits",
        "Block Self",
        "Modifiers",
        "Unrefined",
        "Banished Interaction",
      ],
      description:
        "If this player visits a player with a non-Banished role, their secondary actions will be blocked.",
      eventDescription: "This Event will not apply to non-Banished players.",
      incompatible: ["Refined"],
    },

    //Sub Role Guessing
    Picky: {
      category: "Visits",
      internal: ["GuessRoleOrGetBlocked"],
      tags: ["Self Block"],
      description:
        "Each night chooses a role. Actions will be blocked unless visiting a player with that role.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Choosy"],
    },
    Choosy: {
      category: "Visits",
      internal: ["GuessRoleToGetBlocked"],
      tags: ["Self Block"],
      description:
        "Each night chooses a role. Actions will be blocked if visiting a player with that role.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Picky"],
    },

    Preoccupied: {
      category: "Visits",
      internal: ["BlockIfVisited"],
      tags: ["Visits", "Block Self"],
      description:
        "If visited during the night, blocks the player's night action.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Fearful: {
      category: "Visits",
      internal: ["BlockedIfScary"],
      tags: ["Self Block"],
      description: "Actions will be Blocked if a Scary role is alive.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Scary: {
      category: "Visits",
      internal: ["BlockedFearful"],
      tags: ["Self Block"],
      description: "Will Block any Fearful roles when alive.",
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Reveal Mods
    Exposed: {
      category: "Appearance",
      internal: ["PublicReveal"],
      tags: ["Reveal Self"],
      description: "Starts revealed to everyone.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Notable", "Infamous"],
    },
    Notable: {
      category: "Appearance",
      internal: ["RevealToVillage"],
      tags: ["Reveal Self"],
      description: "Starts revealed to all Village-aligned players.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Exposed"],
    },
    Infamous: {
      category: "Appearance",
      internal: ["RevealToEvils"],
      tags: ["Reveal Self"],
      description: "Starts revealed to all Evil players.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Exposed"],
    },

    //Self Appearance
    Humble: {
      category: "Appearance",
      internal: ["Humble"],
      tags: ["Vanilla", "Villager", "Self Appearance"],
      description:
        "Appears as Villager (Village) / Mafioso (Mafia) / Cultist (Cult) / Grouch (Independent) to self with no modifier.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Scatterbrained"],
    },
    Scatterbrained: {
      category: "Appearance",
      internal: ["Scatterbrained"],
      tags: ["Visitor"],
      description:
        "Appears as Visitor (Village) / Trespasser (Mafia) / Bogeyman (Cult) / Fool (Independent) to self with no modifier.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Humble"],
    },
    Modest: {
      category: "Appearance",
      internal: ["Modest"],
      tags: ["Modifiers"],
      description: "Appears to self with no modifiers.",
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Investigative Appearance Mods
    Masked: {
      category: "Appearance",
      internal: ["DisguiseAsTarget"],
      tags: ["Roles", "Deception", "Suits"],
      description: "Gains a suit of each target's role.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Respected: {
      category: "Appearance",
      internal: ["VillagerToInvestigative"],
      tags: ["Villager", "Deception", "No Investigate"],
      description: "Appears as a Villager to investigative roles.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Suspect", "Shady", "Camouflaged"],
    },
    Wannabe: {
      category: "Appearance",
      internal: ["Wannabe"],
      tags: ["Deception"],
      description:
        "Appears to visit a player who dies at night, prioritizing players who are killed by the mafia.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    //Death Appearance Mods
    Suspect: {
      category: "Appearance",
      internal: ["AppearAsVanillaEvil"],
      tags: ["Deception", "No Investigate"],
      description:
        "Appears as a Vanilla Evil Role from the setup when investigated or condemned. Appears as their real role on death.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: [
        "Faceless",
        "Unassuming",
        "Shady",
        "Phony",
        "Respected",
        "Camouflaged",
      ],
    },
    Shady: {
      category: "Appearance",
      internal: ["AppearAsRandomEvil"],
      tags: ["Deception", "No Investigate"],
      description:
        "Appears as a Random Evil Role from the setup when investigated or condemned. Appears as their real role on death.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: [
        "Faceless",
        "Unassuming",
        "Suspect",
        "Phony",
        "Respected",
        "Camouflaged",
      ],
    },
    Unassuming: {
      category: "Appearance",
      internal: ["AppearAsVillagerOnDeath"],
      tags: ["Villager", "Deception"],
      description: "Appears as Villager when condemned or on death.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Shady", "Faceless", "Suspect", "Phony", "Camouflaged"],
    },
    Phony: {
      category: "Appearance",
      internal: ["AppearAsVillagePROnDeath"],
      tags: ["Deception"],
      description: "Appears as Village Power Role when condemned or on death.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: [
        "Shady",
        "Faceless",
        "Suspect",
        "Unassuming",
        "Camouflaged",
      ],
    },
    Camouflaged: {
      category: "Appearance",
      internal: ["AppearAsRandomRole"],
      tags: ["Roles", "Deception", "No Investigate"],
      description:
        "Appears on death and to information roles as a random role in the game that is not Villager, Impersonator or Impostor.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Shady", "Faceless", "Suspect", "Unassuming", "Phony"],
    },
    Faceless: {
      category: "Appearance",
      internal: ["AppearAsFliplessOnDeath"],
      tags: ["Deception", "No Reveal"],
      description:
        "Player's role will be hidden from the town when condemned or on death.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Shady", "Unassuming", "Phony", "Suspect", "Camouflaged"],
    },
    //Sanity Mods
    Sane: {
      category: "Appearance",
      internal: ["TrueModifier"],
      tags: ["Information", "Sanity"],
      description: "All Information received by this role is true.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Confused", "Insane", "Naive", "Paranoid"],
    },
    Insane: {
      category: "Appearance",
      internal: ["FalseModifier"],
      tags: ["Information", "Sanity"],
      description: "All Information received by this role is false.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Sane", "Confused", "Naive", "Paranoid"],
    },
    Paranoid: {
      category: "Appearance",
      internal: ["UnfavorableModifier"],
      tags: ["Information", "Sanity"],
      description:
        "All Information received by this role will be unfavorable to the player being checked.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Sane", "Insane", "Confused", "Naive"],
    },
    Naive: {
      category: "Appearance",
      internal: ["FavorableModifier"],
      tags: ["Information", "Sanity"],
      description:
        "All Information received by this role will be favorable to the player being checked.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Sane", "Insane", "Confused", "Paranoid"],
    },
    Confused: {
      category: "Appearance",
      internal: ["ModifierConfused"],
      tags: ["Information", "Sanity", "RNG"],
      description: "Investigative reports appear incorrect 50% of the time.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Sane", "Insane", "Naive", "Paranoid"],
    },
    Biased: {
      category: "Appearance",
      internal: ["OnePlayerShowsAsEvil"],
      tags: ["Information"],
      description:
        "One Village-aligned player will have unfavorable results to this role's information abilities.",
      eventDescription: "This modifier does nothing when on an Event.",
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
  "Texas Hold Em": {},
  Cheat: {},
  Battlesnakes: {},
};

module.exports = modifierData;
