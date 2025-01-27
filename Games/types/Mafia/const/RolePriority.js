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
} = require("../const/Priority");
const Farmer = require("../roles/Village/Farmer");
const Nightdata = {
  Mafia: {
    //Village
    Commuter: {
      ActionNames: ["Block Visitors"],
      ActionValues: [PRIORITY_BLOCK_VISITORS],
    },
    Loudmouth: {
      ActionNames: ["Announce Visitors"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 2],
    },
    Sapling: {
      ActionNames: ["Trun into Tree"],
      ActionValues: [PRIORITY_NIGHT_SAVER],
    },
    Sleepwalker: {
      ActionNames: ["Visit Random"],
      ActionValues: [PRIORITY_SUPPORT_VISIT_DEFAULT],
    },
    Bawd: {
      ActionNames: ["Protect and Mind Rot"],
      ActionValues: [PRIORITY_NIGHT_ROLE_BLOCKER + 2],
    },
    Bodyguard: {
      ActionNames: ["Protect", "Kill Attacker and Die"],
      ActionValues: [PRIORITY_NIGHT_SAVER, PRIORITY_KILL_DEFAULT],
    },
    Doctor: {
      ActionNames: ["Protect"],
      ActionValues: [PRIORITY_NIGHT_SAVER],
    },
    Martyr: {
      ActionNames: ["Protect from Condemn"],
      ActionValues: [PRIORITY_NIGHT_SAVER],
    },
    Medic: {
      ActionNames: ["Give Extra Life", "Check If Target Died"],
      ActionValues: [PRIORITY_NIGHT_SAVER, PRIORITY_NIGHT_SAVER - 1],
    },
    Nurse: {
      ActionNames: ["Remove Effects"],
      ActionValues: [PRIORITY_EFFECT_REMOVER_DEFAULT],
    },
    Resurrectionist: {
      ActionNames: ["Revive"],
      ActionValues: [PRIORITY_NIGHT_REVIVER],
    },
    Shrink: {
      ActionNames: ["Save from Conversion"],
      ActionValues: [PRIORITY_EFFECT_GIVER_DEFAULT + 1],
    },
    Surgeon: {
      ActionNames: ["Protect", "Kill Attacker"],
      ActionValues: [PRIORITY_NIGHT_SAVER, PRIORITY_KILL_DEFAULT],
    },
    "Tea Lady": {
      ActionNames: ["Protect Neighbors"],
      ActionValues: [PRIORITY_NIGHT_SAVER],
    },
    Baker: {
      ActionNames: ["Give Item"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Blacksmith: {
      ActionNames: ["Give Item"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Chandler: {
      ActionNames: ["Give Item"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Cutler: {
      ActionNames: ["Give Item"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Demolitionist: {
      ActionNames: ["Give Item"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Falconer: {
      ActionNames: ["Give Item"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Funsmith: {
      ActionNames: ["Give Gun Directly", "Give Visitors Guns"],
      ActionValues: [
        PRIORITY_ITEM_GIVER_DEFAULT,
        PRIORITY_EFFECT_GIVER_DEFAULT,
      ],
    },
    Gemcutter: {
      ActionNames: ["Give Item"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Gunsmith: {
      ActionNames: ["Give Gun"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Keymaker: {
      ActionNames: ["Give Key"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Mailman: {
      ActionNames: ["Give Item"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Missionary: {
      ActionNames: ["Give Item"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Pharmacist: {
      ActionNames: ["Give Item"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Reanimator: {
      ActionNames: ["Give Item"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Santa: {
      ActionNames: ["Give Item", "Investigate"],
      ActionValues: [
        PRIORITY_ITEM_GIVER_DEFAULT - 1,
        PRIORITY_INVESTIGATIVE_DEFAULT,
      ],
    },
    Analyst: {
      ActionNames: ["Investigate"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Accountant: {
      ActionNames: ["Learn Evil Pairs"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10],
    },
    Bloodhound: {
      ActionNames: ["Track"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Housekeeper: {
      ActionNames: ["Track and Check for Reports"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 1],
    },
    Cop: {
      ActionNames: ["Investigate"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Coroner: {
      ActionNames: ["Investigate"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Detective: {
      ActionNames: ["Investigate"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Empath: {
      ActionNames: ["Learn Evil Neighbors"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10],
    },
    Statistician: {
      ActionNames: ["Learn Info"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Forensicist: {
      ActionNames: ["Count Problems"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 1],
    },
    Geologist: {
      ActionNames: ["Learn Evil Distance"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10],
    },
    Orienteer: {
      ActionNames: ["Learn Direction to Evil Player"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10],
    },
    Groundskeeper: {
      ActionNames: ["Learn Number of Dead Evil Players"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 2],
    },
    Diviner: {
      ActionNames: ["Investigate"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Journalist: {
      ActionNames: ["Learn Reports"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 1],
    },
    Justice: {
      ActionNames: ["Compare Alignments"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Laundress: {
      ActionNames: ["Learn Info"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Psychic: {
      ActionNames: ["Learn Info"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Tourist: {
      ActionNames: ["Reveal Excess Roles"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10],
    },
    Manhunter: {
      ActionNames: ["Guess Role"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Pathologist: {
      ActionNames: ["Investigate"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Snoop: {
      ActionNames: ["Snoop Items"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Tracker: {
      ActionNames: ["Track"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Voyeur: {
      ActionNames: ["Watch"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT],
    },
    Watcher: {
      ActionNames: ["Watch"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT],
    },
    Witness: {
      ActionNames: ["Watch"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT],
    },

    Avenger: {
      ActionNames: ["Get Gun if Target dies"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Caroler: {
      ActionNames: ["Sing Carol"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT],
    },
    Comedian: {
      ActionNames: ["Give Joke"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT],
    },
    Exorcist: {
      ActionNames: ["Exorcise"],
      ActionValues: [PRIORITY_KILL_DEFAULT],
    },
    Flapper: {
      ActionNames: ["Mind Rot"],
      ActionValues: [PRIORITY_NIGHT_ROLE_BLOCKER - 1],
    },
    Drunk: {
      ActionNames: ["Block"],
      ActionValues: [PRIORITY_NIGHT_ROLE_BLOCKER],
    },
    Sailor: {
      ActionNames: ["Mind Rot"],
      ActionValues: [PRIORITY_NIGHT_ROLE_BLOCKER],
    },
    "Snake Charmer": {
      ActionNames: ["Swap Roles"],
      ActionValues: [PRIORITY_SWAP_ROLES],
    },
    Mediator: {
      ActionNames: ["Swap Roles"],
      ActionValues: [PRIORITY_SWAP_ROLES + 1],
    },
    Guard: {
      ActionNames: ["Block Visitors"],
      ActionValues: [PRIORITY_UNTARGETABLE],
    },
    Mechanic: {
      ActionNames: ["Fix Items"],
      ActionValues: [PRIORITY_ITEM_TAKER_DEFAULT + 2],
    },
    Mime: {
      ActionNames: ["Mimic Role"],
      ActionValues: [PRIORITY_MIMIC_ROLE],
    },
    "Lunch Lady": {
      ActionNames: ["Remove Modifiers"],
      ActionValues: [PRIORITY_CONVERT_DEFAULT],
    },
    Photographer: {
      ActionNames: ["Reveal Role"],
      ActionValues: [PRIORITY_REVEAL_DEFAULT],
    },
    Impersonator: {
      ActionNames: ["Disguise Self"],
      ActionValues: [PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT],
    },
    Vegan: {
      ActionNames: ["Reveal to Player"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Oracle: {
      ActionNames: ["Reveal Role"],
      ActionValues: [PRIORITY_REVEAL_DEFAULT],
    },
    Penguin: {
      ActionNames: ["Give Secret"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    "Robin Hood": {
      ActionNames: ["Transfer Items"],
      ActionValues: [PRIORITY_ITEM_TAKER_DEFAULT],
    },
    Visitor: {
      ActionNames: ["Visit"],
      ActionValues: [0],
    },
    Waitress: {
      ActionNames: ["Steal Items"],
      ActionValues: [PRIORITY_ITEM_TAKER_DEFAULT],
    },
    "Drama Queen": {
      ActionNames: ["Start Drama"],
      ActionValues: [0],
    },
    Mooncalf: {
      ActionNames: ["Kill Choosen Player"],
      ActionValues: [PRIORITY_KILL_DEFAULT],
    },
    Butler: {
      ActionNames: ["Choose Master"],
      ActionValues: [PRIORITY_SUPPORT_VISIT_DEFAULT],
    },
    Kingmaker: {
      ActionNames: ["Make King"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Magistrate: {
      ActionNames: ["House Arrest"],
      ActionValues: [PRIORITY_EFFECT_GIVER_DEFAULT],
    },
    Jazzman: {
      ActionNames: ["Mind Rot Everyone If Evil Condemned"],
      ActionValues: [PRIORITY_NIGHT_ROLE_BLOCKER - 1],
    },
    Braggart: {
      ActionNames: ["Mind Rot Self"],
      ActionValues: [PRIORITY_FULL_DISABLE + 1],
    },
    Coward: {
      ActionNames: ["Redirect Visitors"],
      ActionValues: [PRIORITY_MODIFY_ACTION],
    },
    Chauffeur: {
      ActionNames: ["Redirect Visitors"],
      ActionValues: [PRIORITY_SWAP_VISITORS],
    },
    Televangelist: {
      ActionNames: ["Mind Rot Self"],
      ActionValues: [PRIORITY_FULL_DISABLE + 1],
    },
    Philosopher: {
      ActionNames: ["Become Role and Mind Rot"],
      ActionValues: [PRIORITY_NIGHT_ROLE_BLOCKER],
    },
    Trickster: {
      ActionNames: ["Give Random Item"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT - 1],
    },
    Capybara: {
      ActionNames: ["Give Orange"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Freemason: {
      ActionNames: ["Convert to Mason", "Kill Cult"],
      ActionValues: [PRIORITY_CONVERT_DEFAULT, PRIORITY_KILL_DEFAULT + 1],
    },
    Matron: {
      ActionNames: ["Give Invites to Visitors"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Apothecary: {
      ActionNames: ["Remove Effects from Visitors", "Kill Werewolves"],
      ActionValues: [PRIORITY_EFFECT_REMOVER_DEFAULT, PRIORITY_KILL_DEFAULT],
    },
    Dreamer: {
      ActionNames: ["Dream"],
      ActionValues: [PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT],
    },
    Farmer: {
      ActionNames: ["Give Bread to Visitors"],
      ActionValues: [PRIORITY_ITEM_GIVER_DEFAULT],
    },
    Priest: {
      ActionNames: ["Learn Visitors"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Debtor: {
      ActionNames: ["Die with Incorrect Guess"],
      ActionValues: [PRIORITY_KILL_DEFAULT - 1],
    },
    Firebrand: {
      ActionNames: ["Douse In Gasoline"],
      ActionValues: [PRIORITY_EFFECT_GIVER_DEFAULT - 1],
    },
    Granny: {
      ActionNames: ["Kill Visitors"],
      ActionValues: [PRIORITY_KILL_DEFAULT],
    },
    Jailer: {
      ActionNames: ["Execute Prisoner", "Block Visitors"],
      ActionValues: [PRIORITY_KILL_DEFAULT, PRIORITY_UNTARGETABLE],
    },
    Seeker: {
      ActionNames: ["Guess Hider/Invader"],
      ActionValues: [0],
    },
    OldScientist: {
      ActionNames: ["Kill If Statement is True"],
      ActionValues: [PRIORITY_KILL_DEFAULT - 2],
    },
    Trapper: {
      ActionNames: ["Kill Visitor"],
      ActionValues: [PRIORITY_KILL_DEFAULT],
    },
    Vigilante: {
      ActionNames: ["Kill"],
      ActionValues: [PRIORITY_KILL_DEFAULT + 1],
    },
    Begum: {
      ActionNames: ["Learn Info"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Mistress: {
      ActionNames: ["Die If not Visited by Village"],
      ActionValues: [PRIORITY_KILL_DEFAULT + 1],
    },

    //Mafia
    Gramps: {
      ActionNames: ["Learn Visitors"],
      ActionValues: [PRIORITY_INVESTIGATIVE_DEFAULT],
    },
    Arsonist: {
      ActionNames: ["Douse In Gasoline"],
      ActionValues: [PRIORITY_EFFECT_GIVER_DEFAULT - 1],
    },
    Caporegime: {
      ActionNames: ["Kill Target If Visited"],
      ActionValues: [PRIORITY_KILL_DEFAULT],
    },
    //Cult

    //Independent
  }, //End Mafia Game Info
};

module.exports = Nightdata;
