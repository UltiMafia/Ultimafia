const Card = require("../../Card");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../../const/FactionList");

module.exports = class Oblivious extends Card {
  constructor(role) {
    super(role);


    for(let faction of FACTION_WITH_MEETING){
      this.meetingMods[`${faction} Meeting`] = {
        disabled: true,
      }
      this.meetingMods[`Fake ${faction}`] = {
        disabled: true,
      }
      this.meetingMods[`${faction} Kill`] = {
        disabled: true,
      }
    }
    this.meetingMods["Templar Meeting"] = {
      disabled: true,
    }
    this.meetingMods["Superhero"] = {
      disabled: true,
    }
/*
    this.meetingMods = {
      Mafia: {
        disabled: true,
      },
      Cult: {
        disabled: true,
      },
      Faction: {
        disabled: true,
      },
      "Faction Fake": {
        disabled: true,
      },
      "Faction Kill": {
        disabled: true,
      },
    };
*/
    this.oblivious = {
      self: true,
      Faction: true,
    };
  }
};
