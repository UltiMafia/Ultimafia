const Card = require("../../Card");
const { PRIORITY_KILL_SPECIAL } = require("../../const/Priority");

module.exports = class Sacrifice extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Sacrifice: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["Cult"], exclude: ["dead", "self"] },
        action: {
          priority: PRIORITY_KILL_SPECIAL - 4,
          run: function () {
            if (this.dominates()){
             this.target.kill("basic", this.actor);
              if(this.actor.role.data.PlayerToGiveExtraLifeTo){
              this.actor.role.data.PlayerToGiveExtraLifeTo.giveEffect("ExtraLife", this.actor);
              this.actor.role.data.PlayerToGiveExtraLifeTo.queueAlert("You gain an extra life!");
              }
            
            }
            delete this.actor.role.data.PlayerToGiveExtraLifeTo;
          },
        },
      },
      Anoint: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["Cult"], exclude: ["dead", "self"] },
        action: {
          priority: PRIORITY_KILL_SPECIAL -5,
          run: function () {
            this.actor.role.data.PlayerToGiveExtraLifeTo = this.target;
          },
        },
      },
    };
  }
};
