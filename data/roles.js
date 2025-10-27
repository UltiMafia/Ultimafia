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

  PRIORITY_BLOCK_EARLY,

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

  PRIORITY_ITEM_GIVER_EARLY,
  PRIORITY_EFFECT_GIVER_EARLY,
  PRIORITY_ITEM_TAKER_EARLY,
  PRIORITY_EFFECT_REMOVER_EARLY,

  PRIORITY_PREKILL_ACTION,

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

  PRIORITY_KILL_EXORCISE,

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

const MalEffects =
  "Malicious effects include poison, bleeding, insanity, polarization, gasoline, anesthetic gas, lovesick, zombification, alcoholism, lycanthropy, and viruses.";

//Effect Def
const bleedingDef = `Players who are "Bleeding" will die during the next night.`;
const deliriumDef = `Players who are "Delirious" will only learn false information with their abilities and will have their non-information abilities disabled.`;
const leakyDef = `Players who are "Leaky" will have all whispers involving them leak.`;
const blindDef = `Players who are "Blind" will see all speech as anonymous and cannot see votes.`;
const purblindDef = `Players who are "Purblind" cannot see votes.`;
const jinxDef = `Players who are "Jinxed" with a word, will die if they say that word.`;
const poisonDef = `Players who are "Poisoned" will die during the next night.`;
const muffledDef = `Players who are "Muffled" can only speak in whispers.`;
const coldfeetDef = `Players who have "Cold Feet" towards another player, will die if they vote that player.`;
const deafDef = `Players who are "Deaf" cannot read messages.`;
const silentDef = `Players who are "Silent" will be unable to send messages.`;
const cluelessDef = `Players who are "Clueless" will see messages as being sent from random players.`;
const sealedDef = `Players who are "Sealed" cannot send or receive whispers.`;
const paralyzedDef = `Players who are "Paralyzed" cannot switch votes.`;
const alcoholicDef = `Players who are "Alcoholic" will randomly visit one non-Mafia player each night and block their night actions.`;
const infectDef = `Players who are "Infected" will be converted to Zombie during the next night.`;
const hexDef = `Players who are "Hexed" with a word, will be converted to Cultist if they say that word.`;
const lycanthropicDef = `Players who are "Lycanthropic" will randomly visit one non-Cult player on even nights and kill them.`;
const plagueDef = `Players who are "Plagued" will make their neighbors "Plagued" each night. Players who have been "Plagued" for 2 nights will die.`;
const madDef = `Players who are "Mad" about a role, must say the role's name or they will become the target of the condemnation.`;
const insaneDef = `Players who are "Insane" cannot vote and can only speak gibberish.`;
const infestedDef = `Players who are "Infested" with a role will convert to that role with the Transcendent modifier added if condemned.`;
const gassedDef = `Players who are "Gassed" will die during the next night if they visit another player.`;
const polarisedDef = `Players who are "Polarised" will die if they visit or get visited by another "Polarised".`;
const frozenDef = `Players who are "Frozen" cannot vote or will have their night actions blocked. If a "Frozen" player is visited, they will stop being "Frozen".`;
const foggyDef = `Players who are "Foggy" can only see their neighbors messages.`;
const lovesickDef = `Players who are "Lovesick" for another player, will die if that player dies.`;

