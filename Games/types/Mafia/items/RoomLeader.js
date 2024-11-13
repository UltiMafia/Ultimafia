const Random = require("../../../../lib/Random");
const Item = require("../Item");
const { PRIORITY_SWAP_ROLES } = require("../const/Priority");

module.exports = class RoomLeader extends Item {
  constructor(game, room) {
    super("RoomLeader");
    this.room = room;
    this.lifespan = 1;
    this.cannotBeStolen = true;
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
        targets: { include: hostageIds, exclude: ["members"] },
        multiMin: game.currentSwapAmt,
        multiMax: game.currentSwapAmt,
        action: {
          priority: PRIORITY_SWAP_ROLES,
          run: function () {
            var fromRoom = this.room;
           if(this.room = 1){
            for (let player of this.target) {
              this.game.RoomOne.splice(this.game.RoomOne.indexOf(player),1);
              this.game.RoomOne.push(player);
              this.events.emit("RoonSwitch",player,this.actor,this.room);
            }
           }
          if(this.room = 2){
            for (let player of this.target) {
              this.game.RoomTwo.splice(this.game.RoomTwo.indexOf(player),1);
              this.game.RoomTwo.push(player);
              this.events.emit("RoonSwitch",player,this.actor,this.room);
            }
           }

            this.actor.dropItem("Leader");
          },
        },
      },
    };
  }
};
