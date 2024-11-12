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
const { PRIORITY_VILLAGE } = require("../const/Priority");

module.exports = class Room extends Item {
  constructor(meetingName) {
    super("Room");

    //this.reveal = reveal;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.meetings[meetingName] = {
      actionName: "Elect Leader",
      states: ["Day"],
      targets: { include: ["members"], exclude: ["dead"] },
      flags: ["group", "voting", "speech", "mustAct"],
      whileDead: true,
      passiveDead: true,
      action: {
        labels: ["hidden"],
        priority: PRIORITY_VILLAGE,
        run: function () {
          if(meetingName == "Room 1"){
          this.game.RoomOneLeader = this.target;
          }
          else if(meetingName == "Room 2"){
          this.game.RoomTwoLeader = this.target;
          }
          else{
            this.game.RoomThreeLeader = this.target;
          }
          
        },
      },
    };
  }
};
