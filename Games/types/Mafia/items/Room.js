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
  constructor(Room) {
    super("Room");
    this.Room = Room;
    //this.reveal = reveal;
    //this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.meetings[this.Room.name] = {
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
        item: this,
        run: function () {
          let isReelect = false;
          if(this.item.Room.leader == this.target){
            isReelect = true;
          }
          this.item.Room.leader = this.target;
          this.game.events.emit("ElectedRoomLeader", this.target, this.item.Room.number, isReelect);
    
        },
      },
    };
  }
};
function cannotBeVoted(player) {
  return player.hasEffect("CannotBeVoted");
}
