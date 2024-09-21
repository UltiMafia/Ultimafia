const roleData = {
  Mafia: {
    //Village

    //basic roles
    Villager: {
      alignment: "Village",
      category: "Basic",
      tags: ["Villager", "Vanilla", "Basic"],
      description: [
        "Wins when no Mafia, Cult, or Hostile Independents remain.",
        "Other roles appear as Villager to investigative roles, upon death, and to themself.",
      ],
    },
    Bleeder: {
      alignment: "Village",
      category: "Basic",
      tags: ["Bleeding", "Basic"],
      description: [
        "Will die one day after being targeted for a kill or shot.",
      ],
    },
    Celebrity: {
      alignment: "Village",
      category: "Basic",
      tags: ["Reveal Self", "Basic"],
      description: [
        "Identity is publicly revealed to all players at the start of the game.",
      ],
    },
    Commuter: {
      alignment: "Village",
      category: "Basic",
      tags: ["Role Blocker", "Basic", "Reflexive"],
      description: [
        "Blocks all visitors during the night from performing any actions.",
      ],
    },
    Slayer: {
      alignment: "Village",
      newlyAdded: true,
      category: "Basic",
      tags: ["Items", "Basic", "Killing", "Alignments"],
      description: [
        "Starts with a stake.",
        "Stakes can only kill Cult and Mafia-aligned players.",
        "This stake always reveals the Slayer when killing an Evil player.",
      ],
    },
    Deputy: {
      alignment: "Village",
      category: "Basic",
      tags: ["Items", "Basic", "Killing", "Gun"],
      description: [
        "Starts with a gun.",
        "This gun never reveals the deputy when shot.",
      ],
    },
    Loudmouth: {
      alignment: "Village",
      category: "Basic",
      tags: ["Reflexive", "Basic", "Information", "Whispers"],
      description: [
        "When visited, will announce the name of their visitors.",
        "When whispering, will read their whispers aloud.",
      ],
    },
    Miller: {
      alignment: "Village",
      category: "Basic",
      tags: ["Villager", "Basic", "Deception"],
      description: [
        "Appears as Villager to self.",
        "Appears as a random Mafia/Cult role to investigative roles.",
        "Appears as a random Mafia/Cult role upon being condemned.",
        "Appears as Miller upon being killed.",
      ],
    },
    "Party Host": {
      alignment: "Village",
      category: "Basic",
      tags: ["Meetings", "Basic", "Party"],
      description: [
        "Chooses to host a party during day meeting for everyone to attend once per game on the following night.",
        "Everyone will share a party meeting at night.",
      ],
    },
    Sapling: {
      alignment: "Village",
      category: "Basic",
      tags: ["Tree", "Basic", "Voting", "Immortal", "Condemn Immune"],
      description: [
        "Chooses whether or not to grow into a tree at night.",
        "Tree is immune to most ways of dying.",
        "Tree cannot vote.",
      ],
    },
    Sheriff: {
      alignment: "Village",
      category: "Basic",
      tags: ["Items", "Basic", "Killing", "Gun"],
      description: [
        "Starts with a gun.",
        "This gun always reveals the sheriff when shot.",
      ],
    },
    Sleepwalker: {
      alignment: "Village",
      tags: ["Visits", "Basic"],
      category: "Basic",
      description: ["Visits a random player each night."],
    },
    //protective roles
    Bawd: {
      alignment: "Village",
      newlyAdded: true,
      category: "Protective",
      tags: ["Protective", "Night Saver", "Mind Rot"],
      description: [
        "Protects two players every night.",
        "One of the players being protected in inflicted with Mind Rot.",
      ],
    },
    Bodyguard: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Killing"],
      description: [
        "Guards one player every night",
        "If the target was attacked, the Bodyguard will kill one attacker and die.",
        "If the target was the Celebrity, the Bodyguard will kill all attackers and die.",
      ],
    },
    Doctor: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Night Saver"],
      description: ["Saves another player from dying each night."],
    },
    Martyr: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Condemn"],
      description: [
        "Can choose to sacrifice themself and be condemned in the place of the player currently being condemned.",
      ],
    },
    Medic: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Extra Lives"],
      description: [
        "Visits two players each night.",
        "If the first player is targeted for a night kill and dies, the second player gains an extra life.",
      ],
    },
    Nurse: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Malicious Effects"],
      description: [
        "Visits one player each night and cleanses them of malicious effects.",
        "Malicious effects include poison, bleeding, insanity, and polarization.",
      ],
    },
    Resurrectionist: {
      alignment: "Village",
      category: "Protective",
      tags: ["Revive", "Protective", "Graveyard"],
      description: [
        "Visits a dead player during the night once per game.",
        "That player will be resurrected the following day.",
        "If player's identity was revealed upon death, they will remain revealed when resurrected.",
      ],
      graveyardParticipation: "all",
    },
    Shrink: {
      alignment: "Village",
      category: "Protective",
      tags: ["Convert Saver", "Protective", "Conversion", "Villager"],
      description: [
        "Prevents their target from being converted to another role.",
        "If their target was a Hostile Independent, the target will become a Villager.",
      ],
    },
    Surgeon: {
      alignment: "Village",
      category: "Protective",
      tags: ["Convert Saver", "Protective", "Killing", "Night Saver"],
      description: [
        "Each night, operates on one player to prevent them from dying or being converted.",
        "If attacked, kills one of their killers",
      ],
    },
    "Tea Lady": {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Condemn Immune", "Immortal", "Neighbors"],
      description: [
        "If both of the Tea Lady's neighbors are aligned with the Village, the neighbors can't die.",
      ],
    },
    //gifting roles
    Baker: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Famine", "Items", "Bread"],
      description: [
        "When baker is present in the game, all players start with two breads. A famine will start.",
        "Gives out up to two breads each night.",
        "Bread is consumed each night, staving off the famine for another phase. Running out will eventually starve the player to death.",
      ],
    },
    Blacksmith: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Protective", "Items", "Armor"],
      description: [
        "Gives out armor to one player each night.",
        "Armor will protect from one attack before breaking.",
      ],
    },
    Chandler: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Information", "Items", "Candle", "Visits"],
      description: [
        "Gives out a candle to one player each night.",
        "Candles will tell a player the names of their visitors from the previous night.",
      ],
    },
    Cutler: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Bleeding", "Items", "Knife", "Killing"],
      description: [
        "Gives out a knife each night.",
        "Knives can be used to attack another player, causing them to bleed.",
      ],
    },
    Demolitionist: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Items", "Bomb", "Killing"],
      description: [
        "Gives out bomb to one player each night.",
        "If a player holding a bomb is attacked, their attacker will die along with them.",
      ],
    },
    Falconer: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Information", "Items", "Falcon", "Visits"],
      description: [
        "Gives out a falcon to one player each night.",
        "Falcons can be used to track another player's movements during the night.",
      ],
    },
    Funsmith: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Killing", "Items", "Gun", "Reflexive"],
      description: [
        "Gives out a gun each night.",
        "Gives out a gun to all visitors at night.",
      ],
    },
    Gemcutter: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Revealing", "Items", "Crystal"],
      description: [
        "Gives out a crystal ball to a player each night.",
        "If a player holding the crystal ball dies, their target's role will be revealed.",
      ],
    },
    Gunsmith: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Killing", "Items", "Gun"],
      description: [
        "Gives out a gun each night.",
        "Guns can be used to shoot and kill someone during the day.",
      ],
    },
    Keymaker: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Role Blocker", "Items", "Key"],
      description: [
        "Gives out a key to one player each night.",
        "Keys can be used to lock a player in the next night; they cannot be visited, but also cannot perform any actions.",
      ],
    },
    Mailman: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Messages", "Items", "Envelope"],
      description: [
        "Gives out an envelope to one player each night.",
        "Envelopes can be used to send an anonymous message to another player at night.",
      ],
    },
    Missionary: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Convert Saver", "Items", "Tract", "Protective"],
      description: [
        "Gives out a tract to one player each night.",
        "Tracts will prevent one conversion attempt.",
      ],
    },
    Pharmacist: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Role Blocker", "Items", "Whiskey"],
      description: [
        "Gives out a bottle of whiskey each night.",
        "Whiskey can be used to distract another player, preventing them from acting the next night.",
      ],
    },
    Reanimator: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Revive", "Items", "Syringe", "Graveyard"],
      description: [
        "Gives out a syringe each night.",
        "Syringes can be used on dead players to resurrect them.",
      ],
      graveyardParticipation: "all",
    },
    Santa: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Items", "Graveyard", "Investigative", "Alignments"],
      description: [
        "Visits a player each night to learn their role alignment.",
        "If not visited during the night, will learn whether that player is naughty or nice.",
        "Gives out a Gun, Knife, Armor, Bomb, Crystal, Whiskey, Bread, Key, Falcon, Tract, or Syringe each night.",
      ],
      graveyardParticipation: "all",
    },
    //investigative roles
    Analyst: {
      alignment: "Village",
      newlyAdded: true,
      category: "Investigative",
      tags: ["Investigative", "Roles"],
      description: [
        "Attempts to guess the roles of up to five players.",
        "Learns how many of the guesses were correct.",
      ],
    },
    Accountant: {
      alignment: "Village",
      newlyAdded: true,
      category: "Investigative",
      tags: ["Investigative", "Neighbors", "Position"],
      description: [
        "On Night 1 learns how many pairs of evil players there are.",
        "A Pair is each unique instance of 2 Evil Players neighboring eachother.",
        "Players can be part of multiple pairs.",
      ],
    },
    Bloodhound: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Visits"],
      description: [
        "Tracks a player each night and learns if they visited anybody.",
      ],
    },
    Housekeeper: {
      alignment: "Village",
      recentlyUpdated: true,
      category: "Investigative",
      tags: ["Investigative", "Visits", "Reports"],
      description: [
        "Each night chooses 2 players, Learns how many of those players visited or received reports",
      ],
    },
    Cop: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Alignment", "Cop"],
      description: [
        "Investigates one player each night and learns their alignment.",
        "Some other roles appear as Cop to themself.",
      ],
    },
    "Insane Cop": {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Alignment", "Cop"],
      description: [
        "Investigates one player each night and learns their alignment (alignment will be reversed).",
        "Appears as normal cop upon death.",
      ],
    },
    "Naive Cop": {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Alignment", "Cop"],
      description: [
        "Investigates one player each night and learns their alignment (alignments will always appear innocent).",
        "Appears as normal cop upon death.",
      ],
    },
    "Paranoid Cop": {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Alignment", "Cop"],
      description: [
        "Investigates one player each night and learns their alignment (alignments will always appear guilty).",
        "Appears as normal cop upon death.",
      ],
    },
    "Confused Cop": {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Alignment", "Cop"],
      description: [
        "Investigates one player each night and learns their alignment (alignments will always be random).",
        "Appears as normal cop upon death.",
      ],
    },
    Coroner: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Roles", "Dead"],
      description: [
        "Chooses to visit a dead player at night and learns their role identity.",
      ],
    },
    Detective: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Roles"],
      description: [
        "Investigates one player each night and learns their role.",
      ],
    },
    Empath: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Alignment", "Neighbors"],
      description: [
        "Each night learns how many of their alive neighbors are evil.",
      ],
    },
    Statistician: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Alignment", "Voting"],
      description: [
        "Each night learns if an Evil Player voted with the Majority the previous day.",
        "Learns a random value if the vote was tied.",
      ],
    },
    Forensicist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Information"],
      description: [
        "Each night learns the number of players were appearing as another role or Performing an Investigative Action with False Mode/Mind Rot.",
        "This number includes living and dead players.",
        "Players can appear as another role due to Mind Rot, Suits, Lawyer, Miller, and Other things.",
      ],
    },
    Geologist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Neighbors", "Position"],
      description: [
        "Learns the distance in players between 2 evil players on Night 1.",
        "If the distance is 0 the Evil Players are neighboring eachother.",
        "The distance is calulated before any kills or conversions.",
      ],
    },
    Groundskeeper: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Alignment", "Dead"],
      description: [
        "Each night learn how many dead players are Evil.",
        "The number is calulated after any kills in the night.",
      ],
    },
    Diviner: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Roles"],
      description: [
        "Investigates one player each night and learns their role and another role of the opposite alignment.",
      ],
    },
    Journalist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Reports"],
      description: [
        "Chooses a player each night and views any reports they receive the following day.",
      ],
    },
    Justice: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Alignment"],
      description: [
        "Investigates two players at night and learns if they share an alignment.",
      ],
    },
    Laundress: {
      alignment: "Village",
      newlyAdded: true,
      category: "Investigative",
      tags: ["Investigative", "Roles"],
      description: ["On Night 1 Learns that 1 of 2 players is a Role."],
    },
    Scientist: {
      alignment: "Village",
      newlyAdded: true,
      category: "Investigative",
      tags: ["Investigative", "Roles", "Neighbors", "Visits"],
      description: [
        "Once Per Game During the Day can learn about the relation beetween a player and a role.",
      ],
    },
    Tarotist: {
      alignment: "Village",
      newlyAdded: true,
      category: "Investigative",
      tags: ["Investigative", "Roles", "Excess Roles"],
      description: [
        "At night, learns either one player's role or two excess roles.",
      ],
    },
    Manhunter: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Roles"],
      description: [
        "Chooses a player and a role and learns if they are that role or not.",
      ],
    },
    Pathologist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Reports", "Dead"],
      description: [
        "Each night, visits one dead player.",
        "Will receive a list of all visitors that player ever received, but not specific actions or days.",
      ],
    },
    Psychic: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Alignment"],
      description: [
        "Each night, reads the mind of someone and learns their true alignment.",
        "Will learn nothing if disturbed at night.",
      ],
    },
    Savant: {
      alignment: "Village",
      newlyAdded: true,
      category: "Investigative",
      tags: [
        "Investigative",
        "Alignment",
        "Roles",
        "Neighbors",
        "Position",
        "Excess Roles",
      ],
      description: [
        "Each Day may learn a True and False piece of information.",
      ],
    },
    Snoop: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Items"],
      description: [
        "Visits a player each night and learns what items they are carrying.",
      ],
    },
    Tracker: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Visits"],
      description: ["Tracks a player each night and learns who they visited."],
    },
    Voyeur: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Visits", "Roles"],
      description: [
        "Watches a player each night and learns what roles visited them.",
        "Doesn't visit its target.",
      ],
    },
    Watcher: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Visits"],
      description: [
        "Watches a player each night and learns who visited them.",
        "Doesn't visit its target.",
      ],
    },
    Witness: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Visits"],
      description: [
        "Watches a player each night and learns if they were visited by anybody.",
        "Doesn't visit its target.",
      ],
    },
    //night-acting roles
    Avenger: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Killing", "Gun", "Items"],
      description: [
        "Each night, chooses someone to avenge.",
        "Gets a gun if their chosen target dies.",
      ],
    },
    Caroler: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Information", "Alignment"],
      description: [
        "Each night, sings a carol to a player about 3 players, at least one of whom is Mafia or Cult.",
        "The carol is not heard if the player chosen visits at night.",
        "Cannot choose the same player consecutively.",
      ],
    },
    Comedian: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Information", "Roles"],
      description: [
        "Each night, tells a joke to a player about 3 roles, and a different player who is one of the roles.",
        "The joke is not heard if the target chosen visits at night.",
        "Cannot choose same the target consecutively.",
      ],
    },
    Exorcist: {
      alignment: "Village",
      recentlyAdded: true,
      category: "Night-acting",
      tags: ["Night-acting", "Dead", "Graveyard", "Exorcise"],
      description: [
        "Each Night, the Exorcist can Exorcise a dead Player.",
        "Exorcised players can't be revived or use Graveyard abilites.",
      ],
    },
    Flapper: {
      alignment: "Village",
      newlyAdded: true,
      category: "Night-acting",
      tags: ["Night-acting", "Mind Rot", "Roles"],
      description: [
        "Once per game chooses a Role.",
        "Any players with that role are inflicted with Mind Rot for 3 Nights.",
        "If the selected role is not in the game nothing happens.",
      ],
    },
    Drunk: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Role Blocker"],
      description: [
        "Visits one player each night and blocks them from performing any night actions.",
        "Some actions cannot be blocked.",
      ],
    },
    Sailor: {
      alignment: "Village",
      newlyAdded: true,
      category: "Night-acting",
      tags: ["Night-acting", "Mind Rot", "Immortal", "Condemn Immune"],
      description: [
        "Visits one player each night and inflicts them with Mind Rot.",
        "Mind Rot blocks all non-Investigative actions.",
        "Players performing investigative actions will get False Info.",
        "A Sailor can't be killed unless roleblocked/Mind Rotted.",
      ],
    },
    "Snake Charmer": {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Conversion", "Role Swapping", "Alignment"],
      description: [
        "Each night chooses a player.",
        "If the player is Mafia or Cult, The Snake Charmer will swap roles with that player.",
        "A Snake Charmer can only swap roles once.",
      ],
    },
    Guard: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Role Blocker", "Visits"],
      description: ["Each night, protects one player from all visits."],
    },
    Marathoner: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Visits"],
      description: [
        "Once per game, visits every other player during the night.",
      ],
    },
    Mechanic: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Items"],
      description: [
        "Once per night, fixes the target's item(s).",
        "Can undo an item's fabricated/sabotaged status, and can turn Gunrunner guns into normal guns and Gremlin guns into normal guns.",
        "Each phase, fixes their own item(s).",
      ],
    },
    Mime: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Villager", "Conversion", "Alignment"],
      description: [
        "Chooses a player at night and attempts to mime their role.",
        "If player is Village, Mime steals their role and that player becomes a villager.",
        "If player is Mafia, Mime becomes villager.",
        "If player is Cult or Independent, Mime becomes Amnesiac.",
      ],
    },
    Nun: {
      alignment: "Village",
      newlyAdded: true,
      category: "Night-acting",
      tags: ["Night-acting", "Modifiers", "Conversion"],
      description: ["Removes modifiers from other players at night"],
    },
    Photographer: {
      alignment: "Village",
      recentlyUpdated: true,
      category: "Night-acting",
      tags: ["Night-acting", "Revealing"],
      description: [
        "Once per game, the Photographer can take a picture of a player during the night.",
        "The role of the photographed player will be revealed to everyone the next day.",
      ],
    },
    Impersonator: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Deception"],
      description: [
        "Chooses a role each night to imitate.",
        "Can not be seen as a Villager, Impersonator or Imposter",
      ],
    },
    Vegan: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Revealing", "Selective Revealing"],
      description: [
        "Chooses a player each night to reveal their identity as Vegan.",
      ],
    },
    Oracle: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Revealing", "Sacrificial"],
      description: [
        "Visits one player each night whose role will be revealed upon death.",
      ],
    },
    Penguin: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Information", "Items", "Visits"],
      description: ["Each night, waddles up to someone to tell them a secret."],
    },
    "Robin Hood": {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Items"],
      description: [
        "Chooses one player to steal from each night and another player to receive their items.",
        "If the player chosen to receive an item is mafia, the steal will not go through.",
      ],
    },
    Visitor: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Visits"],
      description: [
        "Pays a visit to another player at night.",
        "Annoyingly, this visit has no effect.",
        "Town roles with the Scatterbrained modifier appear as this role to self.",
      ],
    },
    Waitress: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Items"],
      description: ["Chooses a player to steal an item from each night."],
    },
    "Drama Queen": {
      alignment: "Village",
      tags: ["Night-acting"],
      description: [
        "Each night, starts drama against one player.",
        "The following day, targeted player has two options:",
        "They can stop the drama by revealing the truth, which exposes their role,",
        "Or they can argue with the drama queen, which publicly reveals her identity.",
        "After someone starts arguing with the drama queen, she can't start any more drama.",
      ],
    },
    //sacrificial roles
    Barber: {
      alignment: "Village",
      newlyAdded: true,
      category: "Sacrificial",
      tags: ["Sacrificial", "Items", "Conversion", "Role Swapping"],
      description: [
        "If the Barber dies a Mafia or Cult aligned player will get to swap two living players roles.",
      ],
    },
    Butterfly: {
      alignment: "Village",
      category: "Sacrificial",
      category: "Sacrificial",
      tags: ["Sacrificial", "Conversion"],
      description: [
        "When they die all players are reset to the role they had at the start of the game.",
      ],
    },
    Hunter: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Sacrificial", "Killing"],
      description: [
        "Chooses a player to kill when condemned by town during the day.",
      ],
    },
    Lightkeeper: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Sacrificial", "Voting", "Speech", "Eclipse"],
      description: [
        "Following their death, causes an eclipse during the day",
        "During an eclipse all speech and votes are anonymous.",
      ],
    },
    Schoolmarm: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Sacrificial", "Conversion", "Villager"],
      description: [
        "If killed, all Village-aligned players convert to Villager.",
      ],
    },
    Secretary: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Sacrificial", "Voting"],
      description: [
        "If killed at night, players are forced to vote for no one the next day.",
      ],
    },
    Sheep: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Sacrificial", "Killing"],
      description: ["If one Sheep dies, all Sheep die."],
    },
    Turncoat: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Sacrificial", "Conversion", "Traitor"],
      description: [
        "When killed by the Mafia, will turn into a Traitor instead.",
      ],
    },
    Typist: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Sacrificial", "Voting"],
      description: [
        "On the day following their death, all votes will be anonymous.",
      ],
    },
    Virgin: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Sacrificial", "Protective", "Conversion"],
      description: [
        "If condemned by the village, no one will die the following night.",
        "If visited by Hooker, gets turned into Villager.",
      ],
    },
    Mooncalf: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Sacrificial", "Killing"],
      description: [
        "After dying chooses a player.",
        "If the chosen player is village aligned, That player will die during the night.",
        "If the chosen player is non-village aligned, Nothing happens.",
      ],
    },
    //voting roles
    Attorney: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting"],
      description: ["Vote weight is worth 2 votes in day meeting."],
    },
    Butler: {
      alignment: "Village",
      newlyAdded: true,
      category: "Voting",
      tags: ["Voting"],
      description: [
        "Vote weight is worth 0 votes",
        "Each night chooses a player to have a Vote weight of 2 the following day",
      ],
    },
    Governor: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Condemn", "Overturn"],
      description: [
        "Overrides village condemnation once per game.",
        "Cannot cancel a village condemnation.",
        "Choosing no one or the original target preserves the Governor's override ability.",
      ],
    },
    King: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting"],
      description: [
        "Village meeting vote overrides other voters and determines condemnation.",
      ],
    },
    Kingmaker: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Items"],
      description: [
        "Gives out a sceptre each night.",
        "Sceptres give the player final say in the village vote for one turn.",
      ],
    },
    Magistrate: {
      alignment: "Village",
      recentlyUpdated: true,
      category: "Voting",
      tags: ["Voting", "Condemn", "Condemn Immune"],
      description: [
        "Every night, chooses one player and prevents them from voting and from being voted.",
        "Cannot place themselves under house arrest.",
      ],
    },
    Jazzman: {
      alignment: "Village",
      newlyAdded: true,
      category: "Voting",
      tags: ["Voting", "Condemn", "Mind Rot", "Alignment"],
      description: [
        "If an Evil player is condemned, All players are inflicted with Mind Rot that night.",
      ],
    },
    Princess: {
      alignment: "Village",
      newlyAdded: true,
      category: "Voting",
      tags: ["Voting", "Condemn", "Overturn", "Alignment"],
      description: [
        "If the first player to vote for a Princess is Village-aligned, the vote will be overturned onto that player at the end of the day.",
        "If the first player to vote for a Princess is not Village-aligned, nothing happens.",
      ],
    },
    Troublemaker: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Condemn", "Day"],
      description: [
        "Once per game during the day, can force the next night phase to skip and two day phases to occur consecutively.",
      ],
    },
    //manipulative roles
    Braggart: {
      alignment: "Village",
      newlyAdded: true,
      category: "Manipulative",
      tags: ["Manipulative", "Setup Change", "Mind Rot", "Banished"],
      description: [
        "Sees self as a random non-Banished Village role from the setup.",
        "Has that role's abilities but is permanently inflicted with Mind Rot.",
        "Items used by a Braggart will be broken.",
      ],
    },
    Coward: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Manipulative", "Redirection", "Reflexive"],
      description: [
        "Each night, chooses one player to redirect all visitors to.",
      ],
    },
    Chauffeur: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Manipulative", "Redirection"],
      description: [
        "Chooses two players, A and B, each night.",
        "Players who visit A will be redirected to B.",
        "Players who visit B will be redirected to A.",
        "Redirection cannot be role blocked.",
      ],
    },
    Televangelist: {
      alignment: "Village",
      newlyAdded: true,
      category: "Manipulative",
      tags: ["Manipulative", "Setup Change", "Mind Rot", "Cult"],
      description: [
        "Sees self as a random Endangered Cult role from the setup.",
        "Has that role's abilities but is permanently inflicted with Mind Rot.",
        "Will attend a Fake Cult Meeting with the non-endangered Cult roles.",
        "Cult players will learn who the Televangelist selects at night.",
      ],
    },
    Monkey: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Manipulative", "Copy Actions"],
      description: [
        "Copies the actions of a player and performs them on another player each night.",
      ],
    },
    Philosopher: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Manipulative", "Conversion", "Mind Rot"],
      description: [
        "At night may choose to convert to a Village aligned role that can spawn in the setup.",
        "If the selected role is already in play, The player with that role will be inflicted with Mind Rot for the rest of the game.",
      ],
    },
    Trickster: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Manipulative", "Conversion", "Items", "Killing"],
      description: [
        "Gives out an item each night to a random player.",
        "The item can be a Gun, Knife, Armor, Whiskey, or Crystal.",
        "The item has a 50% chance to be Cursed.",
        "Cursed items will misfire or be otherwise ineffective.",
      ],
    },
    //meeting roles
    Capybara: {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meeting", "Food", "Items"],
      description: [
        "Chooses a player to invite to a hot springs relaxation by giving them a Yuzu Orange each night.",
        "When holding a Yuzu Orange, player can choose during the day to anonymously meet with the Capybara and other Yuzu Orange holders the following night.",
        "Multiple Capybaras share a night meeting.",
      ],
    },
    Chef: {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meeting", "Information"],
      description: [
        "Chooses two players during the day to attend a banquet the following evening.",
        "Players chosen to attend the banquet meet anonymously with their roles revealed to one another.",
      ],
    },
    Freemason: {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meeting", "Conversion", "Alignment"],
      description: [
        "Converts one player into a Freemason each night.",
        "Shares a night meeting with other Freemasons.",
        "All Freemasons die if they attempt to convert a member of the Mafia.",
        "Attempting to convert a Whig into a Freemason will fail.",
        "All Cultists die if targeted by a Freemason meeting.",
      ],
    },
    "Invisible Man": {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meeting", "Investigative"],
      description: [
        "Chooses one player during the day to follow at night.",
        "Views all messages from that player's meetings that night.",
      ],
    },
    Matron: {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meeting", "Reflexive"],
      description: [
        "Passively invites visitors to the common room, where  they share a meeting.",
      ],
    },
    Templar: {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meeting"],
      description: ["Shares a night meeting with other Templars."],
    },
    //reflexive roles
    Apothecary: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Protective", "Malicious Effects"],
      description: [
        "When visited, heals and cleanses all effects currently possessed by the visiting player.",
      ],
    },
    Dreamer: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Investigative", "Alignment"],
      description: [
        "Dreams about 3 players, at least one of whom is Mafia or Cult; or about 1 player who is Village aligned.",
        "Does not dream if visited at night.",
      ],
    },
    Farmer: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Famine", "Food", "Items"],
      description: [
        "When visited, gives a loaf of bread to each visitor.",
        "Starts a famine when present in the game.",
      ],
    },
    Painter: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Information", "Sacrificial"],
      description: [
        "Paints portraits of their visitors every night.",
        "Upon their death, the portraits will be unveiled in a grand auction.",
      ],
    },
    Priest: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Investigative", "Roles", "Visits"],
      description: ["Learns the roles of those who visited them."],
    },
    //killing roles
    Debtor: {
      alignment: "Village",
      disabled: true,
      category: "Killing",
      tags: ["Killing", "Information", "Roles"],
      description: [
        "Each night must choose a player and role from the Setup.",
        "If the selected role is not the player's role, The Debtor dies.",
      ],
    },
    Firebrand: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Gasoline"],
      description: [
        "Douses one player with Gasoline each night.",
        "Chooses to light a match during the day to burn doused players to ashes.",
      ],
    },
    Granny: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Visits", "Unkillable", "Reflexive"],
      description: [
        "Kills all players who visit during the night.",
        "Cannot be killed or converted at night.",
        "Can only be killed by village condemnation.",
      ],
    },
    Jailer: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Meeting", "Role Blocker", "Condemn"],
      description: [
        "If no one was condemned, chooses a player to jail after each day meeting.",
        "Meets with the prisoner at night and the prisoner cannot perform actions or attend other meetings or be targeted.",
        "Decides whether or not the prisoner should be executed.",
      ],
    },
    Seeker: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Setup Change", "Hide and Seek"],
      description: [
        "Attempts to guess the identity of the Hider or Invader each night.",
        "Kills the Hider/Invader if guess is correct.",
        "Forces a Hider or Invader to Spawn in closed Setups.",
      ],
    },
    OldScientist: {
      alignment: "Village",
      disabled: true,
      category: "Killing",
      tags: ["Killing", "Information"],
      description: [
        "During the day chooses a Player role Relation to Test.",
        "If the Relation is True, The Scientist kills a Random Village or Independent Aligned Player at Night.",
        "Scientists can kill themselves.",
      ],
    },
    Trapper: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Visits"],
      description: [
        "Each night, visits one player and kills one of their visitors.",
        "Preferentially kills Mafia, Cult, Independents, then Villagers.",
        "Other visitors will learn the identity of the Trapper.",
      ],
    },
    Vigilante: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing"],
      description: ["Kills one player each night."],
    },
    //speaking roles
    Agent: {
      alignment: "Village",
      category: "Speaking",
      tags: ["Speaking", "Roles"],
      description: [
        "Can anonymously contact any non-Village role during the day.",
      ],
    },
    Medium: {
      alignment: "Village",
      category: "Speaking",
      tags: ["Speaking", "Dead", "Graveyard"],
      description: [
        "Holds a seance with a dead player once per night.",
        "Identity is not revealed to the dead player.",
      ],
      graveyardParticipation: "all",
    },
    Mourner: {
      alignment: "Village",
      category: "Speaking",
      tags: ["Speaking", "Dead", "Graveyard"],
      description: [
        "Can ask players in the graveyard a question every night.",
        "The players can answer with yes or no.",
        "The mourner will receive the results of the vote.",
      ],
      graveyardParticipation: "all",
    },
    "Town Crier": {
      alignment: "Village",
      category: "Speaking",
      tags: ["Speaking"],
      description: ["Can anonymously broadcast messages during the day."],
    },
    //essential roles
    Benandante: {
      alignment: "Village",
      newlyAdded: true,
      category: "Essential",
      tags: ["Essential", "Graveyard", "Alignment", "Sacrificial"],
      description: [
        "When a Benandante dies, They choose a player during the day.",
        "If that player is not Village aligned, All Village Aligned players die.",
      ],
      graveyardParticipation: "self",
    },
    President: {
      alignment: "Village",
      category: "Essential",
      tags: ["Essential", "Selective Revealing"],
      description: [
        "All villagers will know who the President is.",
        "When the President dies, the Mafia will win.",
      ],
    },
    Saint: {
      alignment: "Village",
      newlyAdded: true,
      category: "Essential",
      tags: ["Essential", "Condemn", "Sacrificial"],
      description: [
        "When a Saint is condemned, all Village-aligned players die.",
      ],
    },
    Seer: {
      alignment: "Village",
      category: "Essential",
      tags: ["Essential", "Selective Revealing", "Information", "Condemn"],
      description: [
        "Knows all of the Mafia and Cult at the start of the game.",
        "When condemned, Mafia and Cult have a chance to guess who the Seer is.",
        "On a correct guess, the Seer dies and the Mafia or Cult wins.",
        "Appears as villager on death.",
      ],
    },
    Senator: {
      alignment: "Village",
      category: "Essential",
      tags: ["Essential"],
      description: [
        "If half or more the number of Senators in play die, Mafia wins.",
      ],
    },
    Soldier: {
      alignment: "Village",
      category: "Essential",
      tags: ["Essential", "Win Con"],
      description: [
        "If the number of living Soldiers equals half of all living players, the Village wins.",
      ],
    },
    Mayor: {
      alignment: "Village",
      newlyAdded: true,
      category: "Essential",
      tags: ["Essential", "Win Con", "Condemn"],
      description: [
        "At dusk, if exactly three players are alive and no player was executed today, the game ends and the Mayor's team wins.",
      ],
    },
    //linked roles
    Begum: {
      alignment: "Village",
      category: "Linked",
      tags: ["Linked", "Investigative", "Visits"],
      description: [
        "Is randomly paired up with another player.",
        "Learns who this player visits and is visited by each night.",
        "Can find out who this player is, at the cost of no longer receiving this info about their target.",
      ],
    },
    Mistress: {
      alignment: "Village",
      category: "Linked",
      tags: ["Linked", "Information", "Alignment"],
      description: [
        "Once per game during the day, can open the door.",
        "The opening of the door will be publicly announced without revealing the identity of the Mistress.",
        "When the door is opened, they will learn the identity of an evil player, regardless of appearance, etc.",
        "Dies the next day if not visited that night by a town-aligned player.",
      ],
    },
    Suitress: {
      alignment: "Village",
      category: "Linked",
      tags: ["Linked", "Revealing", "Information"],
      description: [
        "During the day, can make an anonymous proposal to another player.",
        "The player has to publicly accept or deny the proposal.",
        "Once a proposal is accepted, the Suitress cannot make another proposal.",
      ],
    },
    //Mafia
    Mafioso: {
      alignment: "Mafia",
      category: "Basic",
      tags: ["Vanilla", "Basic"],
      description: ["Wins when the mafia outnumbers all other players."],
    },
    //basic roles
    Godfather: {
      alignment: "Mafia",
      category: "Basic",
      tags: ["Villager", "Basic", "Deception"],
      description: [
        "Leads the mafia kill each night.",
        "Appears as Villager to investigative roles.",
      ],
    },
    Gramps: {
      alignment: "Mafia",
      category: "Basic",
      tags: [
        "Unkillable",
        "Basic",
        "Investigative",
        "Visits",
        "Roles",
        "Reflexive",
      ],
      description: [
        "Learns role of any player who visits them.",
        "Cannot be killed normally.",
      ],
    },
    Prosecutor: {
      alignment: "Mafia",
      category: "Basic",
      tags: ["Voting", "Basic"],
      description: ["Vote weight is worth 2 votes in village meeting."],
    },
    Sniper: {
      alignment: "Mafia",
      category: "Basic",
      tags: ["Killing", "Basic", "Gun", "Items"],
      description: [
        "Starts with a gun.",
        "Gun does not reveal identity when fired.",
      ],
    },
    //killing roles
    Arsonist: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Gasoline"],
      description: [
        "Douses one player with Gasoline each night.",
        "Chooses to light a match during the day to burn doused players to ashes.",
      ],
    },
    Caporegime: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Visits", "Extra Night Deaths"],
      description: [
        "Gives the kiss of death to someone each night.",
        "Target will die if visited by a non-Mafia player that night.",
      ],
    },
    Hider: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Setup Change", "Hide and Seek"],
      description: [
        "Attempts to guess the identity of the Seeker or Invader each night.",
        "Kills the Seeker/Invader if guess is correct.",
        "Forces a Seeker or Invader to Spawn in closed Setups.",
      ],
    },
    Hitman: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Extra Night Deaths"],
      description: ["Kills one player each night."],
    },
    Jinx: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Word Kill"],
      description: [
        "Curses a player with a forbidden word each night.",
        "If the player speaks the word the next day, they will die.",
      ],
    },
    Poisoner: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Poison", "Malicious Effects"],
      description: [
        "Concocts a deadly poison and administers it to one player each night.",
        "The poisoned target will die at the end of the following night unless saved.",
      ],
    },
    Queen: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Win Con"],
      description: [
        "If the Queen is the only mafia alive, they will declare a beheading.",
        "Once the beheading is declared, the entire town (except the Queen) will be obliterated at the end of the next phase.",
      ],
    },
    Rottweiler: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Extra Night Deaths", "Visits"],
      description: [
        "Each night, visits one player and kills one of their visitors.",
        "Other visitors will learn the identity of the Rottweiler.",
      ],
    },
    Terrorist: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Sacrificial", "Visits"],
      description: [
        "Once per game, can rush at another player during the day, killing them both.",
      ],
    },
    //investigative roles
    Actress: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Investigative", "Roles", "Deception", "Suits"],
      description: [
        "Visits a player to appears as their role.",
        "Learns chosen player's role.",
      ],
    },
    Bondsman: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Investigative", "Roles"],
      description: [
        "Chooses a player and a role and learns if they are that role or not.",
      ],
    },
    Busybody: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Investigative", "Visits"],
      description: [
        "Watches a player each night and learns if they were visited by anybody.",
        "Doesn't visit its target.",
      ],
    },
    Caser: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Investigative", "Visits", "Roles"],
      description: [
        "Watches a player each night and learns what roles visited them.",
        "Doesn't visit its target.",
      ],
    },
    Informant: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Investigative", "Reports"],
      description: [
        "Chooses a player each night and views any reports they receive the following day.",
      ],
    },
    Lookout: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Investigative", "Visits"],
      description: [
        "Watches a player each night and learns who visited them.",
        "Doesn't visit its target.",
      ],
    },
    Lurker: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Investigative", "Visits"],
      description: [
        "Tracks a player each night and learns if they visited anybody.",
      ],
    },
    Revisionist: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Investigative", "Reports", "Dead"],
      description: [
        "Each night, visits one dead player.",
        "Will receive all system messages the player ever received.",
      ],
    },
    Scout: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Investigative", "Visits"],
      description: ["Tracks a player each night and learns who they visited."],
    },
    Stalker: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Investigative", "Roles"],
      description: ["Stalks one player each night and learns their role."],
    },
    //unsorted
    Hooker: {
      alignment: "Mafia",
      tags: ["Role Blocker", "Night-acting"],
      description: [
        "Visits one player each night and blocks them from performing any night actions.",
        "Some actions cannot be blocked.",
      ],
    },
    Don: {
      alignment: "Mafia",
      tags: ["Voting", "Condemn", "Overturn"],
      description: [
        "Overrides village condemnation once per game.",
        "Cannot cancel a village condemnation on a Mafia-aligned player.",
        "Choosing no one or the original target preserves the Don's override ability.",
      ],
    },
    Driver: {
      alignment: "Mafia",
      tags: ["Manipulative", "Redirection"],
      description: [
        "Chooses two players, A and B, each night.",
        "Players who visit A will be redirected to B.",
        "Players who visit B will be redirected to A.",
        "Redirection cannot be roleblocked.",
        "Dies if visited by Drunk.",
      ],
    },
    Gondolier: {
      alignment: "Mafia",
      tags: ["Manipulative", "Control"],
      description: [
        "Chooses one player every night.",
        "Chooses who the player will perform their actions on.",
      ],
    },
    Snitch: {
      alignment: "Mafia",
      tags: ["Manipulative", "Redirection"],
      description: [
        "Chooses one player every night to snitch on.",
        "Chooses another player to divert attention from and redirect their visitors to the first target.",
      ],
    },
    Ninja: {
      alignment: "Mafia",
      tags: ["Deception", "Visits", "Astral"],
      description: [
        "Does not get detected by watchers and trackers.",
        "Kills bomb without setting off the explosion.",
      ],
    },
    Vizier: {
      alignment: "Mafia",
      tags: ["Garbage", "Voting", "Items"],
      description: [
        "While alive, the Mafia's kill is replaced with a Coronation meeting.",
        "One player is picked to be King for the next day. Their vote is the sole decider of the condemnation.",
        "The Vizier cannot pick the same player to be King twice in a row.",
        "Upon death, the Mafia reverts to killing.",
      ],
    },
    Santista: {
      alignment: "Mafia",
      tags: ["Meeting", "Conversion", "Alignment"],
      description: ["Shares a night meeting with the Freemasons."],
    },
    Lawyer: {
      alignment: "Mafia",
      tags: ["Deception", "Alignment"],
      description: [
        "Chooses a player each night and flips their alignment to investigative roles.",
      ],
    },
    Disguiser: {
      alignment: "Mafia",
      tags: ["Deception", "Disguise"],
      description: [
        "Chooses to steal the identity of the Mafia kill each night.",
        "Cannot be targeted while disguised as another player.",
      ],
    },
    Janitor: {
      alignment: "Mafia",
      tags: ["Clean Night Kill", "Information", "Roles", "Dead"],
      description: [
        "Chooses to clean a mafia kill once per game.",
        "Player's role will be hidden from the town if kill is successful.",
        "Learns the cleaned player's role.",
      ],
    },
    Undertaker: {
      alignment: "Mafia",
      tags: ["Clean Condemn", "Information", "Roles", "Dead"],
      description: [
        "Chooses to clean a condemnation once per game.",
        "Player's role will be hidden from the town if condemnation is successful.",
        "Learns the cleaned player's role.",
      ],
    },
    Ghostbuster: {
      alignment: "Mafia",
      recentlyAdded: true,
      category: "Night-acting",
      tags: ["Night-acting", "Dead", "Graveyard", "Exorcise"],
      description: [
        "Each Night, the Ghostbuster can Exorcise a dead Player.",
        "Exorcised players can't be revived or use Graveyard abilites.",
      ],
    },
    Strongman: {
      alignment: "Mafia",
      tags: ["Killing", "Support", "Unstoppable", "Dead"],
      description: [
        "Once per game can use strength.",
        "Strength guarantees that kills go through.",
        "Works through roleblocking and protection.",
      ],
    },
    Spy: {
      alignment: "Mafia",
      tags: ["Speaking", "Roles"],
      description: ["Can anonymously contact any role during the day."],
    },
    Gunrunner: {
      alignment: "Mafia",
      tags: ["Gifting", "Killing", "Items", "Gun", "Tommy"],
      description: [
        "Gives out a tommy gun each night.",
        "Tommy gun will only kill the target if not aligned with the Mafia.",
        "The gunned player will not know the gun is a tommy gun.",
      ],
    },
    Tailor: {
      alignment: "Mafia",
      tags: ["Gifting", "Deception", "Items", "Suits"],
      description: [
        "Gives out a suit each night that disguises the wearer's role identity.",
        "Suits can be selected from any role within the current game.",
      ],
    },
    Fabricator: {
      alignment: "Mafia",
      tags: ["Gifting", "Broken", "Items"],
      description: [
        "Gives out a cursed item once per night.",
        "Cursed Guns and Knives will backfire against the player who used them.",
        "Cursed Armor, Crystal balls, and Whiskey will be ineffective.",
      ],
    },
    Saboteur: {
      alignment: "Mafia",
      tags: ["Broken", "Items"],
      description: ["Once per night, sabotages the target's item(s)."],
    },
    Heartbreaker: {
      alignment: "Mafia",
      tags: ["Linked", "Lover"],
      description: [
        "Falls in love with another player once per game.",
        "Both players will die if Heartbreaker dies.",
      ],
    },
    Yakuza: {
      alignment: "Mafia",
      tags: ["Conversion", "Sacrificial"],
      description: [
        "Chooses to sacrifice self once per game to convert another player to Mafioso.",
      ],
    },
    Graverobber: {
      alignment: "Mafia",
      tags: ["Revive", "Protective", "Graveyard"],
      description: [
        "Visits a dead player during the night once per game.",
        "That player will be resurrected the following day.",
        "If player's role identity was revealed upon death, they will remain revealed when resurrected.",
      ],
      graveyardParticipation: "all",
    },
    Mummy: {
      alignment: "Mafia",
      tags: ["Trash", "Dead", "Killing", "Visits"],
      description: [
        "Everyone who visits the mummy while the mummy is dead will die.",
      ],
    },
    Illusionist: {
      alignment: "Mafia",
      tags: ["Killing", "Gun", "Items", "Deception"],
      description: [
        "Starts with a gun.",
        "Chooses one player each night to frame as the shooter of any guns or rifles shot by the Illusionist.",
      ],
    },
    Librarian: {
      alignment: "Mafia",
      tags: ["Speech", "Whispers", "Silence"],
      description: [
        "Once per game, calls for the Town to meet at the Library.",
        "While in a Library meeting, players can only whisper instead of speaking aloud.",
      ],
    },
    Sicario: {
      alignment: "Mafia",
      tags: ["Killing", "Reflexive", "Knife", "Items"],
      description: [
        "Receives a knife if not visited during the night.",
        "A knife used by the Sicario does not reveal.",
      ],
    },
    Scrutineer: {
      alignment: "Mafia",
      tags: ["Killing", "Voting", "Vote Kills"],
      description: [
        "Chooses a victim and a target each night.",
        "If the victim votes for the target in the village meeting the following day, the victim will die.",
      ],
    },
    Trespasser: {
      alignment: "Mafia",
      tags: ["Visits", "Night-Acting"],
      description: [
        "Chooses to trespass on another player's property at night.",
        "Annoyingly, this visit has no effect.",
        "Mafia roles with the Scatterbrained modifier appear as this role to self.",
      ],
    },
    Thief: {
      alignment: "Mafia",
      tags: ["Items", "Night-Acting"],
      description: ["Chooses a player to steal an item from each night."],
    },
    Crank: {
      alignment: "Mafia",
      tags: ["Meeting", "Dead", "Graveyard"],
      description: [
        "Chooses a dead player once per night and holds a seance with that player.",
        "Identity is not revealed to the dead player.",
      ],
      graveyardParticipation: "all",
    },
    Interrogator: {
      alignment: "Mafia",
      tags: ["Meeting", "Killing", "Condemn", "Role Blocker"],
      description: [
        "If no one was condemned, chooses a player to jail after each day meeting.",
        "Meets with the prisoner at night and the prisoner cannot perform actions or attend other meetings or be targeted.",
        "Decides whether or not the prisoner should be executed.",
      ],
    },
    Bookie: {
      alignment: "Mafia",
      tags: ["Killing", "Condemn", "Voting", "Extra Night Deaths"],
      description: [
        "Each night, predicts the village vote.",
        "If they successfully predict the village vote, they gain a bonus kill.",
      ],
    },
    Ape: {
      alignment: "Mafia",
      tags: ["Manipulative", "Copy Actions"],
      description: [
        "Copies the actions of a player and performs them on another player each night.",
      ],
    },
    Apprentice: {
      alignment: "Mafia",
      tags: ["Conversion", "Dead"],
      description: [
        "Chooses to become the role of a dead Mafia-aligned player once per game.",
      ],
    },
    Ventriloquist: {
      alignment: "Mafia",
      tags: ["Speaking", "Deception"],
      description: [
        "Can speak as any player during the day.",
        "That player won't be able to see messages said and quoted via this ability.",
      ],
    },
    Fiddler: {
      alignment: "Mafia",
      tags: ["Speech", "Deafean"],
      description: [
        "Serenades a player each night, causing them to be unable to hear anything the next day.",
      ],
    },
    Silencer: {
      alignment: "Mafia",
      tags: ["Speech", "Silence"],
      description: [
        "Can silence someone each night, causing them to be unable to speak the next day.",
      ],
    },
    Scrambler: {
      alignment: "Mafia",
      tags: ["Speech", "Clueless", "Random Messages"],
      description: [
        "Scrambles a player each night, causing them to see messages from random players the next day.",
      ],
    },
    Paparazzo: {
      alignment: "Mafia",
      tags: ["Condemn", "Revealing", "Sacrificial"],
      description: [
        "If condemned, can choose to reveal the role of one player to the Mafia.",
      ],
    },
    Filibuster: {
      alignment: "Mafia",
      tags: ["Condemn", "Voting", "Condemn Immune"],
      description: [
        "Can only be condemned when every town role votes for them.",
      ],
    },
    Rainmaker: {
      alignment: "Mafia",
      tags: ["Voting", "Meeting", "Condemn"],
      description: [
        "Once a game, can make it rain and prevent everyone from voting at the village meeting.",
      ],
    },
    Toreador: {
      alignment: "Mafia",
      tags: ["Manipulative", "Redirection", "Control"],
      description: ["Each night, attracts a player to visit them."],
    },
    Blinder: {
      alignment: "Mafia",
      tags: ["Speech", "Blind"],
      description: [
        "Each night, blinds a player.",
        "Blinded players are unable to see the names of players typing the next day.",
      ],
    },
    Quack: {
      alignment: "Mafia",
      tags: ["Protective", "Night Saver"],
      description: ["Saves another player from dying each night."],
    },
    Homeopath: {
      alignment: "Mafia",
      tags: ["Protective", "Malicious Effects"],
      description: [
        "Visits one player each night and cleanses them of malicious effects.",
        "Malicious effects include poison, bleeding, insanity, and polarization.",
      ],
    },
    Enforcer: {
      alignment: "Mafia",
      tags: ["Convert Saver", "Protective", "Conversion", "Traitor"],
      description: [
        "Each night, counsels one player and heals their insanity.",
        "Prevents their target from being converted.",
        "If their target was a Hostile Independent, the target will become a Traitor.",
      ],
    },
    Forger: {
      alignment: "Mafia",
      tags: ["Deception", "Will", "Information"],
      description: [
        "Once per night can forge the will of another player.",
        "Learns that player's real will on the next day.",
      ],
    },
    Bouncer: {
      alignment: "Mafia",
      tags: ["Night-acting", "Role Blocker", "Visits"],
      description: ["Each night, protects one player from all visits."],
    },
    Plumber: {
      alignment: "Mafia",
      tags: ["Whispers", "Speech"],
      description: [
        "Every night, can block all sent and received whispers of the target.",
      ],
    },
    Gossiper: {
      alignment: "Mafia",
      tags: ["Whispers", "Speech"],
      description: [
        "Every night, can make a player leaky the next day.",
        "Leaky players will always read their whispers aloud.",
      ],
    },
    Paralyzer: {
      alignment: "Mafia",
      tags: ["Voting"],
      description: [
        "Once per game, can paralyze votes in the village meeting. Players are not able to unvote.",
      ],
    },
    Electrician: {
      alignment: "Mafia",
      tags: ["Voting", "Speech", "Eclipse", "Blind"],
      description: [
        "Once per game, can cause an eclipse during the day.",
        "During an eclipse all speech and votes are anonymous.",
      ],
    },
    Cyclist: {
      alignment: "Mafia",
      tags: ["Night-acting", "Visits"],
      description: [
        "Once per game, visits every other player during the night.",
      ],
    },
    Lobotomist: {
      alignment: "Mafia",
      tags: ["Night-acting", "Conversion", "Vanilla", "Villager"],
      description: [
        "Each night, visits one player.",
        "Village roles convert to Villager. Cult roles convert to Cultist. Independent roles convert to Grouch.",
      ],
    },
    Pedagogue: {
      alignment: "Mafia",
      tags: ["Night-acting", "Conversion", "Random"],
      description: [
        "Each night, converts another Mafia teammate into a random Mafia-aligned role.",
      ],
    },
    Bartender: {
      alignment: "Mafia",
      tags: ["Night-acting", "Effects", "Alcoholics", "Role Blocker"],
      description: [
        "Each night, serves a non-Mafia player and turns them into an Alcoholic.",
        "Alcoholics retain their original roles, but they unknowingly roleblock a random non-Mafia player during the night.",
        "If an Alcoholic player visits an Apothecary, they are cured.",
      ],
    },
    Rat: {
      alignment: "Mafia",
      tags: ["Manipulative", "Redirection", "Reflexive"],
      description: [
        "Each night, chooses one player to redirect all visitors to.",
      ],
    },
    Cannoneer: {
      alignment: "Mafia",
      tags: ["Killing", "Meeting", "Gun", "Items"],
      description: [
        "Will gain a gun once per game if Mafia chose to abstain from killing the previous night.",
        "Gun will always reveal the shooter.",
      ],
    },
    Imposter: {
      alignment: "Mafia",
      tags: ["Deception", "Night-acting"],
      description: [
        "Chooses a role each night to imitate.",
        "Can not be seen as a Villager, Impersonator or Imposter",
      ],
    },

    //Cult
    //Basic
    Cultist: {
      alignment: "Cult",
      category: "Basic",
      tags: ["Vanilla", "Basic"],
      description: [
        "Meets with the Cult during the night.",
        "Cultists die if targeted by a Freemason meeting.",
      ],
    },
    //Conversions
    "Cult Leader": {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Kills Cultist"],
      description: [
        "Converts one player into a Cultist each night.",
        "All Cultists die if the Cult Leader dies.",
      ],
    },
    Doomsayer: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Kills Cultist", "Reflexive"],
      description: [
        "Converts all players who visit during the night.",
        "All Cultists die if the Doomsayer dies.",
      ],
    },
    Zombie: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion"],
      newlyAdded: true,
      description: [
        "Can infect one person each night.",
        "That person converts to a zombie the next day.",
        "Nurses can cure/prevent infections.",
        "Survivors will be infected but will not turn.",
      ],
    },
    Hexer: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Messages"],
      description: [
        "Engraves a forbidden word on a player each night.",
        "If the player speaks the word the next day, they will convert to Cultist.",
      ],
    },
    Inquisitor: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Kills Cultist", "Killing"],
      description: [
        "Kills a player each night.",
        "If the victim is night-saved, they will convert to Cultist.",
      ],
    },
    Invader: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Setup Changes", "Hide and Seek"],
      description: [
        "Attempts to guess the identities of the Hider or Seeker each night.",
        "Converts the Hider/Seeker to Cultist if guess is correct.",
        "Forces a Hider or Seeker to Spawn in closed Setups.",
      ],
    },
    "Witch Doctor": {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Kills Cultist", "Protective", "Night Saver"],
      description: [
        "Chooses a player each night.",
        "If that player was targeted by a kiling role, that player is saved and converts to Cultist.",
        "All Cultists die if the Witch Doctor dies.",
      ],
    },
    //Killing
    Diabolist: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Vote Kills", "Killing", "Voting"],
      description: [
        "Chooses a victim and a target each night.",
        "If the victim votes for the target in the village meeting the following day, the victim will die.",
      ],
    },
    Gorgon: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Killing", "Reflexive"],
      description: [
        "Chooses to turn all visitors from the previous night into stone, once per game, during the day.",
        "Players turned to stone are killed.",
      ],
    },
    Leech: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Killing", "Blood", "Extra Lives"],
      description: [
        "Is bloodthirsty.",
        "During the night, can attach to a player and leech from them, stealing 50% of their blood.",
        "If the player dies from leeching, the leech also gains an additional 50% of blood.",
        "Gains an extra life after draining 150% blood.",
      ],
    },
    Slasher: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Killing", "Bleeding", "Reflexive", "Knife", "Items"],
      description: [
        "If visited at night by a non-Cult player, gains a knife the next day.",
        "Knows who visits but not their roles.",
      ],
    },
    Tormentor: {
      alignment: "Cult",
      category: "Killing",
      tags: [
        "Killing",
        "Banished",
        "Information",
        "Setup Changes",
        "Extra Night Deaths",
      ],
      newlyAdded: true,
      description: [
        "Adds or Removes 1 Banished Role in Closed Setups.",
        "If a player with a Banished Role dies during the Day, May kill a player at night.",
        "Learns what Banished Roles are in the Current Game.",
      ],
    },
    Werewolf: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Killing", "Lycan", "Effect", "Full Moons"],
      description: [
        "When a Werewolf is present in the game, full moons will occur on odd nights.",
        "Each night, bites a non-Cult player and turns them into a Lycan.",
        "Lycans retain their original roles, but they unknowingly kill a random non-Cult player on full moons.",
        "Invincible during full moons, except for when visiting the Apothecary.",
      ],
    },
    //Speaking
    Banshee: {
      alignment: "Cult",
      category: "Speaking",
      tags: ["Speaking", "Overturn", "Condemn", "Roles"],
      newlyAdded: true,
      description: [
        "Each night a random non-Cult player is told a role.",
        "That player must say the name of the role the following day or the vote will be Overturned onto them.",
        "During the day a Banshee may guess who the player saying the role is, If they guess correctly the village vote is overturned onto that player.",
      ],
    },
    Baphomet: {
      alignment: "Cult",
      category: "Speaking",
      tags: ["Meeting"],
      description: ["Meets with both the Cult and the Templars."],
    },
    Cthulhu: {
      alignment: "Cult",
      category: "Speaking",
      tags: ["Speaking", "Insanity", "Reflexive"],
      description: [
        "All players who visit Cthulhu go insane.",
        "Insane players speak gibberish for the rest of the game.",
      ],
    },
    Fungoid: {
      alignment: "Cult",
      category: "Speaking",
      tags: ["Speaking", "Speech", "Silence", "Blind", "Clueless", "Deafen"],
      description: [
        "Can choose between four fungi to cast at night.",
        "Thrush, which silences the target.",
        "Aspergillus, which deafens the target.",
        "Cataracts, which blinds the target.",
        "Hallucinogens, which scrambles the target.",
        "Once a fungus has been used, it cannot be spored again for the next two nights.",
      ],
    },
    Psion: {
      alignment: "Cult",
      category: "Speaking",
      tags: ["Speaking", "Insanity", "Visits"],
      description: [
        "Visits a player each night.",
        "If that player is not visited by a non-Cult player during the next night, they will go insane.",
      ],
    },
    //Manipulative
    "Cat Lady": {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Cat", "Role Blocker", "Investigative", "Roles"],
      description: [
        "Chooses a player to send them a cat, each day.",
        "The player can choose to let the cat in during the night, or chase it out.",
        "If the cat is let in, the player is blocked from performing night actions.",
        "If the cat is chased out, the Cat Lady will learn the player's role.",
      ],
    },
    Enchantress: {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Night-acting", "Conversion", "Random"],
      recentlyUpdated: true,
      description: [
        "Each night, converts another Cult teammate into a random Cult-aligned role.",
      ],
    },
    "Mi-Go": {
      alignment: "Cult",
      category: "Manipulative",
      tags: [
        "Night-acting",
        "Conversion",
        "Roles",
        "Alignment",
        "Manipulative",
      ],
      newlyAdded: true,
      description: [
        "Each night chooses a player and a role.",
        "If the role is the same alignment as the player's current role, The player is converted to the selected role.",
        "If the selected role is already in play, The conversion fails.",
      ],
    },
    "Queen Bee": {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Delayed"],
      description: [
        "Every night, visits a player and covers them with sticky honey.",
        "Delays their action by one day/night cycle.",
      ],
    },
    Selkie: {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Redirection", "Control"],
      description: [
        "Each night, chooses two players who are forced to target each other.",
      ],
    },
    "Snow Queen": {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Meeting", "Snow Storm"],
      description: [
        "During the day, once per game, can choose to start a snowstorm.",
        "Everyone is forced to pass the next night snowed in together.",
        "During the next night, only Cult actions will go through.",
      ],
    },
    Succubus: {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Mind Rot"],
      recentlyUpdated: true,
      description: [
        "Visits one player each night and inflicts them with Mind Rot",
        "Mind Rot blocks all non-Investigative actions.",
        "Players performing investigative actions will get False Info.",
      ],
    },
    Witch: {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Redirection", "Control"],
      description: [
        "Chooses one player to control.",
        "Chooses who that player will perform their actions on.",
        "Redirection cannot be role blocked.",
      ],
    },
    //Chaos
    Alchemist: {
      alignment: "Cult",
      category: "Chaos",
      tags: [
        "Killing",
        "Investigative",
        "Roles",
        "Protective",
        "Night Saver",
        "Extra Night Deaths",
      ],
      description: [
        "Can choose between three potions to cast at night.",
        "A damaging potion, which attacks the target.",
        "A restoring potion, which heals the target.",
        "An elucidating potion, which reveals the target's role.",
        "Once a potion has been concocted, it cannot be brewed again for the next two nights.",
      ],
    },
    Cannibal: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Killing", "Poison", "Famine", "Condemn", "Food"],
      description: [
        "When a non-Cult player is voted off, the Cannibal can cook the player.",
        "The cooked player is then served as two Stew to every member of the Cult.",
        "If the stew is stolen by non-Cult players and then eaten, they will get poisoned.",
      ],
    },
    Changeling: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Win Con", "Information", "Condemn"],
      recentlyUpdated: true,
      description: [
        "At the start of the game is Given a Village-Aligned player as a Twin.",
        "The Changeling and the Village Twin will learn eachothers roles.",
        "If the Village Twin is Condemned, Cult Wins.",
      ],
    },
    Devotee: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Conversion", "Essential"],
      newlyAdded: true,
      description: [
        "If a Cult role that kills the team on death dies, the Devotee will prevent those deaths and converts to that role.",
      ],
    },
    Gremlin: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Conversion", "Items", "Cult Items", "Insanity", "Magic"],
      description: [
        "Once per night, corrupts the target's item(s) into magic items that benefit the Cult.",
        "Guns, Rifles, and Knives will convert instead of killing.",
        "Armor will make an Attacker Insane.",
        "Tracts will convert a player to a random Cult if converted.",
        "Crystal Balls will reveal players as Cultist.",
        "Syringes will resurrect players as Cultist.",
        "Candles and Falcons will provide False Info.",
        "Whiskey will inflict Mind Rot on Non-Cult Players.",
        "Keys will not Block Cult.",
        "Envelope messages will be gibberish.",
        "Food Items will Poison players who eat them.",
      ],
    },
    Haruspex: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Extra Lives", "Protective", "Sacrificial"],
      description: [
        "Visits two Cult-aligned players each night.",
        "The first player is killed while the second player gains an extra life.",
      ],
    },
    //Demon/Endangered
    Imp: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Endangered", "Killing", "Conversion"],
      recentlyUpdated: true,
      description: [
        "Each night, may choose any player to kill.",
        "If an Imp kills themself, a random Cult-aligned player becomes an Imp.",
        "If there is no Living Imp, All Cult-aligned players die.",
      ],
    },
    Jiangshi: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Endangered",
        "Killing",
        "Conversion",
        "Banished",
        "Setup Changes",
      ],
      newlyAdded: true,
      description: [
        "Each night, may choose a player to kill.",
        "The first time a Jiangshi chooses a player with a Banished Role, the Jiangshi dies and the Banished Player becomes a Jiangshi.",
        "If there is no Living Jiangshi, All Cult-aligned players die.",
        "Jiangshi adds 1 Banished role in closed setups.",
      ],
    },
    Lich: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Endangered", "Killing", "Banished", "Setup Changes", "Mind Rot"],
      newlyAdded: true,
      description: [
        "Each night, may choose a player to kill.",
        "Cult players killed by a Lich can use their abilites when dead.",
        "Additonally killing a Cult player will inflict Mind Rot one of their Village-Aligned neighbors for the rest of the game.",
        "If there is no Living Lich, All Cult-aligned players die.",
        "Lich removes 1 Banished role in closed setups.",
      ],
      graveyardParticipation: "all",
    },
    Nyarlathotep: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Endangered", "Killing", "Win Con", "Deception", "False Mode"],
      newlyAdded: true,
      description: [
        "Each night, may choose a player to kill.",
        "Most information created by Village roles is made false.",
        "If no one is condemned, the Cult wins.",
        "If Nyarlathotep dies, All Cult-aligned players die.",
      ],
    },
    Puca: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Endangered", "Killing", "Mind Rot", "Poison"],
      newlyAdded: true,
      description: [
        "Each night, may choose a player to Mind Rot and Poison.",
        "Player's Poisoned by a Puca will not be told they were poisoned.",
        "If there is no Living Puca, All Cult-aligned players die.",
      ],
    },
    Satyr: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Endangered", "Killing", "Mind Rot", "Neighbors", "Banished"],
      newlyAdded: true,
      description: [
        "Each night, may choose a player to kill.",
        "A Satyr's closest Village-Aligned neighbors' actions are inflicted with Mind Rot at night.",
        "If there is no Living Satyr, All Cult-aligned players die.",
        "Banished roles are skipped when a Satyr looks for it's closest Village-Aligned neighbors.",
      ],
    },
    Shoggoth: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Endangered",
        "Killing",
        "Extra Night Deaths",
        "Graveyard",
        "Revive",
      ],
      newlyAdded: true,
      description: [
        "Each night, may choose 2 players to kill.",
        "Can choose to revive players they kill.",
        "Must revive a player once per game or Village wins instead of Cult",
        "If Shoggoth dies, All Cult-aligned players die.",
      ],
      graveyardParticipation: "all",
    },
    Snallygaster: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Endangered", "Killing", "Extra Night Deaths"],
      newlyAdded: true,
      description: [
        "Each night, may choose a Kill.",
        "If a Snallygaster chooses to kill no one, They may kill 3 players the Next Night",
        "If there is no Living Snallygaster, All Cult-aligned players die.",
      ],
    },
    Poltergeist: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Endangered",
        "Killing",
        "Condemn",
        "Graveyard",
        "Exorcise Village Meeting",
      ],
      newlyAdded: true,
      description: [
        "If no one is Condemned during the day, may choose a player to Kill during the night. (Even if dead)",
        "If a Poltergeist is in the Graveyard Village cannot Win.",
        "If a Poltergeist is in the Graveyard, Cult wins if 1 player is alive.",
        "If a Poltergeist is Exorcised, All Cult-aligned players die.",
        "If it is possible for a Poltergeist to spawn in a setup, Dead players can be voted in village meeting.",
        "Condemned dead players are Exorcised.",
      ],
      graveyardParticipation: "self",
    },
    Vampire: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Killing", "Condemn", "Voting", "Setup Changes", "Vote Kills"],
      newlyAdded: true,
      description: [
        "Vampire Votes count as 0 during the Village Meeting",
        "Most Players including all non-Village are Vampires",
        "Vampires will appear as random Non-Vampire evil roles on Investigations.",
        "Vampires will choose a Vampire to kill each night until 1 Vampire remains.",
        "A solo Vampire will choose a player to kill each night.",
        "Vampires might kill Village Players who Vote for Themselves or Switch Votes.",
        "Cult can only win when One or fewer Village players are alive.",
      ],
    },
    //Other
    Theocrat: {
      alignment: "Cult",
      tags: ["Condemn", "Protective", "Condemn Immune"],
      newlyAdded: true,
      description: [
        "Each night chooses a player to be safe from being Condemned.",
        "Cannot choose the player they protected the previous night",
      ],
    },
    Count: {
      alignment: "Cult",
      tags: ["Banished", "Setup Changes"],
      newlyAdded: true,
      description: [
        "Adds 2 Banished roles in Closed Setups.",
        "If a Count is created mid-game, 2 Village/Independant players will be converted to Banished Roles.",
      ],
    },
    Shadow: {
      alignment: "Cult",
      tags: ["Investigative", "Visits"],
      description: [
        "Visits a player each night.",
        "Can see who that player visits as well as everyone who visits that player.",
      ],
    },
    Druid: {
      alignment: "Cult",
      tags: ["Tree", "Graveyard", "Dead", "Revive"],
      description: [
        "Visits a dead player during the night.",
        "That player will be resurrected as a Tree the following day.",
      ],
      graveyardParticipation: "all",
    },
    Necromancer: {
      alignment: "Cult",
      tags: ["Revive", "Protective", "Graveyard"],
      description: [
        "Visits a dead player during the night once per game.",
        "That player will be resurrected the following day.",
        "If player's role identity was revealed upon death, they will remain revealed when resurrected.",
      ],
      graveyardParticipation: "all",
    },
    Bogeyman: {
      alignment: "Cult",
      category: "Night-acting",
      tags: ["Night-acting", "Visits"],
      description: [
        "Pays a visit to another player at night.",
        "Annoyingly, this visit has no effect.",
        "Cult roles with the Scatterbrained modifier appear as this role to self.",
      ],
    },

    //Independent
    Fool: {
      alignment: "Independent",
      tags: ["Condenm", "Visits"],
      description: [
        "Fools around at night, visiting another player with no effect.",
        "Wins if condemned by the town.",
        "Independent roles with the Scatterbrained modifier appear as this role to self.",
      ],
    },
    Executioner: {
      alignment: "Independent",
      tags: ["Condenm", "Linked"],
      description: [
        "Randomly assigned a Village/Independent player as a target.",
        "Wins if their target player is condemned in Village meeting while alive.",
      ],
    },
    Dodo: {
      alignment: "Independent",
      tags: ["Gifting", "Items", "Gun", "Killing", "No Joints"],
      description: [
        "Wins if shot and killed with a gun.",
        "Flocks around at night, giving their target a gun.",
        "No one else wins if the Dodo wins.",
      ],
    },
    Joker: {
      alignment: "Independent",
      tags: ["Night Kills", "No Joints"],
      description: [
        "Wins if killed at Night.",
        "No one else wins if the Joker wins.",
      ],
    },
    Admirer: {
      alignment: "Independent",
      tags: ["Linked", "Last Two"],
      description: [
        "Attached to Killing Independents.",
        "Knows who their Killer is, but Killers don't know who their Admirers are.",
        "When a Killer dies, one of their Admirers becomes a Killer.",
        "Appears as Villager when investigated.",
        "Wins if among last two alive.",
      ],
    },
    Amnesiac: {
      alignment: "Independent",
      tags: ["Dead", "Conversion"],
      description: [
        "Chooses to become the role of a dead player once per game.",
        "Cannot win the game as Amnesiac.",
      ],
    },
    Survivor: {
      alignment: "Independent",
      tags: ["Survivor"],
      description: ["Wins if alive at the end of the game."],
    },
    "Old Maid": {
      alignment: "Independent",
      tags: ["Conversion", "Role Swapping"],
      description: [
        "Chooses a player to swap roles with each night.",
        "Chosen player becomes the Old Maid.",
        "Cannot win the game as Old Maid.",
      ],
    },
    Traitor: {
      alignment: "Independent",
      tags: ["Traitor", "Mafia"],
      description: [
        "Wins with Mafia.",
        "Does not count towards mafia win count.",
      ],
    },
    Clown: {
      alignment: "Independent",
      tags: ["Condmen", "Mafia", "Win Con"],
      description: [
        "Clowns around at night, visiting another player. The visit does nothing.",
        "The Mafia will be alerted that there is a Clown they must condemn in order to win.",
        "The Village will win instead of Mafia if the Clown is not Condemned.",
        "If a Clown is not Killed by Condemn a Mafia-Aligned player becomes Clown",
        "Wins with Mafia if they are condemned and the Mafia wins.",
      ],
    },
    Autocrat: {
      alignment: "Independent",
      tags: ["Village", "Win Steal"],
      description: ["Wins instead of Village and counts toward their total."],
    },
    Palladist: {
      alignment: "Independent",
      tags: ["Village", "Win Steal", "Meeting", "Conversion"],
      description: [
        "If there are no Freemasons, converts a player to Freemason.",
        "Anonymizes Freemason meetings and forces them to act.",
        "Immune to conversions.",
        "Wins instead of Village if there is a Freemason majority and counts toward their total.",
      ],
    },
    "Panda Bear": {
      alignment: "Independent",
      tags: ["Village", "Win Steal", "Visits"],
      description: [
        "Walks around at night, visiting another player with no effect.",
        "When present in the game, the Village cannot win unless the Panda Bear visits another Panda Bear and they mate.",
        "Wins instead of Village if the Panda Bears survive without mating.",
      ],
    },
    "Vice President": {
      alignment: "Independent",
      tags: ["President", "Essential"],
      description: [
        "If the President dies, converts to President and the game continues.",
        "Cannot win if the President does not die.",
      ],
    },
    Politician: {
      alignment: "Independent",
      tags: ["Voting", "Alignment"],
      description: [
        "Vote weight is worth 2 votes.",
        "Gets assigned to random alignment on game start.",
        "Every day, switches alignment between Mafia and Village.",
        "Wins if their current alignment wins.",
      ],
    },
    Lover: {
      alignment: "Independent",
      tags: ["Survivor", "Lover", "Linked"],
      description: [
        "Falls in love with another player once per game.",
        "Both players die if either of them are killed.",
        "Wins if both players survive until the end of the game.",
      ],
    },
    Prophet: {
      alignment: "Independent",
      tags: ["Guess", "Day", "Night"],
      description: [
        "Once per game, predicts which day/night cycle the game will end on.",
        "Wins if guess is correct.",
      ],
    },
    Fatalist: {
      alignment: "Independent",
      tags: ["Guess", "Death"],
      description: [
        "Once per game, predicts which day/night cycle they will be killed on.",
        "Wins if guess is correct.",
      ],
    },
    Doppelgänger: {
      alignment: "Independent",
      tags: ["Linked", "Copy Action", "Win Steal"],
      description: [
        "Must visit one player during the first night to ally with.",
        "Copies the actions of their ally and performs them on another player every night after the first",
        "Wins instead of their ally if alive when they would win.",
      ],
    },
    "Vengeful Spirit": {
      alignment: "Independent",
      tags: ["Killing", "Graveyard"],
      description: [
        "If murdered by another player, gains the ability to kill each night from the graveyard.",
        "Does not gain the ability if condemned by village vote.",
        "Wins if they kill all of their murderers.",
      ],
      graveyardParticipation: "self",
    },
    Phantom: {
      alignment: "Independent",
      tags: ["Killing", "Conversion"],
      description: [
        "Chooses a player to kill once during the night and convert to their role.",
        "The killed player will have their role hidden upon death, and instead reveal as their alignment.",
        "Cannot win the game as Phantom.",
      ],
    },
    Prince: {
      alignment: "Independent",
      tags: ["Essential", "Alignment"],
      description: [
        "Once per game, visits a player and joins their alignment.",
        "If the Prince dies, everyone of that alignment dies.",
        "Wins if their chosen alignment wins.",
      ],
    },
    Nomad: {
      alignment: "Independent",
      tags: ["Alignment", "Visits"],
      description: [
        "Must visit another player every night.",
        "Cannot choose the same player consecutively.",
        "Wins if they are alive when the last player they visited wins.",
      ],
    },
    Hitchhiker: {
      alignment: "Independent",
      tags: ["Alignment", "Visits", "Mind Rot", "Reflexive"],
      description: [
        "Each Night Will inflict one of their visitors with Mind Rot.",
        "Will Switch to that player's alignment.",
        "Wins with their current Alignment.",
      ],
    },
    "Creepy Girl": {
      alignment: "Independent",
      tags: ["Night Kills", "Items"],
      description: [
        "Can give out one doll at night",
        "The doll can be passed to someone else each night.",
        "Wins if the player holding the doll dies.",
      ],
    },
    Host: {
      alignment: "Independent",
      tags: ["Host", "Unkillable", "Whispers"],
      description: [
        "Always assigned to the first player(s) in the list.",
        "Cannot die.",
        // TODO
        "If in the game, whispers will not leak.",
        "Cannot be added to ranked or competitive games",
      ],
    },
    Siren: {
      alignment: "Independent",
      tags: ["Killing", "Visits", "Reflexive"],
      description: [
        "Beckons a player each night.",
        "If the beckoned player visits the Siren that night, the player dies.",
        "Wins if successfully kills two players.",
      ],
    },
    "Gingerbread Man": {
      alignment: "Independent",
      tags: ["Survivor", "Visits", "Extra Lives"],
      description: [
        "Each night, hides behind a player and becomes immune to death.",
        "Will get eaten if the player visits them. That player will gain an extra life.",
        "Wins if alive at the end of the game.",
      ],
    },
    Astrologer: {
      alignment: "Independent",
      tags: ["Linked", "Survivor"],
      description: [
        "Chooses two players and makes them fall in love with each other.",
        "Wins if their chosen lovers are alive at the end of the game.",
      ],
    },
    Grouch: {
      alignment: "Independent",
      tags: ["Mafia", "Cult", "Survivor", "Vanilla"],
      description: ["Wins if alive when Village loses."],
    },
    Sidekick: {
      alignment: "Independent",
      tags: ["Linked", "Independent"],
      description: [
        "Assigned to a random independent player at game start.",
        "Wins if their teammate wins.",
      ],
    },
    Supervillain: {
      alignment: "Independent",
      tags: ["Independent"],
      description: ["Wins if they are the sole remaining Independent player."],
    },
    Monk: {
      alignment: "Independent",
      tags: ["Voting", "Night Saver", "Protective", "Condemn Immune"],
      description: [
        "Has no voting power.",
        "Each night, can save one player and also grant them condemn immunity the following day.",
        "Wins from two saves, or if no deaths happen in 2 days and 2 nights.",
      ],
    },
    Warlock: {
      alignment: "Independent",
      tags: ["Voting", "Condemn", "Extra Lives"],
      recentlyUpdated: true,
      description: [
        "Each night chooses one person.",
        "If that person is condemned the next day, the Warlock has predicted correctly. They gain an extra life.",
        "The Warlock wins if they predict the condemnation correctly twice.",
      ],
    },
    Rival: {
      alignment: "Independent",
      tags: ["Linked"],
      description: [
        "At game start, is assigned to another rival.",
        "Wins if the rival survives and their rival does not.",
      ],
    },
    Picciotto: {
      alignment: "Independent",
      tags: ["Mafia", "Conversion", "Visits"],
      description: [
        "Every night, can visit a player.",
        "If that player is mafia, the Picciotto will be notified.",
        "When the Picciotto has visited all the living mafia, they are converted into a random mafia.",
        "Does not win if not converted to mafia.",
      ],
    },
    Angel: {
      alignment: "Independent",
      tags: ["Protective", "Graveyard", "Sacrificial"],
      graveyardParticipation: "self",
      description: [
        "Will become the guardian angel for one player in the game.",
        "Once per game while alive or dead, can turn on sacrificial powers and protect their target from all kills",
        "Wins if their target is alive at the end of the game.",
      ],
    },
    Emperor: {
      alignment: "Independent",
      tags: ["Voting", "Condemn"],
      description: [
        "Chooses two players each night to force into a duel.",
        "During the following day, only the two duelists may be voted.",
        "Must predict during the sunrise which duelist will survive.",
        "Wins if they predict correctly twice.",
      ],
    },
    Magus: {
      alignment: "Independent",
      newlyAdded: true,
      tags: ["Magus", "Setup Changes", "Village"],
      description: [
        "If a player rolls Magus at the beginning of the game, no Mafia or Cult roles will be present in the game.",
        "At night, the Magus will passively kill a random player each night, even if dead.",
        "At night, the Magus will passively and randomly use abilities of Evil roles that can spawn in a setup.",
        "If it is possible for a Magus to be rolled, players can vote to declare a Magus Game during the day.",
        "If a Magus Game is declared and a Magus is not present, all Village-aligned players die.",
        "Blocks a Village win if a Magus is present and a Magus Game is not declared.",
        "Wins with Village if a Magus Game is correctly declared. Can win when dead.",
        "Village and The Magus lose if only 2 players are alive.",
      ],
    },
    "Serial Killer": {
      alignment: "Independent",
      tags: ["Killing", "Must Act", "Last Two"],
      description: [
        "Must kill a player each night.",
        "Wins if among last two alive.",
      ],
    },
    Yandere: {
      alignment: "Independent",
      tags: ["Killing", "Must Act", "Linked", "Last Two"],
      description: [
        "Falls in love with another player once per game.",
        "The beloved will not be alerted. If the beloved dies, the Yandere dies. If the Yandere dies, the beloved will not die.",
        "Must kill a player each night.",
        "Wins if the Yandere and their beloved are the last two alive.",
      ],
    },
    Clockmaker: {
      alignment: "Independent",
      tags: ["Killing", "Alignment", "Extra Lives"],
      description: [
        "Has a clock that starts at 6 o'clock.",
        "Choosing to kill a player each night changes the time based on that player's alignment.",
        "Clock goes up by 1 hour for village, 2 hours for Mafia or Cult, and down by 3 hours for Independent.",
        "Dies instantly at 3 o'clock.",
        "Gains an extra life at 9 o'clock.",
        "Wins when clock strikes 12 o'clock.",
      ],
    },
    Pyromaniac: {
      alignment: "Independent",
      tags: ["Killing", "Gasoline", "Last Two"],
      description: [
        "Douses one player with Gasoline each night.",
        "Chooses to light a match during the day to burn doused players to ashes.",
        "Wins if among last two alive.",
      ],
    },
    Dentist: {
      alignment: "Independent",
      tags: ["Killing", "Visits", "Last Two"],
      description: [
        "Gasses one player with anesthetic each night.",
        "If that player acts the next night, they die.",
        "Anesthetic attack can be cured by not acting.",
        "Wins if among last two alive.",
      ],
    },
    Hellhound: {
      alignment: "Independent",
      tags: ["Killing", "Roles", "Last Two", "Immortal", "Condemn Immune"],
      description: [
        "Chooses to hunt at night by choosing a player and guessing their role.",
        "If guessed correct, becomes immortal for the following day.",
        "If guessed incorrect, identity will be revealed to all.",
        "Wins if among the last two alive.",
      ],
    },
    Shinigami: {
      alignment: "Independent",
      tags: ["Killing", "Items"],
      description: [
        "At the beginning of the game, one player randomly receives a notebook.",
        "That player can kill during the night.",
        "The holder of the notebook must pass it to another player each day.",
        "The Shinigami guesses the current holder of the notebook each night. If they guess correctly once, they win.",
      ],
    },
    Ripper: {
      alignment: "Independent",
      tags: ["Killing", "Independent"],
      description: [
        "Kills one player every night.",
        "Wins when all other Hostile Independents are dead.",
      ],
    },
    Blob: {
      alignment: "Independent",
      tags: [
        "Killing",
        "Graveyard",
        "Extra Lives",
        "Last Two",
        "Clean Night Kill",
      ],
      description: [
        "Absorbs one person each night, killing them and cleaning their deaths.",
        "Absorbed players may speak amongst themselves inside of the Blob.",
        "For each absorbed player, the Blob gains an extra life.",
        "Upon death, everyone absorbed by the Blob is regurgitated.",
        "Wins if among the last two alive.",
      ],
    },
    Mastermind: {
      alignment: "Independent",
      tags: ["Mafia", "Cult", "Meeting", "AnonymizeMeeting"],
      description: [
        "Mafia and Cult meetings are anonymous if Mastermind is present in the game.",
        "Wins instead of mafia/cult and counts toward their total.",
      ],
    },
    Usurper: {
      alignment: "Independent",
      tags: ["Mafia", "Mafioso", "Meeting", "AnonymizeMeeting", "Cultist"],
      description: [
        "Meets with the Mafia and Cult, makes their night meeting anonymous.",
        "Each night, chooses a player. If the player is sided with the mafia/cult, they become a Mafioso/Cultist.",
        "Wins when all mafia-aligned players are Mafiosos or all cult-aligned players are Cultists.",
      ],
    },
    Mutineer: {
      alignment: "Independent",
      tags: ["Mafia", "Meeting", "Killing", "Last Two", "AnonymizeMeeting"],
      description: [
        "Can kill one player per night.",
        "Appears as Mafia on investigation.",
        "Attends Mafia and Cult meetings, makes them anonymous and cannot vote in them.",
        "Wins if alive alone or the final two, and the other is not a mafia or cult",
      ],
    },
    Alien: {
      alignment: "Independent",
      tags: ["Probe", "Visits"],
      description: [
        "Chooses one player to probe each night.",
        "Wins if all players left alive have been probed.",
      ],
    },
    Matchmaker: {
      alignment: "Independent",
      tags: ["Linked", "Alignment"],
      description: [
        "Each night chooses two players to go on a date. If they are the same alignment, the date will be succesful.",
        "Wins if all players left alive have went on a successful date.",
      ],
    },
    Tofurkey: {
      alignment: "Independent",
      tags: ["Famine", "Alignment", "Survivor"],
      description: [
        "The game begins with a famine, with each player starting with four bread.",
        "Tofurkeys are immune to the famine.",
        "If a Tofurkey dies, each remaining player loses one meal.",
        "Appears as Turkey to investigators.",
        "Wins if they survive to the end of the game and everyone else dies of famine.",
      ],
    },
    Turkey: {
      alignment: "Independent",
      tags: ["Famine", "Alignment", "Survivor"],
      description: [
        "The game begins with a famine, with each player starting with four bread.",
        "Turkeys are immune to the famine.",
        "If a Turkey dies, each remaining player gets one meal.",
        "Wins if they survive to the end of the game and everyone else dies of famine.",
      ],
    },
    Leprechaun: {
      alignment: "Independent",
      tags: ["Items", "Killing"],
      description: [
        "When present in the game, four-leaf clovers are randomly assigned to players.",
        "Each night, steals a random item from their target, preferentially stealing Clovers.",
        "If it finds another Leprechaun, will kill them and steal all their items.",
        "Wins if holding three four-leaf clovers.",
      ],
    },
    Anarchist: {
      alignment: "Independent",
      tags: ["Items", "Killing", "Revealing", "Last Two", "Mini-Game"],
      description: [
        "Gives out a timebomb each night.",
        "The timebomb can be passed around during the day, randomly exploding.",
        "Wins if 3 players are killed by the timebomb, or if the Anarchist is among the last two alive.",
        "Timebomb reveals Anarchist when exploded on themself.",
      ],
    },
    Communist: {
      alignment: "Independent",
      tags: ["Conversion", "Vanilla"],
      description: [
        "Visits one player each night.",
        "Turns that player into their alignment's vanilla role.",
        "Wins if alive when all other players are vanilla.",
      ],
    },
    Gambler: {
      alignment: "Independent",
      tags: ["Killing", "Last Two", "Mini-Game"],
      description: [
        "Each night, challenges a player to a game of Rock, Paper, Scissors. Game is played during the day.",
        "If the Gambler wins, the Challenger dies.",
        "Wins the game when they have 2 gamble wins, or are among the last two standing.",
      ],
    },
    "Grizzly Bear": {
      alignment: "Independent",
      tags: ["Killing", "Last Two", "Visits"],
      description: [
        "Visits one player each night.",
        "Any player to visit the Grizzly Bear's target will be killed. If the Grizzly Bear's target does not visit that night, they will be killed as well.",
        "Wins if among last two alive.",
      ],
    },
    "Polar Bear": {
      alignment: "Independent",
      tags: ["Killing", "Last Two", "Visits", "Malicious Effects"],
      description: [
        "Visits two players each night, polarising them.",
        "A polarised player visiting another polarised player will kill both of them.",
        //"If visited by a Penguin, will eat it.",
        "Wins if four polarised players die or if majority is attained.",
      ],
    },
    Samurai: {
      alignment: "Independent",
      tags: ["Killing", "Turn Based", "Mini-Game"],
      disabled: true,
      newlyAdded: true,
      description: [
        "Picks a player at night to enage in a turn based duel during the day once per game.",
        "Both the samurai and the target has the option to use the following moves: attack, defend, parry and charge.",
        "Attack - Deals 15-20 damage.",
        "Defend - Raises defense on the current turn. High chance of blocking a crit.",
        "Charge - Raises the crit chance on the next turn",
        "Wins if they win their duel.",
      ],
    },
    Snowman: {
      alignment: "Independent",
      tags: ["Items", "Mini-Game"],
      description: [
        "Each night, may declare a snowball fight.",
        "Half of all players will receive a snowball.",
        "Throwing a snowball at someone freezes them.",
        "A frozen player cannot vote or take any action at night. To be unfrozen, they must be visited by another player.",
        "Wins if all living players have been frozen.",
      ],
    },
    Judge: {
      alignment: "Independent",
      tags: ["Speaking", "Voting", "Meeting"],
      description: [
        "Can anonymously broadcast messages during the day.",
        "Twice per game, may declare a court session.",
        "During court, all players but the Judge speak and vote anonymously as the jury.",
        "The Judge's vote counts for three.",
        "Wins among the last two standing.",
      ],
    },
  },

  "Split Decision": {
    //Blue
    "Blue Member": {
      alignment: "Blue",
      tags: ["None"],
      description: [
        "Wins if the President is not in the same room as the Bomber at the end of the game.",
      ],
    },
    President: {
      alignment: "Blue",
      tags: ["None"],
      description: [
        "The Blue team wins if they are in a different room from the Bomber at the end of the game.",
      ],
    },
    //Red
    "Red Member": {
      alignment: "Red",
      tags: ["None"],
      description: [
        "Wins if the President is in the same room as the Bomber at the end of the game.",
      ],
    },
    Bomber: {
      alignment: "Red",
      tags: ["None"],
      description: [
        "The Red team wins if they are in the same room as the Bomber at the end of the game.",
      ],
    },
    //Independent
    Gambler: {
      alignment: "Independent",
      tags: ["None"],
      description: [
        "Guesses which team will win after the last round and wins if correct.",
      ],
    },
  },
  Resistance: {
    //Resistance
    Rebel: {
      alignment: "Resistance",
      tags: ["None"],
      description: ["Wins if a certain number of missions are successful."],
    },
    Merlin: {
      alignment: "Resistance",
      tags: ["None"],
      description: [
        "Knows the alignment of all spies.",
        "If the Rebels would win, the spies can guess who Merlin is to win instead.",
      ],
    },
    Percival: {
      alignment: "Resistance",
      tags: ["None"],
      description: ["Knows who is Merlin."],
    },
    //Spies
    Spy: {
      alignment: "Spies",
      tags: ["None"],
      description: ["Wins if a certain number of missions fail."],
    },
    Oberon: {
      alignment: "Spies",
      tags: ["None"],
      description: [
        "Does not know who the other spies are and spies do not know them.",
      ],
    },
    Morgana: {
      alignment: "Spies",
      tags: ["None"],
      description: ["Appears as Merlin to Percival."],
    },
  },
  "One Night": {
    //Village
    Villager: {
      alignment: "Village",
      tags: ["None"],
      description: [
        "Wins if at least one Werewolf dies or if no one dies if no Werewolves are present.",
      ],
    },
    Hunter: {
      alignment: "Village",
      tags: ["None"],
      description: [
        "If condemned, the player they voted to condemn is also killed.",
      ],
    },
    Mason: {
      alignment: "Village",
      tags: ["None"],
      description: [
        "Learns who the other Masons were at the beginning of the night.",
      ],
    },
    Seer: {
      alignment: "Village",
      tags: ["None"],
      description: [
        "At the beginning of the night, learns either one player's role or two excess roles.",
      ],
    },
    Robber: {
      alignment: "Village",
      tags: ["None"],
      description: [
        "At 12:00, can choose to exchange roles with another player and learn their new role.",
        "Does not perform the action of their new role.",
      ],
    },
    Troublemaker: {
      alignment: "Village",
      tags: ["None"],
      description: [
        "At 1:00, can swap the roles of two other players.",
        "Those players do not perform the actions of their new roles.",
      ],
    },
    Insomniac: {
      alignment: "Village",
      tags: ["None"],
      description: ["Learns what their role is after the night is over."],
    },
    //Werewolves
    Werewolf: {
      alignment: "Werewolves",
      tags: ["None"],
      description: [
        "Learns who the other Werewolves were at the beginning of the night.",
        "If there are no other Werewolves, learns one excess role.",
        "Wins if Werewolves are present but no Werewolves die.",
      ],
    },
    Minion: {
      alignment: "Werewolves",
      tags: ["None"],
      description: [
        "Learns who the Werewolves are at the beginning of the night.",
        "Wins with the Werewolves, and wins if a non-minion player dies when no Werewolves are present.",
      ],
    },
    //Independent
    Drunk: {
      alignment: "Independent",
      tags: ["None"],
      description: ["Becomes a random excess role at the end of the night."],
    },
    Tanner: {
      alignment: "Independent",
      tags: ["None"],
      description: [
        "Wins if they die.",
        "The Werewolves do not win if they die.",
        "The Village does not win if they die and no Werewolves are present.",
      ],
    },
    Doppelganger: {
      alignment: "Independent",
      tags: ["None"],
      description: [
        "At the beginning of the night, copies and becomes the role of another player.",
        "Performs the actions of that role, unless another Doppelganger was chosen.",
        "Their new actions are performed before the player's whose role was copied.",
      ],
    },
  },
  Ghost: {
    Villager: {
      alignment: "Town",
      tags: ["None"],
      description: ["Knows the hidden word."],
    },
    Fool: {
      alignment: "Town",
      tags: ["None"],
      description: [
        "Knows the decoy word, which has the same number of letters as the hidden word.",
        "Appears to self as Town, and does not know that their word is the decoy word.",
      ],
    },
    Ghost: {
      alignment: "Ghost",
      tags: ["None"],
      description: [
        "Knows other Ghosts.",
        "Only knows the number of letters in the hidden word.",
        "Must blend in and guess the hidden word.",
      ],
    },
    Host: {
      alignment: "Host",
      tags: ["None"],
      description: ["Knows both words.", "Facilitates the game."],
    },
  },
  Jotto: {
    Player: {
      alignment: "Town",
      tags: ["None"],
      description: ["Can choose a word.", "Can guess another player's word."],
    },
  },
  Acrotopia: {
    Player: {
      alignment: "Town",
      tags: ["None"],
      description: ["Can make and vote for acronyms."],
    },
  },
  "Secret Dictator": {
    // Liberals
    Liberal: {
      alignment: "Liberals",
      tags: ["None"],
      description: [
        "Wins if 5 Liberal Policies are enacted or Dictator is assassinated.",
      ],
    },
    // Liberals
    Fascist: {
      alignment: "Fascists",
      tags: ["None"],
      description: [
        "Wins if 6 Fascist Policies are enacted or Dictator is elected Chancellor after 3rd Fascist Policy enacted.",
      ],
    },
    Dictator: {
      alignment: "Fascists",
      tags: ["None"],
      description: ["Appears as Fascist if investigated."],
    },
  },
  "Secret Hitler": {},
  "Wacky Words": {
    Player: {
      alignment: "Town",
      tags: ["None"],
      description: ["Can answer prompts and vote for answers."],
    },
    Alien: {
      alignment: "Town",
      tags: ["None"],
      description: [
        "Can answer prompts and vote for answers.",
        "Turns game into a reverse game, where players create prompts to answer responses.",
      ],
    },
    Neighbor: {
      alignment: "Town",
      tags: ["None"],
      description: [
        "Can answer prompts and vote for answers.",
        "Turns game into a Wacky People game, where players answer personal questions.",
      ],
    },
  },
  "Liars Dice": {
    Liar: {
      alignment: "Liars",
      tags: ["None"],
      description: [
        "Rolls dice each round.",
        "Lies.",
        "Loses if runs out of dice.",
      ],
    },
  },
};

module.exports = roleData;
