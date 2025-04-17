const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_CONVERT_DEFAULT,
  PRIORITY_KILL_DEFAULT,
} = require("../../const/Priority");

module.exports = class WispConvert extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Convert Player": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Mafia"] },
        action: {
          labels: ["convert", "seppuku"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
            let temp = new Action({
              actor: this.actor,
              target: this.actor,
              game: this.game,
              labels: ["kill", "seppuku"],
              run: function () {
                if (this.dominates()) this.target.kill("basic", this.actor);
              },
            });
            if (temp.dominates(this.actor)) {
              this.actor.kill("basic", this.actor);
            } else {
              return;
            }

            if (this.dominates()) {
              this.target.setRole("Wisp");
            }
          },
        },
      },
    };
  }
};
