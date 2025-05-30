const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_SUPPORT_VISIT_DEFAULT } = require("../../const/Priority");

module.exports = class KillAndDeliriumSurvivors extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Kill and Delirate": {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          labels: ["kill"],
          priority: PRIORITY_SUPPORT_VISIT_DEFAULT,
          run: function () {

            if (this.dominates() || this.target.hasEffect("Delirious")){
              this.target.kill("basic", this.actor);
            }
            if (this.target.alive) {
              let action = new Action({
                actor: this.actor,
                target: this.target,
                game: this.game,
                labels: ["block", "delirium"],
                run: function () {
                  if (this.dominates()){
                     this.target.giveEffect("Delirious", this.actor, Infinity);
                    this.blockWithDelirium(this.target);
                  }
                },
              });
              action.do();
            }
          },
        },
      },
    };
  }
};
