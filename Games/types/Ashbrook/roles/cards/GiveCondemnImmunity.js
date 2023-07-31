const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

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
        //targets: {exclude: [this.data.previousTarget]},
        action: {
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.isInsane()) return;

            this.target.giveEffect("CondemnImmune", this.actor);
            //this.actor.role.data.previousTarget = this.target;
          },
        },
      },
    };
  }
};
