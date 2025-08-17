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
const { PRIORITY_ROOM_SWAP } = require("../const/Priority");

module.exports = class Room extends Item {
  constructor(meetingName) {
    super("Room");

    //this.reveal = reveal;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.meetings[meetingName] = {
      actionName: "Elect Leader",
      states: ["Day"],
      targets: { include: ["members"], exclude: [cannotBeVoted, "dead"] },
      item: this,
      flags: [
        "group",
        "voting",
        "speech",
        "mustAct",
        "useVotingPower",
        "Important",
      ],
      whileDead: true,
      passiveDead: true,
      action: {
        labels: ["hidden"],
        priority: PRIORITY_ROOM_SWAP,
        run: function () {
          if (meetingName == "Room 1") {
            if (
              this.game.RoomOneLeader == null ||
              this.game.RoomOneLeader == this.target
            ) {
              this.game.events.emit("ElectedRoomLeader", this.target, 1, false);
            } else {
              this.game.events.emit("ElectedRoomLeader", this.target, 1, true);
            }
            this.game.RoomOneLeader = this.target;
          } else if (meetingName == "Room 2") {
            if (
              this.game.RoomTwoLeader == null ||
              this.game.RoomTwoLeader == this.target
            ) {
              this.game.events.emit("ElectedRoomLeader", this.target, 2, false);
            } else {
              this.game.events.emit("ElectedRoomLeader", this.target, 2, true);
            }
            this.game.RoomTwoLeader = this.target;
          } else {
            this.game.RoomThreeLeader = this.target;
          }
        },
      },
    };
  }
};
function cannotBeVoted(player) {
  return player.hasEffect("CannotBeVoted");
}
