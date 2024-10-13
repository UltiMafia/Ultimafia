const Item = require("../Item");

module.exports = class WackyJoinFactionMeeting extends Item {
  constructor(reveal) {
    super("WackyJoinFactionMeeting");

    this.reveal = reveal;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.meetings = {
      "Faction Kill": {
        meetingName: "Mafia",
        states: ["Night"],
        flags: ["group", "speech", "voting", "multiActor", "Important"],
        
      },
    };
  }
};
