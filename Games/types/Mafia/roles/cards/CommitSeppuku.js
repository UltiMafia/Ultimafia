const Card = require("../../Card");
const {
  PRIORITY_CONVERT_DEFAULT,
  PRIORITY_KILL_DEFAULT,
} = require("../../const/Priority");

module.exports = class CommitSeppuku extends Card {
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
          power: 2,
          run: function () {
            if (this.dominates()) this.target.setRole("Mafioso");
            this.actor.role.hasSeppukuTonight = true;
          },
        },
      },
    };

    this.listeners = {
      state: function () {
        this.hasSeppukuTonight = false;
      },
    };

    this.actions = [
      {
        labels: ["kill", "seppuku"],
        priority: PRIORITY_KILL_DEFAULT,
        run: function () {
          if (!this.actor.role.hasSeppukuTonight) {
            return;
          }

          if (this.dominates(this.actor)) {
            this.actor.kill("basic", this.actor);
          }
        },
      },
    ];
  }
};