//Item Def
const coffeeDef = `Coffee can be used at night to perform their role's night actions an additional time.`;
const breadDef = `Bread is consumed during a famine to prevent death.`;
const armorDef = `Armor will protect its holder from one attack.`;
const candleDef = `A Candle will tell its holder who visited them during the night.`;
const knifeDef = `A Knife can be used during the day to make a selected player start "Bleeding".`;
const bombDef = `If a Bomb's holder is killed, their killer is killed.`;
const keyDef = `A Key can be used at night to block the actions of anyone visits them.`;
const shieldDef = `A Shield can be used at night to redirect kills targeting the holder on to a random player of the same alignment, if possible..`;
const whiskeyDef = `Whiskey can be used during the day to block a selected player's actions next night.`;
const crystalDef = `Crystal Ball allows its holder to select a player each night. If the holder dies, the last selected player will be revealed.`;
const falconDef = `A Falcon can be used at night to learn who a selected player visits.`;
const tractDef = `A Tract will prevent its holder from being converted one time.`;
const gunDef = `A Gun can be used during the day to kill a selected player.`;
const rifleDef = `A Rifle can be used during the day to kill a selected player. If a "Rifle" kills a player of same alignment as its holder, its holder dies. If a "Rifle" kills a player of diffrent alignment to its holder, its holder is given a Rifle.`;
const needleDef = `A Syringe can be used during the day to revive a selected dead player.`;
const envelopeDef = `An Envelope can be used at night to send a message to a selected player.`;
const orangeDef = `An Orange can be used during the day to meet with Capybaras at night. When meeting with Capybaras no night actions can be performed.`;
const shavingCreamDef = `Shaving Cream can be used at night to make two selected players swap roles but not alignments. A switch fails if one of the players is an Independent role.`;
const sceptreDef = `A Sceptre can be used during the day to gain 10000 voting power.`;
const timeBombDef = `A Timebomb can be passed around during the day, it will explode after 10-30 seconds.`;
const revolverDef = `A Revolver has 6 chambers one of which has full. A Revolver must be used during the day to fire the selected chamber or a random chamber. Then pass it to another player if the chamber was empty or die if the chamber was full.`;
const snowballDef = `Snowballs can be used during the day to make a player "Frozen".`;

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
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Halloween",
          value: "halloween",
        },
      ],
    },
    Bleeder: {
      alignment: "Village",
      category: "Basic",
      tags: ["Kill Interaction", "Basic", "Malicious Effects"],
      description: [
        `If killed, the Bleeder will survive and start "Bleeding"`,
        bleedingDef,
        //`Players who are "Bleeding" will die during the next night.`,
        //"Will die one day after being targeted for a kill or shot.",
      ],
    },
    Celebrity: {
      alignment: "Village",
      category: "Basic",
      tags: ["Exposed", "Basic"],
      description: ["Starts revealed to all players."],
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
        "Each night, blocks the night actions of any players who visit them.",
        //"Blocks any player who visits them during the night from performing any actions.",
      ],
      nightOrder: [["Block Visitors", PRIORITY_BLOCK_VISITORS]],
    },
    Deputy: {
      alignment: "Village",
      category: "Basic",
      tags: ["Items", "Basic", "Killing", "Gun", "Day Actions"],
      description: [
        "Starts with a gun.",
        "This gun never reveals the deputy when shot.",
      ],
      SpecialInteractionsModifiers: {
        Loyal: [
          "Gun will do nothing when shooting players of a diffrent alignment.",
        ],
        Disloyal: [
          "Gun will do nothing when shooting players of the same alignment.",
        ],
        Holy: ["Gun will do nothing when shooting players with Demonic roles."],
        Unholy: [
          "Gun will do nothing when shooting players with non-Demonic roles.",
        ],
        Simple: [
          "Gun will do nothing when shooting players with Vanilla Roles.",
        ],
        Complex: ["Gun will do nothing when shooting players with PR Roles."],
        Refined: [
          "Gun will do nothing when shooting players with Banished Roles.",
        ],
        Unrefined: [
          "Gun will do nothing when shooting players with non-Banished Roles.",
        ],
        Vain: ["Will die when shooting players of the same alignment."],
        Weak: ["Will die when shooting players of a diffrent alignment."],
        Sacrificial: ["Will die when shooting the gun."],
        Regretful: ["Will die when killing a player with the gun."],
        Random: ["Gun will shoot a Random player when used."],
        Narcissistic: ["Gun will have 50% chance to self target when used."],
      },
    },
    Loudmouth: {
      alignment: "Village",
      category: "Basic",
      tags: ["Reflexive", "Basic", "Information", "Whispers"],
      description: [
        "Each night, will announce who visits them at night.",
        "Each night, will announce any system messages they receive",
        //"When visited, will announce the name of their visitors.",
        `Starts the game "Leaky"`,
        leakyDef,
      ],
      nightOrder: [
        ["Announce Visitors", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 3],
      ],
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
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Halloween",
          value: "halloween",
        },
      ],
      SpecialInteractions: {
        Ghost: ["If a Ghost is Present, a Miller will learn a fake word."],
      },
    },
    "Party Host": {
      alignment: "Village",
      category: "Basic",
      tags: ["Meetings", "Basic"],
      description: [
        "Once per game during the day, can choose to host a party at night.",
        "During a party all players can chat at night.",
      ],
    },
    Sapling: {
      alignment: "Village",
      category: "Basic",
      tags: ["Basic", "Voting", "Kill Interaction", "Condemn Interaction"],
      description: [
        "Once per game at night, can choose to grow into a Tree.",
        "Trees are immune to most ways of dying.",
        "Trees cannot vote.",
      ],
      nightOrder: [["Become Tree", PRIORITY_NIGHT_SAVER]],
    },
    Sheriff: {
      alignment: "Village",
      category: "Basic",
      tags: ["Items", "Basic", "Killing", "Gun", "Day Actions"],
      description: [
        "Starts with a gun.",
        "This gun always reveals the sheriff when shot.",
      ],
      SpecialInteractionsModifiers: {
        Loyal: [
          "Gun will do nothing when shooting players of a diffrent alignment.",
        ],
        Disloyal: [
          "Gun will do nothing when shooting players of the same alignment.",
        ],
        Holy: ["Gun will do nothing when shooting players with Demonic roles."],
        Unholy: [
          "Gun will do nothing when shooting players with non-Demonic roles.",
        ],
        Simple: [
          "Gun will do nothing when shooting players with Vanilla Roles.",
        ],
        Complex: ["Gun will do nothing when shooting players with PR Roles."],
        Refined: [
          "Gun will do nothing when shooting players with Banished Roles.",
        ],
        Unrefined: [
          "Gun will do nothing when shooting players with non-Banished Roles.",
        ],
        Vain: ["Will die when shooting players of the same alignment."],
        Weak: ["Will die when shooting players of a diffrent alignment."],
        Sacrificial: ["Will die when shooting the gun."],
        Regretful: ["Will die when killing a player with the gun."],
        Random: ["Gun will shoot a Random player when used."],
        Narcissistic: ["Gun will have 50% chance to self target when used."],
      },
    },
    Sleepwalker: {
      alignment: "Village",
      tags: ["Visiting", "Basic"],
      category: "Basic",
      description: ["Each night, randomly visits one player."],
      nightOrder: [["Visit", PRIORITY_SUPPORT_VISIT_DEFAULT]],
      SpecialInteractions: {
        Ghost: ["If a Ghost is Present, a Sleepwalker will learn a fake word."],
      },
    },
    //protective roles
    Bawd: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Delirium", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit two players and protect them from death.",
        `One of the players the Bawd protects will become “Delirious” until the next night.`,
        deliriumDef,
      ],
      nightOrder: [
        ["Protect and Make Delirious", PRIORITY_NIGHT_ROLE_BLOCKER + 2],
      ],
    },
    Bodyguard: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Killing", "Self Kill", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and protect them from being killed.",
        "If the player the Bodyguard protects is attacked, the Bodyguard will kill one attacker and die.",
        //"If the target was the Celebrity, the Bodyguard will kill all attackers and die.",
      ],
      nightOrder: [
        ["Protect", PRIORITY_NIGHT_SAVER],
        ["Kill Attacker", PRIORITY_KILL_DEFAULT],
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
      tags: ["Protective", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and protect them from death.",
      ],
      nightOrder: [["Protect", PRIORITY_NIGHT_SAVER]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Halloween",
          value: "halloween",
        },
      ],
    },
    Soprano: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Visiting", "Basic", "Killing"],
      description: [
        "Each night, can choose to visit one player and protect them from death.",
        "If the Soprano dies, the player they most recently protected will die.",
      ],
      nightOrder: [["Protect", PRIORITY_NIGHT_SAVER]],
    },
    Martyr: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Condemn Interaction", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and protect them from being condemned the following day.",
        "If the player the Martyr protects is condemned, the Martyr dies.",
      ],
      nightOrder: [["Protect from Condemn", PRIORITY_NIGHT_SAVER]],
    },
    Medic: {
      alignment: "Village",
      category: "Protective",
      tags: ["Kill Interaction", "Extra Lives", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit two players.",
        `If the first player the Medic visits dies, the second player the Medic visits will become gain an extra life.`,
      ],
      nightOrder: [["Give Extra Life", PRIORITY_NIGHT_SAVER]],
    },
    Nurse: {
      alignment: "Village",
      category: "Protective",
      tags: ["Malicious Effects", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and remove any malicious effects they have.",
        MalEffects,
      ],
      nightOrder: [
        ["Remove Effects (after kills)", PRIORITY_EFFECT_REMOVER_DEFAULT],
        ["Remove Effects", PRIORITY_EFFECT_REMOVER_EARLY],
      ],
    },
    Resurrectionist: {
      alignment: "Village",
      category: "Protective",
      tags: ["Revive", "Graveyard", "Visiting", "Dead", "Basic"],
      description: [
        "Each night, can choose to visit one dead player and revive them.",
        //"If player was revealed upon death, they will remain revealed when revived.",
      ],
      nightOrder: [["Revive", PRIORITY_NIGHT_REVIVER]],
      graveyardParticipation: "all",
    },
    Shrink: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Conversion", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and prevent them from being converted to another role.",
        "If a Shrink visits a Hostile Independent, the Hostile Independent will be converted to Villager.",
      ],
      nightOrder: [["Save from Conversion", PRIORITY_NIGHT_SAVER - 1]],
      RolesMadeBy: ["Villager"],
    },
    Surgeon: {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Killing", "Kill Interaction", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and protect them from death.",
        "If the player the Surgeon protects is attacked, the Surgeon will kill one attacker.",
      ],
      nightOrder: [
        ["Protect", PRIORITY_NIGHT_SAVER],
        ["Kill Attacker", PRIORITY_KILL_DEFAULT],
      ],
    },
    "Tea Lady": {
      alignment: "Village",
      category: "Protective",
      tags: ["Protective", "Neighbors", "Position", "Advanced"],
      description: [
        "If both of the Tea Lady's neighbors are not Evil, the neighbors cannot die.",
      ],
    },
    //gifting roles
    Barista: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Items", "Coffee", "Visiting", "Advanced"],
      description: [
        `Each night, can choose to visit one player and give them Coffee.`,
        coffeeDef,
      ],
      nightOrder: [["Give Coffee", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Baker: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Famine", "Items", "Bread", "Visiting", "Advanced"],
      description: [
        //"When baker is present in the game, all players start with two breads. A famine will start.",
        `Each night, can choose to visit two players and give them Bread.`,
        breadDef,
        //"Bread is consumed each night, staving off the famine for another phase. Running out will eventually starve the player to death.",
      ],
      nightOrder: [["Give Bread", PRIORITY_ITEM_GIVER_EARLY]],
    },
    Blacksmith: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Protective", "Items", "Armor", "Visiting", "Basic"],
      description: [
        `Each night, can choose to visit one player and give them Armor.`,
        armorDef,
      ],
      nightOrder: [["Give Armor", PRIORITY_ITEM_GIVER_EARLY]],
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
        `Each night, can choose to visit one player and give them a Candle.`,
        candleDef,
      ],
      nightOrder: [["Give Candle", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Cutler: {
      alignment: "Village",
      category: "Gifting",
      tags: [
        "Items",
        "Knife",
        "Killing",
        "Visiting",
        "Day Actions",
        "Malicious Effects",
        "Advanced",
      ],
      description: [
        `Each night, can choose to visit one player and give them a Knife.`,
        knifeDef,
        bleedingDef,
      ],
      nightOrder: [["Give Knife", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Demolitionist: {
      alignment: "Village",
      category: "Gifting",
      tags: [
        "Items",
        "Bomb",
        "Killing",
        "Visiting",
        "Kill Interaction",
        "Basic",
      ],
      description: [
        `Each night, can choose to visit one player and give them a Bomb.`,
        bombDef,
      ],
      nightOrder: [["Give Bomb", PRIORITY_ITEM_GIVER_EARLY]],
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
        `Each night, can choose to visit one player and give them a Falcon.`,
        falconDef,
      ],
      nightOrder: [["Give Falcon", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Funsmith: {
      alignment: "Village",
      category: "Gifting",
      tags: [
        "Killing",
        "Items",
        "Gun",
        "Reflexive",
        "Visiting",
        "Day Actions",
        "Advanced",
      ],
      description: [
        `Each night, can choose to visit one player and give them a Gun.`,
        `Each night, each player who visits the Funsmith will be given a Gun.`,
        gunDef,
      ],
      nightOrder: [["Give Guns", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Gemcutter: {
      alignment: "Village",
      category: "Gifting",
      tags: [
        "Revealing",
        "Information",
        "Items",
        "Crystal",
        "Visiting",
        "Kill Interaction",
        "Advanced",
      ],
      description: [
        `Each night, can choose to visit one player and give them a Crystal Ball.`,
        crystalDef,
      ],
      nightOrder: [["Give Crystal Ball", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Gunsmith: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Killing", "Items", "Gun", "Visiting", "Day Actions", "Basic"],
      description: [
        `Each night, can choose to visit one player and give them a Gun.`,
        gunDef,
      ],
      nightOrder: [["Give Gun", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Keymaker: {
      alignment: "Village",
      category: "Gifting",
      tags: [
        "Role Blocker",
        "Items",
        "Key",
        "Visiting",
        "Day Actions",
        "Advanced",
      ],
      description: [
        `Each night, can choose to visit one player and give them a Key.`,
        keyDef,
      ],
      nightOrder: [["Give Key", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Knight: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Redirection", "Items", "Shield", "Visiting", "Advanced"],
      description: [
        `Each night, can choose to visit one player and give them a Shield.`,
        shieldDef,
        //"Shields can be used at night to redirect kills targeting the holder onto a random player of the same alignment if possible.",
      ],
      nightOrder: [["Give Shield", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Mailman: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Messages", "Items", "Envelope", "Visiting", "Basic"],
      description: [
        `Each night, can choose to visit one player and give them an Envelope.`,
        envelopeDef,
      ],
      nightOrder: [["Give Envelope", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Missionary: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Items", "Tract", "Protective", "Visiting", "Basic"],
      description: [
        `Each night, can choose to visit one player and give them an Tract.`,
        tractDef,
      ],
      nightOrder: [["Give Tract", PRIORITY_ITEM_GIVER_EARLY]],
    },
    Pharmacist: {
      alignment: "Village",
      category: "Gifting",
      tags: [
        "Role Blocker",
        "Items",
        "Whiskey",
        "Visiting",
        "Day Actions",
        "Advanced",
      ],
      description: [
        `Each night, can choose to visit one player and give them an Whiskey.`,
        whiskeyDef,
      ],
      nightOrder: [["Give Whiskey", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Reanimator: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Revive", "Items", "Syringe", "Graveyard", "Visiting", "Basic"],
      description: [
        `Each night, can choose to visit one player and give them a Syringe.`,
        needleDef,
      ],
      nightOrder: [["Give Syringe", PRIORITY_ITEM_GIVER_DEFAULT]],
      graveyardParticipation: "all",
    },
    Riflemaster: {
      alignment: "Village",
      category: "Gifting",
      tags: ["Killing", "Items", "Gun", "Visiting", "Day Actions", "Basic"],
      description: [
        `Each night, can choose to visit one player and give them a Rifle.`,
        rifleDef,
      ],
      nightOrder: [["Give Rifle", PRIORITY_ITEM_GIVER_DEFAULT]],
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
        "Day Actions",
        "Revive",
        "Advanced",
      ],
      description: [
        "Each night, can choose to visit one player and check them.",
        "If no one visits Santa during the night, will learn whether the player they checked is naughty or nice.",
        "Each night, can choose to visit one player and give them an item.",
        "Santa can choose to give a Gun, Knife, Armor, Bomb, Crystal, Whiskey, Bread, Key, Falcon, Tract, Syringe, or Coffee.",
      ],
      nightOrder: [
        ["Give Gifts", PRIORITY_ITEM_GIVER_EARLY],
        ["Learn Alignment", PRIORITY_INVESTIGATIVE_DEFAULT],
      ],
      graveyardParticipation: "all",
    },
    //investigative roles
    Analyst: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Guess", "Speaking", "Advanced"],
      description: [
        'On their first day, an Analyst can make up to five guesses in chat following this structure "I will analyze if (Player Name) is (Role Name)".',
        //'On their 1st day if an Analyst makes a guess in chat following this structure "I will analyze if (Player Name) is (Role Name)".',
        "The Analyst will learn how many guesses were correct during the night.",
        //"The Analyst may only make 5 guesses.",
      ],
      nightOrder: [
        [
          "Learn About Guesses",
          PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
        ],
      ],
    },
    Accountant: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Neighbors", "Position", "Advanced"],
      description: [
        "On their first night, learns how many instances of two Evil Players neighboring each other there are.",
        //"On Night 1 learns how many pairs of Evil players there are.",
        //"A pair is each unique instance of 2 Evil Players neighboring each other.",
        //"Players can be part of multiple pairs.",
      ],
      nightOrder: [
        ["Learn Evil Pairs", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10],
      ],
    },
    Bloodhound: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and learn if they visited anybody.",
        //"Tracks a player each night and learns if they visited anybody.",
      ],
      nightOrder: [["Binary Track", PRIORITY_INVESTIGATIVE_DEFAULT]],
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
      nightOrder: [
        ["Learn Target", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10],
      ],
    },
    Housekeeper: {
      alignment: "Village",
      category: "Investigative",
      tags: [
        "Information",
        "Visits",
        "Reports",
        "Visiting",
        "Visit Interaction",
        "Advanced",
      ],
      description: [
        "Each night, can choose to visit two players and learn how many of them visited anybody or received reports.",
        //"Each night chooses 2 players, Learns how many of those players visited or received reports",
      ],
      nightOrder: [
        [
          "Track and Check for Reports",
          PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
        ],
      ],
    },
    Cop: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Alignment", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and learn if they are guilty or innocent.",
        //"Investigates one player each night and learns their alignment.",
      ],
      nightOrder: [["Learn Alignment", PRIORITY_INVESTIGATIVE_DEFAULT]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Halloween",
          value: "halloween",
        },
      ],
    },
    Coroner: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Roles", "Visiting", "Dead", "Basic"],
      description: [
        "Each night, can choose to visit one dead player and learn their role.",
        //"Chooses to visit a dead player at night and learns their role identity.",
      ],
      nightOrder: [["Learn Role", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Detective: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Roles", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and learn their role.",
        //"Investigates one player each night and learns their role.",
      ],
      nightOrder: [["Learn Role", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Empath: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Alignment", "Neighbors", "Basic"],
      description: [
        //"Each night, can choose to visit one dead player and learn their role.",
        "Each night, learns how many of their alive neighbors are evil.",
      ],
      nightOrder: [
        [
          "Learn Evil Neighbors",
          PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
        ],
      ],
    },
    Statistician: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Alignment", "Voting", "Advanced"],
      description: [
        "Each night, learns if an Evil player voted with the majority on the previous day.",
        "If the vote was tied, the Statistician learns a random value.",
      ],
      nightOrder: [["Learn If Evil Voted", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Forensicist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Information", "Advanced"],
      description: [
        "Each night, learns if and how many reports are being falsified.",
      ],
      nightOrder: [
        ["Count False Info", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 1],
      ],
      SpecialInteractions: {
        Journalist: ["Forensicist will not count Journalist info."],
      },
    },
    Geologist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Position", "Advanced"],
      description: [
        "On their first night, learns the distance in players between 2 Evil players.",
        "If the distance is 0, then the Evil players are neighboring each other.",
      ],
      nightOrder: [
        [
          "Learn Distance Between Two Evil Players",
          PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
        ],
      ],
    },
    Orienteer: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Position", "Advanced"],
      description: [
        "On their first night, learns if the closest evil player is above them or below them on the player list.",
        //"Learns the direction to closest evil player on Night 1.",
        "This will Loop around at the top and bottom of the player list.",
      ],
      nightOrder: [
        [
          "Learn Direction Torwards closest Evil",
          PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
        ],
      ],
    },
    Groundskeeper: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Alignment", "Dead", "Basic"],
      description: ["Each night, learns how many dead players are Evil."],
      nightOrder: [
        ["Evil Dead Count", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10],
      ],
    },
    Diviner: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Roles", "Alignment", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and learn two roles, one of which is their role.",
        "The two roles will always be from opposite alignments.",
        //"Investigates one player each night and learns two roles of opposite alignments.",
        //"The investigated player is one of the roles learned by the Diviner.",
      ],
      nightOrder: [
        ["Learn that player is 1 of 2 Roles", PRIORITY_INVESTIGATIVE_DEFAULT],
      ],
    },
    Journalist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Reports", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and learn what reports they received.",
        //"Chooses a player each night and views any reports they receive the following day.",
      ],
      nightOrder: [
        ["Learn Reports", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 2],
      ],
    },
    Justice: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Alignment", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit two players and learn if they are the same alignment.",
        //"Investigates two players at night and learns if they share an alignment.",
      ],
      nightOrder: [["Compare Alignments", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Laundress: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Roles", "Basic"],
      description: [
        "On their first night, learns that 1 of 2 players is a particular role.",
      ],
      nightOrder: [["Learn Info", PRIORITY_INVESTIGATIVE_DEFAULT]],
      SpecialInteractionsModifiers: {
        Loyal: ["Will only learn about Good Roles."],
        Disloyal: ["Will only learn about Evil Roles."],
        Holy: ["Will only learn about non-Demonic Roles."],
        Unholy: ["Will only learn about Demonic Roles."],
        Simple: ["Will only learn about Vanilla Roles."],
        Complex: ["Will only learn about PR Roles."],
        Refined: ["Will only learn about non-Banished Roles."],
        Unrefined: ["Will only learn about Banished Roles."],
      },
    },
    Maestro: {
      alignment: "Village",
      tags: ["Information", "Alignment", "Basic"],
      description: [
        "On their first night, learns about 3 players. 1 will be Evil, 2 will be good.",
      ],
      nightOrder: [["Learn Players", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    "Fortune Teller": {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Alignment", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit two players and learn if one of them is Mafia or Demonic.",
        //"Investigates two players at night and learns if one of them is Mafia or Demonic.",
      ],
      nightOrder: [["Check for Demons", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Scientist: {
      alignment: "Village",
      category: "Investigative",
      tags: [
        "Information",
        "Roles",
        "Neighbors",
        "Visits",
        "Guess",
        "Day Actions",
        "Advanced",
      ],
      description: [
        "Each Day, can choose to learn if a player is, neighbors, was visited by, or visited a role.",
      ],
    },
    Tourist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Excess Roles", "Advanced"],
      description: [
        "Each night, can choose to reveal 1-3 Excess roles to All Players.",
      ],
      nightOrder: [
        ["Reveal Roles", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10],
      ],
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
        "Each night, chooses a role.",
        "Each night, can choose to visit one player and learn if their role is the selected role.",
        //"Chooses a player and a role and learns if they are that role or not.",
      ],
      nightOrder: [["Guess Role", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Pathologist: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Reports", "Dead", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one dead player and learn all system messages they ever received.",
        //"Each night, visits one dead player.",
        //"Will receive all system messages the player ever received.",
      ],
      nightOrder: [["Learn Reports", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Psychic: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Roles", "Excess Roles", "Basic"],
      description: [
        "Each night, can choose to learn a random player's role or two excess roles",
      ],
      nightOrder: [
        ["Learn Role or Excess Roles", PRIORITY_INVESTIGATIVE_DEFAULT],
      ],
    },
    Clairvoyant: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Roles", "Basic", "Visiting"],
      description: [
        "Each night, can choose to visit one player and learn two roles that are not their role.",
        // "Visits one player each night and learns two roles that are not that player's role.",
      ],
      nightOrder: [["Learn Not Roles", PRIORITY_INVESTIGATIVE_DEFAULT]],
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
        "Each day, can choose to learn two pieces of information about the game. One will be true and one will be false.",
      ],
    },
    Snoop: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Item Interaction", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and learn what items they are carrying.",
        //"Visits a player each night and learns what items they are carrying.",
      ],
      nightOrder: [["Snoop Items", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Tracker: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and learn who they visited.",
      ],
      nightOrder: [["Track", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Voyeur: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Visiting", "Roles", "Basic"],
      description: [
        "Each night, can choose to visit one player and learn what roles visited them.",
        //"Watches a player each night and learns what roles visited them.",
      ],
      nightOrder: [["Watch", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5]],
    },
    Watcher: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Basic"],
      description: [
        "Each night, can choose to visit one player and learn who visited them.",
        //"Watches a player each night and learns who visited them.",
      ],
      nightOrder: [["Watch", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5]],
    },
    Witness: {
      alignment: "Village",
      category: "Investigative",
      tags: ["Information", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player.",
        "If that player dies, the Witness will learn that the killer is 1 of 2 players.",
      ],
      nightOrder: [["Bare Witness", PRIORITY_PREKILL_ACTION]],
    },
    //night-acting roles
    Paladin: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Kill Interaction", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player.",
        "If that player dies, the Paladin will gains that player's abilities.",
        //"Each night, chooses a player.",
        //"Gains that player's abilities if that player dies.",
      ],
      nightOrder: [["Gain abilities if Target dies", PRIORITY_PREKILL_ACTION]],
    },
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
        "Each night, can choose to visit one player.",
        "If that player dies, the Avenger will be given a Gun.",
        gunDef,
        //"Each night, chooses someone to avenge.",
        //"Gets a gun if their chosen target dies.",
      ],
      nightOrder: [["Get Gun if Target dies", PRIORITY_ITEM_GIVER_EARLY]],
    },
    Caroler: {
      alignment: "Village",
      category: "Night-acting",
      tags: [
        "Visit Interaction",
        "Information",
        "Alignment",
        "Visiting",
        "Advanced",
      ],
      description: [
        "Each night, can choose to visit one player and if they didn't visit anybody, have them learn 3 players, at least one of whom is Evil.",
        //"Each night, sings a carol to a player about 3 players, at least one of whom is Evil.",
        //"The carol is not heard if the player chosen visits at night.",
        "Cannot choose to visit the same player consecutively.",
      ],
      nightOrder: [
        ["Sing Carol", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10],
      ],
    },
    Comedian: {
      alignment: "Village",
      category: "Night-acting",
      tags: [
        "Visit Interaction",
        "Information",
        "Roles",
        "Visiting",
        "Advanced",
      ],
      description: [
        "Each night, can choose to visit one player and if they didn't visit anybody, have them learn 3 roles and a player who is one of the roles.",
        //"Each night, tells a joke to a player about 3 roles, and a different player who is one of the roles.",
        //"The joke is not heard if the target chosen visits at night.",
        "Cannot choose to visit the same player consecutively.",
      ],
      nightOrder: [
        ["Tell Joke", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10],
      ],
    },
    Exorcist: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Dead", "Graveyard", "Exorcise", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one dead player and exorcise them.",
        "Exorcised players can't be revived or use graveyard abilities.",
        //"Each Night, the Exorcist can Exorcise a dead Player.",
        //"Exorcised players can't be revived or use Graveyard abilities.",
      ],
      nightOrder: [["Exorcise", PRIORITY_KILL_EXORCISE]],
    },
    Flapper: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Delirium", "Roles", "Advanced"],
      description: [
        "Once per game at night, can choose a role.",
        `Any players with the selected role will become "Delirious" for 3 Nights and 3 Days.`,
        deliriumDef,
        //"Once per game chooses a Role.",
        //"Any players with that role are Delirious for 3 Nights.",
        //"If the selected role is not in the game nothing happens.",
      ],
      nightOrder: [["Give Delirium", PRIORITY_BLOCK_EARLY + 1]],
    },
    Drunk: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Role Blocker", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and block their night actions.",
        //"Visits one player each night and blocks them from performing any night actions.",
        //"Some actions cannot be blocked.",
      ],
      nightOrder: [["Block", PRIORITY_NIGHT_ROLE_BLOCKER]],
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
        //"Visits one player each night and makes them Delirious until the start of the next night.",
        //"Delirious players get False Info and have other abilities disabled.",
        "A Sailor can not die unless roleblocked/made delirious.",
        `Each night, can choose to visit one player and make them "Delirious" until the next night.`,
        deliriumDef,
      ],
      nightOrder: [["Give Delirium", PRIORITY_NIGHT_ROLE_BLOCKER + 1]],
    },
    "Snake Charmer": {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Conversion", "Role Swapping", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and swap roles with them.",
        //"Each night, chooses a player to swap roles with.",
        "A Snake Charmer can only swap roles once.",
      ],
      nightOrder: [["Swap Roles", PRIORITY_SWAP_ROLES]],
    },
    Mediator: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Conversion", "Role Swapping", "Visiting", "Advanced"],
      description: [
        `Each night, can choose to visit two players and make them swap roles.`,
        //"Each night chooses 2 players.",
        //"The selected players will swap roles.",
      ],
      nightOrder: [["Swap Roles", PRIORITY_SWAP_ROLES + 1]],
    },
    Guard: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Visit Interaction", "Role Blocker", "Visiting", "Basic"],
      description: [
        `Each night, can choose to visit one player and block the night actions of any players who visit them.`,
        //"Each night, protects one player from all visits."
      ],
      nightOrder: [["Block Visitors", PRIORITY_UNTARGETABLE]],
    },
    Mechanic: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Item Interaction", "Visiting", "Advanced"],
      description: [
        "Each night, fixes any broken or corrupted items they are holding.",
        "Each night, can choose to visit one player and fix any broken or corrupted items they have.",
        //"Once per night, fixes the target's item(s).",
        //"Can undo an item's fabricated/sabotaged status, and can turn Gunrunner guns into normal guns and Gremlin guns into normal guns.",
        //"Each phase, fixes their own item(s).",
      ],
      nightOrder: [
        ["Fix Items Agian", PRIORITY_ITEM_TAKER_DEFAULT + 2],
        ["Fix Items", PRIORITY_ITEM_TAKER_EARLY + 2],
      ],
    },
    Mime: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Villager", "Conversion", "Alignment", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player.",
        //"Chooses a player at night and attempts to mime their role.",
        "If that player's role is Village-aligned, the Mime converts to their role and that player is converted to Villager.",
        "If that player's role is Mafia-aligned, the Mime is converted to Villager.",
        "If that player's role is Cult-aligned or Independent-aligned, the Mime is converted to Amnesiac.",
      ],
      nightOrder: [["Mime Role", PRIORITY_MIMIC_ROLE]],
      RolesMadeBy: ["Villager", "Amnesiac"],
    },
    "Lunch Lady": {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Modifiers", "Conversion", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and remove modifiers from their role.",
      ],
      nightOrder: [["Remove Modifiers", PRIORITY_CONVERT_DEFAULT + 7]],
    },
    Plastician: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Modifiers", "Conversion", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and add a random modifier to their role.",
        //"Each night visits a player and gives them a random Modifier",
        "Cannot add Exclusive, Clannish, Inclusive, or Starting Item modifiers.",
      ],
      nightOrder: [["Add Modifiers", PRIORITY_CONVERT_DEFAULT + 6]],
    },
    Photographer: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Information", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and reveal their role to all players.",
        //"Each Night the Photographer can take a picture of a player during the night.",
        //"The role of the photographed player will be revealed to everyone the next day.",
      ],
      nightOrder: [["Reveal Role", PRIORITY_REVEAL_DEFAULT]],
    },
    Impersonator: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Deception", "No Investigate", "Advanced"],
      description: [
        "Each night, can choose a role and will appear as that role on death and to information roles.",
        //"Chooses a role each night to appear as on death and to information role.",
        "Cannot choose Villager, Impersonator or Imposter",
      ],
      nightOrder: [
        ["Disguise Self", PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT],
      ],
    },
    Vegan: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Information", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and make them learn who the Vegan is.",
        //"Chooses a player each night to reveal their identity as Vegan.",
      ],
      nightOrder: [["Reveal to Player", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Oracle: {
      alignment: "Village",
      category: "Night-acting",
      tags: [
        "Revealing",
        "Information",
        "Kill Interaction",
        "Visiting",
        "Basic",
      ],
      description: [
        "Each night, can choose to visit one player.",
        "If an Oracle dies, that player's role will be revealed to all players.",
        //"Visits one player each night whose role will be revealed upon death.",
      ],
      nightOrder: [["Reveal Role", PRIORITY_REVEAL_DEFAULT]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Halloween",
          value: "halloween",
        },
      ],
    },
    Penguin: {
      alignment: "Village",
      category: "Night-acting",
      tags: [
        "Information",
        "Item Interaction",
        "Visit Interaction",
        "Visiting",
        "Basic",
      ],
      description: [
        "Each night, can choose to visit one player and tell them a secret.",
        //"Each night, waddles up to someone to tell them a secret.",
        "The secret will be about Visits, Visitors, or Items.",
      ],
      nightOrder: [["Tell Secret", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    "Robin Hood": {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Alignment", "Item Interaction", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit two players and give the first player's items to the second player.",
        //"Each night, can choose to visit one player and steal their items.",
        //"Chooses one player to steal from each night and another player to receive their items.",
        "If the second player is mafia, items will not be transfered.",
      ],
      nightOrder: [
        ["Transfer Items - Post Kill", PRIORITY_ITEM_TAKER_DEFAULT],
        ["Transfer Items", PRIORITY_ITEM_TAKER_EARLY],
      ],
    },
    Visitor: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player.",
        //"Pays a visit to another player at night.",
        //"Annoyingly, this visit has no effect.",
        "Town roles with the Scatterbrained modifier appear as this role to self.",
      ],
      nightOrder: [["Visit", PRIORITY_SUPPORT_VISIT_DEFAULT]],
    },
    Waitress: {
      alignment: "Village",
      category: "Night-acting",
      tags: ["Item Interaction", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and steal an item from them.",
      ],
      nightOrder: [
        ["Steal Item secound try", PRIORITY_ITEM_TAKER_DEFAULT],
        ["Steal Item", PRIORITY_ITEM_TAKER_EARLY],
      ],
    },
    "Drama Queen": {
      alignment: "Village",
      tags: ["Revealing", "Information", "Visiting", "Day Actions", "Advanced"],
      description: [
        "Each night, can choose to visit one player.",
        "The following day, That player choose to reveal their role or reveal the Drama Queen's role.",
        //"Each night, targets one player.",
        //"The following day, targeted player has two options:",
        //"They can reveal their role,",
        //"Or they can reveal the Drama Queen's role.",
        "After someone reveals the Drama Queen's role, The Drama Queen will be unable to use their night action.",
      ],
      nightOrder: [["Start Drama", PRIORITY_SUPPORT_VISIT_DEFAULT]],
    },
    //sacrificial roles
    Barber: {
      alignment: "Village",
      category: "Sacrificial",
      tags: [
        "Kill Interaction",
        "Items",
        "Conversion",
        "Role Swapping",
        "Expert",
      ],
      description: [
        "If a Barber dies, an Evil player will given Shaving Cream.",
        shavingCreamDef,
        //"While holding the shaving cream, a Mafia or Cult-aligned player may swap the roles of two living players.",
        //"Excluding players who started as Independent, the swapped players will keep their original alignments.",
      ],
    },
    Butterfly: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Kill Interaction", "Conversion", "Advanced"],
      description: [
        "If a Butterfly dies, all players are converted to the role they had at the start of the game.",
        //"When they die all players are reset to the role they had at the start of the game.",
      ],
    },
    Gatekeeper: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Kill Interaction", "Events", "Advanced"],
      description: [
        "Each night, if the Gatekeeper is dead, a Banished Event will occur.",
        //"When a Gatekeeper is dead, a Banished Event will occur each night.",
      ],
    },
    Hunter: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Condemn Interaction", "Killing", "Dusk", "Basic"],
      description: [
        "If the Hunter is condemned, they can choose a player to kill.",
        //"Chooses a player to kill when condemned by town during the day.",
      ],
    },
    Lightkeeper: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Kill Interaction", "Voting", "Speaking", "Eclipse", "Basic"],
      description: [
        `If a Lightkeeper dies, all players will be "Blind" during the following Day.`,
        blindDef,
        //"Following their death, causes an eclipse during the day. During an eclipse, all speech and votes are anonymous.",
      ],
    },
    Schoolmarm: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Kill Interaction", "Conversion", "Villager", "Basic"],
      description: [
        "If the Schoolmarm dies, all Village-aligned players will be convert to Villager.",
      ],
      RolesMadeBy: ["Villager"],
    },
    Secretary: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Kill Interaction", "Voting", "Basic"],
      description: [
        "If the Secretary is killed at night, players are forced to vote for no one the next day.",
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
        "When killed by the Mafia, they will survive and be converted to Traitor.",
      ],
      RolesMadeBy: ["Traitor"],
    },
    Typist: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Kill Interaction", "Voting", "Basic"],
      description: [
        `If a Typist dies, all players will be "Purblind" during the following Day.`,
        purblindDef,
        //"On the day following their death, all votes will be anonymous.",
      ],
    },
    Virgin: {
      alignment: "Village",
      category: "Sacrificial",
      tags: ["Condemn Interaction", "Protective", "Conversion", "Basic"],
      description: [
        "If the Virgin is condemned, no one can die the following night.",
        //"If condemned by the village, no one will die the following night.",
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
        "Once per game during the day when dead, must choose a player.",
        //"After dying chooses a player.",
        "If that player is village aligned, they will die during the night.",
        //"If that player is non-village aligned, Nothing happens.",
      ],
      nightOrder: [["Kill Selected Player", PRIORITY_KILL_DEFAULT]],
    },
    //voting roles
    Attorney: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Basic"],
      description: ["Vote weight is worth 2 votes."],
    },
    Butler: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and make them their master.",
        //"Each night chooses a player to be their Master.",
        "A Butler's vote only counts if they vote the same target as their Master.",
      ],
      nightOrder: [["Choose Master", PRIORITY_SUPPORT_VISIT_DEFAULT]],
    },
    Governor: {
      alignment: "Village",
      category: "Voting",
      tags: ["Condemn Interaction", "Overturn", "Dusk", "Advanced"],
      description: [
        "Once per game at dusk, can choose to change the target of a condemation.",
        //"Overrides village condemnation once per game.",
        "Cannot change the target to no one.",
        "Choosing no one or the original target preserves the Governor's override ability.",
      ],
    },
    King: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Basic"],
      description: ["Vote weight is worth 10000 votes."],
    },
    Kingmaker: {
      alignment: "Village",
      category: "Voting",
      tags: [
        "Voting",
        "Items",
        "Visiting",
        "Sceptre",
        "Day Actions",
        "Advanced",
      ],
      description: [
        `Each night, can choose to visit one player and give them a Sceptre.`,
        //"Gives out a sceptre each night.",
        sceptreDef,
        //"Sceptres give a player +10000 votes in day meeting.",
      ],
      nightOrder: [["Give Sceptre", PRIORITY_ITEM_GIVER_DEFAULT]],
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
        `Each night, can choose to visit one player and prevents them from voting and from being voted.`,
        //"Every night, chooses one player and prevents them from voting and from being voted.",
        //"Cannot choose themselves.",
      ],
      nightOrder: [["Block Votes", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Jazzman: {
      alignment: "Village",
      category: "Voting",
      tags: ["Condemn Interaction", "Delirium", "Alignment", "Advanced"],
      description: [
        "If a player is condemned, All players are Delirious that night.",
      ],
      nightOrder: [
        [
          "Give Everyone Delirium If someone is Condemned",
          PRIORITY_BLOCK_EARLY,
        ],
      ],
      SpecialInteractions: {
        Assassin: [
          "If an Assassin is Present, All players are Delirious if an Evil player is Elected as Room Leader.",
        ],
      },
      SpecialInteractionsModifiers: {
        Loyal: [
          "Players will only become Delirious if the condemned player is the same alignment as the Jazzman.",
        ],
        Disloyal: [
          "Players will only become Delirious if the condemned player is a different alignment to the Jazzman.",
        ],
        Holy: [
          "Players will only become Delirious if the condemned player is non-Demonic.",
        ],
        Unholy: [
          "Players will only become Delirious if the condemned player is Demonic.",
        ],
        Simple: [
          "Players will only become Delirious if the condemned player is a Vanilla role.",
        ],
        Complex: [
          "Players will only become Delirious if the condemned player is a Power role.",
        ],
        Refined: [
          "Players will only become Delirious if the condemned player is a non-Banished role.",
        ],
        Unrefined: [
          "Players will only become Delirious if the condemned player is a Banished role.",
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
      tags: [
        "Voting",
        "Condemn Interaction",
        "Overturn",
        "Alignment",
        "Advanced",
      ],
      description: [
        //"The first",
        "The first player to vote for a Princess is condemned and ends the day.",
        //"If the first player to vote for a Princess does not appear as Village-aligned, nothing happens.",
      ],
      SpecialInteractionsModifiers: {
        Loyal: [
          "If the first player to vote for the Princess is a different alignment to the Princess, nothing happens.",
        ],
        Disloyal: [
          "If the first player to vote for the Princess is the same alignment of the Princess, nothing happens.",
        ],
        Holy: [
          "If the first player to vote for the Princess is Demonic, nothing happens.",
        ],
        Unholy: [
          "If the first player to vote for the Princess is non-Demonic, nothing happens.",
        ],
        Simple: [
          "If the first player to vote for the Princess is a Power Role, nothing happens.",
        ],
        Complex: [
          "If the first player to vote for the Princess is a Vanilla Role, nothing happens.",
        ],
        Refined: [
          "If the first player to vote for the Princess is a Banished Role, nothing happens.",
        ],
        Unrefined: [
          "If the first player to vote for the Princess is a non-Banished Role, nothing happens.",
        ],
      },
    },
    Troublemaker: {
      alignment: "Village",
      category: "Voting",
      tags: ["Voting", "Condemn Interaction", "Day Actions", "Basic"],
      description: [
        "Once per game during the day, can force the next night phase to skip and two day phases to occur consecutively.",
      ],
    },
    Ogre: {
      alignment: "Village",
      tags: ["Condemn Interaction", "Sacrificial", "Advanced"],
      description: [
        "Each day, one Evil player will given a chance to guess who the Ogre is.",
        "If the Ogre is correctly guessed, The day ends and the Ogre is condemned",
        "If an Incorrect guess is made, No one will get to guess the Ogre the following day.",
      ],
    },
    //manipulative roles
    Braggart: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Delirium", "Banished", "Advanced", "Item Interaction"],
      description: [
        "Sees self as a random non-Banished Village role from the setup.",
        `Has that role's abilities but is "Delirious".`,
        deliriumDef,
        `If a Braggart stops being "Delirious", they will become "Delirious" the next night.`,
        "Each night, breaks items they are holding.",
      ],
      nightOrder: [["Self Deliriate", PRIORITY_ITEM_TAKER_DEFAULT + 1]],
      SpecialInteractions: {
        Ghost: ["If a Ghost is Present, a Braggart will learn a fake word."],
      },
    },
    Coward: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Redirection", "Reflexive", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and redirect anyone who visits the Coward to that player.",
        //"Anyone who visits the Coward will be redirect to the chosen player.",
      ],
      nightOrder: [["Redirect Visitors", PRIORITY_MODIFY_ACTION]],
    },
    Chauffeur: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Redirection", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit two players and swap their visitors.",
        //"Chooses two players, A and B, each night.",
        "Players who visit first player will be redirected to second player.",
        "Players who visit second player will be redirected to first player.",
        //"Redirection cannot be role blocked.",
      ],
      nightOrder: [["Swap Visitors", PRIORITY_SWAP_VISITORS]],
    },
    Televangelist: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Setup Changes", "Delirium", "Cult", "Advanced"],
      description: [
        "Sees self as a random Demonic Cult role from the setup.",
        "Can use fake versions of that role's abilities.",
        "Will attend a Fake Cult Meeting with the non-Demonic Cult roles.",
        "Cult players will learn who the Televangelist selects at night.",
      ],
      nightOrder: [["Self Deliriate", PRIORITY_FULL_DISABLE + 1]],
    },
    Monkey: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Copy Actions", "Advanced"],
      description: [
        "Each night, chooses a player.",
        "Gains that player's abilites until the next night.",
        //"Before each Night chooses a player.",
        //"Copies the actions of the chosen player at night.",
      ],
    },
    Philosopher: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Conversion", "Delirium", "Advanced"],
      description: [
        "Once per game at night, can choose Village-aligned role from the setup.",
        "The Philosopher will convert to the chosen role.",
        `If the chosen role is already in play, The player with that role will be "Delirious" until the Philosopher dies.`,
        deliriumDef,
        //"At night may choose to convert to a Village aligned role that can spawn in the setup.",
        //"If the Philosopher converts to a role is already in play, The player with that role will be Delirious until the Philosopher dies.",
      ],
      nightOrder: [
        ["Become Role and Make Delirious", PRIORITY_NIGHT_ROLE_BLOCKER + 1],
      ],
    },
    Jack: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Advanced", "Banished Interaction"],
      description: [
        "Each night, can choose a banished Village role and gains its abilities until the next night.",
        //"At night chooses a banished Village role, gains its abilities until the next night",
        "Cannot select a role they already selected.",
      ],
    },
    Hermit: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Advanced", "Banished Interaction"],
      description: [
        "Has the abilities of up to 5 banished Village roles.",
        "Cannot have the Hermit ability.",
      ],
    },
    Trickster: {
      alignment: "Village",
      category: "Manipulative",
      tags: ["Conversion", "Items", "Killing", "Day Actions", "Advanced"],
      description: [
        "Each night, gives a random player a random item.",
        //"The item can be a Gun, Knife, Armor, Whiskey, or Crystal.",
        "The item has a 50% chance to be broken.",
        "Cursed items will misfire or be otherwise ineffective.",
      ],
      nightOrder: [["Give Random Item", PRIORITY_ITEM_GIVER_EARLY - 1]],
    },
    //meeting roles
    Capybara: {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meetings", "Orange", "Items", "Visiting", "Advanced"],
      description: [
        "Meets with other Capybaras at night.",
        "Each night, can choose to visit one player and give them an Orange.",
        orangeDef,
        //"Chooses a player to invite to a hot springs relaxation by giving them a Yuzu Orange each night.",
        //"When holding a Yuzu Orange, player can choose during the day to anonymously meet with the Capybara and other Yuzu Orange holders the following night.",
      ],
      nightOrder: [["Give Orange", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Chef: {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meetings", "Information", "Basic"],
      description: [
        "Each day, chooses two players and have them attend a banquet at night together.",
        "When attending a banquet they will learn each other's roles and cannot preform night actions.",
        //"Chooses two players during the day to attend a banquet the following evening.",
        //"Players chosen to attend the banquet meet anonymously with their roles revealed to one another.",
      ],
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
    Freemason: {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meetings", "Conversion", "Alignment", "Visiting", "Basic"],
      description: [
        "Meets with other Freemasons at night.",
        "Each night, all Freemasons can choose to visit one player and convert them to Freemason.",
        //"Converts one player into a Freemason each night.",
        //"Shares a night meeting with other Freemasons.",
        "All Freemasons die if they attempt to convert a member of the Mafia.",
        "All Cultists die if targeted by a Freemason meeting.",
      ],
      nightOrder: [
        ["Convert to Mason", PRIORITY_CONVERT_DEFAULT + 2],
        ["Kill Cultist", PRIORITY_KILL_DEFAULT + 1],
      ],
    },
    "Invisible Man": {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meetings", "Basic", "Day Actions"],
      description: [
        "Each day, chooses one player and will observe that players night chats.",
        //"Chooses one player during the day to follow at night.",
        //"Views all messages from that player's meetings that night.",
      ],
    },
    Matron: {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meetings", "Reflexive", "Basic"],
      description: [
        `Each night, each player who visits the Matron will be invited to the common room.`,
        "Players invited to the common will meet with the Matron the following night.",
        //"Passively invites visitors to the common room, where  they share a meeting.",
      ],
      nightOrder: [["Give Invites to Visitors", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Templar: {
      alignment: "Village",
      category: "Meeting",
      tags: ["Meetings", "Setup Changes", "Basic"],
      description: [
        "Meets with other Templars at night.",
        "Adds 1 Templar in closed setups.",
      ],
      SpecialInteractions: {
        Ghost: ["If a Ghost is Present, a Templar will not learn any words."],
      },
    },
    //reflexive roles
    Apothecary: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Malicious Effects", "Role Share", "Advanced"],
      description: [
        "Each night, each player who visits the Apothecary will have any malicious effects they have removed and will be protected from death..",
        //"When visited, heals and cleanses all effects currently possessed by the visiting player.",
        "Players who Role Share with an Apothecary will have any malicious effects they have removed.",
        MalEffects,
      ],
      nightOrder: [
        ["Remove Effects from Visitors", PRIORITY_EFFECT_REMOVER_DEFAULT],
        ["Kill Werewolf", PRIORITY_KILL_DEFAULT],
        ["Remove Effects", PRIORITY_EFFECT_REMOVER_EARLY],
      ],
    },
    Dreamer: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Information", "Alignment", "Basic"],
      description: [
        "Each night, if no one visits them, learns about 3 players, at least one of whom is Evil; or 1 player who is Village aligned.",
        //"Dreams about 3 players, at least one of whom is Evil; or about 1 player who is Village aligned.",
        //"Does not dream if visited at night.",
      ],
      nightOrder: [
        ["Dream", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10],
      ],
    },
    Farmer: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Famine", "Items", "Advanced"],
      description: [
        `Each night, each player who visits the Farmer will be given Bread.`,
        breadDef,
        //"When visited, gives a loaf of bread to each visitor.",
        //"Starts a famine when present in the game.",
      ],
      nightOrder: [["Give Bread to Visitors", PRIORITY_ITEM_GIVER_EARLY]],
    },
    Painter: {
      alignment: "Village",
      category: "Reflexive",
      tags: [
        "Reflexive",
        "Information",
        "Kill Interaction",
        "Basic",
        "Visit Interaction",
      ],
      description: [
        "If a Painter dies, all players who ever visited them will be announced.",
        //"When a Painter dies they will announce all players who ever visited them.",
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
      nightOrder: [["Paint Visitors", PRIORITY_PREKILL_ACTION]],
    },
    Priest: {
      alignment: "Village",
      category: "Reflexive",
      tags: ["Reflexive", "Information", "Roles", "Visit Interaction", "Basic"],
      description: ["Each night, learns what roles visited them."],
      nightOrder: [["Learn Role Visitors", PRIORITY_INVESTIGATIVE_DEFAULT]],
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
      nightOrder: [["Die with Incorrect Guess", PRIORITY_KILL_DEFAULT - 1]],
    },
    Firebrand: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Gasoline", "Visiting", "Day Actions", "Advanced"],
      description: [
        `Each night, can choose to visit one player and make them "Doused".`,
        //"Douses one player with Gasoline each night.",
        //dousedDef,
        `Once per game during the day, can choose to kill all players that are "Doused".`,
        //"Chooses to light a match during the day to burn doused players to ashes.",
      ],
      nightOrder: [["Douse In Gasoline", PRIORITY_EFFECT_GIVER_DEFAULT - 1]],
    },
    Granny: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Reflexive", "Advanced"],
      description: [
        "Each night, each player who visits the Granny will be killed.",
        //"Kills all players who visit during the night.",
        "Cannot be converted.",
        "Can only be killed by village condemnation.",
      ],
      nightOrder: [["Kill Visitors", PRIORITY_KILL_DEFAULT]],
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
        "Each dusk, if no one was condemned, chooses a player.",
        //"If no one was condemned, chooses a player to jail after each day meeting.",
        "Meets anonymously with the chosen player at night and the chosen player cannot perform night actions and blocks the night actions of any players who visit the the chosen player.",
        "The Jailer can choose to kill the chosen player.",
      ],
      nightOrder: [
        ["Execute Prisoner", PRIORITY_KILL_DEFAULT],
        ["Block Jailed Player's Visitors", PRIORITY_UNTARGETABLE - 5],
      ],
    },
    Seeker: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Setup Change", "Hide and Seek", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and kill them if their role is Hider or Invader",
        //"Attempts to guess the identity of the Hider or Invader each night.",
        //"Kills the Hider/Invader if guess is correct.",
        "Forces a Hider or Invader to Spawn in closed Setups.",
      ],
      nightOrder: [["Guess Hider/Invader", 0]],
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
      nightOrder: [["Kill If Statement is True", PRIORITY_KILL_DEFAULT - 2]],
    },
    Trapper: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Visit Interaction", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and kill one player who visits them.",
        //"Each night, visits one player and kills one of their visitors.",
        "Preferentially kills Mafia, Cult, Independents, then Villagers.",
        "Other players who visit the chosen player will learn who the Trapper is.",
      ],
      nightOrder: [["Trap", PRIORITY_KILL_DEFAULT]],
    },
    Vigilante: {
      alignment: "Village",
      category: "Killing",
      tags: ["Killing", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and kill them.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT + 1]],
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
        "Each day, can choose a dead player.",
        "Meets anonymously with the chosen player at night",
        //"Holds a seance with a dead player once per night.",
        //"Identity is not revealed to the dead player.",
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
        "Each day, can ask a question.",
        //"Can ask players in the graveyard a question every night.",
        "Dead players can answer the question the following night with yes or no.",
        "The mourner will receive the results of the vote.",
      ],
      nightOrder: [["Learn Answer", PRIORITY_INVESTIGATIVE_DEFAULT + 1]],
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
      tags: [
        "Setup Changes",
        "Exposed",
        "Treasure Chest",
        "Voting",
        "Advanced",
        "Special",
      ],
      description: [
        "Starts revealed to all players.",
        "Vote weight is worth 10000 votes.",
        "If an Admiral is present, all other players will start as Grouch.",
        "The Admiral starts with a Chest containing 15 Gold and Village/Independent roles from the setup.",
        "The Admiral will take 1-5 of Gold from the Chest and give it to their lower neighbor.",
        "The lower neighbor can choose to remove a role from the Chest.",
        "Then starting with the Admiral's lower neighbor each player will choose to become a role in the Chest or steal Gold from the Chest to become an Evil role.",
        "If no roles or Gold remain in the Chest, a player will remain as Grouch.",
        "The Admiral's upper neighbor can choose to remain as Grouch even if Gold or roles remain in the Chest",
        "If 2 or more non-evil roles are condemned, All Village-aligned players die.",

        //"Starting with the Admiral, players will pass a chest containing Village/Independent roles and 15 Gold to their lower neighbor.",
        //"When a player is passed the chest they may steal gold or become a role in the chest. Players who steal Gold become Evil roles.",
        //"The Admiral must steal 1-5 Gold but will not become an Evil role.",
        //"The Player directly below the Admiral can Choose to become an excess role, while the player directly above the Admiral can choose to become Grouch.",
        //"If 2 or more non-evil roles are condemned, All Village-aligned players die.",
      ],
      RolesMadeBy: ["Grouch"],
    },
    Benandante: {
      alignment: "Village",
      category: "Essential",
      tags: ["Essential", "Graveyard", "Alignment", "Sacrificial", "Advanced"],
      description: [
        "Once per game during the day when dead, must choose a player.",
        "If that player is not village aligned, all Village-aligned players die.",
        //"When a Benandante dies, They choose a player during the day.",
        //"If that player is not Village aligned, All Village Aligned players die.",
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
    Sculptor: {
      alignment: "Village",
      category: "Essential",
      tags: [
        "Conversion",
        "Setup Change",
        "Visiting",
        "Expert",
        "Banished Interaction",
      ],
      description: [
        "Each night, can choose to visit one player and convert them to a random non-banished Village role if their role is Statue",
        //"Attempts to guess the identity of the Statue each night.",
        //"Converts them to a Random non-banished Village Role if Correct.",
        "Forces a Statue to Spawn in closed setups.",
      ],
      nightOrder: [["Guess Statue", PRIORITY_CONVERT_DEFAULT + 3]],
      RolesMadeBy: ["Statue"],
    },
    Statue: {
      alignment: "Village",
      category: "Essential",
      tags: ["Win Con", "Expert"],
      description: [
        'If the first Evil Player to say "I think the Statue is (Player Name)" during the day is correct, Mafia and Cult win.',
        "All Mafia and Cult players learn if a Statue is in the game.",
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
        "If the Saint is condemned, all players who are aligned with the Saint die.",
      ],
      SpecialInteractions: {
        Ghost: ["If a Ghost is Present, a Saint will not learn any words."],
      },
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
        "Knows which players are Mafia and Cult.",
        "When condemned, Mafia and Cult have a chance to guess who the Seer is.",
        "On a correct guess, the Seer dies and the Mafia or Cult wins.",
        "Appears as villager on death.",
      ],
      SpecialInteractions: {
        Ghost: ["If a Ghost is Present, a Seer will not learn any words."],
      },
    },
    Mole: {
      alignment: "Village",
      category: "Essential",
      tags: ["Expert", "Meeting", "Win Con"],
      description: [
        "The Mole is assigned a Mafia or Cult role in addition to the Mole role",
        "The Mole will appear as that role and have that role's abilities but will still win with Village.",
        "The Mole will count towards Mafia/Cult majority and attend their meetings.",
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
        "If more then half the number of Senators in play die, Mafia/Cult wins.",
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
        "Must role share with any Presidents, Senators, and Vital Village roles in the game.",
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
        "At the end of the day, if exactly three players are alive and no player was condemned today, the game ends and the Mayor's team wins.",
      ],
    },
    //linked roles
    Begum: {
      alignment: "Village",
      category: "Linked",
      tags: ["Information", "Visits", "Basic", "Day Actions"],
      description: [
        "Is randomly assigned another player as a target.",
        "Each night, learns who their target visits and is visited by each night.",
        "Once per game during the day, can learn who their target is but no longer learn over information.",
        //"Can find out who this player is, at the cost of no longer receiving this info about their target.",
      ],
      nightOrder: [["Learn Information", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Mistress: {
      alignment: "Village",
      category: "Linked",
      tags: ["Information", "Alignment", "Advanced"],
      description: [
        "Each day, can choose to open the door.",
        "When the Mistress opens the door all players will learn that the Mistress opened the door.",
        "When the door is opened, the Mistress will learn an evil player.",
        "If the door was opened, the Mistress will die at night unless visited by a Village-aligned player.",
      ],
      nightOrder: [["Die unless visited", PRIORITY_KILL_DEFAULT + 1]],
    },
    "Trick-Or-Treater": {
      alignment: "Village",
      category: "Linked",
      tags: ["Information", "Visit Interaction", "Advanced"],
      description: [
        "Each day, can choose to go trick or treating.",
        "All evils players will learn if a Trick-Or-Treater goes trick or treating.",
        "At night if trick or treating, the Trick-Or-Treater  announce who visits their neighbors.",
      ],
      nightOrder: [["Announce Visitors", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 3],],
    },
    Suitress: {
      alignment: "Village",
      category: "Linked",
      tags: ["Revealing", "Information", "Basic"],
      description: [
        "Each day, can choose one player and propose to them.",
        "That player has to publicly accept or deny the proposal.",
        "If that player accepts, the player and the Suitress will be revealed to all players.",
        //"During the day, can make an anonymous proposal to another player.",
        "Once a proposal is accepted, the Suitress cannot make another proposal.",
      ],
    },
    "Banished Village": {
      alignment: "Village",
      tags: ["Banished Interaction", "Basic"],
      description: [
        "Before the game starts, is replaced with a random Banished Village role.",
      ],
    },
    //Mafia
    Mafioso: {
      alignment: "Mafia",
      category: "Basic",
      tags: ["Vanilla", "Basic"],
      description: ["Wins when the mafia outnumbers all other players."],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Halloween",
          value: "halloween",
        },
      ],
    },
    //basic roles
    Godfather: {
      alignment: "Mafia",
      category: "Basic",
      tags: ["Villager", "Basic", "Deception", "No Investigate"],
      description: [
        //"Leads the mafia kill each night.",
        "Appears as Villager to information roles.",
      ],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Halloween",
          value: "halloween",
        },
      ],
      SpecialInteractions: {
        Ghost: ["If a Ghost is Present, a Godfather will learn the real word."],
      },
    },
    Gramps: {
      alignment: "Mafia",
      category: "Basic",
      tags: ["Basic", "Information", "Visits", "Roles", "Reflexive"],
      description: [
        "Each night, learns the role of each player who visits them",
        //"Learns role of any player who visits them.",
        // "Cannot be killed normally.",
      ],
      nightOrder: [["Learn Visitors", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Prosecutor: {
      alignment: "Mafia",
      category: "Basic",
      tags: ["Voting", "Basic"],
      description: ["Vote weight is worth 2 votes."],
    },
    Sniper: {
      alignment: "Mafia",
      category: "Basic",
      tags: ["Killing", "Basic", "Gun", "Items", "Day Actions"],
      description: [
        "Starts with a gun.",
        "Gun does not reveal identity when fired.",
      ],
      SpecialInteractionsModifiers: {
        Loyal: [
          "Gun will do nothing when shooting players of a diffrent alignment.",
        ],
        Disloyal: [
          "Gun will do nothing when shooting players of the same alignment.",
        ],
        Holy: ["Gun will do nothing when shooting players with Demonic roles."],
        Unholy: [
          "Gun will do nothing when shooting players with non-Demonic roles.",
        ],
        Simple: [
          "Gun will do nothing when shooting players with Vanilla Roles.",
        ],
        Complex: ["Gun will do nothing when shooting players with PR Roles."],
        Refined: [
          "Gun will do nothing when shooting players with Banished Roles.",
        ],
        Unrefined: [
          "Gun will do nothing when shooting players with non-Banished Roles.",
        ],
        Vain: ["Will die when shooting players of the same alignment."],
        Weak: ["Will die when shooting players of a diffrent alignment."],
        Sacrificial: ["Will die when shooting the gun."],
        Regretful: ["Will die when killing a player with the gun."],
        Random: ["Gun will shoot a Random player when used."],
        Narcissistic: ["Gun will have 50% chance to self target when used."],
      },
    },
    //killing roles
    Arsonist: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Gasoline", "Visiting", "Day Actions", "Basic"],
      description: [
        `Each night, can choose to visit one player and make them "Doused".`,
        `Once per game during the day, can choose to kill all players that are "Doused".`,
        //"Douses one player with Gasoline each night.",
        //"Chooses to light a match during the day to burn doused players to ashes.",
      ],
      nightOrder: [["Douse In Gasoline", PRIORITY_EFFECT_GIVER_DEFAULT - 1]],
    },
    Caporegime: {
      alignment: "Mafia",
      category: "Killing",
      tags: [
        "Killing",
        "Visit Interaction",
        "Extra Night Deaths",
        "Visiting",
        "Basic",
      ],
      description: [
        "Each night, can choose to visit one player and kill them if a non-Mafia player visits them.",
        //"Gives the kiss of death to someone each night.",
        //"Target will die if visited by a non-Mafia player that night.",
      ],
      nightOrder: [["Kill Target If Visited", PRIORITY_KILL_DEFAULT]],
    },
    Dentist: {
      alignment: "Mafia",
      tags: ["Killing", "Visits", "Visiting", "Basic"],
      description: [
        `Each night, can choose to visit one player and make them "Gassed".`,
        gassedDef,
      ],
      nightOrder: [["Gas Player", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Hider: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Setup Change", "Hide and Seek", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and kill them if their role is Seeker or Invader.",
        "Forces a Seeker or Invader to Spawn in closed Setups.",
      ],
      nightOrder: [["Guess Seeker/Invader", 0]],
      RolesMadeBy: ["Seeker", "Invader"],
    },
    Hitman: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Extra Night Deaths", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and kill them.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT]],
    },
    Jinx: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Word Kill", "Visiting", "Speaking", "Basic"],
      description: [
        "Each night, can choose a word.",
        `Each night, can choose to visit one player and "Jinx" them with the chosen word for the following day.`,
        jinxDef,
        //"Curses a player with a forbidden word each night.",
        //"If the player speaks the word the next day, they will die.",
      ],
      nightOrder: [["Curse Word", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Poisoner: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Poison", "Malicious Effects", "Visiting", "Basic"],
      description: [
        `Each night, can choose to visit one player and "Poison" them`,
        poisonDef,
        //"Concocts a deadly poison and administers it to one player each night.",
        //"The poisoned target will die at the end of the following night unless saved.",
      ],
      nightOrder: [["Poison", PRIORITY_EFFECT_GIVER_EARLY]],
    },
    Queen: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Win Con", "Advanced"],
      description: [
        "If the Queen is the only Mafia alive at the start of the day, they will start a beheading.",
        "During a beheading, if a the Queen is alive at the end of the day, all non-Mafia players die.",
      ],
    },
    Rottweiler: {
      alignment: "Mafia",
      category: "Killing",
      tags: [
        "Killing",
        "Extra Night Deaths",
        "Visit Interaction",
        "Visiting",
        "Basic",
      ],
      description: [
        "Each night, can choose to visit one player and kill one player who visits them.",
        "Preferentially kills Mafia, Cult, Independents, then Villagers.",
        "Other players who visit the chosen player will learn who the Rottweiler is.",
        //"Each night, visits one player and kills one of their visitors.",
        //"Other visitors will learn the identity of the Rottweiler.",
      ],
      nightOrder: [["Trap", PRIORITY_KILL_DEFAULT]],
    },
    Terrorist: {
      alignment: "Mafia",
      category: "Killing",
      tags: ["Killing", "Self Kill", "Day Actions", "Basic"],
      description: [
        "Once per game during the day, can choose to kill themself and another player.",
      ],
    },
    //investigative roles
    Actress: {
      alignment: "Mafia",
      category: "Investigative",
      tags: [
        "Information",
        "Roles",
        "Deception",
        "Suits",
        "Visiting",
        "Advanced",
      ],
      description: [
        "Each night, can choose to visit one player and learn their role.",
        "Will appear as that player's role on death and to information roles.",
        //"Visits a player to appears as their role.",
        //"Learns chosen player's role.",
      ],
      nightOrder: [
        [
          "Learn role and change appearance",
          PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
        ],
      ],
    },
    Bondsman: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Roles", "Visiting", "Guess", "Basic"],
      description: [
        "Each night, chooses a role.",
        "Each night, can choose to visit one player and learn if their role is the selected role.",
      ],
      nightOrder: [["Guess Role", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Caser: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Roles", "Basic"],
      description: [
        "Each night, can choose to visit one player and learn what roles visited them.",
      ],
      nightOrder: [["Watch", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5]],
    },
    Informant: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Reports", "Visiting", "Basic"],
      description: [
        "Chooses a player each night and views any reports they receive the following day.",
      ],
      nightOrder: [
        ["Learn Reports", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 2],
      ],
    },
    Lookout: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Basic"],
      description: [
        "Each night, can choose to visit one player and learn who visited them.",
      ],
      nightOrder: [["Watch", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5]],
    },
    Lurker: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and learn if they visited anybody.",
      ],
      nightOrder: [["Binary Track", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Revisionist: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Reports", "Dead", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one dead player and learn all system messages they ever received.",
      ],
      nightOrder: [["Learn Reports", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Scout: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Visit Interaction", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and learn who they visited.",
      ],
      nightOrder: [["Track", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Stalker: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Roles", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and learn their role.",
      ],
      nightOrder: [["Learn Role", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Wrangler: {
      alignment: "Mafia",
      category: "Investigative",
      tags: ["Information", "Roles", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player.",
        "If that player is the first to speak or vote the following day, that player's role is revealed to the Mafia.",
        //"Each night visits a player, If that player is first to speak or vote the following day, that player's role is revealed to the Mafia.",
      ],
      nightOrder: [["Learn Role", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    //unsorted
    Hooker: {
      alignment: "Mafia",
      tags: ["Role Blocker", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and block their night actions.",
      ],
      nightOrder: [["Block", PRIORITY_NIGHT_ROLE_BLOCKER]],
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
          label: "Halloween",
          value: "halloween",
        },
      ],
    },
    Pimp: {
      alignment: "Mafia",
      category: "Manipulative",
      tags: ["Manipulative", "Delirium", "Visiting", "Advanced"],
      description: [
        `Each night, can choose to visit one player and make them "Delirious" until the next night.`,
        deliriumDef,
      ],
      nightOrder: [["Give Delirium", PRIORITY_NIGHT_ROLE_BLOCKER + 1]],
    },
    Don: {
      alignment: "Mafia",
      tags: ["Condemn Interaction", "Overturn", "Dusk", "Advanced"],
      description: [
        "Once per game at dusk, can choose to change the target of a condemation.",
        "Cannot change the target to no one.",
        "Cannot cancel a village condemnation on a Mafia-aligned player.",
        "Choosing no one or the original target preserves the Don's override ability.",
      ],
    },
    Driver: {
      alignment: "Mafia",
      tags: ["Redirection", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit two players and swap their visitors.",
        "Players who visit first player will be redirected to second player.",
        "Players who visit second player will be redirected to first player.",
      ],
      nightOrder: [["Swap Visitors", PRIORITY_SWAP_VISITORS]],
      SpecialInteractions: {
        Drunk: ["If a Drunk blocks a Driver, The Driver dies."],
      },
    },
    Gondolier: {
      alignment: "Mafia",
      tags: ["Redirection", "Control", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player.",
        "Each night, can choose to redirect that player's visits on to another player. (Not a visit)",
      ],
      nightOrder: [["Control Player", PRIORITY_REDIRECT_ACTION]],
    },
    Snitch: {
      alignment: "Mafia",
      tags: ["Redirection", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit two players and redirect anyone who visits the first player to the second player.",
        //"Chooses one player every night to snitch on.",
        //"Chooses another player to divert attention from and redirect their visitors to the first target.",
      ],
      nightOrder: [["Deflect Visitors", PRIORITY_REDIRECT_ACTION + 3]],
    },
    Ninja: {
      alignment: "Mafia",
      tags: ["Deception", "Astral", "Basic"],
      description: [
        "Does not visit when preforming the mafia kill.",
        //"Does not get detected by watchers and trackers.",
        //"Does not trigger any when visited abilities on the target.",
        "Kills players holding Bombs without setting off the explosion.",
      ],
      nightOrder: [["Make Mafia kill astral", PRIORITY_NIGHT_ROLE_BLOCKER + 5]],
    },
    Vizier: {
      alignment: "Mafia",
      tags: ["Garbage", "Voting", "Items", "Advanced"],
      description: [
        "While alive, the Mafia's kill is replaced with a Coronation meeting.",
        "One player is picked to be King for the next day. Their vote is worth 10000 votes.",
        "The Vizier cannot pick the same player to be King twice in a row.",
        "Upon death, the Mafia reverts to killing.",
      ],
      nightOrder: [["Give Sceptre", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Santista: {
      alignment: "Mafia",
      tags: ["Meeting", "Advanced"],
      description: [
        "While at least one Santista is alive, the Mafia gain a day meeting.",
      ],
    },
    Lawyer: {
      alignment: "Mafia",
      tags: ["Deception", "Alignment", "Visiting", "Basic"],
      description: [
        "Chooses a player each night and flips their alignment to investigative roles.",
      ],
      nightOrder: [
        ["Flip Alignment", PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT],
      ],
    },
    Framer: {
      alignment: "Mafia",
      tags: ["Deception", "Visit Interaction", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player.",
        "Each night, can choose to make that player appear to visit another player to information roles. (Not a visit)",
        //"At night chooses two players, The 1st Player will appear to visit the 2nd Player to Investigative Roles.",
        //"The Framer will not visit the 2nd Player.",
      ],
      nightOrder: [
        ["Create Fake Visits", PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT],
      ],
    },
    Disguiser: {
      alignment: "Mafia",
      tags: ["Speaking", "Disguise", "Expert"],
      description: [
        "Each night, can choose to steal the identity of the player the Mafia kills.",
        //"Chooses to steal the identity of the Mafia kill each night.",
        "Cannot be targeted while disguised as another player.",
      ],
      nightOrder: [["Steal Indentity", PRIORITY_IDENTITY_STEALER]],
    },
    Janitor: {
      alignment: "Mafia",
      tags: ["Clean", "Information", "Roles", "Basic"],
      description: [
        "Once per game at night, can choose to hide and learn the role of the player killed by the Mafia.",
        //"Chooses to clean a mafia kill once per game.",
        //"Player's role will be hidden from the town if kill is successful.",
        //"Learns the cleaned player's role.",
      ],
      nightOrder: [["Clean", PRIORITY_CLEAN_DEATH]],
    },
    Undertaker: {
      alignment: "Mafia",
      tags: [
        "Clean",
        "Information",
        "Roles",
        "Dusk",
        "Condemn Interaction",
        "Basic",
      ],
      description: [
        "Once per game at dusk, can choose to hide and learn the condemned player's role",
        //"Chooses to clean a condemnation once per game.",
        //"Player's role will be hidden from the town if condemnation is successful.",
        //"Learns the cleaned player's role.",
      ],
    },
    Ghostbuster: {
      alignment: "Mafia",
      recentlyAdded: true,
      category: "Night-acting",
      tags: ["Dead", "Graveyard", "Exorcise", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one dead player and exorcise them.",
        "Exorcised players can't be revived or use graveyard abilities.",
      ],
      nightOrder: [["Exorcise", PRIORITY_KILL_EXORCISE]],
    },
    Strongman: {
      alignment: "Mafia",
      tags: ["Kill Interaction", "Support", "Unstoppable", "Advanced"],
      description: [
        "Once per game at night, can choose to make the mafia kill ignore protection and blocking.",
      ],
      nightOrder: [["Strength Kill", PRIORITY_MODIFY_ACTION_LABELS]],
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
      tags: [
        "Killing",
        "Items",
        "Gun",
        "Tommy Gun",
        "Visiting",
        "Alignment",
        "Advanced",
      ],
      description: [
        `Each night, can choose to visit one player and give them a Gun.`,
        gunDef,
        "Guns given by the Gunrunner will only kill if the player being shot is the same alignment as the shooter.",
      ],
      nightOrder: [["Give Tommy Gun", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Tailor: {
      alignment: "Mafia",
      tags: ["Gifting", "Deception", "Items", "Suits", "Visiting", "Advanced"],
      description: [
        "Each night, chooses a role.",
        "Each night, can choose to visit one player and give them a Suit of that role.",
        "A Suit causes its holder to appear a role on death and to information roles.",
      ],
      nightOrder: [["Give Suit", PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT]],
    },
    Fabricator: {
      alignment: "Mafia",
      tags: ["Gifting", "Broken", "Items", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and give them a broken item.",
        "Broken Guns, Rifles, Knives, and Whiskey, will backfire against the player who used them.",
        "Broken Falcons and Candles will give false information.",
        "Broken Armor, Crystal balls, Coffee, Keys, Envlopes, Bread, and Syringes will do nothing.",
      ],
      nightOrder: [["Give Broken Items", PRIORITY_ITEM_GIVER_EARLY]],
    },
    Saboteur: {
      alignment: "Mafia",
      tags: ["Broken", "Items", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and break any items they have.",
        "Broken Guns, Rifles, Knives, and Whiskey, will backfire against the player who used them.",
        "Broken Falcons and Candles will give false information.",
        "Broken Armor, Crystal balls, Coffee, Keys, Envlopes, Bread, and Syringes will do nothing.",
      ],
      nightOrder: [
        ["Break Items Agian", PRIORITY_ITEM_TAKER_DEFAULT + 1],
        ["Break Items", PRIORITY_ITEM_TAKER_EARLY + 1],
      ],
    },
    Heartbreaker: {
      alignment: "Mafia",
      tags: ["Linked", "Lover", "Visiting", "Advanced"],
      description: [
        `Once per game at night, can choose to visit one player and makes that player "Lovesick" for the Heartbreaker.`,
        lovesickDef,
        "If the Heartbreaker dies, the beloved player also dies.",
        //"Both players will die if Heartbreaker dies.",
      ],
      nightOrder: [["Heart Break", PRIORITY_EFFECT_GIVER_EARLY]],
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
        "Once per game at night, can choose to visit one player and die, then convert that player to Mafioso",
        //"Chooses to sacrifice self once per game to convert another player to Mafioso.",
      ],
      nightOrder: [["Convert and Die", PRIORITY_CONVERT_DEFAULT + 1]],
      RolesMadeBy: ["Mafioso"],
    },
    Graverobber: {
      alignment: "Mafia",
      tags: ["Revive", "Protective", "Graveyard", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one dead player and revive them.",
      ],
      nightOrder: [["Revive", PRIORITY_NIGHT_REVIVER]],
      graveyardParticipation: "all",
    },
    Mummy: {
      alignment: "Mafia",
      tags: ["Trash", "Dead", "Killing", "Visits"],
      description: [
        "Each night, if the mummy is dead, each player who visits the Mummy will be killed.",
        //"Everyone who visits the mummy while the mummy is dead will die.",
      ],
      nightOrder: [["Kill Visitors", PRIORITY_KILL_DEFAULT]],
    },
    Illusionist: {
      alignment: "Mafia",
      tags: ["Killing", "Gun", "Items", "Day Actions", "Advanced"],
      description: [
        "Starts with a gun.",
        "Each night, choose to visit one player and make any guns the Illusionist uses appear as being used by that player the following day.",
        //"Any guns the Illusionist uses will appear as being used by that player the following day",
        //"Chooses one player each night to frame as the shooter of any guns or rifles shot by the Illusionist.",
      ],
      nightOrder: [["Frame Shooter", PRIORITY_ITEM_GIVER_DEFAULT + 1]],
    },
    Librarian: {
      alignment: "Mafia",
      tags: ["Speech", "Whispers", "Silence", "Basic"],
      description: [
        `Once per game at night, can make all players "Muffled" for the following day.`,
        muffledDef,
        //"While in a Library meeting, players can only whisper instead of speaking aloud.",
      ],
      nightOrder: [["Silence", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Dilettante: {
      alignment: "Mafia",
      tags: ["Speech", "Whispers", "Silence", "Advanced", "Speaking"],
      description: [
        "Vote weight is worth 0 votes",
        "Each Night, can choose a 4-20 letter phrase.",
        "The Dilettante's vote weight increases by 1 for every Village-Aligned player who says the phrase during the day.",
        "Each Night, the Dilettante's vote weight resets.",
        `All players who said the phrase will be "Muffled" following day.`,
        muffledDef,
      ],
      nightOrder: [
        ["Choose Word and Silence Players", PRIORITY_EFFECT_GIVER_DEFAULT],
      ],
    },
    Sicario: {
      alignment: "Mafia",
      tags: [
        "Killing",
        "Reflexive",
        "Knife",
        "Items",
        "Malicious Effects",
        "Advanced",
      ],
      description: [
        "Receives a Knife if not visited during the night.",
        knifeDef,
        bleedingDef,
        "A knife used by the Sicario does not reveal.",
      ],
      nightOrder: [["Gain Knife", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Scrutineer: {
      alignment: "Mafia",
      tags: ["Killing", "Voting", "Vote Kills", "Visiting", "Advanced"],
      description: [
        `Each night, can choose to visit two players and make first player have "Cold Feet" towards the second player.`,
        coldfeetDef,
        //"Chooses a victim and a target each night.",
        //"If the victim votes for the target in the village meeting the following day, the victim will die.",
      ],
      nightOrder: [["Curse Player", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Trespasser: {
      alignment: "Mafia",
      tags: ["Night-Acting", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player.",
        "Mafia roles with the Scatterbrained modifier appear as this role to self.",
      ],
      nightOrder: [["Visit", PRIORITY_SUPPORT_VISIT_DEFAULT]],
    },
    Thief: {
      alignment: "Mafia",
      tags: ["Items", "Night-Acting", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and steal an item from them.",
      ],
      nightOrder: [
        ["Steal Item secound try", PRIORITY_ITEM_TAKER_DEFAULT],
        ["Steal Item", PRIORITY_ITEM_TAKER_EARLY],
      ],
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
        "Each day, can choose a dead player.",
        "Meets anonymously with the chosen player at night",
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
        "Each dusk, if no one was condemned, chooses a player.",
        "Meets anonymously with the chosen player at night and the chosen player cannot perform night actions and blocks the night actions of any players who visit the the chosen player.",
        "The Interrogator can choose to kill the chosen player.",
      ],
      nightOrder: [
        ["Execute Prisoner", PRIORITY_KILL_DEFAULT],
        ["Block Jailed Player's Visitors", PRIORITY_UNTARGETABLE - 5],
      ],
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
      tags: [
        "Killing",
        "Condemn",
        "Voting",
        "Extra Night Deaths",
        "Visiting",
        "Advanced",
      ],
      description: [
        "Each night, can choose to visit one player.",
        "If that player is condemned the following day, then at night the Bookie will be able to choose to vist one player and kill them.",
        //"If they successfully predict the village vote, they gain a bonus kill.",
      ],
      nightOrder: [
        ["Kill", PRIORITY_KILL_DEFAULT],
        ["Guess Condemn Target", PRIORITY_SUPPORT_VISIT_DEFAULT],
      ],
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
        "Each night, chooses a player.",
        "Gains that player's abilites until the next night.",
      ],
    },
    Blackguard: {
      alignment: "Mafia",
      category: "Night-acting",
      tags: ["Kill Interaction", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player.",
        "If that player dies, the Blackguard will gains that player's abilities.",
      ],
      nightOrder: [["Gain abilities if Target dies", PRIORITY_PREKILL_ACTION]],
    },
    Associate: {
      alignment: "Mafia",
      category: "Manipulative",
      tags: ["Manipulative", "Conversion", "Delirium", "Advanced"],
      description: [
        "Once per game at night, can choose Mafia-aligned role from the setup.",
        "The Associate will convert to the chosen role.",
        `If the chosen role is already in play, The player with that role will be "Delirious" until the Associate dies.`,
        deliriumDef,
        "Does not attend the mafia meeting.",
      ],
      nightOrder: [
        ["Become Role and Make Delirious", PRIORITY_NIGHT_ROLE_BLOCKER + 1],
      ],
    },
    Consigliere: {
      alignment: "Mafia",
      category: "Manipulative",
      tags: ["Advanced", "Banished Interaction"],
      description: [
        "Each night, can choose a banished Mafia role and gains its abilities until the next night.",
        "Cannot select a role they already selected.",
      ],
    },
    Oddfather: {
      alignment: "Mafia",
      category: "Manipulative",
      tags: ["Advanced", "Banished Interaction"],
      description: [
        "Has the abilities of up to 5 banished Mafia roles.",
        "Cannot have the Oddfather ability.",
      ],
    },
    Apprentice: {
      alignment: "Mafia",
      tags: ["Conversion", "Dead", "Basic"],
      description: [
        "Once per game at night, can choose to visit one dead Mafia-aligned player and convert to their role.",
      ],
      nightOrder: [["Become Dead Role", PRIORITY_BECOME_DEAD_ROLE]],
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
        `Each night, can choose to visit one player and make them "Deaf" for the following day`,
        deafDef,
      ],
      nightOrder: [["Deafen", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Silencer: {
      alignment: "Mafia",
      tags: ["Speech", "Silence", "Visiting", "Basic"],
      description: [
        `Each night, can choose to visit one player and make them "Silent" for the following day`,
        silentDef,
      ],
      nightOrder: [["Silence", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Scrambler: {
      alignment: "Mafia",
      tags: ["Speech", "Clueless", "Random Messages", "Visiting", "Basic"],
      description: [
        //"Scrambles a player each night, causing them to see messages from random players the next day.",
        `Each night, can choose to visit one player and make them "Clueless" for the following day`,
        cluelessDef,
      ],
      nightOrder: [["Scramble", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Paparazzo: {
      alignment: "Mafia",
      tags: ["Condemn", "Revealing", "Information", "Dusk", "Basic"],
      description: [
        "If the Paparazzo is condemned, they can choose a player and reveal their role to the Mafia.",
        //"If condemned, can choose to reveal the role of one player to the Mafia.",
      ],
    },
    Fed: {
      alignment: "Mafia",
      tags: ["Condemn", "Voting", "Advanced"],
      description: [
        "Votes for a Fed will not count unless every Village-aligned player votes for them.",
      ],
    },
    Rainmaker: {
      alignment: "Mafia",
      tags: ["Voting", "Meeting", "Condemn", "Basic"],
      description: [
        "Once a game at night, can choose to force players to vote for no one the next day.",
      ],
      nightOrder: [["Summon Rain", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Weatherman: {
      alignment: "Mafia",
      tags: ["Events", "Advanced"],
      description: [
        "Each night, can choose an Event, that Event occurs.",
        //"At Night can Choose an Event.",
        //"That Event will Occur in addition to any other Events.",
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
      description: [
        "Each night, can choose to visit one player.",
        "That player will be redirected to the Toreador.",
      ],
      nightOrder: [["Redirect Action", PRIORITY_REDIRECT_ACTION + 2]],
    },
    Blinder: {
      alignment: "Mafia",
      tags: ["Speech", "Blind", "Visiting", "Basic"],
      description: [
        `Each night, can choose to visit one player and make them "Blind" for the following day`,
        blindDef,
      ],
      nightOrder: [["Blind", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Quack: {
      alignment: "Mafia",
      tags: ["Protective", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and protect them from death.",
      ],
      nightOrder: [["Protect", PRIORITY_NIGHT_SAVER]],
    },
    Homeopath: {
      alignment: "Mafia",
      tags: ["Malicious Effects", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and remove any malicious effects they have.",
        MalEffects,
      ],
      nightOrder: [
        ["Remove Effects", PRIORITY_EFFECT_REMOVER_DEFAULT],
        ["Remove Effects", PRIORITY_EFFECT_REMOVER_EARLY],
      ],
    },
    Dealer: {
      alignment: "Mafia",
      category: "Reflexive",
      tags: ["Reflexive", "Malicious Effects", "Role Share", "Advanced"],
      description: [
        "Each night, each player who visits the Apothecary will have any malicious effects they have removed and will be protected from death.",
        "Players who Role Share with an Apothecary will have any malicious effects they have removed.",
        MalEffects,
      ],
      nightOrder: [
        ["Remove Effects", PRIORITY_EFFECT_REMOVER_DEFAULT],
        ["Remove Effects", PRIORITY_EFFECT_REMOVER_EARLY],
      ],
    },
    Diplomat: {
      alignment: "Mafia",
      tags: ["Condemn", "Protective", "Condemn Immune", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and protect them from being condemned the following day",
        "Cannot choose to visit the player they visited the previous night",
      ],
      nightOrder: [["Make Safe from Condemns", PRIORITY_EFFECT_GIVER_DEFAULT]],
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
        "Each night, can choose to visit one player and prevent them from being converted to another role.",
        "If an Enforcer visits a Hostile Independent, the Hostile Independent will be converted to Traitor.",
      ],
      nightOrder: [["Save from Conversion", PRIORITY_NIGHT_SAVER - 1]],
    },
    Forger: {
      alignment: "Mafia",
      tags: ["Deception", "Will", "Information", "Advanced"],
      description: [
        "Each night, can choose to visit one player and rewrite their will.",
        "Learns that player's real will on the next day.",
      ],
      nightOrder: [["Forge Will", PRIORITY_EFFECT_GIVER_EARLY]],
    },
    Bouncer: {
      alignment: "Mafia",
      tags: [
        "Night-acting",
        "Role Blocker",
        "Visit Interaction",
        "Visiting",
        "Basic",
      ],
      description: [
        "Each night, can choose to visit one player and block the night actions of any players who visit them.",
      ],
      nightOrder: [["Block Visitors", PRIORITY_UNTARGETABLE]],
    },
    Plumber: {
      alignment: "Mafia",
      tags: ["Whispers", "Speech", "Visiting", "Basic"],
      description: [
        `Each night, can choose to visit one player and make them "Sealed" for the following day`,
        sealedDef,
      ],
      nightOrder: [["Block Whispers", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Gossiper: {
      alignment: "Mafia",
      tags: ["Whispers", "Speech", "Visiting", "Basic"],
      description: [
        `Each night, can choose to visit one player and make them "Leaky" for the following day`,
        leakyDef,
      ],
      nightOrder: [["Make Leaky", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Paralyzer: {
      alignment: "Mafia",
      tags: ["Voting", "Advanced"],
      description: [
        `Once per game during the day, can choose to make all players "Paralyzed" for rest of the day.`,
        paralyzedDef,
      ],
    },
    Electrician: {
      alignment: "Mafia",
      tags: ["Voting", "Speech", "Eclipse", "Blind", "Basic", "Day Actions"],
      description: [
        `Once per game during the day, can choose to make all players "Blind" for rest of the day.`,
        blindDef,
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
        "Each night, can choose to visit one player and convert them to their alignment's vanilla role.",
        "Village roles convert to Villager. Cult roles convert to Cultist. Independent roles convert to Grouch.",
      ],
      nightOrder: [["Convert to Vanilla", PRIORITY_CONVERT_DEFAULT + 8]],
      RolesMadeBy: ["Villager", "Cultist", "Grouch"],
    },
    Nun: {
      alignment: "Mafia",
      category: "Night-acting",
      tags: ["Modifiers", "Conversion", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and remove modifiers from their role.",
      ],
      nightOrder: [["Remove Modifiers", PRIORITY_CONVERT_DEFAULT + 7]],
    },
    Tattooist: {
      alignment: "Mafia",
      category: "Night-acting",
      tags: ["Modifiers", "Conversion", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and add a random modifier to their role.",
        "Cannot add Exclusive, Clannish, Inclusive, or Starting Item modifiers.",
      ],
      nightOrder: [["Add Modifiers", PRIORITY_CONVERT_DEFAULT + 6]],
    },
    Pedagogue: {
      alignment: "Mafia",
      tags: ["Conversion", "Random", "Visiting", "Expert"],
      description: [
        "Each night, can choose to visit one Mafia-aligned player and convert to a random Mafia-aligned role.",
      ],
      nightOrder: [["Randomize Role", PRIORITY_CONVERT_DEFAULT + 3]],
      RolesMadeBy: ["All Mafia Roles"],
    },
    Bartender: {
      alignment: "Mafia",
      tags: ["Effects", "Alcoholics", "Role Blocker", "Visiting", "Advanced"],
      description: [
        `Each night, can choose to visit one player and make them become "Alcoholic"`,
        alcoholicDef,
      ],
      nightOrder: [["Make Alcoholic", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Rat: {
      alignment: "Mafia",
      tags: ["Manipulative", "Redirection", "Reflexive", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and redirect anyone who visits the Rat to that player.",
      ],
      nightOrder: [["Redirect Visitors", PRIORITY_MODIFY_ACTION]],
    },
    Cannoneer: {
      alignment: "Mafia",
      tags: ["Killing", "Gun", "Items", "Day Actions", "Basic"],
      description: [
        "Will gain a gun once per game if Mafia chose to abstain from killing the previous night.",
        "Gun will always reveal the shooter.",
      ],
      SpecialInteractionsModifiers: {
        Loyal: [
          "Gun will do nothing when shooting players of a diffrent alignment.",
        ],
        Disloyal: [
          "Gun will do nothing when shooting players of the same alignment.",
        ],
        Holy: ["Gun will do nothing when shooting players with Demonic roles."],
        Unholy: [
          "Gun will do nothing when shooting players with non-Demonic roles.",
        ],
        Simple: [
          "Gun will do nothing when shooting players with Vanilla Roles.",
        ],
        Complex: ["Gun will do nothing when shooting players with PR Roles."],
        Refined: [
          "Gun will do nothing when shooting players with Banished Roles.",
        ],
        Unrefined: [
          "Gun will do nothing when shooting players with non-Banished Roles.",
        ],
        Vain: ["Will die when shooting players of the same alignment."],
        Weak: ["Will die when shooting players of a diffrent alignment."],
        Sacrificial: ["Will die when shooting the gun."],
        Regretful: ["Will die when killing a player with the gun."],
        Random: ["Gun will shoot a Random player when used."],
        Narcissistic: ["Gun will have 50% chance to self target when used."],
      },
      nightOrder: [["Gain Gun", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Imposter: {
      alignment: "Mafia",
      tags: ["Deception", "Night-acting", "No Investigate", "Basic"],
      description: [
        "Each night, can choose a role and will appear as that role on death and to information roles.",
        "Cannot choose Villager, Impersonator or Imposter",
      ],
      nightOrder: [
        ["Disguise Self", PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT],
      ],
      SpecialInteractions: {
        Ghost: ["If a Ghost is Present, an Imposter will learn the real word."],
      },
    },
    Assassin: {
      alignment: "Mafia",
      tags: ["Mini-game", "Essential", "Split Decision", "Killing", "Advanced"],
      description: [
        "Splits all players into two rooms.",
        "During the Day, each room meets and chooses a leader.",
        "At night, room leaders meet and choose players to switch rooms.",
        "After three rounds of switching, the Assassin will kill all players who are in the same room as them.",
        "Mafia will not win by majority if an Assassin is alive.",
      ],
      nightOrder: [["Kill players in Room", PRIORITY_KILL_DEFAULT]],
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
      SpecialInteractionsModifiers: {
        "X-Shot": ["Splits players into an additional room."],
        Delayed: ["Adds an extra round of switching before killing."],
      },
    },
    Stylist: {
      alignment: "Mafia",
      category: "Night-acting",
      tags: ["Conversion", "Role Swapping", "Visiting", "Advanced"],
      description: [
        `Each night, can choose to visit two players and make them swap roles but not alignments.`,
        "Cannot swap Independent roles",
      ],
      nightOrder: [["Swap Roles", PRIORITY_SWAP_ROLES + 1]],
    },
    Busybody: {
      alignment: "Mafia",
      tags: ["Mini-game", "FalseMode", "Voting", "Speaking", "Expert"],
      description: [
        "Each night, assigns their teammates a task to complete the following day.",
        "Tasks will be related to voting and sending messages.",
        "At night if all living teammates complete their task, the Busybody may choose to make all information false for the night or grant each mafia member an extra role ability.",
      ],
      SpecialInteractions: {
        Butterfly: [
          "If Butterfly is in the setup, the Busybody can choose to revive all dead players as random Independent roles.",
        ],
        nightOrder: [
          ["Make Info False or Grant Ability", PRIORITY_EFFECT_GIVER_EARLY],
        ],
      },
    },
    Prankster: {
      alignment: "Mafia",
      category: "Gaming",
      tags: ["Voting", "Conversion", "Expert"],
      description: ["The first player to vote the Prankster becomes Fool."],
      SpecialInteractionsModifiers: {
        Loyal: [
          "If the first player to vote for the Prankster is a different alignment to the Prankster, nothing happens.",
        ],
        Disloyal: [
          "If the first player to vote for the Prankster is the same alignment of the Prankster, nothing happens.",
        ],
        Holy: [
          "If the first player to vote for the Prankster is Demonic, nothing happens.",
        ],
        Unholy: [
          "If the first player to vote for the Prankster is non-Demonic, nothing happens.",
        ],
        Simple: [
          "If the first player to vote for the Prankster is a Power Role, nothing happens.",
        ],
        Complex: [
          "If the first player to vote for the Prankster is a Vanilla Role, nothing happens.",
        ],
        Refined: [
          "If the first player to vote for the Prankster is a Banished Role, nothing happens.",
        ],
        Unrefined: [
          "If the first player to vote for the Prankster is a non-Banished Role, nothing happens.",
        ],
      },
      RolesMadeBy: ["Fool"],
    },
    "Banished Mafia": {
      alignment: "Mafia",
      tags: ["Banished Interaction", "Basic"],
      description: [
        "Before the game starts, is replaced with a random Banished Mafia role.",
      ],
    },

    //Cult
    //Basic
    Cultist: {
      alignment: "Cult",
      category: "Basic",
      tags: ["Vanilla", "Basic"],
      description: ["Meets with the Cult during the night."],
    },
    //Conversions
    "Cult Leader": {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Kills Cultist", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and convert them to Cultist.",
        "If the Cult Leader dies, all Cultists die.",
      ],
      nightOrder: [["Convert", PRIORITY_CONVERT_DEFAULT]],
      RolesMadeBy: ["Cultist"],
    },
    Doomsayer: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Kills Cultist", "Reflexive", "Role Share", "Basic"],
      description: [
        "Each night, each player who visits the Doomsayer will be converted to Cultist.",
        "Players who Role Share with the Doomsayer will be converted to Cultist",
        "If the Doomsayer dies, all Cultists die.",
      ],
      nightOrder: [["Convert", PRIORITY_CONVERT_DEFAULT]],
      RolesMadeBy: ["Cultist"],
    },
    Zombie: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Visiting", "Malicious Effects", "Advanced"],
      description: [
        `Each night, can choose to visit one player and "Infect" them.`,
        infectDef,
        //"Can infect one person each night.",
        //"That person converts to a zombie the next day.",
        //"Nurses can cure/prevent infections.",
        //"Survivors will be infected but will not turn.",
      ],
      nightOrder: [["Infect", PRIORITY_EFFECT_GIVER_DEFAULT]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Jockey",
          value: "jockey",
          achCount: 5,
        },
      ],
    },
    Hexer: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Messages", "Visiting", "Advanced"],
      description: [
        "Each night, can choose a word.",
        `Each night, can choose to visit one player and "Hex" them with the chosen word for the following day.`,
        hexDef,
      ],
      nightOrder: [["Hex", PRIORITY_EFFECT_GIVER_DEFAULT]],
      RolesMadeBy: ["Cultist"],
    },
    Inquisitor: {
      alignment: "Cult",
      category: "Conversion",
      tags: ["Conversion", "Killing", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and kill them.",
        "If that player survives, they will be converted to Cultist.",
      ],
      nightOrder: [["Kill or Convert", PRIORITY_KILL_DEFAULT + 1]],
      RolesMadeBy: ["Cultist"],
    },
    Invader: {
      alignment: "Cult",
      category: "Conversion",
      tags: [
        "Conversion",
        "Setup Changes",
        "Hide and Seek",
        "Visiting",
        "Basic",
      ],
      description: [
        "Each night, can choose to visit one player and convert them to Cultist if their role is Seeker or Hider.",
        "Forces a Seeker or Hider to Spawn in closed Setups.",
      ],
      nightOrder: [["Guess Hider/Seeker", PRIORITY_CONVERT_DEFAULT]],
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
        "Each night, can choose to visit one player and protect them from death.",
        "If the player the Witch Doctor protects is attacked, they will be converted to Cultist.",
        "All Cultists die if the Witch Doctor dies.",
      ],
      nightOrder: [["Convert and Save", PRIORITY_NIGHT_SAVER]],
      RolesMadeBy: ["Cultist"],
    },
    //Killing
    Diabolist: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Vote Kills", "Killing", "Voting", "Visiting", "Basic"],
      description: [
        `Each night, can choose to visit two players and make first player have "Cold Feet" towards the second player.`,
        coldfeetDef,
      ],
      nightOrder: [["Curse Player", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Harpy: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Killing", "Voting", "Visiting", "Advanced"],
      description: [
        "Chooses a victim and a target each night.",
        "If the victim doesn't get 1/3 of players to vote for the target the next day, a death will occur randomly between the target, the victim, or both.",
      ],
      nightOrder: [["Apply Voting Maddness", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Gorgon: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Killing", "Reflexive", "Day Actions", "Basic"],
      description: [
        "Each night, learns how many players visited them.",
        `Each night, each player who visits the Gorgon will become "Petrified" for the following day.`,
        `Once per game during the day, can choose to kill all players who are "Petrified".`,
      ],
      nightOrder: [
        ["Count Visitors", PRIORITY_INVESTIGATIVE_DEFAULT],
        ["Mark Visitors", PRIORITY_EFFECT_GIVER_DEFAULT],
      ],
    },
    Leech: {
      alignment: "Cult",
      category: "Killing",
      tags: ["Killing", "Blood", "Extra Lives", "Visiting", "Basic"],
      description: [
        //"Is bloodthirsty.",
        "Each night, can choose to visit one player and steal 50% of their blood.",
        "If that player dies from blood lose, the Leech gains an additional 50% of blood.",
        "Gains an extra life if they have 150% blood.",
      ],
      nightOrder: [["Drain Blood", PRIORITY_KILL_SPECIAL - 4]],
    },
    Slasher: {
      alignment: "Cult",
      category: "Killing",
      tags: [
        "Killing",
        "Malicious Effects",
        "Reflexive",
        "Knife",
        "Items",
        "Advanced",
      ],
      description: [
        "Each night, learns who visits them.",
        "Each night, gains a Knife for each non-Cult player who visits them",
        knifeDef,
        bleedingDef,
      ],
      nightOrder: [
        ["Gain Knife", PRIORITY_ITEM_GIVER_DEFAULT],
        ["Learn Visitors", PRIORITY_INVESTIGATIVE_DEFAULT],
      ],
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
        "In closed setups, replaces 1 non-Banished Village role with a Banished role or replaces 1 Banished Role with a non-Banished Village role.",
        "If that player is condemned the following day, then at night the Tormentor will be able to choose to vist one player and kill them.",
        "If a player with a Banished Role dies during the Day, then at night the Tormentor will be able to choose to vist one player and kill them..",
        "Knows which Banished Roles are in the Current Game.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT]],
    },
    Werewolf: {
      alignment: "Cult",
      category: "Killing",
      tags: [
        "Killing",
        "Lycan",
        "Effect",
        "Full Moons",
        "Visiting",
        "Advanced",
      ],
      description: [
        "When a Werewolf is present in the game, full moons will occur on even nights.",
        `Each night, can choose to visit one player and make them become "Lycanthropic"`,
        lycanthropicDef,
        "Cannot be killed during full moons",
        //, except for when visiting the Apothecary.
      ],
      nightOrder: [
        ["Create Lycan", PRIORITY_BITING_WOLF],
        ["Make Lycans Kill", PRIORITY_KILL_DEFAULT],
      ],
    },
    "Plague Doctor": {
      alignment: "Cult",
      category: "Killing",
      tags: ["Killing", "Virus", "Effect", "Neighbors", "Visiting", "Advanced"],
      description: [
        `On their first night, can choose to visit a player and "Plague" them.`,
        plagueDef,
        //"Each night the infected players will infect their neighbors.",
        //"Players who have been infected for 2 nights will die.",
      ],
      nightOrder: [
        ["Infect Player", PRIORITY_BITING_WOLF],
        ["Virus Kill", PRIORITY_KILL_DEFAULT],
      ],
    },
    //Speaking
    Banshee: {
      alignment: "Cult",
      category: "Speaking",
      tags: [
        "Speaking",
        "Overturn",
        "Condemn Interaction",
        "Roles",
        "Day Actions",
        "Advanced",
      ],
      description: [
        `Each night, a random non-Cult player is made "Mad" about a role the following day.`,
        madDef,
        //"That player must say the name of the role the following day or the vote will be overturned onto them.",
        `Each day, can choose a player, if that player is "Mad", the day ends and that player is condemned.`,
      ],
      nightOrder: [["Send Banshee Word", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Baphomet: {
      alignment: "Cult",
      category: "Speaking",
      tags: ["Meeting", "Setup Changes", "Basic"],
      description: [
        "Meets with Templars at night.",
        "Adds 1 Templar in Closed setups.",
      ],
      RolesMadeBy: ["Templar"],
    },
    Cthulhu: {
      alignment: "Cult",
      category: "Speaking",
      tags: [
        "Speaking",
        "Malicious Effects",
        "Reflexive",
        "Insanity",
        "Advanced",
      ],
      description: [
        `Each night, each player who visits Cthulhu will become "Insane".`,
        `Players who Role Share with the Cthulhu will become "Insane".`,
        insaneDef,
      ],
      nightOrder: [["Make Visitors Insane", PRIORITY_EFFECT_GIVER_DEFAULT]],
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
        `Each night, chooses one the following status effects "Silent", "Deaf", "Blind", or "Clueless"`,
        "Each night, can choose to visit a player and make them have the chosen status effect for the following day.",
        silentDef,
        deafDef,
        blindDef,
        cluelessDef,
        //"Thrush, which silences the target.",
        //"Aspergillus, which deafens the target.",
        //"Cataracts, which blinds the target.",
        //"Hallucinogens, which scrambles the target.",
        "Once a status effect has been chosen, it cannot be chosen again for the next two nights.",
      ],
      nightOrder: [["Apply Effect", PRIORITY_EFFECT_GIVER_DEFAULT]],
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
        "On their first night, must choose a player to visit and make them their host.",
        //"Chooses a player to Infest on their first night and Dies.",
        "Will count towards Cult Majority when dead and not exorcised.",
        "Can Speak as their host.",
        "Each night, can choose to redirect their host's visits on to another player. (Not a visit)",
        "If their host dies the Parasite is exorcised.",
      ],
      nightOrder: [
        ["Choose Host", PRIORITY_BLOCK_EARLY - 1],
        ["Control Host", PRIORITY_REDIRECT_ACTION],
      ],
      graveyardParticipation: "self",
    },
    Psion: {
      alignment: "Cult",
      category: "Speaking",
      tags: [
        "Speaking",
        "Malicious Effects",
        "Visit Interaction",
        "Visiting",
        "Insanity",
        "Advanced",
      ],
      description: [
        "Each night, can choose to visit one player.",
        `If that player is not visited by a non-Cult player during the next night, they will become "Insane".`,
        insaneDef,
      ],
      nightOrder: [["Mind Warp", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    //Manipulative
    "Cat Lady": {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Cat", "Role Blocker", "Information", "Roles", "Advanced"],
      description: [
        "Each day, can choose player to send a Cat.",
        "Players holding a Cat can choose to have their night actions blocked or have the Cat Lady learn their role.",
        //"Chooses a player to send them a cat, each day.",
        //"The player can choose to let the cat in during the night, or chase it out.",
        //"If the cat is let in, the player is blocked from performing night actions.",
        //"If the cat is chased out, the Cat Lady will learn the player's role.",
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
        "Each night, can choose to visit one Cult-aligned player and convert to a random Cult-aligned role.",
      ],
      nightOrder: [["Randomize Role", PRIORITY_CONVERT_DEFAULT + 3]],
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
        "Each night, can choose a role.",
        "Each night, can choose to visit one player and convert them to chosen role without changing their alignment.",
        "If the chosen role is already in play, The conversion fails.",
        "Independent roles can only be converted to other Independent roles.",
        "Non-independent roles can not be converted to Independent roles.",
      ],
      nightOrder: [["Convert", PRIORITY_CONVERT_DEFAULT + 4]],
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
        "Each night, can choose a non-Demonic Cult role.",
        `Each night, can choose to visit one player and "Infest" them with that role.`,
        infestedDef,
        //"If that player is condemned they will be converted to that role and become Transcendent.",
      ],
      nightOrder: [["Apply Effect", PRIORITY_EFFECT_GIVER_DEFAULT]],
      graveyardParticipation: "all",
    },
    Sidhe: {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Advanced", "Banished Interaction"],
      description: [
        "Each night, can choose a banished Cult role and gains its abilities until the next night.",
        "Cannot select a role they already selected.",
      ],
    },
    Yith: {
      alignment: "Cult",
      category: "Night-acting",
      tags: ["Kill Interaction", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player.",
        "If that player dies, the Yith will gains that player's abilities.",
      ],
      nightOrder: [["Gain abilities if Target dies", PRIORITY_PREKILL_ACTION]],
    },
    "Queen Bee": {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Delayed", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and delay their night actions until the following night.",
      ],
      nightOrder: [["Delay Action", PRIORITY_MODIFY_ACTION_DELAY]],
    },
    Selkie: {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Redirection", "Control", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit two players and redirect their visits onto each other.",
      ],
      nightOrder: [["Redirect Targets", PRIORITY_REDIRECT_ACTION + 1]],
    },
    "Snow Queen": {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Meeting", "Snow Storm", "Basic"],
      description: [
        "Once per game during the day, can choose to start a snowstorm.",
        "During a snowstorm all players can chat at night and all non-Cult players cannot preform night actions.",
      ],
    },
    Succubus: {
      alignment: "Cult",
      category: "Manipulative",
      tags: ["Manipulative", "Delirium", "Visiting", "Advanced"],
      description: [
        `Each night, can choose to visit one player and make them "Delirious" until the next night.`,
        deliriumDef,
      ],
      nightOrder: [["Give Delirium", PRIORITY_NIGHT_ROLE_BLOCKER + 1]],
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
        "Each night, can choose to visit one player.",
        "Each night, can choose to redirect that player's visits on to another player. (Not a visit)",
      ],
      nightOrder: [["Control Player", PRIORITY_REDIRECT_ACTION]],
    },
    Skinwalker: {
      alignment: "Cult",
      tags: ["Deception", "Night-acting", "Basic"],
      description: [
        "Each night, can choose a role and will appear as that role on death and to information roles.",
        "Cannot choose Villager, Impersonator or Imposter",
      ],
      nightOrder: [
        ["Disguise Self", PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT],
      ],
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
        "Each night, can choose one of three potions.",
        "A damaging potion, which kills a player.",
        "A restoring potion, which protects a player from death.",
        "An elucidating potion, which lets the Alchemist learn a players role.",
        "Each night, can choose to visit one player and use the selected potion on the player.",
        "Once a potion has been chosen, it cannot be chosen again for the next two nights.",
      ],
      nightOrder: [
        ["Save Player", PRIORITY_NIGHT_SAVER],
        ["Kill Player", PRIORITY_KILL_DEFAULT],
        ["Learn Role", PRIORITY_INVESTIGATIVE_DEFAULT],
      ],
    },
    Cannibal: {
      alignment: "Cult",
      category: "Chaos",
      tags: [
        "Killing",
        "Poison",
        "Famine",
        "Condemn Interaction",
        "Items",
        "Expert",
      ],
      description: [
        "When a non-Cult player is voted off, the Cannibal can cook the player.",
        "The cooked player is then served as two Stew to every member of the Cult.",
        "If the Stew is stolen by non-Cult players and then eaten, they will get poisoned.",
      ],
    },
    Changeling: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Win Con", "Information", "Condemn Interaction", "Advanced"],
      description: [
        "Is randomly assigned an opposing player as a Twin.",
        "The Changeling and their target will learn each other's roles.",
        "If the Village-aligned Twin is condemned, the Cult wins.",
      ],
    },
    Ghost: {
      alignment: "Cult",
      tags: ["Ghost", "Mini-game", "Dusk"],
      description: [
        "When present in the game, all non-Cult-aligned players will know one of two randomly-selected words: the real word and the fake word.",
        "All Village roles will learn the real word.",
        "All Mafia roles and Sleepwalkers will learn the fake word instead.",
        "Each night if no one was condemned, all Ghosts must choose one player. Then all players will give clues about their word starting with that player.",
        "When a Cult-aligned player is condemned, they may guess the real word, if correct Cult wins.",
      ],
    },
    Poet: {
      alignment: "Cult",
      tags: ["Ghost", "Mini-game", "Dusk", "Pregame Actions"],
      description: [
        "Before the game starts, chooses a real word and a fake word.",
        "Forces a Ghost to spawn in closed setups.",
        "If a Cult member guesses the real word, Village will have a chance to guess who the Poet is.",
        "On a correct guess, Village Wins and Cult loses.",
        "Appears as villager on death.",
        "Does not attend the cult meeting.",
      ],
      RolesMadeBy: ["Ghost"],
      graveyardParticipation: "all",
    },
    Reaper: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Win Con", "Condemn Interaction", "Speaking", "Expert"],
      description: [
        'If a Reaper says "I claim Reaper and choose (Player Name)" within the first minute of the day.',
        "If the chosen player survives until the end of the day, that player's team wins.",
        "A Reaper cannot choose themselves.",
      ],
      examples: [
        `On day 2 at the start of the day AngleLover90 says "I claim Reaper and choose BadHat120", BadHat120's role is Cultist. The Village decides to condemn AngleLover90, BadHat120 is still alive so Cult wins.`,
        `On day 4 at the start of the day SpiningTop23 says "i claim reaper and choose JohnYellow56", JohnYellow56's role is Villager. The Village decides to condemn no one, JohnYellow56 is still alive so Village wins.`,
        `On day 1 at the start of the day UnbrellaEater31 says "i claim Reaper and Choose AgletInspector77", AgletInspector77's role is Villager. The Village decides to condemn AgletInspector77, AgletInspector77 is dead so the game continues.`,
        `On day 1 after 1 minute of discussion GoldenFlower123 says "I claim Reaper and choose WindowOperator97", the first minute of the day has passed so GoldenFlower123's pick does nothing.`,
      ],
    },
    Devotee: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Conversion", "Demonic Interaction", "Basic"],
      description: [
        "If a Demonic or Vital Cult role dies, the Devotee will convert to that role.",
        "If there are less then 5 players alive, the Devotee has no ability.",
      ],
    },
    Zealot: {
      alignment: "Cult",
      category: "Chaos",
      tags: [
        "Win Con",
        "Condemn Interaction",
        "Demonic Interaction",
        "Advanced",
      ],
      description: [
        "If a Demonic or Vital Cult role is condemned and the game would have ended, the game will continue for 1 more day.",
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
        "Each night, can choose to visit one player and corrupt their items.",
        "Corrupted Guns, Rifles, and Knives will convert instead of killing.",
        "Corrupted Armor will make an Attacker Insane.",
        "Corrupted Tracts will convert a player to a random Cult role if converted.",
        "Corrupted Crystal Balls will reveal players as Cultist.",
        "Corrupted Syringes will resurrect players as Cultist.",
        "Corrupted Candles and Falcons will provide False Info.",
        "Corrupted Coffee will make the extra actions into conversions.",
        "Corrupted Whiskey will make Non-Cult Players Delirious.",
        "Corrupted Keys will not Block Cult.",
        "Corrupted Envelope messages will be gibberish.",
        "Corrupted Food Items will Poison players who eat them.",
      ],
      nightOrder: [
        ["Corrupt Items Agian", PRIORITY_ITEM_TAKER_DEFAULT + 1],
        ["Corrupt Items", PRIORITY_ITEM_TAKER_EARLY + 1],
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
        "Expert",
      ],
      description: [
        "Each night, can choose to visit one player and give them a corrupted item.",
        "Corrupted Guns, Rifles, and Knives will convert instead of killing.",
        "Corrupted Armor will make an Attacker Insane.",
        "Corrupted Tracts will convert a player to a random Cult role if converted.",
        "Corrupted Crystal Balls will reveal players as Cultist.",
        "Corrupted Syringes will resurrect players as Cultist.",
        "Corrupted Candles and Falcons will provide False Info.",
        "Corrupted Coffee will make the extra actions into conversions.",
        "Corrupted Whiskey will make Non-Cult Players Delirious.",
        "Corrupted Keys will not Block Cult.",
        "Corrupted Envelope messages will be gibberish.",
        "Corrupted Food Items will Poison players who eat them.",
      ],
      nightOrder: [["Give Cult Items", PRIORITY_ITEM_GIVER_EARLY]],
      RolesMadeBy: ["Cultist"],
    },
    Haruspex: {
      alignment: "Cult",
      category: "Chaos",
      tags: ["Extra Lives", "Protective", "Killing", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit two Cult-aligned players and kill the first player and give second player an extra life.",
      ],
      nightOrder: [["Kill to grant extra life", PRIORITY_KILL_SPECIAL - 3]],
    },
    //Demon/Endangered
    Imp: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Killing", "Conversion", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and kill them.",
        "If an Imp kills themselves, a random Cult-aligned player becomes an Imp.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_SPECIAL]],
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
        "Each night, can choose to visit one player and kill them.",
        "The first time a Jiangshi attacks a Banished Role, the Jiangshi will die instead and the Banished Player will be converted to Jiangshi.",
        "In closed setups, replaces 1 non-Banished Village role with a Banished role.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_SPECIAL]],
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
        "Each night, can choose to visit one player and kill them.",
        `If the Necromancer kills a Cult-aligned player, that player will gain the Transcendent modifier and make one of their non-banished Village-aligned neighbors "Delirious".`,
        deliriumDef,
        "In closed setups, replaces 1 Banished role with a non-Banished Village role.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT + 1]],
      graveyardParticipation: "all",
    },
    Lamia: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Killing", "Delirium", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and kill them.",
        `If that player survives, they will become "Delirious".`,
        deliriumDef,
        `If a Lamia attacks a "Delirious" player, that player will die even if protected.`,
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT]],
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
        "Each night, can choose to visit one player and kill them.",
        "While alive, most information created by Village roles is made false.",
        "If no one is condemned while Nyarlathotep is alive, the Cult wins.",
      ],
      SpecialInteractions: {
        Mayor: [
          "If Village wins due to the Mayor ability, Cult will not win due to Nyarlathotep's ability.",
        ],
      },
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT + 1]],
    },
    Puca: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Killing", "Delirium", "Poison", "Visiting", "Advanced"],
      description: [
        `Each night, can choose to visit one player and make "Delirious" and "Poison" them.`,
        deliriumDef,
        poisonDef,
        "Player's Poisoned by a Puca will not be told they were poisoned.",
      ],
      nightOrder: [
        ["Give Delirium and Poison", PRIORITY_NIGHT_ROLE_BLOCKER + 3],
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
        "Each night, can choose to visit one player and kill them.",
        `A Satyr's starting neighbors are "Delirious". Neighbors whose roles are banished or not village aligned are skipped over.`,
        `If a Satyr's starting neighbors stop being "Delirious", they will become "Delirious" the next night.`,
        deliriumDef,
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT + 1]],
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
        "Each night, can choose to visit one player and kill them.",
        `On the first night, must choose to visit one player and make them their vessel and "Delirious".`,
        `If a Lich's vessel stops being "Delirious", they will become "Delirious" the next night.`,
        deliriumDef,
        "A Lich dies if and only if their Vessel dies.",
      ],
      nightOrder: [
        ["Kill", PRIORITY_KILL_DEFAULT + 1],
        ["Choose Vessal", PRIORITY_BLOCK_EARLY - 1],
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
        "Advanced",
      ],
      description: [
        "Each night, can choose to visit two players and kill them.",
        "Players killed by a Shoggoth have a chance of reviving the following night.",
        "Shoggoth will only revive a player once per game.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT + 2]],
      graveyardParticipation: "all",
    },
    Snallygaster: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Killing", "Extra Night Deaths", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and kill them.",
        "Can choose to charge their kill instead of killing.",
        "If a Snallygaster chooses to charge kill, They can choose to visit three players and kill them the next night.",
      ],
      nightOrder: [
        ["Kill", PRIORITY_KILL_DEFAULT + 1],
        ["Charge", PRIORITY_KILL_DEFAULT - 1],
      ],
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
        "Each night, if no one was condemned, can choose to visit one player and kill them. (Even if dead)",
        "Will count towards Cult Majority when dead and not exorcised.",
        "If a Poltergeist is Exorcised, All Cult-aligned players die.",
        "If it is possible for a Poltergeist to spawn in a setup, Dead players can be voted in village meeting.",
        "If a dead Poltergeist is condemned in the Village Meeting, they are exorcised.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT]],
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
        "Each night, may choose three players.",
        "Each of the selected players will choose to live or die at dawn.",
        "The Warden will visit players that choose die and kill them.",
        "The Warden will visit players that choose live and revive them.",
        "If all three players choose live they the Warden will visit and kill all of them.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT + 1]],
      graveyardParticipation: "all",
    },
    Vampire: {
      alignment: "Cult",
      category: "Demon",
      tags: ["Killing", "Voting", "Setup Changes", "Visiting", "Expert"],
      description: [
        "Vampire votes only count if a Village-aligned player votes with them.",
        "Most players including all non-Village roles are Vampires",
        "Vampires will appear as random Non-Vampire evil roles on Investigations.",
        "Each Night, One Vampire must choose to visit one player and kill them.",
        "Vampires can only select Vampires for killing until 1 remains.",
        "Cult can only win when one or fewer Village players are alive.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT]],
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
      tags: ["Condemn", "Protective", "Condemn Immune", "Visiting", "Advanced"],
      description: [
        "Each night, can choose to visit one player and protect them from being condemned the following day",
        "Cannot choose to visit the player they visited the previous night",
      ],
      nightOrder: [["Make Safe from Condemns", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Count: {
      alignment: "Cult",
      tags: ["Banished Interaction", "Setup Changes", "Basic"],
      description: [
        "In closed setups, replaces 2 non-Banished Village role with a Banished roles.",
        //"If a Count is created mid-game, 2 Village/Independant players will be converted to Banished Roles.",
      ],
    },
    Shadow: {
      alignment: "Cult",
      tags: ["Information", "Visits", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and learn who they visited and who visited them.",
      ],
      nightOrder: [["Track and Watch", PRIORITY_INVESTIGATIVE_DEFAULT]],
    },
    Druid: {
      alignment: "Cult",
      tags: ["Graveyard", "Dead", "Revive", "Visiting", "Voting", "Garbage"],
      description: [
        "Each night, can choose to visit one dead player and revive them as a tree.",
        "Trees are immune to most ways of dying.",
        "Trees cannot vote.",
      ],
      nightOrder: [["Revive as Tree", PRIORITY_NIGHT_REVIVER - 1]],
      graveyardParticipation: "all",
    },
    Sorcerer: {
      alignment: "Cult",
      tags: ["Events", "Advanced"],
      description: ["Each night, can choose an Event, that Event occurs."],
    },
    Bogeyman: {
      alignment: "Cult",
      category: "Night-acting",
      tags: ["Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player.",
        "Bogeyman roles with the Scatterbrained modifier appear as this role to self.",
      ],
      nightOrder: [["Visit", PRIORITY_SUPPORT_VISIT_DEFAULT]],
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
      nightOrder: [["Very Very Good Action", 69420]],
    },
    "Banished Cult": {
      alignment: "Cult",
      tags: ["Banished Interaction", "Basic"],
      description: [
        "Before the game starts, is replaced with a random Banished Cult role.",
      ],
    },

    //Independent
    Fool: {
      alignment: "Independent",
      tags: ["Condemn Interaction", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player.",
        "Wins if condemned.",
        "Independent roles with the Scatterbrained modifier appear as this role to self.",
      ],
      nightOrder: [["Visit", PRIORITY_SUPPORT_VISIT_DEFAULT]],
      SpecialInteractions: {
        Assassin: [
          "If an Assassin is Present, Fool will win at the end of the game if they were elected as Room Leader in 2 diffrent rooms.",
        ],
      },
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Halloween",
          value: "halloween",
        },
      ],
    },
    Executioner: {
      alignment: "Independent",
      tags: ["Condemn Interaction", "Linked", "Basic"],
      description: [
        "Randomly assigned a Village/Independent player as a target.",
        "Wins if their target player is condemned in Village meeting while alive.",
      ],
      SpecialInteractions: {
        Assassin: [
          "If an Assassin is Present, an Executioner will win at the end of the game if they were never in a room when the Room Leader changed.",
        ],
      },
    },
    Dodo: {
      alignment: "Independent",
      tags: ["Items", "Gun", "Killing", "Visiting", "Basic"],
      description: [
        `Each night, can choose to visit one player and give them a Gun.`,
        gunDef,
        "Wins if shot and killed with a gun.",
      ],
      nightOrder: [["Give Gun", PRIORITY_ITEM_GIVER_DEFAULT]],
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
        "Once per game at night, can choose to visit one dead player and convert to their role.",
        "Cannot win the game as Amnesiac.",
      ],
      nightOrder: [["Become Dead Role", PRIORITY_BECOME_DEAD_ROLE]],
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
        "Each night, can choose to visit one player and swap roles with them.",
        "Cannot win the game as Old Maid.",
      ],
      nightOrder: [["Swap Roles", PRIORITY_SWAP_ROLES]],
    },
    Traitor: {
      alignment: "Independent",
      tags: ["Traitor", "Mafia", "Basic"],
      description: [
        "Wins with Mafia.",
        "Does not count towards Mafia win count.",
      ],
    },
    Clown: {
      alignment: "Independent",
      tags: ["Condmen", "Mafia", "Win Con", "Visiting", "Expert"],
      description: [
        "Each night, can choose to visit one player.",
        "All Mafia-aligned players will learn if a Clown is present.",
        "The Mafia can not win unless a Clown is condemned.",
        "If a Clown is killed by non-condemn, a Mafia-Aligned player becomes Clown",
        "Wins with Mafia.",
      ],
      nightOrder: [["Visit", PRIORITY_SUPPORT_VISIT_DEFAULT]],
    },
    Autocrat: {
      alignment: "Independent",
      tags: ["Village", "Win Steal", "Advanced"],
      description: [
        "All players will learn if a Autocrat is present.",
        "Wins instead of Village and counts toward their total.",
      ],
    },
    Palladist: {
      alignment: "Independent",
      tags: [
        "Village",
        "Win Steal",
        "Meeting",
        "Conversion",
        "Visiting",
        "Expert",
      ],
      description: [
        "Meets with Freemasons at night.",
        "Anonymizes Freemason meetings and forces them to act.",
        "Each night, choose to visit one player with the Freemasons and convert them to Freemason.",
        "Immune to conversions.",
        "Wins instead of Village if there is a Freemason majority and counts toward their total.",
      ],
      nightOrder: [
        ["Convert to Mason", PRIORITY_CONVERT_DEFAULT + 2],
        ["Kill Cultist", PRIORITY_KILL_DEFAULT + 1],
      ],
      RolesMadeBy: ["Freemason"],
    },
    "Panda Bear": {
      alignment: "Independent",
      tags: [
        "Village",
        "Win Steal",
        "Visits",
        "Setup Changes",
        "Visiting",
        "Expert",
      ],
      description: [
        "Each night, can choose to visit one player and mate with them if they are a Panda Bear.",
        "When present in the game, the Village cannot win unless the Panda Bear visits another Panda Bear and they mate.",
        "Wins instead of Village if the Panda Bears survive without mating.",
        "Adds another Panda in Closed Setups.",
      ],
      nightOrder: [["Visit", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Politician: {
      alignment: "Independent",
      tags: ["Voting", "Alignment", "Basic"],
      description: [
        "Vote weight is worth 2 votes.",
        "Gets assigned to random alignment on game start.",
        "Each night, switches to a random alignment.",
        "Wins if their current alignment wins.",
      ],
    },
    Lover: {
      alignment: "Independent",
      tags: ["Survivor", "Lover", "Linked", "Visiting", "Basic"],
      description: [
        `Once per game at night, can choose to visit one player and become "Lovesick" for them and make them "Lovesick" for the Lover.`,
        lovesickDef,
        `Wins if alive with the player they are "Lovesick" for at the end of the game.`,
      ],
      nightOrder: [["Fall in love", PRIORITY_EFFECT_GIVER_EARLY]],
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
          "During the Blood Moon Event, Fumigator Wins if one of their starting neighbors is killed during the Blood Moon.",
        ],
      },
    },
    Doppelgänger: {
      alignment: "Independent",
      tags: ["Conversion", "Basic"],
      description: [
        "Once per game at night, must choose a player.",
        "Will instantly convert to that player's role.",
        "Cannot win the game as Doppelgänger.",
      ],
    },
    "Vengeful Spirit": {
      alignment: "Independent",
      tags: ["Killing", "Graveyard", "Visiting", "Advanced"],
      description: [
        "If killed by another player, gains the ability to each night, can choose to visit one player and kill them.",
        "Does not gain the ability if condemned by village vote.",
        "Wins if they kill all of their killers.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT + 1]],
      graveyardParticipation: "self",
      SpecialInteractions: {
        Assassin: [
          "If an Assassin is Present, a Vengeful Spirit will win at the end of the game if they are dead and no Presidents, Senators, or Vital Village roles are dead.",
        ],
      },
    },
    Phantom: {
      alignment: "Independent",
      tags: ["Killing", "Conversion", "Visiting", "Basic"],
      description: [
        "Once per game at night, can choose to visit one player and convert to their role and kill them.",
        "The killed player will have their role hidden upon death, and instead reveal as their alignment.",
        "Cannot win the game as Phantom.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT]],
    },
    Prince: {
      alignment: "Independent",
      tags: ["Essential", "Alignment", "Visiting", "Advanced"],
      description: [
        "On their first night, must choose to visit a player and become their alignment.",
        "If the Prince dies, everyone of that alignment dies.",
        "Wins if their alignment wins.",
      ],
      nightOrder: [
        ["Conquer Alignment", PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT],
      ],
    },
    Nomad: {
      alignment: "Independent",
      tags: ["Alignments", "Visiting", "Basic"],
      description: [
        "Each night, must choose to visit one player and become their alignment.",
        "Does not learn their new alignment.",
        "Cannot choose the same player consecutively.",
        "Wins with their current alignment.",
      ],
      nightOrder: [
        ["Become Alignment", PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT],
      ],
    },
    Hitchhiker: {
      alignment: "Independent",
      tags: ["Alignments", "Visits", "Delirium", "Reflexive", "Advanced"],
      description: [
        `Each night, makes one player who visits them "Delirious" and becomes their alignment.`,
        deliriumDef,
        "Hitchhiker will start the game Village-aligned.",
        "Wins with their current alignment.",
      ],
      nightOrder: [
        ["Become Alignment of Visitor", PRIORITY_BLOCK_VISITORS - 1],
      ],
    },
    "Creepy Girl": {
      alignment: "Independent",
      tags: ["Kill Interaction", "Items", "Advanced"],
      description: [
        "On their first night, must choose to visit one player and give them a Doll",
        "Players with the Doll can passed it to someone else each night.",
        "Wins if the player holding the Doll dies.",
      ],
      nightOrder: [["Give Doll", PRIORITY_ITEM_GIVER_EARLY]],
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
        "Village cannot not win until a Host stops hosting.",
        "Can only die if they choose to stop hosting.",
        // TODO
        "If in the game, whispers will not leak.",
        "Cannot be added to ranked or competitive games",
      ],
    },
    Siren: {
      alignment: "Independent",
      tags: ["Killing", "Visits", "Reflexive", "Advanced"],
      description: [
        "Each night, can choose one player and kill them if they visit the Siren.",
        "Wins if successfully kills two players.",
      ],
      nightOrder: [["Kill Beckoned", PRIORITY_KILL_SIREN]],
    },
    Fisherman: {
      alignment: "Independent",
      category: "Gifting",
      tags: ["Killing", "Items", "Meeting", "Mini-game"],
      description: [
        "Each night, can choose to visit one player and give them a Fishing Rod.",
        "Fishing Rods can be used to play a terrible fishing mini-game instead of Mafia.",
      ],
      nightOrder: [["Give Fishing Rod", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    "Gingerbread Man": {
      alignment: "Independent",
      tags: ["Survivor", "Visits", "Extra Lives", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit a player and become immune to death unless that player visits the Gingerbread Man.",
        "If that player visits the Gingerbread Man, the Gingerbread Man dies and that player will gain an extra life.",
        "Wins if alive at the end of the game.",
      ],
      nightOrder: [["Hide Behind Player", PRIORITY_NIGHT_SAVER]],
    },
    Astrologer: {
      alignment: "Independent",
      tags: ["Linked", "Survivor", "Visiting", "Advanced"],
      description: [
        `On their first night, must choose to visit two players and make them "Lovesick" for each other.`,
        lovesickDef,
        "Wins if their chosen lovers are alive at the end of the game.",
      ],
      nightOrder: [["Make players in love.", PRIORITY_EFFECT_GIVER_EARLY]],
    },
    Grouch: {
      alignment: "Independent",
      tags: ["Mafia", "Cult", "Survivor", "Vanilla", "Basic"],
      description: ["Wins if alive when Village loses."],
    },
    Shinigami: {
      alignment: "Independent",
      tags: ["Killing", "Items", "Visiting", "Advanced"],
      description: [
        "At the beginning of the game, one player randomly receives a Notebook.",
        "A player holding a Notebook can kill a selected player during the night.",
        "A player holding a Notebook must pass it to another player each day.",
        "Each night, can choose to visit one player and win if they are holding a Notebook.",
      ],
      nightOrder: [["Guess Book Holder", PRIORITY_ITEM_TAKER_DEFAULT]],
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
      tags: ["Voting", "Protective", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit one player and protect them from death until the following night.",
        "If that player is attacked, the Monk gains 1 point.",
        "Vote weight is worth 0 votes.",
        "Wins from if they have 2 points, or if no deaths happen in 2 days and 2 nights.",
      ],
      nightOrder: [["Protect Player", PRIORITY_NIGHT_SAVER]],
    },
    Warlock: {
      alignment: "Independent",
      tags: ["Voting", "Condemn", "Visiting", "Guess", "Basic"],
      description: [
        "Each night, can choose to visit one player.",
        "If that player is condemned the next day, the Warlock gains 1 point.",
        "If the Warlock visits no one and no one is condemned, the Warlock gains 1 point.",
        "The Warlock wins if they get 2 points.",
      ],
      nightOrder: [["Guess Vote", PRIORITY_SUPPORT_VISIT_DEFAULT]],
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
        "Each night, can choose to visit one player.",
        "If that player is mafia, the Picciotto will be notified.",
        "When the Picciotto has visited all the living mafia, they are converted into a random mafia role.",
        "Does not win if not converted to mafia.",
      ],
      nightOrder: [
        ["Visit", PRIORITY_SUPPORT_VISIT_DEFAULT],
        ["Become Mafia", PRIORITY_BECOME_DEAD_ROLE],
      ],
    },
    Angel: {
      alignment: "Independent",
      tags: ["Protective", "Graveyard", "Sacrificial", "Basic"],
      graveyardParticipation: "self",
      description: [
        "Randomly assigned a player as a target.",
        "Once per game while alive or dead at night, can choose to protect their target from death until the following night.",
        "If their target is attacked when protected, the Angel dies.",
        "Wins if their target is alive at the end of the game.",
      ],
      nightOrder: [["Protect Player", PRIORITY_NIGHT_SAVER]],
    },
    Emperor: {
      alignment: "Independent",
      tags: ["Voting", "Condemn", "Visiting", "Basic"],
      description: [
        "Each night, can choose to visit two players.",
        "During the following day, only those two players may be voted.",
        "Each night, must choose one of the two player to be their champion.",
        "If the champion survives the following day, the Emperor gains 1 point.",
        "Wins if they have 2 points.",
      ],
      nightOrder: [["Duel", PRIORITY_EFFECT_GIVER_EARLY + 1]],
    },
    Magus: {
      alignment: "Independent",
      tags: [
        "Magus",
        "Setup Changes",
        "Village",
        "Visiting",
        "No Investigate",
        "Expert",
      ],
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
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Halloween",
          value: "halloween",
        },
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
        "Meets with all Independents roles.",
        "Grants All Independents a random infomation or role swapping ability.",
        "Wins if Independents have majority.",
        "Lone Independents do not meet or count for majority",
      ],
      nightOrder: [
        ["Give Superpower", PRIORITY_INVESTIGATIVE_DEFAULT],
        ["Swap Roles", PRIORITY_SWAP_ROLES - 1],
      ],
      SpecialInteractions: {
        "Blood Moon": [
          "During the Blood Moon Event, Superheros Wins if no Independents die and non-Lone Independents are counted as an Evil Faction for Village.",
        ],
      },
    },
    "Serial Killer": {
      alignment: "Independent",
      tags: ["Killing", "Must Act", "Last Two", "Visiting", "Hostile", "Basic"],
      description: [
        "Each night, must choose to visit one player and kill them.",
        "Wins if among last two alive.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT + 1]],
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
        `On their first night, must choose to visit one player and become "Lovesick" for them.`,
        lovesickDef,
        "Each night, must choose to visit one player and kill them.",
        `Wins if alive and only players they are "Lovesick" for are alive.`,
      ],
      nightOrder: [
        ["Kill", PRIORITY_KILL_DEFAULT + 1],
        ["Fall in love", PRIORITY_EFFECT_GIVER_EARLY],
      ],
    },
    Clockmaker: {
      alignment: "Independent",
      tags: [
        "Killing",
        "Alignment",
        "Extra Lives",
        "Visiting",
        "Hostile",
        "Advanced",
      ],
      description: [
        "Has a clock that starts at 6 o'clock.",
        "Each night, can choose to visit one player and kill them.",
        "Clock goes up by 1 hour for killing Village roles, 2 hours for killing Mafia or Cult roles, and down by 3 hours for killing Independent roles.",
        "If the clock strikes 3 o'clock, the Clockmaker dies.",
        "If the clock strikes 9 o'clock, the Clockmaker gains an extra life.",
        "Wins when clock strikes 12 o'clock or if among last two alive.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT + 1]],
    },
    Pyromaniac: {
      alignment: "Independent",
      tags: ["Killing", "Gasoline", "Last Two", "Visiting", "Hostile", "Basic"],
      description: [
        `Each night, can choose to visit one player and make them "Doused".`,
        `Each day, can choose to kill all players that are "Doused".`,
        "Wins if among last two alive.",
      ],
      nightOrder: [["Douse In Gasoline", PRIORITY_EFFECT_GIVER_DEFAULT - 1]],
    },
    Egg: {
      alignment: "Independent",
      tags: ["Hostile", "Conversion", "Advanced"],
      description: [
        "Once per game at night, can choose Independent role from the setup.",
        "The Egg will convert to the chosen role.",
        `If the chosen role is already in play, The player with that role will be converted to Amnesiac.`,
        "Cannot win the game as Egg.",
      ],
      nightOrder: [
        [
          "Become Role and Convert players to Amnesiac",
          PRIORITY_NIGHT_ROLE_BLOCKER + 1,
        ],
      ],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Halloween",
          value: "halloween",
        },
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
        "Advanced",
      ],
      description: [
        "Each night, chooses a role.",
        "Each night, can choose to visit one player and kill them if their role is the selected role.",
        "If that player dies, the Hellhound will protected from death the following day.",
        "If that player's role is not chosen role, the Hellhound will be revealed to all.",
        "Wins if Hellhounds have majority.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_GUESS_ROLE]],
      skins: [
        {
          label: "Vivid",
          value: "vivid",
        },
        {
          label: "Goofy",
          value: "goofy",
          achReq: "Mafia29",
        },
        {
          label: "Old",
          value: "old",
        },
      ],
    },
    Ripper: {
      alignment: "Independent",
      tags: ["Killing", "Independent", "Visiting", "Hostile", "Advanced"],
      description: [
        "Each night, can choose to visit one player and kill them.",
        "Wins when all other Hostile Independents are dead.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT + 1]],
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
        "Each night, can choose to visit one player and kill them and hide their role.",
        "Players killed by a Blob meet with the Blob.",
        "For every two players the Blob kills, the Blob gains an extra life.",
        "If the Blob dies, all players killed by the Blob are revived.",
        "Wins if among the last two alive.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT + 1]],
      graveyardParticipation: "all",
    },
    "Grey Goo": {
      alignment: "Independent",
      tags: [
        "Killing",
        "Last Two",
        "Conversion",
        "Visiting",
        "Hostile",
        "Advanced",
      ],
      description: [
        "Each night, can choose to visit one player and die, then convert that player to Grey Goo.",
        "Wins if a Grey Goo is in the last two alive.",
      ],
      nightOrder: [["Convert and Die", PRIORITY_CONVERT_DEFAULT + 5]],
    },
    Mastermind: {
      alignment: "Independent",
      tags: [
        "Mafia",
        "Cult",
        "Meeting",
        "AnonymizeMeeting",
        "Hostile",
        "Advanced",
      ],
      description: [
        "Meets with Mafia and Cult.",
        "Anonymizes Mafia and Cult meetings.",
        "Wins instead of Mafia/Cult and counts toward their total.",
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
        "Meets with Mafia and Cult.",
        "Anonymizes Mafia and Cult meetings.",
        "Each night, can choose to visit one player and if the player is sided with the Mafia/Cult convert them to Mafioso/Cultist.",
        "Wins when all Mafia-aligned players are Mafiosos or all Cult-aligned players are Cultists.",
      ],
      nightOrder: [["Convert", PRIORITY_CONVERT_DEFAULT + 8]],
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
        "Meets with Mafia and Cult but does not act with them.",
        "Anonymizes Mafia and Cult meetings.",
        "Each night, can choose to visit one player and kill them.",
        "Wins if alive alone or the final two, and the other is not a Mafia or Cult",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT + 1]],
    },
    Alien: {
      alignment: "Independent",
      tags: ["Probe", "Visiting", "Hostile", "Advanced"],
      description: [
        "Each night, can choose to visit one player and probe them.",
        "Wins if all players left alive have been probed.",
      ],
      nightOrder: [["Probe", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    Matchmaker: {
      alignment: "Independent",
      tags: ["Linked", "Alignment", "Visiting", "Hostile", "Advanced"],
      description: [
        `Each night, can choose to visit two players and if they are the same alignment, they will become "Starstruck".`,
        `Wins if all players left alive are "Starstruck".`,
      ],
      nightOrder: [["Matchmaker", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Tofurkey: {
      alignment: "Independent",
      tags: ["Famine", "Alignment", "Survivor", "Hostile", "Advanced"],
      description: [
        //"The game begins with a famine, with each player starting with four bread.",
        "Adds the Famine event to the setup.",
        "Tofurkeys are immune to the famine.",
        "If a Tofurkey dies, each remaining player loses one food.",
        "Appears as Turkey to investigators.",
        "Wins if they survive to the end of the game and everyone else dies of famine.",
      ],
    },
    Turkey: {
      alignment: "Independent",
      tags: ["Famine", "Alignment", "Survivor", "Hostile", "Advanced"],
      description: [
        //"The game begins with a famine, with each player starting with four bread.",
        "Adds the Famine event to the setup.",
        "Turkeys are immune to the famine.",
        "If a Turkey dies, each remaining player gets given a food.",
        "Wins if they survive to the end of the game and everyone else dies of famine.",
      ],
    },
    Leprechaun: {
      alignment: "Independent",
      tags: ["Items", "Killing", "Visiting", "Hostile", "Advanced"],
      description: [
        "When present in the game, Clovers are randomly assigned to players.",
        "Each night, can choose to visit one player and steals a random item from them, preferentially stealing Clovers.",
        "If that player is a Leprechaun, the Leprechaun kills them.",
        "Wins if holding three Clovers.",
      ],
      nightOrder: [["Steal Items", PRIORITY_ITEM_TAKER_DEFAULT]],
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
        "Each night, can choose to visit one player and give them a Timebomb.",
        timeBombDef,
        "Wins if 3 players are killed by the timebomb, or if the Anarchist is among the last two alive.",
        "Timebomb reveals Anarchist when it explodes on themselves.",
      ],
      nightOrder: [["Give Timebomb", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Communist: {
      alignment: "Independent",
      tags: ["Conversion", "Vanilla", "Visiting", "Hostile", "Basic"],
      description: [
        "Meets with other Communists at night.",
        "Each night, all Communists can choose to visits one player each night and convert them to their alignment's vanilla role.",
        "Wins if alive when all other players are vanilla.",
      ],
      nightOrder: [["Convert to Vanilla", PRIORITY_CONVERT_DEFAULT + 8]],
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
        "Each night, can choose to visit one player and give them a Revolver.",
        revolverDef,
        "Wins if 3 players are killed by the revolver, or if the Dragoon is among the last two alive.",
        "Revolver reveals Dragoon when shooting themselves.",
      ],
      nightOrder: [["Give Revolver", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Gambler: {
      alignment: "Independent",
      tags: [
        "Killing",
        "Last Two",
        "Mini-Game",
        "Visiting",
        "Hostile",
        "Advanced",
      ],
      description: [
        "Each night, can choose to visit one player and challenges them to a game of Rock, Paper, Scissors the following day.",
        "If the Gambler wins, that player dies.",
        "Wins the game when they have 2 gamble wins, or are among the last two standing.",
      ],
      nightOrder: [["Gamble", 0]],
    },
    "Grizzly Bear": {
      alignment: "Independent",
      tags: [
        "Killing",
        "Last Two",
        "Visits",
        "Visiting",
        "Hostile",
        "Advanced",
      ],
      description: [
        "Each night, can choose to visit one player and kill each player who visits that player.",
        "If no one visits that player, the Grizzly Bear kills them.",
        "Wins if among last two alive.",
      ],
      nightOrder: [["Kill Visitors", PRIORITY_KILL_DEFAULT + 1]],
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
        `Each night, all Polar Bears can choose to visits two players and make them "Polarised".`,
        polarisedDef,
        "A polarised player visiting another polarised player will kill both of them.",
        //"If visited by a Penguin, will eat it.",
        "Wins if four polarised players die or if majority is attained.",
      ],
      nightOrder: [["Polarize", PRIORITY_EFFECT_GIVER_EARLY]],
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
        "Each night, can choose to visit one player and duel them in turn based combat mini-game.",
        "The Samurai and that player have the option to use four moves during the duel:",
        "Attack - Deals damage. There is a chance to Crit for double damage.",
        "Defend - Grants Block. Block will absorb damage.",
        "Focus - Raises Attack Power, Block Power, or Crit Chance at random",
        "Charge - Strengthens the duelist's next move. Charging multiple times will allow for special moves to be used.",
        "Wins if they win their duel.",
      ],
      nightOrder: [["Start Duel", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Snowman: {
      alignment: "Independent",
      tags: ["Items", "Mini-Game", "Hostile", "Advanced"],
      description: [
        "Each night, may declare a snowball fight.",
        "Half of all players will receive a Snowball.",
        snowballDef,
        frozenDef,
        "Wins if all living players have been frozen.",
      ],
      nightOrder: [["Snowballs", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Judge: {
      alignment: "Independent",
      tags: ["Speaking", "Voting", "Meeting", "Dusk", "Hostile", "Advanced"],
      description: [
        "Can anonymously broadcast messages during the day.",
        "Twice per game during the day, can choose for a court session to happen at dusk.",
        "During a court session an additional player can be condemned and all voting and speaking is anonymous.",
        "The Judge's vote counts for three during a Court session.",
        "Wins among the last two standing.",
      ],
    },
    Puppeteer: {
      alignment: "Independent",
      tags: [
        "Speaking",
        "Redirection",
        "Control",
        "Visiting",
        "Hostile",
        "Advanced",
      ],
      description: [
        "Each night, can choose to visit one player and learn their role and attach strings to them.",
        "Each night, can choose to redirect each player they have attached strings to's visits on to other players. (Not a visit)",
        "Wins among the last two standing.",
      ],
      nightOrder: [
        ["Control Players", PRIORITY_REDIRECT_ACTION],
        ["Attach Strings", PRIORITY_SUPPORT_VISIT_DEFAULT],
      ],
    },
    "Banished Independent": {
      alignment: "Independent",
      tags: ["Banished Interaction", "Basic"],
      description: [
        "Before the game starts, is replaced with a random Banished Independent role.",
      ],
    },
    "Banished Any": {
      alignment: "Independent",
      tags: ["Banished Interaction", "Basic"],
      description: [
        "Before the game starts, is replaced with a random Banished role.",
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
    Airdrop: {
      alignment: "Event",
      tags: ["Event", "Items"],
      description: [
        "If this Event occurs, one random player will be given a Gun.",
        gunDef,
      ],
      nightOrder: [["Give Gun", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Moonshine: {
      alignment: "Event",
      tags: ["Event", "Items"],
      description: [
        "If this Event occurs, one random player will be given Whiskey.",
        whiskeyDef,
      ],
      nightOrder: [["Give Whiskey", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    "Ominous Warning": {
      alignment: "Event",
      tags: ["Event", "Items"],
      description: [
        "If this Event occurs, one random player will be given a Knife.",
        knifeDef,
        bleedingDef,
      ],
      nightOrder: [["Give Knife", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    Vaccination: {
      alignment: "Event",
      tags: ["Event", "Items"],
      description: [
        "If this Event occurs, one random player will be given a Syringe.",
        needleDef,
      ],
      nightOrder: [["Give Syringe", PRIORITY_ITEM_GIVER_DEFAULT]],
      graveyardParticipation: "all",
    },
    "Haunted House": {
      alignment: "Event",
      tags: ["Event", "Items"],
      description: [
        "If this event occurs, one player receives a Haunted Mask.",
        "Only the player with the Haunted Mask is informed if this event occurs.",
        "Players being attacked are prioritized for receiving the Mask.",
        "If a player with a Haunted Mask is attacked, they will kill their attacker and steal their identity.",
      ],
      nightOrder: [["Give Haunted Mask", PRIORITY_ITEM_GIVER_EARLY]],
    },
    Evolution: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "Can only occur if an alive player has a Vanilla role.",
        "If this Event occurs, one random player with a Vanilla role will be converted to a random role from their alignment.",
      ],
      nightOrder: [["Evolve Player", PRIORITY_BECOME_DEAD_ROLE]],
      RolesMadeBy: ["All Roles"],
    },
    Mutation: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all players will have a random modifier added to their role.",
      ],
      nightOrder: [["Add Modifiers", PRIORITY_CONVERT_DEFAULT + 6]],
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
      nightOrder: [["Give Brain Blast", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    "Cave-In": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all players will be blocked and forced to vote on a player to kill and eat during the Night.",
      ],
      nightOrder: [["Kill and eat", PRIORITY_KILL_DEFAULT]],
    },
    Feast: {
      alignment: "Event",
      tags: ["Event"],
      description: ["If this Event occurs, all players gain food."],
      nightOrder: [["Give Bread", PRIORITY_ITEM_GIVER_EARLY]],
    },
    Famine: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all players lose food. If they have no food to lose, they die.",
        "If this Event is in a setup, All players start with 1 Food.",
      ],
      nightOrder: [["Kill", PRIORITY_KILL_DEFAULT]],
    },
    Eclipse: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        `If this Event occurs, all players will become "Blind".`,
        blindDef,
      ],
      nightOrder: [["Blind", PRIORITY_EFFECT_GIVER_DEFAULT]],
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
        `If this Event occurs, all players will become "Foggy".`,
        foggyDef,
      ],
      nightOrder: [["Semi-Blind", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    "Mass Hysteria": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all are Frustrated for 1 day.",
        "Frustrated players cannot be condemned by majority vote. A non-zero minority vote will kill a frustrated player.",
      ],
      nightOrder: [["Make Frustrated", PRIORITY_EFFECT_GIVER_DEFAULT]],
    },
    "Mail-In Ballots": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        `If this Event occurs, all players will become "Paralyzed".`,
        paralyzedDef,
      ],
      nightOrder: [
        ["Apply disable vote switching effect", PRIORITY_EFFECT_GIVER_DEFAULT],
      ],
    },
    Flood: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all players will have their night actions blocked.",
      ],
      nightOrder: [["Block Players", PRIORITY_FULL_DISABLE + 3]],
    },
    Sabbath: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all players will be protected from death.",
      ],
      nightOrder: [["Protect Players", PRIORITY_FULL_DISABLE + 3]],
    },
    "Self-Awareness": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, 1-3 Players learn if their role changed.",
      ],
      nightOrder: [
        ["Tell about role", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5],
      ],
    },
    "Stand-Up": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all players learn that a player is 1 of 3 roles.",
        "One of the roles is always Evil.",
      ],
      nightOrder: [
        ["Tell Joke", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10],
      ],
    },
    Revelation: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, each players learn 3 excess roles instantly.",
        "Evil players will always learn village roles.",
      ],
    },
    Opera: {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, 3 players can attend the opera.",
        "Players attending the opera learn how many evil players are attending the opera.",
        "1 player in attendance will learn the wrong number.",
      ],
      nightOrder: [
        ["Opera Info", PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10],
      ],
      SpecialInteractionsModifiers: {
        Random: [
          "Instead of choosing to attend, 3 random players will choosen to attend at the end of the day.",
        ],
      },
    },
    "Cultural Exchange": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, one player gains the ability to role share today.",
      ],
      nightOrder: [["Give Role Share Powers", PRIORITY_ITEM_GIVER_DEFAULT]],
    },
    "Lightning Strike": {
      alignment: "Event",
      tags: ["Event"],
      description: [
        "If this Event occurs, all Players gain Kites.",
        "Kites can be used to kill a random player with the same alignment as the user.",
      ],
      nightOrder: [["Give Kites", PRIORITY_ITEM_GIVER_DEFAULT]],
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
        "If this Event occurs, the game will end and No One wins if nobody dies during the day.",
        "This is unaffected by Win-con altering abilities.",
      ],
    },
    "Black Hole": {
      alignment: "Event",
      tags: ["Event", "Game Ender"],
      description: [
        "If this Event occurs, the game will end in 5 Minutes",
        "No one wins if the game doesn't end before the 5 Minutes are up.",
        "This is unaffected by Win-con altering abilities.",
      ],
    },
    "Blood Moon": {
      alignment: "Event",
      tags: ["Event", "Game Ender"],
      description: [
        "If this Event occurs, the game will end the following day.",
        "If all Mafia survive, Mafia wins.",
        "If all Cult survive, Cult wins.",
        "If at least 1 member from each Evil faction is killed, Village wins.",
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
      nightOrder: [["Give Necronomicon", PRIORITY_ITEM_GIVER_DEFAULT]],
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
        "Will be the only player to guess Merlin or Tristan and Isolde.",
      ],
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
  "Texas Hold Em": {
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
  Cheat: {
    Player: {
      alignment: "Town",
      tags: ["None"],
      description: ["Can play cards and call lies."],
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
    "Cheese Snake": {
      alignment: "Town",
      tags: ["None"],
      description: ["Only has every other segment."],
    },
    "Gap Snake": {
      alignment: "Town",
      tags: ["None"],
      description: ["Only has a head and a tail."],
    },

    Host: {
      alignment: "Host",
      tags: ["None"],
      description: ["Facilitates the game."],
    },
  },
  DiceWars: {
    General: {
      alignment: "Town",
      tags: ["None"],
      description: [
        "Controls territories on a hex grid.",
        "Attacks adjacent enemy territories with dice.",
        "Receives bonus dice based on largest connected region.",
      ],
    },

    Host: {
      alignment: "Host",
      tags: ["None"],
      description: ["Facilitates the game."],
    },
  },
  "Connect Four": {
    Starman: {
      alignment: "Town",
      tags: ["None"],
      description: ["Can place counters on the board."],
    },
  },
};

module.exports = roleData;
