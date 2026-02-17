const tagData = {
  Mafia: {
    //Design Based Tags

    //Skill Rating Tags
    Basic: {
      definition: "Beginner friendly.",
    },
    Advanced: {
      definition: "Recommended for more experienced players.",
    },
    Expert: {
      definition: "Recommended for very experienced players.",
    },
    //design descriptive tags
    "Mini-Game": {
      definition: "Ability involves a mini-game or alternate game mode.",
    },
    Special: {
      definition:
        "Adds new rules to the game even if not currently in the game.",
    },

    //Ability Descriptive tags
    "Day Actions": {
      definition: "Has actions that are used during the day.",
    },

    //Functional Tags

    //Important
    Information: {
      definition: "Creates information.",
    },
    Deception: {
      definition: "Alters information.",
    },

    Vanilla: {
      definition: "Villager, Mafioso, Cultist, and Grouch.",
      paired: ["Vanilla Interaction"],
    },
    "Vanilla Interaction": {
      definition: "Interacts with Vanilla roles.",
      paired: ["Vanilla"],
    },
    //Killing Group
    Killing: {
      definition: "Kills other players.",
      paired: ["Kill Interaction", "Protective", "Self Protection"],
    },
    "Kill Interaction": {
      definition: "Interacts with killing.",
      paired: ["Killing"],
    },
    "Death Interaction": {
      definition: "Interacts with death.",
      paired: ["Killing"],
    },
    Protective: {
      definition: "Prevents other players from dying.",
      paired: ["Killing", "Protection Interaction"],
    },
    "Self Protection": {
      definition: "Prevents themselves from dying.",
      paired: ["Killing", "Protection Interaction"],
    },
    "Protection Interaction": {
      definition: "Interacts with protection.",
      paired: ["Protective", "Self Protection"],
    },

    "Condemn Interaction": {
      definition: "Interacts with condemnation.",
    },

    //Conversion
    "Conversion": {
      definition: "Can change players roles.",
    },
    "Conversion Interaction": {
      definition: "Interacts with conversions.",
    },

    //Effects
    Effects: {
      definition: "Causes or has status effects.",
      paired: ["Effect Interaction"],
    },
    "Effect Interaction": {
      definition: "Interacts with effects.",
      paired: ["Effects"],
    },
    Delirium: {
      definition: "Makes players Delirious.",
      paired: ["Delirium Interaction"],
    },
    "Delirium Interaction": {
      definition: "Interacts with the Delirious effect.",
      paired: ["Delirium"],
    },

    //Items
    Items: {
      definition: "Creates or has items.",
      paired: ["Item Interaction"],
    },
    "Item Interaction": {
      definition: "Interacts with items.",
      paired: ["Items"],
    },
    Gun: {
      definition: "Creates or has guns.",
      paired: ["Gun Interaction"],
    },
    "Gun Interaction": {
      definition: "Interacts with guns.",
      paired: ["Gun"],
    },

    //Visiting Group
    Visiting: {
      definition: "Visits other players.",
      paired: ["Visit Interaction"],
    },
    "Visit Interaction": {
      definition: "Interacts with visits.",
      paired: ["Visiting"],
    },
    Redirection: {
      definition: "Redirects visits.",
      paired: ["Visiting"],
    },
    "Group Action": {
      definition: "Performs Actions as a Group.",
      paired: ["Visiting"],
    },

    //Blocking
    Blocking: {
      definition: "Can block other player' night actions.",
      //paired: ["Blocking Interaction"],
    },
    /*
    "Blocking Interaction": {
      definition: "Interacts with blocking.",
      paired: ["Blocking"],
    },
    */

    //Meeting
    Meetings: {
      definition: "Can meet with other players at night.",
      paired: ["Meeting Interaction"],
    },
    "Meeting Interaction": {
      definition: "Interacts with night meetings.",
      paired: ["Meetings"],
    },

    

    //Voting
    Voting: {
      definition: "Interacts with voting.",
    },
    //Speech
    Speech:{
      definition: "Has an ability that interacts with chat.",
    },
    //Game Settings
    "Whisper Interaction": {
      definition: "Can block other player' night actions.",
      //paired: ["Blocking Interaction"],
    },

    "Graveyard":{
      definition: "Requires dead players to stay in game.",
    },

     "Revive":{
      definition: "Revives players.",
    },

    "Excess Role Interaction":{
      definition: "Interacts with excess roles.",
    },

    //Other
    "Position": {
       definition: "Interacts with the player list.",
    },
    "Banished Interaction":{
      definition: "Interacts with banished roles.",
    },
    "Modifier Interaction":{
      definition: "Interacts with modifiers.",
    },
    Revealing: {
      definition: "Is revealed or reveals players.",
    },
    Unaware: {
      definition: "Sees self as another role.",
    },
    Hostile: {
      definition: "Village cannot when this is alive.",
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
