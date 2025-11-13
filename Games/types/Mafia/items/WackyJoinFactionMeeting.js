const Item = require("../Item");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../const/FactionList");
const { PRIORITY_MAFIA_KILL } = require("../const/Priority");

module.exports = class WackyJoinFactionMeeting extends Item {
  constructor(meetingName) {
    super("WackyJoinFactionMeeting");

    this.cannotBeSnooped = true;

    //this.reveal = reveal;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.meetings[meetingName] = {
      actionName: "End Meeting?",
      states: ["Night"],
      speakDead: true,
      flags: ["group", "speech", "voting", "mustAct", "noVeg"],
      inputType: "boolean",
    };
  }
};
