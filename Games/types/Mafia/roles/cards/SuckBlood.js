const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");

module.exports = class SuckBlood extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Suck Blood": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["convert", "kill"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
            if (this.checkVanilla(this.target)) {
              if (this.dominates()) this.target.kill("basic", this.actor);
            } else {
              this.makeVanilla(this.target);
            }
          },
        },
      },
    };
    this.actions = [
      {
        priority: PRIORITY_REDIRECT_ACTION,
        labels: ["convert", "kill"],
        run: function () {
          if (this.game.getStateName() != "Night") return;


          if (this.hasVisitors(this.actor)) {
            this.redirectAllActions(this.actor, Random.randArrayVal(this.getVisitors(), true));
          }
        },
      },
    ];
  }
};
