const Card = require("../../Card");
const { PRIORITY_FOLLOWER } = require("../../const/Priority");

module.exports = class GiveCondemnImmunity extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Condemn Immunity": {
        states: ["Night"],
        flags: ["voting"],
        whileDead: true,
        shouldMeet: function (){
          return this.player.alive || (!this.player.alive && this.player.hasItem("DeadAbilityUser"));
        },
        targets: { include: ["alive"], exclude: [isPrevTarget] },
        action: {
          priority: PRIORITY_FOLLOWER,
          run: function () {
            if (this.isInsane()) return;

            this.target.giveEffect("CondemnImmune", this.actor);
          },
        },
      },
    };
  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.prevTarget;
}
