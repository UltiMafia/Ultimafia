const tagData = {
  Mafia: {
    //Design Based Tags

    //Skill Rating Tags
    Basic: {
      description: "Beginner friendly.",
    },
    Advanced: {
      description: "Recommended for more experienced players.",
    },
    Expert: {
      description: "Recommended for very experienced players.",
    },
    //design descriptive tags
    "Mini-Game": {
      description: "Ability involves a mini-game or alternate game mode.",
    },
    Special: {
      description:
        "Adds new rules to the game even if not currently in the game.",
    },

    //Ability Descriptive tags
    "Day Actions": {
      description: "Has actions that are used during the day.",
    },

    //Functional Tags

    //Important
    Information: {
      description: "Creates information.",
    },
    Deception: {
      description: "Creates information.",
    },

    Vanilla: {
      description: "Villager, Mafioso, Cultist, and Grouch.",
      paired: ["Vanilla Interaction"],
    },
    "Vanilla Interaction": {
      description: "Interacts with Vanilla roles.",
      paired: ["Vanilla"],
    },
    //Killing Group
    Killing: {
      description: "Kills other players.",
      paired: ["Kill Interaction", "Protective", "Self Protection"],
    },
    "Kill Interaction": {
      description: "Interacts with killing.",
      paired: ["Killing"],
    },
    "Death Interaction": {
      description: "Interacts with death.",
      paired: ["Killing"],
    },
    Protective: {
      description: "Prevents other players from dying.",
      paired: ["Killing", "Protection Interaction"],
    },
    "Self Protection": {
      description: "Prevents themselves from dying.",
      paired: ["Killing", "Protection Interaction"],
    },
    "Protection Interaction": {
      description: "Interacts with protection.",
      paired: ["Protective", "Self Protection"],
    },

    "Condemn Interaction": {
      description: "Interacts with condemnation.",
    },

    //Effects
    Effects: {
      description: "Causes or has status effects.",
      paired: ["Effect Interaction"],
    },
    "Effect Interaction": {
      description: "Interacts with effects.",
      paired: ["Effects"],
    },
    Delirium: {
      description: "Makes players Delirious.",
      paired: ["Delirium Interaction"],
    },
    "Delirium Interaction": {
      description: "Interacts with the Delirious effect.",
      paired: ["Delirium"],
    },

    //Items
    Items: {
      description: "Creates or has items.",
      paired: ["Item Interaction"],
    },
    "Item Interaction": {
      description: "Interacts with items.",
      paired: ["Items"],
    },
    Gun: {
      description: "Creates or has guns.",
      paired: ["Gun Interaction"],
    },
    "Gun Interaction": {
      description: "Interacts with guns.",
      paired: ["Gun"],
    },

    //Visiting Group
    Visiting: {
      description: "Visits other players.",
      paired: ["Visit Interaction"],
    },
    "Visit Interaction": {
      description: "Interacts with visits.",
      paired: ["Visiting"],
    },

    //Blocking
    Blocking: {
      description: "Can block other player' night actions.",
      //paired: ["Blocking Interaction"],
    },
    /*
    "Blocking Interaction": {
      description: "Interacts with blocking.",
      paired: ["Blocking"],
    },
    */

    //Meeting
    Meetings: {
      description: "Can meet with other players at night.",
      paired: ["Meeting Interaction"],
    },
    "Meeting Interaction": {
      description: "Interacts with night meetings.",
      paired: ["Meetings"],
    },

    //Voting
    Voting: {
      description: "Interacts with voting.",
    },

    //Game Settings
    "Whisper Interaction": {
      description: "Can block other player' night actions.",
      //paired: ["Blocking Interaction"],
    },

    //Other
    Exposed: {
      description: "Is revealed to all players.",
    },
    Unaware: {
      description: "Sees self as another role.",
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

module.exports = tagData;
