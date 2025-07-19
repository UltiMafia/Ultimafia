const modifierData = {
  Mafia: {
    Armed: {
      internal: ["StartWithGun"],
      tags: ["Items", "Killing", "Gun", "Day Killer"],
      description: "Starts with a gun.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Apprehensive: {
      internal: ["LearnVisitorsAndArm"],
      tags: ["Items", "Gun", "Killing", "Reflexive", "Information"],
      description:
        "Will receive a Gun (that will not reveal shooter) with each visit and learn the name of the visitor.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Ascetic: {
      internal: ["Ascetic"],
      tags: ["Role Blocker", "Kill Interaction", "Reflexive"],
      description: "Is untargetable from all non-killing actions.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Astral: {
      internal: ["Astral"],
      tags: ["Visits", "Astral"],
      description: "All actions done by this player are not visits.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Backup: {
      internal: ["BackUpModifier"],
      tags: ["Conversion"],
      description:
        "Independents will become a Sidekick with this role as the Target. Other roles will have no abilites until a player with their role dies.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Retired"],
    },
    Banished: {
      internal: ["BanishedRole"],
      tags: ["Banished"],
      description:
        "Banished roles will only spawn if the Banished count is increased, or if another roles adds Banished roles to the game.",
      eventDescription: "This Event will not occur normally.",
      incompatible: ["Inclusive", "Exclusive"],
    },
    Birdbrained: {
      internal: ["StartWithFalcon"],
      tags: ["Information", "Items", "Falcon", "Visits"],
      description: "Starts with a falcon.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Biased: {
      internal: ["OnePlayerShowsAsEvil"],
      tags: ["Information"],
      description: "One Village-aligned player will have unfavorable results to this role's information abilities.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Blessed: {
      internal: ["StartWithExtraLife"],
      tags: ["Extra Lives"],
      description: "Starts with an Extra Life",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Blind: {
      internal: ["Blind"],
      tags: ["Speech", "Blind"],
      description: "Sees all speech as anonymous.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Bloodthirsty: {
      internal: ["ModifierBloodthirsty"],
      tags: ["Visits", "Killing"],
      description: "When visiting, their target will be killed.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Bouncy: {
      internal: ["Bouncy"],
      tags: ["Redirection"],
      description:
        "If possible, night kills will be redirected to another player of the same alignment.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Braggadocious: {
      internal: ["PreventFactionJoints"],
      tags: [],
      description:
        "If a player with this modifier wins, then Village, Mafia, and Cult cannot also win alongside them.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Brutish: {
      internal: ["MakeSkittishOnRoleShare"],
      tags: [],
      description:
        "Players who role-share with a Brutish player become skittish. Skittish players must accept all incoming role-shares.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Bulletproof: {
      internal: ["StartWithArmor"],
      tags: ["Items", "Armor"],
      description: "Starts with armor.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Caffeinated: {
      internal: ["StartWithCoffee"],
      tags: ["Items", "Convert Saver", "Tract"],
      description: "Starts with a tract.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Camouflaged: {
      internal: ["AppearAsRandomRole"],
      tags: ["Roles", "Deception"],
      description:
        "Appears on death and to information roles as a random role in the game that is not Villager, Impersonator or Impostor.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Chaotic: {
      internal: ["BecomeExcessRole"],
      tags: ["Conversion", "Excess Roles"],
      description:
        "On the first night, a player with this modifier will become a random excess role within their alignment. Independents will become excess roles from any alignment.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Checking: {
      internal: ["CheckSuccessfulVisit"],
      tags: ["Information", "Visits"],
      description: "Learns if their visit was successful or if it was blocked.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Churchgoing: {
      internal: ["StartWithTract"],
      tags: ["Items", "Convert Saver", "Tract"],
      description: "Starts with a tract.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Clannish: {
      internal: ["AddRottenCopy"],
      tags: ["Delirium", "Setup Changes"],
      description:
        "In closed Setups will add 0 to 2 Copies of This Role, 1 of the added roles is Permanently given Delirium.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Clueless: {
      internal: ["Clueless"],
      tags: ["Speech", "Clueless", "Random Messages"],
      description: "Sees all speech as coming from random people.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Clumsy: {
      internal: ["RevealRoleToTarget"],
      tags: ["Information", "Visits", "Roles"],
      description:
        "Announces the player's role to the targets of their night actions.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Choosy: {
      internal: ["GuessRoleToGetBlocked"],
      tags: ["Self Block"],
      description: "Each night chooses a role. Actions will be blocked if visiting a player with that role.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Complex: {
      internal: ["Complex"],
      tags: ["Visits", "Block Self", "Vanilla", "Complex"],
      description:
        "If this player visits a player with a vanilla role, all their actions will be blocked.",
      eventDescription:
        "This Event will not apply to players with Vanilla roles.",
      incompatible: ["Simple"],
    },
    Commuting: {
      internal: ["Commuting"],
      tags: ["Role Blocker", "Reflexive"],
      description: "Is untargetable from all actions.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Confused: {
      internal: ["ModifierConfused"],
      tags: ["Manipulative", "Delirium", "Block Self"],
      description: "Investigative reports appear incorrect 50% of the time.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Sane", "Insane", "Naive", "Paranoid"],
    },
    Consecutive: {
      internal: ["Consecutive"],
      tags: ["Visits", "Block Self", "Consecutive"],
      description:
      "Can only target players they targeted previously.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Fair", "Nonconsecutive"],
    },
    Crystalline: {
      internal: ["StartWithCrystal"],
      tags: ["Revealing", "Items", "Crystal"],
      description: "Starts with a crystal ball.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Dead: {
      internal: ["Dead"],
      tags: ["Dead"],
      description: "Starts game dead",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Demonic: {
      internal: ["Demonic"],
      tags: ["Demonic", "Essential"],
      description:
        "Cult will win if a Demonic player is alive in final 2 or only Demonic and Cult players are alive. If all Demonic players are dead, all Cult-aligned players will die.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Delayed: {
      internal: ["Delayed"],
      tags: ["Delayed", "Meetings"],
      description:
        "Cannot attend secondary meetings for the first day and night.",
      eventDescription: "This Event will not occur on the first night.",
      incompatible: ["Suspended"],
      allowDuplicate: true,
    },
    Diplomatic: {
      internal: ["CondemnImmune"],
      tags: ["Condemn", "Condemn Immune"],
      description: "Cannot be condemned.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Frustrated"],
    },
    Disloyal: {
      internal: ["Disloyal"],
      tags: ["Visits", "Block Self", "Alignments", "Disloyal"],
      description:
        "If this player visits a player of the same alignment, their secondary actions will be blocked.",
      eventDescription: "This Event will not apply to Non-Evil players.",
      incompatible: ["Loyal"],
    },
    Dovish: {
      internal: ["VillageMightSurviveCondemn"],
      tags: ["Condemn", "Condemn Immune", "Alignments", "Protective"],
      description:
        "While a role with this modifier is in play, Village-aligned players might survive being condemned",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Even: {
      internal: ["Even"],
      tags: ["Even", "Meetings"],
      description:
        "Can only attend secondary meetings on even days and nights.",
      eventDescription: "This Event will only occur on Even nights.",
      incompatible: ["Odd", "Delayed"],
    },
    Exclusive: {
      internal: ["Remove1Banished"],
      tags: ["Banished", "Setup Changes"],
      description: "Removes 1 Banished Role in Closed Setups.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
      incompatible: ["Banished", "Inclusive"],
    },
    Exposed: {
      internal: ["PublicReveal"],
      tags: ["Reveal Self"],
      description: "Starts revealed to everyone.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Humble", "Scatterbrained", "Respected", "Modest"],
    },
    Explosive: {
      internal: ["StartWithBomb"],
      tags: ["Items", "Killing"],
      description: "Starts with a bomb.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Faceless: {
      internal: ["AppearAsFliplessOnDeath"],
      tags: ["Clean Night Kill"],
      description:
        "Player's role will be hidden from the town when condemned or on death.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Shady", "Unassuming", "Suspect"],
    },
    Fair: {
      internal: ["FairModifier"],
      tags: ["Fair"],
      description:
        "Cannot target a previously targeted player.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Nonconsecutive", "Consecutive"],
    },
    Felonious: {
      internal: ["VotingPowerZero"],
      tags: ["Voting"],
      description: "Player's vote is worth 0.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Trustworthy", "Untrustworthy"],
    },
    Frustrated: {
      internal: ["FrustratedCondemnation"],
      tags: ["Voting", "Condemn"],
      description:
        "Cannot be condemned by majority vote. A non-zero minority vote will kill the target.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Diplomatic"],
    },
    Global: {
      internal: ["GlobalModifier"],
      tags: ["Visits", "Dawn"],
      description: "Will target All players at Night",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Gunslinging: {
      internal: ["DefendAndSnatchGun"],
      tags: ["Items", "Gun"],
      description: "80% chance of snatching a gun when shot at.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Hemophilic: {
      internal: ["ConvertKillToBleed"],
      tags: ["Bleeding"],
      description:
        "If this player is shot or targeted for a kill, will bleed and then die in one day.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Holy: {
      internal: ["Holy"],
      tags: ["Visits", "Block Self", "Modifiers", "Holy"],
      description:
        "If this player visits a player with a Demonic role, their secondary actions will be blocked.",
      eventDescription: "This Event will not apply to Demonic players.",
      incompatible: ["Unholy"],
    },
    Humble: {
      internal: ["Humble"],
      tags: ["Vanilla"],
      description:
        "Appears as Villager (Village) / Mafioso (Mafia) / Cultist (Cult) / Grouch (Independent) to self with no modifier.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Respected", "Scatterbrained", "Exposed"],
    },
    Inclusive: {
      internal: ["Add1Banished"],
      tags: ["Banished", "Setup Changes"],
      description: "Adds 1 Banished Role in Closed Setups.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
      incompatible: ["Banished", "Exclusive"],
    },
    Infamous: {
      internal: ["RevealToEvils"],
      tags: ["Reveal Self"],
      description: "Starts revealed to all Evil players.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Exposed"],
    },
    Insane: {
      internal: ["FalseModifier"],
      tags: ["FalseMode"],
      description: "All Information received by this role is false.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Insightful: {
      internal: ["Learn3ExcessRoles"],
      tags: ["Investigative", "Roles", "Excess Roles"],
      description:
        "Learns 3 excess roles upon the game's start. Mafia/Cult roles always learn Village-aligned excess roles.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Inverse: {
      internal: ["VotingNegative"],
      tags: ["Voting"],
      description: "Player's vote is Negative.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Felonious"],
    },
    Kleptomaniac: {
      internal: ["StealFromTargets"],
      tags: ["Items", "Visits"],
      description:
        "While visiting a player, that player's items will be stolen.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Klutzy: {
      internal: ["DropOwnItems"],
      tags: ["Items"],
      description: "Will passively drop any items held or received.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Lazy: {
      internal: ["ModifierLazy"],
      tags: ["Manipulative", "Delayed"],
      description:
        "Actions taken on night will only execute after a full day/night phase.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Liminal: {
      internal: ["VisitDeadOrAlive"],
      tags: ["Visits", "Dead", "Liminal"],
      description: "Secondary actions can be used on dead or living players.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Linchpin: {
      internal: ["KillAlignedOnDeath"],
      tags: ["Essential", "Selective Revealing", "Linchpin"],
      description: "If dead, all aligned players will die too.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Lone: {
      internal: ["ModifierLone"],
      tags: ["Lone"],
      description:
        "If this role typically has a group meeting at night, they will not meet with or know the identity of their partner(s).",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Loud: {
      internal: ["ModifierLoud"],
      tags: ["Reflexive", "Information", "Whispers"],
      description:
        "If visited, cries out the identity of players who visited them during the night. All reports received are announced to everyone, with the player's role revealed. All whispers involving a player with this modifier are leaked.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Loyal: {
      internal: ["Loyal"],
      tags: ["Visits", "Block Self", "Alignments", "Loyal"],
      description:
        "If this player visits a player of the opposite alignment, their secondary actions will be blocked.",
      eventDescription: "This Event will not apply to Evil players.",
      incompatible: ["Disloyal"],
    },
    Luminous: {
      internal: ["StartWithCandle"],
      tags: ["Information", "Items", "Candle", "Visits"],
      description: "Starts with a candle.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Macho: {
      internal: ["SaveImmune"],
      tags: ["Macho", "Save Immune"],
      description: "Can not be saved or protected from kills by any means.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Macabre: {
      internal: ["StartWithSyringe"],
      tags: ["Revive", "Items", "Syringe", "Graveyard"],
      description: "Starts with a syringe.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Married: {
      internal: ["LearnAndLifeLinkToPlayer"],
      tags: ["Information", "Linked"],
      description:
        "On Night 1 will learn a Village-aligned player and their role. If that player is killed by the Mafia or a Demonic role, the Married player dies.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Masked: {
      internal: ["DisguiseAsTarget"],
      tags: ["Roles", "Deception", "Suits"],
      description: "Gains a suit of each target's role.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Modest: {
      internal: ["Modest"],
      tags: ["Modifiers"],
      description: "Appears to self with no modifiers.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Exposed"],
    },
    Morbid: {
      internal: ["VisitOnlyDead"],
      tags: ["Visits", "Dead", "Morbid"],
      description: "Secondary actions can only be used on dead players.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Narcissistic: {
      internal: ["TargetSelf50Percent"],
      tags: ["Redirection"],
      description:
        "Each night has 50% chance to be redirected onto themselves.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Neighborly: {
      internal: ["MeetWithNeighbors"],
      tags: ["Meeting"],
      description: "Attends a Night Meeting with their Neighbors.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Noisy: {
      internal: ["RevealNameToTarget"],
      tags: ["Information", "Visits"],
      description:
        "Announces the player's name to the targets of their night actions.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Notable: {
      internal: ["RevealToVillage"],
      tags: ["Reveal Self"],
      description: "Starts revealed to all Village-aligned players.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Exposed"],
    },
    Nonconsecutive: {
      internal: ["Nonconsecutive"],
      tags: ["Visits", "Block Self", "Nonconsecutive"],
      description:
        "Cannot target a player they targeted the previous night",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Fair", "Consecutive"],
    },
    Odd: {
      internal: ["Odd"],
      tags: ["Odd", "Meetings"],
      description: "Can only attend secondary meetings on odd days and nights.",
      eventDescription: "This Event will only occur on Odd nights.",
      incompatible: ["Even"],
    },
    Omniscient: {
      internal: ["Omniscient"],
      tags: ["Roles", "Visits", "Information"],
      description: "Each night see all visits and learn all players roles.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    "X-Shot": {
      internal: ["OneShot"],
      tags: ["X-Shot"],
      description: "Can only perform actions X times. X is equal the number of times this modifier is added.",
      eventDescription: "This Event will only occur once.",
      allowDuplicate: true,
    },
    Picky: {
      internal: ["GuessRoleOrGetBlocked"],
      tags: ["Self Block"],
      description: "Each night chooses a role. Actions will be blocked unless visiting a player with that role.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Pious: {
      internal: ["ConvertKillersOnDeath"],
      tags: ["Sacrificial", "Conversion"],
      description: "On death, has a chance to redeem their killer.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Preoccupied: {
      internal: ["BlockIfVisited"],
      tags: ["Visits", "Block Self"],
      description:
        "If visited during the night, blocks the player's night action.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Proactive: {
      internal: ["MustAct"],
      tags: ["Action"],
      description: "Must take actions.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Prosaic: {
      internal: ["StartWithEnvelope"],
      tags: ["Messages", "Items", "Envelope"],
      description: "Starts with an envelope.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Provocative: {
      internal: ["Provocative"],
      tags: ["Messages", "Items", "Sockpuppet"],
      description: "Each day, receives a sockpuppet.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Random: {
      internal: ["TargetRandom"],
      tags: ["Redirection"],
      description: "Each night is redirected onto a random player.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Reactionary: {
      internal: ["KillConverters"],
      tags: ["Convert Saver", "Killing", "Reflexive"],
      description:
        "Kills anyone (up to two people) who tries to convert them at night.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Reclusive: {
      internal: ["MakeShyOnRoleShare"],
      tags: ["Killing", "Visits", "Self Kill"],
      description:
        "Players who role-share with a Reclusive player become shy. Shy players cannot accept incoming role-shares and cannot Private/Public Reveal.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Regretful: {
      internal: ["Regretful"],
      tags: ["Killing", "Visits", "Self Kill"],
      description: "Will be killed if their target was killed.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Refined: {
      internal: ["Refined"],
      tags: ["Visits", "Block Self", "Modifiers", "Refined"],
      description:
        "If this player visits a player with a Banished role, their secondary actions will be blocked.",
      eventDescription: "This Event will not apply to Banished players.",
      incompatible: ["Unrefined"],
    },
    Resolute: {
      internal: ["Resolute"],
      tags: ["Unblockable"],
      description:
        "All actions done by this player cannot be roleblocked or controlled.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Respected: {
      internal: ["VillagerToInvestigative"],
      tags: ["Villager", "Deception"],
      description: "Appears as a Villager to investigative roles.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Humble", "Scatterbrained", "Exposed"],
    },
    Restless: {
      internal: ["ActWhileDead"],
      tags: ["Dead", "Graveyard", "Restless", "Graveyard Participation"],
      description: "Can only perform secondary actions while dead.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Transcendent", "Vengeful"],
    },
    Retired: {
      internal: ["Retired"],
      tags: ["Information", "Retired"],
      description:
        "Starts knowing anyone who has the same role. Has all other abilites disabled",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Backup"],
    },
    Rifled: {
      internal: ["StartWithRifle"],
      tags: ["Items", "Killing", "Gun", "Alignments", "Day Killer"],
      description: "Starts with a rifle.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Sacrificial: {
      internal: ["Sacrificial"],
      tags: ["Sacrificial", "Killing", "Self Kill"],
      description:
        "Will sacrifice themselves and die, if they ever visit another player.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Scatterbrained: {
      internal: ["Scatterbrained"],
      tags: ["Visitor"],
      description:
        "Appears as Visitor (Village) / Trespasser (Mafia) / Bogeyman (Cult) / Fool (Independent) to self with no modifier.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Humble", "Respected", "Exposed"],
    },
    Seductive: {
      internal: ["BlockTargets"],
      tags: ["Visits", "Role Blocker"],
      description: "While visiting a player, that player will be roleblocked.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Selfish: {
      internal: ["CanVisitSelf"],
      tags: ["Visits", "Role Blocker", "Selfish"],
      description: "Can target themselves.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Sensible: {
      internal: ["LearnIfRoleChanged"],
      tags: ["Information"],
      description: "Each night learn what their role is.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Shady: {
      internal: ["AppearAsRandomEvil"],
      tags: ["Deception"],
      description:
        "Appears as a Random Evil Role from the setup when investigated or condemned. Appears as their real role on death.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Faceless", "Unassuming", "Suspect"],
    },
    Shielded: {
      internal: ["StartWithShield"],
      tags: ["Items"],
      description: "Starts with a Shield.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Suspect: {
      internal: ["AppearAsVanillaEvil"],
      tags: ["Deception"],
      description:
        "Appears as a Vanilla Evil Role from the setup when investigated or condemned. Appears as their real role on death.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Faceless", "Unassuming", "Shady"],
    },
    Simple: {
      internal: ["Simple"],
      tags: ["Visits", "Block Self", "Vanilla", "Simple"],
      description:
        "If this player visits a player with a power role, all their actions will be blocked.",
      eventDescription: "This Event will not apply to non-Vanilla players.",
      incompatible: ["Complex"],
    },
    Social: {
      internal: ["MeetWithSocial"],
      tags: ["Meeting"],
      description: "Attends a meeting with all other Social players.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Steeled: {
      internal: ["StartWithKnife"],
      tags: ["Bleeding", "Items", "Knife", "Killing", "Day Killer"],
      description: "Starts with a knife.",
      eventDescription: "This modifier does nothing when on an Event.",
      allowDuplicate: true,
    },
    Strong: {
      internal: ["StrongModifier"],
      tags: ["Unblockable", "Strong"],
      description: "All kills performed by this player cannot be saved.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Suspended: {
      internal: ["Suspended"],
      tags: ["Suspended", "Meetings"],
      description:
        "Can only attend secondary meetings for the first day and night.",
      eventDescription: "This Event can only occur on the first night.",
      allowDuplicate: true,
      incompatible: ["Delayed"],
    },
    Telepathic: {
      internal: ["ModifierTelepathic"],
      tags: ["Speaking"],
      description: "May anonymously contact any player.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Temporary: {
      internal: ["LoseModifiers"],
      tags: ["Temporary", "Modifiers"],
      description: "Loses their Modifiers at the end of the Night.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Tinkering: {
      internal: ["ForageItem"],
      tags: ["Items"],
      description:
        "Crafts a random item if not visited during the night. If killed, the killer will find a gun that always reveals.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Traitorous: {
      internal: ["TurnIntoTraitorOnMafiaKill"],
      tags: ["Sacrificial", "Conversion", "Traitor"],
      description: "If killed by the Mafia, will turn into a Traitor instead.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Transcendent: {
      internal: ["ActAliveOrDead"],
      tags: ["Dead", "Graveyard", "Transcendent", "Graveyard Participation"],
      description: "Can perform secondary actions while either alive or dead.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Restless", "Vengeful"],
    },
    Trustworthy: {
      internal: ["VotingPowerIncrease"],
      tags: ["Voting"],
      description: "Player's vote is worth 1 more.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Felonious"],
      allowDuplicate: true,
    },
    Unassuming: {
      internal: ["AppearAsVillagerOnDeath"],
      tags: ["Villager", "Deception"],
      description: "Appears as Villager when condemned or on death.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Shady", "Faceless", "Suspect"],
    },
    Unholy: {
      internal: ["Unholy"],
      tags: ["Visits", "Block Self", "Modifiers", "Unholy"],
      description:
        "If this player visits a player with a non-Demonic role, their secondary actions will be blocked.",
      eventDescription: "This Event will not apply to non-Demonic players.",
      incompatible: ["Holy"],
    },
    Unkillable: {
      internal: ["KillImmune"],
      tags: ["Unkillable"],
      description: "Can only be killed by condemn.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Unlucky: {
      internal: ["UnluckyDeath"],
      tags: ["Killing"],
      description: "After Night 1, You can die at any time.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Unrefined: {
      internal: ["Unrefined"],
      tags: ["Visits", "Block Self", "Modifiers", "Unrefined"],
      description:
        "If this player visits a player with a non-Banished role, their secondary actions will be blocked.",
      eventDescription: "This Event will not apply to non-Banished players.",
      incompatible: ["Refined"],
    },
    Unwavering: {
      internal: ["ConvertImmune"],
      tags: ["Convert Saver"],
      description: "Cannot be converted to another role.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Vain: {
      internal: ["Vain"],
      tags: ["Visits", "Killing", "Alignments", "Self Kill"],
      description:
        "If this player visits a player of the same alignment, they die.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Weak"],
    },
    Vengeful: {
      internal: ["ActAfterNightKilled"],
      tags: ["Graveyard", "Vengeful", "Graveyard Participation"],
      description: "Can perform secondary actions after being killed at night",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Transcendent", "Restless"],
    },
    Verrucose: {
      internal: ["GivePermaDelirium"],
      tags: ["Sacrificial", "Manipulative", "Delirium"],
      description:
        "On death a random Village Aligned player will be chosen to be made Delirious for the rest of the game.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Versatile: {
      internal: ["InheritFirstDeadAligned"],
      tags: ["Dead", "Conversion"],
      description:
        "Will passively convert to the role of the first aligned power role.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Wannabe: {
      internal: ["Wannabe"],
      tags: ["Deception"],
      description:
        "Appears to visit a player who dies at night, prioritizing players who are killed by the mafia.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Weak: {
      internal: ["Weak"],
      tags: ["Visits", "Killing", "Alignments", "Self Kill"],
      description:
        "If this player visits a player of the opposite alignment, they die.",
      eventDescription: "This modifier does nothing when on an Event.",
      incompatible: ["Vain"],
    },
    Wise: {
      internal: ["MakePlayerLearnOneOfTwoPlayersOnDeath"],
      tags: ["Sacrificial", "Information", "Graveyard Participation"],
      description:
        "If killed at night, a player with this modifier learns that 1 of 2 players is evil.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Sane: {
      internal: ["TrueModifier"],
      tags: ["FalseMode"],
      description: "All Information received by this role is true.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Paranoid: {
      internal: ["UnfavorableModifier"],
      tags: ["FalseMode"],
      description:
        "All Information received by this role will be unfavorable to the player being checked.",
      eventDescription: "This modifier does nothing when on an Event.",
    },
    Naive: {
      internal: ["FavorableModifier"],
      tags: ["FalseMode"],
      description:
        "All Information received by this role will be favorable to the player being checked.",
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
  "Card Games": {},
  Battlesnakes: {},
};

module.exports = modifierData;
