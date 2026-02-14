const itemData = require("./items");

const leakyDef = `Players who are "Leaky" will have all whispers involving them leak.`;
const blindDef = `Players who are "Blind" will see all speech as anonymous and cannot see votes.`;
const cluelessDef = `Players who are "Clueless" will see messages as being sent from random players.`;
const bleedingDef = `Players who are "Bleeding" will die during the next night.`;

//Item Def
const coffeeDef = itemData["Mafia"]["Coffee"].description;
const breadDef = itemData["Mafia"]["Bread"].description;
const armorDef = itemData["Mafia"]["Armor"].description;
const candleDef = itemData["Mafia"]["Candle"].description;
const knifeDef = itemData["Mafia"]["Knife"].description;
const bombDef = itemData["Mafia"]["Bomb"].description;
const tntDef = itemData["Mafia"]["TNT"].description;
const keyDef = itemData["Mafia"]["Key"].description;
const shieldDef = itemData["Mafia"]["Shield"].description;
const whiskeyDef = itemData["Mafia"]["Whiskey"].description;
const crystalBallDef = itemData["Mafia"]["Crystal Ball"].description;
const falconDef = itemData["Mafia"]["Falcon"].description;
const tractDef = itemData["Mafia"]["Tract"].description;
const gunDef = itemData["Mafia"]["Gun"].description;
const rifleDef = itemData["Mafia"]["Rifle"].description;
const needleDef = itemData["Mafia"]["Syringe"].description;
const envelopeDef = itemData["Mafia"]["Envelope"].description;
const orangeDef = itemData["Mafia"]["Yuzu Orange"].description;
const shavingCreamDef = itemData["Mafia"]["Shaving Cream"].description;
const sceptreDef = itemData["Mafia"]["Sceptre"].description;
const timeBombDef = itemData["Mafia"]["Timebomb"].description;
const revolverDef = itemData["Mafia"]["Revolver"].description;
const snowballDef = itemData["Mafia"]["Snowball"].description;
const jackBoxDef = itemData["Mafia"]["Jack-In-The-Box"].description;
const iceCreamDef = itemData["Mafia"]["Ice Cream"].description;

