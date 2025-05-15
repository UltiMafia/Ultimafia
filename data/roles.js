const roleData = {
  Mafia: {
    //Village

    //basic roles
    Villager: {
      alignment: "Village",
      category: "Basic",
      tags: ["Vanilla", "Basic"],
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
      tags: ["Exposed", "Basic"],
      description: [
        "Identity is publicly revealed to all players at the start of the game.",
      ],
    },
    Commuter: {
      alignment: "Village",
      category: "Basic",
      tags: ["Role Blocker", "Basic", "Reflexive"],
      description: [
        "Blocks any player who visits them during the night from performing any actions.",
      ],
    },
    Slayer: {
      alignment: "Village",
      category: "Basic",
      tags: ["Items", "Killing", "Alignments", "Day Killer"],
      description: [
        "Starts with a stake.",
        "Stakes can only kill players who appear as Cult or Mafia-aligned.",
        "This stake always reveals the Slayer when successfully killing a player.",
      ],
    },
    Deputy: {
      alignment: "Village",
      category: "Basic",
      tags: ["Items", "Basic", "Killing", "Gun", "Day Killer"],
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
      tags: ["Humble", "Basic", "Deception", "No Investigate"],
      description: [
        "Appears as Villager to self.",
        "Appears as a random Evil role to investigative roles.",
        "Appears as a random Evil role upon being condemned.",
        "Appears as Miller upon being killed.",
      ],
    },
    Wannabe: {
      alignment: "Village",
      category: "Basic",
      tags: ["Humble", "Basic", "Deception"],
      description: [
        "Appears as Villager to self.",
        "Appears to visit a player who dies at night, prioritizing players who are killed by the mafia.",
        "Does not visit the player.",
      ],
    },
    "Party Host": {
      alignment: "Village",
      category: "Basic",
      tags: ["Meetings", "Basic"],
      description: [
        "Chooses to host a party during day meeting for everyone to attend once per game on the following night.",
        "Everyone will share a party meeting at night.",
      ],
    },
    Sapling: {
      alignment: "Village",
      category: "Basic",
      tags: ["Tree", "Basic", "Voting", "Unkillable", "Condemn Immunity"],
      description: [
        "Chooses whether or not to grow into a tree at night.",
        "Tree is immune to most ways of dying.",
        "Tree cannot vote.",
      ],
    },
    Sheriff: {
      alignment: "Village",
      category: "Basic",
      tags: ["Items", "Basic", "Killing", "Gun", "Day Killer"],
      description: [
        "Starts with a gun.",
        "This gun always reveals the sheriff when shot.",
      ],
    },
    Sleepwalker: {
      alignment: "Village",
      tags: ["Visiting", "Basic"],
      category: "Basic",
      description: ["Visits a random player each night."],
    },
    //protective roles
    Bawd: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Night Saver", "Delirium", "Visiting"],
      description: [
        "Protects two players every night.",
        "One of the players being protected is Delirious.",
      ],
    },
    Bodyguard: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Killing", "Self Kill", "Visiting"],
      description: [
        "Guards one player every night",
        "If the target was attacked, the Bodyguard will kill one attacker and die.",
        "If the target was the Celebrity, the Bodyguard will kill all attackers and die.",
      ],
      SpecialInteractions: {
        Celebrity: [
          "If a Bodyguard is Protecting a Celebrity, the Bodyguard will kill all attackers and die.",
        ],
      },
    },
    Doctor: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Night Saver", "Visiting"],
      description: ["Saves another player from dying each night."],
    },
    Martyr: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Condemn", "Visiting"],
      description: [
        "Can choose to sacrifice themself and be condemned in the place of the player currently being condemned.",
      ],
    },
    Medic: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Extra Lives", "Visiting"],
      description: [
        "Visits two players each night.",
        "If the first player is targeted for a night kill and dies, the second player gains an extra life.",
      ],
    },
    Nurse: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Cleanse", "Visiting"],
      description: [
        "Visits one player each night and cleanses them of malicious effects.",
        "Malicious effects include poison, bleeding, insanity, and polarization.",
      ],
    },
    Resurrectionist: {
      alignment: "Village",
      category: "Protective",
      tags: ["Revive", "Protective", "Graveyard", "Visiting"],
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
      tags: ["Convert Saver", "Protective", "Conversion", "Visiting"],
      description: [
        "Prevents their target from being converted to another role.",
        "If their target was a Hostile Independent, the target will become a Villager.",
      ],
      RolesMadeBy: ["Villager"],
    },
    Surgeon: {
      alignment: "Village",
      category: "Protective",
      tags: [
        "Convert Saver",
        "Protective",
        "Killing",
        "Night Saver",
        "Visiting",
      ],
      description: [
        "Each night, operates on one player to prevent them from dying or being converted.",
        "If that player is attacked, the Surgeon kills one of their attackers",
      ],
    },
    "Tea Lady": {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Condemn", "Neighbors", "Night Saver"],
      description: [
        "If both of the Tea Lady's neighbors are aligned with the Village, the neighbors can't die.",
      ],
    },
    //gifting roles
    Barista: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Information", "Items", "Coffee", "Visiting", "Dawn"],
      description: [
        "Gives out coffee to one player each night.",
        "Coffee will allow a player to perform their night actions twice in one night.",
        "The more cups of coffee a player drinks, the more night actions they can take in one night.",
      ],
    },
    Baker: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Famine", "Items", "Bread", "Visiting"],
      description: [
        "When baker is present in the game, all players start with two breads. A famine will start.",
        "Gives out up to two breads each night.",
        "Bread is consumed each night, staving off the famine for another phase. Running out will eventually starve the player to death.",
      ],
    },
    Blacksmith: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Protective", "Items", "Armor", "Visiting"],
      description: [
        "Gives out armor to one player each night.",
        "Armor will protect from one attack before breaking.",
      ],
    },
    Chandler: {
      alignment: "Village",
      category: "Gifting",
      tags: [
        "Gifting",
        "Information",
        "Items",
        "Candle",
        "Visit Interaction",
        "Visiting",
      ],
      description: [
        "Gives out a candle to one player each night.",
        "Candles will tell a player the names of their visitors from the previous night.",
      ],
    },
    Cutler: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Bleeding", "Items", "Knife", "Killing", "Visiting"],
      description: [
        "Gives out a knife each night.",
        "Knives can be used to attack another player, causing them to bleed.",
      ],
    },
    Demolitionist: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Items", "Bomb", "Killing", "Visiting"],
      description: [
        "Gives out bomb to one player each night.",
        "If a player holding a bomb is attacked, their attacker will die along with them.",
      ],
    },
    Falconer: {
      alignment: "Village",
      category: "Gifting",
      tags: [
        "Gifting",
        "Information",
        "Items",
        "Falcon",
        "Visit Interaction",
        "Visiting",
      ],
      description: [
        "Gives out a falcon to one player each night.",
        "Falcons can be used to track another player's movements during the night.",
      ],
    },
    Funsmith: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Killing", "Items", "Gun", "Reflexive", "Visiting"],
      description: [
        "Gives out a gun each night.",
        "Gives out a gun to all visitors at night.",
      ],
    },
    Gemcutter: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Revealing", "Items", "Crystal", "Visiting"],
      description: [
        "Gives out a crystal ball to a player each night.",
        "If a player holding the crystal ball dies, their target's role will be revealed.",
      ],
    },
    Gunsmith: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Killing", "Items", "Gun", "Visiting"],
      description: [
        "Gives out a gun each night.",
        "Guns can be used to shoot and kill someone during the day.",
      ],
    },
    Keymaker: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Role Blocker", "Items", "Key", "Visiting"],
      description: [
        "Gives out a key to one player each night.",
        "Keys can be used to lock a player in the next night; they cannot be visited, but also cannot perform any actions.",
      ],
    },
    Knight: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Protective", "Items", "Shield", "Visiting"],
      description: [
        "Gives out sheild to one player each night.",
        "Shields can be used at night to redirect kills targeting the holder on to a random player of the same alignment if possible.",
      ],
    },
    Mailman: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Messages", "Items", "Envelope", "Visiting"],
      description: [
        "Gives out an envelope to one player each night.",
        "Envelopes can be used to send an anonymous message to another player at night.",
      ],
    },
    Missionary: {
      alignment: "Village",
      category: "Gifting",
      tags: [
        "Gifting",
        "Convert Saver",
        "Items",
        "Tract",
        "Protective",
        "Visiting",
      ],
      description: [
        "Gives out a tract to one player each night.",
        "Tracts will prevent one conversion attempt.",
      ],
    },
    Pharmacist: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Role Blocker", "Items", "Whiskey", "Visiting"],
      description: [
        "Gives out a bottle of whiskey each night.",
        "Whiskey can be used to distract another player, preventing them from acting the next night.",
      ],
    },
    Reanimator: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Gifting", "Revive", "Items", "Syringe", "Graveyard", "Visiting"],
      description: [
        "Gives out a syringe each night.",
        "Syringes can be used on dead players to resurrect them.",
      ],
      graveyardParticipation: "all",
    },
    Santa: {
      alignment: "Village",
      category: "Gifting",
      tags: [
        "Gifting",
        "Items",
        "Graveyard",
        "Investigative",
        "Alignments",
        "Visiting",
        "Information",
        "Self Blocking",
        "Dawn",
      ],
      description: [
        "Visits a player each night to learn their role alignment.",
        "If not visited during the night, will learn whether that player is naughty or nice.",
        "Gives out a Gun, Knife, Armor, Bomb, Crystal, Whiskey, Bread, Key, Falcon, Tract, Syringe, or Coffee each night.",
      ],
      graveyardParticipation: "all",
    },
    //investigative roles
    Analyst: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Roles", "Speaking"],
      description: [
        'On their 1st day if an Analyst makes a guess in chat following this structure "I will analyze if (Player Name) is (Role Name)".',
        "The Analyst will learn how many guesses were correct during the night.",
        "The Analyst may only make 5 guesses.",
      ],
    },
    Accountant: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Neighbors", "Position"],
      description: [
        "On Night 1 learns how many pairs of Evil players there are.",
        "A pair is each unique instance of 2 Evil Players neighboring each other.",
        "Players can be part of multiple pairs.",
      ],
    },
    Bloodhound: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Visits", "Visiting"],
      description: [
        "Tracks a player each night and learns if they visited anybody.",
      ],
    },
    "Bounty Hunter": {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative"],
      description: [
        "On their first night learns an Evil Player.",
        "When that evil player dies, The Bounty Hunter will learn another evil player at night.",
        "One Village Aligned Player is Evil, and Wins if Village Loses",
      ],
    },
    Housekeeper: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Visits", "Reports", "Visiting"],
      description: [
        "Each night chooses 2 players, Learns how many of those players visited or received reports",
      ],
    },
    Cop: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Alignment", "Cop", "Visiting"],
      description: [
        "Investigates one player each night and learns their alignment.",
      ],
    },
    Coroner: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Roles", "Dead", "Visiting"],
      description: [
        "Chooses to visit a dead player at night and learns their role identity.",
      ],
    },
    Detective: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Roles", "Visiting"],
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
        "Each night, learns if a Mafia or Cult-aligned player voted with the majority on the previous day.",
        "If the vote was tied, the Statistician learns a random value.",
      ],
    },
    Forensicist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Information"],
      description: [
        "Each night learns if and how many system messages are being falsified.",
      ],
      SpecialInteractions: {
        Journalist: ["Forensicist will not count Journalist info."],
      },
    },
    Geologist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Neighbors", "Position"],
      description: [
        "On the first night, learns the distance in players between 2 Evil players.",
        "If the distance is 0, then the Evil players are neighboring each other.",
      ],
    },
    Orienteer: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Neighbors", "Position"],
      description: [
        "Learns the direction to closest evil player on Night 1.",
        "This will Loop around at the top and bottom of the player list.",
      ],
    },
    Groundskeeper: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Alignment", "Dead"],
      description: [
        "Each night learn how many dead players are Evil.",
        "The number is calculated after any kills in the night.",
      ],
    },
    Diviner: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Roles", "Visiting"],
      description: [
        "Investigates one player each night and learns two roles of opposite alignments.",
        "The investigated player is one of the roles learned by the Diviner.",
      ],
    },
    Journalist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Reports", "Visiting"],
      description: [
        "Chooses a player each night and views any reports they receive the following day.",
      ],
    },
    Justice: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Alignment", "Visiting"],
      description: [
        "Investigates two players at night and learns if they share an alignment.",
      ],
    },
    Laundress: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Roles"],
      description: [
        "On Night 1, learns that 1 of 2 players is a particular role.",
      ],
    },
    Scientist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Roles", "Neighbors", "Visits"],
      description: [
        "Once per game during the Day, can learn about the relation between a player and a role.",
      ],
    },
    Tourist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Roles", "Excess Roles"],
      description: ["At night, reveals 1-3 Excess roles to All Players."],
    },
    Manhunter: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Roles", "Visiting"],
      description: [
        "Chooses a player and a role and learns if they are that role or not.",
      ],
    },
    Pathologist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Reports", "Dead", "Visiting"],
      description: [
        "Each night, visits one dead player.",
        "Will receive all system messages the player ever received.",
      ],
    },
    Psychic: {
      alignment: "Village",
      category: "Investigative",
      tags: [
        "Investigative",
        "Alignment",
        "Visiting",
        "Reflexive",
        "Self Blocking",
      ],
      description: [
        "At night, learns either one player's role or two excess roles.",
      ],
    },
    Auditor: {
      alignment: "Village",
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
        "Each day, may learn two pieces of information about the game. One will be true and one will be false.",
      ],
    },
    Snoop: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Items", "Visiting"],
      description: [
        "Visits a player each night and learns what items they are carrying.",
      ],
    },
    Tracker: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Investigative", "Visits", "Visiting"],
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
      tags: [
        "Night-acting",
        "Killing",
        "Gun",
        "Items",
        "Visiting",
        "Day Killer",
      ],
      description: [
        "Each night, chooses someone to avenge.",
        "Gets a gun if their chosen target dies.",
      ],
    },
    Caroler: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Information", "Alignment", "Visiting"],
      description: [
        "Each night, sings a carol to a player about 3 players, at least one of whom is Evil.",
        "The carol is not heard if the player chosen visits at night.",
        "Cannot choose the same player consecutively.",
      ],
    },
    Comedian: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Information", "Roles", "Visiting"],
      description: [
        "Each night, tells a joke to a player about 3 roles, and a different player who is one of the roles.",
        "The joke is not heard if the target chosen visits at night.",
        "Cannot choose same the target consecutively.",
      ],
    },
    Exorcist: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Dead", "Graveyard", "Exorcise", "Visiting"],
      description: [
        "Each Night, the Exorcist can Exorcise a dead Player.",
        "Exorcised players can't be revived or use Graveyard abilites.",
      ],
    },
    Flapper: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Delirium", "Roles"],
      description: [
        "Once per game chooses a Role.",
        "Any players with that role are Delirious for 3 Nights.",
        "If the selected role is not in the game nothing happens.",
      ],
    },
    Drunk: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Role Blocker", "Visiting"],
      description: [
        "Visits one player each night and blocks them from performing any night actions.",
        "Some actions cannot be blocked.",
      ],
    },
    Sailor: {
      alignment: "Village",
      category: "Night-acting",
      tags: [
        "Night-acting",
        "Delirium",
        "Unkillable",
        "Condemn Immune",
        "Visiting",
      ],
      description: [
        "Visits one player each night and makes them Delirious.",
        "Delirious players get False Info and have other abilites disabled.",
        "A Sailor can't be killed unless roleblocked/made delirious.",
      ],
    },
    "Snake Charmer": {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Conversion", "Role Swapping", "Visiting"],
      description: [
        "Each night, chooses a player to swap roles with.",
        "A Snake Charmer can only swap roles once.",
      ],
    },
    Mediator: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Conversion", "Role Swapping", "Visiting"],
      description: [
        "Each night chooses 2 players.",
        "The selected players will swap roles.",
      ],
    },
    Guard: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Role Blocker", "Visiting"],
      description: ["Each night, protects one player from all visits."],
    },
    Mechanic: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Items", "Visiting"],
      description: [
        "Once per night, fixes the target's item(s).",
        "Can undo an item's fabricated/sabotaged status, and can turn Gunrunner guns into normal guns and Gremlin guns into normal guns.",
        "Each phase, fixes their own item(s).",
      ],
    },
    Mime: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Villager", "Conversion", "Alignment", "Visiting"],
      description: [
        "Chooses a player at night and attempts to mime their role.",
        "If player is Village, Mime steals their role and that player becomes a villager.",
        "If player is Mafia, Mime becomes villager.",
        "If player is Cult or Independent, Mime becomes Amnesiac.",
      ],
      RolesMadeBy: ["Villager", "Amnesiac"],
    },
    "Lunch Lady": {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Modifiers", "Conversion", "Visiting"],
      description: ["Removes modifiers from other players at night"],
    },
    Photographer: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Revealing", "Visiting"],
      description: [
        "Each Night the Photographer can take a picture of a player during the night.",
        "The role of the photographed player will be revealed to everyone the next day.",
      ],
    },
    Impersonator: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Deception", "No Investigate"],
      description: [
        "Chooses a role each night to imitate.",
        "Can not be seen as a Villager, Impersonator or Imposter",
      ],
    },
    Vegan: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Revealing", "Selective Revealing", "Visiting"],
      description: [
        "Chooses a player each night to reveal their identity as Vegan.",
      ],
    },
    Oracle: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Revealing", "Sacrificial", "Visiting"],
      description: [
        "Visits one player each night whose role will be revealed upon death.",
      ],
    },
    Penguin: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Information", "Items", "Visits", "Visiting"],
      description: [
        "Each night, waddles up to someone to tell them a secret.",
        "The secret will be about Visits, Visitors, or Items.",
      ],
    },
    "Robin Hood": {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Items", "Visiting"],
      description: [
        "Chooses one player to steal from each night and another player to receive their items.",
        "If the player chosen to receive an item is mafia, the steal will not go through.",
      ],
    },
    Visitor: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Visiting"],
      description: [
        "Pays a visit to another player at night.",
        "Annoyingly, this visit has no effect.",
        "Town roles with the Scatterbrained modifier appear as this role to self.",
      ],
    },
    Waitress: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Night-acting", "Items", "Visiting"],
      description: ["Chooses a player to steal an item from each night."],
    },
    "Drama Queen": {
      alignment: "Village",
      tags: ["Night-acting", "Visiting"],
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
      category: "Sacrificial",
      tags: ["Sacrificial", "Items", "Conversion", "Role Swapping"],
      description: [
        "If killed, the kill receives a can of shaving cream.",
        "While holding the shaving cream, a Mafia or Cult-aligned player may swap the roles of two living players.",
        "Excluding players who started as Independent, the swapped players will keep their original alignments.",
      ],
    },
    Butterfly: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Sacrificial", "Conversion"],
      description: [
        "When they die all players are reset to the role they had at the start of the game.",
      ],
    },
    Gatekeeper: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Sacrificial", "Events"],
      description: [
        "When the Gatekeeper is dead, Banished Events will Occur in addition to normal Events.",
      ],
    },
    Hunter: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Sacrificial", "Killing", "Dusk", "Day Killer"],
      description: [
        "Chooses a player to kill when condemned by town during the day.",
      ],
    },
    Lightkeeper: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Sacrificial", "Voting", "Speech", "Eclipse"],
      description: [
        "Following their death, causes an eclipse during the day. During an eclipse, all speech and votes are anonymous.",
      ],
    },
    Schoolmarm: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Sacrificial", "Conversion", "Villager"],
      description: [
        "If killed, all Village-aligned players convert to Villager.",
      ],
      RolesMadeBy: ["Villager"],
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
      tags: ["Sacrificial", "Killing", "Setup Changes", "Self Kill"],
      description: [
        "If one Sheep dies, all Sheep die.",
        "Adds 1 Sheep in Closed setups",
      ],
    },
    Turncoat: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Sacrificial", "Conversion", "Traitor"],
      description: [
        "When killed by the Mafia, will turn into a Traitor instead.",
      ],
      RolesMadeBy: ["Traitor"],
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
      SpecialInteractions: {
        Hooker: [
          "If a Hooker blocks a Virgin, The Virgin is converted to Villager.",
        ],
      },
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
      category: "Voting",
      tags: ["Voting", "Visiting"],
      description: [
        "Each night chooses a player to be their Master.",
        "A Butler's Vote only counts if they vote the same Target as their Master.",
      ],
    },
    Governor: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Condemn", "Overturn", "Dusk"],
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
      description: ["Vote weight is worth 10000 votes in day meeting."],
    },
    Kingmaker: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Items", "Visiting"],
      description: [
        "Gives out a sceptre each night.",
        "Sceptres give a player +10000 votes in day meeting.",
      ],
    },
    Magistrate: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Condemn", "Condemn Immune", "Visiting"],
      description: [
        "Every night, chooses one player and prevents them from voting and from being voted.",
        "Cannot place themselves under house arrest.",
      ],
    },
    Jazzman: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Condemn", "Delirium", "Alignment"],
      description: [
        "If an Evil player is condemned, All players are Delirious that night.",
      ],
      SpecialInteractions: {
        Assassin: [
          "If an Assassin is Present, All players are Delirious if an Evil Player is Elected as Room Leader.",
        ],
      },
    },
    Princess: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Condemn", "Overturn", "Alignment"],
      description: [
        "If the first player to vote for a Princess appears as Village-aligned, The day ends and that player is condemned.",
        "If the first player to vote for a Princess does not appear as Village-aligned, nothing happens.",
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
      category: "Manipulative",
      tags: ["Manipulative", "Setup Change", "Delirium", "Banished"],
      description: [
        "Sees self as a random non-Banished Village role from the setup.",
        "Has that role's abilities but is permanently Delirious.",
        "Items used by a Braggart will be broken.",
      ],
    },
    Coward: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Manipulative", "Redirection", "Reflexive", "Visiting"],
      description: [
        "Each night, chooses a player.",
        "Anyone who visits the Coward will be redirect to the choosen player.",
      ],
    },
    Chauffeur: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Manipulative", "Redirection", "Visiting"],
      description: [
        "Chooses two players, A and B, each night.",
        "Players who visit A will be redirected to B.",
        "Players who visit B will be redirected to A.",
        "Redirection cannot be role blocked.",
      ],
    },
    Televangelist: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Manipulative", "Setup Change", "Delirium", "Cult"],
      description: [
        "Sees self as a random Demonic Cult role from the setup.",
        "Can use fake versions of that roles abilities.",
        "Will attend a Fake Cult Meeting with the non-Demonic Cult roles.",
        "Cult players will learn who the Televangelist selects at night.",
      ],
    },
    Monkey: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Manipulative", "Copy Actions", "Dusk", "Pregame Actions"],
      description: [
        "Before each Night chooses a player.",
        "Copies the actions of the choosen player at night.",
      ],
    },
    Philosopher: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Manipulative", "Conversion", "Delirium"],
      description: [
        "At night may choose to convert to a Village aligned role that can spawn in the setup.",
        "If the selected role is already in play, The player with that role will be Delirious until the Philosopher is killed.",
      ],
    },
    Student: {
      alignment: "Village",
      disabled: true,
      category: "Manipulative",
      tags: ["Conversion"],
      description: [
        "Is Assigned a Village Aligned Role that is currently in the game.",
        "If that role is killed or Converted, The Student becomes that role.",
        "Village Roles with the (BackUp) Modifier become this role with Original Role as the Target.",
      ],
      SpecialInteractions: {
        Assassin: [
          "If an Assassin is Present, Students' with a President Target will not become President If the Assassin kills the President .",
        ],
      },
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
      tags: ["Meeting", "Food", "Items", "Visiting"],
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
      tags: ["Meeting", "Conversion", "Alignment", "Visiting"],
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
      tags: ["Meeting", "Setup Changes"],
      description: [
        "Shares a night meeting with other Templars.",
        "Adds 1 Templar in closed setups.",
      ],
    },
    //reflexive roles
    Apothecary: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Protective", "Malicious Effects", "Role Share"],
      description: [
        "When visited, heals and cleanses all effects currently possessed by the visiting player.",
        "Players who Role Share with an Apothecary are Cleansed.",
      ],
    },
    Dreamer: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Investigative", "Alignment"],
      description: [
        "Dreams about 3 players, at least one of whom is Evil; or about 1 player who is Village aligned.",
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
      category: "Killing",
      tags: ["Killing", "Information", "Roles", "Visiting", "Self Kill"],
      description: [
        "Each night must choose a player and role from the Setup.",
        "If the selected role is not the player's role, The Debtor dies.",
      ],
    },
    Firebrand: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Gasoline", "Visiting", "Day Killer"],
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
      SpecialInteractions: {
        Hellhound: ["A Hellhound can kill a Granny at Night."],
      },
    },
    Jailer: {
      alignment: "Village",
      category: "Killing",
      tags: [
        "Killing",
        "Meeting",
        "Role Blocker",
        "Condemn",
        "Dusk",
        "Night Killer",
      ],
      description: [
        "If no one was condemned, chooses a player to jail after each day meeting.",
        "Meets with the prisoner at night and the prisoner cannot perform actions or attend other meetings or be targeted.",
        "Decides whether or not the prisoner should be executed.",
      ],
    },
    Seeker: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Setup Change", "Hide and Seek", "Visiting"],
      description: [
        "Attempts to guess the identity of the Hider or Invader each night.",
        "Kills the Hider/Invader if guess is correct.",
        "Forces a Hider or Invader to Spawn in closed Setups.",
      ],
      RolesMadeBy: ["Hider", "Invader"],
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
      tags: ["Killing", "Visits", "Visiting"],
      description: [
        "Each night, visits one player and kills one of their visitors.",
        "Preferentially kills Mafia, Cult, Independents, then Villagers.",
        "Other visitors will learn the identity of the Trapper.",
      ],
    },
    Vigilante: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Visiting", "Night Killer"],
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
    Admiral: {
      alignment: "Village",
      tags: ["Setup Changes", "Exposed", "Treasure Chest", "Voting"],
      description: [
        "If an Admiral is present, all players start as Grouch. The Admiral is revealed and their vote is worth 10000.",
        "Starting with the Admiral, players will Pass a Chest containing Village/Independent Roles and 15 Gold to their lower neighbor.",
        "When a player is passed the Chest they may steal gold or become a role in the chest. Players who steal Gold become Mafia or Cult roles.",
        "The Admiral must steal 1-5 Gold but will not become mafia or Cult.",
        "The Player directly below the Admiral can Choose to become an Excess Role, while the Player directly above the Admiral can choose to become Grouch.",
        "If 2 or more non-evil roles are condemned, All village aligned players die.",
      ],
      RolesMadeBy: ["Grouch"],
    },
    Benandante: {
      alignment: "Village",
      category: "Essential",
      tags: ["Essential", "Graveyard", "Alignment", "Sacrificial"],
      description: [
        "When a Benandante dies, They choose a player during the day.",
        "If that player is not Village aligned, All Village Aligned players die.",
      ],
      graveyardParticipation: "self",
    },
    Broker: {
      alignment: "Village",
      category: "Essential",
      tags: ["Essential", "Win Con"],
      description: [
        "When the game ends, Swaps the Winners and Losers.",
        "If Roleblocked/made Delirious will not Switch the Winners that night and the following day.",
        "If Multiple Brokers are in a game, The Winners and Losers can swapped Multiple Times.",
      ],
    },
    President: {
      alignment: "Village",
      category: "Essential",
      tags: ["Essential", "Selective Revealing", "Exposed"],
      description: [
        "All villagers will know who the President is.",
        "When the President dies, the Mafia will win.",
      ],
      SpecialInteractions: {
        Assassin: [
          "If an Assassin is Present, Village Aligned Players will not learn who the President is.",
        ],
      },
    },
    Saint: {
      alignment: "Village",
      category: "Essential",
      tags: ["Essential", "Condemn", "Sacrificial"],
      description: [
        "When a Saint is condemned, all Village-aligned players die.",
      ],
    },
    Seer: {
      alignment: "Village",
      category: "Essential",
      tags: [
        "Essential",
        "Selective Revealing",
        "Information",
        "Condemn",
        "Dusk",
      ],
      description: [
        "Knows all of the Mafia and Cult at the start of the game.",
        "When condemned, Mafia and Cult have a chance to guess who the Seer is.",
        "On a correct guess, the Seer dies and the Mafia or Cult wins.",
        "Appears as villager on death.",
      ],
    },
    Mole: {
      alignment: "Village",
      category: "Essential",
      tags: ["Essential", "Information", "Mafia"],
      description: [
        "Has a Mafia or Cult role and Counts Torwards Mafia/Cult Majority.",
        "At night mafia can guess who the Mole is Once per game even if dead.",
        "On a correct guess, Mafia or Cult wins.",
      ],
      graveyardParticipation: "All",
    },
    Senator: {
      alignment: "Village",
      category: "Essential",
      tags: ["Essential", "Setup Changes"],
      description: [
        "If half or more the number of Senators in play die, Mafia wins.",
        "Adds 2 to 4 Senators in closed setups.",
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
    "Vice President": {
      alignment: "Village",
      tags: ["President", "Essential", "Setup Changes", "Role Sharing"],
      description: [
        "Must role share with any Presidents, Senators, and Linchpin Village roles in the game.",
        "The Vice President's team cannot win if they fail to role share with required roles.",
        "Adds a President in Closed Setups",
      ],
      RolesMadeBy: ["President"],
    },
    Mayor: {
      alignment: "Village",
      category: "Essential",
      tags: ["Essential", "Win Con", "Condemn"],
      description: [
        "At the end of the day, if exactly three players are alive and no player was executed today, the game ends and the Mayor's team wins.",
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
        "When the Mistress opens the Door all players will learn that the Mistress opened the door.",
        "When the door is opened, the Mistress will learn an evil player.",
        "After the Door was opened, The Mistress will Die the at night unless visited by a town-aligned player at night.",
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
      tags: ["Villager", "Basic", "Deception", "No Investigate"],
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
      tags: ["Killing", "Basic", "Gun", "Items", "Day Killer"],
      description: [
        "Starts with a gun.",
        "Gun does not reveal identity when fired.",
      ],
    },
    //killing roles
    Arsonist: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Gasoline", "Visiting", "Day Killer"],
      description: [
        "Douses one player with Gasoline each night.",
        "Chooses to light a match during the day to burn doused players to ashes.",
      ],
    },
    Caporegime: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Visits", "Extra Night Deaths", "Visiting"],
      description: [
        "Gives the kiss of death to someone each night.",
        "Target will die if visited by a non-Mafia player that night.",
      ],
    },
    Hider: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Setup Change", "Hide and Seek", "Visiting"],
      description: [
        "Attempts to guess the identity of the Seeker or Invader each night.",
        "Kills the Seeker/Invader if guess is correct.",
        "Forces a Seeker or Invader to Spawn in closed Setups.",
      ],
      RolesMadeBy: ["Seeker", "Invader"],
    },
    Hitman: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Extra Night Deaths", "Visiting", "Night Killer"],
      description: ["Kills one player each night."],
    },
    Jinx: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Word Kill", "Visiting"],
      description: [
        "Curses a player with a forbidden word each night.",
        "If the player speaks the word the next day, they will die.",
      ],
    },
    Poisoner: {
      alignment: "Mafia",
      category: "Killing",
      tags: [
        "Killing",
        "Poison",
        "Malicious Effects",
        "Visiting",
        "Night Killer",
      ],
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
      tags: ["Killing", "Extra Night Deaths", "Visits", "Visiting"],
      description: [
        "Each night, visits one player and kills one of their visitors.",
        "Other visitors will learn the identity of the Rottweiler.",
      ],
    },
    Terrorist: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Sacrificial", "Day Killer"],
      description: [
        "Once per game, can rush at another player during the day, killing them both.",
      ],
    },
    //investigative roles
    Actress: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Investigative", "Roles", "Deception", "Suits", "Visiting"],
      description: [
        "Visits a player to appears as their role.",
        "Learns chosen player's role.",
      ],
    },
    Bondsman: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Investigative", "Roles", "Visiting"],
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
      tags: ["Investigative", "Reports", "Visiting"],
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
      tags: ["Investigative", "Visits", "Visiting"],
      description: [
        "Tracks a player each night and learns if they visited anybody.",
      ],
    },
    Revisionist: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Investigative", "Reports", "Dead", "Visiting"],
      description: [
        "Each night, visits one dead player.",
        "Will receive all system messages the player ever received.",
      ],
    },
    Scout: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Investigative", "Visits", "Visiting"],
      description: ["Tracks a player each night and learns who they visited."],
    },
    Stalker: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Investigative", "Roles", "Visiting"],
      description: ["Stalks one player each night and learns their role."],
    },
    //unsorted
    Hooker: {
      alignment: "Mafia",
      tags: ["Role Blocker", "Night-acting", "Visiting"],
      description: [
        "Visits one player each night and blocks them from performing any night actions.",
        "Some actions cannot be blocked.",
      ],
    },
    Don: {
      alignment: "Mafia",
      tags: ["Voting", "Condemn", "Overturn", "Dusk"],
      description: [
        "Overrides village condemnation once per game.",
        "Cannot cancel a village condemnation on a Mafia-aligned player.",
        "Choosing no one or the original target preserves the Don's override ability.",
      ],
    },
    Driver: {
      alignment: "Mafia",
      tags: ["Manipulative", "Redirection", "Visiting"],
      description: [
        "Chooses two players, A and B, each night.",
        "Players who visit A will be redirected to B.",
        "Players who visit B will be redirected to A.",
        "Redirection cannot be roleblocked.",
        "Dies if visited by Drunk.",
      ],
      SpecialInteractions: {
        Drunk: ["If a Drunk blocks a Driver, The Driver dies."],
      },
    },
    Gondolier: {
      alignment: "Mafia",
      tags: ["Manipulative", "Redirection", "Control", "Visiting"],
      description: [
        "Chooses one player to control.",
        "Chooses who that player will perform their actions on. (Not a Visit)",
        "Redirection cannot be role blocked.",
      ],
    },
    Snitch: {
      alignment: "Mafia",
      tags: ["Manipulative", "Redirection", "Visiting"],
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
        "Does not trigger any when visited abilites on the target.",
        "Kills bomb without setting off the explosion.",
      ],
    },
    Vizier: {
      alignment: "Mafia",
      tags: ["Garbage", "Voting", "Items"],
      description: [
        "While alive, the Mafia's kill is replaced with a Coronation meeting.",
        "One player is picked to be King for the next day. Their vote worth 10000 votes.",
        "The Vizier cannot pick the same player to be King twice in a row.",
        "Upon death, the Mafia reverts to killing.",
      ],
    },
    Santista: {
      alignment: "Mafia",
      tags: ["Meeting", "Conversion", "Alignment", "Visiting"],
      description: [
        "Shares a night meeting with the Freemasons.",
        "Can convert players to Freemasons.",
      ],
      RolesMadeBy: ["Freemason"],
    },
    Lawyer: {
      alignment: "Mafia",
      tags: ["Deception", "Alignment", "Visiting"],
      description: [
        "Chooses a player each night and flips their alignment to investigative roles.",
      ],
    },
    Framer: {
      alignment: "Mafia",
      tags: ["Deception", "Vists", "Visiting"],
      description: [
        "At night chooses two players, The 1st Player will appear to visit the 2nd Player to Investigative Roles.",
        "The Framer will not visit the 2nd Player.",
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
      tags: ["Clean Condemn", "Information", "Roles", "Dead", "Dusk"],
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
      tags: ["Night-acting", "Dead", "Graveyard", "Exorcise", "Visiting"],
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
      tags: ["Gifting", "Killing", "Items", "Gun", "Tommy", "Visiting"],
      description: [
        "Gives out a tommy gun each night.",
        "Tommy gun will only kill the target if aligned with the shooter.",
        "The gunned player will not know the gun is a tommy gun.",
      ],
    },
    Tailor: {
      alignment: "Mafia",
      tags: ["Gifting", "Deception", "Items", "Suits", "Visiting"],
      description: [
        "Gives out a suit each night that disguises the wearer's role identity.",
        "Suits can be selected from any role within the current game.",
      ],
    },
    Fabricator: {
      alignment: "Mafia",
      tags: ["Gifting", "Broken", "Items", "Visiting", "Dawn"],
      description: [
        "Gives out a cursed item once per night.",
        "Cursed Guns and Knives will backfire against the player who used them.",
        "Cursed Armor, Crystal balls, and Whiskey will be ineffective.",
      ],
    },
    Saboteur: {
      alignment: "Mafia",
      tags: ["Broken", "Items", "Visiting"],
      description: ["Once per night, sabotages the target's item(s)."],
    },
    Heartbreaker: {
      alignment: "Mafia",
      tags: ["Linked", "Lover", "Visiting"],
      description: [
        "Falls in love with another player once per game.",
        "Both players will die if Heartbreaker dies.",
      ],
    },
    Yakuza: {
      alignment: "Mafia",
      tags: ["Conversion", "Sacrificial", "Visiting"],
      description: [
        "Chooses to sacrifice self once per game to convert another player to Mafioso.",
      ],
      RolesMadeBy: ["Mafioso"],
    },
    Graverobber: {
      alignment: "Mafia",
      tags: ["Revive", "Protective", "Graveyard", "Visiting"],
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
      tags: ["Killing", "Gun", "Items", "Deception", "Day Killer"],
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
      tags: ["Killing", "Voting", "Vote Kills", "Visiting"],
      description: [
        "Chooses a victim and a target each night.",
        "If the victim votes for the target in the village meeting the following day, the victim will die.",
      ],
    },
    Trespasser: {
      alignment: "Mafia",
      tags: ["Night-Acting", "Visiting"],
      description: [
        "Chooses to trespass on another player's property at night.",
        "Annoyingly, this visit has no effect.",
        "Mafia roles with the Scatterbrained modifier appear as this role to self.",
      ],
    },
    Thief: {
      alignment: "Mafia",
      tags: ["Items", "Night-Acting", "Visiting"],
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
      tags: [
        "Meeting",
        "Killing",
        "Condemn",
        "Role Blocker",
        "Dusk",
        "Night Killer",
      ],
      description: [
        "If no one was condemned, chooses a player to jail after each day meeting.",
        "Meets with the prisoner at night and the prisoner cannot perform actions or attend other meetings or be targeted.",
        "Decides whether or not the prisoner should be executed.",
      ],
    },
    Bookie: {
      alignment: "Mafia",
      tags: ["Killing", "Condemn", "Voting", "Extra Night Deaths", "Visiting"],
      description: [
        "Each night, predicts the village vote.",
        "If they successfully predict the village vote, they gain a bonus kill.",
      ],
      SpecialInteractions: {
        Assassin: [
          "If an Assassin is Present, Bookie will gain a bonus kill if they can guess a player who is Elected as Room Leader.",
        ],
      },
    },
    Ape: {
      alignment: "Mafia",
      tags: ["Manipulative", "Copy Actions", "Dusk", "Pregame Actions"],
      description: [
        "Before each Night chooses a player.",
        "Copies the actions of the choosen player at night.",
      ],
    },
    Associate: {
      alignment: "Mafia",
      category: "Manipulative",
      tags: ["Manipulative", "Conversion", "Delirium"],
      description: [
        "At night may choose to convert to a Mafia aligned role that can spawn in the setup.",
        "If the selected role is already in play, The player with that role will be Delirious until the Associate is killed.",
        "Does not attend the mafia meeting.",
      ],
    },
    Apprentice: {
      alignment: "Mafia",
      tags: ["Conversion", "Dead"],
      description: [
        "Chooses to become the role of a dead Mafia-aligned player once per game.",
      ],
    },
    Understudy: {
      alignment: "Mafia",
      disabled: true,
      category: "Manipulative",
      tags: ["Conversion"],
      description: [
        "Is Assigned a Mafia Aligned Role that is currently in the game.",
        "If that role is killed or Converted, The Understudy becomes that role.",
        "Mafia Roles with the (BackUp) Modifier become this role with Original Role as the Target.",
      ],
      SpecialInteractions: {
        Assassin: [
          "If an Assassin is Present, Understudies with an Assassin Target will not become Assassin If the Assassin dies to their Ability.",
        ],
      },
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
      tags: ["Speech", "Deafean", "Visiting"],
      description: [
        "Serenades a player each night, causing them to be unable to hear anything the next day.",
      ],
    },
    Silencer: {
      alignment: "Mafia",
      tags: ["Speech", "Silence", "Visiting"],
      description: [
        "Can silence someone each night, causing them to be unable to speak the next day.",
      ],
    },
    Scrambler: {
      alignment: "Mafia",
      tags: ["Speech", "Clueless", "Random Messages", "Visiting"],
      description: [
        "Scrambles a player each night, causing them to see messages from random players the next day.",
      ],
    },
    Paparazzo: {
      alignment: "Mafia",
      tags: ["Condemn", "Revealing", "Sacrificial", "Dusk"],
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
    Weatherman: {
      alignment: "Mafia",
      tags: ["Events"],
      description: [
        "At Night can Choose an Event.",
        "That Event will Occur in addition to any other events.",
      ],
    },
    Toreador: {
      alignment: "Mafia",
      tags: ["Manipulative", "Redirection", "Control", "Visiting"],
      description: ["Each night, attracts a player to visit them."],
    },
    Blinder: {
      alignment: "Mafia",
      tags: ["Speech", "Blind", "Visiting"],
      description: [
        "Each night, blinds a player.",
        "Blinded players are unable to see the names of players typing the next day.",
      ],
    },
    Quack: {
      alignment: "Mafia",
      tags: ["Protective", "Night Saver", "Visiting"],
      description: ["Saves another player from dying each night."],
    },
    Homeopath: {
      alignment: "Mafia",
      tags: ["Protective", "Malicious Effects", "Visiting"],
      description: [
        "Visits one player each night and cleanses them of malicious effects.",
        "Malicious effects include poison, bleeding, insanity, and polarization.",
      ],
    },
    Dealer: {
      alignment: "Mafia",
      category: "Reflexive",
      tags: ["Reflexive", "Protective", "Malicious Effects", "Role Share"],
      description: [
        "When visited, heals and cleanses all effects currently possessed by the visiting player.",
        "Players who Role Share with a Dealer are Cleansed.",
      ],
    },
    Diplomat: {
      alignment: "Mafia",
      tags: ["Condemn", "Protective", "Condemn Immune", "Visiting"],
      description: [
        "Each night chooses a player to be safe from being Condemned.",
        "Cannot choose the player they protected the previous night",
      ],
    },
    Enforcer: {
      alignment: "Mafia",
      tags: [
        "Convert Saver",
        "Protective",
        "Conversion",
        "Traitor",
        "Visiting",
      ],
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
      tags: ["Night-acting", "Role Blocker", "Visits", "Visiting"],
      description: ["Each night, protects one player from all visits."],
    },
    Plumber: {
      alignment: "Mafia",
      tags: ["Whispers", "Speech", "Visiting"],
      description: [
        "Every night, can block all sent and received whispers of the target.",
      ],
    },
    Gossiper: {
      alignment: "Mafia",
      tags: ["Whispers", "Speech", "Visiting"],
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
    Lobotomist: {
      alignment: "Mafia",
      tags: ["Night-acting", "Conversion", "Vanilla", "Visiting"],
      description: [
        "Each night, visits one player.",
        "Village roles convert to Villager. Cult roles convert to Cultist. Independent roles convert to Grouch.",
      ],
      RolesMadeBy: ["Villager", "Cultist", "Grouch"],
    },
    Nun: {
      alignment: "Mafia",
      category: "Night-acting",
      tags: ["Night-acting", "Modifiers", "Conversion", "Visiting"],
      description: ["Removes modifiers from other players at night"],
    },
    Pedagogue: {
      alignment: "Mafia",
      tags: ["Night-acting", "Conversion", "Random", "Visiting"],
      description: [
        "Each night, converts another Mafia teammate into a random Mafia-aligned role.",
      ],
      RolesMadeBy: ["All Mafia Roles"],
    },
    Bartender: {
      alignment: "Mafia",
      tags: [
        "Night-acting",
        "Effects",
        "Alcoholics",
        "Role Blocker",
        "Visiting",
      ],
      description: [
        "Each night, serves a non-Mafia player and turns them into an Alcoholic.",
        "Alcoholics retain their original roles, but they unknowingly roleblock a random non-Mafia player during the night.",
        "If an Alcoholic player visits an Apothecary, they are cured.",
      ],
    },
    Rat: {
      alignment: "Mafia",
      tags: ["Manipulative", "Redirection", "Reflexive", "Visiting"],
      description: [
        "Each night, chooses a player.",
        "Anyone who visits the Rat will be redirect to the choosen player.",
      ],
    },
    Cannoneer: {
      alignment: "Mafia",
      tags: ["Killing", "Meeting", "Gun", "Items", "Day Killer"],
      description: [
        "Will gain a gun once per game if Mafia chose to abstain from killing the previous night.",
        "Gun will always reveal the shooter.",
      ],
    },
    Imposter: {
      alignment: "Mafia",
      tags: ["Deception", "Night-acting", "No Investigate"],
      description: [
        "Chooses a role each night to imitate.",
        "Can not be seen as a Villager, Impersonator or Imposter",
      ],
    },
    Assassin: {
      alignment: "Mafia",
      tags: [
        "Mini-game",
        "Essential",
        "Split Decision",
        "Killing",
        "Setup Changes",
        "Dusk",
        "Pregame Actions",
        "Dawn",
      ],
      description: [
        "Splits all players into two rooms.",
        "During the Day, each room meets and choose a city leader. In turn, at Night city leaders meet and choose players to switch rooms.",
        "After three rounds of switching, the Assassin will kill all players who are in the same room as them.",
        "The presence of an Assassin will force a President to spawn in the setup (unless Senators are present). Village-aligned players will not learn who the President is.",
        "Village wins if an Assassin dies before a President or majority of the Senators die.",
        "Mafia will not win by majority if an Assassin is present.",
      ],
      RolesMadeBy: ["President"],
    },
    Stylist: {
      alignment: "Mafia",
      tags: ["Mini-game", "Essential", "Style Points", "Win-Con"],
      description: [
        "At the end of each day, Any Living Mafia players will gain 1 Style Point for everytime they said their role in chat.",
        "Style Points cannot be earned if only 1 Mafia player is alive.",
        "At the end of the game reguardless of who Won, The player with the most Style Points will also Win.",
      ],
    },
    Prankster: {
      alignment: "Mafia",
      category: "Gaming",
      tags: ["Voting", "Conversion"],
      description: ["The first player to vote the Prankster becomes Fool."],
      RolesMadeBy: ["Fool"],
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
      tags: ["Conversion", "Kills Cultist", "Visiting"],
      description: [
        "Converts one player into a Cultist each night.",
        "All Cultists die if the Cult Leader dies.",
      ],
      RolesMadeBy: ["Cultist"],
    },
    Doomsayer: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Kills Cultist", "Reflexive", "Role Share"],
      description: [
        "Converts all players who visit during the night.",
        "Converts all players who Role Share with the Doomsayer.",
        "All Cultists die if the Doomsayer dies.",
      ],
      RolesMadeBy: ["Cultist"],
    },
    Zombie: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Visiting"],
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
      tags: ["Conversion", "Messages", "Visiting"],
      description: [
        "Engraves a forbidden word on a player each night.",
        "If the player speaks the word the next day, they will convert to Cultist.",
      ],
      RolesMadeBy: ["Cultist"],
    },
    Inquisitor: {
      alignment: "Cult",
      category: "Conversion",
      tags: [
        "Conversion",
        "Kills Cultist",
        "Killing",
        "Visiting",
        "Day Killer",
      ],
      description: [
        "Kills a player each night.",
        "If the victim is night-saved, they will convert to Cultist.",
      ],
      RolesMadeBy: ["Cultist"],
    },
    Invader: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Setup Changes", "Hide and Seek", "Visiting"],
      description: [
        "Attempts to guess the identities of the Hider or Seeker each night.",
        "Converts the Hider/Seeker to Cultist if guess is correct.",
        "Forces a Hider or Seeker to Spawn in closed Setups.",
      ],
      RolesMadeBy: ["Cultist", "Hider", "Seeker"],
    },
    "Witch Doctor": {
      alignment: "Cult",
      category: "Conversion",
      tags: [
        "Conversion",
        "Kills Cultist",
        "Protective",
        "Night Saver",
        "Visiting",
      ],
      description: [
        "Chooses a player each night.",
        "If that player was targeted by a kiling role, that player is saved and converts to Cultist.",
        "All Cultists die if the Witch Doctor dies.",
      ],
      RolesMadeBy: ["Cultist"],
    },
    //Killing
    Diabolist: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Vote Kills", "Killing", "Voting", "Visiting"],
      description: [
        "Chooses a victim and a target each night.",
        "If the victim votes for the target in the village meeting the following day, the victim will die.",
      ],
    },
    Harpy: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Killing", "Voting", "Visiting"],
      description: [
        "Chooses a victim and a target each night.",
        "If the victim doesn't get 1/3 of living players to vote for the Target, the Victim, Target, or Both will die.",
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
      tags: ["Killing", "Blood", "Extra Lives", "Visiting"],
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
        "Visiting",
      ],
      description: [
        "Adds or Removes 1 Banished Role in Closed Setups.",
        "If a player with a Banished Role dies during the Day, May kill a player at night.",
        "Learns what Banished Roles are in the Current Game.",
      ],
    },
    Werewolf: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Killing", "Lycan", "Effect", "Full Moons", "Visiting"],
      description: [
        "When a Werewolf is present in the game, full moons will occur on even nights.",
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
      description: [
        "Each day, a random non-Cult player is told a role.",
        "That player must say the name of the role the following day or the vote will be overturned onto them.",
        "During the day a Banshee may guess who their target is. If they guess correctly, the day ends and that player is condemned.",
      ],
    },
    Baphomet: {
      alignment: "Cult",
      category: "Speaking",
      tags: ["Meeting", "Setup Changes"],
      description: [
        "Meets with both the Cult and the Templars.",
        "Adds 1 Templar in Closed setups.",
      ],
      RolesMadeBy: ["Templar"],
    },
    Cthulhu: {
      alignment: "Cult",
      category: "Speaking",
      tags: ["Speaking", "Insanity", "Reflexive"],
      description: [
        "All players who visit Cthulhu go insane.",
        "All players who Role Share with Cthulhu go insane.",
        "Insane players speak gibberish for the rest of the game.",
      ],
    },
    Fungoid: {
      alignment: "Cult",
      category: "Speaking",
      tags: [
        "Speaking",
        "Speech",
        "Silence",
        "Blind",
        "Clueless",
        "Deafen",
        "Visiting",
      ],
      description: [
        "Can choose between four fungi to cast at night.",
        "Thrush, which silences the target.",
        "Aspergillus, which deafens the target.",
        "Cataracts, which blinds the target.",
        "Hallucinogens, which scrambles the target.",
        "Once a fungus has been used, it cannot be spored again for the next two nights.",
      ],
    },
    Parasite: {
      alignment: "Cult",
      category: "Speaking",
      tags: [
        "Speaking",
        "Speech",
        "Manipulative",
        "Redirection",
        "Control",
        "Graveyard",
        "Visiting",
      ],
      description: [
        "Chooses a player to Infest on their first night and Dies.",
        "Will count torwards Cult Majority when dead.",
        "Can Speak as the Infested player",
        "Can Control the Infested players actions at night.",
        "If the Infested player dies the Parasite is Exorcised.",
      ],
      graveyardParticipation: "self",
    },
    Psion: {
      alignment: "Cult",
      category: "Speaking",
      tags: ["Speaking", "Insanity", "Visits", "Visiting"],
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
      tags: [
        "Night-acting",
        "Conversion",
        "Random",
        "Exorcise Village Meeting",
        "Visiting",
      ],
      description: [
        "Each night, converts another Cult teammate into a random Cult-aligned role.",
      ],
      RolesMadeBy: ["All Cult Roles"],
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
        "Visiting",
      ],
      description: [
        "Each night chooses a player and a role.",
        "That player is converted to that role but their Alignment will not change.",
        "If the selected role is already in play, The conversion fails.",
        "Independant roles can only be converted to other Independant roles.",
      ],
    },
    Incubus: {
      alignment: "Cult",
      category: "Manipulative",
      tags: [
        "Night-acting",
        "Conversion",
        "Roles",
        "Manipulative",
        "Visiting",
        "Effect",
      ],
      description: [
        "Each night chooses a player and a non-Demonic Cult role.",
        "When that player dies they will be converted to that role and become Transcendent.",
      ],
      graveyardParticipation: "all",
    },
    "Queen Bee": {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Delayed", "Visiting"],
      description: [
        "Every night, visits a player and covers them with sticky honey.",
        "Delays their action by one day/night cycle.",
      ],
    },
    Selkie: {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Redirection", "Control", "Visiting"],
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
      tags: ["Manipulative", "Delirium", "Visiting"],
      description: [
        "Visits one player each night and makes them Delirious",
        "Delirious players get False Info and have other abilites disabled.",
      ],
    },
    Witch: {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Redirection", "Control", "Visiting"],
      description: [
        "Chooses one player to control.",
        "Chooses who that player will perform their actions on. (Not a Visit)",
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
        "Visiting",
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
      description: [
        "Will be Twins with an Opposing player.",
        "The Twins will learn eachothers roles.",
        "If the Village-aligned Twin is Condemned, Cult Wins.",
      ],
    },
    Reaper: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Win Con", "Information", "Condemn"],
      description: [
        'If a Reaper says "I claim Reaper and choose (Player Name)" within the first minute of the day. The Choose player will be Reaped.',
        "If the Reaped player survives until the end of the day, Their team wins.",
        "A Reaper cannot Reap themselves.",
      ],
    },
    Devotee: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Conversion", "Essential"],
      description: [
        "If a Demonic or Lichpin Cult role dies, the Devotee will convert to that role.",
        "Cult Roles with the (BackUp) Modifier become this role with Original Role as the Target.",
        "If the Target role is killed or Converted, The Devotee becomes that role.",
      ],
    },
    Zealot: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Win Con", "Essential", "Voting", "Condemn"],
      description: [
        "If a Demonic or Lichpin Cult role is condemned and the game would have ended, the game will continue for 1 more day.",
        "On the extra Day, If a Village Aligned player is condemned, Cult Wins.",
        "If no one is condemned or a Non-Village player is condemned on the extra day, All Cult-aligned players die.",
      ],
    },
    Gremlin: {
      alignment: "Cult",
      category: "Chaos",
      tags: [
        "Conversion",
        "Items",
        "Cult Items",
        "Insanity",
        "Magic",
        "Visiting",
        "Dawn",
      ],
      description: [
        "Once per night, corrupts the target's item(s) into magic items that benefit the Cult.",
        "Guns, Rifles, and Knives will convert instead of killing.",
        "Armor will make an Attacker Insane.",
        "Tracts will convert a player to a random Cult role if converted.",
        "Crystal Balls will reveal players as Cultist.",
        "Syringes will resurrect players as Cultist.",
        "Candles and Falcons will provide False Info.",
        "Coffee will make the extra actions into conversions.",
        "Whiskey will make Non-Cult Players Delirious.",
        "Keys will not Block Cult.",
        "Envelope messages will be gibberish.",
        "Food Items will Poison players who eat them.",
      ],
      RolesMadeBy: ["Cultist"],
    },
    Runemaster: {
      alignment: "Cult",
      category: "Chaos",
      tags: [
        "Conversion",
        "Items",
        "Cult Items",
        "Insanity",
        "Magic",
        "Visiting",
        "Dawn",
      ],
      description: [
        "Each night gives out magic items that benefit the Cult.",
        "Guns, Rifles, and Knives will convert instead of killing.",
        "Armor will make an Attacker Insane.",
        "Tracts will convert a player to a random Cult role if converted.",
        "Crystal Balls will reveal players as Cultist.",
        "Syringes will resurrect players as Cultist.",
        "Candles and Falcons will provide False Info.",
        "Coffee will make the extra actions into conversions.",
        "Whiskey will make Non-Cult Players Delirious.",
        "Keys will not Block Cult.",
        "Envelope messages will be gibberish.",
        "Food Items will Poison players who eat them.",
      ],
      RolesMadeBy: ["Cultist"],
    },
    Haruspex: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Extra Lives", "Protective", "Sacrificial", "Visiting"],
      description: [
        "Visits two Cult-aligned players each night.",
        "The first player is killed while the second player gains an extra life.",
      ],
    },
    //Demon/Endangered
    Imp: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Killing", "Conversion", "Visiting", "Night Killer"],
      description: [
        "Each night, may choose any player to kill.",
        "If an Imp kills themself, a random Cult-aligned player becomes an Imp.",
      ],
    },
    Jiangshi: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Killing",
        "Conversion",
        "Banished",
        "Setup Changes",
        "Visiting",
        "Night Killer",
        "Self Kill",
      ],
      description: [
        "Each night, may choose a player to kill.",
        "The first time a Jiangshi chooses a player with a Banished Role, the Jiangshi dies and the Banished Player becomes a Jiangshi.",
        "Jiangshi adds 1 Banished role in closed setups.",
      ],
    },
    Necromancer: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Killing",
        "Banished",
        "Setup Changes",
        "Delirium",
        "Visiting",
        "Night Killer",
      ],
      description: [
        "Each night, may choose a player to kill.",
        "Cult players killed by a Necromancer can use their abilites when dead, and will make one of their non-banished Village-Aligned neighbors Delirious until the Necromancer dies.",
        "Necromancer removes 1 Banished role in closed setups.",
      ],
      graveyardParticipation: "all",
    },
    Nyarlathotep: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Killing",
        "Win Con",
        "Deception",
        "False Mode",
        "Visiting",
        "Night Killer",
        "No Investigate",
      ],
      description: [
        "Each night, may choose a player to kill.",
        "While alive, most information received by Village roles is made false.",
        "If no one is condemned while Nyarlathotep is alive, the Cult wins.",
      ],
    },
    Puca: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Killing", "Delirium", "Poison", "Visiting"],
      description: [
        "Each night, may choose a player to make Delirious and Poison.",
        "Player's Poisoned by a Puca will not be told they were poisoned.",
      ],
    },
    Satyr: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Killing",
        "Delirium",
        "Neighbors",
        "Banished",
        "Visiting",
        "Night Killer",
      ],
      description: [
        "Each night, may choose a player to kill.",
        "A Satyr's starting Non-banished Village-aligned neighbors are Delirious.",
      ],
    },
    Lich: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Killing",
        "Delirium",
        "Visiting",
        "Night Killer",
        "Condemn Immune",
      ],
      description: [
        "Each night, may choose a player to kill.",
        "On the first night chooses a player as a Vessel.",
        "The Vessel is Delirious.",
        "A Lich can only be killed if their Vessel is killed.",
      ],
    },
    Shoggoth: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Killing",
        "Extra Night Deaths",
        "Graveyard",
        "Revive",
        "Visiting",
        "Night Killer",
      ],
      description: [
        "Each night, may choose 2 players to kill.",
        "Players killed by shoggoth have a chance of reviving the following night.",
        "Shoggoth will only revive a player once per game.",
      ],
      graveyardParticipation: "all",
    },
    Snallygaster: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Killing", "Extra Night Deaths", "Visiting", "Night Killer"],
      description: [
        "Each night, may choose a player to kill.",
        "Can choose to charge their kill instead of killing.",
        "If a Snallygaster chooses to Charge kill, They may kill 3 players the Next Night",
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
        "Visiting",
      ],
      description: [
        "If no one is Condemned during the day, may choose a player to Kill during the night. (Even if dead)",
        "Will count torwards Cult Majority when dead.",
        "If a Poltergeist is Exorcised, All Cult-aligned players die.",
        "If it is possible for a Poltergeist to spawn in a setup, Dead players can be voted in village meeting.",
        "Condemned dead players are Exorcised.",
      ],
      graveyardParticipation: "self",
    },
    Warden: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Killing",
        "Extra Night Deaths",
        "Visiting",
        "Night Killer",
        "Dawn",
      ],
      description: [
        "Each night, may choose 3 players.",
        "Each of the selected players will choose to Live or Die.",
        "If All 3 players choose to Live they all Die.",
      ],
      graveyardParticipation: "all",
    },
    Vampire: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Killing",
        "Condemn",
        "Voting",
        "Setup Changes",
        "Visiting",
        "Night Killer",
      ],
      description: [
        "Vampire Votes only count if a Village Player votes with them.",
        "Most Players including all non-Village are Vampires",
        "Vampires will appear as random Non-Vampire evil roles on Investigations.",
        "Each Night, One Vampire will choose a player to kill.",
        "Vampires can only select Vampires for killing until 1 remains.",
        "Cult can only win when One or fewer Village players are alive.",
      ],
    },
    //Other
    Theocrat: {
      alignment: "Cult",
      tags: ["Condemn", "Protective", "Condemn Immune", "Visiting"],
      description: [
        "Each night chooses a player to be safe from being Condemned.",
        "Cannot choose the player they protected the previous night",
      ],
    },
    Count: {
      alignment: "Cult",
      tags: ["Banished", "Setup Changes"],
      description: [
        "Adds 2 Banished roles in Closed Setups.",
        "If a Count is created mid-game, 2 Village/Independant players will be converted to Banished Roles.",
      ],
    },
    Shadow: {
      alignment: "Cult",
      tags: ["Investigative", "Visits", "Visiting"],
      description: [
        "Visits a player each night.",
        "Can see who that player visits as well as everyone who visits that player.",
      ],
    },
    Druid: {
      alignment: "Cult",
      tags: ["Tree", "Graveyard", "Dead", "Revive", "Visiting"],
      description: [
        "Visits a dead player during the night.",
        "That player will be resurrected as a Tree the following day.",
      ],
      graveyardParticipation: "all",
    },
    Sorcerer: {
      alignment: "Cult",
      tags: ["Events"],
      description: [
        "At Night can Choose an Event.",
        "That Event will Occur in addition to any other events.",
      ],
    },
    Bogeyman: {
      alignment: "Cult",
      category: "Night-acting",
      tags: ["Night-acting", "Visiting"],
      description: [
        "Visits another player at night. This visit has no effect.",
        "Cult roles with the Scatterbrained modifier appear as this role to self.",
      ],
    },
    "War Demon": {
      alignment: "Cult",
      disabled: true,
      category: "Demon",
      tags: [
        "Killing",
        "Extra Night Deaths",
        "Visiting",
        "Night Killer",
        "Epic",
      ],
      description: ["Very Very Good Role."],
    },

    //Independent
    Fool: {
      alignment: "Independent",
      tags: ["Condenm", "Visiting"],
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
      tags: ["Gifting", "Items", "Gun", "Killing", "Visiting"],
      description: [
        "Wins if shot and killed with a gun.",
        "Flocks around at night, giving their target a gun.",
      ],
    },
    Joker: {
      alignment: "Independent",
      tags: ["Night Kills"],
      description: ["Wins if killed at Night."],
    },
    Amnesiac: {
      alignment: "Independent",
      tags: ["Dead", "Conversion", "Visiting"],
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
      tags: ["Conversion", "Role Swapping", "Visiting"],
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
      tags: ["Condmen", "Mafia", "Win Con", "Visiting"],
      description: [
        "Clowns around at night, visiting another player. The visit does nothing.",
        "The Mafia will be alerted that there is a Clown they must condemn in order to win.",
        "The Mafia will not win if the Clown is not Condemned.",
        "If a Clown is Killed by non-condemn method, a Mafia-Aligned player becomes Clown",
        "Wins with Mafia.",
      ],
    },
    Autocrat: {
      alignment: "Independent",
      tags: ["Village", "Win Steal"],
      description: ["Wins instead of Village and counts toward their total."],
    },
    Palladist: {
      alignment: "Independent",
      tags: ["Village", "Win Steal", "Meeting", "Conversion", "Visiting"],
      description: [
        "If there are no Freemasons, converts a player to Freemason.",
        "Anonymizes Freemason meetings and forces them to act.",
        "Immune to conversions.",
        "Wins instead of Village if there is a Freemason majority and counts toward their total.",
      ],
      RolesMadeBy: ["Freemason"],
    },
    "Panda Bear": {
      alignment: "Independent",
      tags: ["Village", "Win Steal", "Visits", "Setup Changes", "Visiting"],
      description: [
        "Walks around at night, visiting another player with no effect.",
        "When present in the game, the Village cannot win unless the Panda Bear visits another Panda Bear and they mate.",
        "Wins instead of Village if the Panda Bears survive without mating.",
        "Adds 1 Panda in Closed Setups.",
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
      tags: ["Survivor", "Lover", "Linked", "Visiting"],
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
    Fumigator: {
      alignment: "Independent",
      tags: ["Neighbors", "Death"],
      description: ["Wins if both of their starting neighbors are dead."],
      SpecialInteractions: {
        OneNightMode: [
          "In One Night Mode, Fumigator Wins if one of their neighbors is killed.",
        ],
      },
    },
    Doppelgänger: {
      alignment: "Independent",
      tags: ["Conversion", "Dusk", "Pregame Actions"],
      description: [
        "Before Night chooses a player.",
        "Will instantly convert to that player's role.",
        "Cannot win the game as Doppelgänger.",
      ],
    },
    "Vengeful Spirit": {
      alignment: "Independent",
      tags: ["Killing", "Graveyard", "Visiting"],
      description: [
        "If murdered by another player, gains the ability to kill each night from the graveyard.",
        "Does not gain the ability if condemned by village vote.",
        "Wins if they kill all of their murderers.",
      ],
      graveyardParticipation: "self",
    },
    Phantom: {
      alignment: "Independent",
      tags: ["Killing", "Conversion", "Visiting"],
      description: [
        "Chooses a player to kill once during the night and convert to their role.",
        "The killed player will have their role hidden upon death, and instead reveal as their alignment.",
        "Cannot win the game as Phantom.",
      ],
    },
    Prince: {
      alignment: "Independent",
      tags: ["Essential", "Alignment", "Visiting"],
      description: [
        "Once per game, visits a player and joins their alignment.",
        "If the Prince dies, everyone of that alignment dies.",
        "Wins if their chosen alignment wins.",
      ],
    },
    Nomad: {
      alignment: "Independent",
      tags: ["Alignments", "Visiting"],
      description: [
        "Must visit another player every night.",
        "Cannot choose the same player consecutively.",
        "Wins if they are alive when the last player they visited wins.",
      ],
    },
    Hitchhiker: {
      alignment: "Independent",
      tags: ["Alignments", "Visits", "Delirium", "Reflexive"],
      description: [
        "Each Night Will make one of their visitors Delirious.",
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
      tags: [
        "Host",
        "Unkillable",
        "Whispers",
        "Pregame Actions",
        "Dusk",
        "Dawn",
        "Exposed",
      ],
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
      tags: ["Survivor", "Visits", "Extra Lives", "Visiting"],
      description: [
        "Each night, hides behind a player and becomes immune to death.",
        "Will get eaten if the player visits them. That player will gain an extra life.",
        "Wins if alive at the end of the game.",
      ],
    },
    Astrologer: {
      alignment: "Independent",
      tags: ["Linked", "Survivor", "Visiting"],
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
        "Assigned to a random Independent player at the start of the game.",
        "Meets with that player at night.",
        "If that player is killed or converted, the Sidekick takes their role.",
        "Independent roles with the Backup modifier become Sidekick with their original roles as the target.",
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
      tags: [
        "Voting",
        "Night Saver",
        "Protective",
        "Condemn Immune",
        "Visiting",
      ],
      description: [
        "Has no voting power.",
        "Each night, can save one player and also grant them condemn immunity the following day.",
        "Wins from two saves, or if no deaths happen in 2 days and 2 nights.",
      ],
    },
    Warlock: {
      alignment: "Independent",
      tags: ["Voting", "Condemn", "Extra Lives", "Visiting"],
      description: [
        "Each night chooses one person.",
        "If that person is condemned the next day, the Warlock has predicted correctly. They gain an extra life.",
        "The Warlock wins if they predict the condemnation correctly twice.",
      ],
      SpecialInteractions: {
        Assassin: [
          "If an Assassin is Present, The Warlock wins if they can guess a player who is Elected as Room Leader Twice.",
        ],
        OneNightMode: [
          "In One Night Mode, The Warlock wins if they predict the condemnation correctly Once.",
        ],
      },
    },
    Rival: {
      alignment: "Independent",
      tags: ["Linked", "Setup Changes"],
      description: [
        "Wins if they survive and all other rivals are dead.",
        "Adds 1 Rival in closed setups.",
      ],
    },
    Picciotto: {
      alignment: "Independent",
      tags: ["Mafia", "Conversion", "Visiting"],
      description: [
        "Every night, can visit a player.",
        "If that player is mafia, the Picciotto will be notified.",
        "When the Picciotto has visited all the living mafia, they are converted into a random mafia.",
        "Does not win if not converted to mafia.",
      ],
      RolesMadeBy: ["All Mafia Roles"],
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
      tags: ["Voting", "Condemn", "Visiting"],
      description: [
        "Chooses two players each night to force into a duel.",
        "During the following day, only the two duelists may be voted.",
        "Must predict during the sunrise which duelist will survive.",
        "Wins if they predict correctly twice.",
      ],
    },
    Magus: {
      alignment: "Independent",
      tags: ["Magus", "Setup Changes", "Village", "Visiting", "No Investigate"],
      description: [
        "If a Magus is present, no Evil roles will be present in the game.",
        "At night, the Magus will passively and randomly kill players and use abilities of Evil roles that can spawn in the setup.",
        "If Village declares Magus Game and a Magus is not present, all Village-aligned players die.",
        "Village must declare a Magus game to win if a Magus is present.",
        "Upon death, the Magus has a suit as a random Evil role in the setup.",
        "Village and The Magus lose if only 2 players are alive.",
        "Magus Wins with Village.",
      ],
    },
    Superhero: {
      alignment: "Independent",
      tags: [
        "Conversion",
        "Information",
        "Revealing",
        "Role Swapping",
        "Dusk",
        "Pregame Actions",
        "Position",
        "Excess Roles",
        "Meeting",
        "Hostile",
      ],
      description: [
        "Meets with All Independents",
        "Grants All Independents a random Infomation or Role Swapping ability.",
        "Wins if Independents have majority.",
      ],
      SpecialInteractions: {
        OneNightMode: [
          "In One Night Mode, Superheros Wins if no Independents die.",
          "In One Night Mode, Village must kill an Independent to win in addition to other evil Factions.",
          "In One Night Mode, Mafia/Cult must kill an Independent to win in addition to competing evil Factions.",
          "In One Night Mode, Independents with the (Lone) Modifier are not counted as Independents for any of these Win Con",
        ],
      },
    },
    Ghost: {
      alignment: "Independent",
      disabled: true,
      tags: ["Ghost", "Dawn"],
      description: [
        "When present in the game, all players except for the Ghost will know one of two randomly-selected words: the real word and the fake word.",
        "Each night, gives players a Ouija Board. During the Dawn, players give clues about their word.",
        "Wins if the Ghost guesses the real word when condemned.",
      ],
    },
    Playwright: {
      alignment: "Independent",
      disabled: true,
      tags: ["Ghost"],
      description: [
        "Picks two words at night: the real word and the fake word. The Ghost must guess the real word to win.",
        "If a Ghost is not present in the setup, it will be spawned in.",
        "If the Village guesses the identity of the Playwright, the Ghosts and the Playwright both lose.",
        "Wins with Ghosts.",
      ],
      RolesMadeBy: ["Ghost"],
    },
    "Serial Killer": {
      alignment: "Independent",
      tags: ["Killing", "Must Act", "Last Two", "Visiting", "Hostile"],
      description: [
        "Must kill a player each night.",
        "Wins if among last two alive.",
      ],
    },
    Yandere: {
      alignment: "Independent",
      tags: [
        "Killing",
        "Must Act",
        "Linked",
        "Last Two",
        "Visiting",
        "Hostile",
      ],
      description: [
        "Falls in love with another player once per game.",
        "The beloved will not be alerted. If the beloved dies, the Yandere dies. If the Yandere dies, the beloved will not die.",
        "Must kill a player each night.",
        "Wins if the Yandere and their beloved are the last two alive.",
      ],
    },
    Clockmaker: {
      alignment: "Independent",
      tags: ["Killing", "Alignment", "Extra Lives", "Visiting", "Hostile"],
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
      tags: ["Killing", "Gasoline", "Last Two", "Visiting", "Hostile"],
      description: [
        "Douses one player with Gasoline each night.",
        "Chooses to light a match during the day to burn doused players to ashes.",
        "Wins if among last two alive.",
      ],
    },
    Dentist: {
      alignment: "Independent",
      tags: ["Killing", "Visits", "Last Two", "Visiting", "Hostile"],
      description: [
        "Gasses one player with anesthetic each night.",
        "If that player acts the next night, they die.",
        "Anesthetic attack can be cured by not acting.",
        "Wins if among last two alive.",
      ],
    },
    Egg: {
      alignment: "Independent",
      tags: ["Hostile", "Conversion"],
      description: [
        "At night may choose to convert to a Independent role that can spawn in the setup.",
        "If the selected role is already in play, The player with that role will be converted to Amnesiac.",
        "Cannot win the game as Egg.",
      ],
      RolesMadeBy: ["Amnesiac"],
    },
    Hellhound: {
      alignment: "Independent",
      tags: [
        "Killing",
        "Roles",
        "Last Two",
        "Immortal",
        "Condemn Immune",
        "Visiting",
        "Hostile",
      ],
      description: [
        "Chooses to hunt at night by choosing a player and guessing their role.",
        "If guessed correct, becomes immortal for the following day.",
        "If guessed incorrect, identity will be revealed to all.",
        "Wins if Hellhounds outnumber all other living parties.",
      ],
    },
    Shinigami: {
      alignment: "Independent",
      tags: ["Killing", "Items", "Visiting", "Hostile"],
      description: [
        "At the beginning of the game, one player randomly receives a notebook.",
        "That player can kill during the night.",
        "The holder of the notebook must pass it to another player each day.",
        "The Shinigami guesses the current holder of the notebook each night. If they guess correctly once, they win.",
      ],
    },
    Ripper: {
      alignment: "Independent",
      tags: ["Killing", "Independent", "Visiting", "Hostile"],
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
        "Visiting",
        "Hostile",
      ],
      description: [
        "Absorbs one person each night, killing them and cleaning their deaths.",
        "Absorbed players may speak amongst themselves inside of the Blob.",
        "For each absorbed player, the Blob gains an extra life.",
        "Upon death, everyone absorbed by the Blob is regurgitated.",
        "Wins if among the last two alive.",
      ],
      graveyardParticipation: "all",
    },
    "Grey Goo": {
      alignment: "Independent",
      tags: ["Killing", "Last Two", "Conversion", "Visiting", "Hostile"],
      description: [
        "Chooses to sacrifice self at night to convert another player to Grey Goo.",
        "Wins if a Grey Goo is in the last two alive.",
      ],
    },
    Mastermind: {
      alignment: "Independent",
      tags: ["Mafia", "Cult", "Meeting", "AnonymizeMeeting", "Hostile"],
      description: [
        "Mafia and Cult meetings are anonymous if Mastermind is present in the game.",
        "Wins instead of mafia/cult and counts toward their total.",
      ],
    },
    Usurper: {
      alignment: "Independent",
      tags: [
        "Mafia",
        "Mafioso",
        "Meeting",
        "AnonymizeMeeting",
        "Cultist",
        "Visiting",
        "Hostile",
        "Conversion",
      ],
      description: [
        "Meets with the Mafia and Cult, makes their night meeting anonymous.",
        "Each night, chooses a player. If the player is sided with the mafia/cult, they become a Mafioso/Cultist.",
        "Wins when all mafia-aligned players are Mafiosos or all cult-aligned players are Cultists.",
      ],
      RolesMadeBy: ["Mafioso", "Cultist"],
    },
    Mutineer: {
      alignment: "Independent",
      tags: [
        "Mafia",
        "Meeting",
        "Killing",
        "Last Two",
        "AnonymizeMeeting",
        "Visiting",
        "Hostile",
      ],
      description: [
        "Can kill one player per night.",
        "Appears as Mafia on investigation.",
        "Attends Mafia and Cult meetings, makes them anonymous and cannot vote in them.",
        "Wins if alive alone or the final two, and the other is not a mafia or cult",
      ],
    },
    Alien: {
      alignment: "Independent",
      tags: ["Probe", "Visiting", "Hostile"],
      description: [
        "Chooses one player to probe each night.",
        "Wins if all players left alive have been probed.",
      ],
    },
    Matchmaker: {
      alignment: "Independent",
      tags: ["Linked", "Alignment", "Visiting", "Hostile"],
      description: [
        "Each night chooses two players to go on a date. If they are the same alignment, the date will be succesful.",
        "Wins if all players left alive have went on a successful date.",
      ],
    },
    Tofurkey: {
      alignment: "Independent",
      tags: ["Famine", "Alignment", "Survivor", "Hostile"],
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
      tags: ["Famine", "Alignment", "Survivor", "Hostile"],
      description: [
        "The game begins with a famine, with each player starting with four bread.",
        "Turkeys are immune to the famine.",
        "If a Turkey dies, each remaining player gets one meal.",
        "Wins if they survive to the end of the game and everyone else dies of famine.",
      ],
    },
    Leprechaun: {
      alignment: "Independent",
      tags: ["Items", "Killing", "Visiting", "Hostile"],
      description: [
        "When present in the game, four-leaf clovers are randomly assigned to players.",
        "Each night, steals a random item from their target, preferentially stealing Clovers.",
        "If it finds another Leprechaun, will kill them and steal all their items.",
        "Wins if holding three four-leaf clovers.",
      ],
    },
    Anarchist: {
      alignment: "Independent",
      tags: [
        "Items",
        "Killing",
        "Revealing",
        "Last Two",
        "Mini-Game",
        "Visiting",
        "Hostile",
      ],
      description: [
        "Gives out a timebomb each night.",
        "The timebomb can be passed around during the day, randomly exploding.",
        "Wins if 3 players are killed by the timebomb, or if the Anarchist is among the last two alive.",
        "Timebomb reveals Anarchist when exploded on themself.",
      ],
    },
    Communist: {
      alignment: "Independent",
      tags: ["Conversion", "Vanilla", "Visiting", "Hostile"],
      description: [
        "Visits one player each night.",
        "Turns that player into their alignment's vanilla role.",
        "Wins if alive when all other players are vanilla.",
      ],
      RolesMadeBy: ["Villager", "Mafioso", "Cultist"],
    },
    Dragoon: {
      alignment: "Independent",
      tags: [
        "Items",
        "Killing",
        "Revealing",
        "Last Two",
        "Mini-Game",
        "Visiting",
        "Hostile",
      ],
      description: [
        "Gives out a revolver each night.",
        "6 chambers in the barrel, one of them has a bullet.",
        "During the day a player can either choose to pull the trigger or spin the barrel.",
        "If the chamber is empty, they pass the revolver to player below them. If the chamber is full, the shooter is hit.",
        "Wins if 3 players are killed by the revolver, or if the Dragoon is among the last two alive.",
        "Revolver reveals Dragoon when shooting on themself.",
      ],
    },
    Gambler: {
      alignment: "Independent",
      tags: ["Killing", "Last Two", "Mini-Game", "Visiting", "Hostile"],
      description: [
        "Each night, challenges a player to a game of Rock, Paper, Scissors. Game is played during the day.",
        "If the Gambler wins, the Challenger dies.",
        "Wins the game when they have 2 gamble wins, or are among the last two standing.",
      ],
    },
    "Grizzly Bear": {
      alignment: "Independent",
      tags: ["Killing", "Last Two", "Visits", "Visiting", "Hostile"],
      description: [
        "Visits one player each night.",
        "Any player to visit the Grizzly Bear's target will be killed. If the Grizzly Bear's target does not visit that night, they will be killed as well.",
        "Wins if among last two alive.",
      ],
    },
    "Polar Bear": {
      alignment: "Independent",
      tags: [
        "Killing",
        "Last Two",
        "Visits",
        "Malicious Effects",
        "Visiting",
        "Hostile",
      ],
      description: [
        "Visits two players each night, polarising them.",
        "A polarised player visiting another polarised player will kill both of them.",
        //"If visited by a Penguin, will eat it.",
        "Wins if four polarised players die or if majority is attained.",
      ],
    },
    Samurai: {
      alignment: "Independent",
      tags: [
        "Killing",
        "Turn Based",
        "Mini-Game",
        "Visiting",
        "Hostile",
        "Exposed",
      ],
      description: [
        "Picks a player at night to enage in a turn-based duel during the day once per game.",
        "Both duelists have the option to use four moves:",
        "Attack - Deals damage. There is a chance to Crit for double damage.",
        "Defend - Grants Block. Block will absorb damage.",
        "Focus - Raises Attack Power, Block Power, or Crit Chance at random",
        "Charge - Strengthens the duelist's next move. Charging multiple times will allow for Special moves to be used.",
        "Wins if they win their duel.",
      ],
    },
    Snowman: {
      alignment: "Independent",
      tags: ["Items", "Mini-Game", "Hostile"],
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
      tags: ["Speaking", "Voting", "Meeting", "Dusk", "Hostile"],
      description: [
        "Can anonymously broadcast messages during the day.",
        "Twice per game, may declare a court session.",
        "During court, all players but the Judge speak and vote anonymously as the jury.",
        "The Judge's vote counts for three during a Court session.",
        "Wins among the last two standing.",
      ],
    },
    Puppeteer: {
      alignment: "Independent",
      tags: ["Speaking", "Redirection", "Control", "Visiting", "Hostile"],
      description: [
        "Attaches strings to a player each night.",
        "Can redirect all players with attached strings at night.",
        "Wins among the last two standing.",
      ],
    },

    //Events
    "No Event": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "Put this in a setup with other Events to have a chance for no Events to occur.",
      ],
    },
    "Missing Supplies": {
      alignment: "Event",
      tags: ["Event", "Item"],
      description: [
        "If this Event occurs, one random player will be given a Gun.",
      ],
    },
    Moonshine: {
      alignment: "Event",
      tags: ["Event", "Item"],
      description: [
        "If this Event occurs, one random player will be given Whiskey.",
      ],
    },
    "Ominous Warning": {
      alignment: "Event",
      tags: ["Event", "Item"],
      description: [
        "If this Event occurs, one random player will be given a Knife.",
      ],
    },
    Vaccination: {
      alignment: "Event",
      tags: ["Event", "Item"],
      description: [
        "If this Event occurs, one random player will be given a Syringe.",
      ],
      graveyardParticipation: "all",
    },
    "Haunted House": {
      alignment: "Event",
      tags: ["Event", "Item"],
      description: [
        "If this event occurs, One player receives a Haunted Mask.",
        "Only the player with the Haunted Mask is informed if this event occurs.",
        "Players being attacked are prioritized for receiving the Mask.",
        "If a player with a Haunted Mask is attacked. They will kill their attacker and steal their identity.",
      ],
    },
    Evolution: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "Can only occur if an alive player has a Vanilla role.",
        "If this Event occurs, one random player with a Vanilla role will be converted to a random role from their alignment.",
      ],
      RolesMadeBy: ["All Roles"],
    },
    "Time Loop": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, the next Day phase is skipped.",
        "This Event can only occur once.",
      ],
    },
    "Brain Blast": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, one player will get to learn another player's role during the Day.",
      ],
    },
    "Cave-In": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all players will be blocked and forced to vote on a player to kill and eat during the Night.",
      ],
    },
    Feast: {
      alignment: "Event",
      tags: ["Event"],
      description: ["If this Event occurs, All Players gain food."],
    },
    Famine: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, All Players lose food if they have no food to lose they die.",
        "If this Event is in a setup, All players start with 1 Food.",
      ],
    },
    Eclipse: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all speech and votes are anonymous.",
      ],
    },
    Fog: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, players can only see there neighbors messages.",
      ],
    },
    "Mass Hysteria": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all are Frustrated for 1 day.",
        "Frustrated players cannot be condemned by majority vote. A non-zero minority vote will kill a frustrated player.",
      ],
    },
    "Sensible Mood": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, 1-3 Players learn if their role changed.",
      ],
    },
    "Culture Exchange": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, One player gains the ability to role share today.",
      ],
    },
    "Lightning Strike": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all Players gain Kites.",
        "Kites can be used to kill a random player with the same alignment as the user.",
      ],
    },
    "Volcanic Eruption": {
      alignment: "Event",
      tags: ["Event", "Game Ender"],
      description: [
        "If this Event occurs, a random player will die every 30 seconds until the day ends.",
      ],
    },
    Meteor: {
      alignment: "Event",
      tags: ["Event", "Game Ender"],
      description: [
        "If this Event occurs, The game will end and No One wins if nobody dies during the day.",
        "This is uneffected by Win-con altering abilites.",
      ],
    },
    "Black Hole": {
      alignment: "Event",
      tags: ["Event", "Game Ender"],
      description: [
        "If this Event occurs, The game will end in 5 Minutes and No One wins if the game doesn't end before the 5 Minutes are up.",
        "This is uneffected by Win-con altering abilites.",
      ],
    },
    Necronomicon: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, Cult gains the Necronomicon.",
        "Cult may vote on which player holds the Necronomicon during at Day.",
        "Players with the Necronomicon may choose a player to kill at Night.",
      ],
      SpecialInteractionsModifiers: {
        Demonic: [
          "Necronomicon with the Demonic modifier, Players holding the Necronomicon are Demonic.",
        ],
      },
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
    Mordred: {
      alignment: "Spies",
      tags: ["None"],
      description: ["Cannot be seen by Merlin."],
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
        "Appears to self as Villager, and does not know that their word is the decoy word.",
      ],
    },
    Saint: {
      alignment: "Town",
      tags: ["None"],
      description: [
        "Does not learn any words",
        "If voted out, must guess the Fool Word or Town loses",
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
    "Vengeful Spirit": {
      alignment: "Ghost",
      tags: ["Hint"],
      description: [
        "Is Assigned a Town Player as a Target.",
        "Learns a letter in the Town word if the Target is killed",
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
    Governor: {
      alignment: "Town",
      tags: ["None"],
      description: [
        "Can answer prompts and vote for answers.",
        "Turns game into a Acrotopia game, where players create backronyms based on Acronyms.",
      ],
    },
    Gambler: {
      alignment: "Town",
      tags: ["None"],
      description: [
        "Can answer prompts and vote for answers.",
        "Turns game into a Wacky Decisions game, where players answer Would You Rather Questions.",
      ],
    },
    Host: {
      alignment: "Host",
      tags: ["None"],
      description: ["Can make Prompets/Acronyms", "Facilitates the game."],
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
    Thief: {
      alignment: "Liars",
      tags: ["None"],
      description: [
        "Gains 1 Dice the first time they successfully call a Lie.",
      ],
    },
    Graverobber: {
      alignment: "Liars",
      tags: ["None"],
      description: [
        "Gains 2 Dice the first time they successfully call a Spot On.",
      ],
    },
    Sniper: {
      alignment: "Liars",
      tags: ["None"],
      description: [
        "Once per game, Can shoot a player making them lose 1 dice.",
        "That player will not learn which dice they lost until the next turn",
      ],
    },
    Snoop: {
      alignment: "Liars",
      tags: ["None"],
      description: ["Once per game, Can learn what dice a player has."],
    },
    Spy: {
      alignment: "Liars",
      tags: ["None"],
      description: ["Once per game, Can learn what the most common Dice Is."],
    },
    Suitress: {
      alignment: "Liars",
      tags: ["None"],
      description: [
        "Can Propose to Each player in the game.",
        "If Accepted the Suitress and That Player gain a Dice.",
        "If Rejected the Suitress loses a Dice.",
      ],
    },
    Soldier: {
      alignment: "Liars",
      tags: ["None"],
      description: [
        "When a Soldier sucessfully calls a Lie, The Bidder will not lose a dice and the Soldier gains a Gun.",
      ],
    },
    Host: {
      alignment: "Host",
      tags: ["None"],
      description: ["Facilitates the game."],
    },
  },
  "Card Games": {
    Player: {
      alignment: "Town",
      tags: ["None"],
      description: ["Can place bets and play cards."],
    },
    Host: {
      alignment: "Host",
      tags: ["None"],
      description: ["Facilitates the game."],
    },
  },
  Battlesnakes: {
    Snake: {
      alignment: "Town",
      tags: ["None"],
      description: ["Eats the food on the board."],
    },
  },
};

module.exports = roleData;
