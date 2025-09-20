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
      passiveDead: !this.Room.game.isVotingDead(),
      speakDead: this.Room.game.isTalkingDead(),
      action: {
        labels: ["hidden"],
        priority: PRIORITY_ROOM_SWAP,
        item: this,
        run: function () {
          let hasChanged = false;
          if (this.item.Room.leader == null) {
            hasChanged = false;
          } else if (this.item.Room.leader != this.target) {
            hasChanged = true;
          }
          this.item.Room.leader = this.target;
          this.game.events.emit(
            "ElectedRoomLeader",
            this.target,
            this.item.Room,
            hasChanged
          );
        },
      },
    };

    this.listeners = {
      death: function () {
        if (
          this.game.alivePlayers().filter((p) => p.hasEffect("AssassinEffect"))
            .length > 0
        ) {
          return;
        }
        for (let player of this.game.players) {
          for (let item of player.items) {
            if (item.name == "NoVillageMeeting") {
              item.drop();
            }
          }
        }
        this.drop();
      },
      roleAssigned: function (player) {
        if (
          this.game.alivePlayers().filter((p) => p.hasEffect("AssassinEffect"))
            .length > 0
        ) {
          return;
        }
        for (let player of this.game.players) {
          for (let item of player.items) {
            if (item.name == "NoVillageMeeting") {
              item.drop();
            }
          }
        }
        this.drop();
      },
    };
  }
};
function cannotBeVoted(player) {
  return player.hasEffect("CannotBeVoted");
}
