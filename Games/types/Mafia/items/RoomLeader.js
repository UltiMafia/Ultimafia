const Random = require("../../../../lib/Random");
const Item = require("../Item");
const { PRIORITY_SWAP_ROLES } = require("../const/Priority");

module.exports = class RoomLeader extends Item {
  constructor(game, room) {
    super("RoomLeader");
    this.room = room;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    if(this.room == 1){
      this.targets = [isInRoom1];
    }
    else{
      this.targets = [isInRoom2];
    }
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
        targets: { include: this.targets, exclude: ["members"] },
        multiMin: game.currentSwapAmt,
        multiMax: game.currentSwapAmt,
        action: {
          item: this,
          priority: PRIORITY_SWAP_ROLES,
          run: function () {
            //var fromRoom = this.room;
            if (!Array.isArray(this.target)) {
              this.target = [this.target];
            }
           if(this.item.room == 1){
            for (let player of this.target) {
              this.game.RoomOne.splice(this.game.RoomOne.indexOf(player),1);
              this.game.RoomTwo.push(player);
              this.game.events.emit("RoonSwitch",player,this.actor,this.room);
            }
           }
          else if(this.item.room == 2){
            for (let player of this.target) {
              this.game.RoomTwo.splice(this.game.RoomTwo.indexOf(player),1);
              this.game.RoomOne.push(player);
              this.game.events.emit("RoonSwitch",player,this.actor,this.room);
            }
           }

            this.actor.dropItem("Leader");
          },
        },
      },
    };
  }
};
function isInRoom1(player) {
    return player.game.RoomOne.includes(player);
 // return this.room && player == this.role.data.prevTarget;
}
function isInRoom2(player) {
  return player.game.RoomTwo.includes(player);
// return this.room && player == this.role.data.prevTarget;
}