const {
  // WINCHECK PRIORITY
  PRIORITY_WIN_CHECK_DEFAULT,
  PRIORITY_WIN_IF_CONDEMNED,
  PRIORITY_WIN_BY_CONDEMNING,
  PRIORITY_WIN_BY_GETTING_SHOT,
  PRIORITY_WIN_SWAP,

  // NIGHT PRIORITY
  PRIORITY_IDENTITY_STEALER_BLOCK,
  PRIORITY_FULL_DISABLE,

  PRIORITY_UNTARGETABLE,
  PRIORITY_MODIFY_ACTION_LABELS,
  PRIORITY_MODIFY_ACTION_DELAY,
  PRIORITY_MODIFY_ACTION,

  PRIORITY_REDIRECT_ACTION,
  PRIORITY_COPY_ACTIONS,
  PRIORITY_SWAP_VISITORS,

  PRIORITY_CANCEL_ROLEBLOCK_ACTIONS,
  PRIORITY_BLOCK_VISITORS,
  PRIORITY_NIGHT_ROLE_BLOCKER,

  PRIORITY_CLEANSE_LYCAN_VISITORS,
  PRIORITY_KILL_WEREWOLF_VISITORS_ENQUEUE,
  PRIORITY_VISITORS_ENQUEUE,
  PRIORITY_NIGHT_SAVER,

  PRIORITY_BITING_WOLF,

  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,

  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_EFFECT_GIVER_DEFAULT,
  PRIORITY_ITEM_TAKER_DEFAULT,
  PRIORITY_EFFECT_REMOVER_DEFAULT,

  PRIORITY_SUPPORT_VISIT_DEFAULT,
  PRIORITY_INVESTIGATIVE_DEFAULT,
  PRIORITY_REVEAL_DEFAULT,

  PRIORITY_MIMIC_ROLE,
  PRIORITY_SWAP_ROLES,
  PRIORITY_CONVERT_DEFAULT,

  PRIORITY_CLEAN_DEATH,
  PRIORITY_IDENTITY_STEALER,

  PRIORITY_MAFIA_KILL,
  PRIORITY_KILL_SPECIAL,
  PRIORITY_KILL_GUESS_ROLE,
  PRIORITY_KILL_SIREN,
  PRIORITY_KILL_DEFAULT,

  PRIORITY_NIGHT_REVIVER,

  PRIORITY_BECOME_DEAD_ROLE,

  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,

  // DAY PRIORITY
  PRIORITY_OVERTHROW_VOTE,
  PRIORITY_SUNSET_DEFAULT,
  PRIORITY_VILLAGE_MEETING,
  PRIORITY_DAY_DEFAULT,

  // LEADER PRIORITY
  PRIORITY_LEADER_DEFAULT,
  PRIORITY_LEADER_NINJA,
} = require("../Games/types/Mafia/const/Priority");

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
        "Other roles appear as Villager to information roles, upon death, and to themself.",
      ],
    },
    Bleeder: {
      alignment: "Village",
      category: "Basic",
      tags: ["Kill Interaction", "Basic", "Malicious Effects"],
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
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Noir",
          value: "noir",
        },
      ],
    },
    Commuter: {
      alignment: "Village",
      category: "Basic",
      tags: ["Blocking", "Basic", "Reflexive"],
      description: [
        "Blocks any player who visits them during the night from performing any actions.",
      ],
      nightOrder: [["Block Visitors",PRIORITY_BLOCK_VISITORS]],
    },
    Slayer: {
      alignment: "Village",
      category: "Basic",
      tags: ["Items", "Killing", "Alignments", "Day Actions"],
      description: [
        "Starts with a stake.",
        "Stakes can only kill players who appear as Evil.",
        "This stake always reveals the Slayer when successfully killing a player.",
      ],
    },
    Deputy: {
      alignment: "Village",
      category: "Basic",
      tags: ["Items", "Basic", "Killing", "Gun", "Day Actions"],
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
      nightOrder: [["Announce Visitors",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 3)]],
    },
    Miller: {
      alignment: "Village",
      category: "Basic",
      tags: ["Humble", "Basic", "Deception", "No Investigate"],
      description: [
        "Appears as Villager to self.",
        "Appears as a random Evil role to information roles.",
        "Appears as a random Evil role upon being condemned.",
        "Appears as Miller upon being killed.",
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
      tags: ["Basic", "Voting", "Kill Interaction", "Condemn Interaction"],
      description: [
        "Chooses whether or not to grow into a tree at night.",
        "Tree is immune to most ways of dying.",
        "Tree cannot vote.",
      ],
      nightOrder: [["Become Tree",(PRIORITY_NIGHT_SAVER)]],
    },
    Sheriff: {
      alignment: "Village",
      category: "Basic",
      tags: ["Items", "Basic", "Killing", "Gun", "Day Actions"],
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
      nightOrder: [["Visit",(PRIORITY_SUPPORT_VISIT_DEFAULT)]],
    },
    //protective roles
    Bawd: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Delirium", "Visiting", "Advanced"],
      description: [
        "Protects two players every night.",
        "One of the players being protected is Delirious.",
      ],
      nightOrder: [["Protect and Make Delirious",(PRIORITY_NIGHT_ROLE_BLOCKER + 2)]],
    },
    Bodyguard: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Killing", "Self Kill", "Visiting", "Basic"],
      description: [
        "Guards one player every night",
        "If the target was attacked, the Bodyguard will kill one attacker and die.",
        //"If the target was the Celebrity, the Bodyguard will kill all attackers and die.",
      ],
      nightOrder: [["Protect",(PRIORITY_NIGHT_SAVER)],["Kill Attacker",(PRIORITY_KILL_DEFAULT)]],
      SpecialInteractions: {
        Celebrity: [
          "If a Bodyguard is Protecting a Celebrity, the Bodyguard will kill all attackers and die.",
        ],
      },
    },
    Doctor: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Visiting", "Basic"],
      description: ["Saves another player from dying each night."],
      nightOrder: [["Protect",(PRIORITY_NIGHT_SAVER)]],
    },
    Martyr: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Condemn Interaction", "Visiting", "Advanced"],
      description: [
        "Can choose to sacrifice themself and be condemned in the place of the player currently being condemned.",
      ],
      nightOrder: [["Protect from Condemn",(PRIORITY_NIGHT_SAVER)]],
    },
    Medic: {
      alignment: "Village",
      category: "Protective",
      tags: ["Kill Interaction", "Extra Lives", "Visiting", "Advanced"],
      description: [
        "Visits two players each night.",
        "If the first player is targeted for a night kill and dies, the second player gains an extra life.",
      ],
      nightOrder: [["Give Extra Life",(PRIORITY_NIGHT_SAVER)]],
    },
    Nurse: {
      alignment: "Village",
      category: "Protective",
      tags: ["Malicious Effects", "Visiting", "Basic"],
      description: [
        "Visits one player each night and cleanses them of malicious effects.",
        "Malicious effects include poison, bleeding, insanity, and polarization.",
      ],
      nightOrder: [["Remove Effects",(PRIORITY_EFFECT_REMOVER_DEFAULT)]],
    },
    Resurrectionist: {
      alignment: "Village",
      category: "Protective",
      tags: ["Revive", "Graveyard", "Visiting", "Dead", "Basic"],
      description: [
        "Visits a dead player during the night once per game.",
        "That player will be resurrected the following day.",
        "If player's identity was revealed upon death, they will remain revealed when resurrected.",
      ],
      nightOrder: [["Revive",(PRIORITY_NIGHT_REVIVER)]],
      graveyardParticipation: "all",
    },
    Shrink: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Conversion", "Visiting", "Basic"],
      description: [
        "Prevents their target from being converted to another role.",
        "If their target was a Hostile Independent, the target will become a Villager.",
      ],
      nightOrder: [["Save from Conversion",(PRIORITY_NIGHT_SAVER- 1)]],
      RolesMadeBy: ["Villager"],
    },
    Surgeon: {
      alignment: "Village",
      category: "Protective",
      tags: [
        "Protective",
        "Killing",
        "Kill Interaction",
        "Visiting",
        "Basic",
      ],
      description: [
        "Each night, operates on one player to prevent them from dying or being converted.",
        "If that player is attacked, the Surgeon kills one of their attackers",
      ],
      nightOrder: [["Protect",(PRIORITY_NIGHT_SAVER)],["Kill Attacker",(PRIORITY_KILL_DEFAULT)]],
    },
    "Tea Lady": {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Neighbors", "Position", "Advanced"],
      description: [
        "If both of the Tea Lady's neighbors are aligned with the Village, the neighbors can't die.",
      ],
    },
    //gifting roles
    Barista: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Items", "Coffee", "Visiting", "Dawn", "Advanced"],
      description: [
        "Gives out coffee to one player each night.",
        "Coffee will allow a player to perform their night actions twice in one night.",
        "The more cups of coffee a player drinks, the more night actions they can take in one night.",
      ],
      nightOrder: [["Give Coffee",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Baker: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Famine", "Items", "Bread", "Visiting", "Advanced"],
      description: [
        "When baker is present in the game, all players start with two breads. A famine will start.",
        "Gives out up to two breads each night.",
        "Bread is consumed each night, staving off the famine for another phase. Running out will eventually starve the player to death.",
      ],
      nightOrder: [["Give Bread",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Blacksmith: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Protective", "Items", "Armor", "Visiting", "Basic"],
      description: [
        "Gives out armor to one player each night.",
        "Armor will protect from one attack before breaking.",
      ],
      nightOrder: [["Give Armor",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Chandler: {
      alignment: "Village",
      category: "Gifting",
      tags: [
        "Information",
        "Items",
        "Candle",
        "Visit Interaction",
        "Visiting",
        "Basic",
      ],
      description: [
        "Gives out a candle to one player each night.",
        "Candles will tell a player the names of their visitors from the previous night.",
      ],
      nightOrder: [["Give Candle",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Cutler: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Items", "Knife", "Killing", "Visiting", "Day Actions", "Malicious Effects", "Advanced"],
      description: [
        "Gives out a knife each night.",
        "Knives can be used to attack another player, causing them to bleed.",
      ],
      nightOrder: [["Give Knife",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Demolitionist: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Items", "Bomb", "Killing", "Visiting", "Kill Interaction", "Basic"],
      description: [
        "Gives out bomb to one player each night.",
        "If a player holding a bomb is attacked, their attacker will die along with them.",
      ],
      nightOrder: [["Give Bomb",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Falconer: {
      alignment: "Village",
      category: "Gifting",
      tags: [
        "Information",
        "Items",
        "Falcon",
        "Visit Interaction",
        "Visiting",
        "Basic",
      ],
      description: [
        "Gives out a falcon to one player each night.",
        "Falcons can be used to track another player's movements during the night.",
      ],
      nightOrder: [["Give Falcon",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Funsmith: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Killing", "Items", "Gun", "Reflexive", "Visiting", "Day Actions", "Advanced"],
      description: [
        "Gives out a gun each night.",
        "Gives out a gun to all visitors at night.",
      ],
      nightOrder: [["Give Guns",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Gemcutter: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Revealing","Information", "Items", "Crystal", "Visiting", "Kill Interaction", "Advanced"],
      description: [
        "Gives out a crystal ball to a player each night.",
        "If a player holding the crystal ball dies, their target's role will be revealed.",
      ],
      nightOrder: [["Give Crystal Ball",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Gunsmith: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Killing", "Items", "Gun", "Visiting", "Day Actions", "Basic"],
      description: [
        "Gives out a gun each night.",
        "Guns can be used to shoot and kill someone during the day.",
      ],
      nightOrder: [["Give Gun",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Keymaker: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Role Blocker", "Items", "Key", "Visiting", "Day Actions", "Advanced"],
      description: [
        "Gives out a key to one player each night.",
        "Keys can be used to lock a player in the next night; they cannot be visited, but also cannot perform any actions.",
      ],
      nightOrder: [["Give Key",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Knight: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Redirection", "Items", "Shield", "Visiting", "Advanced"],
      description: [
        "Gives out shield to one player each night.",
        "Shields can be used at night to redirect kills targeting the holder on to a random player of the same alignment if possible.",
      ],
      nightOrder: [["Give Shield",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Mailman: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Messages", "Items", "Envelope", "Visiting", "Basic"],
      description: [
        "Gives out an envelope to one player each night.",
        "Envelopes can be used to send an anonymous message to another player at night.",
      ],
      nightOrder: [["Give Envelope",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Missionary: {
      alignment: "Village",
      category: "Gifting",
      tags: [
        "Items",
        "Tract",
        "Protective",
        "Visiting",
        "Basic",
      ],
      description: [
        "Gives out a tract to one player each night.",
        "Tracts will prevent one conversion attempt.",
      ],
      nightOrder: [["Give Tract",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Pharmacist: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Role Blocker", "Items", "Whiskey", "Visiting", "Day Actions", "Advanced"],
      description: [
        "Gives out a bottle of whiskey each night.",
        "Whiskey can be used to distract another player, preventing them from acting the next night.",
      ],
      nightOrder: [["Give Whiskey",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Reanimator: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Revive", "Items", "Syringe", "Graveyard", "Visiting", "Basic"],
      description: [
        "Gives out a syringe each night.",
        "Syringes can be used on dead players to resurrect them.",
      ],
      nightOrder: [["Give Syringe",(PRIORITY_ITEM_GIVER_DEFAULT)]],
      graveyardParticipation: "all",
    },
    Riflemaster: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Killing", "Items", "Gun", "Visiting", "Day Actions", "Basic"],
      description: [
        "Gives out a Rifle each night.",
        "Guns can be used to shoot and kill someone during the day.",
        "If a player killed by a Rifle shares alignment with shooter, shooter will die too. If a player killed by a Rifle is of an opposing alignment, shooter gains another rifle.",
      ],
      nightOrder: [["Give Rifle",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Santa: {
      alignment: "Village",
      category: "Gifting",
      tags: [
        "Items",
        "Graveyard",
        "Alignments",
        "Visiting",
        "Information",
        "Self Blocking",
        "Dawn",
        "Day Actions",
        "Revive",
        "Advanced",
      ],
      description: [
        "Visits a player each night to learn their role alignment.",
        "If not visited during the night, will learn whether that player is naughty or nice.",
        "Gives out a Gun, Knife, Armor, Bomb, Crystal, Whiskey, Bread, Key, Falcon, Tract, Syringe, or Coffee each night.",
      ],
      nightOrder: [["Give Gifts",(PRIORITY_ITEM_GIVER_DEFAULT)],["Learn Alignment",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
      graveyardParticipation: "all",
    },
    //investigative roles
    Analyst: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Guess", "Speaking", "Advanced"],
      description: [
        'On their 1st day if an Analyst makes a guess in chat following this structure "I will analyze if (Player Name) is (Role Name)".',
        "The Analyst will learn how many guesses were correct during the night.",
        "The Analyst may only make 5 guesses.",
      ],
      nightOrder: [["Learn About Guesses",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10)]],
    },
    Accountant: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Neighbors", "Position", "Advanced"],
      description: [
        "On Night 1 learns how many pairs of Evil players there are.",
        "A pair is each unique instance of 2 Evil Players neighboring each other.",
        "Players can be part of multiple pairs.",
      ],
      nightOrder: [["Learn Evil Pairs",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10)]],
    },
    Bloodhound: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Visiting", "Basic"],
      description: [
        "Tracks a player each night and learns if they visited anybody.",
      ],
      nightOrder: [["Binary Track",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Old",
          value: "old",
        },
      ],
    },
    "Bounty Hunter": {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Setup Changes", "Advanced"],
      description: [
        "On their first night learns an Evil player.",
        "When that evil player dies, the Bounty Hunter will learn another Evil player at night.",
        "If a Bounty Hunter is present, one Village aligned role becomes Evil-aligned and wins if Village loses.",
      ],
      nightOrder: [["Learn Target",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10)]],
    },
    Housekeeper: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Visits", "Reports", "Visiting", "Visit Interaction", "Advanced"],
      description: [
        "Each night chooses 2 players, Learns how many of those players visited or received reports",
      ],
      nightOrder: [["Track and Check for Reports",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT)]],
    },
    Cop: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Alignment", "Visiting", "Basic"],
      description: [
        "Investigates one player each night and learns their alignment.",
      ],
      nightOrder: [["Learn Alignment",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Coroner: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Roles", "Visiting", "Dead", "Basic"],
      description: [
        "Chooses to visit a dead player at night and learns their role identity.",
      ],
      nightOrder: [["Learn Role",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Detective: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Roles", "Visiting", "Basic"],
      description: [
        "Investigates one player each night and learns their role.",
      ],
      nightOrder: [["Learn Role",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Empath: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Alignment", "Neighbors", "Basic"],
      description: [
        "Each night learns how many of their alive neighbors are evil.",
      ],
      nightOrder: [["Learn Evil Neighbors",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10)]],
    },
    Statistician: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Alignment", "Voting", "Advanced"],
      description: [
        "Each night, learns if an Evil player voted with the majority on the previous day.",
        "If the vote was tied, the Statistician learns a random value.",
      ],
      nightOrder: [["Learn If Evil Voted",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Forensicist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Information", "Advanced"],
      description: [
        "Each night learns if and how many system messages are being falsified.",
      ],
      nightOrder: [["Count False Info",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 1)]],
      SpecialInteractions: {
        Journalist: ["Forensicist will not count Journalist info."],
      },
    },
    Geologist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Position", "Advanced"],
      description: [
        "On the first night, learns the distance in players between 2 Evil players.",
        "If the distance is 0, then the Evil players are neighboring each other.",
      ],
      nightOrder: [["Learn Distance Between Two Evil Players",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10)]],
    },
    Orienteer: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Position", "Advanced"],
      description: [
        "Learns the direction to closest evil player on Night 1.",
        "This will Loop around at the top and bottom of the player list.",
      ],
      nightOrder: [["Learn Direction Torwards closest Evil",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10)]],
    },
    Groundskeeper: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Alignment", "Dead", "Basic"],
      description: [
        "Each night learn how many dead players are Evil.",
        "The number is calculated after any kills in the night.",
      ],
      nightOrder: [["Evil Dead Count",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10)]],
    },
    Diviner: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Roles", "Alignment", "Visiting", "Basic"],
      description: [
        "Investigates one player each night and learns two roles of opposite alignments.",
        "The investigated player is one of the roles learned by the Diviner.",
      ],
      nightOrder: [["Learn that player is 1 of 2 Roles",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Journalist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Reports", "Visiting", "Basic"],
      description: [
        "Chooses a player each night and views any reports they receive the following day.",
      ],
       nightOrder: [["Learn Reports",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 2)]],
    },
    Justice: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Alignment", "Visiting", "Basic"],
      description: [
        "Investigates two players at night and learns if they share an alignment.",
      ],
      nightOrder: [["Compare Alignments",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Laundress: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Roles", "Basic"],
      description: [
        "On Night 1, learns that 1 of 2 players is a particular role.",
      ],
      nightOrder: [["Learn Info",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Scientist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Roles", "Neighbors", "Visits", "Guess", "Day Actions", "Advanced"],
      description: [
        "Once per game during the Day, can learn about the relation between a player and a role.",
      ],
    },
    Tourist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Excess Roles", "Advanced"],
      description: ["At night, reveals 1-3 Excess roles to All Players."],
      nightOrder: [["Reveal Roles",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10)]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Old",
          value: "old",
        },
      ],
    },
    Manhunter: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Roles", "Visiting", "Guess", "Basic"],
      description: [
        "Chooses a player and a role and learns if they are that role or not.",
      ],
      nightOrder: [["Guess Role",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Pathologist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Reports", "Dead", "Visiting", "Basic"],
      description: [
        "Each night, visits one dead player.",
        "Will receive all system messages the player ever received.",
      ],
      nightOrder: [["Learn Reports",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Psychic: {
      alignment: "Village",
      category: "Investigative",
      tags: [
        "Information",
        "Roles",
        "Excess Roles",
        "Basic",
      ],
      description: [
        "Each night can choose to learn a player's role or two excess roles"
      ],
      nightOrder: [["Learn Role or Excess Roles",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Clairvoyant: {
      alignment: "Village",
      category: "Investigative",
      tags: [
        "Information",
        "Roles",
        "Basic",
        "Visiting"
      ],
      description: [
        "Visits one player each night and learns two roles that are not that player's role.",
      ],
      nightOrder: [["Learn Not Roles",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Auditor: {
      alignment: "Village",
      category: "Investigative",
      tags: [
        "Information",
        "Alignment",
        "Roles",
        "Neighbors",
        "Position",
        "Excess Roles",
        "Item Interaction",
        "Visit Interaction",
        "Day Actions",
        "Advanced",
      ],
      description: [
        "Each day, may learn two pieces of information about the game. One will be true and one will be false.",
      ],
    },
    Snoop: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Item Interaction", "Visiting", "Basic"],
      description: [
        "Visits a player each night and learns what items they are carrying.",
      ],
      nightOrder: [["Snoop Items",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Tracker: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Visiting", "Basic"],
      description: ["Tracks a player each night and learns who they visited."],
      nightOrder: [["Track",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Voyeur: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Roles", "Basic"],
      description: [
        "Watches a player each night and learns what roles visited them.",
        "Doesn't visit its target.",
      ],
      nightOrder: [["Watch",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT-5)]],
    },
    Watcher: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Basic"],
      description: [
        "Watches a player each night and learns who visited them.",
        "Doesn't visit its target.",
      ],
      nightOrder: [["Watch",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT-5)]],
    },
    Witness: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Basic"],
      description: [
        "Watches a player each night and learns if they were visited by anybody.",
        "Doesn't visit its target.",
      ],
      nightOrder: [["Watch Binary",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT-5)]],
    },
    //night-acting roles
    Avenger: {
      alignment: "Village",
      category: "Night-acting",
      tags: [
        "Kill Interaction",
        "Killing",
        "Gun",
        "Items",
        "Visiting",
        "Day Actions",
        "Basic",
      ],
      description: [
        "Each night, chooses someone to avenge.",
        "Gets a gun if their chosen target dies.",
      ],
      nightOrder: [["Get Gun if Target dies",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Caroler: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Visit Interaction", "Information", "Alignment", "Visiting", "Advanced"],
      description: [
        "Each night, sings a carol to a player about 3 players, at least one of whom is Evil.",
        "The carol is not heard if the player chosen visits at night.",
        "Cannot choose the same player consecutively.",
      ],
      nightOrder: [["Sing Carol",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10)]],
    },
    Comedian: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Visit Interaction", "Information", "Roles", "Visiting", "Advanced"],
      description: [
        "Each night, tells a joke to a player about 3 roles, and a different player who is one of the roles.",
        "The joke is not heard if the target chosen visits at night.",
        "Cannot choose same the target consecutively.",
      ],
      nightOrder: [["Tell Joke",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10)]],
    },
    Exorcist: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Dead", "Graveyard", "Exorcise", "Visiting", "Advanced"],
      description: [
        "Each Night, the Exorcist can Exorcise a dead Player.",
        "Exorcised players can't be revived or use Graveyard abilites.",
      ],
      nightOrder: [["Exorcise",(PRIORITY_KILL_DEFAULT)]],
    },
    Flapper: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Delirium", "Roles", "Advanced"],
      description: [
        "Once per game chooses a Role.",
        "Any players with that role are Delirious for 3 Nights.",
        "If the selected role is not in the game nothing happens.",
      ],
      nightOrder: [["Give Delirium",(PRIORITY_NIGHT_ROLE_BLOCKER - 1)]],
    },
    Drunk: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Role Blocker", "Visiting", "Basic"],
      description: [
        "Visits one player each night and blocks them from performing any night actions.",
        "Some actions cannot be blocked.",
      ],
      nightOrder: [["Block",(PRIORITY_NIGHT_ROLE_BLOCKER)]],
    },
    Sailor: {
      alignment: "Village",
      category: "Night-acting",
      tags: [
        "Delirium",
        "Kill Interaction",
        "Condemn Interaction",
        "Visiting",
        "Advanced",
      ],
      description: [
        "Visits one player each night and makes them Delirious.",
        "Delirious players get False Info and have other abilites disabled.",
        "A Sailor can not die unless roleblocked/made delirious.",
      ],
      nightOrder: [["Give Delirium",(PRIORITY_NIGHT_ROLE_BLOCKER)]],
    },
    "Snake Charmer": {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Conversion", "Role Swapping", "Visiting", "Advanced"],
      description: [
        "Each night, chooses a player to swap roles with.",
        "A Snake Charmer can only swap roles once.",
      ],
      nightOrder: [["Swap Roles",(PRIORITY_SWAP_ROLES)]],
    },
    Mediator: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Conversion", "Role Swapping", "Visiting", "Advanced"],
      description: [
        "Each night chooses 2 players.",
        "The selected players will swap roles.",
      ],
      nightOrder: [["Swap Roles",(PRIORITY_SWAP_ROLES+1)]],
    },
    Guard: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Visit Interaction", "Role Blocker", "Visiting", "Basic"],
      description: ["Each night, protects one player from all visits."],
      nightOrder: [["Block Visitors",(PRIORITY_UNTARGETABLE)]],
    },
    Mechanic: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Item Interaction", "Visiting", "Advanced"],
      description: [
        "Once per night, fixes the target's item(s).",
        "Can undo an item's fabricated/sabotaged status, and can turn Gunrunner guns into normal guns and Gremlin guns into normal guns.",
        "Each phase, fixes their own item(s).",
      ],
      nightOrder: [["Fix Items",(PRIORITY_ITEM_TAKER_DEFAULT + 2)]],
    },
    Mime: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Villager", "Conversion", "Alignment", "Visiting", "Advanced"],
      description: [
        "Chooses a player at night and attempts to mime their role.",
        "If player is Village, Mime steals their role and that player becomes a villager.",
        "If player is Mafia, Mime becomes villager.",
        "If player is Cult or Independent, Mime becomes Amnesiac.",
      ],
      nightOrder: [["Mime Role",(PRIORITY_MIMIC_ROLE)]],
      RolesMadeBy: ["Villager", "Amnesiac"],
    },
    "Lunch Lady": {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Modifiers", "Conversion", "Visiting", "Advanced"],
      description: ["Removes modifiers from other players at night"],
      nightOrder: [["Remove Modifiers",(PRIORITY_CONVERT_DEFAULT+7)]],
    },
    Plastician: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Modifiers", "Conversion", "Visiting", "Advanced"],
      description: [
        "Each night visits a player and gives them a random Modifier",
        "The modifier cannot be Exclusive, Clannish, Inclusive, or a Starting Item modifier."
        ],
      nightOrder: [["Add Modifiers",(PRIORITY_CONVERT_DEFAULT+6)]],
    },
    Photographer: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Information", "Visiting", "Basic"],
      description: [
        "Each Night the Photographer can take a picture of a player during the night.",
        "The role of the photographed player will be revealed to everyone the next day.",
      ],
      nightOrder: [["Reveal Role",(PRIORITY_REVEAL_DEFAULT)]],
    },
    Impersonator: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Deception", "No Investigate", "Advanced"],
      description: [
        "Chooses a role each night to appear as on death and to information role.",
        "Can not be seen as a Villager, Impersonator or Imposter",
      ],
      nightOrder: [["Disguise Self",(PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT)]],
    },
    Vegan: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Information", "Visiting", "Basic"],
      description: [
        "Chooses a player each night to reveal their identity as Vegan.",
      ],
      nightOrder: [["Reveal to Player",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Oracle: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Revealing", "Information", "Kill Interaction", "Visiting", "Basic"],
      description: [
        "Visits one player each night whose role will be revealed upon death.",
      ],
      nightOrder: [["Reveal Role",(PRIORITY_REVEAL_DEFAULT)]],
    },
    Penguin: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Information", "Item Interaction", "Visit Interaction", "Visiting", "Basic"],
      description: [
        "Each night, waddles up to someone to tell them a secret.",
        "The secret will be about Visits, Visitors, or Items.",
      ],
      nightOrder: [["Tell Secret",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    "Robin Hood": {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Alignment", "Item Interaction", "Visiting", "Advanced"],
      description: [
        "Chooses one player to steal from each night and another player to receive their items.",
        "If the player chosen to receive an item is mafia, the steal will not go through.",
      ],
      nightOrder: [["Transfer Items",(PRIORITY_ITEM_TAKER_DEFAULT)]],
    },
    Visitor: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Visiting", "Basic"],
      description: [
        "Pays a visit to another player at night.",
        "Annoyingly, this visit has no effect.",
        "Town roles with the Scatterbrained modifier appear as this role to self.",
      ],
      nightOrder: [["Visit",(0)]],
    },
    Waitress: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Item Interaction", "Visiting", "Advanced"],
      description: ["Chooses a player to steal an item from each night."],
      nightOrder: [["Steal Items",(PRIORITY_ITEM_TAKER_DEFAULT)]],
    },
    "Drama Queen": {
      alignment: "Village",
      tags: ["Revealing", "Information", "Visiting", "Day Actions", "Advanced"],
      description: [
        "Each night, targets one player.",
        "The following day, targeted player has two options:",
        "They can reveal their role,",
        "Or they can reveal the Drama Queen's role.",
        "After someone reveals the Drama Queen's role, The Drama Queen will be unable to their night action.",
      ],
      nightOrder: [["Start Drama",(0)]],
    },
    //sacrificial roles
    Barber: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Kill Interaction", "Items", "Conversion", "Role Swapping", "Expert"],
      description: [
        "When a Barber dies, an Evil player receives a can of shaving cream.",
        "While holding the shaving cream, a Mafia or Cult-aligned player may swap the roles of two living players.",
        "Excluding players who started as Independent, the swapped players will keep their original alignments.",
      ],
    },
    Butterfly: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Kill Interaction", "Conversion", "Advanced"],
      description: [
        "When they die all players are reset to the role they had at the start of the game.",
      ],
    },
    Gatekeeper: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Kill Interaction", "Events", "Advanced"],
      description: [
        "When the Gatekeeper is dead, Banished Events will Occur in addition to normal Events.",
      ],
    },
    Hunter: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Condemn Interaction", "Killing", "Dusk", "Basic"],
      description: [
        "Chooses a player to kill when condemned by town during the day.",
      ],
    },
    Lightkeeper: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Kill Interaction", "Voting", "Speaking", "Eclipse", "Basic"],
      description: [
        "Following their death, causes an eclipse during the day. During an eclipse, all speech and votes are anonymous.",
      ],
    },
    Schoolmarm: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Kill Interaction", "Conversion", "Villager", "Basic"],
      description: [
        "When a Schoolmarm dies, all Village-aligned players convert to Villager.",
      ],
      RolesMadeBy: ["Villager"],
    },
    Secretary: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Kill Interaction", "Voting", "Basic"],
      description: [
        "If killed at night, players are forced to vote for no one the next day.",
      ],
    },
    Sheep: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Kill Interaction", "Setup Changes", "Self Kill", "Basic"],
      description: [
        "If one Sheep dies, all Sheep die.",
        "Adds 1 Sheep in Closed setups",
      ],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Noir",
          value: "noir",
        },
      ],
    },
    Turncoat: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Kill Interaction", "Conversion", "Traitor", "Advanced"],
      description: [
        "When killed by the Mafia, will turn into a Traitor instead.",
      ],
      RolesMadeBy: ["Traitor"],
    },
    Typist: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Kill Interaction", "Voting", "Basic"],
      description: [
        "On the day following their death, all votes will be anonymous.",
      ],
    },
    Virgin: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Condemn Interaction", "Protective", "Conversion", "Basic"],
      description: [
        "If condemned by the village, no one will die the following night.",
        //"If visited by Hooker, gets turned into Villager.",
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
      tags: ["Kill Interaction", "Killing", "Advanced"],
      description: [
        "After dying chooses a player.",
        "If the chosen player is village aligned, That player will die during the night.",
        "If the chosen player is non-village aligned, Nothing happens.",
      ],
      nightOrder: [["Kill Selected Player",(PRIORITY_KILL_DEFAULT)]],
    },
    //voting roles
    Attorney: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Basic"],
      description: ["Vote weight is worth 2 votes in day meeting."],
    },
    Butler: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Visiting", "Advanced"],
      description: [
        "Each night chooses a player to be their Master.",
        "A Butler's Vote only counts if they vote the same Target as their Master.",
      ],
      nightOrder: [["Choose Master",(PRIORITY_SUPPORT_VISIT_DEFAULT)]],
    },
    Governor: {
      alignment: "Village",
      category: "Voting",
      tags: ["Condemn Interaction", "Overturn", "Dusk", "Advanced"],
      description: [
        "Overrides village condemnation once per game.",
        "Cannot cancel a village condemnation.",
        "Choosing no one or the original target preserves the Governor's override ability.",
      ],
    },
    King: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Basic"],
      description: ["Vote weight is worth 10000 votes in day meeting."],
    },
    Kingmaker: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Items", "Visiting", "Sceptre", "Day Actions", "Advanced"],
      description: [
        "Gives out a sceptre each night.",
        "Sceptres give a player +10000 votes in day meeting.",
      ],
      nightOrder: [["Give Sceptre",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Lifeguard: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Advanced"],
      description: [
        "All votes for whoever a Lifeguard is voting for do not count.",
      ],
    },
    Magistrate: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Condemn Interaction", "Visiting", "Expert"],
      description: [
        "Every night, chooses one player and prevents them from voting and from being voted.",
        "Cannot choose themselves.",
      ],
      nightOrder: [["Block Votes",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Jazzman: {
      alignment: "Village",
      category: "Voting",
      tags: ["Condemn Interaction", "Delirium", "Alignment", "Advanced"],
      description: [
        "If an Evil player is condemned, All players are Delirious that night.",
      ],
      nightOrder: [["Give Everyone Delirium If Evil Condemned",(PRIORITY_NIGHT_ROLE_BLOCKER - 1)]],
      SpecialInteractions: {
        Assassin: [
          "If an Assassin is Present, All players are Delirious if an Evil Player is Elected as Room Leader.",
        ],
      },
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Noir",
          value: "noir",
        },
      ],
    },
    Princess: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Condemn Interaction", "Overturn", "Alignment", "Advanced"],
      description: [
        "If the first player to vote for a Princess appears as Village-aligned, The day ends and that player is condemned.",
        "If the first player to vote for a Princess does not appear as Village-aligned, nothing happens.",
      ],
    },
    Troublemaker: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Condemn Interaction", "Day Actions", "Basic"],
      description: [
        "Once per game during the day, can force the next night phase to skip and two day phases to occur consecutively.",
      ],
    },
    //manipulative roles
    Braggart: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Setup Changes", "Delirium", "Banished", "Advanced"],
      description: [
        "Sees self as a random non-Banished Village role from the setup.",
        "Has that role's abilities but is permanently Delirious.",
        "Items used by a Braggart will be broken.",
      ],
      nightOrder: [["Self Deliriate",(PRIORITY_FULL_DISABLE + 1)]],
    },
    Coward: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Redirection", "Reflexive", "Visiting", "Basic"],
      description: [
        "Each night, chooses a player.",
        "Anyone who visits the Coward will be redirect to the choosen player.",
      ],
      nightOrder: [["Redirect Visitors",(PRIORITY_MODIFY_ACTION)]],
    },
    Chauffeur: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Redirection", "Visiting", "Advanced"],
      description: [
        "Chooses two players, A and B, each night.",
        "Players who visit A will be redirected to B.",
        "Players who visit B will be redirected to A.",
        "Redirection cannot be role blocked.",
      ],
      nightOrder: [["Swap Visitors",(PRIORITY_SWAP_VISITORS)]],
    },
    Televangelist: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Setup Changes", "Delirium", "Cult", "Advanced"],
      description: [
        "Sees self as a random Demonic Cult role from the setup.",
        "Can use fake versions of that roles abilities.",
        "Will attend a Fake Cult Meeting with the non-Demonic Cult roles.",
        "Cult players will learn who the Televangelist selects at night.",
      ],
      nightOrder: [["Self Deliriate",(PRIORITY_FULL_DISABLE + 1)]],
    },
    Monkey: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Copy Actions", "Advanced"],
      description: [
        "Before each Night chooses a player.",
        "Copies the actions of the choosen player at night.",
      ],
    },
    Philosopher: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Conversion", "Delirium", "Advanced"],
      description: [
        "At night may choose to convert to a Village aligned role that can spawn in the setup.",
        "If the selected role is already in play, The player with that role will be Delirious until the Philosopher dies.",
      ],
      nightOrder: [["Become Role and Make Delirious",(PRIORITY_NIGHT_ROLE_BLOCKER)]],
    },
    Jack: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Advanced", "Banished Interaction",],
      description: [
        "At night chooses a banished Village role, gains it's abilities until the next night",
        "Cannot select a role they already selected.",
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
      tags: ["Conversion", "Items", "Killing", "Day Actions", "Advanced"],
      description: [
        "Gives out an item each night to a random player.",
        "The item can be a Gun, Knife, Armor, Whiskey, or Crystal.",
        "The item has a 50% chance to be Cursed.",
        "Cursed items will misfire or be otherwise ineffective.",
      ],
      nightOrder: [["Give Random Item",(PRIORITY_ITEM_GIVER_DEFAULT - 1)]],
    },
    //meeting roles
    Capybara: {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meetings", "Orange", "Items", "Visiting", "Advanced"],
      description: [
        "Chooses a player to invite to a hot springs relaxation by giving them a Yuzu Orange each night.",
        "When holding a Yuzu Orange, player can choose during the day to anonymously meet with the Capybara and other Yuzu Orange holders the following night.",
        "Multiple Capybaras share a night meeting.",
      ],
      nightOrder: [["Give Orange",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Chef: {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meetings", "Information", "Basic"],
      description: [
        "Chooses two players during the day to attend a banquet the following evening.",
        "Players chosen to attend the banquet meet anonymously with their roles revealed to one another.",
      ],
    },
    Freemason: {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meetings", "Conversion", "Alignment", "Visiting", "Basic"],
      description: [
        "Converts one player into a Freemason each night.",
        "Shares a night meeting with other Freemasons.",
        "All Freemasons die if they attempt to convert a member of the Mafia.",
        "Attempting to convert a Whig into a Freemason will fail.",
        "All Cultists die if targeted by a Freemason meeting.",
      ],
      nightOrder: [["Convert to Mason",(PRIORITY_CONVERT_DEFAULT+2)],["Kill Cultist",(PRIORITY_KILL_DEFAULT + 1)]],
    },
    "Invisible Man": {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meetings", "Basic"],
      description: [
        "Chooses one player during the day to follow at night.",
        "Views all messages from that player's meetings that night.",
      ],
    },
    Matron: {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meetings", "Reflexive", "Basic"],
      description: [
        "Passively invites visitors to the common room, where  they share a meeting.",
      ],
      nightOrder: [["Give Invites to Visitors",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Templar: {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meetings", "Setup Changes", "Basic"],
      description: [
        "Shares a night meeting with other Templars.",
        "Adds 1 Templar in closed setups.",
      ],
    },
    //reflexive roles
    Apothecary: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Malicious Effects", "Role Share", "Advanced"],
      description: [
        "When visited, heals and cleanses all effects currently possessed by the visiting player.",
        "Players who Role Share with an Apothecary are Cleansed.",
      ],
      nightOrder: [["Remove Effects from Visitors",(PRIORITY_EFFECT_REMOVER_DEFAULT)],["Kill Werewolf",(PRIORITY_KILL_DEFAULT)]],
    },
    Dreamer: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Information", "Alignment", "Basic"],
      description: [
        "Dreams about 3 players, at least one of whom is Evil; or about 1 player who is Village aligned.",
        "Does not dream if visited at night.",
      ],
      nightOrder: [["Dream",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT-10)]],
    },
    Farmer: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Famine", "Items", "Advanced"],
      description: [
        "When visited, gives a loaf of bread to each visitor.",
        "Starts a famine when present in the game.",
      ],
      nightOrder: [["Give Bread to Visitors",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Painter: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Information", "Kill Interaction", "Basic", "Visit Interaction"],
      description: [
        "When a Painter dies they will announce all players who ever visited them."
      ],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Noir",
          value: "noir",
        },
      ],
    },
    Priest: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Information", "Roles", "Visit Interaction", "Basic"],
      description: ["Learns the roles of those who visited them."],
      nightOrder: [["Learn Role Visitors",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    //killing roles
    Debtor: {
      alignment: "Village",
      category: "Killing",
      disabled: true,
      tags: ["Guess", "Roles", "Visiting", "Self Kill", "Advanced"],
      description: [
        "Each night must choose a player and role from the Setup.",
        "If the selected role is not the player's role, The Debtor dies.",
      ],
      nightOrder: [["Die with Incorrect Guess",(PRIORITY_KILL_DEFAULT - 1)]],
    },
    Firebrand: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Gasoline", "Visiting", "Day Actions", "Advanced"],
      description: [
        "Douses one player with Gasoline each night.",
        "Chooses to light a match during the day to burn doused players to ashes.",
      ],
      nightOrder: [["Douse In Gasoline",(PRIORITY_EFFECT_GIVER_DEFAULT - 1)]],
    },
    Granny: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Reflexive", "Advanced"],
      description: [
        "Kills all players who visit during the night.",
        "Cannot be killed or converted at night.",
        "Can only be killed by village condemnation.",
      ],
       nightOrder: [["Kill Visitors",(PRIORITY_KILL_DEFAULT)]],
    },
    Jailer: {
      alignment: "Village",
      category: "Killing",
      tags: [
        "Killing",
        "Meeting",
        "Role Blocker",
        "Condemn Interaction",
        "Dusk",
        "Advanced",
      ],
      description: [
        "If no one was condemned, chooses a player to jail after each day meeting.",
        "Meets with the prisoner at night and the prisoner cannot perform actions or attend other meetings or be targeted.",
        "Decides whether or not the prisoner should be executed.",
      ],
      nightOrder: [["Execute Prisoner",(PRIORITY_KILL_DEFAULT)],["Block Jailed Player's Visitors",(PRIORITY_UNTARGETABLE-5)]],
    },
    Seeker: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Setup Change", "Hide and Seek", "Visiting", "Basic"],
      description: [
        "Attempts to guess the identity of the Hider or Invader each night.",
        "Kills the Hider/Invader if guess is correct.",
        "Forces a Hider or Invader to Spawn in closed Setups.",
      ],
      nightOrder: [["Guess Hider/Invader",(0)]],
      RolesMadeBy: ["Hider", "Invader"],
    },
    OldScientist: {
      alignment: "Village",
      disabled: true,
      category: "Killing",
      tags: ["Killing", "Information", "Expert"],
      description: [
        "During the day chooses a Player role Relation to Test.",
        "If the Relation is True, The Scientist kills a Random Village or Independent Aligned Player at Night.",
        "Scientists can kill themselves.",
      ],
      nightOrder: [["Kill If Statement is True",(PRIORITY_KILL_DEFAULT - 2)]],
    },
    Trapper: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Visit Interaction", "Visiting", "Advanced"],
      description: [
        "Each night, visits one player and kills one of their visitors.",
        "Preferentially kills Mafia, Cult, Independents, then Villagers.",
        "Other visitors will learn the identity of the Trapper.",
      ],
      nightOrder: [["Trap",(PRIORITY_KILL_DEFAULT)]],
    },
    Vigilante: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Visiting", "Advanced"],
      description: ["Kills one player each night."],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT+1)]],
    },
    //speaking roles
    Agent: {
      alignment: "Village",
      category: "Speaking",
      tags: ["Speaking", "Roles", "Basic"],
      description: [
        "Can anonymously contact any non-Village role during the day.",
      ],
    },
    Medium: {
      alignment: "Village",
      category: "Speaking",
      tags: ["Speaking", "Dead", "Graveyard", "Basic"],
      description: [
        "Holds a seance with a dead player once per night.",
        "Identity is not revealed to the dead player.",
      ],
      graveyardParticipation: "all",
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Noir",
          value: "noir",
        },
      ],
    },
    Mourner: {
      alignment: "Village",
      category: "Speaking",
      tags: ["Speaking", "Dead", "Graveyard", "Basic"],
      description: [
        "Can ask players in the graveyard a question every night.",
        "The players can answer with yes or no.",
        "The mourner will receive the results of the vote.",
      ],
      nightOrder: [["Learn Answer",(PRIORITY_INVESTIGATIVE_DEFAULT + 1)]],
      graveyardParticipation: "all",
    },
    "Town Crier": {
      alignment: "Village",
      category: "Speaking",
      tags: ["Speaking", "Basic"],
      description: ["Can anonymously broadcast messages during the day."],
    },
    //essential roles
    Admiral: {
      alignment: "Village",
      tags: ["Setup Changes", "Exposed", "Treasure Chest", "Voting", "Advanced", "Special"],
      description: [
        "If an Admiral is present, all players start as Grouch. The Admiral is revealed and their vote is worth 10000.",
        "Starting with the Admiral, players will pass a chest containing Village/Independent roles and 15 Gold to their lower neighbor.",
        "When a player is passed the chest they may steal gold or become a role in the chest. Players who steal Gold become Evil roles.",
        "The Admiral must steal 1-5 Gold but will not become an Evil role.",
        "The Player directly below the Admiral can Choose to become an excess role, while the player directly above the Admiral can choose to become Grouch.",
        "If 2 or more non-evil roles are condemned, All village aligned players die.",
      ],
      RolesMadeBy: ["Grouch"],
    },
    Benandante: {
      alignment: "Village",
      category: "Essential",
      tags: ["Essential", "Graveyard", "Alignment", "Sacrificial", "Advanced"],
      description: [
        "When a Benandante dies, They choose a player during the day.",
        "If that player is not Village aligned, All Village Aligned players die.",
      ],
      graveyardParticipation: "self",
    },
    Broker: {
      alignment: "Village",
      category: "Essential",
      tags: ["Win Con", "Expert"],
      description: [
        "When the game ends, Swaps the Winners and Losers.",
        "If Roleblocked/made Delirious will not Switch the Winners that night and the following day.",
        "If Multiple Brokers are in a game, The Winners and Losers can swapped Multiple Times.",
      ],
    },
    President: {
      alignment: "Village",
      category: "Essential",
      tags: ["Essential", "Selective Revealing", "Exposed", "Advanced"],
      description: [
        "All villagers will know who the President is.",
        "When the President dies, the Mafia/Cult will win.",
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
      tags: ["Essential", "Condemn", "Sacrificial", "Basic"],
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
        "Expert",
        "Win Con",
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
      tags: ["Expert", "Meeting", "Win Con"],
      description: [
        "The Mole is assigned a Mafia or Cult role in addition to the Mole role",
        "The Mole will appear as that role and have that role's abilites but will still win with Village.",
        "The Mole will count torwards Mafia/Cult majority and attend their meetings.",
        "Once per game, at night Mafia/Cult can guess who the Mole is even if dead.",
        "On a correct guess, Mafia/Cult wins.",
        "The Mole will still be the Mole even if converted.",
      ],
      graveyardParticipation: "All",
    },
    Senator: {
      alignment: "Village",
      category: "Essential",
      tags: ["Setup Changes", "Advanced", "Win Con"],
      description: [
        "If half or more the number of Senators in play die, Mafia/Cult wins.",
        "Adds 2 to 4 Senators in closed setups.",
      ],
    },
    Soldier: {
      alignment: "Village",
      category: "Essential",
      tags: ["Basic", "Win Con"],
      description: [
        "If the number of living Soldiers equals half of all living players, the Village wins.",
      ],
    },
    "Vice President": {
      alignment: "Village",
      tags: ["Win Con", "Setup Changes", "Role Sharing", "Advanced"],
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
      tags: ["Win Con", "Condemn Interaction", "Basic"],
      description: [
        "At the end of the day, if exactly three players are alive and no player was executed today, the game ends and the Mayor's team wins.",
      ],
    },
    //linked roles
    Begum: {
      alignment: "Village",
      category: "Linked",
      tags: ["Information", "Visits", "Basic", "Day Actions"],
      description: [
        "Is randomly paired up with another player.",
        "Learns who this player visits and is visited by each night.",
        "Can find out who this player is, at the cost of no longer receiving this info about their target.",
      ],
      nightOrder: [["Learn Information",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Mistress: {
      alignment: "Village",
      category: "Linked",
      tags: ["Information", "Alignment", "Advanced"],
      description: [
        "Once per game during the day, can open the door.",
        "When the Mistress opens the Door all players will learn that the Mistress opened the door.",
        "When the door is opened, the Mistress will learn an evil player.",
        "After the Door was opened, The Mistress will Die the at night unless visited by a town-aligned player at night.",
      ],
      nightOrder: [["Die unless visited",(PRIORITY_KILL_DEFAULT + 1)]],
    },
    Suitress: {
      alignment: "Village",
      category: "Linked",
      tags: ["Revealing", "Information", "Basic"],
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
        "Appears as Villager to information roles.",
      ],
    },
    Gramps: {
      alignment: "Mafia",
      category: "Basic",
      tags: [
        "Unkillable",
        "Basic",
        "Information",
        "Visits",
        "Roles",
        "Reflexive",
      ],
      description: [
        "Learns role of any player who visits them.",
       // "Cannot be killed normally.",
      ],
      nightOrder: [["Learn Visitors",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
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
      tags: ["Killing", "Basic", "Gun", "Items", "Day Actions"],
      description: [
        "Starts with a gun.",
        "Gun does not reveal identity when fired.",
      ],
    },
    //killing roles
    Arsonist: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Gasoline", "Visiting", "Day Actions", "Basic"],
      description: [
        "Douses one player with Gasoline each night.",
        "Chooses to light a match during the day to burn doused players to ashes.",
      ],
      nightOrder: [["Douse In Gasoline",(PRIORITY_EFFECT_GIVER_DEFAULT - 1)]],
    },
    Caporegime: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Visit Interaction", "Extra Night Deaths", "Visiting", "Basic"],
      description: [
        "Gives the kiss of death to someone each night.",
        "Target will die if visited by a non-Mafia player that night.",
      ],
      nightOrder: [["Kill Target If Visited",(PRIORITY_KILL_DEFAULT)]],
    },
    Hider: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Setup Change", "Hide and Seek", "Visiting", "Basic"],
      description: [
        "Attempts to guess the identity of the Seeker or Invader each night.",
        "Kills the Seeker/Invader if guess is correct.",
        "Forces a Seeker or Invader to Spawn in closed Setups.",
      ],
      nightOrder: [["Guess Seeker/Invader",(0)]],
      RolesMadeBy: ["Seeker", "Invader"],
    },
    Hitman: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Extra Night Deaths", "Visiting", "Basic"],
      description: ["Kills one player each night."],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT)]],
    },
    Jinx: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Word Kill", "Visiting", "Speaking", "Basic"],
      description: [
        "Curses a player with a forbidden word each night.",
        "If the player speaks the word the next day, they will die.",
      ],
      nightOrder: [["Curse Word",( PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Poisoner: {
      alignment: "Mafia",
      category: "Killing",
      tags: [
        "Killing",
        "Poison",
        "Malicious Effects",
        "Visiting",
        "Basic",
      ],
      description: [
        "Concocts a deadly poison and administers it to one player each night.",
        "The poisoned target will die at the end of the following night unless saved.",
      ],
      nightOrder: [["Poison",( PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Queen: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Win Con", "Advanced"],
      description: [
        "If the Queen is the only mafia alive, they will declare a beheading.",
        "Once the beheading is declared, the entire town (except the Queen) will be obliterated at the end of the next phase.",
      ],
    },
    Rottweiler: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Extra Night Deaths", "Visit Interaction", "Visiting", "Basic"],
      description: [
        "Each night, visits one player and kills one of their visitors.",
        "Other visitors will learn the identity of the Rottweiler.",
      ],
       nightOrder: [["Trap",(PRIORITY_KILL_DEFAULT)]],
    },
    Terrorist: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Self Kill", "Day Actions", "Basic"],
      description: [
        "Once per game, can rush at another player during the day, killing them both.",
      ],
    },
    //investigative roles
    Actress: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Roles", "Deception", "Suits", "Visiting", "Advanced"],
      description: [
        "Visits a player to appears as their role.",
        "Learns chosen player's role.",
      ],
       nightOrder: [["Learn role and change appearance",(PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT)]],
    },
    Bondsman: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Roles", "Visiting", "Guess","Basic"],
      description: [
        "Chooses a player and a role and learns if they are that role or not.",
      ],
      nightOrder: [["Guess Role",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Busybody: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Basic"],
      description: [
        "Watches a player each night and learns if they were visited by anybody.",
        "Doesn't visit its target.",
      ],
      nightOrder: [["Watch Binary",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5)]],
    },
    Caser: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Roles", "Basic"],
      description: [
        "Watches a player each night and learns what roles visited them.",
        "Doesn't visit its target.",
      ],
      nightOrder: [["Watch",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5)]],
    },
    Informant: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Reports", "Visiting", "Basic"],
      description: [
        "Chooses a player each night and views any reports they receive the following day.",
      ],
      nightOrder: [["Learn Reports",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 2)]],
    },
    Lookout: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Basic"],
      description: [
        "Watches a player each night and learns who visited them.",
        "Doesn't visit its target.",
      ],
      nightOrder: [["Watch",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5)]],
    },
    Lurker: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Visiting", "Basic"],
      description: [
        "Tracks a player each night and learns if they visited anybody.",
      ],
      nightOrder: [["Binary Track",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Revisionist: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Reports", "Dead", "Visiting", "Basic"],
      description: [
        "Each night, visits one dead player.",
        "Will receive all system messages the player ever received.",
      ],
      nightOrder: [["Learn Reports",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Scout: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Visiting", "Basic"],
      description: ["Tracks a player each night and learns who they visited."],
      nightOrder: [["Track",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Stalker: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Roles", "Visiting", "Basic"],
      description: ["Stalks one player each night and learns their role."],
      nightOrder: [["Learn Role",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    //unsorted
    Hooker: {
      alignment: "Mafia",
      tags: ["Role Blocker", "Visiting", "Basic"],
      description: [
        "Visits one player each night and blocks them from performing any night actions.",
        "Some actions cannot be blocked.",
      ],
      nightOrder: [["Block",(PRIORITY_NIGHT_ROLE_BLOCKER)]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Old",
          value: "old",
        },
      ],
    },
    Pimp: {
      alignment: "Mafia",
      category: "Manipulative",
      tags: ["Manipulative", "Delirium", "Visiting", "Advanced"],
      description: [
        "Visits one player each night and makes them Delirious",
        "Delirious players get False Info and have other abilites disabled.",
      ],
      nightOrder: [["Give Delirium",(PRIORITY_NIGHT_ROLE_BLOCKER)]],
    },
    Don: {
      alignment: "Mafia",
      tags: ["Condemn Interaction", "Overturn", "Dusk", "Advanced"],
      description: [
        "Overrides village condemnation once per game.",
        "Cannot cancel a village condemnation on a Mafia-aligned player.",
        "Choosing no one or the original target preserves the Don's override ability.",
      ],
    },
    Driver: {
      alignment: "Mafia",
      tags: ["Redirection", "Visiting", "Advanced"],
      description: [
        "Chooses two players, A and B, each night.",
        "Players who visit A will be redirected to B.",
        "Players who visit B will be redirected to A.",
        "Redirection cannot be roleblocked.",
        //"Dies if visited by Drunk.",
      ],
      nightOrder: [["Swap Visitors",(PRIORITY_SWAP_VISITORS)]],
      SpecialInteractions: {
        Drunk: ["If a Drunk blocks a Driver, The Driver dies."],
      },
    },
    Gondolier: {
      alignment: "Mafia",
      tags: ["Redirection", "Control", "Visiting", "Advanced"],
      description: [
        "Chooses one player to control.",
        "Chooses who that player will perform their actions on. (Not a Visit)",
        "Redirection cannot be role blocked.",
      ],
      nightOrder: [["Control Player",(PRIORITY_REDIRECT_ACTION)]],
    },
    Snitch: {
      alignment: "Mafia",
      tags: ["Redirection", "Visiting", "Advanced"],
      description: [
        "Chooses one player every night to snitch on.",
        "Chooses another player to divert attention from and redirect their visitors to the first target.",
      ],
      nightOrder: [["Deflect Visitors",(PRIORITY_REDIRECT_ACTION+3)]],
    },
    Ninja: {
      alignment: "Mafia",
      tags: ["Deception", "Astral", "Basic"],
      description: [
        "Does not get detected by watchers and trackers.",
        "Does not trigger any when visited abilites on the target.",
        "Kills bomb without setting off the explosion.",
      ],
      nightOrder: [["Make Mafia kill astral",(PRIORITY_NIGHT_ROLE_BLOCKER + 5)]],
    },
    Vizier: {
      alignment: "Mafia",
      tags: ["Garbage", "Voting", "Items", "Advanced"],
      description: [
        "While alive, the Mafia's kill is replaced with a Coronation meeting.",
        "One player is picked to be King for the next day. Their vote worth 10000 votes.",
        "The Vizier cannot pick the same player to be King twice in a row.",
        "Upon death, the Mafia reverts to killing.",
      ],
      nightOrder: [["Give Sceptre",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Santista: {
      alignment: "Mafia",
      tags: ["Meeting", "Conversion", "Alignment", "Visiting", "Advanced"],
      description: [
        "Shares a night meeting with the Freemasons.",
        "Can convert players to Freemasons.",
      ],
      nightOrder: [["Convert to Mason",(PRIORITY_CONVERT_DEFAULT+2)],["Kill Cultist",(PRIORITY_KILL_DEFAULT + 1)]],
      RolesMadeBy: ["Freemason"],
    },
    Lawyer: {
      alignment: "Mafia",
      tags: ["Deception", "Alignment", "Visiting", "Basic"],
      description: [
        "Chooses a player each night and flips their alignment to investigative roles.",
      ],
      nightOrder: [["Flip Alignment",(PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT)]],
    },
    Framer: {
      alignment: "Mafia",
      tags: ["Deception", "Visit Interaction", "Visiting", "Basic"],
      description: [
        "At night chooses two players, The 1st Player will appear to visit the 2nd Player to Investigative Roles.",
        "The Framer will not visit the 2nd Player.",
      ],
      nightOrder: [["Create Fake Visits",(PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT)]],
    },
    Disguiser: {
      alignment: "Mafia",
      tags: ["Speaking", "Disguise", "Expert"],
      description: [
        "Chooses to steal the identity of the Mafia kill each night.",
        "Cannot be targeted while disguised as another player.",
      ],
      nightOrder: [["Steal Indentity",(PRIORITY_IDENTITY_STEALER)]],
    },
    Janitor: {
      alignment: "Mafia",
      tags: ["Clean", "Information", "Roles", "Basic"],
      description: [
        "Chooses to clean a mafia kill once per game.",
        "Player's role will be hidden from the town if kill is successful.",
        "Learns the cleaned player's role.",
      ],
      nightOrder: [["Clean",(PRIORITY_CLEAN_DEATH)]],
    },
    Undertaker: {
      alignment: "Mafia",
      tags: ["Clean", "Information", "Roles", "Dusk", "Condemn Interaction", "Basic"],
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
      tags: ["Dead", "Graveyard", "Exorcise", "Visiting", "Advanced"],
      description: [
        "Each Night, the Ghostbuster can Exorcise a dead Player.",
        "Exorcised players can't be revived or use Graveyard abilites.",
      ],
      nightOrder: [["Exorcise",(PRIORITY_KILL_DEFAULT)]],
    },
    Strongman: {
      alignment: "Mafia",
      tags: ["Kill Interaction", "Support", "Unstoppable", "Advanced"],
      description: [
        "Once per game can use strength.",
        "Strength guarantees that kills go through.",
        "Works through roleblocking and protection.",
      ],
      nightOrder: [["Strength Kill",(PRIORITY_MODIFY_ACTION_LABELS)]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Old",
          value: "old",
        },
      ],
    },
    Spy: {
      alignment: "Mafia",
      tags: ["Speaking", "Roles", "Advanced"],
      description: ["Can anonymously contact any role during the day."],
    },
    Gunrunner: {
      alignment: "Mafia",
      tags: ["Killing", "Items", "Gun", "Tommy Gun", "Visiting", "Alignment", "Advanced"],
      description: [
        "Gives out a tommy gun each night.",
        "Tommy gun will only kill the target if aligned with the shooter.",
        "The gunned player will not know the gun is a tommy gun.",
      ],
       nightOrder: [["Give Tommy Gun",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Tailor: {
      alignment: "Mafia",
      tags: ["Gifting", "Deception", "Items", "Suits", "Visiting", "Advanced"],
      description: [
        "Gives out a suit each night that disguises the wearer's role identity.",
        "Suits can be selected from any role within the current game.",
      ],
      nightOrder: [["Give Suit",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Fabricator: {
      alignment: "Mafia",
      tags: ["Gifting", "Broken", "Items", "Visiting", "Dawn", "Advanced"],
      description: [
        "Gives out a cursed item once per night.",
        "Cursed Guns and Knives will backfire against the player who used them.",
        "Cursed Armor, Crystal balls, and Whiskey will be ineffective.",
      ],
      nightOrder: [["Give Broken Items",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Saboteur: {
      alignment: "Mafia",
      tags: ["Broken", "Items", "Visiting", "Advanced"],
      description: ["Once per night, sabotages the target's item(s)."],
      nightOrder: [["Break Items",(PRIORITY_ITEM_TAKER_DEFAULT + 1)]],
    },
    Heartbreaker: {
      alignment: "Mafia",
      tags: ["Linked", "Lover", "Visiting", "Advanced"],
      description: [
        "Falls in love with another player once per game.",
        "Both players will die if Heartbreaker dies.",
      ],
      nightOrder: [["Heart Break",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Old",
          value: "old",
        },
        {
          label: "Noir",
          value: "noir",
        },
      ],
    },
    Yakuza: {
      alignment: "Mafia",
      tags: ["Conversion", "Sacrificial", "Visiting", "Basic"],
      description: [
        "Chooses to sacrifice self once per game to convert another player to Mafioso.",
      ],
      nightOrder: [["Convert",(PRIORITY_CONVERT_DEFAULT+1)],["Self Kill",(PRIORITY_KILL_DEFAULT)]],
      RolesMadeBy: ["Mafioso"],
    },
    Graverobber: {
      alignment: "Mafia",
      tags: ["Revive", "Protective", "Graveyard", "Visiting", "Basic"],
      description: [
        "Visits a dead player during the night once per game.",
        "That player will be resurrected the following day.",
        "If player's role identity was revealed upon death, they will remain revealed when resurrected.",
      ],
      nightOrder: [["Revive",(PRIORITY_NIGHT_REVIVER)]],
      graveyardParticipation: "all",
    },
    Mummy: {
      alignment: "Mafia",
      tags: ["Trash", "Dead", "Killing", "Visits"],
      description: [
        "Everyone who visits the mummy while the mummy is dead will die.",
      ],
      nightOrder: [["Kill Visitors",(PRIORITY_KILL_DEFAULT)]],
    },
    Illusionist: {
      alignment: "Mafia",
      tags: ["Killing", "Gun", "Items", "Day Actions", "Advanced"],
      description: [
        "Starts with a gun.",
        "Chooses one player each night to frame as the shooter of any guns or rifles shot by the Illusionist.",
      ],
      nightOrder: [["Frame Shooter",(PRIORITY_ITEM_GIVER_DEFAULT + 1)]],
    },
    Librarian: {
      alignment: "Mafia",
      tags: ["Speech", "Whispers", "Silence", "Basic"],
      description: [
        "Once per game, calls for the Town to meet at the Library.",
        "While in a Library meeting, players can only whisper instead of speaking aloud.",
      ],
      nightOrder: [["Silence",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Dilettante: {
      alignment: "Mafia",
      tags: ["Speech", "Whispers", "Silence", "Advanced", "Speaking"],
      description: [
        "Vote counts as 0",
        "Each Night chooses a 7-20 letter phrase.",
        "The Dilettante's voting power increases by 1 for every Village-Aligned player who said the phrase during the day. ",
        "All players who said the phrase can only speak in whispers the following day.",
        "The Dilettante's voting power resets at night.",
      ],
      nightOrder: [["Choose Word and Silence Players",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Sicario: {
      alignment: "Mafia",
      tags: ["Killing", "Reflexive", "Knife", "Items", "Malicious Effects", "Advanced"],
      description: [
        "Receives a knife if not visited during the night.",
        "A knife used by the Sicario does not reveal.",
      ],
      nightOrder: [["Gain Knife",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Scrutineer: {
      alignment: "Mafia",
      tags: ["Killing", "Voting", "Vote Kills", "Visiting", "Advanced"],
      description: [
        "Chooses a victim and a target each night.",
        "If the victim votes for the target in the village meeting the following day, the victim will die.",
      ],
      nightOrder: [["Curse Player",(PRIORITY_KILL_DEFAULT)]],
    },
    Trespasser: {
      alignment: "Mafia",
      tags: ["Night-Acting", "Visiting", "Basic"],
      description: [
        "Chooses to trespass on another player's property at night.",
        "Annoyingly, this visit has no effect.",
        "Mafia roles with the Scatterbrained modifier appear as this role to self.",
      ],
      nightOrder: [["Visit",(0)]],
    },
    Thief: {
      alignment: "Mafia",
      tags: ["Items", "Night-Acting", "Visiting", "Advanced"],
      description: ["Chooses a player to steal an item from each night."],
      nightOrder: [["Steal Items",(PRIORITY_ITEM_TAKER_DEFAULT)]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Old",
          value: "old",
        },
      ],
    },
    Crank: {
      alignment: "Mafia",
      tags: ["Meeting", "Dead", "Graveyard", "Basic"],
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
        "Condemn Interaction",
        "Role Blocker",
        "Dusk",
        "Advanced",
      ],
      description: [
        "If no one was condemned, chooses a player to jail after each day meeting.",
        "Meets with the prisoner at night and the prisoner cannot perform actions or attend other meetings or be targeted.",
        "Decides whether or not the prisoner should be executed.",
      ],
      nightOrder: [["Execute Prisoner",(PRIORITY_KILL_DEFAULT)],["Block Jailed Player's Visitors",(PRIORITY_UNTARGETABLE-5)]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Gator",
          value: "gator",
        },
      ],
    },
    Bookie: {
      alignment: "Mafia",
      tags: ["Killing", "Condemn", "Voting", "Extra Night Deaths", "Visiting", "Advanced"],
      description: [
        "Each night, predicts the village vote.",
        "If they successfully predict the village vote, they gain a bonus kill.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT)]],
      SpecialInteractions: {
        Assassin: [
          "If an Assassin is Present, Bookie will gain a bonus kill if they can guess a player who is Elected as Room Leader.",
        ],
      },
    },
    Ape: {
      alignment: "Mafia",
      tags: ["Manipulative", "Copy Actions", "Advanced"],
      description: [
        "Before each Night chooses a player.",
        "Copies the actions of the choosen player at night.",
      ],
    },
    Associate: {
      alignment: "Mafia",
      category: "Manipulative",
      tags: ["Manipulative", "Conversion", "Delirium", "Advanced"],
      description: [
        "At night may choose to convert to a Mafia aligned role that can spawn in the setup.",
        "If the selected role is already in play, The player with that role will be Delirious until the Associate dies.",
        "Does not attend the mafia meeting.",
      ],
      nightOrder: [["Become Role and Make Delirious",(PRIORITY_NIGHT_ROLE_BLOCKER)]],
    },
    Consigliere: {
      alignment: "Mafia",
      category: "Manipulative",
      tags: ["Advanced", "Banished Interaction"],
      description: [
        "At night chooses a banished Mafia role, gains it's abilities until the next night",
        "Cannot select a role they already selected.",
      ],
    },
    Apprentice: {
      alignment: "Mafia",
      tags: ["Conversion", "Dead", "Basic"],
      description: [
        "Chooses to become the role of a dead Mafia-aligned player once per game.",
      ],
      nightOrder: [["Become Dead Role",(PRIORITY_BECOME_DEAD_ROLE)]],
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
      tags: ["Speaking", "Deception", "Expert"],
      description: [
        "Can speak as any player during the day.",
        "That player won't be able to see messages said and quoted via this ability.",
      ],
    },
    Fiddler: {
      alignment: "Mafia",
      tags: ["Speech", "Deafen", "Visiting", "Basic"],
      description: [
        "Serenades a player each night, causing them to be unable to hear anything the next day.",
      ],
      nightOrder: [["Deafen",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Silencer: {
      alignment: "Mafia",
      tags: ["Speech", "Silence", "Visiting", "Basic"],
      description: [
        "Can silence someone each night, causing them to be unable to speak the next day.",
      ],
      nightOrder: [["Silence",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Scrambler: {
      alignment: "Mafia",
      tags: ["Speech", "Clueless", "Random Messages", "Visiting", "Basic"],
      description: [
        "Scrambles a player each night, causing them to see messages from random players the next day.",
      ],
      nightOrder: [["Scramble",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Paparazzo: {
      alignment: "Mafia",
      tags: ["Condemn", "Revealing", "Information", "Dusk", "Basic"],
      description: [
        "If condemned, can choose to reveal the role of one player to the Mafia.",
      ],
    },
    Filibuster: {
      alignment: "Mafia",
      tags: ["Condemn", "Voting", "Advanced"],
      description: [
        "Votes for a Filibuster will not count unless every Village-Aligned votes for them.",
      ],
    },
    Rainmaker: {
      alignment: "Mafia",
      tags: ["Voting", "Meeting", "Condemn", "Basic"],
      description: [
        "Once a game, can make it rain and prevent everyone from voting at the village meeting.",
      ],
      nightOrder: [["Summon Rain",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Weatherman: {
      alignment: "Mafia",
      tags: ["Events", "Advanced"],
      description: [
        "At Night can Choose an Event.",
        "That Event will Occur in addition to any other events.",
      ],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Blue",
          value: "blue",
        },
      ],
    },
    Toreador: {
      alignment: "Mafia",
      tags: ["Manipulative", "Redirection", "Control", "Visiting", "Basic"],
      description: ["Each night, attracts a player to visit them."],
      nightOrder: [["Redirect Action",(PRIORITY_REDIRECT_ACTION+2)]],
    },
    Blinder: {
      alignment: "Mafia",
      tags: ["Speech", "Blind", "Visiting", "Basic"],
      description: [
        "Each night, blinds a player.",
        "Blinded players are unable to see the names of players typing the next day.",
      ],
      nightOrder: [["Blind",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Quack: {
      alignment: "Mafia",
      tags: ["Protective", "Visiting", "Basic"],
      description: ["Saves another player from dying each night."],
      nightOrder: [["Protect",(PRIORITY_NIGHT_SAVER)]],
    },
    Homeopath: {
      alignment: "Mafia",
      tags: ["Malicious Effects", "Visiting", "Advanced"],
      description: [
        "Visits one player each night and cleanses them of malicious effects.",
        "Malicious effects include poison, bleeding, insanity, and polarization.",
      ],
      nightOrder: [["Remove Effects",(PRIORITY_EFFECT_REMOVER_DEFAULT)]],
    },
    Dealer: {
      alignment: "Mafia",
      category: "Reflexive",
      tags: ["Reflexive", "Malicious Effects", "Role Share", "Advanced"],
      description: [
        "When visited, heals and cleanses all effects currently possessed by the visiting player.",
        "Players who Role Share with a Dealer are Cleansed.",
      ],
      nightOrder: [["Remove Effects",(PRIORITY_EFFECT_REMOVER_DEFAULT)]],
    },
    Diplomat: {
      alignment: "Mafia",
      tags: ["Condemn", "Protective", "Condemn Immune", "Visiting", "Advanced"],
      description: [
        "Each night chooses a player to be safe from being Condemned.",
        "Cannot choose the player they protected the previous night",
      ],
      nightOrder: [["Make Safe from Condemns",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Enforcer: {
      alignment: "Mafia",
      tags: [
        "Convert Saver",
        "Protective",
        "Conversion",
        "Traitor",
        "Visiting",
        "Basic",
      ],
      description: [
        "Each night, counsels one player and heals their insanity.",
        "Prevents their target from being converted.",
        "If their target was a Hostile Independent, the target will become a Traitor.",
      ],
      nightOrder: [["Save from Conversion",(PRIORITY_NIGHT_SAVER - 1)]],
    },
    Forger: {
      alignment: "Mafia",
      tags: ["Deception", "Will", "Information", "Advanced"],
      description: [
        "Once per night can forge the will of another player.",
        "Learns that player's real will on the next day.",
      ],
      nightOrder: [["Forge Will",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Bouncer: {
      alignment: "Mafia",
      tags: ["Night-acting", "Role Blocker", "Visit Interaction", "Visiting", "Basic"],
      description: ["Each night, protects one player from all visits."],
      nightOrder: [["Block Visitors",(PRIORITY_UNTARGETABLE)]],
    },
    Plumber: {
      alignment: "Mafia",
      tags: ["Whispers", "Speech", "Visiting", "Basic"],
      description: [
        "Every night, can block all sent and received whispers of the target.",
      ],
      nightOrder: [["Block Whispers",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Gossiper: {
      alignment: "Mafia",
      tags: ["Whispers", "Speech", "Visiting", "Basic"],
      description: [
        "Every night, can make a player leaky the next day.",
        "Leaky players will always read their whispers aloud.",
      ],
      nightOrder: [["Make Leaky",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Paralyzer: {
      alignment: "Mafia",
      tags: ["Voting", "Advanced"],
      description: [
        "Once per game, can paralyze votes in the village meeting. Players are not able to unvote.",
      ],
    },
    Electrician: {
      alignment: "Mafia",
      tags: ["Voting", "Speech", "Eclipse", "Blind", "Basic", "Day Actions"],
      description: [
        "Once per game, can cause an eclipse during the day.",
        "During an eclipse all speech and votes are anonymous.",
      ],
    },
    Umpire: {
      alignment: "Mafia",
      tags: ["Timer", "Day Actions", "Basic"],
      description: [
        "Once per game during the day, can set the timer to 1 minute and disable extends.",
      ],
    },
    Lobotomist: {
      alignment: "Mafia",
      tags: ["Night-acting", "Conversion", "Vanilla", "Visiting", "Basic"],
      description: [
        "Each night, visits one player.",
        "Village roles convert to Villager. Cult roles convert to Cultist. Independent roles convert to Grouch.",
      ],
      nightOrder: [["Convert to Vanilla",(PRIORITY_CONVERT_DEFAULT+8)]],
      RolesMadeBy: ["Villager", "Cultist", "Grouch"],
    },
    Nun: {
      alignment: "Mafia",
      category: "Night-acting",
      tags: ["Modifiers", "Conversion", "Visiting", "Advanced"],
      description: ["Removes modifiers from other players at night"],
      nightOrder: [["Remove Modifiers",(PRIORITY_CONVERT_DEFAULT+7)]],
    },
    Tattooist: {
      alignment: "Mafia",
      category: "Night-acting",
      tags: ["Modifiers", "Conversion", "Visiting", "Advanced"],
      description: [
        "Each night visits a player and gives them a random Modifier",
        "The modifier cannot be Exclusive, Clannish, Inclusive, or a Starting Item modifier."
        ],
        nightOrder: [["Add Modifiers",(PRIORITY_CONVERT_DEFAULT+6)]],
    },
    Pedagogue: {
      alignment: "Mafia",
      tags: ["Conversion", "Random", "Visiting", "Expert"],
      description: [
        "Each night, converts another Mafia teammate into a random Mafia-aligned role.",
      ],
      nightOrder: [["Randomize Role",(PRIORITY_CONVERT_DEFAULT+3)]],
      RolesMadeBy: ["All Mafia Roles"],
    },
    Bartender: {
      alignment: "Mafia",
      tags: [
        "Effects",
        "Alcoholics",
        "Role Blocker",
        "Visiting",
        "Advanced",
      ],
      description: [
        "Each night, serves a non-Mafia player and turns them into an Alcoholic.",
        "Alcoholics retain their original roles, but they unknowingly roleblock a random non-Mafia player during the night.",
        "If an Alcoholic player visits an Apothecary, they are cured.",
      ],
      nightOrder: [["Make Alcoholic",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Rat: {
      alignment: "Mafia",
      tags: ["Manipulative", "Redirection", "Reflexive", "Visiting", "Basic"],
      description: [
        "Each night, chooses a player.",
        "Anyone who visits the Rat will be redirect to the choosen player.",
      ],
       nightOrder: [["Redirect Visitors",(PRIORITY_MODIFY_ACTION)]],
    },
    Cannoneer: {
      alignment: "Mafia",
      tags: ["Killing", "Gun", "Items", "Day Actions", "Basic"],
      description: [
        "Will gain a gun once per game if Mafia chose to abstain from killing the previous night.",
        "Gun will always reveal the shooter.",
      ],
      nightOrder: [["Gain Gun",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Imposter: {
      alignment: "Mafia",
      tags: ["Deception", "Night-acting", "No Investigate","Basic"],
      description: [
        "Chooses a role each night to appear as on death and to information role.",
        "Can not be seen as a Villager, Impersonator or Imposter",
      ],
      nightOrder: [["Disguise Self",(PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT)]],
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
        "Advanced",
      ],
      description: [
        "Splits all players into two rooms.",
        "During the Day, each room meets and choose a city leader. In turn, at Night city leaders meet and choose players to switch rooms.",
        "After three rounds of switching, the Assassin will kill all players who are in the same room as them.",
        "The presence of an Assassin will force a President to spawn in the setup (unless Senators are present). Village-aligned players will not learn who the President is.",
        "Village wins if an Assassin dies before a President or majority of the Senators die.",
        "Mafia will not win by majority if an Assassin is present.",
      ],
      nightOrder: [["Kill players in Room",(PRIORITY_KILL_DEFAULT)]],
      RolesMadeBy: ["President"],
    },
    Stylist: {
      alignment: "Mafia",
      tags: ["Mini-game", "Style Points", "Win-Con", "Expert"],
      description: [
        "At the end of each day, Any Living Mafia players will gain 1 Style Point for everytime they said their role in chat.",
        "Style Points cannot be earned if only 1 Mafia player is alive.",
        "At the end of the game reguardless of who Won, The player with the most Style Points will also Win.",
      ],
    },
    Prankster: {
      alignment: "Mafia",
      category: "Gaming",
      tags: ["Voting", "Conversion", "Expert"],
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
      tags: ["Conversion", "Kills Cultist", "Visiting", "Basic"],
      description: [
        "Converts one player into a Cultist each night.",
        "All Cultists die if the Cult Leader dies.",
      ],
      nightOrder: [["Convert",(PRIORITY_CONVERT_DEFAULT)]],
      RolesMadeBy: ["Cultist"],
    },
    Doomsayer: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Kills Cultist", "Reflexive", "Role Share", "Basic"],
      description: [
        "Converts all players who visit during the night.",
        "Converts all players who Role Share with the Doomsayer.",
        "All Cultists die if the Doomsayer dies.",
      ],
      nightOrder: [["Convert",(PRIORITY_CONVERT_DEFAULT)]],
      RolesMadeBy: ["Cultist"],
    },
    Zombie: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Visiting", "Malicious Effects", "Advanced"],
      description: [
        "Can infect one person each night.",
        "That person converts to a zombie the next day.",
        "Nurses can cure/prevent infections.",
        "Survivors will be infected but will not turn.",
      ],
      nightOrder: [["Infect",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Jockey",
          value: "jockey",
        },
      ],
    },
    Hexer: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Messages", "Visiting", "Advanced"],
      description: [
        "Engraves a forbidden word on a player each night.",
        "If the player speaks the word the next day, they will convert to Cultist.",
      ],
      nightOrder: [["Hex",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
      RolesMadeBy: ["Cultist"],
    },
    Inquisitor: {
      alignment: "Cult",
      category: "Conversion",
      tags: [
        "Conversion",
        "Killing",
        "Visiting",
        "Advanced",
      ],
      description: [
        "Kills a player each night.",
        "If the victim is night-saved, they will convert to Cultist.",
      ],
      nightOrder: [["Kill or Convert",(PRIORITY_KILL_DEFAULT + 1)]],
      RolesMadeBy: ["Cultist"],
    },
    Invader: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Setup Changes", "Hide and Seek", "Visiting", "Basic"],
      description: [
        "Attempts to guess the identities of the Hider or Seeker each night.",
        "Converts the Hider/Seeker to Cultist if guess is correct.",
        "Forces a Hider or Seeker to Spawn in closed Setups.",
      ],
      nightOrder: [["Guess Hider/Seeker",(0)]],
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
        "Advanced",
      ],
      description: [
        "Chooses a player each night.",
        "If that player was targeted by a kiling role, that player is saved and converts to Cultist.",
        "All Cultists die if the Witch Doctor dies.",
      ],
      nightOrder: [["Convert and Save",(PRIORITY_NIGHT_SAVER)]],
      RolesMadeBy: ["Cultist"],
    },
    //Killing
    Diabolist: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Vote Kills", "Killing", "Voting", "Visiting", "Basic"],
      description: [
        "Chooses a victim and a target each night.",
        "If the victim votes for the target in the village meeting the following day, the victim will die.",
      ],
      nightOrder: [["Curse Player",(PRIORITY_KILL_DEFAULT)]],
    },
    Harpy: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Killing", "Voting", "Visiting", "Advanced"],
      description: [
        "Chooses a victim and a target each night.",
        "If the victim doesn't get 1/3 of players to vote for the target the next day, a death will occur randomly between the target, the victim, or both.",
      ],
      nightOrder: [["Hex",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Gorgon: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Killing", "Reflexive", "Day Actions", "Basic"],
      description: [
        "Each night learns how many players visited them.",
        "Once per game, during the day, can choose to kill all of their visitors from the previous night.",
      ],
      nightOrder: [["Count Visitors",(PRIORITY_INVESTIGATIVE_DEFAULT)],["Mark Visitors",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Leech: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Killing", "Blood", "Extra Lives", "Visiting", "Basic"],
      description: [
        "Is bloodthirsty.",
        "During the night, can attach to a player and leech from them, stealing 50% of their blood.",
        "If the player dies from leeching, the leech also gains an additional 50% of blood.",
        "Gains an extra life after draining 150% blood.",
      ],
      nightOrder: [["Drain Blood",(PRIORITY_KILL_SPECIAL - 4)]],
    },
    Slasher: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Killing", "Malicious Effects", "Reflexive", "Knife", "Items", "Advanced"],
      description: [
        "If visited at night by a non-Cult player, gains a knife the next day.",
        "Knows who visits but not their roles.",
      ],
      nightOrder: [["Gain Knife",(PRIORITY_ITEM_GIVER_DEFAULT)],["Learn Visitors",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Tormentor: {
      alignment: "Cult",
      category: "Killing",
      tags: [
        "Killing",
        "Banished Interaction",
        "Information",
        "Setup Changes",
        "Extra Night Deaths",
        "Visiting",
        "Advanced",
      ],
      description: [
        "Adds or Removes 1 Banished Role in Closed Setups.",
        "If a player with a Banished Role dies during the Day, May kill a player at night.",
        "Learns what Banished Roles are in the Current Game.",
      ],
      nightOrder: [["Drain Blood",(PRIORITY_KILL_DEFAULT)]],
    },
    Werewolf: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Killing", "Lycan", "Effect", "Full Moons", "Visiting", "Advanced"],
      description: [
        "When a Werewolf is present in the game, full moons will occur on even nights.",
        "Each night, bites a non-Cult player and turns them into a Lycan.",
        "Lycans retain their original roles, but they unknowingly kill a random non-Cult player on full moons.",
        "Invincible during full moons, except for when visiting the Apothecary.",
      ],
      nightOrder: [["Create Lycan",(PRIORITY_BITING_WOLF)],["Make Lycans Kill",(PRIORITY_KILL_DEFAULT)]],
    },
    //Speaking
    Banshee: {
      alignment: "Cult",
      category: "Speaking",
      tags: ["Speaking", "Overturn", "Condemn Interaction", "Roles", "Day Actions", "Advanced"],
      description: [
        "Each day, a random non-Cult player is told a role.",
        "That player must say the name of the role the following day or the vote will be overturned onto them.",
        "During the day a Banshee may guess who their target is. If they guess correctly, the day ends and that player is condemned.",
      ],
      nightOrder: [["Send Banshee Word",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Baphomet: {
      alignment: "Cult",
      category: "Speaking",
      tags: ["Meeting", "Setup Changes", "Basic"],
      description: [
        "Meets with both the Cult and the Templars.",
        "Adds 1 Templar in Closed setups.",
      ],
      RolesMadeBy: ["Templar"],
    },
    Cthulhu: {
      alignment: "Cult",
      category: "Speaking",
      tags: ["Speaking", "Malicious Effects", "Reflexive", "Insanity", "Advanced"],
      description: [
        "All players who visit Cthulhu go insane.",
        "All players who Role Share with Cthulhu go insane.",
        "Insane players speak gibberish for the rest of the game.",
      ],
       nightOrder: [["Make Visitors Insane",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
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
        "Basic",
      ],
      description: [
        "Can choose between four fungi to cast at night.",
        "Thrush, which silences the target.",
        "Aspergillus, which deafens the target.",
        "Cataracts, which blinds the target.",
        "Hallucinogens, which scrambles the target.",
        "Once a fungus has been used, it cannot be spored again for the next two nights.",
      ],
      nightOrder: [["Apply Effect",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
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
        "Expert",
      ],
      description: [
        "Chooses a player to Infest on their first night and Dies.",
        "Will count torwards Cult Majority when dead.",
        "Can Speak as the Infested player",
        "Can Control the Infested players actions at night.",
        "If the Infested player dies the Parasite is Exorcised.",
      ],
      nightOrder: [["Choose Host",(PRIORITY_EFFECT_GIVER_DEFAULT)],["Control Host",(PRIORITY_REDIRECT_ACTION)]],
      graveyardParticipation: "self",
    },
    Psion: {
      alignment: "Cult",
      category: "Speaking",
      tags: ["Speaking", "Malicious Effects", "Visit Interaction", "Visiting", "Insanity", "Advanced"],
      description: [
        "Visits a player each night.",
        "If that player is not visited by a non-Cult player during the next night, they will go insane.",
      ],
      nightOrder: [["Mind Warp",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Noir",
          value: "noir",
        },
      ],
    },
    //Manipulative
    "Cat Lady": {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Cat", "Role Blocker", "Information", "Roles", "Advanced"],
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
        "Conversion",
        "Random",
        "Exorcise Village Meeting",
        "Visiting",
        "Expert",
      ],
      description: [
        "Each night, converts another Cult teammate into a random Cult-aligned role.",
      ],
      nightOrder: [["Randomize Role",(PRIORITY_CONVERT_DEFAULT+3)]],
      RolesMadeBy: ["All Cult Roles"],
    },
    "Mi-Go": {
      alignment: "Cult",
      category: "Manipulative",
      tags: [
        "Conversion",
        "Roles",
        "Alignment",
        "Manipulative",
        "Visiting",
        "Expert",
      ],
      description: [
        "Each night chooses a player and a role.",
        "That player is converted to that role but their Alignment will not change.",
        "If the selected role is already in play, The conversion fails.",
        "Independant roles can only be converted to other Independant roles.",
      ],
      nightOrder: [["Convert",(PRIORITY_CONVERT_DEFAULT+4)]],
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
        "Expert",
      ],
      description: [
        "Each night chooses a player and a non-Demonic Cult role.",
        "If that player is condemned they will be converted to that role and become Transcendent.",
      ],
      nightOrder: [["Apply Effect",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
      graveyardParticipation: "all",
    },
    Sidhe: {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Advanced", "Banished Interaction"],
      description: [
        "At night chooses a banished Cult role, gains it's abilities until the next night",
        "Cannot select a role they already selected.",
      ],
    },
    "Queen Bee": {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Delayed", "Visiting", "Basic"],
      description: [
        "Every night, visits a player and covers them with sticky honey.",
        "Delays their action by one day/night cycle.",
      ],
      nightOrder: [["Delay Action",(PRIORITY_MODIFY_ACTION_DELAY)]],
    },
    Selkie: {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Redirection", "Control", "Visiting", "Advanced"],
      description: [
        "Each night, chooses two players who are forced to target each other.",
      ],
      nightOrder: [["Redirect Targets",(PRIORITY_REDIRECT_ACTION+1)]],
    },
    "Snow Queen": {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Meeting", "Snow Storm", "Basic"],
      description: [
        "During the day, once per game, can choose to start a snowstorm.",
        "Everyone is forced to pass the next night snowed in together.",
        "During the next night, only Cult actions will go through.",
      ],
    },
    Succubus: {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Delirium", "Visiting", "Advanced"],
      description: [
        "Visits one player each night and makes them Delirious",
        "Delirious players get False Info and have other abilites disabled.",
      ],
      nightOrder: [["Give Delirium",(PRIORITY_NIGHT_ROLE_BLOCKER)]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Noir",
          value: "noir",
        },
      ],
    },
    Witch: {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Redirection", "Control", "Visiting", "Advanced"],
      description: [
        "Chooses one player to control.",
        "Chooses who that player will perform their actions on. (Not a Visit)",
        "Redirection cannot be role blocked.",
      ],
      nightOrder: [["Control Player",(PRIORITY_REDIRECT_ACTION)]],
    },
    //Chaos
    Alchemist: {
      alignment: "Cult",
      category: "Chaos",
      tags: [
        "Killing",
        "Information",
        "Roles",
        "Protective",
        "Night Saver",
        "Extra Night Deaths",
        "Visiting",
        "Basic",
      ],
      description: [
        "Can choose between three potions to cast at night.",
        "A damaging potion, which attacks the target.",
        "A restoring potion, which heals the target.",
        "An elucidating potion, which reveals the target's role.",
        "Once a potion has been concocted, it cannot be brewed again for the next two nights.",
      ],
      nightOrder: [["Save Player",(PRIORITY_NIGHT_SAVER)],["Kill Player",(PRIORITY_KILL_DEFAULT)],["Learn Role",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Cannibal: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Killing", "Poison", "Famine", "Condemn Interaction", "Items", "Expert"],
      description: [
        "When a non-Cult player is voted off, the Cannibal can cook the player.",
        "The cooked player is then served as two Stew to every member of the Cult.",
        "If the stew is stolen by non-Cult players and then eaten, they will get poisoned.",
      ],
    },
    Changeling: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Win Con", "Information", "Condemn Interaction", "Advanced"],
      description: [
        "Will be Twins with an Opposing player.",
        "The Twins will learn eachothers roles.",
        "If the Village-aligned Twin is Condemned, Cult Wins.",
      ],
    },
    Reaper: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Win Con", "Condemn Interaction", "Speaking", "Expert"],
      description: [
        'If a Reaper says "I claim Reaper and choose (Player Name)" within the first minute of the day.',
        "If the choosen player survives until the end of the day, their team wins.",
        "A Reaper cannot choose themselves.",
      ],
    },
    Devotee: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Conversion", "Demonic Interaction", "Basic"],
      description: [
        "If a Demonic or Linchpin Cult role dies, the Devotee will convert to that role.",
      ],
    },
    Zealot: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Win Con", "Condemn Interaction", "Demonic Interaction", "Advanced"],
      description: [
        "If a Demonic or Linchpin Cult role is condemned and the game would have ended, the game will continue for 1 more day.",
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
        "Expert",
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
      nightOrder: [["Corrupt Items",(PRIORITY_ITEM_TAKER_DEFAULT + 1)]],
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
        "Expert",
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
      nightOrder: [["Give Cult Items",(PRIORITY_ITEM_GIVER_DEFAULT)]],
      RolesMadeBy: ["Cultist"],
    },
    Haruspex: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Extra Lives", "Protective", "Killing", "Visiting", "Advanced"],
      description: [
        "Visits two Cult-aligned players each night.",
        "The first player is killed while the second player gains an extra life.",
      ],
     nightOrder: [["Kill to grant extra life",(PRIORITY_KILL_SPECIAL - 3)]],
    },
    //Demon/Endangered
    Imp: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Killing", "Conversion", "Visiting", "Basic"],
      description: [
        "Each night, may choose any player to kill.",
        "If an Imp kills themself, a random Cult-aligned player becomes an Imp.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_SPECIAL)]],
    },
    Jiangshi: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Killing",
        "Conversion",
        "Banished Interaction",
        "Setup Changes",
        "Visiting",
        "Self Kill",
        "Advanced",
      ],
      description: [
        "Each night, may choose a player to kill.",
        "The first time a Jiangshi chooses a player with a Banished Role, the Jiangshi dies and the Banished Player becomes a Jiangshi.",
        "Jiangshi adds 1 Banished role in closed setups.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_SPECIAL)]],
    },
    Necromancer: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Killing",
        "Banished Interaction",
        "Setup Changes",
        "Delirium",
        "Visiting",
        "Advanced",
      ],
      description: [
        "Each night, may choose a player to kill.",
        "Cult players killed by a Necromancer can use their abilites when dead, and will make one of their non-banished Village-Aligned neighbors Delirious until the Necromancer dies.",
        "Necromancer removes 1 Banished role in closed setups.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT + 1)]],
      graveyardParticipation: "all",
    },
      Lamia: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Killing",
        "Delirium",
        "Visiting",
        "Advanced",
      ],
      description: [
        "Each night, may choose a player to kill.",
        "If a player survives a Lamia's attack, They will be delirious until the Lamia dies.",
        "If a Lamia attacks a delirious player, That player will die even if protected.",
      ],
      nightOrder: [["Kill",(PRIORITY_SUPPORT_VISIT_DEFAULT)]],
    },
    Nyarlathotep: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Killing",
        "Win Con",
        "Deception",
        "Visiting",
        "No Investigate",
        "Advanced",
      ],
      description: [
        "Each night, may choose a player to kill.",
        "While alive, most information received by Village roles is made false.",
        "If no one is condemned while Nyarlathotep is alive, the Cult wins.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT + 1)]],
    },
    Puca: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Killing", "Delirium", "Poison", "Visiting","Advanced"],
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
        "Position",
        "Banished Interaction",
        "Visiting",
        "Advanced",
      ],
      description: [
        "Each night, may choose a player to kill.",
        "A Satyr's starting Non-banished Village-aligned neighbors are Delirious.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT + 1)]],
    },
    Lich: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Killing",
        "Delirium",
        "Visiting",
        "Kill Interaction",
        "Condemn Interaction",
        "Advanced",
      ],
      description: [
        "Each night, may choose a player to kill.",
        "On the first night chooses a player as a Vessel.",
        "The Vessel is Delirious.",
        "A Lich can only die if their Vessel dies.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT + 1)]],
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
        "Advanced",
      ],
      description: [
        "Each night, may choose 2 players to kill.",
        "Players killed by shoggoth have a chance of reviving the following night.",
        "Shoggoth will only revive a player once per game.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT + 2)]],
      graveyardParticipation: "all",
    },
    Snallygaster: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Killing", "Extra Night Deaths", "Visiting", "Basic"],
      description: [
        "Each night, may choose a player to kill.",
        "Can choose to charge their kill instead of killing.",
        "If a Snallygaster chooses to Charge kill, They may kill 3 players the Next Night",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT + 1)], ["Charge",(PRIORITY_KILL_DEFAULT - 1)]],
    },
    Poltergeist: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Special",
        "Killing",
        "Condemn",
        "Graveyard",
        "Exorcise Village Meeting",
        "Visiting",
        "Expert",
      ],
      description: [
        "If no one is Condemned during the day, may choose a player to Kill during the night. (Even if dead)",
        "Will count torwards Cult Majority when dead.",
        "If a Poltergeist is Exorcised, All Cult-aligned players die.",
        "If it is possible for a Poltergeist to spawn in a setup, Dead players can be voted in village meeting.",
        "Condemned dead players are Exorcised.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT)]],
      graveyardParticipation: "self",
    },
    Warden: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Killing",
        "Extra Night Deaths",
        "Visiting",
        "Dawn",
        "Advanced",
        "Mini-Game",
      ],
      description: [
        "Each night, may choose 3 players.",
        "Each of the selected players will choose to Live or Die.",
        "If All 3 players choose to Live they all Die.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT + 1)]],
      graveyardParticipation: "all",
    },
    Vampire: {
      alignment: "Cult",
      category: "Demon",
      tags: [
        "Killing",
        "Voting",
        "Setup Changes",
        "Visiting",
        "Expert",
      ],
      description: [
        "Vampire Votes only count if a Village Player votes with them.",
        "Most Players including all non-Village are Vampires",
        "Vampires will appear as random Non-Vampire evil roles on Investigations.",
        "Each Night, One Vampire will choose a player to kill.",
        "Vampires can only select Vampires for killing until 1 remains.",
        "Cult can only win when One or fewer Village players are alive.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT)]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Noir",
          value: "noir",
        },
      ],
    },
    //Other
    Theocrat: {
      alignment: "Cult",
      tags: ["Condemn", "Protective", "Condemn Immune", "Visiting","Advanced"],
      description: [
        "Each night chooses a player to be safe from being Condemned.",
        "Cannot choose the player they protected the previous night",
      ],
      nightOrder: [["Make Safe from Condemns",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Count: {
      alignment: "Cult",
      tags: ["Banished Interaction", "Setup Changes", "Basic"],
      description: [
        "Adds 2 Banished roles in Closed Setups.",
        "If a Count is created mid-game, 2 Village/Independant players will be converted to Banished Roles.",
      ],
    },
    Shadow: {
      alignment: "Cult",
      tags: ["Information", "Visits", "Visiting", "Basic"],
      description: [
        "Visits a player each night.",
        "Can see who that player visits as well as everyone who visits that player.",
      ],
      nightOrder: [["Track and Watch",(PRIORITY_INVESTIGATIVE_DEFAULT)]],
    },
    Druid: {
      alignment: "Cult",
      tags: ["Graveyard", "Dead", "Revive", "Visiting", "Voting", "Garbage"],
      description: [
        "Visits a dead player during the night.",
        "That player will be resurrected as a Tree the following day.",
      ],
      nightOrder: [["Revive as Tree",(PRIORITY_NIGHT_REVIVER - 1)]],
      graveyardParticipation: "all",
    },
    Sorcerer: {
      alignment: "Cult",
      tags: ["Events", "Advanced"],
      description: [
        "At Night can Choose an Event.",
        "That Event will Occur in addition to any other events.",
      ],
    },
    Bogeyman: {
      alignment: "Cult",
      category: "Night-acting",
      tags: ["Visiting", "Basic"],
      description: [
        "Visits another player at night. This visit has no effect.",
        "Cult roles with the Scatterbrained modifier appear as this role to self.",
      ],
      nightOrder: [["Visit",(0)]],
    },
    "War Demon": {
      alignment: "Cult",
      disabled: true,
      category: "Demon",
      tags: [
        "Killing",
        "Extra Night Deaths",
        "Visiting",
        "Epic",
        "Very Very Very Very Very Expert",
      ],
      description: ["Very Very Good Role."],
      nightOrder: [["Very Very Good Action",(69420)]],
    },

    //Independent
    Fool: {
      alignment: "Independent",
      tags: ["Condemn Interaction", "Visiting", "Basic"],
      description: [
        "Fools around at night, visiting another player with no effect.",
        "Wins if condemned by the town.",
        "Independent roles with the Scatterbrained modifier appear as this role to self.",
      ],
       nightOrder: [["Visit",(0)]],
    },
    Executioner: {
      alignment: "Independent",
      tags: ["Condemn Interaction", "Linked", "Basic"],
      description: [
        "Randomly assigned a Village/Independent player as a target.",
        "Wins if their target player is condemned in Village meeting while alive.",
      ],
    },
    Dodo: {
      alignment: "Independent",
      tags: ["Items", "Gun", "Killing", "Visiting", "Basic"],
      description: [
        "Wins if shot and killed with a gun.",
        "Flocks around at night, giving their target a gun.",
      ],
      nightOrder: [["Give Gun",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Joker: {
      alignment: "Independent",
      tags: ["Kill Interaction", "Basic"],
      description: ["Wins if killed at Night."],
    },
    Amnesiac: {
      alignment: "Independent",
      tags: ["Dead", "Conversion", "Visiting", "Basic"],
      description: [
        "Chooses to become the role of a dead player once per game.",
        "Cannot win the game as Amnesiac.",
      ],
      nightOrder: [["Become Dead Role",(PRIORITY_BECOME_DEAD_ROLE)]],
    },
    Survivor: {
      alignment: "Independent",
      tags: ["Basic"],
      description: ["Wins if alive at the end of the game."],
    },
    "Old Maid": {
      alignment: "Independent",
      tags: ["Conversion", "Role Swapping", "Visiting", "Advanced"],
      description: [
        "Chooses a player to swap roles with each night.",
        "Chosen player becomes the Old Maid.",
        "Cannot win the game as Old Maid.",
      ],
      nightOrder: [["Swap Roles",(PRIORITY_SWAP_ROLES)]],
    },
    Traitor: {
      alignment: "Independent",
      tags: ["Traitor", "Mafia", "Basic"],
      description: [
        "Wins with Mafia.",
        "Does not count towards mafia win count.",
      ],
    },
    Clown: {
      alignment: "Independent",
      tags: ["Condmen", "Mafia", "Win Con", "Visiting", "Expert"],
      description: [
        "Clowns around at night, visiting another player. The visit does nothing.",
        "The Mafia will be alerted that there is a Clown they must condemn in order to win.",
        "The Mafia will not win if the Clown is not Condemned.",
        "If a Clown is Killed by non-condemn method, a Mafia-Aligned player becomes Clown",
        "Wins with Mafia.",
      ],
      nightOrder: [["Visit",(0)]],
    },
    Autocrat: {
      alignment: "Independent",
      tags: ["Village", "Win Steal", "Advanced"],
      description: ["Wins instead of Village and counts toward their total."],
    },
    Palladist: {
      alignment: "Independent",
      tags: ["Village", "Win Steal", "Meeting", "Conversion", "Visiting", "Expert"],
      description: [
        "If there are no Freemasons, converts a player to Freemason.",
        "Anonymizes Freemason meetings and forces them to act.",
        "Immune to conversions.",
        "Wins instead of Village if there is a Freemason majority and counts toward their total.",
      ],
      nightOrder: [["Convert to Mason",(PRIORITY_CONVERT_DEFAULT+2)],["Kill Cultist",(PRIORITY_KILL_DEFAULT + 1)]],
      RolesMadeBy: ["Freemason"],
    },
    "Panda Bear": {
      alignment: "Independent",
      tags: ["Village", "Win Steal", "Visits", "Setup Changes", "Visiting", "Expert"],
      description: [
        "Walks around at night, visiting another player with no effect.",
        "When present in the game, the Village cannot win unless the Panda Bear visits another Panda Bear and they mate.",
        "Wins instead of Village if the Panda Bears survive without mating.",
        "Adds 1 Panda in Closed Setups.",
      ],
      nightOrder: [["Visit",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Politician: {
      alignment: "Independent",
      tags: ["Voting", "Alignment", "Basic"],
      description: [
        "Vote weight is worth 2 votes.",
        "Gets assigned to random alignment on game start.",
        "Every day, switches alignment between Mafia and Village.",
        "Wins if their current alignment wins.",
      ],
    },
    Lover: {
      alignment: "Independent",
      tags: ["Survivor", "Lover", "Linked", "Visiting", "Basic"],
      description: [
        "Falls in love with another player once per game.",
        "Both players die if either of them are killed.",
        "Wins if both players survive until the end of the game.",
      ],
      nightOrder: [["Fall in love",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Old",
          value: "old",
        },
        {
          label: "Noir",
          value: "noir",
        },
      ],
    },
    Prophet: {
      alignment: "Independent",
      tags: ["Guess", "Day", "Night", "Basic"],
      description: [
        "Once per game, predicts which day/night cycle the game will end on.",
        "Wins if guess is correct.",
      ],
    },
    Fatalist: {
      alignment: "Independent",
      tags: ["Guess", "Death", "Expert"],
      description: [
        "Once per game, predicts which day/night cycle they will be killed on.",
        "Wins if guess is correct.",
      ],
    },
    Fumigator: {
      alignment: "Independent",
      tags: ["Neighbors", "Death", "Basic"],
      description: ["Wins if both of their starting neighbors are dead."],
      SpecialInteractions: {
        "Blood Moon": [
          "During the Blood Moon Event, Fumigator Wins if one of their neighbors is killed.",
        ],
      },
    },
    Doppelgänger: {
      alignment: "Independent",
      tags: ["Conversion", "Basic"],
      description: [
        "At Night chooses a player.",
        "Will instantly convert to that player's role.",
        "Cannot win the game as Doppelgänger.",
      ],
    },
    "Vengeful Spirit": {
      alignment: "Independent",
      tags: ["Killing", "Graveyard", "Visiting", "Advanced"],
      description: [
        "If murdered by another player, gains the ability to kill each night from the graveyard.",
        "Does not gain the ability if condemned by village vote.",
        "Wins if they kill all of their murderers.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT + 1)]],
      graveyardParticipation: "self",
    },
    Phantom: {
      alignment: "Independent",
      tags: ["Killing", "Conversion", "Visiting", "Basic"],
      description: [
        "Chooses a player to kill once during the night and convert to their role.",
        "The killed player will have their role hidden upon death, and instead reveal as their alignment.",
        "Cannot win the game as Phantom.",
      ],
       nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT)]],
    },
    Prince: {
      alignment: "Independent",
      tags: ["Essential", "Alignment", "Visiting", "Advanced"],
      description: [
        "Once per game, visits a player and joins their alignment.",
        "If the Prince dies, everyone of that alignment dies.",
        "Wins if their chosen alignment wins.",
      ],
      nightOrder: [["Conquer Alignment",(PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT)]],
    },
    Nomad: {
      alignment: "Independent",
      tags: ["Alignments", "Visiting", "Basic"],
      description: [
        "Must visit another player every night.",
        "Cannot choose the same player consecutively.",
        "Wins if they are alive when the last player they visited wins.",
      ],
      nightOrder: [["Become Alignment",(PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT)]],
    },
    Hitchhiker: {
      alignment: "Independent",
      tags: ["Alignments", "Visits", "Delirium", "Reflexive", "Advanced"],
      description: [
        "Each Night Will make one of their visitors Delirious.",
        "Will Switch to that player's alignment.",
        "Wins with their current Alignment.",
      ],
      nightOrder: [["Become Alignment of Visitor",(PRIORITY_BLOCK_VISITORS - 1)]],
    },
    "Creepy Girl": {
      alignment: "Independent",
      tags: ["Kill Interaction", "Items", "Advanced"],
      description: [
        "Can give out one doll at night",
        "The doll can be passed to someone else each night.",
        "Wins if the player holding the doll dies.",
      ],
      nightOrder: [["Give Doll",(PRIORITY_ITEM_GIVER_DEFAULT)]],
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
        "Hostile",
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
      tags: ["Killing", "Visits", "Reflexive", "Advanced"],
      description: [
        "Beckons a player each night.",
        "If the beckoned player visits the Siren that night, the player dies.",
        "Wins if successfully kills two players.",
      ],
      nightOrder: [["Kill Beckoned",(PRIORITY_KILL_SIREN)]],
    },
    "Gingerbread Man": {
      alignment: "Independent",
      tags: ["Survivor", "Visits", "Extra Lives", "Visiting", "Basic"],
      description: [
        "Each night, hides behind a player and becomes immune to death.",
        "Will get eaten if the player visits them. That player will gain an extra life.",
        "Wins if alive at the end of the game.",
      ],
      nightOrder: [["Hide Behind Player",(PRIORITY_NIGHT_SAVER)]],
    },
    Astrologer: {
      alignment: "Independent",
      tags: ["Linked", "Survivor", "Visiting", "Advanced"],
      description: [
        "Chooses two players and makes them fall in love with each other.",
        "Wins if their chosen lovers are alive at the end of the game.",
      ],
      nightOrder: [["Make players in love.",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Grouch: {
      alignment: "Independent",
      tags: ["Mafia", "Cult", "Survivor", "Vanilla", "Basic"],
      description: ["Wins if alive when Village loses."],
    },
    Sidekick: {
      alignment: "Independent",
      tags: ["Linked", "Independent", "Basic"],
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
      tags: ["Independent", "Basic"],
      description: ["Wins if they are the sole remaining Independent player."],
    },
    Monk: {
      alignment: "Independent",
      tags: [
        "Voting",
        "Protective",
        "Visiting",
        "Basic",
      ],
      description: [
        "Has no voting power.",
        "Each night, can save one player and also grant them condemn immunity the following day.",
        "Wins from two saves, or if no deaths happen in 2 days and 2 nights.",
      ],
      nightOrder: [["Protect Player",(PRIORITY_NIGHT_SAVER)]],
    },
    Warlock: {
      alignment: "Independent",
      tags: ["Voting", "Condemn", "Extra Lives", "Visiting", "Guess", "Basic"],
      description: [
        "Each night chooses one person.",
        "If that person is condemned the next day, the Warlock has predicted correctly. They gain an extra life.",
        "The Warlock wins if they predict the condemnation correctly twice.",
      ],
      nightOrder: [["Guess Vote",(0)]],
      SpecialInteractions: {
        Assassin: [
          "If an Assassin is Present, The Warlock wins if they can guess a player who is Elected as Room Leader Twice.",
        ],
        "Blood Moon": [
          "During the Blood Moon Event, The Warlock wins if they predict the condemnation correctly Once.",
        ],
      },
    },
    Rival: {
      alignment: "Independent",
      tags: ["Linked", "Setup Changes", "Basic"],
      description: [
        "Wins if they survive and all other rivals are dead.",
        "Adds 1 Rival in closed setups.",
      ],
    },
    Picciotto: {
      alignment: "Independent",
      tags: ["Mafia", "Conversion", "Visiting", "Expert"],
      description: [
        "Every night, can visit a player.",
        "If that player is mafia, the Picciotto will be notified.",
        "When the Picciotto has visited all the living mafia, they are converted into a random mafia.",
        "Does not win if not converted to mafia.",
      ],
      nightOrder: [["Visit",(PRIORITY_KILL_DEFAULT)]],
      RolesMadeBy: ["All Mafia Roles"],
    },
    Angel: {
      alignment: "Independent",
      tags: ["Protective", "Graveyard", "Sacrificial", "Basic"],
      graveyardParticipation: "self",
      description: [
        "Will become the guardian angel for one player in the game.",
        "Once per game while alive or dead, can turn on sacrificial powers and protect their target from all kills",
        "Wins if their target is alive at the end of the game.",
      ],
      nightOrder: [["Protect Player",(PRIORITY_NIGHT_SAVER)]],
    },
    Emperor: {
      alignment: "Independent",
      tags: ["Voting", "Condemn", "Visiting", "Basic"],
      description: [
        "Chooses two players each night to force into a duel.",
        "During the following day, only the two duelists may be voted.",
        "Must predict which duelist will survive.",
        "Wins if they predict correctly twice.",
      ],
       nightOrder: [["Duel",(PRIORITY_EFFECT_GIVER_DEFAULT + 1)]],
    },
    Magus: {
      alignment: "Independent",
      tags: ["Magus", "Setup Changes", "Village", "Visiting", "No Investigate", "Expert"],
      description: [
        "If a Magus is present, no Evil roles will be present in the game.",
        "At night, the Magus will passively and randomly kill players and use abilities of Evil roles that can spawn in the setup.",
        "Upon death, the Magus has a suit as a random Evil role from the setup.",
        "Information is arbitrary if a Magus is present",
        "If Village declares Magus Game and a Magus is not present, all Village-aligned players die.",
        "Village must declare a Magus game to win if a Magus is present.",
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
        "Advanced",
      ],
      description: [
        "Meets with All Independents",
        "Grants All Independents a random Infomation or Role Swapping ability.",
        "Wins if Independents have majority.",
      ],
      nightOrder: [["Give Superpower",(PRIORITY_INVESTIGATIVE_DEFAULT)], ["Swap Roles", (PRIORITY_SWAP_ROLES - 1)]],
      SpecialInteractions: {
        "Blood Moon": [
          "During the Blood Moon Event, Superheros Wins if no Independents die and non-Lone Independents are counted as an Evil Faction for Village.",
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
      tags: ["Killing", "Must Act", "Last Two", "Visiting", "Hostile", "Basic"],
      description: [
        "Must kill a player each night.",
        "Wins if among last two alive.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT + 1)]],
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
        "Advanced",
      ],
      description: [
        "Falls in love with another player once per game.",
        "The beloved will not be alerted. If the beloved dies, the Yandere dies. If the Yandere dies, the beloved will not die.",
        "Must kill a player each night.",
        "Wins if the Yandere and their beloved are the last two alive.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT + 1)], ["Fall in love",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Clockmaker: {
      alignment: "Independent",
      tags: ["Killing", "Alignment", "Extra Lives", "Visiting", "Hostile", "Advanced"],
      description: [
        "Has a clock that starts at 6 o'clock.",
        "Choosing to kill a player each night changes the time based on that player's alignment.",
        "Clock goes up by 1 hour for village, 2 hours for Mafia or Cult, and down by 3 hours for Independent.",
        "Dies instantly at 3 o'clock.",
        "Gains an extra life at 9 o'clock.",
        "Wins when clock strikes 12 o'clock.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT + 1)]],
    },
    Pyromaniac: {
      alignment: "Independent",
      tags: ["Killing", "Gasoline", "Last Two", "Visiting", "Hostile", "Basic"],
      description: [
        "Douses one player with Gasoline each night.",
        "Chooses to light a match during the day to burn doused players to ashes.",
        "Wins if among last two alive.",
      ],
      nightOrder: [["Douse In Gasoline",(PRIORITY_EFFECT_GIVER_DEFAULT - 1)]],
    },
    Dentist: {
      alignment: "Independent",
      tags: ["Killing", "Visits", "Last Two", "Visiting", "Hostile", "Basic"],
      description: [
        "Gasses one player with anesthetic each night.",
        "If that player acts the next night, they die.",
        "Anesthetic attack can be cured by not acting.",
        "Wins if among last two alive.",
      ],
       nightOrder: [["Gas Player",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Egg: {
      alignment: "Independent",
      tags: ["Hostile", "Conversion", "Advanced"],
      description: [
        "At night may choose to convert to a Independent role that can spawn in the setup.",
        "If the selected role is already in play, The player with that role will be converted to Amnesiac.",
        "Cannot win the game as Egg.",
      ],
      nightOrder: [["Become Role and Convert players to Amnesiac",(PRIORITY_NIGHT_ROLE_BLOCKER)]],
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
        "Advanced",
      ],
      description: [
        "Chooses to hunt at night by choosing a player and guessing their role.",
        "If guessed correct, becomes immortal for the following day.",
        "If guessed incorrect, identity will be revealed to all.",
        "Wins if Hellhounds outnumber all other living parties.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_GUESS_ROLE)]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Goofy",
          value: "goofy",
          achCount: 7,
        },
        {
          label: "Old",
          value: "old",
          achReq: "Mafia25",
        },
      ],
    },
    Shinigami: {
      alignment: "Independent",
      tags: ["Killing", "Items", "Visiting", "Hostile", "Advanced"],
      description: [
        "At the beginning of the game, one player randomly receives a notebook.",
        "That player can kill during the night.",
        "The holder of the notebook must pass it to another player each day.",
        "The Shinigami guesses the current holder of the notebook each night. If they guess correctly once, they win.",
      ],
      nightOrder: [["Guess Book Holder",(PRIORITY_ITEM_TAKER_DEFAULT)]],
    },
    Ripper: {
      alignment: "Independent",
      tags: ["Killing", "Independent", "Visiting", "Hostile","Advanced"],
      description: [
        "Kills one player every night.",
        "Wins when all other Hostile Independents are dead.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT + 1)]],
    },
    Blob: {
      alignment: "Independent",
      tags: [
        "Killing",
        "Graveyard",
        "Extra Lives",
        "Last Two",
        "Clean",
        "Visiting",
        "Hostile",
        "Advanced",
      ],
      description: [
        "Absorbs one person each night, killing them and cleaning their deaths.",
        "Absorbed players may speak amongst themselves inside of the Blob.",
        "For each absorbed player, the Blob gains an extra life.",
        "Upon death, everyone absorbed by the Blob is regurgitated.",
        "Wins if among the last two alive.",
      ],
       nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT + 1)]],
      graveyardParticipation: "all",
    },
    "Grey Goo": {
      alignment: "Independent",
      tags: ["Killing", "Last Two", "Conversion", "Visiting", "Hostile","Advanced"],
      description: [
        "Chooses to sacrifice self at night to convert another player to Grey Goo.",
        "Wins if a Grey Goo is in the last two alive.",
      ],
      nightOrder: [["Convert and Die",(PRIORITY_CONVERT_DEFAULT+5)]],
    },
    Mastermind: {
      alignment: "Independent",
      tags: ["Mafia", "Cult", "Meeting", "AnonymizeMeeting", "Hostile", "Advanced"],
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
        "Advanced",
      ],
      description: [
        "Meets with the Mafia and Cult, makes their night meeting anonymous.",
        "Each night, chooses a player. If the player is sided with the mafia/cult, they become a Mafioso/Cultist.",
        "Wins when all mafia-aligned players are Mafiosos or all cult-aligned players are Cultists.",
      ],
      nightOrder: [["Convert",(PRIORITY_CONVERT_DEFAULT+8)]],
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
        "Advanced",
      ],
      description: [
        "Can kill one player per night.",
        "Appears as Mafia on investigation.",
        "Attends Mafia and Cult meetings, makes them anonymous and cannot vote in them.",
        "Wins if alive alone or the final two, and the other is not a mafia or cult",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT + 1)]],
    },
    Alien: {
      alignment: "Independent",
      tags: ["Probe", "Visiting", "Hostile","Advanced"],
      description: [
        "Chooses one player to probe each night.",
        "Wins if all players left alive have been probed.",
      ],
      nightOrder: [["Probe",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Matchmaker: {
      alignment: "Independent",
      tags: ["Linked", "Alignment", "Visiting", "Hostile","Advanced"],
      description: [
        "Each night chooses two players to go on a date. If they are the same alignment, the date will be succesful.",
        "Wins if all players left alive have went on a successful date.",
      ],
      nightOrder: [["Matchmaker",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Tofurkey: {
      alignment: "Independent",
      tags: ["Famine", "Alignment", "Survivor", "Hostile","Advanced"],
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
      tags: ["Famine", "Alignment", "Survivor", "Hostile","Advanced"],
      description: [
        "The game begins with a famine, with each player starting with four bread.",
        "Turkeys are immune to the famine.",
        "If a Turkey dies, each remaining player gets one meal.",
        "Wins if they survive to the end of the game and everyone else dies of famine.",
      ],
    },
    Leprechaun: {
      alignment: "Independent",
      tags: ["Items", "Killing", "Visiting", "Hostile", "Advanced"],
      description: [
        "When present in the game, four-leaf clovers are randomly assigned to players.",
        "Each night, steals a random item from their target, preferentially stealing Clovers.",
        "If it finds another Leprechaun, will kill them and steal all their items.",
        "Wins if holding three four-leaf clovers.",
      ],
      nightOrder: [["Steal Items",(PRIORITY_ITEM_TAKER_DEFAULT)]],
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
        "Advanced",
      ],
      description: [
        "Gives out a timebomb each night.",
        "The timebomb can be passed around during the day, randomly exploding.",
        "Wins if 3 players are killed by the timebomb, or if the Anarchist is among the last two alive.",
        "Timebomb reveals Anarchist when exploded on themself.",
      ],
      nightOrder: [["Give Timebomb",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Communist: {
      alignment: "Independent",
      tags: ["Conversion", "Vanilla", "Visiting", "Hostile", "Basic"],
      description: [
        "Meets with other Communists at night.",
        "Visits one player each night.",
        "Turns that player into their alignment's vanilla role.",
        "Wins if alive when all other players are vanilla.",
      ],
      nightOrder: [["Convert to Vanilla",(PRIORITY_CONVERT_DEFAULT+8)]],
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
        "Advanced",
      ],
      description: [
        "Gives out a revolver each night.",
        "6 chambers in the barrel, one of them has a bullet.",
        "During the day a player can either choose to pull the trigger or spin the barrel.",
        "If the chamber is empty, they pass the revolver to player below them. If the chamber is full, the shooter is hit.",
        "Wins if 3 players are killed by the revolver, or if the Dragoon is among the last two alive.",
        "Revolver reveals Dragoon when shooting on themself.",
      ],
      nightOrder: [["Give Revolver",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Gambler: {
      alignment: "Independent",
      tags: ["Killing", "Last Two", "Mini-Game", "Visiting", "Hostile", "Advanced"],
      description: [
        "Each night, challenges a player to a game of Rock, Paper, Scissors. Game is played during the day.",
        "If the Gambler wins, the Challenger dies.",
        "Wins the game when they have 2 gamble wins, or are among the last two standing.",
      ],
      nightOrder: [["Gamble",(0)]],
    },
    "Grizzly Bear": {
      alignment: "Independent",
      tags: ["Killing", "Last Two", "Visits", "Visiting", "Hostile", "Advanced"],
      description: [
        "Visits one player each night.",
        "Any player to visit the Grizzly Bear's target will be killed. If the Grizzly Bear's target does not visit that night, they will be killed as well.",
        "Wins if among last two alive.",
      ],
      nightOrder: [["Kill Visitors",(PRIORITY_KILL_DEFAULT + 1)]],
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
        "Advanced",
      ],
      description: [
        "Meets with other Polar Bears at night.",
        "Visits two players each night, polarising them.",
        "A polarised player visiting another polarised player will kill both of them.",
        //"If visited by a Penguin, will eat it.",
        "Wins if four polarised players die or if majority is attained.",
      ],
      nightOrder: [["Polarize",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
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
        "Advanced",
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
      nightOrder: [["Start Duel",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Snowman: {
      alignment: "Independent",
      tags: ["Items", "Mini-Game", "Hostile", "Advanced"],
      description: [
        "Each night, may declare a snowball fight.",
        "Half of all players will receive a snowball.",
        "Throwing a snowball at someone freezes them.",
        "A frozen player cannot vote or take any action at night. To be unfrozen, they must be visited by another player.",
        "Wins if all living players have been frozen.",
      ],
       nightOrder: [["Snowballs",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Judge: {
      alignment: "Independent",
      tags: ["Speaking", "Voting", "Meeting", "Dusk", "Hostile", "Advanced"],
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
      tags: ["Speaking", "Redirection", "Control", "Visiting", "Hostile", "Advanced"],
      description: [
        "Attaches strings to a player each night and learn their role.",
        "Can redirect all players with attached strings at night.",
        "Wins among the last two standing.",
      ],
      nightOrder: [["Control Players",(PRIORITY_REDIRECT_ACTION)], ["Attach Strings",(0)] ],
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
      tags: ["Event", "Items"],
      description: [
        "If this Event occurs, one random player will be given a Gun.",
      ],
      nightOrder: [["Give Gun",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Moonshine: {
      alignment: "Event",
      tags: ["Event", "Items"],
      description: [
        "If this Event occurs, one random player will be given Whiskey.",
      ],
      nightOrder: [["Give Whiskey",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    "Ominous Warning": {
      alignment: "Event",
      tags: ["Event", "Items"],
      description: [
        "If this Event occurs, one random player will be given a Knife.",
      ],
      nightOrder: [["Give Knife",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Vaccination: {
      alignment: "Event",
      tags: ["Event", "Items"],
      description: [
        "If this Event occurs, one random player will be given a Syringe.",
      ],
      nightOrder: [["Give Syringe",(PRIORITY_ITEM_GIVER_DEFAULT)]],
      graveyardParticipation: "all",
    },
    "Haunted House": {
      alignment: "Event",
      tags: ["Event", "Items"],
      description: [
        "If this event occurs, One player receives a Haunted Mask.",
        "Only the player with the Haunted Mask is informed if this event occurs.",
        "Players being attacked are prioritized for receiving the Mask.",
        "If a player with a Haunted Mask is attacked. They will kill their attacker and steal their identity.",
      ],
      nightOrder: [["Give Haunted Mask",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Evolution: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "Can only occur if an alive player has a Vanilla role.",
        "If this Event occurs, one random player with a Vanilla role will be converted to a random role from their alignment.",
      ],
      nightOrder: [["Evolve Player",(PRIORITY_BECOME_DEAD_ROLE)]],
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
       nightOrder: [["Give Brain Blast",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    "Cave-In": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all players will be blocked and forced to vote on a player to kill and eat during the Night.",
      ],
      nightOrder: [["Kill and eat",(PRIORITY_KILL_DEFAULT)]],
    },
    Feast: {
      alignment: "Event",
      tags: ["Event"],
      description: ["If this Event occurs, All Players gain food."],
       nightOrder: [["Give Bread",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    Famine: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, All Players lose food if they have no food to lose they die.",
        "If this Event is in a setup, All players start with 1 Food.",
      ],
      nightOrder: [["Kill",(PRIORITY_KILL_DEFAULT)]],
    },
    Eclipse: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all speech and votes are anonymous.",
      ],
      nightOrder: [["Blind",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Noir",
          value: "noir",
        },
      ],
    },
    Fog: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, players can only see there neighbors messages.",
      ],
       nightOrder: [["Semi-Blind",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    "Mass Hysteria": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all are Frustrated for 1 day.",
        "Frustrated players cannot be condemned by majority vote. A non-zero minority vote will kill a frustrated player.",
      ],
      nightOrder: [["Make Frustrated",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    "Mail-In Ballots": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, players can not switch votes.",
      ],
      nightOrder: [["Apply disable vote switching effect",(PRIORITY_EFFECT_GIVER_DEFAULT)]],
    },
    Flood: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, All players will be blocked during the night.",
      ],
      nightOrder: [["Block Players",(PRIORITY_FULL_DISABLE+3)]],
    },
    Sabbath: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, No one will die at night.",
      ],
      nightOrder: [["Protect Players",(PRIORITY_FULL_DISABLE+3)]],
    },
    "Sensible Mood": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, 1-3 Players learn if their role changed.",
      ],
      nightOrder: [["Tell about role",(PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5)]],
    },
    "Culture Exchange": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, One player gains the ability to role share today.",
      ],
       nightOrder: [["Give Role Share Powers",(PRIORITY_ITEM_GIVER_DEFAULT)]],
    },
    "Lightning Strike": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all Players gain Kites.",
        "Kites can be used to kill a random player with the same alignment as the user.",
      ],
       nightOrder: [["Give Kites",(PRIORITY_ITEM_GIVER_DEFAULT)]],
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
    "Blood Moon": {
      alignment: "Event",
      tags: ["Event", "Game Ender"],
      description: [
        "If this Event Occurs, The game will end the following day.",
        "If all Mafia survive, Mafia wins.",
        "If all Cult survive, Cult wins.",
        "If at least 1 member from each Evil faction is killed, Village Wins.",
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
      nightOrder: [["Give Necronomicon",(PRIORITY_ITEM_GIVER_DEFAULT)]],
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
    
    Tristan: {
      alignment: "Resistance",
      tags: ["None"],
      description: [
        "Knows who is Isolde.",
        "If the Rebels would win, the spies can guess who Tristan and Isolde are to win instead.",
        "If Spies choose to guess who Tristan and Isolde are their guess for Merlin will not count.",
      ],
    },
    Isolde: {
      alignment: "Resistance",
      tags: ["None"],
      description: [
        "Knows who is Tristan.",
        "If the Rebels would win, the spies can guess who Tristan and Isolde are to win instead.",
        "If Spies choose to guess who Tristan and Isolde are their guess for Merlin will not count.",
      ],
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
    Assassin: {
      alignment: "Spies",
      tags: ["None"],
      description: [
        "Will be the only player to guess Merlin or Tristan and Isolde."
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

    Host: {
      alignment: "Host",
      tags: ["None"],
      description: ["Facilitates the game."],
    },
  },
};

module.exports = roleData;