const modifierData = {
  Mafia: {
    Armed: {
      category: "Items",
      internal: ["StartWithGun"],
      tags: ["Items", "Killing", "Gun", "Day Killer"],
      description: "You start with a Gun. "+ gunDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Birdbrained: {
      category: "Items",
      internal: ["StartWithFalcon"],
      tags: ["Information", "Items", "Falcon", "Visits"],
      description: "You start with a Falcon. "+falconDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Bulletproof: {
      category: "Items",
      internal: ["StartWithArmor"],
      tags: ["Items", "Armor"],
      description: "You start with Armor. "+armorDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Caffeinated: {
      category: "Items",
      internal: ["StartWithCoffee"],
      tags: ["Items", "Coffee"],
      description: "You start with a Coffee. "+coffeeDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Playful: {
      category: "Items",
      internal: ["StartWithJack"],
      tags: ["Items", "Coffee"],
      description: "You start with a Jack-In-The-Box. "+jackBoxDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Churchgoing: {
      category: "Items",
      internal: ["StartWithTract"],
      tags: ["Items", "Convert Saver", "Tract"],
      description: "You start with a Tract. "+tractDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Creamed: {
      category: "Items",
      internal: ["StartWithIceCream"],
      tags: ["Items", "Ice Cream"],
      description:
        "You start with Ice Cream. "+iceCreamDef,
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Crystalline: {
      category: "Items",
      internal: ["StartWithCrystalBall"],
      tags: ["Revealing", "Items", "Crystal Ball"],
      description: "You start with a Crystal Ball. "+crystalBallDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Explosive: {
      category: "Items",
      internal: ["StartWithBomb"],
      tags: ["Items", "Killing"],
      description: "You start with a Bomb. "+bombDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Combustible: {
      category: "Items",
      internal: ["StartWithTNT"],
      tags: ["Items", "Killing"],
      description: "You start with TNT. "+tntDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Keyed: {
      category: "Items",
      internal: ["StartWithKey"],
      tags: ["Items", "Key"],
      description: "You start with a Key. "+keyDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Luminous: {
      category: "Items",
      internal: ["StartWithCandle"],
      tags: ["Information", "Items", "Candle", "Visits"],
      description: "You start with a Candle. "+candleDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Macabre: {
      category: "Items",
      internal: ["StartWithSyringe"],
      tags: ["Revive", "Items", "Syringe", "Graveyard Participation All"],
      description: "You start with a Syringe. "+needleDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Prosaic: {
      category: "Items",
      internal: ["StartWithEnvelope"],
      tags: ["Messages", "Items", "Envelope"],
      description: "You start with an Envelope. "+envelopeDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },

    Shielded: {
      category: "Items",
      internal: ["StartWithShield"],
      tags: ["Items"],
      description: "You start with a Shield. "+shieldDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Steeled: {
      category: "Items",
      internal: ["StartWithKnife"],
      tags: ["Bleeding", "Items", "Knife", "Killing", "Day Killer"],
      description: "You start with a Knife. "+knifeDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Rifled: {
      category: "Items",
      internal: ["StartWithRifle"],
      tags: ["Items", "Killing", "Gun", "Alignments", "Day Killer"],
      description: "You start with a Rifle. "+rifleDef,
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    //Other Item mods
    Gunslinging: {
      category: "Items",
      internal: ["DefendAndSnatchGun"],
      tags: ["Items", "Gun"],
      description: "If shot with a gun, you have 80% chance of snatching the gun.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Apprehensive: {
      category: "Items",
      internal: ["LearnVisitorsAndArm"],
      tags: ["Items", "Gun", "Killing", "Reflexive", "Information"],
      description:
        "Each night, you learn who visits you and you gain a gun (that will not reveal shooter) for each player who visits you.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    //Non-Starting Item
    Provocative: {
      category: "Items",
      internal: ["Provocative"],
      tags: ["Messages", "Items", "Sockpuppet"],
      description: "Each day, you gain a sockpuppet.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Tinkering: {
      category: "Items",
      internal: ["ForageItem"],
      tags: ["Items"],
      description:
        "Each night, if no one visits you, gain a random item. If killed, the killer will gain a Gun (that will always reveal shooter).",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    //Item Interaction
    Kleptomaniac: {
      category: "Items",
      internal: ["StealFromTargets"],
      tags: ["Items", "Visits"],
      description:
        "When you visit a player with your secondary action, you will steal all their items.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Klutzy: {
      category: "Items",
      internal: ["DropOwnItems"],
      tags: ["Items"],
      description: "You will passively drop any items held or received.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Covert: {
      category: "Items",
      internal: ["MakeAllGunsHidden"],
      tags: ["Items"],
      description:
        "All Guns, Knives, and Rifles you use will not reveal you.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Overt"],
    },
    Overt: {
      category: "Items",
      internal: ["MakeAllGunsReveal"],
      tags: ["Items"],
      description:
        "All Guns, Knives, and Rifles you use will reveal you.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Covert"],
    },

     Dead: {
      category: "Other",
      internal: ["Dead"],
      tags: ["Dead"],
      description: "You start the game dead.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Clannish: {
      category: "Other",
      internal: ["AddRottenCopy"],
      tags: ["Delirium", "Setup Changes"],
      description: `In closed setups will add 0 to 2 copies of this role, 1 of the added roles is permanently “Delirious”.`,
      eventDescription: "This modifier does nothing when on an Event.",
    },
    //Referance
    Austere: {
      category: "Other",
      internal: ["OnlyUseInPlayRoles"],
      tags: ["Austere"],
      description: "This role can only reference roles currently in the game.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Excessive"],
    },
    Bland: {
      category: "Other",
      internal: ["NoSpecialInteractions"],
      tags: ["Bland"],
      description: "Any Special Interactions this role has are disabled.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Excessive: {
      category: "Other",
      internal: ["ExcessiveRole"],
      tags: ["Excessive"],
      description: "This role treats every role on the site as an Excess Role.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Austere"],
    },
    //Death
    Strong: {
      category: "Other",
      internal: ["StrongModifier"],
      tags: ["Unblockable", "Strong"],
      description: "All kills performed by this player cannot be saved.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Macho: {
      category: "Other",
      internal: ["SaveImmune"],
      tags: ["Macho", "Save Immune"],
      description: "Can not be saved or protected from kills by any means.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Unlucky: {
      category: "Other",
      internal: ["UnluckyDeath"],
      tags: ["Killing"],
      description: "Can die at any time after night 1.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    //Convert
    Temporary: {
      category: "Other",
      internal: ["LoseModifiers"],
      tags: ["Temporary", "Modifiers"],
      description: "Loses their Modifiers at the end of the Night.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Pious: {
      category: "Other",
      internal: ["ConvertKillersOnDeath"],
      tags: ["Sacrificial", "Conversion"],
      description: "On death, has a chance to redeem their killer.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Chaotic: {
      category: "Other",
      internal: ["BecomeExcessRole"],
      tags: ["Conversion", "Excess Roles"],
      description:
        "On the first night, a player with this modifier will become a random excess role within their alignment. Independents will become excess roles from any alignment.",
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
    //Retired
    Backup: {
      category: "Other",
      internal: ["BackUpModifier"],
      tags: ["Conversion"],
      description:
        "Independents will become a Sidekick with this role as the Target. Other roles will have no abilities until a player with their role dies.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Retired"],
    },
    Retired: {
      category: "Other",
      internal: ["Retired"],
      tags: ["Information", "Retired"],
      description:
        "Starts knowing anyone who has the same role. Has all other abilities disabled",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Backup"],
    },
    //Info
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
    Insightful: {
      category: "Other",
      internal: ["Learn3ExcessRoles"],
      tags: ["Information", "Roles", "Excess Roles"],
      description:
        "Learns 3 excess roles upon the game's start. Mafia/Cult roles always learn Village-aligned excess roles.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Boastful: {
      category: "Other",
      internal: ["ModifierBoastful"],
      tags: ["Information", "Reports"],
      description:
        "Each night, you will announce any system messages you received.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Sensible: {
      category: "Other",
      internal: ["LearnIfRoleChanged"],
      tags: ["Information"],
      description: "Each night, learns what their role is.",
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

    //Immunites
    Unwavering: {
      category: "Other",
      internal: ["ConvertImmune"],
      tags: ["Convert Saver"],
      description: "You cannot be converted.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Reactionary: {
      category: "Other",
      internal: ["KillConverters"],
      tags: ["Convert Saver", "Killing", "Reflexive"],
      description:
        "Kills anyone (up to two people) who tries to convert them at night.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Unkillable: {
      category: "Other",
      internal: ["KillImmune"],
      tags: ["Unkillable"],
      description: "Can only be killed by condemn.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Blessed: {
      category: "Other",
      internal: ["StartWithExtraLife"],
      tags: ["Extra Lives"],
      description: "You start with an Extra Life",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Traitorous: {
      category: "Other",
      internal: ["TurnIntoTraitorOnMafiaKill"],
      tags: ["Sacrificial", "Conversion", "Traitor"],
      description: "If killed by the Mafia, you will survive and be converted to Traitor.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Hemophilic: {
      category: "Other",
      internal: ["ConvertKillToBleed"],
      tags: ["Bleeding", "Effect"],
      description: `If killed, you will survive and start "Bleeding". `+bleedingDef,
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Effect Mods
    Verrucose: {
      category: "Other",
      internal: ["GivePermaDelirium"],
      tags: ["Sacrificial", "Manipulative", "Delirium"],
      description:
        "On death a random Village Aligned player will be chosen to be made Delirious for the rest of the game.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Cursed: {
      category: "Other",
      internal: ["RemoveEffectsAppliedOnDeath"],
      tags: ["Effects"],
      description:
        "When this role dies or gets converted, any effects it inflicted will be removed.",
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
      description: "Your vote weight is worth [X] more votes.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Felonious", "Voteless"],
      allowDuplicate: true,
    },
    Inverse: {
      category: "Other",
      internal: ["VotingNegative"],
      tags: ["Voting"],
      description: "Your vote is Negative.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Felonious", "Voteless"],
    },
    Felonious: {
      category: "Other",
      internal: ["VotingPowerZero"],
      tags: ["Voting"],
      description: "Your vote is worth 0.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Trustworthy", "Inverse", "Voteless"],
    },
    Voteless: {
      category: "Other",
      internal: ["CannotVoteModifier"],
      tags: ["Voting"],
      description: "You cannot vote.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Trustworthy", "Inverse", "Felonious"],
    },
    Frustrated: {
      category: "Other",
      internal: ["FrustratedCondemnation"],
      tags: ["Voting", "Condemn"],
      description:
        "You cannot be condemned by majority vote. A non-zero minority vote will kill you.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Diplomatic"],
    },
    Diplomatic: {
      category: "Other",
      internal: ["CondemnImmune"],
      tags: ["Condemn", "Condemn Immune"],
      description: "You cannot be condemned.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Frustrated"],
    },
    Dovish: {
      category: "Other",
      internal: ["VillageMightSurviveCondemn"],
      tags: ["Condemn", "Condemn Immune", "Alignments", "Protective"],
      description:
        "Village-aligned players might survive being condemned.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    //Banished
    Banished: {
      category: "Other",
      internal: ["BanishedRole"],
      tags: ["Banished"],
      description:
        "You role will not spawn normally.",
      eventDescription: "This Event will not occur normally.",
      incompatible: ["Inclusive", "Exclusive"],
    },
    Inclusive: {
      category: "Other",
      internal: ["Add1Banished"],
      tags: ["Setup Changes", "Banished Interaction"],
      description:
        "In closed setups, replaces 1 non-Banished Village role with a Banished role.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
      incompatible: ["Banished", "Exclusive"],
    },
    Exclusive: {
      category: "Other",
      internal: ["Remove1Banished"],
      tags: ["Setup Changes", "Banished Interaction"],
      description:
        "In closed setups, replaces 1 Banished role with a non-Banished Village role.",
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
        "If a role with this modifier wins, then Village, Mafia, and Cult cannot also win alongside them.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Complacent"],
    },
    Complacent: {
      category: "Other",
      internal: ["AlwaysJoints"],
      tags: [],
      description:
        "If a role with this modifier wins, the game will continue and they will win at the end of the game.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Braggadocious"],
    },
    Demonic: {
      category: "Other",
      internal: ["Demonic"],
      tags: ["Demonic", "Essential"],
      description:
        "Village Wins if all Demonic roles are dead. Cult wins if a Demonic role is alive in the final 2 or only Cult and Demonic roles are alive.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Vital: {
      category: "Other",
      internal: ["KillAlignedOnDeath"],
      tags: ["Essential", "Selective Revealing", "Vital"],
      description:
        "If killed, all players with the same alignment will die too.",
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
      incompatible: ["Reclusive"],
    },
    Reclusive: {
      category: "Other",
      internal: ["MakeShyOnRoleShare"],
      tags: ["Role Share"],
      description:
        "Players who role-share with a Reclusive player become shy. Shy players cannot accept incoming role-shares and cannot Private/Public Reveal.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Brutish"],
    },
    Pneumatic: {
      category: "Other",
      internal: ["LearnRealWord"],
      tags: ["Ghost Interaction"],
      description: "Will learn the real word if a Ghost is present.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Hylic"],
    },
    Hylic: {
      category: "Other",
      internal: ["LearnFakeWord"],
      tags: ["Ghost Interaction"],
      description: "Will learn the fake word if a Ghost is present.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Pneumatic"],
    },

    //Visit Immunies
    Ascetic: {
      category: "Visits",
      internal: ["Ascetic"],
      tags: ["Role Blocker", "Kill Interaction", "Reflexive"],
      description: "Each night, you will block the non-killing night actions of any players who visit you.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Commuting"],
    },
    Commuting: {
      category: "Visits",
      internal: ["Commuting"],
      tags: ["Role Blocker", "Reflexive"],
      description: "Each night, you will block the night actions of any players who visit you.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Ascetic"],
    },
    Astral: {
      category: "Visits",
      internal: ["Astral"],
      tags: ["Visits", "Astral"],
      description: "Your secondary actions will not be counted as visits.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Leading: {
      category: "Visits",
      internal: ["LeadGroupActions"],
      tags: ["Visits", "Group Action Interaction"],
      description:
        "You will be the only member to act when performing a group action.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Slacking"],
    },
    Slacking: {
      category: "Visits",
      internal: ["AvoidGroupActions"],
      tags: ["Visits", "Group Action Interaction"],
      description:
        "You will not act when performing a group action if another member is acting.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Leading"],
    },
    Resolute: {
      category: "Visits",
      internal: ["Resolute"],
      tags: ["Unblockable"],
      description:
        "Your secondary actions cannot be blocked or controlled.",
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Proactive+Global+Lazy+Sudective
    Proactive: {
      category: "Visits",
      internal: ["MustAct"],
      tags: ["Action"],
      description: "You must take actions.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Global: {
      category: "Visits",
      internal: ["GlobalModifier"],
      tags: ["Visits", "Dawn"],
      description: "Your secondary night actions will target all players.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Lazy: {
      category: "Visits",
      internal: ["ModifierLazy"],
      tags: ["Manipulative", "Delayed"],
      description:
        "Your secondary night actions will be delayed until the following night.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Seductive: {
      category: "Visits",
      internal: ["BlockTargets"],
      tags: ["Visits", "Role Blocker"],
      description: "When you visit a player, that player will have their night actions blocked.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Medical: {
      category: "Visits",
      internal: ["NightSaveVisits"],
      tags: ["Visits", "Killing"],
      description:
        "When you visit a player, that player will be protected from death.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Bloodthirsty"],
    },
    Bloodthirsty: {
      category: "Visits",
      internal: ["ModifierBloodthirsty"],
      tags: ["Visits", "Killing"],
      description: "When you visit a player, that player will be killed.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Medical"],
    },
    Sharp: {
      category: "Visits",
      internal: ["CauseBleedingToTargets"],
      tags: ["Visits", "Bleeding", "Effect"],
      description: `When you visit a player, that player will start "Bleeding". ${bleedingDef}`,
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Visiting Info
    Loud: {
      category: "Visits",
      internal: ["ModifierLoud"],
      tags: ["Reflexive", "Information"],
      description:
        "Each night, you will announce who visits you.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Checking: {
      category: "Visits",
      internal: ["CheckSuccessfulVisit"],
      tags: ["Information", "Visits"],
      description: "When you visit a player, you learn if the visit was successful or if it was blocked.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Peeking: {
      category: "Visits",
      internal: ["WatchPlayerBoolean"],
      tags: ["Information", "Visits"],
      description:
        "When you visit a player, you learn if that player was visited by another player.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Clumsy: {
      category: "Visits",
      internal: ["RevealRoleToTarget"],
      tags: ["Information", "Visits", "Roles"],
      description:
        "When you visit a player, that player learns that your role visited them.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Noisy: {
      category: "Visits",
      internal: ["RevealNameToTarget"],
      tags: ["Information", "Visits"],
      description:
        "When you visit a player, that player learns that you visited them.",
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Redirection
    Bouncy: {
      category: "Visits",
      internal: ["Bouncy"],
      tags: ["Redirection"],
      description:
        "If possible, night kills targeting you will be redirected to another player who is not the killer.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Intangible"],
    },
    Intangible: {
      category: "Visits",
      internal: ["BouncyOnce"],
      tags: ["Redirection"],
      description:
        "If possible on the first night, night kills targeting you will be redirected to another player who is not the killer.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Bouncy"],
    },
    Magnetic: {
      category: "Visits",
      internal: ["Magnetic"],
      tags: ["Redirection"],
      description:
        "If possible, night kills will be redirected onto you if someone with the same alignment as you is targeted.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Random: {
      category: "Visits",
      internal: ["TargetRandom"],
      tags: ["Redirection", "RNG"],
      description: "Each night, you are redirected onto a random player.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Narcissistic: {
      category: "Visits",
      internal: ["TargetSelf50Percent"],
      tags: ["Redirection", "RNG"],
      description:
        "Each night, you have a 50% chance to be redirected onto yourself.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    //Meeting Mods
    "X-Shot": {
      category: "Visits",
      internal: ["OneShot"],
      tags: ["X-Shot"],
      description:
        "You can only perform secondary actions [X] time(s). Involuntary actions are not affected.",
      eventDescription: "This Event will only occur once.",
      allowDuplicate: true,
    },
    Even: {
      category: "Visits",
      internal: ["Even"],
      tags: ["Even", "Meetings"],
      description:
        "You can only perform secondary actions on even days and nights. Involuntary actions are not affected.",
      eventDescription: "This Event will only occur on Even nights.",
      incompatible: ["Odd", "Delayed"],
    },
    Odd: {
      category: "Visits",
      internal: ["Odd"],
      tags: ["Odd", "Meetings"],
      description:
        "You can only perform secondary actions on odd days and nights. Involuntary actions are not affected.",
      eventDescription: "This Event will only occur on Odd nights.",
      incompatible: ["Even"],
    },
    Delayed: {
      category: "Visits",
      internal: ["Delayed"],
      tags: ["Delayed", "Meetings"],
      description:
        "You cannot perform secondary actions for the first [X] day(s) and night(s). Involuntary actions are not affected.",
      eventDescription: "This Event will not occur on the first night.",
      incompatible: ["Suspended"],
      allowDuplicate: true,
    },
    Suspended: {
      category: "Visits",
      internal: ["Suspended"],
      tags: ["Suspended", "Meetings"],
      description:
        "You can only perform secondary actions for the first [X] day(s) and night(s). Involuntary actions are not affected.",
      eventDescription: "This Event can only occur on the first night.",
      allowDuplicate: true,
      incompatible: ["Delayed"],
    },

    //Targeting Mods
    Fair: {
      category: "Visits",
      internal: ["FairModifier"],
      tags: ["Fair", "Visits"],
      description: "You cannot target a player for targeted previously.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Nonconsecutive", "Consecutive"],
    },
    Consecutive: {
      category: "Visits",
      internal: ["Consecutive"],
      tags: ["Visits", "Consecutive"],
      description: "You can only target players you targeted previously.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Fair", "Nonconsecutive"],
    },
    Nonconsecutive: {
      category: "Visits",
      internal: ["Nonconsecutive"],
      tags: ["Visits", "Nonconsecutive"],
      description: "You cannot target a player you targeted the previous night",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Fair", "Consecutive"],
    },
    Selfish: {
      category: "Visits",
      internal: ["CanVisitSelf"],
      tags: ["Visits", "Role Blocker", "Selfish"],
      description: "You secondary actions can be used yourself.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Liminal: {
      category: "Visits",
      internal: ["VisitDeadOrAlive"],
      tags: ["Visits", "Dead", "Liminal"],
      description: "Your secondary actions can be used on dead or living players.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Morbid"],
    },
    Morbid: {
      category: "Visits",
      internal: ["VisitOnlyDead"],
      tags: ["Visits", "Dead", "Morbid"],
      description: "Your secondary actions can only be used on dead players.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Liminal"],
    },
    //Death Meeting Mods
    Transcendent: {
      category: "Visits",
      internal: ["ActAliveOrDead"],
      tags: ["Dead", "Graveyard", "Transcendent", "Graveyard Participation"],
      description: "You can perform secondary actions while either alive or dead.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Restless", "Vengeful", "Immolated"],
    },
    Restless: {
      category: "Visits",
      internal: ["ActWhileDead"],
      tags: ["Dead", "Graveyard", "Restless", "Graveyard Participation"],
      description: "You can only perform secondary actions while dead.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Transcendent", "Vengeful", "Immolated"],
    },
    Vengeful: {
      category: "Visits",
      internal: ["ActAfterNightKilled"],
      tags: ["Graveyard", "Vengeful", "Graveyard Participation"],
      description: "You can only perform secondary actions after being killed at night",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Transcendent", "Restless", "Immolated"],
    },
    Immolated: {
      category: "Visits",
      internal: ["ActAfterCondemned"],
      tags: ["Graveyard", "Vengeful", "Graveyard Participation"],
      description: "You can only perform secondary actions after being condemned.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Transcendent", "Restless", "Vengeful"],
    },
    //Death Visit
    Vain: {
      category: "Visits",
      internal: ["Vain"],
      tags: ["Visits", "Killing", "Alignments", "Self Kill"],
      description:
        "If you visit a player of the same alignment, you die.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Weak"],
    },
    Weak: {
      category: "Visits",
      internal: ["Weak"],
      tags: ["Visits", "Killing", "Alignments", "Self Kill"],
      description:
        "If you visit a player of the opposite alignment, you die.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Vain"],
    },
    Regretful: {
      category: "Visits",
      internal: ["Regretful"],
      tags: ["Killing", "Visits", "Self Kill"],
      description: "If you visit a player who is killed, you die.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Sacrificial: {
      category: "Visits",
      internal: ["Sacrificial"],
      tags: ["Sacrificial", "Killing", "Self Kill"],
      description:
        "When you visit a player, you die.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Fragile: {
      category: "Visits",
      internal: ["DieIfVisited"],
      tags: ["Killing", "Visits", "Self Kill"],
      description: "If you are visited, you die.",
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Death to self block
    Fatal: {
      category: "Visits",
      internal: ["BlockedIfKilled"],
      tags: ["Block Self", "Death"],
      description:
        "If killed at night, your secondary actions will be blocked..",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Sorrowful"],
    },
    Sorrowful: {
      category: "Visits",
      internal: ["BlockedUnlessKilled"],
      tags: ["Block Self", "Death"],
      description:
        "Unless killed at night, your secondary actions will be blocked..",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Fatal"],
    },

    //Self Block
    Loyal: {
      category: "Visits",
      internal: ["BlockIfVisitingThingModifiers"],
      tags: ["Visits", "Block Self", "Alignments", "Loyal"],
      description:
        "If you visit a player of the opposite alignment, your secondary actions will be blocked.",
      eventDescription: "This Event will not apply to Evil players.",
      incompatible: ["Disloyal", "Equitable"],
    },
    Disloyal: {
      category: "Visits",
      internal: ["BlockIfVisitingThingModifiers"],
      tags: ["Visits", "Block Self", "Alignments", "Disloyal"],
      description:
        "If you visit a player of the same alignment, your secondary actions will be blocked.",
      eventDescription: "This Event will not apply to Non-Evil players.",
      incompatible: ["Loyal", "Equitable"],
    },
    Complex: {
      category: "Visits",
      internal: ["BlockIfVisitingThingModifiers"],
      tags: ["Visits", "Block Self", "Vanilla Interaction", "Complex"],
      description:
        "If you visit a player with a vanilla role, your secondary actions will be blocked.",
      eventDescription:
        "This Event will not apply to players with Vanilla roles.",
      incompatible: ["Simple"],
    },
    Simple: {
      category: "Visits",
      internal: ["BlockIfVisitingThingModifiers"],
      tags: ["Visits", "Block Self", "Vanilla Interaction", "Simple"],
      description:
        "If you visit a player with a power role, your secondary actions will be blocked.",
      eventDescription: "This Event will not apply to non-Vanilla players.",
      incompatible: ["Complex"],
    },
    Holy: {
      category: "Visits",
      internal: ["BlockIfVisitingThingModifiers"],
      tags: ["Visits", "Block Self", "Modifiers", "Holy"],
      description:
        "If you visit a player with a Demonic role, your secondary actions will be blocked.",
      eventDescription: "This Event will not apply to Demonic players.",
      incompatible: ["Unholy"],
    },
    Unholy: {
      category: "Visits",
      internal: ["BlockIfVisitingThingModifiers"],
      tags: ["Visits", "Block Self", "Modifiers", "Unholy"],
      description:
        "If you visit a player with a non-Demonic role, your secondary actions will be blocked.",
      eventDescription: "This Event will not apply to non-Demonic players.",
      incompatible: ["Holy"],
    },
    Refined: {
      category: "Visits",
      internal: ["BlockIfVisitingThingModifiers"],
      tags: [
        "Visits",
        "Block Self",
        "Modifiers",
        "Refined",
        "Banished Interaction",
      ],
      description:
        "If you visit a player with a Banished role, your secondary actions will be blocked.",
      eventDescription: "This Event will not apply to Banished players.",
      incompatible: ["Unrefined"],
    },
    Unrefined: {
      category: "Visits",
      internal: ["BlockIfVisitingThingModifiers"],
      tags: [
        "Visits",
        "Block Self",
        "Modifiers",
        "Unrefined",
        "Banished Interaction",
      ],
      description:
        "If you visit a player with a non-Banished role, your secondary actions will be blocked.",
      eventDescription: "This Event will not apply to non-Banished players.",
      incompatible: ["Refined"],
    },

    Equitable: {
      category: "Visits",
      internal: ["BlockIfVisitingSameAlignmentTwice"],
      tags: ["Visits", "Block Self", "Alignments", "Equitable"],
      description:
        "If you visit a player of the same alignment as a player you visited the previous night, your secondary actions will be blocked.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Loyal", "Disloyal"],
    },

    //Sub Role Guessing
    Picky: {
      category: "Visits",
      internal: ["GuessRoleOrGetBlocked"],
      tags: ["Self Block"],
      description:
        "Each night, you must choose a role. Unless you visit a player with that role, your secondary actions will be blocked.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Choosy"],
    },
    Choosy: {
      category: "Visits",
      internal: ["GuessRoleToGetBlocked"],
      tags: ["Self Block"],
      description:
        "Each night, you must choose a role. If you visit a player with that role, your secondary actions will be blocked.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Picky"],
    },

    Preoccupied: {
      category: "Visits",
      internal: ["BlockIfVisited"],
      tags: ["Visits", "Block Self"],
      description:
        "If you are visited, your secondary actions will be blocked.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Fearful: {
      category: "Visits",
      internal: ["BlockedIfScary"],
      tags: ["Self Block"],
      description: "If a Scary role is alive, your secondary actions will be blocked.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Scary: {
      category: "Visits",
      internal: ["BlockedFearful"],
      tags: ["Self Block"],
      description: "When you are alive, all Fearful roles will have their secondary actions will be blocked.",
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Reveal Mods
    Exposed: {
      category: "Appearance",
      internal: ["PublicReveal"],
      tags: ["Reveal Self"],
      description: "You are revealed to all players.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Notable", "Infamous"],
    },
    Notable: {
      category: "Appearance",
      internal: ["RevealToVillage"],
      tags: ["Reveal Self"],
      description: "You are revealed to all Village-aligned players.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Exposed"],
    },
    Infamous: {
      category: "Appearance",
      internal: ["RevealToEvils"],
      tags: ["Reveal Self"],
      description: "You are revealed to all Evil players.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Exposed"],
    },

    //Self Appearance
    Humble: {
      category: "Appearance",
      internal: ["Humble"],
      tags: ["Vanilla", "Villager", "Self Appearance"],
      description:
        "You see self as Villager (Village) / Mafioso (Mafia) / Cultist (Cult) / Grouch (Independent) with no modifier.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Scatterbrained"],
    },
    Scatterbrained: {
      category: "Appearance",
      internal: ["Scatterbrained"],
      tags: ["Visitor"],
      description:
        "You see self as Visitor (Village) / Trespasser (Mafia) / Bogeyman (Cult) / Fool (Independent) with no modifier.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Humble"],
    },
    Modest: {
      category: "Appearance",
      internal: ["Modest"],
      tags: ["Modifiers"],
      description: "You cannot see your modifiers.",
      eventDescription: "This modifier does nothing when on an Event.",
    },

    //Investigative Appearance Mods
    Masked: {
      category: "Appearance",
      internal: ["DisguiseAsTarget"],
      tags: ["Roles", "Deception", "Suits"],
      description: "When you visit a player, you gain a suit of each that player's role.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Respected: {
      category: "Appearance",
      internal: ["VillagerToInvestigative"],
      tags: ["Villager", "Deception", "No Investigate"],
      description: "You appear as a Villager to information roles.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Suspect", "Shady", "Camouflaged"],
    },
    Wannabe: {
      category: "Appearance",
      internal: ["Wannabe"],
      tags: ["Deception"],
      description:
        "You appear to visit a player who dies at night, prioritizing players who are killed by the mafia.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    //Death Appearance Mods
    Suspect: {
      category: "Appearance",
      internal: ["AppearAsVanillaEvil"],
      tags: ["Deception", "No Investigate"],
      description:
        "You appear as an vanilla evil role when condemned and to information roles. You appear as your real role when killed.",
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
        "You appear as an evil role when condemned and to information roles. You appear as your real role when killed.",
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
      description: "You appear as Villager when you die.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Shady", "Faceless", "Suspect", "Phony", "Camouflaged"],
    },
    Phony: {
      category: "Appearance",
      internal: ["AppearAsVillagePROnDeath"],
      tags: ["Deception"],
      description: "You appear as Village power role when you die.",
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
        "You appear as a random role to information roles and when you die. (The role cannot be Villager, Impersonator or Impostor).",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Shady", "Faceless", "Suspect", "Unassuming", "Phony"],
    },
    Faceless: {
      category: "Appearance",
      internal: ["AppearAsFliplessOnDeath"],
      tags: ["Deception", "No Reveal"],
      description:
        "Your role will be hidden when you die.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Shady", "Unassuming", "Phony", "Suspect", "Camouflaged"],
    },
    //Sanity Mods
    Sane: {
      category: "Appearance",
      internal: ["TrueModifier"],
      tags: ["Information", "Sanity"],
      description:
        "All information from your ability is true. Your modifiers are hidden.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Confused", "Insane", "Naive", "Paranoid"],
    },
    Insane: {
      category: "Appearance",
      internal: ["FalseModifier"],
      tags: ["Information", "Sanity"],
      description:
        "All information from your ability is false. Your modifiers are hidden.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Sane", "Confused", "Naive", "Paranoid"],
    },
    Paranoid: {
      category: "Appearance",
      internal: ["UnfavorableModifier"],
      tags: ["Information", "Sanity"],
      description:
        "All information from your ability will be unfavorable to the player being checked. Your modifiers are hidden.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Sane", "Insane", "Confused", "Naive"],
    },
    Naive: {
      category: "Appearance",
      internal: ["FavorableModifier"],
      tags: ["Information", "Sanity"],
      description:
        "All information from your ability will be favorable to the player being checked. Your modifiers are hidden.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Sane", "Insane", "Confused", "Paranoid"],
    },
    Confused: {
      category: "Appearance",
      internal: ["ModifierConfused"],
      tags: ["Information", "Sanity", "RNG"],
      description:
        "All information from your ability has a 50% chance to be made false. Your modifiers are hidden.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Sane", "Insane", "Naive", "Paranoid"],
    },
    Biased: {
      category: "Appearance",
      internal: ["OnePlayerShowsAsEvil"],
      tags: ["Information"],
      description:
        "One Village-aligned player will have unfavorable results to your information abilities.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Literal: {
      category: "Appearance",
      internal: ["LiteralAppearance"],
      tags: ["Information"],
      description:
        "Your appearance to information roles will also affect non-information abilites.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    //Speaking
    //Speaking Mods
    Blind: {
      category: "Chat",
      internal: ["Blind"],
      tags: ["Speech", "Blind", "Effect"],
      description: `You start the game "Blind". ${blindDef}`,
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Clueless"],
    },
    Clueless: {
      category: "Chat",
      internal: ["Clueless"],
      tags: ["Speech", "Clueless", "Random Messages", "Effect"],
      description: `You start the game "Clueless". ${cluelessDef}`,
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Blind"],
    },
    Leaky: {
      category: "Chat",
      internal: ["ModifierLeaky"],
      tags: ["Whispers", "Effect"],
      description: `You start the game "Leaky". ${leakyDef}`,
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Haunting: {
      category: "Chat",
      internal: ["CanSpeakWhenDead"],
      tags: ["Speech", "Effect", "Graveyard Participation"],
      description: `You can talk with alive players when dead.`,
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Paranormal: {
      category: "Chat",
      internal: ["CanSeeDeadChat"],
      tags: ["Speech", "Effect", "Graveyard Participation All"],
      description: `You can talk with dead players when alive.`,
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Telepathic: {
      category: "Chat",
      internal: ["ModifierTelepathic"],
      tags: ["Speaking"],
      description: "You can anonymously contact any player.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Neighborly: {
      category: "Chat",
      internal: ["MeetWithNeighbors"],
      tags: ["Meeting"],
      description: "You meet with your neighbors at night.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Social: {
      category: "Chat",
      internal: ["MeetWithSocial"],
      tags: ["Meeting"],
      description: "You meet with all Social roles at night.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Renegade: {
      category: "Other",
      internal: ["BecomeRedMafia"],
      tags: ["Alignments"],
      description: "Mafia roles with this modifier applied join the Red Mafia.",
    },
  },
  Resistance: {},
  Jotto: {},
  Acrotopia: {},
  "Secret Dictator": {},
  "Secret Hitler": {},
  "Wacky Words": {},
  "Liars Dice": {},
  "Texas Hold Em": {},
  Cheat: {},
  Ratscrew: {},
  Battlesnakes: {},
  "Connect Four": {},
  "Dice Wars": {},
};

module.exports = modifierData;
