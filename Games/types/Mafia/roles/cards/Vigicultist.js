const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Vigicultist extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Kill: {
        actionName: "Kill Unbelievers",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Cult"] },
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT + 1,
          run: function () {
            /*
            let savers = this.getVisitors(this.target, "save");
            if (savers.length == 0) {
              this.target.kill("basic", this.actor);
            }
            */
            if (this.dominates()) this.target.kill("basic", this.actor);
            if (this.target.alive) {
              let action = new Action({
                actor: this.actor,
                target: this.target,
                game: this.game,
                labels: ["convert", "hidden"],
                run: function () {
                  if (this.dominates()) this.target.setRole("Cultist");
                },
              });
              action.do();
            }
            /*
            if (savers.length > 0) {
              this.target.setRole("Cultist", this.actor);
            }
            */
          },
        },
      },
    };
  }
};
