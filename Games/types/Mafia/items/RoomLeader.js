const Random = require("../../../../lib/Random");
const Item = require("../Item");
const { PRIORITY_ROOM_SWAP } = require("../const/Priority");

module.exports = class RoomLeader extends Item {
  constructor(game, room) {
    super("RoomLeader");
    this.room = room;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.targets = room.members;
    this.listeners = {
      meetingsMade: function () {
        this.holder.sendAlert(
          `Choose ${this.game.currentSwapAmt} hostage${
            this.game.currentSwapAmt > 1 ? "s" : ""
          } to swap.`
        );
      },
    };
    this.meetings = {
      Leaders: {
        states: ["Night"],
        flags: ["group", "speech"],
      },
      "Hostage Swap": {
        states: ["Night"],
        flags: ["voting", "multi", "mustAct"],
        targets: { include: ["all"], exclude: ["self"] },
        multiMin: game.currentSwapAmt,
        multiMax: game.currentSwapAmt,
        item: this,
        action: {
          item: this,
          priority: PRIORITY_ROOM_SWAP,
          run: function () {
            //var fromRoom = this.room;
            if (!Array.isArray(this.target)) {
              this.target = [this.target];
            }
            let RoomCount = this.game.Rooms.length;
            let index = this.item.room.number;
            if(index >= RoomCount){
              index = 0;
            }
              for (let player of this.target) {
                this.item.room.members.splice(this.item.room.members.indexOf(player), 1);
                this.game.Rooms[index].members.push(player);
                this.game.events.emit(
                  "RoonSwitch",
                  player,
                  this.actor,
                  this.item.room
                );
              }

            this.actor.dropItem("Leader");
          },
        },
      },
    };
  }
};
